import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { GlassCard } from '../ui/GlassCard';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  ratePerLKR: number;
  decimals: number;
}

const STATIC_CURRENCIES: CurrencyOption[] = [
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs.', ratePerLKR: 1.0, decimals: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', ratePerLKR: 1 / 292.5, decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', ratePerLKR: 0.92 / 292.5, decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', ratePerLKR: 0.79 / 292.5, decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', ratePerLKR: 84.4 / 292.5, decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', ratePerLKR: 1.52 / 292.5, decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', ratePerLKR: 1.34 / 292.5, decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', ratePerLKR: 153.4 / 292.5, decimals: 0 },
];

interface QuickCurrencyConverterProps {
  totalBalance?: number;
  balanceButtonLabel?: string;
}

export const QuickCurrencyConverter: React.FC<QuickCurrencyConverterProps> = ({
  totalBalance,
  balanceButtonLabel = 'Use Combined LKR Balance',
}) => {
  const [fromCode, setFromCode] = useState<string>('LKR');
  const [toCode, setToCode] = useState<string>('USD');
  const [amountInput, setAmountInput] = useState<string>('125000');

  const fromCurrency = useMemo(
    () => STATIC_CURRENCIES.find((c) => c.code === fromCode) ?? STATIC_CURRENCIES[0],
    [fromCode],
  );

  const toCurrency = useMemo(
    () => STATIC_CURRENCIES.find((c) => c.code === toCode) ?? STATIC_CURRENCIES[1],
    [toCode],
  );

  const parsedAmount = Number(amountInput);
  const isValidAmount =
    amountInput.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0;

  const { exchangeRate, convertedAmount } = useMemo(() => {
    const rate = toCurrency.ratePerLKR / fromCurrency.ratePerLKR;
    const result = isValidAmount ? parsedAmount * rate : 0;
    return {
      exchangeRate: rate,
      convertedAmount: result,
    };
  }, [fromCurrency.ratePerLKR, isValidAmount, parsedAmount, toCurrency.ratePerLKR]);

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const formattedOutput =
    toCurrency.code === 'LKR'
      ? formatCurrency(convertedAmount)
      : `${toCurrency.symbol} ${new Intl.NumberFormat('en-LK', {
          minimumFractionDigits: toCurrency.decimals,
          maximumFractionDigits: toCurrency.decimals,
        }).format(convertedAmount)}`;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0" />
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Quick Currency Converter
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Static LKR educational reference rates · Cross-currency estimator
          </p>
        </div>

        {typeof totalBalance === 'number' && totalBalance > 0 && (
          <button
            type="button"
            onClick={() => {
              setFromCode('LKR');
              setAmountInput(totalBalance.toFixed(2));
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-cyan-700 text-xs font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 transition-colors whitespace-nowrap max-w-full truncate cursor-pointer"
          >
            {balanceButtonLabel}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* Amount Input */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <label
              htmlFor="fx-amount"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Amount ({fromCurrency.code})
            </label>
            <div className="flex items-center gap-1">
              {[25000, 125000, 500000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountInput(String(preset))}
                  className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-300 hover:border-cyan-700 text-[11px] font-mono tabular-nums text-slate-800 dark:bg-[#071122] dark:border-slate-800 dark:hover:border-cyan-400/40 dark:text-slate-300 cursor-pointer"
                >
                  {preset.toLocaleString('en-LK')}
                </button>
              ))}
            </div>
          </div>
          <input
            id="fx-amount"
            type="number"
            min="0"
            step="any"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="0.00"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
          />
        </div>

        {/* From / Swap / To Controls */}
        <div className="lg:col-span-5 grid grid-cols-[1fr_auto_1fr] gap-2.5 items-end">
          <div>
            <label
              htmlFor="fx-from"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              From
            </label>
            <select
              id="fx-from"
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              {STATIC_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap source and target currencies"
            title="Swap currencies"
            className="h-[42px] px-3 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div>
            <label
              htmlFor="fx-to"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              To
            </label>
            <select
              id="fx-to"
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            >
              {STATIC_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Converted Output Readout */}
        <div className="lg:col-span-3 lg:text-right pt-2 lg:pt-0 lg:pl-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-800/80">
          <div className="text-xs text-slate-600 dark:text-slate-400">Estimated Equivalent</div>
          {!isValidAmount ? (
            <div className="text-xs text-rose-700 dark:text-rose-400 mt-1.5 font-medium">
              Enter a non-negative amount
            </div>
          ) : (
            <>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-cyan-800 dark:text-cyan-300 mt-0.5 truncate">
                {formattedOutput}{' '}
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {toCurrency.code}
                </span>
              </div>
              <div className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                1 {fromCurrency.code} = {exchangeRate.toFixed(6)} {toCurrency.code}
              </div>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
