import React from 'react';
import { ArrowDownLeft, ArrowUpRight, BellRing, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useBanking } from '../../context/BankingContext';
import { formatCurrency } from '../../utils/currency';

export const PushNotificationStack: React.FC = () => {
  const { pushAlerts, dismissPushAlert, navigate } = useBanking();

  return (
    <div
      aria-live="polite"
      aria-label="Transaction push alerts"
      className="fixed top-20 right-5 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-3 pointer-events-none no-print"
    >
      <AnimatePresence initial={false}>
        {pushAlerts.map((alert) => {
          const isDeposit = alert.txType === 'deposit';
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              className="pointer-events-auto rounded-2xl bg-white/95 border border-slate-300 shadow-[0_18px_42px_-12px_rgba(15,23,42,0.22)] backdrop-blur-xl p-4 dark:bg-[#0B172C]/95 dark:border-cyan-400/40 dark:shadow-[0_18px_44px_-12px_rgba(0,0,0,0.65)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isDeposit
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/12 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/12 dark:border-amber-500/30 dark:text-amber-300'
                  }`}
                >
                  {isDeposit ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 min-w-0">
                      <BellRing className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {alert.isTest ? 'Push Alert Preview' : 'Transaction Push Alert'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissPushAlert(alert.id)}
                      aria-label="Dismiss push alert"
                      className="p-1 -mr-1 -mt-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#F0F6FC] dark:hover:bg-white/5 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] mt-0.5">
                    {alert.title}
                  </p>

                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-[#F0F6FC]">
                      {formatCurrency(alert.amount)}
                    </span>{' '}
                    {isDeposit ? 'credited to' : 'withdrawn from'} {alert.accountName}, exceeding
                    your{' '}
                    <span className="font-mono tabular-nums font-medium">
                      {formatCurrency(alert.threshold)}
                    </span>{' '}
                    threshold.
                  </p>

                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400 font-mono truncate">
                      {alert.referenceCode} ·{' '}
                      {new Date(alert.createdAt).toLocaleTimeString('en-LK', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        dismissPushAlert(alert.id);
                        navigate('notifications');
                      }}
                      className="font-semibold text-cyan-800 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open Alerts
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
