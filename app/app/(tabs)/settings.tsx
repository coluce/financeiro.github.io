import { useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, Share, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { AppHeader, Card, ModalSheet, MonthSwitcher, PrimaryButton, SecondaryButton, ToggleRow, styles } from "@/components/budget-ui";
import { useBudget } from "@/lib/budget-context";
import { COLORS, getMonthTransactions, monthLabel, parseTransactionsCsv, shiftMonth, transactionsToCsv, type ImportResult } from "@/lib/budget-store";

export default function SettingsScreen() {
  const { state, hydrated, selectedMonth, setSelectedMonth, importTransactions, clearAll, copyPreviousMonth } = useBudget();
  const [pendingImport, setPendingImport] = useState<ImportResult | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const exportCsv = async () => {
    const csv = transactionsToCsv(state);
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "orcar-movimentacoes.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      return;
    }
    await Share.share({ message: csv, title: "Exportar movimentações" });
  };

  const importCsv = () => {
    if (Platform.OS !== "web") {
      Alert.alert("Importação pelo navegador", "Abra o Orçar no navegador para selecionar um arquivo CSV e importar seus registros.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setPendingImport(parseTransactionsCsv(String(reader.result ?? ""), state.categories));
      reader.readAsText(file, "UTF-8");
    };
    input.click();
  };

  const confirmClear = () => {
    const message = "Isso remove movimentações, categorias e limites deste navegador.";
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`${message} Continuar?`)) clearAll();
      return;
    }
    Alert.alert("Limpar dados locais?", message, [{ text: "Cancelar", style: "cancel" }, { text: "Limpar", style: "destructive", onPress: clearAll }]);
  };

  const confirmCopyPreviousMonth = () => {
    const previousMonth = shiftMonth(selectedMonth, -1);
    const previousCount = getMonthTransactions(state, previousMonth).length;
    const message = `Isso apaga os registros e limites de ${monthLabel(selectedMonth)} e copia ${previousCount} lançamentos de ${monthLabel(previousMonth)} como pendentes.`;
    const runCopy = () => {
      copyPreviousMonth(selectedMonth);
      setCopyMessage(`${monthLabel(selectedMonth)} foi preenchido com lançamentos pendentes.`);
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`${message} Continuar?`)) runCopy();
      return;
    }
    Alert.alert("Copiar mês anterior?", message, [{ text: "Cancelar", style: "cancel" }, { text: "Copiar", onPress: runCopy }]);
  };

  if (!hydrated) {
    return <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background"><View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={COLORS.moss} /><Text style={{ color: COLORS.muted, marginTop: 10 }}>Abrindo seus dados…</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background">
      <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader eyebrow="Ajustes" title="Seus dados, suas regras." subtitle="O Orçar funciona bem porque não precisa saber nada além do que você escolhe registrar." />
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
        <Card accent="blue"><Text style={{ color: COLORS.blue, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 }}>PLANEJAR {monthLabel(selectedMonth).toUpperCase()}</Text><Text style={{ color: COLORS.ink, fontSize: 18, fontWeight: "800", marginTop: 7 }}>Repetir o mês anterior</Text><Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 }}>Apague o que já existe neste mês e copie lançamentos e limites do mês anterior. Os lançamentos chegam como pendentes para você confirmar um a um.</Text><View style={{ marginTop: 14 }}><PrimaryButton label="Copiar mês anterior" icon="copy-outline" onPress={confirmCopyPreviousMonth} compact /></View>{copyMessage ? <Text style={{ color: COLORS.moss, fontSize: 11, fontWeight: "800", marginTop: 10 }}>{copyMessage}</Text> : null}</Card>
        <View style={styles.settingsHero}><Text style={styles.settingsHeroTitle}>Privacidade por padrão.</Text><Text style={styles.settingsHeroText}>Tudo fica salvo neste navegador. Não há conta, servidor ou sincronização automática dos seus dados financeiros.</Text><View style={styles.settingsButtons}><View style={styles.settingButton}><PrimaryButton label="Exportar CSV" icon="download-outline" onPress={exportCsv} compact /></View><View style={styles.settingButton}><SecondaryButton label="Importar CSV" icon="cloud-upload-outline" onPress={importCsv} compact /></View></View><Text style={styles.infoFootnote}>Formato aceito: tipo;valor;data;descricao;categoria;status. A coluna status é opcional; datas usam AAAA-MM-DD.</Text></View>

        <Card>
          <ToggleRow label="Armazenamento local" detail="Sem conta ou servidor" value="Local" icon="shield-checkmark-outline" />
          <ToggleRow label="Movimentações" detail="Registros salvos" value={String(state.transactions.length)} icon="receipt-outline" />
          <ToggleRow label="Categorias" detail="Organização do seu orçamento" value={String(state.categories.length)} icon="pricetags-outline" />
        </Card>

        <Card accent="coral"><Text style={{ color: COLORS.coral, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 }}>ZONA DE RESET</Text><Text style={{ color: COLORS.ink, fontSize: 16, fontWeight: "800", marginTop: 7 }}>Começar de novo</Text><Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 5 }}>Apague os dados locais e recomece com um orçamento em branco.</Text><View style={{ marginTop: 14 }}><SecondaryButton label="Limpar dados locais" icon="trash-outline" onPress={confirmClear} compact /></View></Card>
        <Text style={{ color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 2 }}>Orçar · feito para deixar o dinheiro mais legível.</Text>
      </ScrollView>
      <ImportPreview result={pendingImport} onClose={() => setPendingImport(null)} onConfirm={() => { if (pendingImport) importTransactions(pendingImport.transactions, pendingImport.categories); setPendingImport(null); }} />
    </ScreenContainer>
  );
}

