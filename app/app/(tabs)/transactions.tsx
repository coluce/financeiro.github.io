import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Card, Chip, Field, ModalSheet, MonthSwitcher, PrimaryButton, SectionHeader, SecondaryButton, styles } from "@/components/budget-ui";
import { useBudget } from "@/lib/budget-context";
import { COLORS, formatCurrency, formatDate, getCategory, getMonthTransactions, isValidISODate, todayISO, type Transaction, type TransactionType } from "@/lib/budget-store";

function askConfirmation(message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof globalThis.confirm === "function" && globalThis.confirm(message)) onConfirm();
    return;
  }
  Alert.alert("Excluir movimentação?", message, [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: onConfirm }]);
}

export default function TransactionsScreen() {
  const { state, hydrated, selectedMonth, setSelectedMonth, addTransaction, updateTransaction, deleteTransaction, toggleTransactionStatus } = useBudget();
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const visibleTransactions = useMemo(() => getMonthTransactions(state, selectedMonth)
    .filter((transaction) => filter === "all" || transaction.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date)), [state, selectedMonth, filter]);

  const openNew = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const openEdit = useCallback((transaction: Transaction) => { setEditing(transaction); setFormOpen(true); }, []);

  if (!hydrated) {
    return <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background"><View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={COLORS.moss} /><Text style={{ color: COLORS.muted, marginTop: 10 }}>Abrindo seus registros…</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background">
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Movimentações" title="Tudo no lugar." subtitle="Registre o que aconteceu e deixe o painel fazer as contas." />
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
        <View style={{ marginBottom: 17 }}><PrimaryButton label="Nova movimentação" icon="add-circle-outline" onPress={openNew} /></View>
        <View style={styles.chipRow}>
          <Chip label="Todas" selected={filter === "all"} onPress={() => setFilter("all")} icon="list-outline" />
          <Chip label="Receitas" selected={filter === "income"} onPress={() => setFilter("income")} icon="arrow-down-outline" />
          <Chip label="Despesas" selected={filter === "expense"} onPress={() => setFilter("expense")} icon="arrow-up-outline" />
        </View>
        <SectionHeader title={`${visibleTransactions.length} ${visibleTransactions.length === 1 ? "registro" : "registros"}`} />
        <Card>
          {visibleTransactions.length ? visibleTransactions.map((transaction) => {
            const category = getCategory(state, transaction.categoryId);
            const isIncome = transaction.type === "income";
            return (
              <Pressable key={transaction.id} onPress={() => openEdit(transaction)} style={({ pressed }) => [styles.transactionRow, pressed && { opacity: 0.68 }]}>
                <View style={[styles.transactionIcon, { backgroundColor: `${category?.color ?? COLORS.moss}18` }]}><Ionicons name={(category?.icon || "pricetag-outline") as keyof typeof Ionicons.glyphMap} size={18} color={category?.color ?? COLORS.moss} /></View>
                <View style={styles.transactionCopy}><Text style={styles.transactionDescription} numberOfLines={1}>{transaction.description}</Text><View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}><Text style={styles.transactionMeta}>{category?.name ?? "Sem categoria"} · {formatDate(transaction.date)}</Text><Pressable onPress={(event) => { event.stopPropagation(); toggleTransactionStatus(transaction.id); }} style={{ backgroundColor: transaction.status === "pending" ? COLORS.amberSoft : COLORS.mintSoft, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }}><Text style={{ color: transaction.status === "pending" ? COLORS.amber : COLORS.moss, fontSize: 9, fontWeight: "800" }}>{transaction.status === "pending" ? "Pendente" : "Confirmado"}</Text></Pressable></View></View>
                <Text style={[styles.transactionAmount, isIncome && styles.incomeAmount]}>{isIncome ? "+" : "−"}{formatCurrency(transaction.amount)}</Text>
                <Pressable accessibilityLabel="Excluir movimentação" hitSlop={8} onPress={(event) => { event.stopPropagation(); askConfirmation(`Excluir “${transaction.description}”?`, () => deleteTransaction(transaction.id)); }}><Ionicons name="trash-outline" size={17} color={COLORS.muted} /></Pressable>
              </Pressable>
            );
          }) : <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={24} color={COLORS.moss} /></View><Text style={styles.emptyTitle}>Nada por aqui ainda</Text><Text style={styles.emptyBody}>Registre uma receita ou despesa para acompanhar este mês.</Text><View style={{ marginTop: 15 }}><SecondaryButton label="Adicionar agora" icon="add" onPress={openNew} compact /></View></View>}
        </Card>
      </ScrollView>
      <TransactionForm key={`${editing?.id ?? "new"}-${formOpen}`} visible={formOpen} transaction={editing} categories={state.categories} onClose={() => setFormOpen(false)} onCreate={addTransaction} onUpdate={updateTransaction} />
    </ScreenContainer>
  );
}

