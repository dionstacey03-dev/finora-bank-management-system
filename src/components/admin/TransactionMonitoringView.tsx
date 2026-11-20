import React, { useMemo, useState } from 'react';
import { History, Search, ShieldAlert } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/currency';
import { TransactionStatus } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';

export const TransactionMonitoringView: React.FC = () => {
  const { ledger, reviewTransaction } = useBanking();
  const [activeTab, setActiveTab] = useState<'monitor' | 'audit'>('monitor');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'ATTENTION' | 'HIGH_VALUE'>('ALL');

  const userMap = useMemo(
    () => new Map(ledger.users.map((u) => [u.id, u.fullName])),
    [ledger.users],
  );

  const monitoredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...ledger.transactions]
      .filter((tx) => {
        if (
          riskFilter === 'ATTENTION' &&
          tx.status !== TransactionStatus.FLAGGED &&
          tx.status !== TransactionStatus.PENDING
        ) {
          return false;
        }
        if (riskFilter === 'HIGH_VALUE' && tx.amount < 2500000) {
          return false;
        }
        if (q) {
          const ownerName = userMap.get(tx.ownerId) ?? '';
          const hay = `${tx.referenceCode} ${tx.merchantOrCounterparty} ${ownerName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ledger.transactions, riskFilter, searchQuery, userMap]);

  const filteredAudit = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...ledger.auditLog]
      .filter((ev) => {
        if (!q) return true;
        return `${ev.actorName} ${ev.action} ${ev.targetEntity} ${ev.details}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [ledger.auditLog, searchQuery]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Transaction Monitoring & Audit History
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Oversee simulated platform activity, clear or reverse flagged entries, and review
              immutable audit trails.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('monitor')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'monitor'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Transaction Monitor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({ledger.auditLog.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'monitor'
                  ? 'Search reference code, customer, or counterparty...'
                  : 'Search audit actor, action, or target entity...'
              }
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
          </div>

          {activeTab === 'monitor' && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800 shrink-0">
              {(
                [
                  { id: 'ALL', label: 'All Entries' },
                  { id: 'ATTENTION', label: 'Flagged & Pending' },
                  { id: 'HIGH_VALUE', label: 'High Value (Rs. 2.5M+)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRiskFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    riskFilter === opt.id
                      ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'monitor' ? (
          monitoredTransactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
              No transactions match this monitoring filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <th className="py-3 pr-4">Reference & Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Counterparty & Channel</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pl-4 text-right">Compliance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                  {monitoredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <div className="font-mono text-xs text-slate-900 dark:text-[#F0F6FC]">
                          {tx.referenceCode}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString('en-LK')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {userMap.get(tx.ownerId) ?? 'Member'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm text-slate-900 dark:text-[#F0F6FC]">
                          {tx.merchantOrCounterparty}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {tx.type} · {tx.simulatedChannel}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-[#F0F6FC] whitespace-nowrap">
                        {formatCurrency(tx.amount)}
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
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {tx.status !== TransactionStatus.COMPLETED &&
                            tx.status !== TransactionStatus.REVERSED && (
                              <button
                                type="button"
                                onClick={() => reviewTransaction(tx.id, 'approve')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/25 cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                          {tx.status === TransactionStatus.COMPLETED && (
                            <button
                              type="button"
                              onClick={() => reviewTransaction(tx.id, 'flag')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/20 cursor-pointer"
                            >
                              Flag
                            </button>
                          )}
                          {tx.status !== TransactionStatus.REVERSED && (
                            <button
                              type="button"
                              onClick={() => reviewTransaction(tx.id, 'reverse')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-xs font-medium text-rose-800 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/20 cursor-pointer"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredAudit.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
            No audit events match your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 pr-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 pl-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filteredAudit.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/20">
                    <td className="py-3.5 pr-4 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleString('en-LK', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-900 dark:text-[#F0F6FC]">
                        {ev.actorName}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {ev.actorRole}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-cyan-800 dark:text-cyan-300 whitespace-nowrap">
                      {ev.action}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {ev.targetEntity}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                      <span
                        className={
                          ev.outcome === 'Success'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : ev.outcome === 'Flagged'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                        }
                      >
                        {ev.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-xs text-slate-700 dark:text-slate-300 min-w-[220px]">
                      {ev.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
