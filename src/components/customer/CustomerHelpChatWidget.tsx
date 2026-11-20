import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useBanking } from '../../context/BankingContext';
import { AppRoute } from '../../types/banking';
import { formatCurrency } from '../../utils/currency';

interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  routeLabel?: string;
  route?: AppRoute;
  buildAnswer: (ctx: {
    accountCount: number;
    totalBalance: number;
    alertThreshold: number;
    alertsEnabled: boolean;
  }) => string;
}

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actionLabel?: string;
  actionRoute?: AppRoute;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'faq-balances',
    question: 'How do account balances & daily limits work?',
    keywords: ['balance', 'limit', 'daily', 'account', 'accounts', 'apy', 'savings', 'vault', 'checking'],
    routeLabel: 'Manage Accounts',
    route: 'accounts',
    buildAnswer: ({ accountCount, totalBalance }) =>
      `You currently hold ${accountCount} simulated LKR ${accountCount === 1 ? 'account' : 'accounts'} with a combined balance of ${formatCurrency(totalBalance)}. Checking earns 0.45% APY, High-Yield Savings earns 7.25% APY, and Treasury Vault earns 8.50% APY. Each account enforces an editable daily withdrawal and transfer limit (starting at Rs. 25,000.00).`,
  },
  {
    id: 'faq-deposits',
    question: 'Are there limits on deposits & withdrawals?',
    keywords: ['deposit', 'withdraw', 'withdrawal', 'pending', 'flag', 'flagged', 'cefts', 'slips', 'rtgs'],
    routeLabel: 'Open Deposit / Withdraw',
    route: 'deposits-withdrawals',
    buildAnswer: () =>
      `Single simulated deposits and withdrawals support up to ${formatCurrency(50000000)} in educational mode. Transactions of ${formatCurrency(2500000)} or higher are automatically marked Pending for compliance review, and withdrawals cannot exceed your available balance or account daily limit.`,
  },
  {
    id: 'faq-transfers',
    question: 'How do internal fund transfers work?',
    keywords: ['transfer', 'transfers', 'send', 'move', 'internal', 'frozen', 'freeze'],
    routeLabel: 'Open Internal Transfers',
    route: 'transfers',
    buildAnswer: () =>
      `Internal transfers settle immediately between your own FINORA accounts or to another simulated member via the Finora Internal Rail. Transfers are blocked if either account is frozen or if your profile is restricted.`,
  },
  {
    id: 'faq-tags',
    question: 'How are transaction tags & budgets tracked?',
    keywords: ['tag', 'tags', 'category', 'categories', 'budget', 'goal', 'goals', 'spending', 'analysis'],
    routeLabel: 'View Transaction History',
    route: 'transactions',
    buildAnswer: () =>
      `You can assign tags like #Work, #Personal, or #Housing when creating or editing transactions. The dashboard Top Spending Tags card ranks your top 3 current-month tagged outflows, while Budget Goals tracks monthly LKR limits per spending category.`,
  },
  {
    id: 'faq-statements',
    question: 'How do I print or export a statement?',
    keywords: ['statement', 'statements', 'print', 'pdf', 'csv', 'download', 'export'],
    routeLabel: 'Open Statements',
    route: 'statements',
    buildAnswer: () =>
      `In Sample Statements, choose an account and billing cycle to download a CSV ledger, export a formatted HTML statement, or click Print to format the selected statement into a clean white-paper layout.`,
  },
  {
    id: 'faq-alerts',
    question: 'How do transaction alerts & biometrics work?',
    keywords: ['alert', 'alerts', 'push', 'notification', 'notifications', 'threshold', 'biometric', 'face', 'fingerprint', 'security', 'theme', 'light', 'dark'],
    routeLabel: 'Open Settings',
    route: 'settings',
    buildAnswer: ({ alertsEnabled, alertThreshold }) =>
      `Transaction Alerts are currently ${alertsEnabled ? `enabled above ${formatCurrency(alertThreshold)}` : 'paused'}. When enabled, deposits or withdrawals exceeding your threshold trigger a push-like alert. You can also toggle simulated Biometric Authentication and switch between Midnight Navy and High-Contrast Light themes in Settings.`,
  },
  {
    id: 'faq-sandbox',
    question: 'Is this real money or a simulation?',
    keywords: ['real', 'money', 'demo', 'sandbox', 'fake', 'educational', 'currency', 'lkr', 'rupees', 'convert', 'converter'],
    buildAnswer: () =>
      `FINORA is an educational banking simulator. All LKR (Rs.) balances, transfers, and statements are simulated locally in your browser—no real funds, bank accounts, or stored passwords are ever used. You can also estimate LKR conversions with the Quick Currency Converter on your dashboard.`,
  },
];

