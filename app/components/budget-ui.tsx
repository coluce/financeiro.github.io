import { Ionicons } from "@expo/vector-icons";
import { useMemo, type ReactNode } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { COLORS, formatCurrency, monthLabel, shortMonthLabel, shiftMonth } from "@/lib/budget-store";

export const FONT = Platform.select({
  web: "Avenir Next, ui-rounded, system-ui, sans-serif",
  ios: "Avenir Next",
  default: "sans-serif",
});

export function AppHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <View style={styles.monthSwitcher}>
      <Pressable accessibilityLabel="Mês anterior" onPress={() => onChange(shiftMonth(month, -1))} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={18} color={COLORS.ink} />
      </Pressable>
      <View style={styles.monthTitleWrap}>
        <Text style={styles.monthKicker}>PERÍODO</Text>
        <Text style={styles.monthTitle}>{monthLabel(month)}</Text>
      </View>
      <Pressable accessibilityLabel="Próximo mês" onPress={() => onChange(shiftMonth(month, 1))} style={styles.iconButton}>
        <Ionicons name="chevron-forward" size={18} color={COLORS.ink} />
      </Pressable>
    </View>
  );
}

export function PrimaryButton({ label, icon = "add", onPress, compact = false }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, compact && styles.compactButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={compact ? 16 : 18} color={COLORS.white} />
      <Text style={[styles.primaryButtonText, compact && styles.compactButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, icon, onPress, compact = false }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, compact && styles.compactSecondary, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={COLORS.moss} /> : null}
      <Text style={[styles.secondaryButtonText, compact && styles.compactButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: object; accent?: "moss" | "coral" | "blue" }) {
  return (
    <View style={[styles.card, accent === "moss" && styles.cardMoss, accent === "coral" && styles.cardCoral, accent === "blue" && styles.cardBlue, style]}>
      {children}
    </View>
  );
}

export function SummaryCard({ label, value, icon, tone = "neutral", hint }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone?: "neutral" | "positive" | "warning"; hint?: string }) {
  return (
    <View style={[styles.summaryCard, tone === "positive" && styles.summaryPositive, tone === "warning" && styles.summaryWarning]}>
      <View style={styles.summaryIcon}><Ionicons name={icon} size={17} color={tone === "warning" ? COLORS.coral : COLORS.moss} /></View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {hint ? <Text style={styles.summaryHint}>{hint}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function ProgressBar({ value, max, color = COLORS.moss, height = 9 }: { value: number; max: number; color?: string; height?: number }) {
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function CategoryBar({ name, color, spent, budget, icon }: { name: string; color: string; spent: number; budget: number; icon: string }) {
  const over = budget > 0 && spent > budget;
  return (
    <View style={styles.categoryRow}>
      <View style={[styles.categoryIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={(icon || "pricetag-outline") as keyof typeof Ionicons.glyphMap} size={17} color={color} />
      </View>
      <View style={styles.categoryBody}>
        <View style={styles.categoryLine}>
          <Text style={styles.categoryName}>{name}</Text>
          <Text style={[styles.categoryAmount, over && styles.overText]}>{formatCurrency(spent)}</Text>
        </View>
        <View style={styles.categoryLine}>
          <ProgressBar value={spent} max={budget || Math.max(spent, 1)} color={over ? COLORS.coral : color} />
          <Text style={styles.categoryBudget}>{budget > 0 ? `de ${formatCurrency(budget)}` : "sem limite"}</Text>
        </View>
      </View>
    </View>
  );
}

export function TrendChart({ state, month }: { state: Parameters<typeof getSeries>[0]; month: string }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(290, Math.min(width - 48, 520));
  const height = 190;
  const paddingX = 12;
  const paddingTop = 16;
  const paddingBottom = 34;
  const series = useMemo(() => getSeries(state, month), [state, month]);
  const max = Math.max(...series.map((item) => item.value), 1);
  const points = series.map((item, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(series.length - 1, 1);
    const y = paddingTop + (1 - item.value / max) * (height - paddingTop - paddingBottom);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = `${path} L${points[points.length - 1].x},${height - paddingBottom} L${points[0].x},${height - paddingBottom} Z`;
  return (
    <View style={styles.chartWrap}>
      <Svg width={chartWidth} height={height}>
        <Line x1={paddingX} x2={chartWidth - paddingX} y1={height - paddingBottom} y2={height - paddingBottom} stroke={COLORS.line} strokeWidth={1} />
        <Line x1={paddingX} x2={chartWidth - paddingX} y1={paddingTop} y2={paddingTop} stroke={COLORS.line} strokeWidth={1} strokeDasharray="4 5" />
        <Path d={areaPath} fill={COLORS.mintSoft} opacity={0.8} />
        <Path d={path} fill="none" stroke={COLORS.moss} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <Circle key={point.month} cx={point.x} cy={point.y} r={5} fill={COLORS.white} stroke={COLORS.moss} strokeWidth={3} />
        ))}
        {points.map((point) => (
          <SvgText key={`${point.month}-label`} x={point.x} y={height - 12} fill={COLORS.muted} fontSize={11} textAnchor="middle">{point.label}</SvgText>
        ))}
      </Svg>
      <View style={styles.chartLegend}><View style={styles.legendDot} /><Text style={styles.chartLegendText}>despesas realizadas</Text><Text style={styles.chartScale}>máx. {formatCurrency(max)}</Text></View>
    </View>
  );
}

function getSeries(state: Parameters<typeof import("@/lib/budget-store").getMonthTransactions>[0], month: string) {
  return Array.from({ length: 6 }, (_, index) => shiftMonth(month, index - 5)).map((itemMonth) => ({
    month: itemMonth,
    label: shortMonthLabel(itemMonth),
    value: state.transactions.filter((transaction) => transaction.type === "expense" && transaction.date.startsWith(itemMonth)).reduce((sum, transaction) => sum + transaction.amount, 0),
  }));
}

export function InsightCard({ icon, title, body, tone = "calm" }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; tone?: "calm" | "alert" | "info" }) {
  return (
    <View style={[styles.insightCard, tone === "alert" && styles.insightAlert, tone === "info" && styles.insightInfo]}>
      <View style={styles.insightIcon}><Ionicons name={icon} size={18} color={tone === "alert" ? COLORS.coral : tone === "info" ? COLORS.blue : COLORS.moss} /></View>
      <View style={styles.insightCopy}><Text style={styles.insightTitle}>{title}</Text><Text style={styles.insightBody}>{body}</Text></View>
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? COLORS.white : COLORS.muted} /> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.field, multiline && styles.multilineField]} />
    </View>
  );
}

export function ModalSheet({ visible, title, subtitle, onClose, children }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{title}</Text>{subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}</View><Pressable onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={20} color={COLORS.ink} /></Pressable></View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ToggleRow({ label, detail, value, onPress, icon }: { label: string; detail: string; value: string; onPress?: () => void; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow}>
      <View style={styles.toggleIcon}><Ionicons name={icon} size={18} color={COLORS.moss} /></View>
      <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>{label}</Text><Text style={styles.toggleDetail}>{detail}</Text></View>
      <Text style={styles.toggleValue}>{value}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, maxWidth: 760, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 14 },
  eyebrow: { color: COLORS.moss, fontSize: 11, fontWeight: "800", letterSpacing: 1.7, marginBottom: 5, fontFamily: FONT },
  pageTitle: { color: COLORS.ink, fontSize: 30, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7, fontFamily: FONT },
  pageSubtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 5, fontFamily: FONT },
  headerAction: { marginTop: 2 },
  monthSwitcher: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, backgroundColor: COLORS.white, minHeight: 64, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.fog, alignItems: "center", justifyContent: "center" },
  monthTitleWrap: { alignItems: "center", flex: 1 },
  monthKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.4, fontFamily: FONT },
  monthTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800", textTransform: "capitalize", marginTop: 2, fontFamily: FONT },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.moss, paddingHorizontal: 16, minHeight: 48, borderRadius: 16, shadowColor: COLORS.moss, shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  compactButton: { minHeight: 40, paddingHorizontal: 13, borderRadius: 13 },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "800", fontFamily: FONT },
  compactButtonText: { fontSize: 13 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.mintSoft, paddingHorizontal: 16, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line },
  compactSecondary: { minHeight: 40, paddingHorizontal: 13, borderRadius: 13 },
  secondaryButtonText: { color: COLORS.moss, fontSize: 14, fontWeight: "800", fontFamily: FONT },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  balanceCard: { borderRadius: 26, overflow: "hidden", marginBottom: 14 },
  balanceGradient: { padding: 22, minHeight: 174, justifyContent: "space-between" },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { color: "#CDE3D7", fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: FONT },
  balanceBadge: { backgroundColor: "#ffffff1F", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  balanceBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "800", fontFamily: FONT },
  balanceValue: { color: COLORS.white, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1, marginTop: 12, fontFamily: FONT },
  balanceMeta: { color: "#D8E8DF", fontSize: 13, marginTop: 4, fontFamily: FONT },
  balanceFooter: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 10 },
  balanceFooterLine: { height: 1, backgroundColor: "#ffffff45", flex: 1 },
  balanceFooterText: { color: "#D8E8DF", fontSize: 12, fontWeight: "700", fontFamily: FONT },
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 25 },
  summaryCard: { flex: 1, minHeight: 112, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 13 },
  summaryPositive: { backgroundColor: COLORS.mintSoft, borderColor: "#C9E2D4" },
  summaryWarning: { backgroundColor: COLORS.coralSoft, borderColor: "#F0CEC5" },
  summaryIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.fog, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", fontFamily: FONT },
  summaryValue: { color: COLORS.ink, fontSize: 16, fontWeight: "800", marginTop: 4, fontFamily: FONT },
  summaryHint: { color: COLORS.muted, fontSize: 10, marginTop: 3, fontFamily: FONT },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: "800", letterSpacing: -0.25, fontFamily: FONT },
  sectionAction: { color: COLORS.moss, fontSize: 12, fontWeight: "800", fontFamily: FONT },
  card: { backgroundColor: COLORS.white, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, padding: 17, marginBottom: 20 },
  cardMoss: { backgroundColor: COLORS.mintSoft, borderColor: "#C9E2D4" },
  cardCoral: { backgroundColor: COLORS.coralSoft, borderColor: "#F0CEC5" },
  cardBlue: { backgroundColor: COLORS.blueSoft, borderColor: "#D3E1E7" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 },
  categoryIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  categoryBody: { flex: 1 },
  categoryLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 },
  categoryName: { color: COLORS.ink, fontSize: 13, fontWeight: "800", fontFamily: FONT },
  categoryAmount: { color: COLORS.ink, fontSize: 13, fontWeight: "800", fontFamily: FONT },
  overText: { color: COLORS.coral },
  progressTrack: { flex: 1, backgroundColor: COLORS.fog, borderRadius: 10, overflow: "hidden" },
  progressFill: { borderRadius: 10 },
  categoryBudget: { color: COLORS.muted, fontSize: 10, minWidth: 68, textAlign: "right", fontFamily: FONT },
  chartWrap: { alignItems: "center", marginHorizontal: -8 },
  chartLegend: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", gap: 6, paddingHorizontal: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.moss },
  chartLegendText: { color: COLORS.muted, fontSize: 11, fontFamily: FONT },
  chartScale: { color: COLORS.muted, fontSize: 10, marginLeft: "auto", fontFamily: FONT },
  insightCard: { flexDirection: "row", gap: 11, backgroundColor: COLORS.mintSoft, borderRadius: 17, borderWidth: 1, borderColor: "#C9E2D4", padding: 13, marginBottom: 9 },
  insightAlert: { backgroundColor: COLORS.coralSoft, borderColor: "#F0CEC5" },
  insightInfo: { backgroundColor: COLORS.blueSoft, borderColor: "#D3E1E7" },
  insightIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  insightCopy: { flex: 1 },
  insightTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "800", marginBottom: 3, fontFamily: FONT },
  insightBody: { color: COLORS.muted, fontSize: 12, lineHeight: 17, fontFamily: FONT },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 },
  chipSelected: { backgroundColor: COLORS.moss, borderColor: COLORS.moss },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: "800", fontFamily: FONT },
  chipTextSelected: { color: COLORS.white },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: "800", marginBottom: 7, fontFamily: FONT },
  field: { minHeight: 48, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 14, color: COLORS.ink, fontSize: 15, fontFamily: FONT },
  multilineField: { minHeight: 82, paddingTop: 13, textAlignVertical: "top" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#18332B66" },
  modalSheet: { maxHeight: "91%", backgroundColor: COLORS.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  modalHandle: { width: 44, height: 5, borderRadius: 4, backgroundColor: COLORS.line, alignSelf: "center", marginBottom: 13 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 5 },
  modalTitle: { color: COLORS.ink, fontSize: 22, fontWeight: "800", fontFamily: FONT },
  modalSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4, fontFamily: FONT },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  modalContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  typeToggle: { flexDirection: "row", gap: 8, marginBottom: 18 },
  typeOption: { flex: 1, minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white },
  typeOptionActive: { backgroundColor: COLORS.moss, borderColor: COLORS.moss },
  typeOptionText: { color: COLORS.muted, fontSize: 13, fontWeight: "800", fontFamily: FONT },
  typeOptionTextActive: { color: COLORS.white },
  categoryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  categoryPickerItem: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 14 },
  categoryPickerItemActive: { backgroundColor: COLORS.mint, borderColor: COLORS.moss },
  categoryPickerText: { color: COLORS.muted, fontSize: 12, fontWeight: "700", fontFamily: FONT },
  categoryPickerTextActive: { color: COLORS.moss },
  formActions: { flexDirection: "row", gap: 10, marginTop: 5 },
  formAction: { flex: 1 },
  transactionRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.fog },
  transactionIcon: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  transactionCopy: { flex: 1 },
  transactionDescription: { color: COLORS.ink, fontSize: 14, fontWeight: "800", fontFamily: FONT },
  transactionMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontFamily: FONT },
  transactionAmount: { color: COLORS.ink, fontSize: 13, fontWeight: "800", fontFamily: FONT },
  incomeAmount: { color: COLORS.moss },
  emptyState: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 18 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.mintSoft, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { color: COLORS.ink, fontSize: 16, fontWeight: "800", fontFamily: FONT },
  emptyBody: { color: COLORS.muted, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 5, fontFamily: FONT },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.fog },
  toggleIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: COLORS.mintSoft, alignItems: "center", justifyContent: "center" },
  toggleCopy: { flex: 1 },
  toggleLabel: { color: COLORS.ink, fontSize: 13, fontWeight: "800", fontFamily: FONT },
  toggleDetail: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontFamily: FONT },
  toggleValue: { color: COLORS.moss, fontSize: 12, fontWeight: "800", fontFamily: FONT },
  budgetCard: { backgroundColor: COLORS.white, borderRadius: 19, borderWidth: 1, borderColor: COLORS.line, padding: 15, marginBottom: 10 },
  budgetCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 13 },
  budgetCardCopy: { flex: 1 },
  budgetCardName: { color: COLORS.ink, fontSize: 14, fontWeight: "800", fontFamily: FONT },
  budgetCardHint: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontFamily: FONT },
  budgetInput: { minWidth: 100, height: 40, borderRadius: 12, backgroundColor: COLORS.fog, paddingHorizontal: 10, color: COLORS.ink, textAlign: "right", fontSize: 13, fontWeight: "800", fontFamily: FONT },
  budgetBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetRemaining: { color: COLORS.muted, fontSize: 11, minWidth: 85, textAlign: "right", fontFamily: FONT },
  settingsHero: { borderRadius: 24, padding: 20, marginBottom: 20, backgroundColor: COLORS.mintSoft, borderWidth: 1, borderColor: "#C9E2D4" },
  settingsHeroTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "800", fontFamily: FONT },
  settingsHeroText: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 6, fontFamily: FONT },
  settingsButtons: { flexDirection: "row", gap: 9, marginTop: 16 },
  settingButton: { flex: 1 },
  infoFootnote: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 11, fontFamily: FONT },
  importPreview: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, padding: 13, marginBottom: 13 },
  importStat: { color: COLORS.ink, fontSize: 13, fontWeight: "800", marginBottom: 5, fontFamily: FONT },
  importError: { color: COLORS.coral, fontSize: 11, lineHeight: 16, marginTop: 3, fontFamily: FONT },
  categoryCount: { color: COLORS.muted, fontSize: 11, marginTop: 2, fontFamily: FONT },
});
