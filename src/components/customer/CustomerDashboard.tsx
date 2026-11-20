import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  Lock,
  Plus,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { maskAccountNumber } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { AccountStatus, TransactionStatus, TransactionType } from '../../types/banking';
import { IncomeExpenseChart } from '../charts/IncomeExpenseChart';
import { GlassCard } from '../ui/GlassCard';
import { TableLoadingSkeleton } from '../ui/LoadingSkeleton';
import { BudgetGoals } from './BudgetGoals';
import { CustomerHelpChatWidget } from './CustomerHelpChatWidget';
import { QuickCurrencyConverter } from './QuickCurrencyConverter';
import { TagSpendingBreakdown } from './TagSpendingBreakdown';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    userAccounts,
    userTransactions,
    navigate,
    isLoadingView,
    biometricSessionVerified,
    requireBiometricVerification,
  } = useBanking();
  const [selectedAccountId, setSelectedAccountId] = useState<'ALL' | string>('ALL');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAccountId('ALL');
  }, [currentUser?.id]);

  useEffect(() => {
    if (
      selectedAccountId !== 'ALL' &&
      !userAccounts.some((acc) => acc.id === selectedAccountId)
    ) {
      setSelectedAccountId('ALL');
    }
  }, [selectedAccountId, userAccounts]);

  const selectedAccount = useMemo(
    () =>
      selectedAccountId === 'ALL'
        ? null
        : userAccounts.find((acc) => acc.id === selectedAccountId) ?? null,
    [selectedAccountId, userAccounts],
  );

  const filteredTransactions = useMemo(() => {
    if (!selectedAccount) return userTransactions;
    return userTransactions.filter((tx) => tx.accountId === selectedAccount.id);
  }, [selectedAccount, userTransactions]);

  const totalBalance = useMemo(
    () => userAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [userAccounts],
  );

  const displayedBalance = selectedAccount ? selectedAccount.balance : totalBalance;

  const monthlyFlow = useMemo(() => {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth();
    const monthLabel = now.toLocaleDateString('en-LK', { month: 'short' });

    const currentMonthTxs = filteredTransactions.filter((t) => {
      const d = new Date(t.createdAt);
      return (
        d.getFullYear() === targetYear &&
        d.getMonth() === targetMonth &&
        t.status !== TransactionStatus.REVERSED
      );
    });
    const income = currentMonthTxs
      .filter((t) => t.type === TransactionType.DEPOSIT || t.type === TransactionType.TRANSFER_IN)
      .reduce((s, t) => s + t.amount, 0);
    const expense = currentMonthTxs
      .filter((t) => t.type === TransactionType.WITHDRAWAL || t.type === TransactionType.TRANSFER_OUT)
      .reduce((s, t) => s + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: currentMonthTxs.length,
      monthLabel,
    };
  }, [filteredTransactions]);

  const recentTransactions = useMemo(
    () =>
      [...filteredTransactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [filteredTransactions],
  );

  if (!currentUser) return null;

  const toggleReveal = (id: string) => {
    const currentlyRevealed =
      Boolean(revealedIds[id]) && (!currentUser.biometricAuthEnabled || biometricSessionVerified);
    if (currentlyRevealed) {
      setRevealedIds((prev) => ({ ...prev, [id]: false }));
      return;
    }
    requireBiometricVerification(
      'Verify with simulated face or fingerprint check to reveal account number',
      () => {
        setRevealedIds((prev) => ({ ...prev, [id]: true }));
      },
    );
  };

  const copyAccountNumber = (id: string, num: string) => {
    requireBiometricVerification(
      'Verify with simulated face or fingerprint check to copy account number',
      () => {
        navigator.clipboard?.writeText(num);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1600);
      },
    );
  };

  const renderAccountCard = (acc: (typeof userAccounts)[number]) => {
    const isRevealed =
      Boolean(revealedIds[acc.id]) &&
      (!currentUser.biometricAuthEnabled || biometricSessionVerified);
    const isFrozen = acc.status === AccountStatus.FROZEN;
    const isSelected = selectedAccountId === acc.id;

    return (
      <GlassCard
        key={acc.id}
        className={`flex flex-col justify-between gap-5 transition-colors ${
          isSelected
            ? 'border-cyan-700/70 dark:border-cyan-400/55 ring-1 ring-cyan-700/20 dark:ring-cyan-400/20'
            : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>{acc.accountType}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{acc.apy.toFixed(2)}% APY</span>
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mt-0.5 truncate">
              {acc.accountName}
            </h3>
          </div>
          {isFrozen ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Frozen</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
              Active
            </span>
          )}
        </div>

        <div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC]">
            {formatCurrency(acc.balance)}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Daily limit:{' '}
            <span className="font-mono tabular-nums text-slate-800 dark:text-slate-300">
              {formatCurrency(acc.dailyLimit)}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <span className="font-mono tabular-nums text-xs text-slate-800 dark:text-slate-300 truncate">
            {isRevealed ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => toggleReveal(acc.id)}
              aria-label={isRevealed ? 'Hide account number' : 'Show account number'}
              className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => copyAccountNumber(acc.id, acc.accountNumber)}
              aria-label="Copy simulated account number"
              className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              {copiedId === acc.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedAccountId(isSelected ? 'ALL' : acc.id)}
              className="ml-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 border border-slate-300 hover:border-cyan-700 text-[11px] font-semibold text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              {isSelected ? 'All Accounts' : 'Focus'}
            </button>
          </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions Header */}
      <GlassCard padding="lg" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 60% 80% at 90% 10%, rgba(14, 116, 144, 0.10), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
              Welcome back, {currentUser.fullName}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono tabular-nums text-3xl sm:text-4xl font-bold text-slate-900 dark:text-[#F0F6FC] tracking-tight">
                {formatCurrency(displayedBalance)}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {selectedAccount
                  ? `${selectedAccount.accountName} (${selectedAccount.accountType}) · ${selectedAccount.status}`
                  : `Combined Simulated Balance (LKR) · ${userAccounts.length} Accounts`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-xs text-slate-700 dark:text-slate-300">
              <span>
                {monthlyFlow.monthLabel} Inflow:{' '}
                <strong className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(monthlyFlow.income)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                ·
              </span>
              <span>
                {monthlyFlow.monthLabel} Outflow:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                  -{formatCurrency(monthlyFlow.expense)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('deposits-withdrawals')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit / Withdraw</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('transfers')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 dark:bg-[#071122] dark:hover:bg-[#13223F] dark:border-slate-700/60 dark:text-[#F0F6FC] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
              <span>Internal Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('statements')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 dark:bg-[#071122] dark:hover:bg-[#13223F] dark:border-slate-700/60 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Statements</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Account Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Landmark className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0" />
          <span className="font-medium text-slate-800 dark:text-slate-200">Account Scope</span>
          <span aria-hidden="true">·</span>
          <span>
            {selectedAccount
              ? `Viewing ${selectedAccount.accountName} (${selectedAccount.accountType})`
              : `Viewing all ${userAccounts.length} simulated accounts`}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Filter dashboard by account"
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white border border-slate-300 dark:bg-[#071122] dark:border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedAccountId === 'ALL'}
            onClick={() => setSelectedAccountId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedAccountId === 'ALL'
                ? 'bg-cyan-50 text-cyan-800 border border-cyan-600/40 dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            All Accounts
          </button>
          {userAccounts.map((acc) => {
            const active = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-600/40 dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                {acc.accountName}
                <span className="ml-1.5 text-[11px] opacity-75">
                  ({acc.accountType === 'High-Yield Savings' ? 'Savings' : acc.accountType})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Balance Cards */}
      {selectedAccount ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {renderAccountCard(selectedAccount)}

          <GlassCard className="flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {monthlyFlow.monthLabel} Account Flow
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mt-0.5">
                  Net Cash Movement
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {monthlyFlow.count} {monthlyFlow.count === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div
              className={`font-mono tabular-nums text-2xl font-bold ${
                monthlyFlow.net >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {monthlyFlow.net >= 0 ? '+' : ''}
              {formatCurrency(monthlyFlow.net)}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                In:{' '}
                <strong className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{formatCurrency(monthlyFlow.income)}
                </strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Out:{' '}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                  -{formatCurrency(monthlyFlow.expense)}
                </strong>
              </span>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Terms & Yield Projection
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mt-0.5">
                  Estimated Annual Interest
                </h3>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                {selectedAccount.apy.toFixed(2)}% APY
              </span>
            </div>

            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC]">
              +{formatCurrency((selectedAccount.balance * selectedAccount.apy) / 100)}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                Routing: {selectedAccount.routingNumber}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAccountId('ALL')}
                className="font-semibold text-cyan-800 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-200 whitespace-nowrap cursor-pointer"
              >
                Show All Accounts
              </button>
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {userAccounts.map((acc) => renderAccountCard(acc))}

          {userAccounts.length < 3 && (
            <button
              type="button"
              onClick={() => navigate('accounts')}
              className="rounded-2xl border border-dashed border-slate-400 hover:border-cyan-700 bg-white/70 hover:bg-white dark:border-slate-700/70 dark:hover:border-cyan-400/50 dark:bg-[#0D182E]/30 dark:hover:bg-[#0D182E]/60 p-6 flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer min-h-[180px]"
            >
              <Plus className="w-6 h-6 text-cyan-700 dark:text-cyan-300" />
              <span className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Open Simulated Account
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Add Checking, Savings, or Treasury Vault
              </span>
            </button>
          )}
        </div>
      )}

      {/* Quick-Access Currency Conversion Tool */}
      <QuickCurrencyConverter
        totalBalance={displayedBalance}
        balanceButtonLabel={
          selectedAccount
            ? `Use ${selectedAccount.accountName} Balance`
            : 'Use Combined LKR Balance'
        }
      />

      {/* Main Spending Analysis + Recent Transactions Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <GlassCard className="xl:col-span-7">
          <IncomeExpenseChart
            transactions={filteredTransactions}
            title="Spending & Cash Flow Analysis"
            subtitle={
              selectedAccount
                ? `Monthly LKR income vs. expenses for ${selectedAccount.accountName}`
                : 'Monthly LKR income vs. expenses across your simulated accounts'
            }
            showCategoryBreakdown
          />
        </GlassCard>

        <GlassCard className="xl:col-span-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                {selectedAccount
                  ? `Filtered to ${selectedAccount.accountName}`
                  : 'Latest simulated ledger entries'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('transactions')}
              className="text-xs font-semibold text-cyan-800 hover:text-cyan-900 dark:font-medium dark:text-cyan-300 dark:hover:text-cyan-200 whitespace-nowrap cursor-pointer shrink-0"
            >
              View All
            </button>
          </div>

          {isLoadingView ? (
            <TableLoadingSkeleton rows={5} />
          ) : recentTransactions.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedAccount
                  ? `No simulated transactions recorded yet for ${selectedAccount.accountName}.`
                  : 'No simulated transactions recorded yet.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('deposits-withdrawals')}
                  className="px-4 py-2 rounded-xl bg-cyan-700 text-white dark:bg-cyan-400 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
                >
                  Simulate First Deposit
                </button>
                {selectedAccount && (
                  <button
                    type="button"
                    onClick={() => setSelectedAccountId('ALL')}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Show All Accounts
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {recentTransactions.map((tx) => {
                const isCredit =
                  tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TRANSFER_IN;
                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-slate-800/20 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-[#F0F6FC] truncate">
                          {tx.merchantOrCounterparty}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                          <span>
                            {new Date(tx.createdAt).toLocaleDateString('en-LK', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.type}</span>
                          {tx.tags && tx.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-cyan-800 dark:text-cyan-300/85 truncate">
                                {tx.tags.slice(0, 2).join(' · ')}
                              </span>
                            </>
                          )}
                          {tx.status !== TransactionStatus.COMPLETED && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  tx.status === TransactionStatus.FLAGGED
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : tx.status === TransactionStatus.REVERSED
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : 'text-cyan-800 dark:text-cyan-300'
                                }
                              >
                                {tx.status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono tabular-nums text-sm font-semibold ${
                          tx.status === TransactionStatus.REVERSED
                            ? 'line-through text-slate-500'
                            : isCredit
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-[#F0F6FC]'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Top 3 Spending Categories by Transaction Tag (Current Month) */}
      <TagSpendingBreakdown
        transactions={filteredTransactions}
        onNavigateTransactions={() => navigate('transactions')}
        onSimulateExpense={() => navigate('deposits-withdrawals')}
      />

      {/* Monthly Budget Goals */}
      <BudgetGoals userId={currentUser.id} transactions={filteredTransactions} />

      {/* Contextual Help FAQ Chat Widget */}
      <CustomerHelpChatWidget />
    </div>
  );
};
