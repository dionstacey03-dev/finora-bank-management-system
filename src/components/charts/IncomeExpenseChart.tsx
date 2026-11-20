import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useBanking } from '../../context/BankingContext';
import { Transaction, TransactionStatus, TransactionType } from '../../types/banking';
import { formatCompactCurrency, formatCurrency } from '../../utils/currency';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  title?: string;
  subtitle?: string;
  showCategoryBreakdown?: boolean;
}

interface MonthlyBucket {
  key: string;
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    payload?: MonthlyBucket;
  }>;
}

const LkrAreaTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const net = row.income - row.expense;

  return (
    <div className="rounded-xl bg-white/95 dark:bg-[#071122]/95 backdrop-blur-md border border-slate-300 dark:border-cyan-400/30 px-3.5 py-2.5 shadow-xl text-xs space-y-1.5">
      <div className="font-display font-semibold text-slate-900 dark:text-[#F0F6FC]">
        {row.fullLabel}
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-slate-600 dark:text-slate-400">Income</span>
        <span className="font-mono tabular-nums font-semibold text-cyan-700 dark:text-cyan-300">
          {formatCurrency(row.income)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-5">
        <span className="text-slate-600 dark:text-slate-400">Expenses</span>
        <span className="font-mono tabular-nums font-semibold text-rose-700 dark:text-rose-300">
          {formatCurrency(row.expense)}
        </span>
      </div>
      <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-5">
        <span className="text-slate-600 dark:text-slate-400">Net</span>
        <span
          className={`font-mono tabular-nums font-semibold ${
            net >= 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          {net >= 0 ? '+' : ''}
          {formatCurrency(net)}
        </span>
      </div>
    </div>
  );
};

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  transactions,
  title = 'Cash Flow Analytics',
  subtitle = 'Simulated monthly LKR income vs. expenses',
  showCategoryBreakdown = false,
}) => {
  const { theme } = useBanking();
  const [range, setRange] = useState<'3M' | '6M'>('6M');

  const isLight = theme === 'light';
  const incomeStroke = isLight ? '#0E7490' : '#22D3EE';
  const expenseStroke = isLight ? '#BE123C' : '#FB7185';
  const gridStroke = isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(148, 163, 184, 0.12)';
  const tickColor = isLight ? '#475569' : '#94A3B8';
  const yTickColor = isLight ? '#475569' : '#64748B';
  const dotOutline = isLight ? '#FFFFFF' : '#060D1A';

  const { buckets, categoryTotals } = useMemo(() => {
    const monthsCount = range === '3M' ? 3 : 6;
    const anchor = new Date(2026, 10, 1); // Nov 2026 anchor
    const list: MonthlyBucket[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-LK', { month: 'short' });
      const fullLabel = d.toLocaleDateString('en-LK', { month: 'long', year: 'numeric' });
      list.push({ key, label, fullLabel, income: 0, expense: 0 });
    }

    const bucketMap = new Map(list.map((b) => [b.key, b]));
    const catMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.status === TransactionStatus.REVERSED) return;
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      if (tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.TRANSFER_IN) {
        bucket.income += tx.amount;
      } else {
        bucket.expense += tx.amount;
        const catName = tx.category || 'Other Expenses';
        catMap.set(catName, (catMap.get(catName) ?? 0) + tx.amount);
      }
    });

    const sortedCategories = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { buckets: list, categoryTotals: sortedCategories };
  }, [range, transactions]);

  const totals = useMemo(() => {
    const income = buckets.reduce((acc, b) => acc + b.income, 0);
    const expense = buckets.reduce((acc, b) => acc + b.expense, 0);
    return { income, expense, net: income - expense };
  }, [buckets]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
            {title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800">
          <button
            type="button"
            onClick={() => setRange('3M')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              range === '3M'
                ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            3 Months
          </button>
          <button
            type="button"
            onClick={() => setRange('6M')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              range === '6M'
                ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            6 Months
          </button>
        </div>
      </div>

      {/* Period summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-700 dark:bg-cyan-400 inline-block shrink-0" />
            <span>Monthly Income</span>
          </div>
          <div className="font-mono tabular-nums text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F0F6FC] mt-1">
            {formatCurrency(totals.income)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-700 dark:bg-rose-400 inline-block shrink-0" />
            <span>Monthly Expenses</span>
          </div>
          <div className="font-mono tabular-nums text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-200 mt-1">
            {formatCurrency(totals.expense)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Net Savings</div>
          <div
            className={`font-mono tabular-nums text-base sm:text-lg font-semibold mt-1 ${
              totals.net >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {totals.net >= 0 ? '+' : ''}
            {formatCurrency(totals.net)}
          </div>
        </div>
      </div>

      {/* Recharts LKR Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="finoraIncomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={incomeStroke} stopOpacity={isLight ? 0.25 : 0.35} />
                <stop offset="95%" stopColor={incomeStroke} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="finoraExpenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={expenseStroke} stopOpacity={isLight ? 0.22 : 0.28} />
                <stop offset="95%" stopColor={expenseStroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={86}
              tickFormatter={(val: number) => formatCompactCurrency(val)}
              tick={{ fill: yTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
            />
            <Tooltip
              content={<LkrAreaTooltip />}
              cursor={{
                stroke: isLight ? 'rgba(14, 116, 144, 0.35)' : 'rgba(34, 211, 238, 0.35)',
                strokeWidth: 1,
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="Monthly Income"
              stroke={incomeStroke}
              strokeWidth={2.25}
              fill="url(#finoraIncomeFill)"
              activeDot={{ r: 5, fill: incomeStroke, stroke: dotOutline, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Monthly Expenses"
              stroke={expenseStroke}
              strokeWidth={2}
              fill="url(#finoraExpenseFill)"
              activeDot={{ r: 4.5, fill: expenseStroke, stroke: dotOutline, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Optional Category Spending Breakdown */}
      {showCategoryBreakdown && categoryTotals.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3">
            <span className="font-medium text-slate-800 dark:text-slate-300">
              Top Spending Categories ({range})
            </span>
            <span className="font-mono tabular-nums">
              Total Outflow: {formatCurrency(totals.expense)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {categoryTotals.map((item) => {
              const share =
                totals.expense > 0 ? Math.round((item.amount / totals.expense) * 100) : 0;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {item.category}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC] font-medium shrink-0">
                      {formatCurrency(item.amount)} ({share}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, share)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-rose-600 dark:from-cyan-400 dark:to-rose-400/80"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
