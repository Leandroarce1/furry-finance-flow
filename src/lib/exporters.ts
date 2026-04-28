import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Entrada, Saida, Cliente, Pet, PlanoConta, Meta, ContaBancaria,
} from "./types";
import { fmtBRL, fmtDate, monthKey } from "./format";

// ====== Helpers ======
function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function refDate(l: { dataVencimento?: string; dataPagamento?: string; data: string }) {
  return l.dataPagamento || l.dataVencimento || l.data;
}

function statusLabel(l: { dataPagamento?: string; dataVencimento?: string }) {
  if (l.dataPagamento) return "Concluído";
  const hoje = new Date().toISOString().slice(0, 10);
  if (!l.dataVencimento) return "—";
  if (l.dataVencimento < hoje) return "Atrasado";
  if (l.dataVencimento === hoje) return "Previsto para hoje";
  return "Previsto";
}

function nomeMesAno(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ====== Lançamentos (Excel) ======
export interface LancContext {
  planoContas: PlanoConta[];
  clientes: Cliente[];
  bancos: ContaBancaria[];
}

function buildLancamentosRows(
  entradas: Entrada[], saidas: Saida[], ctx: LancContext,
) {
  const { planoContas, clientes, bancos } = ctx;
  const catNome = (id?: string) => planoContas.find((p) => p.id === id)?.nome || "";
  const cliNome = (id?: string) => clientes.find((c) => c.id === id)?.nome || "";
  const bancoNome = (id?: string) => bancos.find((b) => b.id === id)?.nome || "";

  const rows: Record<string, string | number>[] = [];
  entradas.forEach((e) => {
    rows.push({
      Data: fmtDate(refDate(e)),
      Tipo: "Entrada",
      Categoria: catNome(e.planoContaId) || e.categoria,
      Subcategoria: e.subcategoria || e.descricao || "",
      Cliente: cliNome(e.clienteId) || "",
      Valor: Number(e.valor || 0),
      Conta: bancoNome(e.contaBancariaId),
      "Forma de Pagamento": e.formaPagamento,
      Status: statusLabel(e),
    });
  });
  saidas.forEach((s) => {
    rows.push({
      Data: fmtDate(refDate(s)),
      Tipo: "Saída",
      Categoria: catNome(s.planoContaId) || s.categoria,
      Subcategoria: s.subcategoria || s.descricao || "",
      Cliente: s.fornecedor || "",
      Valor: Number(s.valor || 0),
      Conta: bancoNome(s.contaBancariaId),
      "Forma de Pagamento": s.formaPagamento,
      Status: statusLabel(s),
    });
  });
  // Ordena por data desc
  rows.sort((a, b) => String(b.Data).localeCompare(String(a.Data)));
  return rows;
}

function buildSheetFromRows(rows: Record<string, string | number>[], titulo: string) {
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["Data", "Tipo", "Categoria", "Subcategoria", "Cliente", "Valor", "Conta", "Forma de Pagamento", "Status"],
  });
  // Larguras de coluna
  (ws as any)["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 30 },
    { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
  ];
  // Formata valor como número BRL-like (2 casas)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ c: 5, r })];
    if (cell) cell.z = "#,##0.00";
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titulo.slice(0, 31));
  return wb;
}

export function exportLancamentosMes(
  entradas: Entrada[], saidas: Saida[], ym: string, ctx: LancContext,
) {
  const ents = entradas.filter((e) => monthKey(refDate(e)) === ym);
  const sais = saidas.filter((s) => monthKey(refDate(s)) === ym);
  const rows = buildLancamentosRows(ents, sais, ctx);
  const wb = buildSheetFromRows(rows, `Lançamentos ${ym}`);
  saveWorkbook(wb, `lancamentos-${ym}.xlsx`);
}

export function exportLancamentosAno(
  entradas: Entrada[], saidas: Saida[], ano: number, ctx: LancContext,
) {
  const ano4 = String(ano);
  const ents = entradas.filter((e) => refDate(e).startsWith(ano4));
  const sais = saidas.filter((s) => refDate(s).startsWith(ano4));
  const rows = buildLancamentosRows(ents, sais, ctx);
  const wb = buildSheetFromRows(rows, `Lançamentos ${ano}`);
  saveWorkbook(wb, `lancamentos-${ano}.xlsx`);
}

export function exportLancamentosLista(
  entradas: Entrada[], saidas: Saida[], ctx: LancContext, nome = "lancamentos-filtrados",
) {
  const rows = buildLancamentosRows(entradas, saidas, ctx);
  const wb = buildSheetFromRows(rows, "Lançamentos");
  saveWorkbook(wb, `${nome}.xlsx`);
}

