import React, { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { bankingService } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { TransactionStatus, TransactionType } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';

const STATEMENT_MONTHS = [
  { key: '2026-11', label: 'November 2026 (Current Cycle)', year: 2026, month: 10 },
  { key: '2026-10', label: 'October 2026', year: 2026, month: 9 },
  { key: '2026-09', label: 'September 2026', year: 2026, month: 8 },
  { key: '2026-08', label: 'August 2026', year: 2026, month: 7 },
];

export const StatementsView: React.FC = () => {
  const { currentUser, userAccounts, userTransactions } = useBanking();
  const [accountId, setAccountId] = useState<string>(userAccounts[0]?.id ?? '');
  const [periodKey, setPeriodKey] = useState<string>(STATEMENT_MONTHS[0].key);

  const selectedAccount = useMemo(
    () => userAccounts.find((a) => a.id === accountId) ?? userAccounts[0],
    [accountId, userAccounts],
  );

  const selectedPeriod =
    STATEMENT_MONTHS.find((m) => m.key === periodKey) ?? STATEMENT_MONTHS[0];

  const statementData = useMemo(() => {
    if (!selectedAccount) {
      return {
        items: [],
        openingBalance: 0,
        totalCredits: 0,
        totalDebits: 0,
        closingBalance: 0,
      };
    }

    const items = userTransactions
      .filter((t) => {
        if (t.accountId !== selectedAccount.id) return false;
        const d = new Date(t.createdAt);
        return d.getFullYear() === selectedPeriod.year && d.getMonth() === selectedPeriod.month;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const activeItems = items.filter((t) => t.status !== TransactionStatus.REVERSED);
    const totalCredits = activeItems
      .filter((t) => t.type === TransactionType.DEPOSIT || t.type === TransactionType.TRANSFER_IN)
      .reduce((s, t) => s + t.amount, 0);
    const totalDebits = activeItems
      .filter((t) => t.type === TransactionType.WITHDRAWAL || t.type === TransactionType.TRANSFER_OUT)
      .reduce((s, t) => s + t.amount, 0);

    const closingBalance =
      items.length > 0 ? items[items.length - 1].balanceAfter : selectedAccount.balance;
    const openingBalance = Number((closingBalance - totalCredits + totalDebits).toFixed(2));

    return {
      items,
      openingBalance,
      totalCredits,
      totalDebits,
      closingBalance,
    };
  }, [selectedAccount, selectedPeriod, userTransactions]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <GlassCard className="no-print">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-2xl">
            <div>
              <label
                htmlFor="st-acc"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Account
              </label>
              <select
                id="st-acc"
                value={selectedAccount?.id ?? ''}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                {userAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="st-period"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Statement Cycle
              </label>
              <select
                id="st-period"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                {STATEMENT_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() =>
                selectedAccount &&
                bankingService.exportTransactionsCSV(
                  statementData.items,
                  `${selectedAccount.accountName}-${selectedPeriod.key}`,
                )
              }
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-slate-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() =>
                selectedAccount &&
                bankingService.exportPrintableStatementHTML({
                  customer: currentUser,
                  account: selectedAccount,
                  periodLabel: selectedPeriod.label,
                  ...statementData,
                  transactions: statementData.items,
                })
              }
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Statement</span>
            </button>

            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() => window.print()}
              aria-label="Print selected statement"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-slate-200 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Statement Document Preview */}
      {selectedAccount ? (
        <GlassCard padding="lg" className="printable-statement">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 print-keep-together">
            <div>
              <div className="font-display text-2xl font-bold tracking-wider text-slate-900 dark:text-[#F0F6FC] print-ink-primary">
                FINORA
              </div>
              <div className="text-xs text-cyan-800 dark:text-cyan-300 mt-0.5 print-ink-accent">
                Smart Finance. Secure Future.
              </div>
            </div>
            <div className="sm:text-right text-xs space-y-1">
              <div className="font-semibold text-amber-800 dark:text-amber-300 print-ink-warn">
                SAMPLE EDUCATIONAL STATEMENT — SIMULATED LKR DATA
              </div>
              <div className="text-slate-600 dark:text-slate-400 print-ink-muted">
                Statement Period: {selectedPeriod.label} · Currency: LKR (Rs.)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 dark:border-slate-800 text-sm print-keep-together">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 print-ink-muted">
                Account Holder
              </div>
              <div className="font-semibold text-slate-900 dark:text-[#F0F6FC] print-ink-primary">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 print-ink-muted">
                {currentUser.email}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 print-ink-muted">
                Account Identification
              </div>
              <div className="font-semibold text-slate-900 dark:text-[#F0F6FC] print-ink-primary">
                {selectedAccount.accountName} · {selectedAccount.accountType}
              </div>
              <div className="font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 mt-0.5 print-ink-muted">
                Account: {selectedAccount.accountNumber} · Routing: {selectedAccount.routingNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-200 dark:border-slate-800 print-summary-grid print-keep-together">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                Opening Balance
              </div>
              <div className="font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-[#F0F6FC] mt-1 print-ink-primary">
                {formatCurrency(statementData.openingBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                Total Credits
              </div>
              <div className="font-mono tabular-nums text-lg font-semibold text-emerald-700 dark:text-emerald-400 mt-1 print-ink-credit">
                +{formatCurrency(statementData.totalCredits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                Total Debits
              </div>
              <div className="font-mono tabular-nums text-lg font-semibold text-slate-800 dark:text-slate-200 mt-1 print-ink-primary">
                -{formatCurrency(statementData.totalDebits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                Closing Balance
              </div>
              <div className="font-mono tabular-nums text-lg font-bold text-cyan-800 dark:text-cyan-300 mt-1 print-ink-accent">
                {formatCurrency(statementData.closingBalance)}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] mb-4 flex items-center gap-2 print-ink-primary">
              <FileText className="w-4 h-4 text-cyan-700 dark:text-cyan-300 print-ink-accent" />
              <span>Itemized Activity ({statementData.items.length} entries)</span>
            </h3>

            {statementData.items.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                No simulated transactions were posted during {selectedPeriod.label}.
              </div>
            ) : (
              <div className="overflow-x-auto print-table-wrap">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 print-ink-muted">
                      <th className="py-2.5 pr-4">Date</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 pl-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                    {statementData.items.map((tx) => {
                      const isCredit =
                        tx.type === TransactionType.DEPOSIT ||
                        tx.type === TransactionType.TRANSFER_IN;
                      return (
                        <tr key={tx.id}>
                          <td className="py-3 pr-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap print-ink-muted">
                            {new Date(tx.createdAt).toLocaleDateString('en-LK')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900 dark:text-[#F0F6FC] print-ink-primary">
                              {tx.merchantOrCounterparty}
                            </div>
                            <div className="text-xs text-slate-500 font-mono print-ink-muted">
                              {tx.referenceCode} · {tx.memo}
                              {tx.tags && tx.tags.length > 0 ? ` · ${tx.tags.join(' ')}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap print-ink-muted">
                            {tx.type}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                              isCredit
                                ? 'text-emerald-700 dark:text-emerald-400 print-ink-credit'
                                : 'text-slate-900 dark:text-[#F0F6FC] print-ink-primary'
                            }`}
                          >
                            {isCredit ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="py-3 pl-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap print-ink-primary">
                            {formatCurrency(tx.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="hidden print-only mt-8 pt-4 border-t border-slate-300 items-center justify-between gap-4 text-[11px] print-ink-muted">
            <span>FINORA Educational Banking Simulator · Simulated LKR Statement Only</span>
            <span className="font-mono tabular-nums">
              Printed {new Date().toLocaleDateString('en-LK')} · {selectedAccount.accountNumber}
            </span>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
          Select an account to preview its sample statement.
        </GlassCard>
      )}
    </div>
  );
};
