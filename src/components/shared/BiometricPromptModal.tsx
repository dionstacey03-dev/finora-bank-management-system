import React, { useEffect, useState } from 'react';
import { CheckCircle2, Fingerprint, ScanFace, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface BiometricPromptModalProps {
  open: boolean;
  reason: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type BiometricMethod = 'fingerprint' | 'face';
type ScanStage = 'idle' | 'scanning' | 'verified' | 'failed';

export const BiometricPromptModal: React.FC<BiometricPromptModalProps> = ({
  open,
  reason,
  onSuccess,
  onCancel,
}) => {
  const [method, setMethod] = useState<BiometricMethod>('fingerprint');
  const [stage, setStage] = useState<ScanStage>('idle');

  useEffect(() => {
    if (open) {
      setStage('idle');
    }
  }, [open]);

  if (!open) return null;

  const runSimulatedScan = (shouldFail = false) => {
    setStage('scanning');
    setTimeout(() => {
      if (shouldFail) {
        setStage('failed');
        return;
      }
      setStage('verified');
      setTimeout(() => {
        onSuccess();
      }, 450);
    }, 750);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="biometric-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-300 dark:bg-[#0D182E] dark:border-slate-700/60 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-700 dark:text-cyan-300 shrink-0" />
            <div>
              <h3 id="biometric-modal-title" className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Simulated Biometric Verification
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{reason}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel biometric check"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800 my-5">
          <button
            type="button"
            disabled={stage === 'scanning' || stage === 'verified'}
            onClick={() => {
              setMethod('fingerprint');
              setStage('idle');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              method === 'fingerprint'
                ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Fingerprint</span>
          </button>
          <button
            type="button"
            disabled={stage === 'scanning' || stage === 'verified'}
            onClick={() => {
              setMethod('face');
              setStage('idle');
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              method === 'face'
                ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>Face Recognition</span>
          </button>
        </div>

        {/* Scanner Visual */}
        <div className="py-5 flex flex-col items-center text-center space-y-3">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              stage === 'verified'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-400/50 dark:text-emerald-400'
                : stage === 'failed'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-500/15 dark:border-rose-400/50 dark:text-rose-400'
                  : stage === 'scanning'
                    ? 'bg-cyan-50 border-cyan-700 text-cyan-800 dark:bg-cyan-400/15 dark:border-cyan-400 dark:text-cyan-300 scale-105'
                    : 'bg-slate-100 border-slate-300 text-cyan-700 dark:bg-[#071122] dark:border-slate-700/70 dark:text-cyan-300'
            }`}
          >
            {stage === 'verified' ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : stage === 'failed' ? (
              <ShieldAlert className="w-10 h-10" />
            ) : method === 'fingerprint' ? (
              <Fingerprint className={`w-10 h-10 ${stage === 'scanning' ? 'animate-pulse' : ''}`} />
            ) : (
              <ScanFace className={`w-10 h-10 ${stage === 'scanning' ? 'animate-pulse' : ''}`} />
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
              {stage === 'idle' &&
                (method === 'fingerprint'
                  ? 'Ready for simulated fingerprint scan'
                  : 'Ready for simulated face verification')}
              {stage === 'scanning' &&
                (method === 'fingerprint'
                  ? 'Validating fingerprint signature...'
                  : 'Verifying facial geometry...')}
              {stage === 'verified' && 'Biometric Identity Confirmed'}
              {stage === 'failed' && 'Biometric Match Failed'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
              {stage === 'failed'
                ? 'Simulated mismatch detected. Retry verification to unlock sensitive account details.'
                : 'Educational simulation — no real device biometric sensors or credentials are accessed.'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            disabled={stage === 'scanning' || stage === 'verified'}
            onClick={() => runSimulatedScan(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 disabled:opacity-60 dark:text-[#05101F] text-xs font-semibold transition-colors cursor-pointer"
          >
            {stage === 'scanning'
              ? 'Verifying...'
              : stage === 'verified'
                ? 'Unlocked'
                : stage === 'failed'
                  ? 'Retry Verification'
                  : method === 'fingerprint'
                    ? 'Simulate Fingerprint Match'
                    : 'Simulate Face Match'}
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={stage === 'scanning' || stage === 'verified'}
              onClick={() => runSimulatedScan(true)}
              className="text-[11px] text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 underline underline-offset-4 cursor-pointer disabled:opacity-40"
            >
              Simulate Failed Match
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
