import { createInitialSeedState } from '../data/seedData';
import {
  AccountStatus,
  AccountType,
  AuditEvent,
  BankAccount,
  BankingLedgerState,
  NotificationCategory,
  NotificationItem,
  Transaction,
  TransactionStatus,
  TransactionType,
  UserProfile,
  UserRole,
} from '../types/banking';

import { formatCurrency } from '../utils/currency';
import { normalizeTransactionTags } from '../utils/tags';

export { formatCurrency };

const LEDGER_STORAGE_KEY = 'finora_educational_ledger_lkr_v1';

const generateId = (prefix: string): string => {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
};

const generateRefCode = (): string => {
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `FNR-${yymmdd}-${digits}`;
};

export const generateSimulatedAccountNumber = (): string => {
  const seg = () => String(Math.floor(1000 + Math.random() * 9000));
  return `FN-${seg()}-${seg()}-${seg()}`;
};

export const maskAccountNumber = (accountNumber: string): string => {
  const parts = accountNumber.split('-');
  if (parts.length < 4) return accountNumber;
  return `${parts[0]}-••••-••••-${parts[3]}`;
};

export const loadDemoLedger = (): BankingLedgerState => {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) {
      const seeded = createInitialSeedState();
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as BankingLedgerState;
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.accounts)) {
      const seeded = createInitialSeedState();
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    if (Array.isArray(parsed.users)) {
      const seedUserMap = new Map(createInitialSeedState().users.map((u) => [u.id, u]));
      parsed.users = parsed.users.map((user) => {
        const seedMatch = seedUserMap.get(user.id);
        return {
          ...user,
          transactionAlertsEnabled:
            user.transactionAlertsEnabled ?? seedMatch?.transactionAlertsEnabled ?? true,
          transactionAlertThreshold:
            user.transactionAlertThreshold ?? seedMatch?.transactionAlertThreshold ?? 100000,
        };
      });
    }
    if (Array.isArray(parsed.transactions)) {
      const seedTagMap = new Map(
        createInitialSeedState().transactions.map((t) => [t.id, t.tags ?? []]),
      );
      parsed.transactions = parsed.transactions.map((tx) =>
        tx.tags === undefined ? { ...tx, tags: seedTagMap.get(tx.id) ?? [] } : tx,
      );
    }
    return parsed;
  } catch {
    return createInitialSeedState();
  }
};

export const saveDemoLedger = (state: BankingLedgerState): void => {
  try {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Gracefully ignore quota errors in private browsing sandboxes
  }
};

export const resetDemoLedger = (): BankingLedgerState => {
  const fresh = createInitialSeedState();
  saveDemoLedger(fresh);
  return fresh;
};

export interface TriggeredPushAlertPayload {
  userId: string;
  title: string;
  message: string;
  txType: 'deposit' | 'withdrawal';
  amount: number;
  threshold: number;
  accountName: string;
  referenceCode: string;
  createdAt: string;
}

export interface OperationResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
  state: BankingLedgerState;
  triggeredPushAlert?: TriggeredPushAlertPayload;
}

