import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/currency';
import { TransactionStatus, UserRole } from '../../types/banking';
import { IncomeExpenseChart } from '../charts/IncomeExpenseChart';
import { GlassCard } from '../ui/GlassCard';

export const AdminDashboard: React.FC = () => {
  const { currentUser, ledger, navigate, reviewTransaction } = useBanking();

  const stats = useMemo(() => {
    const customers = ledger.users.filter((u) => u.role === UserRole.CUSTOMER);
    const activeCustomers = customers.filter((u) => u.status === 'Active').length;
    const totalLiquidity = ledger.accounts.reduce((s, a) => s + a.balance, 0);
    const reviewQueue = ledger.transactions.filter(
      (t) => t.status === TransactionStatus.FLAGGED || t.status === TransactionStatus.PENDING,
    );
    const completedVol = ledger.transactions
      .filter((t) => t.status === TransactionStatus.COMPLETED)
      .reduce((s, t) => s + t.amount, 0);

    return {
      customerCount: customers.length,
      activeCustomers,
      accountCount: ledger.accounts.length,
      totalLiquidity,
      reviewQueue,
      completedVol,
    };
  }, [ledger]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Executive Admin Banner */}
      <GlassCard padding="lg" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 65% 80% at 88% 15%, rgba(14, 116, 144, 0.10), transparent 70%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
              Operations & Compliance Console · {currentUser.fullName}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-[#F0F6FC]">
              Platform Liquidity & Risk Overview
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monitor simulated customer balances, review flagged transactions, and inspect the
              compliance audit trail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('admin-monitoring')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
            >
              <span>Inspect Review Queue ({stats.reviewQueue.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('admin-customers')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:hover:bg-[#13223F] dark:border-slate-700/60 dark:text-slate-200 cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
              <span>Customer Directory</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Simulated Liquidity</span>
            <Landmark className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC] mt-2">
            {formatCurrency(stats.totalLiquidity)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Across {stats.accountCount} simulated accounts
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Customer Profiles</span>
            <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC] mt-2">
            {stats.customerCount}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
            {stats.activeCustomers} active · {stats.customerCount - stats.activeCustomers} restricted
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Settled Volume</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC] mt-2">
            {formatCurrency(stats.completedVol)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Completed ledger entries
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Compliance Queue</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                stats.reviewQueue.length > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC] mt-2">
            {stats.reviewQueue.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {stats.reviewQueue.length > 0
              ? 'Flagged or pending items awaiting review'
              : 'All simulated transactions cleared'}
          </div>
        </GlassCard>
      </div>

      {/* Platform Analytics + Triage Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <GlassCard className="xl:col-span-7">
          <IncomeExpenseChart
            transactions={ledger.transactions}
            title="Platform Inflow & Outflow"
            subtitle="Aggregated simulated ledger volume across all Finora accounts"
          />
        </GlassCard>

        <GlassCard className="xl:col-span-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Flagged & Pending Queue
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Quick compliance triage actions
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('admin-monitoring')}
              className="text-xs font-semibold text-cyan-800 hover:text-cyan-900 dark:font-medium dark:text-cyan-300 dark:hover:text-cyan-200 cursor-pointer"
            >
              Full Monitor
            </button>
          </div>

          {stats.reviewQueue.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-700 dark:text-emerald-400 mx-auto" />
              <p className="text-sm font-medium text-slate-900 dark:text-[#F0F6FC]">Queue Clear</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No flagged or pending simulated transactions require review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {stats.reviewQueue.slice(0, 5).map((tx) => {
                const owner = ledger.users.find((u) => u.id === tx.ownerId);
                return (
                  <div key={tx.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-[#F0F6FC] truncate">
                          {tx.merchantOrCounterparty}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {owner?.fullName ?? 'Member'} ·{' '}
                          <span className="font-mono">{tx.referenceCode}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                          {formatCurrency(tx.amount)}
                        </div>
                        <div
                          className={`text-[11px] font-medium ${
                            tx.status === TransactionStatus.FLAGGED
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-cyan-800 dark:text-cyan-300'
                          }`}
                        >
                          {tx.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => reviewTransaction(tx.id, 'approve')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:border-emerald-500/30 dark:text-emerald-300 cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewTransaction(tx.id, 'reverse')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs font-medium text-rose-800 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300 cursor-pointer"
                      >
                        Reverse Entry
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
