import React from 'react';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Bell,
  FileText,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { AppRoute, UserRole } from '../../types/banking';
import { FinoraLogo } from '../ui/FinoraLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentUser, currentRoute, navigate, signOut, unreadNotificationCount, ledger } =
    useBanking();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const pendingFlaggedCount = ledger.transactions.filter(
    (t) => t.status === 'Flagged' || t.status === 'Pending',
  ).length;

  const primaryNav: NavItem[] = isAdmin
    ? [
        { route: 'admin-dashboard', label: 'Admin Overview', icon: LayoutDashboard },
        { route: 'admin-customers', label: 'Customer Directory', icon: Users },
        {
          route: 'admin-monitoring',
          label: 'Monitoring & Audit',
          icon: ShieldAlert,
          badge: pendingFlaggedCount > 0 ? pendingFlaggedCount : undefined,
        },
      ]
    : [
        { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { route: 'accounts', label: 'Accounts', icon: Landmark },
        { route: 'deposits-withdrawals', label: 'Deposit & Withdraw', icon: ArrowUpDown },
        { route: 'transfers', label: 'Internal Transfers', icon: ArrowLeftRight },
        { route: 'transactions', label: 'Transaction History', icon: ListOrdered },
        { route: 'statements', label: 'Sample Statements', icon: FileText },
      ];

  const secondaryNav: NavItem[] = [
    {
      route: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
    },
    { route: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  const handleSelect = (route: AppRoute) => {
    navigate(route);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-300 dark:bg-[#071021] dark:border-slate-800/80 w-64 shrink-0">
      <div className="px-5 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/70">
        <FinoraLogo />
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-medium text-slate-500 dark:text-slate-500">
            {isAdmin ? 'Operations Console' : 'Banking Workspace'}
          </div>
          <nav className="space-y-1" aria-label="Primary navigation">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelect(item.route)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-600/40 dark:bg-cyan-400/12 dark:text-cyan-300 dark:border-cyan-400/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-[#F0F6FC] dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="font-mono tabular-nums text-xs font-semibold text-cyan-700 dark:text-cyan-300 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/70">
          <div className="px-3 mb-2 text-[11px] font-medium text-slate-500">Account</div>
          <nav className="space-y-1" aria-label="Secondary navigation">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelect(item.route)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-600/40 dark:bg-cyan-400/12 dark:text-cyan-300 dark:border-cyan-400/30'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-[#F0F6FC] dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="font-mono tabular-nums text-xs font-semibold text-cyan-700 dark:text-cyan-300 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/70 space-y-3">
        <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-[11px] text-slate-700 dark:bg-[#0B1730]/80 dark:border-slate-800 dark:text-slate-400 leading-relaxed">
          Educational Simulator · Simulated balances only
        </div>
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 dark:text-slate-300 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed rail */}
      <aside className="hidden lg:block sticky top-0 h-screen z-30 no-print">{navContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};