const findBestFaqMatch = (query: string): FaqEntry | null => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  const tokens = normalized.split(/[^a-z0-9#]+/).filter(Boolean);
  let bestEntry: FaqEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length >= 5 ? 3 : 2;
      } else if (tokens.some((t) => kw.startsWith(t) && t.length >= 3)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestScore > 0 ? bestEntry : null;
};

export const CustomerHelpChatWidget: React.FC = () => {
  const { currentUser, userAccounts, navigate } = useBanking();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const replyTimerRef = useRef<number | null>(null);

  const totalBalance = useMemo(
    () => userAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [userAccounts],
  );

  const firstName = currentUser?.fullName.split(' ')[0] ?? 'there';

  const makeWelcomeMessage = (): ChatMessage => ({
    id: 'welcome',
    sender: 'assistant',
    text: `Hi ${firstName}. Ask a question about your simulated LKR accounts, transfers, tags, alerts, or statements—or pick a quick topic below.`,
    timestamp: new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
  });

  useEffect(() => {
    setMessages([makeWelcomeMessage()]);
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (open) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isReplying]);

  if (!currentUser) return null;

  const faqContext = {
    accountCount: userAccounts.length,
    totalBalance,
    alertThreshold: currentUser.transactionAlertThreshold ?? 100000,
    alertsEnabled: currentUser.transactionAlertsEnabled ?? true,
  };

  const submitQuery = (questionText: string, directEntry?: FaqEntry) => {
    const trimmed = questionText.trim();
    if (!trimmed || isReplying) return;

    const nowTime = new Date().toLocaleTimeString('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsReplying(true);

    const matched = directEntry ?? findBestFaqMatch(trimmed);

    replyTimerRef.current = window.setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString('en-LK', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const assistantMsg: ChatMessage = matched
        ? {
            id: `bot_${Date.now()}`,
            sender: 'assistant',
            text: matched.buildAnswer(faqContext),
            timestamp: replyTime,
            actionLabel: matched.routeLabel,
            actionRoute: matched.route,
          }
        : {
            id: `bot_${Date.now()}`,
            sender: 'assistant',
            text: 'I could not match that to a pre-defined FAQ topic. Try asking about account balances, daily limits, deposits, transfers, transaction tags, statements, alerts, or biometrics.',
            timestamp: replyTime,
          };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsReplying(false);
    }, 220);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
  };

  const handleResetChat = () => {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current);
    }
    setIsReplying(false);
    setMessages([makeWelcomeMessage()]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 no-print flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            aria-label="FINORA Banking Help FAQ Chat"
            className="w-[calc(100vw-2rem)] sm:w-[390px] rounded-2xl bg-white border border-slate-300 shadow-[0_24px_56px_-12px_rgba(15,23,42,0.26)] dark:bg-[#0D182E] dark:border-cyan-400/35 dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-[#071122]/85">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-400/12 dark:border-cyan-400/30 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] truncate">
                    Banking Help & FAQ
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                    Simulated answers · Instant guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  aria-label="Reset help conversation"
                  title="Reset conversation"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-[#F0F6FC] dark:hover:bg-white/5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close help chat"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-[#F0F6FC] dark:hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick FAQ Topics */}
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1528]">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                Common Banking Questions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FAQ_ENTRIES.slice(0, 4).map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    disabled={isReplying}
                    onClick={() => submitQuery(faq.question, faq)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-300 hover:border-cyan-700 text-[11px] font-medium text-slate-700 hover:text-cyan-800 dark:bg-[#071122] dark:hover:bg-cyan-400/12 dark:border-slate-700/70 dark:hover:border-cyan-400/40 dark:text-slate-300 dark:hover:text-cyan-200 transition-colors cursor-pointer text-left"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Thread */}
            <div className="h-72 overflow-y-auto px-4 py-3.5 space-y-3 bg-slate-50/40 dark:bg-[#091326]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-cyan-700 text-white dark:bg-cyan-400 dark:text-[#05101F] font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 dark:bg-[#0D182E] dark:border-slate-700/60 dark:text-slate-200'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.actionRoute && msg.actionLabel && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate(msg.actionRoute!);
                          }}
                          className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 w-full flex items-center justify-between gap-2 text-[11px] font-semibold text-cyan-800 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-200 cursor-pointer"
                        >
                          <span>{msg.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      )}
                    </div>
                    <span className="mt-1 px-1 text-[10px] text-slate-500 dark:text-slate-500 font-mono tabular-nums">
                      {isUser ? 'You' : 'FINORA FAQ'} · {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isReplying && (
                <div className="flex items-start">
                  <div className="rounded-2xl px-3.5 py-2 bg-white border border-slate-200 text-xs text-slate-600 dark:bg-[#0D182E] dark:border-slate-700/60 dark:text-slate-400">
                    Looking up FAQ answer...
                  </div>
                </div>
              )}

              <div ref={listEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleFormSubmit}
              className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D182E] flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about balances, transfers, tags..."
                aria-label="Ask a banking help question"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isReplying}
                aria-label="Send help question"
                className="p-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 disabled:opacity-45 disabled:cursor-not-allowed text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Floating Help Launcher */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Close Help chat' : 'Open Banking Help chat'}
        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white shadow-lg dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] dark:shadow-[0_12px_30px_-8px_rgba(34,211,238,0.45)] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {open ? <X className="w-4 h-4 shrink-0" /> : <HelpCircle className="w-4 h-4 shrink-0" />}
        <span>{open ? 'Close Help' : 'Help'}</span>
      </button>
    </div>
  );
};