export const bankingService = {
  executeDepositOrWithdrawal(
    state: BankingLedgerState,
    params: {
      actor: UserProfile;
      accountId: string;
      mode: 'deposit' | 'withdrawal';
      amount: number;
      channel: string;
      counterparty: string;
      memo: string;
      tags?: string[];
    },
  ): OperationResult<Transaction> {
    const { actor, accountId, mode, amount, channel, counterparty, memo, tags } = params;
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: `Amount must be greater than ${formatCurrency(0)}.`, state };
    }
    if (amount > 50000000) {
      return {
        ok: false,
        error: `Single simulated transaction limit is ${formatCurrency(50000000)} in educational mode.`,
        state,
      };
    }

    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) {
      return { ok: false, error: 'Selected account was not found.', state };
    }
    if (account.status === AccountStatus.FROZEN) {
      return {
        ok: false,
        error: 'This account is currently frozen. Unfreeze it before processing transactions.',
        state,
      };
    }
    if (actor.status === 'Restricted') {
      return {
        ok: false,
        error: 'Your customer profile is currently restricted pending compliance review.',
        state,
      };
    }

    if (mode === 'withdrawal') {
      if (amount > account.balance) {
        return {
          ok: false,
          error: `Insufficient funds. Available balance is ${formatCurrency(account.balance)}.`,
          state,
        };
      }
      if (amount > account.dailyLimit) {
        return {
          ok: false,
          error: `Withdrawal exceeds account daily limit of ${formatCurrency(account.dailyLimit)}.`,
          state,
        };
      }
    }

    const newBalance =
      mode === 'deposit'
        ? Number((account.balance + amount).toFixed(2))
        : Number((account.balance - amount).toFixed(2));

    const isHighValue = amount >= 2500000;
    const status = isHighValue ? TransactionStatus.PENDING : TransactionStatus.COMPLETED;

    const tx: Transaction = {
      id: generateId('tx'),
      referenceCode: generateRefCode(),
      accountId: account.id,
      ownerId: account.ownerId,
      type: mode === 'deposit' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
      category: mode === 'deposit' ? 'Simulated Funding' : 'Simulated Disbursement',
      merchantOrCounterparty: counterparty.trim() || (mode === 'deposit' ? 'External Funding Sandbox' : 'External Payout Sandbox'),
      memo: memo.trim() || (mode === 'deposit' ? 'Simulated account deposit' : 'Simulated account withdrawal'),
      amount: Number(amount.toFixed(2)),
      balanceAfter: newBalance,
      status,
      createdAt: new Date().toISOString(),
      simulatedChannel: channel,
      tags: normalizeTransactionTags(tags),
    };

    const targetOwner = state.users.find((u) => u.id === account.ownerId) ?? actor;
    const alertsEnabled = targetOwner.transactionAlertsEnabled ?? true;
    const alertThreshold = targetOwner.transactionAlertThreshold ?? 100000;
    const exceededAlertThreshold = alertsEnabled && tx.amount > alertThreshold;

    const notificationTitle = exceededAlertThreshold
      ? mode === 'deposit'
        ? 'High-Value Deposit Alert'
        : 'High-Value Withdrawal Alert'
      : mode === 'deposit'
        ? 'Simulated Deposit Recorded'
        : 'Simulated Withdrawal Recorded';

    const notificationMessage = exceededAlertThreshold
      ? `${formatCurrency(tx.amount)} ${mode === 'deposit' ? 'deposited into' : 'withdrawn from'} ${account.accountName} (${tx.referenceCode}), exceeding your ${formatCurrency(alertThreshold)} alert limit.`
      : `${formatCurrency(tx.amount)} ${mode === 'deposit' ? 'credited to' : 'debited from'} ${account.accountName} (${tx.referenceCode}).`;

    const notification: NotificationItem = {
      id: generateId('ntf'),
      userId: targetOwner.id,
      category: NotificationCategory.TRANSACTION,
      title: notificationTitle,
      message: notificationMessage,
      createdAt: tx.createdAt,
      read: false,
    };

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: tx.createdAt,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: mode === 'deposit' ? 'SIMULATED_DEPOSIT' : 'SIMULATED_WITHDRAWAL',
      targetEntity: `${account.accountNumber} (${tx.referenceCode})`,
      outcome: isHighValue ? 'Flagged' : 'Success',
      details: `${mode === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatCurrency(amount)} via ${channel}.`,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: state.accounts.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a)),
      transactions: [tx, ...state.transactions],
      notifications: [notification, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return {
      ok: true,
      data: tx,
      state: nextState,
      triggeredPushAlert: exceededAlertThreshold
        ? {
            userId: targetOwner.id,
            title: notificationTitle,
            message: notificationMessage,
            txType: mode,
            amount: tx.amount,
            threshold: alertThreshold,
            accountName: account.accountName,
            referenceCode: tx.referenceCode,
            createdAt: tx.createdAt,
          }
        : undefined,
    };
  },

  executeInternalTransfer(
    state: BankingLedgerState,
    params: {
      actor: UserProfile;
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      memo: string;
      tags?: string[];
    },
  ): OperationResult<{ debitTx: Transaction; creditTx: Transaction }> {
    const { actor, fromAccountId, toAccountId, amount, memo, tags } = params;
    const normalizedTags = normalizeTransactionTags(tags);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: `Transfer amount must be greater than ${formatCurrency(0)}.`, state };
    }
    if (fromAccountId === toAccountId) {
      return { ok: false, error: 'Source and destination accounts must be different.', state };
    }

    const fromAcc = state.accounts.find((a) => a.id === fromAccountId);
    const toAcc = state.accounts.find((a) => a.id === toAccountId);

    if (!fromAcc || !toAcc) {
      return { ok: false, error: 'One or both selected accounts could not be found.', state };
    }
    if (fromAcc.status === AccountStatus.FROZEN || toAcc.status === AccountStatus.FROZEN) {
      return { ok: false, error: 'Transfers are blocked while either account is frozen.', state };
    }
    if (actor.status === 'Restricted') {
      return { ok: false, error: 'Your customer profile is currently restricted.', state };
    }
    if (amount > fromAcc.balance) {
      return {
        ok: false,
        error: `Insufficient funds in ${fromAcc.accountName}. Available: ${formatCurrency(fromAcc.balance)}.`,
        state,
      };
    }
    if (amount > fromAcc.dailyLimit) {
      return {
        ok: false,
        error: `Transfer exceeds daily limit of ${formatCurrency(fromAcc.dailyLimit)}.`,
        state,
      };
    }

    const now = new Date().toISOString();
    const baseRef = generateRefCode();
    const newFromBal = Number((fromAcc.balance - amount).toFixed(2));
    const newToBal = Number((toAcc.balance + amount).toFixed(2));
    const toOwner = state.users.find((u) => u.id === toAcc.ownerId);
    const fromOwner = state.users.find((u) => u.id === fromAcc.ownerId);

    const debitTx: Transaction = {
      id: generateId('tx'),
      referenceCode: `${baseRef}-A`,
      accountId: fromAcc.id,
      ownerId: fromAcc.ownerId,
      type: TransactionType.TRANSFER_OUT,
      category: 'Internal Transfer',
      merchantOrCounterparty:
        fromAcc.ownerId === toAcc.ownerId
          ? toAcc.accountName
          : `${toOwner?.fullName ?? 'Finora Member'} · ${toAcc.accountName}`,
      counterpartyAccountNumber: toAcc.accountNumber,
      memo: memo.trim() || 'Finora simulated internal transfer',
      amount: Number(amount.toFixed(2)),
      balanceAfter: newFromBal,
      status: TransactionStatus.COMPLETED,
      createdAt: now,
      simulatedChannel: 'Finora Internal Rail',
      tags: normalizedTags,
    };

    const creditTx: Transaction = {
      id: generateId('tx'),
      referenceCode: `${baseRef}-B`,
      accountId: toAcc.id,
      ownerId: toAcc.ownerId,
      type: TransactionType.TRANSFER_IN,
      category: 'Internal Transfer',
      merchantOrCounterparty:
        fromAcc.ownerId === toAcc.ownerId
          ? fromAcc.accountName
          : `${fromOwner?.fullName ?? 'Finora Member'} · ${fromAcc.accountName}`,
      counterpartyAccountNumber: fromAcc.accountNumber,
      memo: memo.trim() || 'Finora simulated internal transfer',
      amount: Number(amount.toFixed(2)),
      balanceAfter: newToBal,
      status: TransactionStatus.COMPLETED,
      createdAt: now,
      simulatedChannel: 'Finora Internal Rail',
      tags: normalizedTags,
    };

    const notifications: NotificationItem[] = [
      {
        id: generateId('ntf'),
        userId: fromAcc.ownerId,
        category: NotificationCategory.TRANSACTION,
        title: 'Internal Transfer Sent',
        message: `Sent ${formatCurrency(amount)} from ${fromAcc.accountName} to ${debitTx.merchantOrCounterparty}.`,
        createdAt: now,
        read: false,
      },
    ];

    if (toAcc.ownerId !== fromAcc.ownerId) {
      notifications.push({
        id: generateId('ntf'),
        userId: toAcc.ownerId,
        category: NotificationCategory.TRANSACTION,
        title: 'Internal Transfer Received',
        message: `Received ${formatCurrency(amount)} into ${toAcc.accountName} from ${fromOwner?.fullName ?? 'Finora Member'}.`,
        createdAt: now,
        read: false,
      });
    }

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'INTERNAL_BOOK_TRANSFER',
      targetEntity: `${fromAcc.accountNumber} -> ${toAcc.accountNumber}`,
      outcome: 'Success',
      details: `Transferred ${formatCurrency(amount)} (${baseRef}).`,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: state.accounts.map((a) => {
        if (a.id === fromAcc.id) return { ...a, balance: newFromBal };
        if (a.id === toAcc.id) return { ...a, balance: newToBal };
        return a;
      }),
      transactions: [debitTx, creditTx, ...state.transactions],
      notifications: [...notifications, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return { ok: true, data: { debitTx, creditTx }, state: nextState };
  },

  createSimulatedAccount(
    state: BankingLedgerState,
    params: {
      actor: UserProfile;
      ownerId: string;
      accountName: string;
      accountType: AccountType;
      initialDeposit: number;
      dailyLimit: number;
    },
  ): OperationResult<BankAccount> {
    const { actor, ownerId, accountName, accountType, initialDeposit, dailyLimit } = params;
    if (!accountName.trim() || accountName.trim().length < 3) {
      return { ok: false, error: 'Account nickname must be at least 3 characters.', state };
    }
    if (!Number.isFinite(initialDeposit) || initialDeposit < 0) {
      return { ok: false, error: 'Initial simulated deposit cannot be negative.', state };
    }
    if (!Number.isFinite(dailyLimit) || dailyLimit < 25000) {
      return { ok: false, error: `Daily limit must be at least ${formatCurrency(25000)}.`, state };
    }

    const now = new Date().toISOString();
    const apyByType =
      accountType === AccountType.VAULT ? 8.5 : accountType === AccountType.SAVINGS ? 7.25 : 0.45;

    const newAccount: BankAccount = {
      id: generateId('acc'),
      ownerId,
      accountName: accountName.trim(),
      accountType,
      accountNumber: generateSimulatedAccountNumber(),
      routingNumber: '701000021',
      balance: Number(initialDeposit.toFixed(2)),
      apy: apyByType,
      dailyLimit: Number(dailyLimit.toFixed(2)),
      status: AccountStatus.ACTIVE,
      openedAt: now,
    };

    const newTransactions = [...state.transactions];
    if (initialDeposit > 0) {
      newTransactions.unshift({
        id: generateId('tx'),
        referenceCode: generateRefCode(),
        accountId: newAccount.id,
        ownerId,
        type: TransactionType.DEPOSIT,
        category: 'Account Opening',
        merchantOrCounterparty: 'Finora Opening Funding Sandbox',
        memo: `Initial simulated funding for ${newAccount.accountName}`,
        amount: Number(initialDeposit.toFixed(2)),
        balanceAfter: newAccount.balance,
        status: TransactionStatus.COMPLETED,
        createdAt: now,
        simulatedChannel: 'Simulated Opening Credit',
      });
    }

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'ACCOUNT_OPENED',
      targetEntity: newAccount.accountNumber,
      outcome: 'Success',
      details: `Opened simulated ${accountType} account "${newAccount.accountName}" with ${formatCurrency(initialDeposit)}.`,
    };

    const notification: NotificationItem = {
      id: generateId('ntf'),
      userId: ownerId,
      category: NotificationCategory.SYSTEM,
      title: 'New Simulated Account Ready',
      message: `${newAccount.accountName} (${maskAccountNumber(newAccount.accountNumber)}) is now active.`,
      createdAt: now,
      read: false,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: [...state.accounts, newAccount],
      transactions: newTransactions,
      notifications: [notification, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return { ok: true, data: newAccount, state: nextState };
  },

  toggleAccountFreeze(
    state: BankingLedgerState,
    actor: UserProfile,
    accountId: string,
  ): OperationResult<BankAccount> {
    const target = state.accounts.find((a) => a.id === accountId);
    if (!target) {
      return { ok: false, error: 'Account not found.', state };
    }
    const nextStatus =
      target.status === AccountStatus.ACTIVE ? AccountStatus.FROZEN : AccountStatus.ACTIVE;
    const now = new Date().toISOString();

    const updated = { ...target, status: nextStatus };
    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: nextStatus === AccountStatus.FROZEN ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN',
      targetEntity: target.accountNumber,
      outcome: 'Success',
      details: `${nextStatus === AccountStatus.FROZEN ? 'Froze' : 'Reactivated'} ${target.accountName}.`,
    };

    const notification: NotificationItem = {
      id: generateId('ntf'),
      userId: target.ownerId,
      category: NotificationCategory.SECURITY,
      title: `Account ${nextStatus === AccountStatus.FROZEN ? 'Frozen' : 'Reactivated'}`,
      message: `${target.accountName} (${maskAccountNumber(target.accountNumber)}) status changed to ${nextStatus}.`,
      createdAt: now,
      read: false,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: state.accounts.map((a) => (a.id === accountId ? updated : a)),
      notifications: [notification, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return { ok: true, data: updated, state: nextState };
  },

  updateAccountDailyLimit(
    state: BankingLedgerState,
    actor: UserProfile,
    accountId: string,
    newLimit: number,
  ): OperationResult<BankAccount> {
    if (!Number.isFinite(newLimit) || newLimit < 25000 || newLimit > 25000000) {
      return {
        ok: false,
        error: `Daily limit must be between ${formatCurrency(25000)} and ${formatCurrency(25000000)}.`,
        state,
      };
    }
    const target = state.accounts.find((a) => a.id === accountId);
    if (!target) {
      return { ok: false, error: 'Account not found.', state };
    }

    const updated = { ...target, dailyLimit: Number(newLimit.toFixed(2)) };
    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'DAILY_LIMIT_UPDATED',
      targetEntity: target.accountNumber,
      outcome: 'Success',
      details: `Updated daily transaction limit to ${formatCurrency(newLimit)}.`,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: state.accounts.map((a) => (a.id === accountId ? updated : a)),
      auditLog: [audit, ...state.auditLog],
    };
    saveDemoLedger(nextState);
    return { ok: true, data: updated, state: nextState };
  },

  reviewTransactionAsAdmin(
    state: BankingLedgerState,
    admin: UserProfile,
    transactionId: string,
    decision: 'approve' | 'flag' | 'reverse',
  ): OperationResult<Transaction> {
    if (admin.role !== UserRole.ADMIN) {
      return { ok: false, error: 'Administrator privileges required.', state };
    }
    const tx = state.transactions.find((t) => t.id === transactionId);
    if (!tx) {
      return { ok: false, error: 'Transaction record not found.', state };
    }
    const account = state.accounts.find((a) => a.id === tx.accountId);
    if (!account) {
      return { ok: false, error: 'Associated account not found.', state };
    }

    const now = new Date().toISOString();
    let nextStatus = tx.status;
    let updatedBalance = account.balance;

    if (decision === 'approve') {
      nextStatus = TransactionStatus.COMPLETED;
    } else if (decision === 'flag') {
      nextStatus = TransactionStatus.FLAGGED;
    } else if (decision === 'reverse') {
      if (tx.status === TransactionStatus.REVERSED) {
        return { ok: false, error: 'Transaction has already been reversed.', state };
      }
      nextStatus = TransactionStatus.REVERSED;
      const isCredit =
        tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TRANSFER_IN;
      updatedBalance = isCredit
        ? Number(Math.max(0, account.balance - tx.amount).toFixed(2))
        : Number((account.balance + tx.amount).toFixed(2));
    }

    const updatedTx: Transaction = { ...tx, status: nextStatus };

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: admin.id,
      actorName: admin.fullName,
      actorRole: UserRole.ADMIN,
      action:
        decision === 'approve'
          ? 'ADMIN_TX_APPROVED'
          : decision === 'flag'
            ? 'ADMIN_TX_FLAGGED'
            : 'ADMIN_TX_REVERSED',
      targetEntity: tx.referenceCode,
      outcome: decision === 'flag' ? 'Flagged' : 'Success',
      details: `Compliance officer ${decision}d ${formatCurrency(tx.amount)} (${tx.merchantOrCounterparty}).`,
    };

    const notification: NotificationItem = {
      id: generateId('ntf'),
      userId: tx.ownerId,
      category: NotificationCategory.SECURITY,
      title: `Compliance Update: ${tx.referenceCode}`,
      message: `Transaction of ${formatCurrency(tx.amount)} was marked ${nextStatus} by Operations Review.`,
      createdAt: now,
      read: false,
    };

    const nextState: BankingLedgerState = {
      ...state,
      accounts: state.accounts.map((a) =>
        a.id === account.id ? { ...a, balance: updatedBalance } : a,
      ),
      transactions: state.transactions.map((t) => (t.id === tx.id ? updatedTx : t)),
      notifications: [notification, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return { ok: true, data: updatedTx, state: nextState };
  },

  toggleCustomerStatusAsAdmin(
    state: BankingLedgerState,
    admin: UserProfile,
    customerId: string,
  ): OperationResult<UserProfile> {
    if (admin.role !== UserRole.ADMIN) {
      return { ok: false, error: 'Administrator privileges required.', state };
    }
    const target = state.users.find((u) => u.id === customerId && u.role === UserRole.CUSTOMER);
    if (!target) {
      return { ok: false, error: 'Customer profile not found.', state };
    }
    const nextStatus: 'Active' | 'Restricted' =
      target.status === 'Active' ? 'Restricted' : 'Active';
    const updatedUser: UserProfile = {
      ...target,
      status: nextStatus,
      kycVerified: nextStatus === 'Active' ? true : target.kycVerified,
    };

    const now = new Date().toISOString();
    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: admin.id,
      actorName: admin.fullName,
      actorRole: UserRole.ADMIN,
      action:
        nextStatus === 'Restricted' ? 'CUSTOMER_RESTRICTED' : 'CUSTOMER_ACTIVATED',
      targetEntity: target.email,
      outcome: 'Success',
      details: `Changed customer status for ${target.fullName} to ${nextStatus}.`,
    };

    const nextState: BankingLedgerState = {
      ...state,
      users: state.users.map((u) => (u.id === customerId ? updatedUser : u)),
      auditLog: [audit, ...state.auditLog],
    };
    saveDemoLedger(nextState);
    return { ok: true, data: updatedUser, state: nextState };
  },

  registerSimulatedCustomer(
    state: BankingLedgerState,
    params: {
      fullName: string;
      email: string;
      phone: string;
      initialDeposit?: number;
      actor?: UserProfile;
    },
  ): OperationResult<UserProfile> {
    const emailClean = params.email.trim().toLowerCase();
    if (!params.fullName.trim() || params.fullName.trim().length < 2) {
      return { ok: false, error: 'Full name is required.', state };
    }
    if (!emailClean || !emailClean.includes('@')) {
      return { ok: false, error: 'Please provide a valid email address.', state };
    }
    if (state.users.some((u) => u.email.toLowerCase() === emailClean)) {
      return { ok: false, error: 'An account with this email already exists in the sandbox.', state };
    }

    const now = new Date().toISOString();
    const userId = generateId('usr');
    const deposit =
      Number.isFinite(params.initialDeposit) && (params.initialDeposit ?? 0) >= 0
        ? Number((params.initialDeposit ?? 250000).toFixed(2))
        : 250000;

    const newUser: UserProfile = {
      id: userId,
      role: UserRole.CUSTOMER,
      fullName: params.fullName.trim(),
      email: emailClean,
      phone: params.phone.trim() || '+94 77 555 0199',
      title: 'Finora Member',
      status: 'Active',
      kycVerified: true,
      joinedAt: now,
      twoFactorEnabled: false,
      loginAlertsEnabled: true,
      biometricAuthEnabled: false,
      transactionAlertsEnabled: true,
      transactionAlertThreshold: 100000,
      preferredCurrency: 'LKR',
    };

    const starterChecking: BankAccount = {
      id: generateId('acc'),
      ownerId: userId,
      accountName: 'Finora Everyday Checking',
      accountType: AccountType.CHECKING,
      accountNumber: generateSimulatedAccountNumber(),
      routingNumber: '701000021',
      balance: deposit,
      apy: 0.45,
      dailyLimit: 500000,
      status: AccountStatus.ACTIVE,
      openedAt: now,
    };

    const openingTx: Transaction = {
      id: generateId('tx'),
      referenceCode: generateRefCode(),
      accountId: starterChecking.id,
      ownerId: userId,
      type: TransactionType.DEPOSIT,
      category: 'Account Opening',
      merchantOrCounterparty: 'Finora Welcome Sandbox Credit',
      memo: 'Initial simulated educational funding',
      amount: deposit,
      balanceAfter: deposit,
      status: TransactionStatus.COMPLETED,
      createdAt: now,
      simulatedChannel: 'Simulated Opening Credit',
    };

    const welcomeNotif: NotificationItem = {
      id: generateId('ntf'),
      userId,
      category: NotificationCategory.SYSTEM,
      title: 'Welcome to FINORA',
      message: `Your simulated checking account ${maskAccountNumber(starterChecking.accountNumber)} has been provisioned.`,
      createdAt: now,
      read: false,
    };

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: now,
      actorId: params.actor?.id ?? userId,
      actorName: params.actor?.fullName ?? newUser.fullName,
      actorRole: params.actor?.role ?? UserRole.CUSTOMER,
      action: 'CUSTOMER_ONBOARDED',
      targetEntity: newUser.email,
      outcome: 'Success',
      details: `Provisioned simulated customer profile and checking account with ${formatCurrency(deposit)}.`,
    };

    const nextState: BankingLedgerState = {
      ...state,
      users: [...state.users, newUser],
      accounts: [...state.accounts, starterChecking],
      transactions: deposit > 0 ? [openingTx, ...state.transactions] : state.transactions,
      notifications: [welcomeNotif, ...state.notifications],
      auditLog: [audit, ...state.auditLog],
    };

    saveDemoLedger(nextState);
    return { ok: true, data: newUser, state: nextState };
  },

  updateUserProfile(
    state: BankingLedgerState,
    userId: string,
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
  ): OperationResult<UserProfile> {
    const existing = state.users.find((u) => u.id === userId);
    if (!existing) {
      return { ok: false, error: 'User profile not found.', state };
    }
    if (updates.fullName !== undefined && updates.fullName.trim().length < 2) {
      return { ok: false, error: 'Full name must be at least 2 characters.', state };
    }
    if (updates.email !== undefined && !updates.email.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.', state };
    }
    if (updates.transactionAlertThreshold !== undefined) {
      if (
        !Number.isFinite(updates.transactionAlertThreshold) ||
        updates.transactionAlertThreshold < 1000 ||
        updates.transactionAlertThreshold > 50000000
      ) {
        return {
          ok: false,
          error: `Transaction alert threshold must be between ${formatCurrency(1000)} and ${formatCurrency(50000000)}.`,
          state,
        };
      }
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
      email: updates.email !== undefined ? updates.email.trim().toLowerCase() : existing.email,
      transactionAlertThreshold:
        updates.transactionAlertThreshold !== undefined
          ? Number(updates.transactionAlertThreshold.toFixed(2))
          : existing.transactionAlertThreshold,
    };

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: new Date().toISOString(),
      actorId: existing.id,
      actorName: updated.fullName,
      actorRole: existing.role,
      action: 'PROFILE_PREFERENCES_UPDATED',
      targetEntity: updated.email,
      outcome: 'Success',
      details: 'Updated profile details or security notification settings.',
    };

    const nextState: BankingLedgerState = {
      ...state,
      users: state.users.map((u) => (u.id === userId ? updated : u)),
      auditLog: [audit, ...state.auditLog],
    };
    saveDemoLedger(nextState);
    return { ok: true, data: updated, state: nextState };
  },

  markNotificationRead(state: BankingLedgerState, id: string): BankingLedgerState {
    const nextState = {
      ...state,
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    };
    saveDemoLedger(nextState);
    return nextState;
  },

  markAllNotificationsRead(state: BankingLedgerState, userId: string): BankingLedgerState {
    const nextState = {
      ...state,
      notifications: state.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n,
      ),
    };
    saveDemoLedger(nextState);
    return nextState;
  },

  deleteNotification(state: BankingLedgerState, id: string): BankingLedgerState {
    const nextState = {
      ...state,
      notifications: state.notifications.filter((n) => n.id !== id),
    };
    saveDemoLedger(nextState);
    return nextState;
  },

  updateTransactionTags(
    state: BankingLedgerState,
    actor: UserProfile,
    transactionId: string,
    tags: string[],
  ): OperationResult<Transaction> {
    const target = state.transactions.find((t) => t.id === transactionId);
    if (!target) {
      return { ok: false, error: 'Transaction record not found.', state };
    }
    if (actor.role !== UserRole.ADMIN && target.ownerId !== actor.id) {
      return { ok: false, error: 'You do not have permission to edit tags on this entry.', state };
    }

    const normalized = normalizeTransactionTags(tags);
    const updatedTx: Transaction = {
      ...target,
      tags: normalized,
    };

    const audit: AuditEvent = {
      id: generateId('aud'),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'TRANSACTION_TAGS_UPDATED',
      targetEntity: target.referenceCode,
      outcome: 'Success',
      details:
        normalized.length > 0
          ? `Updated transaction tags to ${normalized.join(', ')}.`
          : 'Cleared custom tags on transaction.',
    };

    const nextState: BankingLedgerState = {
      ...state,
      transactions: state.transactions.map((t) => (t.id === transactionId ? updatedTx : t)),
      auditLog: [audit, ...state.auditLog],
    };
    saveDemoLedger(nextState);
    return { ok: true, data: updatedTx, state: nextState };
  },

  exportTransactionsCSV(transactions: Transaction[], accountLabel: string): void {
    const headers = [
      'Reference Code',
      'Date (UTC)',
      'Type',
      'Counterparty / Merchant',
      'Category',
      'Tags',
      'Channel',
      'Status',
      'Amount (LKR)',
      'Balance After (LKR)',
      'Memo',
    ];
    const escapeCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = transactions.map((t) =>
      [
        t.referenceCode,
        new Date(t.createdAt).toISOString(),
        t.type,
        t.merchantOrCounterparty,
        t.category,
        (t.tags ?? []).join(' '),
        t.simulatedChannel,
        t.status,
        t.amount.toFixed(2),
        t.balanceAfter.toFixed(2),
        t.memo,
      ]
        .map(escapeCell)
        .join(','),
    );

    const disclaimer =
      '"FINORA EDUCATIONAL STATEMENT — SIMULATED DATA ONLY (NOT A REAL BANK STATEMENT)"';
    const csvContent = [disclaimer, headers.map(escapeCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finora-sample-statement-${accountLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportPrintableStatementHTML(params: {
    customer: UserProfile;
    account: BankAccount;
    periodLabel: string;
    openingBalance: number;
    totalCredits: number;
    totalDebits: number;
    closingBalance: number;
    transactions: Transaction[];
  }): void {
    const {
      customer,
      account,
      periodLabel,
      openingBalance,
      totalCredits,
      totalDebits,
      closingBalance,
      transactions,
    } = params;

    const rowsHtml =
      transactions.length === 0
        ? `<tr><td colspan="5" style="padding:20px;text-align:center;color:#64748b;">No simulated transactions recorded during this statement period.</td></tr>`
        : transactions
            .map((t) => {
              const isIn =
                t.type === TransactionType.DEPOSIT || t.type === TransactionType.TRANSFER_IN;
              return `
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${new Date(t.createdAt).toLocaleDateString('en-LK')}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
                    <div style="font-weight:600;color:#0f172a;">${t.merchantOrCounterparty}</div>
                    <div style="font-size:12px;color:#64748b;">${t.referenceCode} · ${t.memo}</div>
                  </td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">${t.type}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;font-weight:600;color:${isIn ? '#059669' : '#0f172a'};">${isIn ? '+' : '-'}${formatCurrency(t.amount)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:monospace;">${formatCurrency(t.balanceAfter)}</td>
                </tr>`;
            })
            .join('');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FINORA Sample Statement — ${periodLabel}</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px;">
  <div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:36px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:20px;margin-bottom:24px;">
      <div>
        <div style="font-size:24px;font-weight:700;letter-spacing:0.06em;color:#060D1A;">FINORA</div>
        <div style="font-size:13px;color:#0284c7;margin-top:2px;">Smart Finance. Secure Future.</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#475569;">
        <div style="font-weight:700;color:#b45309;">SAMPLE EDUCATIONAL STATEMENT</div>
        <div>Simulated Banking Workflow Project — Not Real Currency</div>
        <div style="margin-top:4px;">Statement Period: <strong>${periodLabel}</strong></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;font-size:13px;">
      <div>
        <div style="color:#64748b;margin-bottom:4px;">Account Holder</div>
        <div style="font-weight:600;font-size:15px;">${customer.fullName}</div>
        <div style="color:#475569;">${customer.email}</div>
      </div>
      <div>
        <div style="color:#64748b;margin-bottom:4px;">Account Details</div>
        <div style="font-weight:600;">${account.accountName} (${account.accountType})</div>
        <div style="font-family:monospace;color:#334155;">Account: ${account.accountNumber} · Routing: ${account.routingNumber}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:28px;">
      <div>
        <div style="font-size:11px;color:#64748b;">Opening Balance</div>
        <div style="font-size:16px;font-weight:700;font-family:monospace;">${formatCurrency(openingBalance)}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#64748b;">Total Credits</div>
        <div style="font-size:16px;font-weight:700;font-family:monospace;color:#059669;">+${formatCurrency(totalCredits)}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#64748b;">Total Debits</div>
        <div style="font-size:16px;font-weight:700;font-family:monospace;">-${formatCurrency(totalDebits)}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#64748b;">Closing Balance</div>
        <div style="font-size:16px;font-weight:700;font-family:monospace;">${formatCurrency(closingBalance)}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;text-align:left;color:#475569;">
          <th style="padding:10px 12px;border-bottom:1px solid #cbd5e1;">Date</th>
          <th style="padding:10px 12px;border-bottom:1px solid #cbd5e1;">Description</th>
          <th style="padding:10px 12px;border-bottom:1px solid #cbd5e1;">Type</th>
          <th style="padding:10px 12px;border-bottom:1px solid #cbd5e1;text-align:right;">Amount</th>
          <th style="padding:10px 12px;border-bottom:1px solid #cbd5e1;text-align:right;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between;">
      <span>Generated by FINORA Educational Banking Simulator</span>
      <span>Generated ${new Date().toLocaleString('en-LK')}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finora-sample-statement-${periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
