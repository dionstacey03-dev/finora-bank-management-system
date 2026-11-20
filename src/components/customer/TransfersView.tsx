import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Users } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { maskAccountNumber } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { AccountStatus, Transaction, UserRole } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';
import { TagSelector } from './TagSelector';

export const TransfersView: React.FC = () => {
  const { currentUser, userAccounts, ledger, transferFunds } = useBanking();

  const [transferScope, setTransferScope] = useState<'own' | 'member'>('own');
  const [fromAccountId, setFromAccountId] = useState<string>(userAccounts[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState<string>(userAccounts[1]?.id ?? '');
  const [amount, setAmount] = useState('15000');
  const [memo, setMemo] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ debitTx: Transaction; creditTx: Transaction } | null>(
    null,
  );

  const memberDestinationAccounts = useMemo(() => {
    if (!currentUser) return [];
    return ledger.accounts
      .filter((a) => a.ownerId !== currentUser.id && a.status === AccountStatus.ACTIVE)
      .map((a) => {
        const owner = ledger.users.find((u) => u.id === a.ownerId && u.role === UserRole.CUSTOMER);
        return {
          account: a,
          ownerName: owner?.fullName ?? 'Finora Member',
        };
      });
  }, [currentUser, ledger.accounts, ledger.users]);

  const ownDestinationAccounts = useMemo(
    () => userAccounts.filter((a) => a.id !== fromAccountId),
    [fromAccountId, userAccounts],
  );

  const effectiveToId = useMemo(() => {
    if (transferScope === 'own') {
      return ownDestinationAccounts.some((a) => a.id === toAccountId)
        ? toAccountId
        : (ownDestinationAccounts[0]?.id ?? '');
    }
    return memberDestinationAccounts.some((m) => m.account.id === toAccountId)
      ? toAccountId
      : (memberDestinationAccounts[0]?.account.id ?? '');
  }, [memberDestinationAccounts, ownDestinationAccounts, toAccountId, transferScope]);

  const sourceAccount = userAccounts.find((a) => a.id === fromAccountId) ?? userAccounts[0];
  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);

    if (!sourceAccount || !effectiveToId) {
      setError('Select valid source and destination accounts.');
      return;
    }

    setIsSending(true);
    const res = await transferFunds({
      fromAccountId: sourceAccount.id,
      toAccountId: effectiveToId,
      amount: parsedAmount,
      memo,
      tags,
    });
    setIsSending(false);

    if (!res.ok) {
      setError(res.error ?? 'Transfer could not be completed.');
      return;
    }
    if (res.data) {
      setReceipt(res.data);
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
              Internal Fund Transfers
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Move simulated funds between your Finora accounts or to another Finora demo customer.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTransferScope('own');
                setError(null);
                setReceipt(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                transferScope === 'own'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Own Accounts</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransferScope('member');
                setError(null);
                setReceipt(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                transferScope === 'member'
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Finora Member</span>
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

          <div>
            <label
              htmlFor="tr-from"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              From Account
            </label>
            <select
              id="tr-from"
              value={sourceAccount?.id ?? ''}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              {userAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} · {maskAccountNumber(acc.accountNumber)} (
                  {formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tr-to"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {transferScope === 'own' ? 'To Your Finora Account' : 'To Finora Demo Recipient'}
            </label>
            {transferScope === 'own' && ownDestinationAccounts.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 dark:bg-[#071122] dark:border-slate-800 dark:text-slate-400">
                You only have one account right now. Open a second simulated account or switch to
                Finora Member transfers.
              </div>
            ) : (
              <select
                id="tr-to"
                value={effectiveToId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                {transferScope === 'own'
                  ? ownDestinationAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} · {maskAccountNumber(acc.accountNumber)} (
                        {formatCurrency(acc.balance)})
                      </option>
                    ))
                  : memberDestinationAccounts.map(({ account, ownerName }) => (
                      <option key={account.id} value={account.id}>
                        {ownerName} — {account.accountName} ({account.accountNumber})
                      </option>
                    ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="tr-amount"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Transfer Amount (LKR)
            </label>
            <input
              id="tr-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-lg font-mono tabular-nums font-semibold text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            />
          </div>

          <div>
            <label
              htmlFor="tr-memo"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Transfer Memo
            </label>
            <input
              id="tr-memo"
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g., Monthly reserve rebalance"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
          </div>

          <TagSelector compact selectedTags={tags} onChange={setTags} />

          <button
            type="submit"
            disabled={isSending || !effectiveToId || !sourceAccount}
            className="w-full py-3 px-5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
          >
            {isSending
              ? 'Processing Simulated Transfer...'
              : `Execute Internal Transfer (${formatCurrency(validAmount)})`}
          </button>
        </form>
      </GlassCard>

      <div className="xl:col-span-5 space-y-6">
        <GlassCard>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mb-4">
            Transfer Summary
          </h3>
          {sourceAccount ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Source Available</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC]">
                  {formatCurrency(sourceAccount.balance)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Transfer Amount</span>
                <span className="font-mono tabular-nums text-cyan-800 dark:text-cyan-300 font-semibold">
                  {formatCurrency(validAmount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Rail Fee</span>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(0)} (Internal)
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-800 dark:text-slate-300 font-medium">
                  Remaining Source Balance
                </span>
                <span
                  className={`font-mono tabular-nums text-lg font-bold ${
                    sourceAccount.balance - validAmount < 0
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-slate-900 dark:text-[#F0F6FC]'
                  }`}
                >
                  {formatCurrency(sourceAccount.balance - validAmount)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No source account available.
            </p>
          )}
        </GlassCard>

        {receipt && (
          <GlassCard className="border-emerald-500/45 dark:border-emerald-500/35">
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="font-display text-base font-semibold">Internal Transfer Settled</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Debit Reference</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC]">
                  {receipt.debitTx.referenceCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Credit Reference</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC]">
                  {receipt.creditTx.referenceCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Recipient</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {receipt.debitTx.merchantOrCounterparty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">New Source Balance</span>
                <span className="font-mono tabular-nums font-semibold text-cyan-800 dark:text-cyan-300">
                  {formatCurrency(receipt.debitTx.balanceAfter)}
                </span>
              </div>
              {receipt.debitTx.tags && receipt.debitTx.tags.length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600 dark:text-slate-400 shrink-0">Tags</span>
                  <span className="text-cyan-800 dark:text-cyan-300 text-right">
                    {receipt.debitTx.tags.join(' · ')}
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
