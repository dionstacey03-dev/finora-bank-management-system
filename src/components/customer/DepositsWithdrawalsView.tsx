import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/currency';
import { AccountStatus, Transaction } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';
import { TagSelector } from './TagSelector';

export const DepositsWithdrawalsView: React.FC = () => {
  const { userAccounts, depositOrWithdraw } = useBanking();

  const [mode, setMode] = useState<'deposit' | 'withdrawal'>('deposit');
  const [accountId, setAccountId] = useState<string>(userAccounts[0]?.id ?? '');
  const [channel, setChannel] = useState('Simulated CEFTS Transfer');
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('25000');
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const selectedAccount = useMemo(
    () => userAccounts.find((a) => a.id === accountId) ?? userAccounts[0],
    [accountId, userAccounts],
  );

  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const projectedBalance = selectedAccount
    ? mode === 'deposit'
      ? selectedAccount.balance + validAmount
      : selectedAccount.balance - validAmount
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    if (!selectedAccount) {
      setError('Please select a target account.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(`Enter a valid simulated amount greater than ${formatCurrency(0)}.`);
      return;
    }

    setIsProcessing(true);
    const res = await depositOrWithdraw({
      accountId: selectedAccount.id,
      mode,
      amount: parsedAmount,
      channel,
      counterparty,
      memo,
      tags,
    });
    setIsProcessing(false);

    if (!res.ok) {
      setError(res.error ?? 'Simulated transaction failed validation.');
      return;
    }

    if (res.data) {
      setReceipt(res.data);
      setCounterparty('');
      setMemo('');
      setTags([]);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <GlassCard className="xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Simulated Deposit & Withdrawal
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Educational transaction simulator. No real currency or external bank rails are used.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('deposit');
                setError(null);
                setReceipt(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'deposit'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Simulated Deposit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('withdrawal');
                setError(null);
                setReceipt(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'withdrawal'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Simulated Withdrawal</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dw-account"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {mode === 'deposit' ? 'Destination Finora Account' : 'Source Finora Account'}
              </label>
              <select
                id="dw-account"
                value={selectedAccount?.id ?? ''}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                {userAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({formatCurrency(acc.balance)})
                    {acc.status === AccountStatus.FROZEN ? ' [Frozen]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="dw-channel"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Simulated Funding Channel
              </label>
              <select
                id="dw-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                <option value="Simulated CEFTS Transfer">Simulated CEFTS Transfer</option>
                <option value="Simulated SLIPS Transfer">Simulated SLIPS Transfer</option>
                <option value="Simulated RTGS Sandbox">Simulated RTGS Sandbox</option>
                <option value="Simulated Mobile Check">Simulated Mobile Check</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
              <label
                htmlFor="dw-amount"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Simulated Amount (LKR)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[5000, 25000, 100000, 500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="px-2 py-1 rounded-md bg-slate-50 border border-slate-300 hover:border-cyan-700 text-[11px] font-mono tabular-nums text-slate-800 dark:bg-[#071122] dark:border-slate-800 dark:hover:border-cyan-400/40 dark:text-slate-300 cursor-pointer"
                  >
                    Rs. {preset.toLocaleString('en-LK')}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="dw-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-lg font-mono tabular-nums font-semibold text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dw-counterparty"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {mode === 'deposit' ? 'Simulated Originator' : 'Simulated Recipient'}
              </label>
              <input
                id="dw-counterparty"
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder={
                  mode === 'deposit' ? 'e.g., Sandbox Payroll Credit' : 'e.g., Simulated Utility Bill'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
              />
            </div>
            <div>
              <label
                htmlFor="dw-memo"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Reference Note / Memo
              </label>
              <input
                id="dw-memo"
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Optional ledger description"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
              />
            </div>
          </div>

          <TagSelector compact selectedTags={tags} onChange={setTags} />

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#071122]/80 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Transactions of {formatCurrency(2500000)} or more enter a simulated{' '}
              <strong className="text-slate-900 dark:text-slate-200">Pending</strong> compliance
              review state until approved by an Administrator.
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || userAccounts.length === 0}
            className="w-full py-3 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
          >
            {isProcessing
              ? 'Recording Simulated Entry...'
              : mode === 'deposit'
                ? `Submit Simulated Deposit (${formatCurrency(validAmount)})`
                : `Submit Simulated Withdrawal (${formatCurrency(validAmount)})`}
          </button>
        </form>
      </GlassCard>

      {/* Live Preview & Receipt Panel */}
      <div className="xl:col-span-5 space-y-6">
        <GlassCard>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mb-4">
            Projected Balance Impact
          </h3>
          {selectedAccount ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Selected Account</span>
                <span className="font-medium text-slate-900 dark:text-[#F0F6FC]">
                  {selectedAccount.accountName}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Current Balance</span>
                <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  {formatCurrency(selectedAccount.balance)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">
                  {mode === 'deposit' ? 'Simulated Credit' : 'Simulated Debit'}
                </span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    mode === 'deposit'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {mode === 'deposit' ? '+' : '-'}
                  {formatCurrency(validAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-medium text-slate-800 dark:text-slate-300">
                  Projected Balance
                </span>
                <span
                  className={`font-mono tabular-nums text-lg font-bold ${
                    projectedBalance < 0
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-cyan-800 dark:text-cyan-300'
                  }`}
                >
                  {formatCurrency(projectedBalance)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Open a simulated account to run transactions.
            </p>
          )}
        </GlassCard>

        {receipt && (
          <GlassCard className="border-emerald-500/45 dark:border-emerald-500/35">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="font-display text-base font-semibold">Simulated Receipt Confirmed</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Reference ID</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC]">
                  {receipt.referenceCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status</span>
                <span className="text-cyan-800 dark:text-cyan-300 font-medium">
                  {receipt.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Channel</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {receipt.simulatedChannel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Updated Balance</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  {formatCurrency(receipt.balanceAfter)}
                </span>
              </div>
              {receipt.tags && receipt.tags.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600 dark:text-slate-400 shrink-0">Tags</span>
                  <span className="text-cyan-800 dark:text-cyan-300 text-right">
                    {receipt.tags.join(' · ')}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
