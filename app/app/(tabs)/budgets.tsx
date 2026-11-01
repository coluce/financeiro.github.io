import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Card, Field, ModalSheet, MonthSwitcher, PrimaryButton, ProgressBar, SecondaryButton, SectionHeader, styles } from "@/components/budget-ui";
import { useBudget } from "@/lib/budget-context";
import { COLORS, formatCurrency, getBudget, getCategorySpending, getMonthTotals } from "@/lib/budget-store";

export default function BudgetsScreen() {
  const { state, hydrated, selectedMonth, setSelectedMonth, setBudget, addCategory } = useBudget();
  const [categoryModal, setCategoryModal] = useState(false);
  const totals = getMonthTotals(state, selectedMonth);
  const expenseCategories = useMemo(() => state.categories.filter((category) => category.name !== "Salário"), [state.categories]);

  if (!hydrated) {
    return <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background"><View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={COLORS.moss} /><Text style={{ color: COLORS.muted, marginTop: 10 }}>Abrindo seus limites…</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background">
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Planejamento" title="Dê um limite ao mês." subtitle="Orçamento bom é aquele que ajuda a decidir, não que aperta." />
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
        <Card accent="moss">
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}><View style={{ flex: 1, paddingRight: 14 }}><Text style={{ color: COLORS.moss, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>PLANO DO MÊS</Text><Text style={{ color: COLORS.ink, fontSize: 27, fontWeight: "800", marginTop: 8 }}>{formatCurrency(totals.planned)}</Text><Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>{formatCurrency(totals.expenses)} já usados · {formatCurrency(Math.max(totals.budgetRemaining, 0))} livres</Text></View><View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }}><Ionicons name="options-outline" size={23} color={COLORS.moss} /></View></View>
          <View style={{ marginTop: 17 }}><ProgressBar value={totals.expenses} max={totals.planned || 1} color={totals.budgetRemaining < 0 ? COLORS.coral : COLORS.moss} height={11} /></View>
        </Card>

        <SectionHeader title="Limites por categoria" action="Nova categoria" onAction={() => setCategoryModal(true)} />
        {expenseCategories.map((category) => <BudgetRow key={`${category.id}-${selectedMonth}`} name={category.name} color={category.color} icon={category.icon} spent={getCategorySpending(state, selectedMonth, category.id)} budget={getBudget(state, selectedMonth, category.id)} onSave={(value) => setBudget(selectedMonth, category.id, value)} />)}
        {!expenseCategories.length ? <Card><View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="layers-outline" size={24} color={COLORS.moss} /></View><Text style={styles.emptyTitle}>Crie sua primeira categoria</Text><Text style={styles.emptyBody}>Organize o orçamento do seu jeito e defina limites que façam sentido.</Text></View></Card> : null}
        <View style={{ marginTop: 10 }}><PrimaryButton label="Criar nova categoria" icon="add" onPress={() => setCategoryModal(true)} /></View>
        <Text style={{ color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 14 }}>Dica: deixe o limite em branco quando quiser apenas acompanhar uma categoria sem compará-la com um orçamento.</Text>
      </ScrollView>
      <CategoryForm visible={categoryModal} onClose={() => setCategoryModal(false)} onCreate={(name) => { addCategory(name); setCategoryModal(false); }} />
    </ScreenContainer>
  );
}

function BudgetRow({ name, color, icon, spent, budget, onSave }: { name: string; color: string; icon: string; spent: number; budget: number; onSave: (value: number) => void }) {
  const [value, setValue] = useState(budget ? String(budget).replace(".", ",") : "");
  const ratio = budget > 0 ? spent / budget : 0;
  const remaining = budget - spent;
  const save = () => {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    onSave(Number.isFinite(parsed) ? parsed : 0);
  };
  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetCardTop}><View style={[styles.categoryIcon, { backgroundColor: `${color}18` }]}><Ionicons name={(icon || "pricetag-outline") as keyof typeof Ionicons.glyphMap} size={18} color={color} /></View><View style={styles.budgetCardCopy}><Text style={styles.budgetCardName}>{name}</Text><Text style={styles.budgetCardHint}>{spent ? `${formatCurrency(spent)} usados` : "Nada registrado ainda"}</Text></View><TextInput value={value} onChangeText={setValue} onBlur={save} placeholder="sem limite" placeholderTextColor={COLORS.muted} keyboardType="numeric" style={styles.budgetInput} /></View>
      <View style={styles.budgetBottom}><ProgressBar value={spent} max={budget || Math.max(spent, 1)} color={ratio > 1 ? COLORS.coral : color} /><Text style={[styles.budgetRemaining, ratio > 1 && { color: COLORS.coral }]}>{budget ? (remaining >= 0 ? `${formatCurrency(remaining)} livres` : `${formatCurrency(Math.abs(remaining))} acima`) : "acompanhar"}</Text></View>
    </View>
  );
}

function CategoryForm({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const save = () => { if (name.trim().length < 2) { setError("Use pelo menos 2 caracteres."); return; } onCreate(name.trim()); setName(""); setError(""); };
  return <ModalSheet visible={visible} title="Nova categoria" subtitle="Crie um lugar claro para cada tipo de gasto." onClose={onClose}><Field label="Nome da categoria" value={name} onChangeText={setName} placeholder="Ex.: Cursos" />{error ? <Text style={{ color: COLORS.coral, fontSize: 12, marginBottom: 10 }}>{error}</Text> : null}<View style={styles.formActions}><View style={styles.formAction}><SecondaryButton label="Cancelar" onPress={onClose} /></View><View style={styles.formAction}><PrimaryButton label="Criar" icon="checkmark" onPress={save} /></View></View></ModalSheet>;
}
