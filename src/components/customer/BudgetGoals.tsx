import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { Transaction, TransactionStatus, TransactionType } from '../../types/banking';
import { formatCurrency } from '../../utils/currency';
import { GlassCard } from '../ui/GlassCard';

export interface BudgetGoalItem {
  id: string;
  category: string;
  monthlyLimit: number;
}

interface BudgetGoalsProps {
  userId: string;
  transactions: Transaction[];
}

const DEFAULT_GOALS: BudgetGoalItem[] = [
  { id: 'bg_housing', category: 'Housing & Utilities', monthlyLimit: 130000 },
  { id: 'bg_dining', category: 'Dining & Travel', monthlyLimit: 85000 },
  { id: 'bg_groceries', category: 'Groceries & Retail', monthlyLimit: 45000 },
  { id: 'bg_telecom', category: 'Telecom & Utilities', monthlyLimit: 25000 },
  { id: 'bg_transport', category: 'Transport', monthlyLimit: 30000 },
];

const SUGGESTED_CATEGORIES = [
  'Groceries & Retail',
  'Transport',
  'Housing & Utilities',
  'Dining & Travel',
  'Telecom & Utilities',
  'Equipment & Software',
  'Healthcare',
  'Education',
  'Simulated Disbursement',
];

const storageKeyForUser = (userId: string) => `finora_budget_goals_lkr_v1_${userId}`;

const loadGoals = (userId: string): BudgetGoalItem[] => {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw) as BudgetGoalItem[];
    if (!Array.isArray(parsed)) return DEFAULT_GOALS;
    return parsed.filter(
      (g) => typeof g.category === 'string' && Number.isFinite(g.monthlyLimit) && g.monthlyLimit > 0,
    );
  } catch {
    return DEFAULT_GOALS;
  }
};

