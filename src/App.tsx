/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerManagementView } from './components/admin/CustomerManagementView';
import { TransactionMonitoringView } from './components/admin/TransactionMonitoringView';
import { AuthScreen } from './components/auth/AuthScreen';
import { AccountsView } from './components/customer/AccountsView';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { DepositsWithdrawalsView } from './components/customer/DepositsWithdrawalsView';
import { StatementsView } from './components/customer/StatementsView';
import { TransactionsView } from './components/customer/TransactionsView';
import { TransfersView } from './components/customer/TransfersView';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { BiometricPromptModal } from './components/shared/BiometricPromptModal';
import { NotificationsView } from './components/shared/NotificationsView';
import { PushNotificationStack } from './components/shared/PushNotificationStack';
import { SettingsView } from './components/shared/SettingsView';
import { BankingProvider, useBanking } from './context/BankingContext';
import { UserRole } from './types/banking';

const FinoraWorkspace: React.FC = () => {
  const {
    currentUser,
    currentRoute,
    banner,
    dismissBanner,
    biometricPrompt,
    resolveBiometricPrompt,
    cancelBiometricPrompt,
  } = useBanking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <AuthScreen />;
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const renderRoute = () => {
    if (isAdmin) {
      switch (currentRoute) {
        case 'admin-dashboard':
          return <AdminDashboard />;
        case 'admin-customers':
          return <CustomerManagementView />;
        case 'admin-monitoring':
          return <TransactionMonitoringView />;
        case 'notifications':
          return <NotificationsView />;
        case 'settings':
          return <SettingsView />;
        default:
          return <AdminDashboard />;
      }
    }

    switch (currentRoute) {
      case 'dashboard':
        return <CustomerDashboard />;
      case 'accounts':
        return <AccountsView />;
      case 'deposits-withdrawals':
        return <DepositsWithdrawalsView />;
      case 'transfers':
        return <TransfersView />;
      case 'transactions':
        return <TransactionsView />;
      case 'statements':
        return <StatementsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#060D1A] dark:text-[#F0F6FC] flex transition-colors print-shell">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8 print-main">
          {banner && (
            <div
              role="status"
              className={`mb-6 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium no-print ${
                banner.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200'
                  : 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {banner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="truncate">{banner.text}</span>
              </div>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Dismiss message"
                className="p-1 rounded hover:bg-slate-900/5 dark:hover:bg-white/5 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {renderRoute()}
        </main>
      </div>

      <BiometricPromptModal
        open={biometricPrompt.open}
        reason={biometricPrompt.reason}
        onSuccess={resolveBiometricPrompt}
        onCancel={cancelBiometricPrompt}
      />

      <PushNotificationStack />
    </div>
  );
};

export default function App() {
  return (
    <BankingProvider>
      <FinoraWorkspace />
    </BankingProvider>
  );
}
