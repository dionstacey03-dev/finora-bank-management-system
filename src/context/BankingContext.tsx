import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  authAdapter,
  AuthCredentialsInput,
  AuthRegistrationInput,
} from '../services/authAdapter';
import {
  bankingService,
  loadDemoLedger,
  OperationResult,
  resetDemoLedger,
} from '../services/bankingService';
import { formatCurrency } from '../utils/currency';
import {
  AccountType,
  AppRoute,
  AuthSession,
  BankAccount,
  BankingLedgerState,
  NotificationItem,
  PushAlertItem,
  Transaction,
  UserProfile,
  UserRole,
} from '../types/banking';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'finora_theme_mode_v1';

const loadInitialTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Ignore storage read restrictions
  }
  return 'dark';
};

interface FeedbackBanner {
  id: number;
  type: 'success' | 'error';
  text: string;
}

interface BankingContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  ledger: BankingLedgerState;
  session: AuthSession | null;
  currentUser: UserProfile | null;
  currentRoute: AppRoute;
  isLoadingView: boolean;
  banner: FeedbackBanner | null;
  dismissBanner: () => void;
  pushAlerts: PushAlertItem[];
  dismissPushAlert: (id: string) => void;
  triggerTestTransactionAlert: (customThreshold?: number) => void;
  navigate: (route: AppRoute) => void;
  triggerSimulatedRefresh: () => void;
  signInWithCredentials: (input: AuthCredentialsInput) => Promise<{ ok: boolean; error?: string }>;
  quickSignIn: (userId: string) => void;
  registerCustomerAndSignIn: (
    input: AuthRegistrationInput,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  userAccounts: BankAccount[];
  userTransactions: Transaction[];
  userNotifications: NotificationItem[];
  unreadNotificationCount: number;
  depositOrWithdraw: (params: {
    accountId: string;
    mode: 'deposit' | 'withdrawal';
    amount: number;
    channel: string;
    counterparty: string;
    memo: string;
    tags?: string[];
  }) => Promise<OperationResult<Transaction>>;
  transferFunds: (params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    memo: string;
    tags?: string[];
  }) => Promise<OperationResult<{ debitTx: Transaction; creditTx: Transaction }>>;
  createAccount: (params: {
    accountName: string;
    accountType: AccountType;
    initialDeposit: number;
    dailyLimit: number;
  }) => OperationResult<BankAccount>;
  toggleFreezeAccount: (accountId: string) => OperationResult<BankAccount>;
  updateDailyLimit: (accountId: string, newLimit: number) => OperationResult<BankAccount>;
  reviewTransaction: (
    transactionId: string,
    decision: 'approve' | 'flag' | 'reverse',
  ) => OperationResult<Transaction>;
  updateTransactionTags: (transactionId: string, tags: string[]) => OperationResult<Transaction>;
  toggleCustomerStatus: (customerId: string) => OperationResult<UserProfile>;
  onboardCustomerAsAdmin: (params: {
    fullName: string;
    email: string;
    phone: string;
    initialDeposit: number;
  }) => OperationResult<UserProfile>;
  updateProfile: (
    updates: Partial<
      Pick<
        UserProfile,
        | 'fullName'
        | 'email'
        | 'phone'
        | 'title'
        | 'twoFactorEnabled'
        | 'loginAlertsEnabled'
        | 'biometricAuthEnabled'
        | 'transactionAlertsEnabled'
        | 'transactionAlertThreshold'
        | 'preferredCurrency'
      >
    >,
  ) => OperationResult<UserProfile>;
  biometricSessionVerified: boolean;
  biometricPrompt: { open: boolean; reason: string };
  requireBiometricVerification: (reason: string, onVerified: () => void, forcePrompt?: boolean) => void;
  resolveBiometricPrompt: () => void;
  cancelBiometricPrompt: () => void;
  lockBiometricSession: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  resetSandbox: () => void;
}