function ImportPreview({ result, onClose, onConfirm }: { result: ImportResult | null; onClose: () => void; onConfirm: () => void }) {
  if (!result) return null;
  return (
    <ModalSheet visible={Boolean(result)} title="Conferir importação" subtitle="Nada entra antes da sua confirmação." onClose={onClose}>
      <View style={styles.importPreview}>
        <Text style={styles.importStat}>{result.validRows} de {result.totalRows} linhas prontas</Text>
        <Text style={styles.categoryCount}>{result.categories.length} categorias serão mantidas ou criadas.</Text>
        {result.transactions.slice(0, 4).map((transaction) => {
          const category = result.categories.find((item) => item.id === transaction.categoryId);
          return <View key={transaction.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.fog }}><View style={{ flex: 1, paddingRight: 8 }}><Text style={{ color: COLORS.ink, fontSize: 12, fontWeight: "800" }} numberOfLines={1}>{transaction.description}</Text><Text style={styles.categoryCount}>{transaction.date} · {category?.name ?? "Sem categoria"}</Text></View><Text style={{ color: transaction.type === "income" ? COLORS.moss : COLORS.ink, fontSize: 12, fontWeight: "800" }}>{transaction.type === "income" ? "+" : "−"}{transaction.amount.toFixed(2).replace(".", ",")}</Text></View>;
        })}
        {result.validRows > 4 ? <Text style={[styles.categoryCount, { marginTop: 10 }]}>+ {result.validRows - 4} outras linhas válidas</Text> : null}
        {result.errors.slice(0, 5).map((error) => <Text key={error} style={styles.importError}>{error}</Text>)}
      </View>
      {result.validRows ? <View style={styles.formActions}><View style={styles.formAction}><SecondaryButton label="Cancelar" onPress={onClose} /></View><View style={styles.formAction}><PrimaryButton label="Importar" icon="checkmark" onPress={onConfirm} /></View></View> : <PrimaryButton label="Escolher outro arquivo" icon="refresh-outline" onPress={onClose} />}
    </ModalSheet>
  );
}
