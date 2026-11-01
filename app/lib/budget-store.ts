import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const STORAGE_KEY = "orcar-budget-v1";

export const COLORS = {
  ink: "#18332B",
  moss: "#315C4A",
  mossDark: "#24483A",
  mint: "#DCEDE4",
  mintSoft: "#EEF7F2",
  paper: "#FBFAF6",
  white: "#FFFFFF",
  line: "#DCE7E0",
  muted: "#74847B",
  fog: "#F2F5F2",
  coral: "#CF6A58",
  coralSoft: "#F8E8E3",
  amber: "#B87824",
  amberSoft: "#FFF1D8",
  blue: "#52758A",
  blueSoft: "#E7F0F4",
};

export const CATEGORY_COLORS = [
  "#315C4A",
  "#52758A",
  "#CF6A58",
  "#B87824",
  "#8A6F9D",
  "#5E8B73",
  "#C18E52",
];

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "confirmed";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  status?: TransactionStatus;
};

export type Budget = {
  month: string;
  categoryId: string;
  amount: number;
};

export type BudgetState = {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
};

export type ImportResult = {
  transactions: Transaction[];
  categories: Category[];
  errors: string[];
  validRows: number;
  totalRows: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function monthKey(input: Date | string = new Date()): string {
  const date = input instanceof Date ? input : new Date(`${input}T12:00:00`);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return monthKey(date);
}

export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export function shortMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(parsed)
    .replace(" de ", " ")
    .replace(".", "");
}

