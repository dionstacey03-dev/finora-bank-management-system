import React from 'react';
import { ArrowLeftRight, Bell, Menu, ShieldAlert } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { AppRoute, UserRole } from '../../types/banking';
import { Avatar } from '../ui/Avatar';

interface TopNavProps {
  onOpenMobileMenu: () => void;
}

const ROUTE_TITLES: Record<AppRoute, { title: string; section: string }> = {
  dashboard: { title: 'Dashboard', section: 'Customer Banking' },
  accounts: { title: 'Account Management', section: 'Customer Banking' },
  'deposits-withdrawals': { title: 'Deposits & Withdrawals', section: 'Customer Banking' },
  transfers: { title: 'Internal Fund Transfers', section: 'Customer Banking' },
  transactions: { title: 'Transaction History', section: 'Customer Banking' },
  statements: { title: 'Sample Account Statements', section: 'Customer Banking' },
  'admin-dashboard': { title: 'Administrator Overview', section: 'Operations & Compliance' },
  'admin-customers': { title: 'Customer Management', section: 'Operations & Compliance' },
  'admin-monitoring': { title: 'Transaction Monitoring & Audit', section: 'Operations & Compliance' },
  notifications: { title: 'Notifications', section: 'Preferences' },
  settings: { title: 'Profile & Security Settings', section: 'Preferences' },
};

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, currentRoute, navigate, unreadNotificationCount } = useBanking();
  if (!currentUser) return null;

  const meta = ROUTE_TITLES[currentRoute];
  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#060D1A]/85 backdrop-blur-xl border-b border-slate-300 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <span>FINORA</span>
            <span aria-hidden="true">/</span>
            <span>{meta.section}</span>
          </div>
          <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F0F6FC] truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => navigate('admin-monitoring')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Review Queue</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('transfers')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Send Transfer</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('notifications')}
          aria-label={`Notifications (${unreadNotificationCount} unread)`}
          className="relative p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-cyan-700 hover:border-cyan-700 dark:bg-[#0D182E] dark:border-slate-700/50 dark:text-slate-300 dark:hover:text-cyan-300 dark:hover:border-cyan-400/40 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-700 text-white dark:bg-cyan-400 dark:text-[#05101F] font-mono text-[10px] font-bold flex items-center justify-center">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('settings')}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
        >
          <Avatar src={currentUser.avatarUrl} name={currentUser.fullName} size="sm" />
          <div className="hidden md:block leading-tight">
            <div className="text-xs font-semibold text-slate-900 dark:text-[#F0F6FC] whitespace-nowrap">
              {currentUser.fullName}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {isAdmin ? 'Administrator' : 'Customer'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
