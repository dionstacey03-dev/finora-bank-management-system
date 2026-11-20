export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export enum AccountType {
  CHECKING = 'Checking',
  SAVINGS = 'High-Yield Savings',
  VAULT = 'Treasury Vault',
}

export enum AccountStatus {
  ACTIVE = 'Active',
  FROZEN = 'Frozen',
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  TRANSFER_IN = 'Transfer In',
  TRANSFER_OUT = 'Transfer Out',
}

export enum TransactionStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  FLAGGED = 'Flagged',
  REVERSED = 'Reversed',
}

export enum NotificationCategory {
  TRANSACTION = 'Transaction',
  SECURITY = 'Security',
  SYSTEM = 'System',
}

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  avatarUrl?: string;
  status: 'Active' | 'Restricted';
  kycVerified: boolean;
  joinedAt: string;
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  biometricAuthEnabled?: boolean;
  transactionAlertsEnabled?: boolean;
  transactionAlertThreshold?: number;
  preferredCurrency: 'LKR';
}

export interface BankAccount {
  id: string;
  ownerId: string;
  accountName: string;
  accountType: AccountType;
  accountNumber: string;
  routingNumber: string;
  balance: number;
  apy: number;
  dailyLimit: number;
  status: AccountStatus;
  openedAt: string;
}

export interface Transaction {
  id: string;
  referenceCode: string;
  accountId: string;
  ownerId: string;
  type: TransactionType;
  category: string;
  merchantOrCounterparty: string;
  counterpartyAccountNumber?: string;
  memo: string;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  createdAt: string;
  simulatedChannel: string;
  tags?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface PushAlertItem {
  id: string;
  title: string;
  message: string;
  txType: 'deposit' | 'withdrawal';
  amount: number;
  threshold: number;
  accountName: string;
  referenceCode: string;
  createdAt: string;
  isTest?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  outcome: 'Success' | 'Flagged' | 'Blocked';
  details: string;
}

export interface BankingLedgerState {
  users: UserProfile[];
  accounts: BankAccount[];
  transactions: Transaction[];
  notifications: NotificationItem[];
  auditLog: AuditEvent[];
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  authMode: 'DEMO_SANDBOX';
  authenticatedAt: string;
}

export type CustomerRoute =
  | 'dashboard'
  | 'accounts'
  | 'deposits-withdrawals'
  | 'transfers'
  | 'transactions'
  | 'statements'
  | 'notifications'
  | 'settings';

export type AdminRoute =
  | 'admin-dashboard'
  | 'admin-customers'
  | 'admin-monitoring'
  | 'notifications'
  | 'settings';

export type AppRoute = CustomerRoute | AdminRoute;
