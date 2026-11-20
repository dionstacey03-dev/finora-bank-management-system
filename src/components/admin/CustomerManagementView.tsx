import React, { useMemo, useState } from 'react';
import { CheckCircle2, Lock, Plus, Search, ShieldAlert, Unlock, X } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/currency';
import { UserProfile, UserRole } from '../../types/banking';
import { Avatar } from '../ui/Avatar';
import { GlassCard } from '../ui/GlassCard';

export const CustomerManagementView: React.FC = () => {
  const { ledger, toggleCustomerStatus, toggleFreezeAccount, onboardCustomerAsAdmin } =
    useBanking();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Restricted'>('ALL');
  const [inspectedCustomer, setInspectedCustomer] = useState<UserProfile | null>(null);

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDeposit, setNewDeposit] = useState('250000');
  const [onboardError, setOnboardError] = useState<string | null>(null);

  const customers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ledger.users
      .filter((u) => u.role === UserRole.CUSTOMER)
      .filter((u) => {
        if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
        if (q && !`${u.fullName} ${u.email} ${u.title}`.toLowerCase().includes(q)) return false;
        return true;
      });
  }, [ledger.users, searchQuery, statusFilter]);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError(null);
    const res = onboardCustomerAsAdmin({
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      initialDeposit: Number(newDeposit),
    });
    if (!res.ok) {
      setOnboardError(res.error ?? 'Could not onboard simulated customer.');
      return;
    }
    setShowOnboardModal(false);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewDeposit('250000');
  };

  const inspectedAccounts = useMemo(() => {
    if (!inspectedCustomer) return [];
    return ledger.accounts.filter((a) => a.ownerId === inspectedCustomer.id);
  }, [inspectedCustomer, ledger.accounts]);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Customer Directory
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Inspect simulated customer profiles, account balances, and compliance status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOnboardError(null);
              setShowOnboardModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Simulated Customer</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or email..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800 shrink-0">
            {(['ALL', 'Active', 'Restricted'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-600 dark:text-slate-400">
            No customers match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Accounts</th>
                  <th className="py-3 px-4 text-right">Combined Balance</th>
                  <th className="py-3 px-4">Profile Status</th>
                  <th className="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {customers.map((customer) => {
                  const custAccounts = ledger.accounts.filter((a) => a.ownerId === customer.id);
                  const totalBal = custAccounts.reduce((s, a) => s + a.balance, 0);
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-100/80 dark:hover:bg-slate-800/25 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={customer.avatarUrl} name={customer.fullName} size="sm" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 dark:text-[#F0F6FC] truncate">
                              {customer.fullName}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {customer.kycVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Pending KYC</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300">
                        {custAccounts.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-[#F0F6FC]">
                        {formatCurrency(totalBal)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                        <span
                          className={
                            customer.status === 'Active'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectedCustomer(customer)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-cyan-700 text-xs font-medium text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-slate-200 cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCustomerStatus(customer.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                              customer.status === 'Active'
                                ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/20'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/25'
                            }`}
                          >
                            {customer.status === 'Active' ? 'Restrict' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Customer Inspection Modal */}
      {inspectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar
                  src={inspectedCustomer.avatarUrl}
                  name={inspectedCustomer.fullName}
                  size="md"
                />
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                    {inspectedCustomer.fullName}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {inspectedCustomer.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCustomer(null)}
                aria-label="Close inspection"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Simulated Accounts ({inspectedAccounts.length})
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {inspectedAccounts.map((acc) => (
                  <div key={acc.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-[#F0F6FC]">
                        {acc.accountName}
                      </div>
                      <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {acc.accountNumber} · {acc.accountType}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                          {formatCurrency(acc.balance)}
                        </div>
                        <div
                          className={`text-[11px] ${
                            acc.status === 'Frozen'
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {acc.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFreezeAccount(acc.id)}
                        className="p-2 rounded-lg bg-white border border-slate-300 hover:border-cyan-700 text-slate-700 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-slate-300 cursor-pointer"
                        title={acc.status === 'Frozen' ? 'Unfreeze account' : 'Freeze account'}
                      >
                        {acc.status === 'Frozen' ? (
                          <Unlock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedCustomer(null)}
              className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:border-slate-700 dark:hover:border-cyan-400/50 dark:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Onboard Customer Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Onboard Simulated Customer
              </h3>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 mt-5">
              {onboardError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200">
                  {onboardError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Demo Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex.rivera@finora-demo.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+94 77 555 0188"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Opening Credit (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
