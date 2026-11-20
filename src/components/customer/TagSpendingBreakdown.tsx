import React, { useMemo } from 'react';
import { ArrowRight, Tag } from 'lucide-react';
import { Transaction, TransactionStatus, TransactionType } from '../../types/banking';
import { formatCurrency } from '../../utils/currency';
import { normalizeTransactionTags } from '../../utils/tags';
import { GlassCard } from '../ui/GlassCard';

interface TagSpendingBreakdownProps {
  transactions: Transaction[];
  onNavigateTransactions: () => void;
  onSimulateExpense?: () => void;
}

interface TagAggregate {
  tag: string;
  amount: number;
  count: number;
  topMerchant: string;
  topMerchantAmount: number;
}

const RANK_BAR_STYLES = [
  'bg-cyan-700 dark:bg-cyan-400',
  'bg-emerald-700 dark:bg-emerald-400',
  'bg-amber-600 dark:bg-amber-400',
];

export const TagSpendingBreakdown: React.FC<TagSpendingBreakdownProps> = ({
  transactions,
  onNavigateTransactions,
  onSimulateExpense,
}) => {
  const {
    monthLabel,
    topTags,
    totalOutflow,
    taggedTxCount,
    untaggedOutflow,
    untaggedCount,
    hasMultiTagExpense,
  } = useMemo(() => {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth();
    const label = now.toLocaleDateString('en-LK', { month: 'long', year: 'numeric' });

    const map = new Map<string, TagAggregate>();
    let outflowSum = 0;
    let taggedCount = 0;
    let untaggedSum = 0;
    let untaggedTxCount = 0;
    let multiTagFound = false;

    transactions.forEach((tx) => {
      if (tx.status === TransactionStatus.REVERSED) return;
      const isOutgoing =
        tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.TRANSFER_OUT;
      if (!isOutgoing) return;

      const d = new Date(tx.createdAt);
      if (d.getFullYear() !== targetYear || d.getMonth() !== targetMonth) return;

      outflowSum += tx.amount;

      const tags = normalizeTransactionTags(tx.tags);
      if (tags.length === 0) {
        untaggedSum += tx.amount;
        untaggedTxCount += 1;
        return;
      }

      taggedCount += 1;
      if (tags.length > 1) {
        multiTagFound = true;
      }

      tags.forEach((tag) => {
        const key = tag.toLowerCase();
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            tag,
            amount: tx.amount,
            count: 1,
            topMerchant: tx.merchantOrCounterparty,
            topMerchantAmount: tx.amount,
          });
        } else {
          existing.amount += tx.amount;
          existing.count += 1;
          if (tx.amount > existing.topMerchantAmount) {
            existing.topMerchant = tx.merchantOrCounterparty;
            existing.topMerchantAmount = tx.amount;
          }
        }
      });
    });

    const sorted = Array.from(map.values())
      .sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        if (b.count !== a.count) return b.count - a.count;
        return a.tag.localeCompare(b.tag);
      })
      .slice(0, 3);

    return {
      monthLabel: label,
      topTags: sorted,
      totalOutflow: outflowSum,
      taggedTxCount: taggedCount,
      untaggedOutflow: untaggedSum,
      untaggedCount: untaggedTxCount,
      hasMultiTagExpense: multiTagFound,
    };
  }, [transactions]);

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0" />
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Top Spending Tags
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Top 3 tagged spending categories for {monthLabel} · Ranked by simulated LKR outflow
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block text-right pr-4 border-r border-slate-200 dark:border-slate-800/80">
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              {monthLabel} Outflow
            </div>
            <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-[#F0F6FC]">
              {formatCurrency(totalOutflow)}
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateTransactions}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-200 whitespace-nowrap cursor-pointer"
          >
            <span>Manage Tags</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {topTags.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {totalOutflow > 0
              ? `No tagged expenses recorded for ${monthLabel} yet.`
              : `No outgoing spending recorded for ${monthLabel} yet.`}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Assign tags like #Personal, #Housing, or #Work to withdrawals and transfers to track
            your top monthly spending categories.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateTransactions}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors cursor-pointer"
            >
              {totalOutflow > 0 ? 'Tag Existing Transactions' : 'View Transaction Ledger'}
            </button>
            {onSimulateExpense && (
              <button
                type="button"
                onClick={onSimulateExpense}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 dark:bg-[#071122] dark:hover:bg-[#13223F] dark:border-slate-700/60 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Simulate Withdrawal
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/80">
            {topTags.map((item, idx) => {
              const sharePct =
                totalOutflow > 0
                  ? Math.min(100, Math.round((item.amount / totalOutflow) * 100))
                  : 0;
              const barColor = RANK_BAR_STYLES[idx] ?? RANK_BAR_STYLES[2];

              return (
                <div
                  key={item.tag}
                  className="py-4 md:py-1 md:px-6 first:pt-0 md:first:pl-0 last:pb-0 md:last:pr-0 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        0{idx + 1}.
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] truncate">
                        {item.tag}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                      {item.count} {item.count === 1 ? 'txn' : 'txns'} · {sharePct}%
                    </span>
                  </div>

                  <div className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-[#F0F6FC]">
                    {formatCurrency(item.amount)}
                  </div>

                  <div className="space-y-2">
                    <div
                      role="progressbar"
                      aria-valuenow={sharePct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.tag} share of ${monthLabel} spending`}
                      className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden"
                    >
                      <div
                        style={{ width: `${Math.max(4, sharePct)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                      Largest: <span className="text-slate-800 dark:text-slate-300">{item.topMerchant}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(untaggedCount > 0 || hasMultiTagExpense) && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span>
                Based on {taggedTxCount} tagged {taggedTxCount === 1 ? 'expense' : 'expenses'} in{' '}
                {monthLabel}
                {hasMultiTagExpense
                  ? ' · Multi-tag transactions count toward each assigned tag'
                  : ''}
              </span>
              {untaggedCount > 0 && (
                <span className="font-mono tabular-nums">
                  {untaggedCount} untagged ({formatCurrency(untaggedOutflow)}) excluded
                </span>
              )}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};
