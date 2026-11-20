import React, { useMemo, useState } from 'react';
import { Bell, BellRing, CheckCheck, Shield, Trash2 } from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { NotificationCategory } from '../../types/banking';
import { GlassCard } from '../ui/GlassCard';

export const NotificationsView: React.FC = () => {
  const {
    userNotifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useBanking();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL');

  const filtered = useMemo(() => {
    return [...userNotifications]
      .filter((n) => categoryFilter === 'ALL' || n.category === categoryFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [categoryFilter, userNotifications]);

  return (
    <div className="max-w-4xl space-y-6">
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Notifications Center
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {unreadNotificationCount} unread alerts across transactions, security, and statements.
            </p>
          </div>

          <button
            type="button"
            disabled={unreadNotificationCount === 0}
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-cyan-700 disabled:opacity-45 text-xs font-semibold text-slate-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/50 dark:text-slate-200 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />
            <span>Mark All Read</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800 w-fit mb-5">
          {(['ALL', ...Object.values(NotificationCategory)] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat === 'ALL' ? 'All Alerts' : cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Bell className="w-7 h-7 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-sm text-slate-700 dark:text-slate-300">
              No notifications in this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {filtered.map((item) => {
              const isHighValueAlert =
                item.category === NotificationCategory.TRANSACTION &&
                item.title.toLowerCase().includes('alert');
              return (
                <div
                  key={item.id}
                  className={`py-4 flex items-start justify-between gap-4 transition-colors ${
                    item.read ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.category === NotificationCategory.SECURITY
                          ? 'bg-cyan-50 text-cyan-800 dark:bg-cyan-400/12 dark:text-cyan-300'
                          : isHighValueAlert
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.category === NotificationCategory.SECURITY ? (
                        <Shield className="w-4 h-4" />
                      ) : isHighValueAlert ? (
                        <BellRing className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        · {item.category} ·{' '}
                        {new Date(item.createdAt).toLocaleDateString('en-LK', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {!item.read && (
                        <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                          · Unread
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!item.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-cyan-700 text-[11px] font-medium text-cyan-800 dark:bg-[#071122] dark:border-slate-700/60 dark:hover:border-cyan-400/40 dark:text-cyan-300 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotification(item.id)}
                    aria-label="Delete notification"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
