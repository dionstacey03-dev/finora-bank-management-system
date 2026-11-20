import React, { useEffect, useState } from 'react';
import {
  BellRing,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  Moon,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { maskAccountNumber } from '../../services/bankingService';
import { formatCurrency } from '../../utils/currency';
import { Avatar } from '../ui/Avatar';
import { GlassCard } from '../ui/GlassCard';

const ALERT_THRESHOLD_PRESETS = [25000, 100000, 250000, 1000000];

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    currentUser,
    userAccounts,
    updateProfile,
    triggerTestTransactionAlert,
    resetSandbox,
    requireBiometricVerification,
    lockBiometricSession,
  } = useBanking();

  const [fullName, setFullName] = useState(currentUser?.fullName ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [title, setTitle] = useState(currentUser?.title ?? '');
  const [currency] = useState<'LKR'>('LKR');
  const [twoFactor, setTwoFactor] = useState(currentUser?.twoFactorEnabled ?? false);
  const [loginAlerts, setLoginAlerts] = useState(currentUser?.loginAlertsEnabled ?? true);
  const [biometricAuth, setBiometricAuth] = useState(
    currentUser?.biometricAuthEnabled ?? false,
  );
  const [transactionAlertsEnabled, setTransactionAlertsEnabled] = useState(
    currentUser?.transactionAlertsEnabled ?? true,
  );
  const [alertThresholdInput, setAlertThresholdInput] = useState(
    String(currentUser?.transactionAlertThreshold ?? 100000),
  );
  const [alertError, setAlertError] = useState<string | null>(null);
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.fullName);
    setEmail(currentUser.email);
    setPhone(currentUser.phone);
    setTitle(currentUser.title);
    setTwoFactor(currentUser.twoFactorEnabled);
    setLoginAlerts(currentUser.loginAlertsEnabled);
    setBiometricAuth(currentUser.biometricAuthEnabled ?? false);
    setTransactionAlertsEnabled(currentUser.transactionAlertsEnabled ?? true);
    setAlertThresholdInput(String(currentUser.transactionAlertThreshold ?? 100000));
    setAlertError(null);
    setError(null);
  }, [currentUser]);

  if (!currentUser) return null;

  const isLightTheme = theme === 'light';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = updateProfile({
      fullName,
      email,
      phone,
      title,
      preferredCurrency: currency,
      twoFactorEnabled: twoFactor,
      loginAlertsEnabled: loginAlerts,
      biometricAuthEnabled: biometricAuth,
    });
    if (!res.ok) {
      setError(res.error ?? 'Failed to update profile.');
    }
  };

  const handleToggleBiometric = () => {
    if (!biometricAuth) {
      requireBiometricVerification(
        'Verify simulated face or fingerprint scan to enable Biometric Authentication',
        () => {
          setBiometricAuth(true);
          setSensitiveRevealed(false);
          updateProfile({ biometricAuthEnabled: true });
        },
        true,
      );
    } else {
      setBiometricAuth(false);
      setSensitiveRevealed(false);
      lockBiometricSession();
      updateProfile({ biometricAuthEnabled: false });
    }
  };

  const handleRevealSensitive = () => {
    if (sensitiveRevealed) {
      setSensitiveRevealed(false);
      if (biometricAuth) {
        lockBiometricSession();
      }
      return;
    }

    if (biometricAuth) {
      requireBiometricVerification(
        'Authenticate with Face or Fingerprint to reveal sensitive account details',
        () => setSensitiveRevealed(true),
        true,
      );
    } else {
      setSensitiveRevealed(true);
    }
  };

  const parsedThreshold = Number(alertThresholdInput);
  const thresholdPreviewValue =
    Number.isFinite(parsedThreshold) && parsedThreshold >= 1000
      ? parsedThreshold
      : currentUser.transactionAlertThreshold ?? 100000;

  const handleToggleTransactionAlerts = () => {
    const nextEnabled = !transactionAlertsEnabled;
    setTransactionAlertsEnabled(nextEnabled);
    setAlertError(null);
    updateProfile({ transactionAlertsEnabled: nextEnabled });
  };

  const handleSaveTransactionAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 1000 || parsedThreshold > 50000000) {
      setAlertError(
        `Enter an LKR threshold between ${formatCurrency(1000)} and ${formatCurrency(50000000)}.`,
      );
      return;
    }
    const res = updateProfile({
      transactionAlertsEnabled,
      transactionAlertThreshold: parsedThreshold,
    });
    if (!res.ok) {
      setAlertError(res.error ?? 'Failed to save transaction alert settings.');
    }
  };

  const handlePresetThreshold = (preset: number) => {
    setAlertThresholdInput(String(preset));
    setAlertError(null);
    updateProfile({
      transactionAlertsEnabled: true,
      transactionAlertThreshold: preset,
    });
    setTransactionAlertsEnabled(true);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <div className="xl:col-span-7 space-y-6">
        <GlassCard>
        <div className="flex items-center gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-slate-800/80">
          <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="lg" />
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentUser.role} · Joined{' '}
              {new Date(currentUser.joinedAt).toLocaleDateString('en-LK', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="set-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="set-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Demo Email
              </label>
              <input
                id="set-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                id="set-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="set-currency" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Ledger Currency
              </label>
              <input
                id="set-currency"
                type="text"
                readOnly
                value="LKR (Rs. — Sri Lankan Rupee)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-sm text-cyan-800 font-medium focus:outline-none cursor-default dark:bg-[#071122]/70 dark:border-slate-700/50 dark:text-cyan-300"
              />
            </div>
          </div>

          <div>
            <label htmlFor="set-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Role / Title
            </label>
            <input
              id="set-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Security Preferences (Simulated)
            </h3>

            {/* Simulated Biometric Authentication Toggle */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-start gap-3">
                <Fingerprint className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    Biometric Authentication
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Require a simulated face or fingerprint check before revealing sensitive account
                    numbers
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={biometricAuth}
                aria-label="Toggle Biometric Authentication"
                onClick={handleToggleBiometric}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                  biometricAuth
                    ? 'bg-cyan-700 border-cyan-700 dark:bg-cyan-400 dark:border-cyan-300'
                    : 'bg-slate-200 border-slate-300 dark:bg-[#071122] dark:border-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    biometricAuth ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-[1px]`}
                />
              </button>
            </div>

            <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Simulated Two-Factor Verification
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Demonstrates multi-factor prompt readiness for production integration
                </div>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="w-4 h-4 accent-cyan-700 dark:accent-cyan-400 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Login & Transfer Alerts
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Generate in-app notifications on simulated balance movements
                </div>
              </div>
              <input
                type="checkbox"
                checked={loginAlerts}
                onChange={(e) => setLoginAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-700 dark:accent-cyan-400 cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </form>
      </GlassCard>

        {/* Transaction Alerts Setting */}
        <GlassCard>
          <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-400/12 dark:border-cyan-400/30 dark:text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  Transaction Alerts
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Push-like notifications when simulated deposits or withdrawals exceed your LKR
                  threshold
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={transactionAlertsEnabled}
              aria-label="Toggle Transaction Alerts"
              onClick={handleToggleTransactionAlerts}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                transactionAlertsEnabled
                  ? 'bg-cyan-700 border-cyan-700 dark:bg-cyan-400 dark:border-cyan-300'
                  : 'bg-slate-200 border-slate-300 dark:bg-[#071122] dark:border-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  transactionAlertsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                } mt-[1px]`}
              />
            </button>
          </div>

          <form onSubmit={handleSaveTransactionAlerts} className="space-y-4">
            {alertError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200">
                {alertError}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="set-alert-threshold"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Alert Threshold (LKR)
                </label>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                  {transactionAlertsEnabled
                    ? `Active above ${formatCurrency(thresholdPreviewValue)}`
                    : 'Alerts paused'}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                  Rs.
                </span>
                <input
                  id="set-alert-threshold"
                  type="number"
                  min={1000}
                  max={50000000}
                  step="100"
                  disabled={!transactionAlertsEnabled}
                  value={alertThresholdInput}
                  onChange={(e) => {
                    setAlertThresholdInput(e.target.value);
                    if (alertError) setAlertError(null);
                  }}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 disabled:opacity-55 disabled:cursor-not-allowed dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
                />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {ALERT_THRESHOLD_PRESETS.map((preset) => {
                  const isActive = Number(alertThresholdInput) === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetThreshold(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tabular-nums border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-cyan-50 border-cyan-700 text-cyan-800 font-semibold dark:bg-cyan-400/15 dark:border-cyan-400/50 dark:text-cyan-300'
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-slate-300 dark:hover:border-cyan-400/40'
                      }`}
                    >
                      {formatCurrency(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={!transactionAlertsEnabled}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-45 disabled:cursor-not-allowed text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Alert Threshold</span>
              </button>

              <button
                type="button"
                disabled={!transactionAlertsEnabled}
                onClick={() => triggerTestTransactionAlert(thresholdPreviewValue)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 hover:border-cyan-700 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Test Push Alert</span>
              </button>
            </div>
          </form>
        </GlassCard>
      </div>

      <div className="xl:col-span-5 space-y-6">
        {/* Display Theme Switcher */}
        <GlassCard>
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              {isLightTheme ? (
                <Sun className="w-4 h-4 text-cyan-700 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-300 shrink-0" />
              )}
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  Workspace Appearance
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Switch between Midnight Navy and High-Contrast Light
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLightTheme}
              aria-label="Switch to High-Contrast Light theme"
              onClick={() => setTheme(isLightTheme ? 'dark' : 'light')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors ${
                isLightTheme
                  ? 'bg-cyan-700 border-cyan-700'
                  : 'bg-[#071122] border-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  isLightTheme ? 'translate-x-5' : 'translate-x-0.5'
                } mt-[1px]`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-cyan-400/12 border-cyan-400/50 text-[#F0F6FC]'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 dark:bg-[#071122] dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <Moon className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
                  <span>Midnight Navy</span>
                </span>
                <span className="w-4 h-4 rounded bg-[#060D1A] border border-cyan-400/60 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Deep navy canvas with electric cyan accents
              </p>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-cyan-50 border-cyan-700 text-slate-900'
                  : 'bg-[#071122] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <Sun className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-300" />
                  <span>High-Contrast Light</span>
                </span>
                <span className="w-4 h-4 rounded bg-white border border-slate-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Crisp white cards with high-contrast slate ink
              </p>
            </button>
          </div>

          <p className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
            Active theme:{' '}
            <strong className="text-slate-900 dark:text-[#F0F6FC]">
              {isLightTheme ? 'High-Contrast Light' : 'Midnight Navy (Default)'}
            </strong>{' '}
            · Saved automatically to this browser
          </p>
        </GlassCard>

        {/* Sensitive Account Details Protected by Biometric Check */}
        <GlassCard>
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0" />
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
                Sensitive Account Details
              </h3>
            </div>
            <button
              type="button"
              onClick={handleRevealSensitive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 hover:border-cyan-700 text-xs font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-cyan-300 cursor-pointer"
            >
              {sensitiveRevealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Details</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{biometricAuth ? 'Verify & Reveal' : 'Reveal Details'}</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600 dark:text-slate-400">Profile Reference ID</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">
                {sensitiveRevealed ? currentUser.id : 'usr_••••••••'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600 dark:text-slate-400">Biometric Protection</span>
              <span
                className={
                  biometricAuth
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }
              >
                {biometricAuth ? 'Enabled (Face / Fingerprint)' : 'Disabled'}
              </span>
            </div>
            {userAccounts.length > 0 ? (
              userAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="pt-2.5 border-t border-slate-200 dark:border-slate-800/70 flex items-center justify-between gap-3"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate">{acc.accountName}</span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-[#F0F6FC] shrink-0">
                    {sensitiveRevealed ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                  </span>
                </div>
              ))
            ) : (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/70 flex items-center justify-between gap-3">
                <span className="text-slate-600 dark:text-slate-400">Compliance Access Level</span>
                <span className="font-mono text-slate-900 dark:text-[#F0F6FC]">
                  {sensitiveRevealed ? 'OPS-TIER-1-CLEARANCE' : 'OPS-••••-••••••••'}
                </span>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2.5 text-cyan-800 dark:text-cyan-300 mb-3">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Security & Backend Readiness
            </h3>
          </div>
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              FINORA separates <strong>Demo Authentication</strong> (strictly in-memory session
              state) from <strong>Production Authentication</strong> (adapter-ready for HttpOnly
              cookies & OAuth2/OIDC endpoints).
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              No passwords, PINs, or access tokens are stored in localStorage. Only non-sensitive
              educational ledger records are persisted locally so your simulated balances survive
              page reloads.
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-[#F0F6FC] mb-2">
            Reset Educational Sandbox
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Restore all simulated accounts, transactions, notifications, and audit history back to
            their initial seed values.
          </p>
          <button
            type="button"
            onClick={resetSandbox}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:border-amber-500 text-xs font-semibold text-amber-900 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-amber-400/50 dark:text-amber-300 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Ledger Data</span>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