function TransactionForm({ visible, transaction, categories, onClose, onCreate, onUpdate }: { visible: boolean; transaction: Transaction | null; categories: { id: string; name: string; color: string }[]; onClose: () => void; onCreate: (input: Omit<Transaction, "id">) => void; onUpdate: (id: string, input: Omit<Transaction, "id">) => void }) {
  const defaultCategory = categories.find((category) => category.name !== "Salário")?.id ?? categories[0]?.id ?? "";
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount).replace(".", ",") : "");
  const [date, setDate] = useState(transaction?.date ?? todayISO());
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? defaultCategory);
  const [error, setError] = useState("");

  const save = () => {
    const parsedAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setError("Digite um valor maior que zero."); return; }
    if (!isValidISODate(date)) { setError("Use uma data real no formato AAAA-MM-DD."); return; }
    if (!description.trim()) { setError("Dê um nome curto para esta movimentação."); return; }
    if (!categoryId) { setError("Escolha uma categoria."); return; }
    const input = { type, amount: parsedAmount, date, description: description.trim(), categoryId };
    if (transaction) onUpdate(transaction.id, input); else onCreate(input);
    onClose();
  };

  return (
    <ModalSheet visible={visible} title={transaction ? "Editar movimentação" : "Nova movimentação"} subtitle="Poucos campos. Um retrato mais fiel do seu mês." onClose={onClose}>
      <View style={styles.typeToggle}><Pressable onPress={() => setType("expense")} style={[styles.typeOption, type === "expense" && styles.typeOptionActive]}><Text style={[styles.typeOptionText, type === "expense" && styles.typeOptionTextActive]}>Despesa</Text></Pressable><Pressable onPress={() => setType("income")} style={[styles.typeOption, type === "income" && styles.typeOptionActive]}><Text style={[styles.typeOptionText, type === "income" && styles.typeOptionTextActive]}>Receita</Text></Pressable></View>
      <Field label="Valor" value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="numeric" />
      <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: mercado da semana" />
      <Field label="Data" value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" />
      <Text style={styles.fieldLabel}>Categoria</Text>
      <View style={styles.categoryPicker}>{categories.filter((category) => type === "income" ? category.name === "Salário" || category.name === "Outros" : category.name !== "Salário").map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.categoryPickerItem, categoryId === category.id && styles.categoryPickerItemActive]}><Text style={[styles.categoryPickerText, categoryId === category.id && styles.categoryPickerTextActive]}>{category.name}</Text></Pressable>)}</View>
      {error ? <Text style={{ color: COLORS.coral, fontSize: 12, marginBottom: 10 }}>{error}</Text> : null}
      <View style={styles.formActions}><View style={styles.formAction}><SecondaryButton label="Cancelar" onPress={onClose} /></View><View style={styles.formAction}><PrimaryButton label={transaction ? "Salvar" : "Adicionar"} icon="checkmark" onPress={save} /></View></View>
    </ModalSheet>
  );
}
