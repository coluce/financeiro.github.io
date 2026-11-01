# Plano do app Orçar

## Escopo e abordagem

Orçar será um app móvel Expo/React Native com foco em uso no navegador. A experiência principal fica em uma única tela de painel com navegação inferior para **Visão geral**, **Movimentações** e **Orçamentos**. Os dados são mantidos no navegador por `localStorage`, com um adaptador simples para memória/AsyncStorage no ambiente nativo, sem conta, servidor ou chamadas de API para os dados financeiros.

O modelo local terá movimentações (`id`, `type`, `amount`, `date`, `description`, `categoryId`), categorias (`id`, `name`, `color`, `icon`) e orçamentos mensais (`month`, `categoryId`, `amount`). O estado será carregado uma vez no provider da aplicação, atualizado de forma imutável e persistido a cada mudança. O mês selecionado controla os totais do painel, comparação com orçamento e série de tendência dos últimos seis meses.

O painel calcula receitas, despesas, saldo, orçamento planejado e gasto por categoria; renderiza cartões de resumo, barras horizontais por categoria, um gráfico de tendência mês a mês com SVG e análises textuais. A análise compara gasto da categoria com o orçamento do mês e produz mensagens como “Restaurantes está 32% acima do orçamento”, além de alertas para saldo negativo e categorias próximas do limite.

A tela de movimentações permite criar, editar e excluir receitas/despesas com formulário em modal, validação de valor/data/categoria e filtros por tipo. A tela de orçamentos permite definir limites por categoria no mês escolhido e criar categorias. Um modal de dados oferece importação CSV com pré-visualização/validação antes de salvar e exportação CSV com download no Web e compartilhamento/cópia compatível no nativo.

## Estrutura do projeto

- `app/(tabs)/index.tsx`: dashboard do mês, KPIs, gráfico, distribuição por categoria e análises.
- `app/(tabs)/transactions.tsx`: lista filtrável, formulário de movimentação e ações de edição/exclusão.
- `app/(tabs)/budgets.tsx`: limites mensais, progresso por categoria e criação de categorias.
- `app/(tabs)/settings.tsx`: importação/exportação CSV, mês de referência, ações de dados e preferências.
- `components/budget-ui.tsx`: cartões, barras, gráfico, modais e controles visuais compartilhados.
- `lib/budget-store.ts`: tipos, seed de demonstração, cálculos, persistência local e CSV.
- `lib/budget-context.tsx`: provider e hooks de estado da aplicação.
- `assets/images/*`: identidade visual do Orçar e ícones Expo.
- `plan.md` e `TODO.md`: decisões e entregas rastreáveis.

## Design

### Alternativas consideradas

- **Brutalismo editorial financeiro** — 0,06: blocos de alto contraste, tipografia monoespacial e contornos expressivos.
- **Quiet luxury utilitário** — 0,08: papel quente, serifas discretas e densidade de consultoria pessoal.
- **Jardim de dados calmo** — 0,04: verde sálvia, cartões macios e gráficos como pequenas trilhas de crescimento.

### Direção escolhida: Jardim de dados calmo

**Design Movement:** uma mistura de editorial de caderno financeiro com interfaces de bem-estar, sem parecer uma planilha fria.

**Core Principles:** clareza antes de detalhe; progresso visível em vez de culpa; ações de uma mão; dados importantes sempre acompanhados de linguagem humana.

**Color Philosophy:** fundo marfim levemente quente para reduzir o ruído visual; verde musgo como cor própria da marca, comunicando estabilidade e crescimento; coral queimado apenas para atenção e excesso; azul névoa para informações secundárias. O contraste é alto nos números, mas os estados não dependem só de cor.

**Layout Paradigm:** composição vertical em camadas: saudação e seletor de mês, um cartão de saldo dominante, depois trilhas laterais de gastos e insights. As telas de apoio seguem o mesmo fluxo de leitura de cima para baixo, evitando uma grade de dashboard genérica.

**Signature Elements:** o “saldo em foco” em um cartão verde musgo com cantos assimétricos; barras de orçamento com marcador de limite; pequenos pontos/talos no gráfico de tendência para sugerir crescimento orgânico.

**Interaction Philosophy:** tocar é direto e previsível; cada CTA usa verbos concretos (“Adicionar gasto”, “Definir limite”); modais são curtos e voltados para conclusão; exclusões exigem confirmação no Web e no nativo.

**Animation:** entrada suave dos cartões com `LayoutAnimation` quando suportado; progresso das barras com timing curto; feedback de toque reduzido a opacidade e haptics leves; nenhuma animação contínua que distraia do orçamento.

**Typography System:** sistema sans arredondado para títulos e labels, números grandes com peso forte e `letterSpacing` negativo; textos auxiliares menores, com no máximo duas linhas. A hierarquia é 30/24/18/15/13.

**Brand Essence:** orçamento pessoal que transforma números dispersos em próximos passos claros — calmo, prático, encorajador.

**Brand Voice:** headlines e CTAs são objetivos e acolhedores; análises falam com a pessoa, não sobre ela. Exemplos: “Seu mês, sem achismo.” e “Você está perto do limite em Alimentação — vale revisar antes da próxima compra.”

**Wordmark & Logo:** a marca usa um símbolo de broto formado por duas barras de gráfico que se encontram, acompanhado de “Orçar” em wordmark sans arredondado.

**Signature Brand Color:** musgo profundo `#315C4A`, usado como cor proprietária do saldo e do wordmark.

## Restrições e decisões

- Dados financeiros não são enviados ao backend gerenciado; o armazenamento é local ao navegador.
- O starter Expo, Expo Router, NativeWind e TypeScript permanecem intactos como base.
- O layout é portrait-first e usa componentes React Native compatíveis com Web.
- O gráfico é desenhado com `react-native-svg`, já disponível no starter.
- CSV usa cabeçalho estável em português e aceita separador vírgula ou ponto e vírgula na importação.
- A primeira abertura inclui dados de demonstração para o app parecer útil; a pessoa pode limpar tudo nas configurações.
- O planejamento de um mês pode substituir seu conteúdo pela cópia do mês anterior: lançamentos e limites são remapeados para o mês-alvo, os lançamentos copiados começam como pendentes e podem ser confirmados individualmente.