const BankingContext = createContext<BankingContextValue | undefined>(undefined);

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => loadInitialTheme());
  const [ledger, setLedger] = useState<BankingLedgerState>(() => loadDemoLedger());
  // AuthSession stays strictly in memory — never persisted to localStorage
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [banner, setBanner] = useState<FeedbackBanner | null>(null);
  const [pushAlerts, setPushAlerts] = useState<PushAlertItem[]>([]);
  const pushAlertTimersRef = useRef<Record<string, number>>({});
  const [biometricSessionVerified, setBiometricSessionVerified] = useState(false);
  const [biometricPrompt, setBiometricPrompt] = useState<{
    open: boolean;
    reason: string;
    onVerified?: () => void;
  }>({ open: false, reason: '' });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota issues
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      Object.values(pushAlertTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      pushAlertTimersRef.current = {};
    };
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const showBanner = useCallback((type: 'success' | 'error', text: string) => {
    setBanner({ id: Date.now(), type, text });
  }, []);

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const dismissPushAlert = useCallback((id: string) => {
    const timerId = pushAlertTimersRef.current[id];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete pushAlertTimersRef.current[id];
    }
    setPushAlerts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAllPushAlerts = useCallback(() => {
    Object.values(pushAlertTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
    pushAlertTimersRef.current = {};
    setPushAlerts([]);
  }, []);

  const enqueuePushAlert = useCallback(
    (payload: Omit<PushAlertItem, 'id'>) => {
      const id = `push_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const item: PushAlertItem = { id, ...payload };
      setPushAlerts((prev) => [item, ...prev].slice(0, 3));

      const timerId = window.setTimeout(() => {
        delete pushAlertTimersRef.current[id];
        setPushAlerts((prev) => prev.filter((p) => p.id !== id));
      }, 8500);
      pushAlertTimersRef.current[id] = timerId;

      // Best-effort native Web Notification only when already granted
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`FINORA · ${payload.title}`, {
            body: payload.message,
          });
        }
      } catch {
        // Ignore sandbox/iframe Notification API restrictions
      }
    },
    [],
  );

  const currentUser = useMemo(() => {
    if (!session) return null;
    return ledger.users.find((u) => u.id === session.userId) ?? null;
  }, [ledger.users, session]);

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    setBanner(null);
  }, []);

  const triggerSimulatedRefresh = useCallback(() => {
    setIsLoadingView(true);
    setTimeout(() => {
      setIsLoadingView(false);
    }, 450);
  }, []);

  const signInWithCredentials = useCallback(
    async (input: AuthCredentialsInput) => {
      const result = await authAdapter.signInDemo(input, ledger.users);
      if (!result.success || !result.session) {
        return { ok: false, error: result.error ?? 'Authentication failed.' };
      }
      setSession(result.session);
      setCurrentRoute(
        result.session.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard',
      );
      return { ok: true };
    },
    [ledger.users],
  );

  const quickSignIn = useCallback(
    (userId: string) => {
      const user = ledger.users.find((u) => u.id === userId);
      if (!user) return;
      const newSession = authAdapter.createQuickDemoSession(user);
      setSession(newSession);
      setCurrentRoute(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'dashboard');
      showBanner('success', `Signed into educational sandbox as ${user.fullName}.`);
    },
    [ledger.users, showBanner],
  );

  const registerCustomerAndSignIn = useCallback(
    async (input: AuthRegistrationInput) => {
      await new Promise((r) => setTimeout(r, 350));
      if (input.passcode.length < 6) {
        return { ok: false, error: 'Educational passcode must be at least 6 characters.' };
      }
      const res = bankingService.registerSimulatedCustomer(ledger, {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        initialDeposit: 250000,
      });
      if (!res.ok || !res.data) {
        return { ok: false, error: res.error ?? 'Registration failed.' };
      }
      setLedger(res.state);
      const newSession = authAdapter.createQuickDemoSession(res.data);
      setSession(newSession);
      setCurrentRoute('dashboard');
      return { ok: true };
    },
    [ledger],
  );

  const signOut = useCallback(() => {
    clearAllPushAlerts();
    setSession(null);
    setBiometricSessionVerified(false);
    setBiometricPrompt({ open: false, reason: '' });
    setCurrentRoute('dashboard');
    setBanner(null);
  }, [clearAllPushAlerts]);

  const userAccounts = useMemo(() => {
    if (!currentUser) return [];
    return ledger.accounts.filter((a) => a.ownerId === currentUser.id);
  }, [currentUser, ledger.accounts]);

  const userTransactions = useMemo(() => {
    if (!currentUser) return [];
    return ledger.transactions.filter((t) => t.ownerId === currentUser.id);
  }, [currentUser, ledger.transactions]);

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return ledger.notifications.filter((n) => n.userId === currentUser.id);
  }, [currentUser, ledger.notifications]);

  const unreadNotificationCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications],
  );

  const depositOrWithdraw = useCallback(
    async (params: {
      accountId: string;
      mode: 'deposit' | 'withdrawal';
      amount: number;
      channel: string;
      counterparty: string;
      memo: string;
      tags?: string[];
    }) => {
      await new Promise((r) => setTimeout(r, 450));
      if (!currentUser) {
        return { ok: false, error: 'Session expired.', state: ledger };
      }
      const res = bankingService.executeDepositOrWithdrawal(ledger, {
        actor: currentUser,
        ...params,
      });
      if (res.ok) {
        setLedger(res.state);
        showBanner(
          'success',
          `Simulated ${params.mode} of ${formatCurrency(params.amount)} recorded.`,
        );
        if (res.triggeredPushAlert && res.triggeredPushAlert.userId === currentUser.id) {
          enqueuePushAlert({
            title: res.triggeredPushAlert.title,
            message: res.triggeredPushAlert.message,
            txType: res.triggeredPushAlert.txType,
            amount: res.triggeredPushAlert.amount,
            threshold: res.triggeredPushAlert.threshold,
            accountName: res.triggeredPushAlert.accountName,
            referenceCode: res.triggeredPushAlert.referenceCode,
            createdAt: res.triggeredPushAlert.createdAt,
          });
        }
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, enqueuePushAlert, ledger, showBanner],
  );

  const transferFunds = useCallback(
    async (params: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      memo: string;
      tags?: string[];
    }) => {
      await new Promise((r) => setTimeout(r, 450));
      if (!currentUser) {
        return { ok: false, error: 'Session expired.', state: ledger };
      }
      const res = bankingService.executeInternalTransfer(ledger, {
        actor: currentUser,
        ...params,
      });
      if (res.ok) {
        setLedger(res.state);
        showBanner(
          'success',
          `Internal transfer of ${formatCurrency(params.amount)} completed.`,
        );
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const createAccount = useCallback(
    (params: {
      accountName: string;
      accountType: AccountType;
      initialDeposit: number;
      dailyLimit: number;
    }) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.createSimulatedAccount(ledger, {
        actor: currentUser,
        ownerId: currentUser.id,
        ...params,
      });
      if (res.ok) {
        setLedger(res.state);
        showBanner('success', `Simulated account "${params.accountName}" opened.`);
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const toggleFreezeAccount = useCallback(
    (accountId: string) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.toggleAccountFreeze(ledger, currentUser, accountId);
      if (res.ok && res.data) {
        setLedger(res.state);
        showBanner('success', `${res.data.accountName} is now ${res.data.status}.`);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const updateDailyLimit = useCallback(
    (accountId: string, newLimit: number) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.updateAccountDailyLimit(ledger, currentUser, accountId, newLimit);
      if (res.ok) {
        setLedger(res.state);
        showBanner('success', 'Daily transaction limit updated.');
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const reviewTransaction = useCallback(
    (transactionId: string, decision: 'approve' | 'flag' | 'reverse') => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.reviewTransactionAsAdmin(
        ledger,
        currentUser,
        transactionId,
        decision,
      );
      if (res.ok && res.data) {
        setLedger(res.state);
        showBanner('success', `Transaction ${res.data.referenceCode} updated to ${res.data.status}.`);
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const updateTransactionTags = useCallback(
    (transactionId: string, tags: string[]) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.updateTransactionTags(ledger, currentUser, transactionId, tags);
      if (res.ok) {
        setLedger(res.state);
        showBanner('success', 'Transaction tags updated.');
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const toggleCustomerStatus = useCallback(
    (customerId: string) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.toggleCustomerStatusAsAdmin(ledger, currentUser, customerId);
      if (res.ok && res.data) {
        setLedger(res.state);
        showBanner('success', `${res.data.fullName} profile set to ${res.data.status}.`);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const onboardCustomerAsAdmin = useCallback(
    (params: { fullName: string; email: string; phone: string; initialDeposit: number }) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.registerSimulatedCustomer(ledger, {
        ...params,
        actor: currentUser,
      });
      if (res.ok && res.data) {
        setLedger(res.state);
        showBanner('success', `Onboarded simulated customer ${res.data.fullName}.`);
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const updateProfile = useCallback(
    (
      updates: Partial<
        Pick<
          UserProfile,
          | 'fullName'
          | 'email'
          | 'phone'
          | 'title'
          | 'twoFactorEnabled'
          | 'loginAlertsEnabled'
          | 'biometricAuthEnabled'
          | 'transactionAlertsEnabled'
          | 'transactionAlertThreshold'
          | 'preferredCurrency'
        >
      >,
    ) => {
      if (!currentUser) return { ok: false, error: 'Not signed in.', state: ledger };
      const res = bankingService.updateUserProfile(ledger, currentUser.id, updates);
      if (res.ok) {
        setLedger(res.state);
        showBanner('success', 'Profile & security preferences saved.');
      } else if (res.error) {
        showBanner('error', res.error);
      }
      return res;
    },
    [currentUser, ledger, showBanner],
  );

  const triggerTestTransactionAlert = useCallback(
    (customThreshold?: number) => {
      const threshold =
        customThreshold && Number.isFinite(customThreshold) && customThreshold >= 1000
          ? customThreshold
          : currentUser?.transactionAlertThreshold ?? 100000;
      const sampleAmount = Number((threshold + 25000).toFixed(2));
      const accountName = userAccounts[0]?.accountName ?? 'Finora Everyday Checking';
      enqueuePushAlert({
        title: 'High-Value Deposit Alert',
        message: `${formatCurrency(sampleAmount)} simulated deposit into ${accountName} exceeded your ${formatCurrency(threshold)} alert limit.`,
        txType: 'deposit',
        amount: sampleAmount,
        threshold,
        accountName,
        referenceCode: 'FNR-PREVIEW-ALERT',
        createdAt: new Date().toISOString(),
        isTest: true,
      });
    },
    [currentUser?.transactionAlertThreshold, enqueuePushAlert, userAccounts],
  );

  const requireBiometricVerification = useCallback(
    (reason: string, onVerified: () => void, forcePrompt = false) => {
      if (!forcePrompt && (!currentUser?.biometricAuthEnabled || biometricSessionVerified)) {
        onVerified();
        return;
      }
      setBiometricPrompt({
        open: true,
        reason,
        onVerified,
      });
    },
    [biometricSessionVerified, currentUser?.biometricAuthEnabled],
  );

  const resolveBiometricPrompt = useCallback(() => {
    const callback = biometricPrompt.onVerified;
    setBiometricSessionVerified(true);
    setBiometricPrompt({ open: false, reason: '' });
    if (callback) callback();
  }, [biometricPrompt.onVerified]);

  const cancelBiometricPrompt = useCallback(() => {
    setBiometricPrompt({ open: false, reason: '' });
  }, []);

  const lockBiometricSession = useCallback(() => {
    setBiometricSessionVerified(false);
    showBanner('success', 'Sensitive account details locked.');
  }, [showBanner]);

  const markNotificationRead = useCallback(
    (id: string) => {
      setLedger((prev) => bankingService.markNotificationRead(prev, id));
    },
    [],
  );

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUser) return;
    setLedger((prev) => bankingService.markAllNotificationsRead(prev, currentUser.id));
    showBanner('success', 'All notifications marked as read.');
  }, [currentUser, showBanner]);

  const deleteNotification = useCallback((id: string) => {
    setLedger((prev) => bankingService.deleteNotification(prev, id));
  }, []);

  const resetSandbox = useCallback(() => {
    clearAllPushAlerts();
    const fresh = resetDemoLedger();
    setLedger(fresh);
    if (session) {
      const stillExists = fresh.users.find((u) => u.id === session.userId);
      if (!stillExists) {
        const fallback = fresh.users[0];
        setSession(authAdapter.createQuickDemoSession(fallback));
        setCurrentRoute('dashboard');
      }
    }
    showBanner('success', 'Educational sandbox ledger reset to initial seed state.');
  }, [clearAllPushAlerts, session, showBanner]);

  const value: BankingContextValue = {
    theme,
    setTheme,
    toggleTheme,
    ledger,
    session,
    currentUser,
    currentRoute,
    isLoadingView,
    banner,
    dismissBanner,
    pushAlerts,
    dismissPushAlert,
    triggerTestTransactionAlert,
    navigate,
    triggerSimulatedRefresh,
    signInWithCredentials,
    quickSignIn,
    registerCustomerAndSignIn,
    signOut,
    userAccounts,
    userTransactions,
    userNotifications,
    unreadNotificationCount,
    depositOrWithdraw,
    transferFunds,
    createAccount,
    toggleFreezeAccount,
    updateDailyLimit,
    reviewTransaction,
    updateTransactionTags,
    toggleCustomerStatus,
    onboardCustomerAsAdmin,
    updateProfile,
    biometricSessionVerified,
    biometricPrompt: { open: biometricPrompt.open, reason: biometricPrompt.reason },
    requireBiometricVerification,
    resolveBiometricPrompt,
    cancelBiometricPrompt,
    lockBiometricSession,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    resetSandbox,
  };

  return <BankingContext.Provider value={value}>{children}</BankingContext.Provider>;
};

export const useBanking = (): BankingContextValue => {
  const ctx = useContext(BankingContext);
  if (!ctx) throw new Error('useBanking must be used within a BankingProvider');
  return ctx;
};
