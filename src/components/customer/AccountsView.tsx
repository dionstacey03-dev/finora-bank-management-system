import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  SlidersHorizontal,
  Unlock,
  X,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { maskAccountNumber } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { AccountStatus, AccountType } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';

export const AccountsView: React.FC = () => {
  const {
    userAccounts,
    currentUser,
    createAccount,
    toggleFreezeAccount,
    updateDailyLimit,
    navigate,
    biometricSessionVerified,
    requireBiometricVerification,
    lockBiometricSession,
  } = useBanking();

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create Account Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>(AccountType.SAVINGS);
  const [initialDeposit, setInitialDeposit] = useState('50000');
  const [dailyLimit, setDailyLimit] = useState('500000');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Limit Modal
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleToggleReveal = (id: string) => {
    const currentlyRevealed =
      Boolean(revealed[id]) && (!currentUser.biometricAuthEnabled || biometricSessionVerified);
    if (currentlyRevealed) {
      setRevealed((p) => ({ ...p, [id]: false }));
      return;
    }
    requireBiometricVerification(
      'Verify with simulated face or fingerprint check to reveal account number',
      () => setRevealed((p) => ({ ...p, [id]: true })),
    );
  };

  const handleCopy = (id: string, value: string) => {
    requireBiometricVerification(
      'Verify with simulated face or fingerprint check to copy account number',
      () => {
        navigator.clipboard?.writeText(value);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      },
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const res = createAccount({
      accountName: newName,
      accountType: newType,
      initialDeposit: Number(initialDeposit),
      dailyLimit: Number(dailyLimit),
    });
    if (!res.ok) {
      setCreateError(res.error ?? 'Could not open simulated account.');
      return;
    }
    setShowCreateModal(false);
    setNewName('');
    setInitialDeposit('50000');
  };

  const handleLimitSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountId) return;
    setLimitError(null);
    const res = updateDailyLimit(editingAccountId, Number(limitInput));
    if (!res.ok) {
      setLimitError(res.error ?? 'Invalid daily limit.');
      return;
    }
    setEditingAccountId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
            Simulated Accounts & Vaults
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Inspect account credentials, adjust daily limits, or freeze cards and accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser.biometricAuthEnabled && biometricSessionVerified && (
            <button
              type="button"
              onClick={() => {
                setRevealed({});
                lockBiometricSession();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-xs font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 whitespace-nowrap cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Credentials</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Simulated Account</span>
          </button>
        </div>
      </div>

      {userAccounts.length === 0 ? (
        <GlassCard className="py-12 text-center space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            No simulated accounts found for your profile.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-700 text-white dark:bg-cyan-400 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
          >
            Open Your First Account
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {userAccounts.map((acc) => {
            const isRevealed =
              Boolean(revealed[acc.id]) &&
              (!currentUser.biometricAuthEnabled || biometricSessionVerified);
            const isFrozen = acc.status === AccountStatus.FROZEN;

            return (
              <GlassCard key={acc.id} className="flex flex-col justify-between gap-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span>{acc.accountType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-cyan-800 dark:text-cyan-300">
                        {acc.apy.toFixed(2)}% APY
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC] mt-1">
                      {acc.accountName}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      isFrozen
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{acc.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200 dark:border-slate-800/80">
                  <div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Available Balance</div>
                    <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-[#F0F6FC] mt-1">
                      {formatCurrency(acc.balance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Daily Transfer Limit
                    </div>
                    <div className="font-mono tabular-nums text-lg font-semibold text-slate-800 dark:text-slate-200 mt-1.5">
                      {formatCurrency(acc.dailyLimit)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-400">
                      Simulated Account Number
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                        {isRevealed ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(acc.id)}
                        aria-label="Toggle account number visibility"
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-cyan-800 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.id, acc.accountNumber)}
                        aria-label="Copy account number"
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-cyan-800 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        {copiedId === acc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-400">Demo Routing Code</span>
                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-300">
                      {acc.routingNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-400">Opened</span>
                    <span className="text-slate-800 dark:text-slate-300">
                      {new Date(acc.openedAt).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleFreezeAccount(acc.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isFrozen
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/35 dark:text-emerald-300 dark:hover:bg-emerald-500/25'
                        : 'bg-white border-slate-300 text-slate-800 hover:border-rose-600 hover:text-rose-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-slate-200 dark:hover:border-rose-400/50 dark:hover:text-rose-300'
                    }`}
                  >
                    {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isFrozen ? 'Unfreeze Account' : 'Freeze Account'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccountId(acc.id);
                      setLimitInput(String(acc.dailyLimit));
                      setLimitError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/40 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
                    <span>Adjust Limit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('statements')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-500 text-xs font-medium text-slate-700 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-slate-500 dark:text-slate-300 transition-colors cursor-pointer ml-auto"
                  >
                    <span>Statements</span>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Open New Simulated Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Open Simulated Account
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-5">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Nickname
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Emergency Reserve Vault"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Product Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                >
                  <option value={AccountType.CHECKING}>Checking (0.45% APY)</option>
                  <option value={AccountType.SAVINGS}>High-Yield Savings (7.25% APY)</option>
                  <option value={AccountType.VAULT}>Treasury Vault (8.50% APY)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Sandbox Credit (LKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Daily Limit (LKR)
                  </label>
                  <input
                    type="number"
                    min="25000"
                    step="5000"
                    required
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Daily Limit Modal */}
      {editingAccountId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Adjust Daily Limit
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccountId(null)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLimitSave} className="space-y-4 mt-4">
              {limitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200">
                  {limitError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Daily Limit (Rs. 25,000.00 – Rs. 25,000,000.00)
                </label>
                <input
                  type="number"
                  min="25000"
                  max="25000000"
                  step="5000"
                  required
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAccountId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