// ====== Clientes (Excel) ======
export function exportClientes(
  clientes: Cliente[], pets: Pet[], entradas: Entrada[],
) {
  const petClienteMap = new Map(pets.map((p) => [p.id, p.clienteId]));
  const cidDe = (e: Entrada) =>
    e.clienteId || (e.petId ? petClienteMap.get(e.petId) : undefined);

  const rows = clientes.map((c) => {
    const lancs = entradas.filter((e) => cidDe(e) === c.id && !!e.dataPagamento);
    const total = lancs.reduce((a, b) => a + b.valor, 0);
    const visitas = lancs.length;
    const ultima = lancs
      .map((e) => e.dataPagamento || e.data)
      .sort()
      .slice(-1)[0] || "";
    const petsCliente = pets
      .filter((p) => p.clienteId === c.id)
      .map((p) => p.nome)
      .join(", ");
    return {
      Nome: c.nome,
      Pets: petsCliente,
      Telefone: c.whatsapp || "",
      "Total Gasto": Number(total),
      "Nº de Visitas": visitas,
      "Última Visita": ultima ? fmtDate(ultima) : "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ["Nome", "Pets", "Telefone", "Total Gasto", "Nº de Visitas", "Última Visita"],
  });
  (ws as any)["!cols"] = [
    { wch: 26 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ];
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ c: 3, r })];
    if (cell) cell.z = "#,##0.00";
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  saveWorkbook(wb, `clientes.xlsx`);
}

