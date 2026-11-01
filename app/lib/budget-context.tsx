import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  type Budget,
  type BudgetState,
  type Category,
  type Transaction,
  type TransactionType,
  createId,
  getMonthTransactions,
  loadBudgetState,
  monthKey,
  moveTransactionToMonth,
  persistBudgetState,
  shiftMonth,
} from "@/lib/budget-store";

export type BudgetContextValue = {
  state: BudgetState;
  hydrated: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  addTransaction: (input: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, input: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionStatus: (id: string) => void;
  addCategory: (name: string, color?: string, icon?: string) => Category;
  setBudget: (month: string, categoryId: string, amount: number) => void;
  copyPreviousMonth: (month: string) => void;
  importTransactions: (transactions: Transaction[], categories: Category[]) => void;
  clearAll: () => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetState>(() => ({ categories: [], transactions: [], budgets: [] }));
  const [hydrated, setHydrated] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  useEffect(() => {
    let mounted = true;
    loadBudgetState().then((loaded) => {
      if (!mounted) return;
      setState(loaded);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) void persistBudgetState(state);
  }, [hydrated, state]);

  const updateState = useCallback((updater: (current: BudgetState) => BudgetState) => {
    setState((current) => updater(current));
  }, []);

  const addTransaction = useCallback((input: Omit<Transaction, "id">) => {
    updateState((current) => ({ ...current, transactions: [{ ...input, id: createId("tx") }, ...current.transactions] }));
  }, [updateState]);

  const updateTransaction = useCallback((id: string, input: Omit<Transaction, "id">) => {
    updateState((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === id ? { ...input, id } : item) }));
  }, [updateState]);

  const deleteTransaction = useCallback((id: string) => {
    updateState((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  }, [updateState]);

  const toggleTransactionStatus = useCallback((id: string) => {
    updateState((current) => ({
      ...current,
      transactions: current.transactions.map((item) => item.id === id ? { ...item, status: item.status === "pending" ? "confirmed" : "pending" } : item),
    }));
  }, [updateState]);

  const addCategory = useCallback((name: string, color = "#52758A", icon = "pricetag-outline") => {
    const category: Category = { id: createId("cat"), name: name.trim(), color, icon };
    updateState((current) => ({ ...current, categories: [...current.categories, category] }));
    return category;
  }, [updateState]);

  const setBudget = useCallback((month: string, categoryId: string, amount: number) => {
    updateState((current) => {
      const existing = current.budgets.find((budget) => budget.month === month && budget.categoryId === categoryId);
      if (existing) {
        return {
          ...current,
          budgets: amount > 0
            ? current.budgets.map((budget) => budget === existing ? { ...budget, amount } : budget)
            : current.budgets.filter((budget) => budget !== existing),
        };
      }
      if (amount <= 0) return current;
      const budget: Budget = { month, categoryId, amount };
      return { ...current, budgets: [...current.budgets, budget] };
    });
  }, [updateState]);

  const copyPreviousMonth = useCallback((month: string) => {
    const previousMonth = shiftMonth(month, -1);
    updateState((current) => {
      const copiedTransactions = getMonthTransactions(current, previousMonth).map((transaction) => moveTransactionToMonth(transaction, month));
      const copiedBudgets = current.budgets
        .filter((budget) => budget.month === previousMonth)
        .map((budget) => ({ ...budget, month }));
      return {
        ...current,
        transactions: [...current.transactions.filter((transaction) => transaction.date.slice(0, 7) !== month), ...copiedTransactions],
        budgets: [...current.budgets.filter((budget) => budget.month !== month), ...copiedBudgets],
      };
    });
  }, [updateState]);

  const importTransactions = useCallback((transactions: Transaction[], categories: Category[]) => {
    updateState((current) => {
      const categoryIds = new Set(current.categories.map((category) => category.id));
      const mergedCategories = [...current.categories, ...categories.filter((category) => !categoryIds.has(category.id))];
      return { ...current, categories: mergedCategories, transactions: [...transactions, ...current.transactions] };
    });
  }, [updateState]);

  const clearAll = useCallback(() => {
    setState({ categories: [], transactions: [], budgets: [] });
  }, []);

  const value = useMemo<BudgetContextValue>(() => ({
    state,
    hydrated,
    selectedMonth,
    setSelectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    addCategory,
    setBudget,
    copyPreviousMonth,
    importTransactions,
    clearAll,
  }), [state, hydrated, selectedMonth, addTransaction, updateTransaction, deleteTransaction, toggleTransactionStatus, addCategory, setBudget, copyPreviousMonth, importTransactions, clearAll]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget precisa estar dentro de BudgetProvider");
  return context;
}

export type TransactionDraft = Omit<Transaction, "id"> & { id?: string; type: TransactionType };
