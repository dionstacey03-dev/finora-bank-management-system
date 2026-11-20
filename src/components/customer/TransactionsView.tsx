import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { bankingService } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { PRESET_TRANSACTION_TAGS } from '../../utils/tags';
import { TransactionStatus, TransactionType } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';
import { TableLoadingSkeleton } from '../ui/LoadingSkeleton';
import { TagSelector } from './TagSelector';

export const TransactionsView: React.FC = () => {
  const {
    userAccounts,
    userTransactions,
    isLoadingView,
    triggerSimulatedRefresh,
    updateTransactionTags,
  } = useBanking();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const accountNameMap = useMemo(
    () => new Map(userAccounts.map((a) => [a.id, a.accountName])),
    [userAccounts],
  );

  const availableTags = useMemo(() => {
    const map = new Map<string, string>();
    for (const preset of PRESET_TRANSACTION_TAGS) {
      map.set(preset.toLowerCase(), preset);
    }
    for (const tx of userTransactions) {
      for (const tag of tx.tags ?? []) {
        const key = tag.toLowerCase();
        if (!map.has(key)) {
          map.set(key, tag);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [userTransactions]);

  const selectedTx = useMemo(
    () => (selectedTxId ? userTransactions.find((tx) => tx.id === selectedTxId) ?? null : null),
    [selectedTxId, userTransactions],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...userTransactions]
      .filter((tx) => {
        const txTags = tx.tags ?? [];
        if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
        if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
        if (accountFilter !== 'ALL' && tx.accountId !== accountFilter) return false;
        if (tagFilter === 'UNTAGGED' && txTags.length > 0) return false;
        if (
          tagFilter !== 'ALL' &&
          tagFilter !== 'UNTAGGED' &&
          !txTags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
        ) {
          return false;
        }
        if (q) {
          const hay =
            `${tx.merchantOrCounterparty} ${tx.referenceCode} ${tx.memo} ${tx.category} ${txTags.join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [accountFilter, searchQuery, statusFilter, tagFilter, typeFilter, userTransactions]);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setAccountFilter('ALL');
    setTagFilter('ALL');
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Transaction History
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Search, filter, and organize simulated entries with custom tags like #Work or #Personal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={triggerSimulatedRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-xs font-medium text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/40 dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingView ? 'animate-spin text-cyan-700 dark:text-cyan-300' : ''}`}
              />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => bankingService.exportTransactionsCSV(filtered, 'filtered-ledger')}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] disabled:opacity-50 text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-5">
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, ref ID, memo, or #tag..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              <option value="ALL">All Accounts</option>
              {userAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | TransactionType)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              <option value="ALL">All Types</option>
              <option value={TransactionType.DEPOSIT}>Deposit</option>
              <option value={TransactionType.WITHDRAWAL}>Withdrawal</option>
              <option value={TransactionType.TRANSFER_IN}>Transfer In</option>
              <option value={TransactionType.TRANSFER_OUT}>Transfer Out</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TransactionStatus)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value={TransactionStatus.COMPLETED}>Completed</option>
              <option value={TransactionStatus.PENDING}>Pending</option>
              <option value={TransactionStatus.FLAGGED}>Flagged</option>
              <option value={TransactionStatus.REVERSED}>Reversed</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              <option value="ALL">All Tags</option>
              <option value="UNTAGGED">Untagged Only</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data table */}
        {isLoadingView ? (
          <TableLoadingSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              No simulated transactions match your current filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-cyan-800 hover:border-cyan-700 dark:bg-[#071122] dark:border-slate-700 dark:text-cyan-300 dark:hover:border-cyan-400/50 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 px-4">Counterparty, Reference & Tags</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filtered.map((tx) => {
                  const isCredit =
                    tx.type === TransactionType.DEPOSIT ||
                    tx.type === TransactionType.TRANSFER_IN;
                  const txTags = tx.tags ?? [];
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTxId(tx.id)}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 min-w-[230px]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 dark:text-[#F0F6FC] truncate">
                              {tx.merchantOrCounterparty}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                              <span className="font-mono">{tx.referenceCode}</span>
                              {txTags.length > 0 ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  {txTags.map((tag, idx) => (
                                    <React.Fragment key={tag}>
                                      {idx > 0 && <span aria-hidden="true">·</span>}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTagFilter((prev) =>
                                            prev.toLowerCase() === tag.toLowerCase() ? 'ALL' : tag,
                                          );
                                        }}
                                        title={`Filter by ${tag}`}
                                        className={`hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors cursor-pointer ${
                                          tagFilter.toLowerCase() === tag.toLowerCase()
                                            ? 'text-cyan-900 dark:text-cyan-200 font-semibold underline underline-offset-2'
                                            : 'text-cyan-800 dark:text-cyan-300/80'
                                        }`}
                                      >
                                        {tag}
                                      </button>
                                    </React.Fragment>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-500 hover:text-cyan-800 dark:hover:text-cyan-300">
                                    Add tag
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {accountNameMap.get(tx.accountId) ?? 'Account'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.type}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                        <span
                          className={
                            tx.status === TransactionStatus.COMPLETED
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : tx.status === TransactionStatus.FLAGGED
                                ? 'text-amber-700 dark:text-amber-400'
                                : tx.status === TransactionStatus.REVERSED
                                  ? 'text-rose-700 dark:text-rose-400'
                                  : 'text-cyan-800 dark:text-cyan-300'
                          }
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 pl-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          tx.status === TransactionStatus.REVERSED
                            ? 'line-through text-slate-500'
                            : isCredit
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-[#F0F6FC]'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Transaction Detail & Tagging Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Simulated Entry Receipt
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  {selectedTx.merchantOrCounterparty}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxId(null)}
                aria-label="Close receipt"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Amount</span>
                <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-[#F0F6FC]">
                  {formatCurrency(selectedTx.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Reference Code</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedTx.referenceCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Timestamp</span>
                <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  {new Date(selectedTx.createdAt).toLocaleString('en-LK')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Type & Channel</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedTx.type} · {selectedTx.simulatedChannel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Category</span>
                <span className="text-slate-800 dark:text-slate-200">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <span className="text-cyan-800 dark:text-cyan-300 font-medium">
                  {selectedTx.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Balance After Entry</span>
                <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  {formatCurrency(selectedTx.balanceAfter)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-slate-600 dark:text-slate-400 mb-1">Memo</div>
                <div className="text-slate-800 dark:text-slate-200">{selectedTx.memo}</div>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <TagSelector
                  compact
                  label="Transaction Tags"
                  selectedTags={selectedTx.tags ?? []}
                  onChange={(nextTags) => updateTransactionTags(selectedTx.id, nextTags)}
                  helperText="Changes save immediately to your local ledger and CSV exports."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTxId(null)}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:border-cyan-700 dark:bg-[#071122] dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400/50 cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