export function todayISO(): string {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function isTransactionInMonth(transaction: Transaction, month: string): boolean {
  return transaction.date.slice(0, 7) === month;
}

export function getCategory(state: BudgetState, categoryId: string): Category | undefined {
  return state.categories.find((category) => category.id === categoryId);
}

export function getBudget(state: BudgetState, month: string, categoryId: string): number {
  return state.budgets.find((budget) => budget.month === month && budget.categoryId === categoryId)?.amount ?? 0;
}

export function getMonthTransactions(state: BudgetState, month: string): Transaction[] {
  return state.transactions.filter((transaction) => isTransactionInMonth(transaction, month));
}

export function getMonthTotals(state: BudgetState, month: string) {
  const transactions = getMonthTransactions(state, month);
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const planned = state.budgets.filter((budget) => budget.month === month).reduce((sum, budget) => sum + budget.amount, 0);
  return {
    income,
    expenses,
    balance: income - expenses,
    planned,
    budgetRemaining: planned - expenses,
  };
}

export function getCategorySpending(state: BudgetState, month: string, categoryId: string): number {
  return getMonthTransactions(state, month)
    .filter((transaction) => transaction.type === "expense" && transaction.categoryId === categoryId)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function moveTransactionToMonth(transaction: Transaction, targetMonth: string): Transaction {
  const day = Math.min(Number(transaction.date.slice(8, 10)) || 1, daysInMonth(targetMonth));
  return {
    ...transaction,
    id: createId("copy"),
    date: `${targetMonth}-${pad(day)}`,
    status: "pending",
  };
}

function dateForMonth(month: string, day: number): string {
  return `${month}-${pad(day)}`;
}

export function makeDemoState(): BudgetState {
  const current = monthKey();
  const previous = shiftMonth(current, -1);
  const categories: Category[] = [
    { id: "housing", name: "Moradia", color: COLORS.moss, icon: "home-outline" },
    { id: "market", name: "Mercado", color: COLORS.blue, icon: "basket-outline" },
    { id: "restaurants", name: "Restaurantes", color: COLORS.coral, icon: "restaurant-outline" },
    { id: "transport", name: "Transporte", color: COLORS.amber, icon: "car-outline" },
    { id: "leisure", name: "Lazer", color: "#8A6F9D", icon: "sparkles-outline" },
    { id: "health", name: "Saúde", color: COLORS.blue, icon: "heart-outline" },
    { id: "salary", name: "Salário", color: COLORS.moss, icon: "briefcase-outline" },
  ];

  const transactions: Transaction[] = [
    { id: "demo-income", type: "income", amount: 5200, date: dateForMonth(current, 5), description: "Salário mensal", categoryId: "salary" },
    { id: "demo-rent", type: "expense", amount: 1600, date: dateForMonth(current, 6), description: "Aluguel", categoryId: "housing" },
    { id: "demo-market", type: "expense", amount: 620, date: dateForMonth(current, 9), description: "Compras do mês", categoryId: "market" },
    { id: "demo-restaurant-1", type: "expense", amount: 210, date: dateForMonth(current, 14), description: "Jantar de sexta", categoryId: "restaurants" },
    { id: "demo-restaurant-2", type: "expense", amount: 120, date: dateForMonth(current, 22), description: "Almoço fora", categoryId: "restaurants" },
    { id: "demo-transport", type: "expense", amount: 185, date: dateForMonth(current, 17), description: "Combustível e transporte", categoryId: "transport" },
    { id: "demo-leisure", type: "expense", amount: 180, date: dateForMonth(current, 25), description: "Cinema e passeio", categoryId: "leisure" },
    { id: "demo-health", type: "expense", amount: 90, date: dateForMonth(current, 28), description: "Farmácia", categoryId: "health" },
    { id: "demo-prev-income", type: "income", amount: 5200, date: dateForMonth(previous, 5), description: "Salário mensal", categoryId: "salary" },
    { id: "demo-prev-rent", type: "expense", amount: 1600, date: dateForMonth(previous, 6), description: "Aluguel", categoryId: "housing" },
    { id: "demo-prev-market", type: "expense", amount: 710, date: dateForMonth(previous, 11), description: "Compras do mês", categoryId: "market" },
    { id: "demo-prev-restaurant", type: "expense", amount: 190, date: dateForMonth(previous, 18), description: "Almoço de domingo", categoryId: "restaurants" },
    { id: "demo-prev-transport", type: "expense", amount: 240, date: dateForMonth(previous, 21), description: "Transporte", categoryId: "transport" },
  ];

  const budgets: Budget[] = [
    { month: current, categoryId: "housing", amount: 1800 },
    { month: current, categoryId: "market", amount: 750 },
    { month: current, categoryId: "restaurants", amount: 250 },
    { month: current, categoryId: "transport", amount: 300 },
    { month: current, categoryId: "leisure", amount: 280 },
    { month: current, categoryId: "health", amount: 180 },
    { month: previous, categoryId: "housing", amount: 1800 },
    { month: previous, categoryId: "market", amount: 750 },
    { month: previous, categoryId: "restaurants", amount: 250 },
    { month: previous, categoryId: "transport", amount: 300 },
    { month: previous, categoryId: "leisure", amount: 280 },
    { month: previous, categoryId: "health", amount: 180 },
  ];

  return { categories, transactions, budgets };
}

export function normalizeState(value: unknown): BudgetState {
  const fallback = makeDemoState();
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<BudgetState>;
  const categories = Array.isArray(candidate.categories)
    ? candidate.categories.filter((item): item is Category => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string"))
    : fallback.categories;
  const transactions = Array.isArray(candidate.transactions)
    ? candidate.transactions.filter((item): item is Transaction => Boolean(item && typeof item === "object" && typeof item.id === "string" && (item.type === "income" || item.type === "expense") && typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount > 0 && typeof item.date === "string" && isValidISODate(item.date) && typeof item.description === "string" && typeof item.categoryId === "string")).map((item) => ({ ...item, status: item.status === "pending" ? "pending" as const : "confirmed" as const }))
    : fallback.transactions;
  const budgets = Array.isArray(candidate.budgets)
    ? candidate.budgets.filter((item): item is Budget => Boolean(item && typeof item === "object" && typeof item.month === "string" && /^\d{4}-\d{2}$/.test(item.month) && typeof item.categoryId === "string" && typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount > 0))
    : fallback.budgets;
  return {
    categories,
    transactions,
    budgets,
  };
}

export async function loadBudgetState(): Promise<BudgetState> {
  try {
    if (Platform.OS === "web" && typeof globalThis.localStorage !== "undefined") {
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : makeDemoState();
    }
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : makeDemoState();
  } catch {
    return makeDemoState();
  }
}

export async function persistBudgetState(state: BudgetState): Promise<void> {
  const raw = JSON.stringify(state);
  try {
    if (Platform.OS === "web" && typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.setItem(STORAGE_KEY, raw);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Local persistence is best effort; the UI remains usable if storage is unavailable.
  }
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }
  return Number(cleaned.replace(",", "."));
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` === value;
}

export function parseTransactionsCsv(text: string, existingCategories: Category[]): ImportResult {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return { transactions: [], categories: existingCategories, errors: ["O arquivo precisa ter cabeçalho e pelo menos uma linha."], validRows: 0, totalRows: 0 };
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
  const findIndex = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const typeIndex = findIndex("tipo", "type");
  const amountIndex = findIndex("valor", "amount");
  const dateIndex = findIndex("data", "date");
  const descriptionIndex = findIndex("descricao", "description", "titulo");
  const categoryIndex = findIndex("categoria", "category");
  const statusIndex = findIndex("status", "situacao", "situação");
  const errors: string[] = [];
  const transactions: Transaction[] = [];
  const categories = [...existingCategories];

  if (typeIndex < 0 || amountIndex < 0 || dateIndex < 0 || categoryIndex < 0) {
    return { transactions: [], categories, errors: ["Cabeçalho inválido. Use tipo, valor, data e categoria."], validRows: 0, totalRows: lines.length - 1 };
  }

  lines.slice(1).forEach((line, rowIndex) => {
    const row = parseCsvLine(line, delimiter);
    const rawType = (row[typeIndex] ?? "").toLowerCase();
    const type: TransactionType | null = ["receita", "income", "entrada"].includes(rawType) ? "income" : ["despesa", "expense", "saida", "saída"].includes(rawType) ? "expense" : null;
    const amount = Math.abs(parseAmount(row[amountIndex] ?? ""));
    const date = row[dateIndex] ?? "";
    const description = row[descriptionIndex] || "Importado por CSV";
    const categoryName = row[categoryIndex] || "Outros";
    if (!type || !Number.isFinite(amount) || amount <= 0 || !isValidISODate(date) || !categoryName) {
      errors.push(`Linha ${rowIndex + 2}: tipo, valor, data ou categoria inválidos.`);
      return;
    }
    let category = categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());
    if (!category) {
      category = { id: createId("cat"), name: categoryName, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length], icon: "pricetag-outline" };
      categories.push(category);
    }
    transactions.push({ id: createId("csv"), type, amount, date, description, categoryId: category.id, status: statusIndex >= 0 && ["pendente", "pending"].includes((row[statusIndex] ?? "").toLowerCase()) ? "pending" : "confirmed" });
  });

  return { transactions, categories, errors, validRows: transactions.length, totalRows: lines.length - 1 };
}

function csvEscape(value: string | number): string {
  const stringValue = String(value);
  return /[;"\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

export function transactionsToCsv(state: BudgetState): string {
  const rows = ["tipo;valor;data;descricao;categoria;status"];
  const ordered = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  ordered.forEach((transaction) => {
    const category = getCategory(state, transaction.categoryId);
    rows.push([
      transaction.type === "income" ? "receita" : "despesa",
      transaction.amount.toFixed(2).replace(".", ","),
      transaction.date,
      transaction.description,
      category?.name ?? "Outros",
      transaction.status === "pending" ? "pendente" : "confirmado",
    ].map(csvEscape).join(";"));
  });
  return `\uFEFF${rows.join("\n")}`;
}