export const BudgetGoals: React.FC<BudgetGoalsProps> = ({ userId, transactions }) => {
  const [goals, setGoals] = useState<BudgetGoalItem[]>(() => loadGoals(userId));

  // Add goal form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Transport');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [newLimitInput, setNewLimitInput] = useState<string>('35000');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline edit limit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimitInput, setEditLimitInput] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setGoals(loadGoals(userId));
    setEditingId(null);
    setShowAddForm(false);
  }, [userId]);

  const persistGoals = (next: BudgetGoalItem[]) => {
    setGoals(next);
    try {
      localStorage.setItem(storageKeyForUser(userId), JSON.stringify(next));
    } catch {
      // Ignore storage quota issues gracefully
    }
  };

  // Calculate November 2026 (current cycle) outgoing spend per category
  const monthlySpendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.status === TransactionStatus.REVERSED) return;
      const isOutgoing =
        tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.TRANSFER_OUT;
      if (!isOutgoing) return;

      const d = new Date(tx.createdAt);
      if (d.getFullYear() === 2026 && d.getMonth() === 10) {
        const key = tx.category.trim().toLowerCase();
        map.set(key, (map.get(key) ?? 0) + tx.amount);
      }
    });
    return map;
  }, [transactions]);

  const summary = useMemo(() => {
    const totalBudgeted = goals.reduce((sum, g) => sum + g.monthlyLimit, 0);
    const totalSpent = goals.reduce((sum, g) => {
      const spent = monthlySpendByCategory.get(g.category.trim().toLowerCase()) ?? 0;
      return sum + spent;
    }, 0);
    const overallPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;
    return { totalBudgeted, totalSpent, overallPct };
  }, [goals, monthlySpendByCategory]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const categoryName =
      selectedPreset === '__CUSTOM__' ? customCategory.trim() : selectedPreset.trim();
    const limitVal = Number(newLimitInput);

    if (!categoryName || categoryName.length < 2) {
      setFormError('Please enter a category name (at least 2 characters).');
      return;
    }
    if (!Number.isFinite(limitVal) || limitVal < 1000) {
      setFormError(`Monthly spending limit must be at least ${formatCurrency(1000)}.`);
      return;
    }
    if (goals.some((g) => g.category.toLowerCase() === categoryName.toLowerCase())) {
      setFormError(`A budget goal for "${categoryName}" already exists. Edit its limit below.`);
      return;
    }

    const next: BudgetGoalItem[] = [
      ...goals,
      {
        id: `bg_${Date.now().toString(36)}`,
        category: categoryName,
        monthlyLimit: Number(limitVal.toFixed(2)),
      },
    ];
    persistGoals(next);
    setShowAddForm(false);
    setCustomCategory('');
    setNewLimitInput('35000');
  };

  const handleStartEdit = (goal: BudgetGoalItem) => {
    setEditingId(goal.id);
    setEditLimitInput(String(goal.monthlyLimit));
    setEditError(null);
  };

  const handleSaveEdit = (goalId: string) => {
    const val = Number(editLimitInput);
    if (!Number.isFinite(val) || val < 1000) {
      setEditError(`Minimum limit is ${formatCurrency(1000)}.`);
      return;
    }
    const next = goals.map((g) =>
      g.id === goalId ? { ...g, monthlyLimit: Number(val.toFixed(2)) } : g,
    );
    persistGoals(next);
    setEditingId(null);
    setEditError(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    persistGoals(goals.filter((g) => g.id !== goalId));
    if (editingId === goalId) setEditingId(null);
  };

  const handleRestoreDefaults = () => {
    persistGoals(DEFAULT_GOALS);
    setShowAddForm(false);
  };

  return (
    <GlassCard>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-700 dark:text-cyan-300 shrink-0" />
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Budget Goals
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            November 2026 monthly LKR spending limits · Tracked against simulated outflows
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {goals.length > 0 && (
            <div className="hidden sm:block text-right pr-3 border-r border-slate-200 dark:border-slate-800/80">
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Monthly Utilization
              </div>
              <div className="font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-[#F0F6FC]">
                {formatCurrency(summary.totalSpent)} / {formatCurrency(summary.totalBudgeted)} (
                {summary.overallPct}%)
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowAddForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAddForm ? 'Close Form' : 'Add Goal'}</span>
          </button>
        </div>
      </div>

      {/* Add Budget Goal Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddGoal}
          className="pb-5 mb-5 border-b border-slate-200 dark:border-slate-800/80 space-y-3.5"
        >
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className={selectedPreset === '__CUSTOM__' ? 'sm:col-span-4' : 'sm:col-span-6'}>
              <label
                htmlFor="bg-cat"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Spending Category
              </label>
              <select
                id="bg-cat"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              >
                {SUGGESTED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__CUSTOM__">Custom Category...</option>
              </select>
            </div>

            {selectedPreset === '__CUSTOM__' && (
              <div className="sm:col-span-4">
                <label
                  htmlFor="bg-custom"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Custom Category Name
                </label>
                <input
                  id="bg-custom"
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g., Fitness & Wellness"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                />
              </div>
            )}

            <div className={selectedPreset === '__CUSTOM__' ? 'sm:col-span-2' : 'sm:col-span-4'}>
              <label
                htmlFor="bg-limit"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Monthly Limit (LKR)
              </label>
              <input
                id="bg-limit"
                type="number"
                min="1000"
                step="500"
                required
                value={newLimitInput}
                onChange={(e) => setNewLimitInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-[#05101F] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Save Goal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Goals Progress List */}
      {goals.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            No monthly budget goals configured yet.
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-xl bg-cyan-700 text-white dark:bg-cyan-400 dark:text-[#05101F] text-xs font-semibold cursor-pointer"
            >
              Create Budget Goal
            </button>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 hover:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-slate-200 dark:hover:border-cyan-400/40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {goals.map((goal) => {
            const spent = monthlySpendByCategory.get(goal.category.trim().toLowerCase()) ?? 0;
            const rawPct = goal.monthlyLimit > 0 ? (spent / goal.monthlyLimit) * 100 : 0;
            const barWidthPct = Math.min(100, Math.round(rawPct));
            const roundedPct = Math.round(rawPct);
            const remaining = goal.monthlyLimit - spent;

            const isExceeded = spent > goal.monthlyLimit;
            const isNearLimit = !isExceeded && rawPct >= 80;
            const isEditing = editingId === goal.id;

            return (
              <div key={goal.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] truncate">
                      {goal.category}
                    </span>
                    <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">
                      ·
                    </span>
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Over Limit</span>
                      </span>
                    ) : isNearLimit ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Near Limit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>On Track</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1000"
                          step="500"
                          aria-label={`Edit limit for ${goal.category}`}
                          value={editLimitInput}
                          onChange={(e) => setEditLimitInput(e.target.value)}
                          className="w-32 px-2.5 py-1 rounded-lg bg-white border border-cyan-700 text-xs font-mono tabular-nums text-slate-900 dark:bg-[#071122] dark:border-cyan-400/60 dark:text-[#F0F6FC] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(goal.id)}
                          aria-label="Save budget limit"
                          className="p-1.5 rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 dark:bg-cyan-400 dark:text-[#05101F] dark:hover:bg-cyan-300 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditError(null);
                          }}
                          aria-label="Cancel editing"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-right font-mono tabular-nums text-xs sm:text-sm">
                          <span
                            className={`font-semibold ${
                              isExceeded
                                ? 'text-rose-700 dark:text-rose-400'
                                : 'text-slate-900 dark:text-[#F0F6FC]'
                            }`}
                          >
                            {formatCurrency(spent)}
                          </span>
                          <span className="text-slate-500"> / </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatCurrency(goal.monthlyLimit)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(goal)}
                            aria-label={`Edit ${goal.category} limit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            aria-label={`Remove ${goal.category} goal`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && editError && (
                  <div className="text-xs text-rose-700 dark:text-rose-400 text-right">
                    {editError}
                  </div>
                )}

                {/* Progress Bar */}
                <div
                  role="progressbar"
                  aria-valuenow={roundedPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${goal.category} spending progress`}
                  className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800/90 overflow-hidden"
                >
                  <div
                    style={{ width: `${spent > 0 ? Math.max(2, barWidthPct) : 0}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? 'bg-rose-600 dark:bg-rose-400'
                        : isNearLimit
                          ? 'bg-amber-600 dark:bg-amber-400'
                          : 'bg-cyan-700 dark:bg-cyan-400'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-mono tabular-nums">{roundedPct}% used</span>
                  <span className="font-mono tabular-nums">
                    {remaining >= 0
                      ? `${formatCurrency(remaining)} remaining`
                      : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
