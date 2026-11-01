import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Card, CategoryBar, InsightCard, MonthSwitcher, PrimaryButton, SectionHeader, SummaryCard, TrendChart, styles } from "@/components/budget-ui";
import { useBudget } from "@/lib/budget-context";
import { COLORS, formatCurrency, getBudget, getCategorySpending, getMonthTotals } from "@/lib/budget-store";

export default function HomeScreen() {
  const router = useRouter();
  const { state, hydrated, selectedMonth, setSelectedMonth } = useBudget();
  const totals = getMonthTotals(state, selectedMonth);

  const spending = useMemo(() => state.categories
    .map((category) => ({ category, spent: getCategorySpending(state, selectedMonth, category.id), budget: getBudget(state, selectedMonth, category.id) }))
    .filter((item) => item.spent > 0 || item.budget > 0)
    .sort((a, b) => b.spent - a.spent), [state, selectedMonth]);

  const insights = useMemo(() => {
    const items: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; tone: "calm" | "alert" | "info" }[] = [];
    const over = spending.find((item) => item.budget > 0 && item.spent > item.budget);
    if (over) {
      const percent = Math.round(((over.spent - over.budget) / over.budget) * 100);
      items.push({ icon: "trending-up-outline", title: "Um limite pede atenção", body: `A categoria ${over.category.name} está ${percent}% acima do orçamento. Talvez valha segurar os próximos pedidos.`, tone: "alert" });
    }
    if (totals.balance < 0) {
      items.push({ icon: "warning-outline", title: "Saldo no vermelho", body: "As despesas deste mês passaram das receitas registradas. Veja as maiores categorias antes de adicionar novos gastos.", tone: "alert" });
    } else if (totals.budgetRemaining >= 0 && totals.planned > 0) {
      items.push({ icon: "leaf-outline", title: "Você está no caminho", body: `${formatCurrency(totals.budgetRemaining)} ainda estão livres dentro dos limites que você definiu.`, tone: "calm" });
    }
    const top = spending[0];
    if (top && !over) {
      items.push({ icon: "pulse-outline", title: "Seu maior foco do mês", body: `${top.category.name} concentra ${formatCurrency(top.spent)} dos seus gastos até agora.`, tone: "info" });
    }
    return items.slice(0, 3);
  }, [spending, totals]);

  if (!hydrated) {
    return <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={COLORS.moss} /><Text style={{ color: COLORS.muted, marginTop: 10 }}>Abrindo seu orçamento…</Text></View>;
  }

  return (
    <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background">
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Orçar" title="Seu mês, sem achismo." subtitle="Um retrato calmo do que entra, sai e ainda pode ficar." right={<Pressable onPress={() => router.push("/settings")} style={styles.iconButton}><Ionicons name="settings-outline" size={19} color={COLORS.moss} /></Pressable>} />
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />

        <View style={[styles.balanceCard, { backgroundColor: COLORS.moss }]}>
          <View style={styles.balanceGradient}>
            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>SALDO DO MÊS</Text>
              <View style={styles.balanceBadge}><Text style={styles.balanceBadgeText}>{totals.balance >= 0 ? "sob controle" : "revisar agora"}</Text></View>
            </View>
            <Text style={styles.balanceValue}>{formatCurrency(totals.balance)}</Text>
            <Text style={styles.balanceMeta}>{totals.balance >= 0 ? "É isso que sobra depois das despesas registradas." : "As despesas já passaram das receitas registradas."}</Text>
            <View style={styles.balanceFooter}><View style={styles.balanceFooterLine} /><Text style={styles.balanceFooterText}>{formatCurrency(totals.planned)} em limites</Text></View>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Receitas" value={formatCurrency(totals.income)} icon="arrow-down-outline" tone="positive" hint="entradas" />
          <SummaryCard label="Despesas" value={formatCurrency(totals.expenses)} icon="arrow-up-outline" hint="já registradas" />
          <SummaryCard label="Livre no plano" value={formatCurrency(totals.budgetRemaining)} icon="sparkles-outline" tone={totals.budgetRemaining < 0 ? "warning" : "positive"} hint="nos limites" />
        </View>

        <View style={{ marginBottom: 8 }}><PrimaryButton label="Adicionar movimentação" icon="add-circle-outline" onPress={() => router.push("/transactions")} /></View>

        <SectionHeader title="Onde seu dinheiro foi" action="Ver tudo" onAction={() => router.push("/transactions")} />
        <Card>
          {spending.length ? spending.slice(0, 6).map(({ category, spent, budget }) => <CategoryBar key={category.id} name={category.name} color={category.color} spent={spent} budget={budget} icon={category.icon} />) : <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="pie-chart-outline" size={24} color={COLORS.moss} /></View><Text style={styles.emptyTitle}>Ainda não há gastos</Text><Text style={styles.emptyBody}>Adicione sua primeira despesa para começar a enxergar o mês.</Text></View>}
        </Card>

        <SectionHeader title="Ritmo dos últimos meses" />
        <Card><TrendChart state={state} month={selectedMonth} /></Card>

        <SectionHeader title="Leituras rápidas" />
        {insights.length ? insights.map((insight) => <InsightCard key={insight.title} {...insight} />) : <Card accent="moss"><Text style={{ color: COLORS.ink, fontWeight: "800" }}>Seu mês está pronto para ser lido.</Text><Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 5 }}>Defina alguns limites e registre movimentações para receber análises personalizadas.</Text></Card>}
      </ScrollView>
    </ScreenContainer>
  );
}
