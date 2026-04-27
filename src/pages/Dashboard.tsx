import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useEntradas, useSaidas, usePlanoContas, useClientes, usePets, useMetas,
} from "@/store/useStore";
import { fmtBRL, fmtDate, monthKey } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Activity, Users, UserX, Crown, Receipt, ArrowUpDown, Target } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--secondary-foreground))"];

function Stat({
  icon: Icon, label, value, tone = "muted",
}: { icon: any; label: string; value: string; tone?: "primary" | "success" | "destructive" | "muted" }) {
  const toneClasses: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  };
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`w-4 h-4 ${toneClasses[tone]}`} />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-display font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">{title}</p>
        {children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [planoContas] = usePlanoContas();
  const [clientes] = useClientes();
  const [pets] = usePets();
  const [metas] = useMetas();

  const now = new Date();
  const defaultYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedYM, setSelectedYM] = useState<string>(defaultYM);
  const [ano, mes] = selectedYM.split("-").map(Number);

  // Anos disponíveis para o seletor (inclui ano atual e anos presentes nos lançamentos)
  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>([now.getFullYear(), 2026]);
    [...entradas, ...saidas].forEach((l: any) => {
      if (l.data) set.add(Number(l.data.slice(0, 4)));
      if (l.dataPagamento) set.add(Number(l.dataPagamento.slice(0, 4)));
    });
    return Array.from(set).sort();
  }, [entradas, saidas]);

  // Helpers: concluído e mês de competência (usa dataPagamento se existir)
  const isConcluido = (l: any) => !!l.dataPagamento;
  const mesDe = (l: any) => monthKey(l.dataPagamento || l.data || "");

  // KPIs do mês selecionado (realizado = status Concluído)
  const stats = useMemo(() => {
    const ents = entradas.filter((e) => mesDe(e) === selectedYM && isConcluido(e));
    const sais = saidas.filter((s) => mesDe(s) === selectedYM && isConcluido(s));
    const totalE = ents.reduce((a, b) => a + b.valor, 0);
    const totalS = sais.reduce((a, b) => a + b.valor, 0);
    // Atendimentos: contagem total de lançamentos de entrada no mês (por data do lançamento)
    const atendimentos = entradas.filter((e) => monthKey(e.data) === selectedYM).length;
    return { totalE, totalS, lucro: totalE - totalS, atendimentos };
  }, [entradas, saidas, selectedYM]);

  // Série mensal do ano selecionado (realizado = concluídos)
  const serieMensal = useMemo(() => {
    let acc = 0;
    return MESES_LABEL.map((label, i) => {
      const mk = `${ano}-${String(i + 1).padStart(2, "0")}`;
      const ent = entradas.filter((e) => mesDe(e) === mk && isConcluido(e)).reduce((a, x) => a + x.valor, 0);
      const sai = saidas.filter((s) => mesDe(s) === mk && isConcluido(s)).reduce((a, x) => a + x.valor, 0);
      const resultado = ent - sai;
      acc += resultado;
      return { mes: label, Receita: ent, Despesa: sai, Acumulado: acc };
    });
  }, [entradas, saidas, ano]);

  // Meta vs Realizado — categorias com meta no ano
  const metaVsReal = useMemo(() => {
    const idxMes = mes - 1;
    return metas
      .filter((m) => m.ano === ano)
      .map((m) => {
        const pc = planoContas.find((p) => p.id === m.planoContaId);
        if (!pc) return null;
        const meta = m.valores[idxMes] || 0;
        const lancs = pc.tipo === "Receita" ? entradas : saidas;
        const realizado = (lancs as any[])
          .filter((l) => l.planoContaId === m.planoContaId && mesDe(l) === selectedYM && isConcluido(l))
          .reduce((a, b) => a + b.valor, 0);
        const pct = meta > 0 ? Math.min(100, (realizado / meta) * 100) : 0;
        return { id: m.id, nome: pc.nome, tipo: pc.tipo, meta, realizado, pct };
      })
      .filter(Boolean) as Array<{ id: string; nome: string; tipo: string; meta: number; realizado: number; pct: number }>;
  }, [metas, planoContas, entradas, saidas, ano, mes, selectedYM]);

  // Pizza por categoria do plano de contas (mês atual, receitas)
  const pizzaCategorias = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === selectedYM).forEach((e) => {
      const pc = planoContas.find((p) => p.id === e.planoContaId);
      const nome = pc?.nome || e.categoria || "Sem categoria";
      map.set(nome, (map.get(nome) || 0) + e.valor);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [entradas, planoContas, selectedYM]);

  // Top serviços (descrição) — mês atual
  const topServicos = useMemo(() => {
    const map = new Map<string, { qtd: number; total: number }>();
    entradas.filter((e) => monthKey(e.data) === selectedYM).forEach((e) => {
      const k = e.descricao || "—";
      const cur = map.get(k) || { qtd: 0, total: 0 };
      cur.qtd += 1; cur.total += e.valor;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [entradas, selectedYM]);

  // === Análises de clientes ===
  const trintaDiasAtras = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  // mapa pet -> cliente para resolver atendimentos só com petId
  const petClienteMap = useMemo(() => {
    const m = new Map<string, string>();
    pets.forEach((p) => m.set(p.id, p.clienteId));
    return m;
  }, [pets]);

  function clienteIdDe(e: { clienteId?: string; petId?: string }) {
    return e.clienteId || (e.petId ? petClienteMap.get(e.petId) : undefined);
  }

  const clientesStats = useMemo(() => {
    const ativosSet = new Set<string>();
    const ultimoPorCliente = new Map<string, string>();
    const totalPorCliente = new Map<string, number>();
    const qtdMesPorCliente = new Map<string, number>();
    const totalMesPorCliente = new Map<string, number>();

    entradas.forEach((e) => {
      const cid = clienteIdDe(e);
      if (!cid) return;
      // último atendimento
      const prev = ultimoPorCliente.get(cid);
      if (!prev || e.data > prev) ultimoPorCliente.set(cid, e.data);
      totalPorCliente.set(cid, (totalPorCliente.get(cid) || 0) + e.valor);
      if (e.data >= trintaDiasAtras) ativosSet.add(cid);
      if (monthKey(e.data) === selectedYM) {
        qtdMesPorCliente.set(cid, (qtdMesPorCliente.get(cid) || 0) + 1);
        totalMesPorCliente.set(cid, (totalMesPorCliente.get(cid) || 0) + e.valor);
      }
    });

    const ativos = ativosSet.size;
    const semRetorno = clientes.filter((c) => {
      const u = ultimoPorCliente.get(c.id);
      return u ? u < trintaDiasAtras : false; // só conta quem já foi atendido alguma vez
    }).length;

    const totalGastoGeral = Array.from(totalPorCliente.values()).reduce((a, b) => a + b, 0);
    const ticketMedio = totalPorCliente.size > 0 ? totalGastoGeral / totalPorCliente.size : 0;

    let topMes: { id: string; nome: string; valor: number } | null = null;
    totalMesPorCliente.forEach((valor, id) => {
      if (!topMes || valor > topMes.valor) {
        topMes = { id, valor, nome: clientes.find((c) => c.id === id)?.nome || "—" };
      }
    });

    const ranking = clientes
      .map((c) => ({
        id: c.id,
        nome: c.nome,
        atendimentosMes: qtdMesPorCliente.get(c.id) || 0,
        totalMes: totalMesPorCliente.get(c.id) || 0,
        ultimaVisita: ultimoPorCliente.get(c.id) || "",
      }))
      .filter((r) => r.atendimentosMes > 0 || r.totalMes > 0);

    return { ativos, semRetorno, ticketMedio, topMes, ranking };
  }, [entradas, clientes, selectedYM, trintaDiasAtras, petClienteMap]);

  // Serviços mais realizados (mês) — para gráfico de barras
  const servicosMes = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === selectedYM).forEach((e) => {
      const k = e.descricao || "—";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [entradas, selectedYM]);

  // Ordenação do ranking
  type SortKey = "nome" | "atendimentosMes" | "totalMes" | "ultimaVisita";
  const [sortKey, setSortKey] = useState<SortKey>("totalMes");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const rankingSorted = useMemo(() => {
    const arr = [...clientesStats.ranking];
    arr.sort((a, b) => {
      const va = a[sortKey] as string | number;
      const vb = b[sortKey] as string | number;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [clientesStats.ranking, sortKey, sortDir]);
  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "nome" ? "asc" : "desc"); }
  }

  const monthLabel = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const semDados = entradas.length === 0 && saidas.length === 0;

  return (
    <AppLayout title="Dashboard" subtitle={monthLabel}>
      <div className="space-y-6">
        {/* Seletor de mês/ano */}
        <section className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Período</span>
          <Select value={String(mes)} onValueChange={(v) => setSelectedYM(`${ano}-${String(Number(v)).padStart(2, "0")}`)}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES_LABEL.map((l, i) => (
                <SelectItem key={i} value={String(i + 1)}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={(v) => setSelectedYM(`${v}-${String(mes).padStart(2, "0")}`)}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={TrendingUp} label="Receitas" value={fmtBRL(stats.totalE)} tone="success" />
          <Stat icon={TrendingDown} label="Despesas" value={fmtBRL(stats.totalS)} tone="destructive" />
          <Stat icon={Wallet} label="Resultado" value={fmtBRL(stats.lucro)} tone={stats.lucro >= 0 ? "success" : "destructive"} />
          <Stat icon={Activity} label="Atendimentos" value={String(stats.atendimentos)} tone="muted" />
        </section>

        {/* Meta vs Realizado */}
        <section>
          <Panel title={`Meta vs Realizado · ${monthLabel}`}>
            {metaVsReal.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma meta cadastrada para {ano}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {metaVsReal.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className={`w-3.5 h-3.5 shrink-0 ${m.tipo === "Receita" ? "text-success" : "text-destructive"}`} />
                        <span className="font-medium truncate">{m.nome}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {fmtBRL(m.realizado)} / {fmtBRL(m.meta)}
                      </span>
                    </div>
                    <Progress value={m.pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{m.pct.toFixed(0)}%</span>
                      <span>
                        {m.tipo === "Receita"
                          ? (m.realizado >= m.meta ? "Meta atingida" : `Faltam ${fmtBRL(Math.max(0, m.meta - m.realizado))}`)
                          : (m.realizado <= m.meta ? "Dentro da meta" : `Acima em ${fmtBRL(m.realizado - m.meta)}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title={`Receita vs Despesa · ${ano}`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieMensal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => fmtBRL(Number(v))}
                  />
                  <Bar dataKey="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title={`Resultado acumulado · ${ano}`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serieMensal} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => fmtBRL(Number(v))}
                  />
                  <Line type="monotone" dataKey="Acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title={`Receita por categoria · ${monthLabel}`}>
            {pizzaCategorias.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem receitas no mês.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pizzaCategorias} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                      {pizzaCategorias.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => fmtBRL(Number(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title={`Top serviços · ${monthLabel}`}>
            {topServicos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Sem lançamentos no mês.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topServicos.map((s, i) => (
                  <li key={s.nome} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-muted text-xs font-medium flex items-center justify-center text-muted-foreground shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.nome}</p>
                        <p className="text-xs text-muted-foreground">{s.qtd}× atendimentos</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-success shrink-0">{fmtBRL(s.total)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        {/* === Seção Clientes === */}
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Clientes</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Users} label="Ativos (30 dias)" value={String(clientesStats.ativos)} tone="success" />
            <Stat icon={UserX} label="Sem retorno >30d" value={String(clientesStats.semRetorno)} tone="destructive" />
            <Stat icon={Receipt} label="Ticket médio / cliente" value={fmtBRL(clientesStats.ticketMedio)} tone="primary" />
            <Stat
              icon={Crown}
              label="Maior gasto no mês"
              value={clientesStats.topMes ? `${clientesStats.topMes.nome}` : "—"}
              tone="muted"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Panel title={`Ranking de clientes · ${monthLabel}`}>
                {rankingSorted.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem atendimentos registrados no mês.</p>
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <button onClick={() => toggleSort("nome")} className="inline-flex items-center gap-1 hover:text-foreground">
                              Tutor <ArrowUpDown className="w-3 h-3 opacity-50" />
                            </button>
                          </TableHead>
                          <TableHead className="text-right">
                            <button onClick={() => toggleSort("atendimentosMes")} className="inline-flex items-center gap-1 hover:text-foreground">
                              Atendimentos <ArrowUpDown className="w-3 h-3 opacity-50" />
                            </button>
                          </TableHead>
                          <TableHead className="text-right">
                            <button onClick={() => toggleSort("totalMes")} className="inline-flex items-center gap-1 hover:text-foreground">
                              Total gasto <ArrowUpDown className="w-3 h-3 opacity-50" />
                            </button>
                          </TableHead>
                          <TableHead className="text-right">
                            <button onClick={() => toggleSort("ultimaVisita")} className="inline-flex items-center gap-1 hover:text-foreground">
                              Última visita <ArrowUpDown className="w-3 h-3 opacity-50" />
                            </button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingSorted.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.nome}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{r.atendimentosMes}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-success">{fmtBRL(r.totalMes)}</TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">{r.ultimaVisita ? fmtDate(r.ultimaVisita) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Panel>
            </div>

            <Panel title={`Serviços mais realizados · ${monthLabel}`}>
              {servicosMes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Sem atendimentos no mês.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={servicosMes}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={120}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any) => [`${v} atendimento${Number(v) !== 1 ? "s" : ""}`, "Quantidade"]}
                      />
                      <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>
        </section>

        {semDados && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento ainda. Vá em{" "}
                <Link to="/financeiro" className="text-primary font-medium hover:underline">Lançamentos</Link>{" "}
                para registrar a primeira movimentação.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