// ====== Previsto vs Realizado (Excel) ======
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function exportPrevistoRealizado(
  entradas: Entrada[], saidas: Saida[], planoContas: PlanoConta[], metas: Meta[],
  ano: number, incluirPrevistos: boolean,
) {
  const realizadoPorConta = new Map<string, number[]>();
  planoContas.forEach((p) => realizadoPorConta.set(p.id, Array(12).fill(0)));
  const acc = (l: Entrada | Saida) => {
    if (!l.planoContaId) return;
    const rd = incluirPrevistos
      ? (l.dataPagamento || l.dataVencimento || l.data)
      : l.dataPagamento;
    if (!rd) return;
    const [y, m] = rd.split("-").map(Number);
    if (y !== ano) return;
    const arr = realizadoPorConta.get(l.planoContaId);
    if (arr) arr[m - 1] += l.valor;
  };
  entradas.forEach(acc);
  saidas.forEach(acc);

  const getMeta = (planoId: string, mIdx: number) => {
    const m = metas.find((x) => x.ano === ano && x.planoContaId === planoId);
    return m?.valores[mIdx] ?? 0;
  };

  // Monta cabeçalho: Conta + por mês Previsto/Realizado + Total Prev/Real
  const header: string[] = ["Conta", "Tipo"];
  MESES.forEach((m) => {
    header.push(`${m} Previsto`, `${m} Realizado`);
  });
  header.push("Total Previsto", "Total Realizado");

  const aoa: (string | number)[][] = [header];

  const addLinha = (p: PlanoConta) => {
    const realArr = realizadoPorConta.get(p.id) || Array(12).fill(0);
    const prevArr = MESES.map((_, i) => getMeta(p.id, i));
    const row: (string | number)[] = [p.nome, p.tipo];
    for (let i = 0; i < 12; i++) {
      row.push(Number(prevArr[i] || 0), Number(realArr[i] || 0));
    }
    row.push(prevArr.reduce((a, b) => a + b, 0), realArr.reduce((a, b) => a + b, 0));
    aoa.push(row);
  };

  const receitas = planoContas.filter((p) => p.tipo === "Receita");
  const despesas = planoContas.filter((p) => p.tipo === "Despesa");

  aoa.push(["RECEBIMENTOS", "", ...Array(26).fill("")]);
  receitas.forEach(addLinha);
  aoa.push(["GASTOS", "", ...Array(26).fill("")]);
  despesas.forEach(addLinha);

  // Totais
  const totalArr = (lista: PlanoConta[], kind: "prev" | "real") =>
    MESES.map((_, i) =>
      lista.reduce((a, p) => {
        if (kind === "prev") return a + getMeta(p.id, i);
        return a + (realizadoPorConta.get(p.id)?.[i] || 0);
      }, 0),
    );
  const totalRow = (label: string, lista: PlanoConta[]) => {
    const prev = totalArr(lista, "prev");
    const real = totalArr(lista, "real");
    const row: (string | number)[] = [label, ""];
    for (let i = 0; i < 12; i++) row.push(prev[i], real[i]);
    row.push(prev.reduce((a, b) => a + b, 0), real.reduce((a, b) => a + b, 0));
    return row;
  };
  aoa.push(totalRow("Total Recebimentos", receitas));
  aoa.push(totalRow("Total Gastos", despesas));

  // Resultado líquido
  const recPrev = totalArr(receitas, "prev"), recReal = totalArr(receitas, "real");
  const despPrev = totalArr(despesas, "prev"), despReal = totalArr(despesas, "real");
  const resRow: (string | number)[] = ["Resultado Líquido", ""];
  for (let i = 0; i < 12; i++) {
    resRow.push(recPrev[i] - despPrev[i], recReal[i] - despReal[i]);
  }
  resRow.push(
    recPrev.reduce((a, b) => a + b, 0) - despPrev.reduce((a, b) => a + b, 0),
    recReal.reduce((a, b) => a + b, 0) - despReal.reduce((a, b) => a + b, 0),
  );
  aoa.push(resRow);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  (ws as any)["!cols"] = [{ wch: 28 }, { wch: 10 }, ...Array(26).fill({ wch: 12 })];
  // formatar colunas numéricas
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ c, r })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0.00";
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Previsto x Realizado ${ano}`);
  saveWorkbook(wb, `previsto-realizado-${ano}.xlsx`);
}

// ====== Relatório do Mês (PDF) ======
export interface RelatorioCtx {
  nomeEmpresa: string;
  ym: string; // yyyy-mm
  entradas: Entrada[];
  saidas: Saida[];
  planoContas: PlanoConta[];
  metas: Meta[];
}

export function exportRelatorioMesPDF(ctx: RelatorioCtx) {
  const { nomeEmpresa, ym, entradas, saidas, planoContas, metas } = ctx;
  const [anoStr, mesStr] = ym.split("-");
  const ano = Number(anoStr);
  const mIdx = Number(mesStr) - 1;

  const isConcluido = (l: Entrada | Saida) => !!l.dataPagamento;
  const mesDe = (l: Entrada | Saida) => monthKey(l.dataPagamento || l.data || "");

  const entsMes = entradas.filter((e) => mesDe(e) === ym && isConcluido(e));
  const saisMes = saidas.filter((s) => mesDe(s) === ym && isConcluido(s));

  const totalR = entsMes.reduce((a, b) => a + b.valor, 0);
  const totalD = saisMes.reduce((a, b) => a + b.valor, 0);
  const resultado = totalR - totalD;

  // Agrupa por categoria (planoConta)
  const porCat = (lancs: Array<Entrada | Saida>) => {
    const map = new Map<string, number>();
    lancs.forEach((l) => {
      const pc = planoContas.find((p) => p.id === l.planoContaId);
      const nome = pc?.nome || (l as any).categoria || "Sem categoria";
      map.set(nome, (map.get(nome) || 0) + l.valor);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };
  const recPorCat = porCat(entsMes);
  const despPorCat = porCat(saisMes);

  // Comparativo com metas (para o mês)
  const metasMes = metas
    .filter((m) => m.ano === ano)
    .map((m) => {
      const pc = planoContas.find((p) => p.id === m.planoContaId);
      if (!pc) return null;
      const meta = m.valores[mIdx] || 0;
      const lancs = pc.tipo === "Receita" ? entsMes : saisMes;
      const realizado = lancs
        .filter((l) => l.planoContaId === m.planoContaId)
        .reduce((a, b) => a + b.valor, 0);
      return { nome: pc.nome, tipo: pc.tipo, meta, realizado };
    })
    .filter(Boolean) as Array<{ nome: string; tipo: string; meta: number; realizado: number }>;

  // Monta PDF
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Cabeçalho
  doc.setFillColor(120, 72, 220);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(nomeEmpresa, 40, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Relatório do Mês · ${nomeMesAno(ym)}`, 40, 52);

  // Resumo
  doc.setTextColor(20, 20, 20);
  let y = 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumo do mês", 40, y);
  y += 8;

  autoTable(doc, {
    startY: y + 4,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total de receitas", fmtBRL(totalR)],
      ["Total de despesas", fmtBRL(totalD)],
      ["Resultado líquido", fmtBRL(resultado)],
      ["Atendimentos concluídos", String(entsMes.length)],
    ],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [120, 72, 220], textColor: 255 },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 24;

  // Receitas por categoria
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Receitas por categoria", 40, y);
  autoTable(doc, {
    startY: y + 6,
    head: [["Categoria", "Valor"]],
    body: recPorCat.length
      ? recPorCat.map(([n, v]) => [n, fmtBRL(v)])
      : [["—", "—"]],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [34, 160, 100], textColor: 255 },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  // Despesas por categoria
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Despesas por categoria", 40, y);
  autoTable(doc, {
    startY: y + 6,
    head: [["Categoria", "Valor"]],
    body: despPorCat.length
      ? despPorCat.map(([n, v]) => [n, fmtBRL(v)])
      : [["—", "—"]],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [200, 60, 60], textColor: 255 },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  // Comparativo com metas
  if (metasMes.length > 0) {
    if (y > 680) { doc.addPage(); y = 60; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Comparativo com metas", 40, y);
    autoTable(doc, {
      startY: y + 6,
      head: [["Categoria", "Tipo", "Meta", "Realizado", "Atingido"]],
      body: metasMes.map((m) => {
        const pct = m.meta > 0 ? (m.realizado / m.meta) * 100 : 0;
        return [m.nome, m.tipo, fmtBRL(m.meta), fmtBRL(m.realizado), `${pct.toFixed(0)}%`];
      }),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [80, 80, 80], textColor: 255 },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });
  }

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    const pageH = doc.internal.pageSize.getHeight();
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} · Página ${i} de ${pageCount}`,
      pageW / 2, pageH - 20, { align: "center" },
    );
  }

  doc.save(`relatorio-${ym}.pdf`);
}
