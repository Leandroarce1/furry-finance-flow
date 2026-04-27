import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useEntradas, useSaidas, usePlanoContas, useClientes, usePets,
} from "@/store/useStore";
import { fmtBRL, fmtDate, monthKey } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Activity, Users, UserX, Crown, Receipt, ArrowUpDown } from "lucide-react";
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

  const now = new Date();
  const ano = now.getFullYear();
  const currentMonth = `${ano}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // KPIs do mês
  const stats = useMemo(() => {
    const ents = entradas.filter((e) => monthKey(e.data) === currentMonth);
    const sais = saidas.filter((s) => monthKey(s.data) === currentMonth);
    const totalE = ents.reduce((a, b) => a + b.valor, 0);
    const totalS = sais.reduce((a, b) => a + b.valor, 0);
    return { totalE, totalS, lucro: totalE - totalS, atendimentos: ents.length };
  }, [entradas, saidas, currentMonth]);

  // Série mensal do ano (barras + linha acumulada)
  const serieMensal = useMemo(() => {
    let acc = 0;
    return MESES_LABEL.map((label, i) => {
      const mk = `${ano}-${String(i + 1).padStart(2, "0")}`;
      const ent = entradas.filter((e) => monthKey(e.data) === mk).reduce((a, x) => a + x.valor, 0);
      const sai = saidas.filter((s) => monthKey(s.data) === mk).reduce((a, x) => a + x.valor, 0);
      const resultado = ent - sai;
      acc += resultado;
      return { mes: label, Receita: ent, Despesa: sai, Acumulado: acc };
    });
  }, [entradas, saidas, ano]);

  // Pizza por categoria do plano de contas (mês atual, receitas)
  const pizzaCategorias = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === currentMonth).forEach((e) => {
      const pc = planoContas.find((p) => p.id === e.planoContaId);
      const nome = pc?.nome || e.categoria || "Sem categoria";
      map.set(nome, (map.get(nome) || 0) + e.valor);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [entradas, planoContas, currentMonth]);

  // Top serviços (descrição) — mês atual
  const topServicos = useMemo(() => {
    const map = new Map<string, { qtd: number; total: number }>();
    entradas.filter((e) => monthKey(e.data) === currentMonth).forEach((e) => {
      const k = e.descricao || "—";
      const cur = map.get(k) || { qtd: 0, total: 0 };
      cur.qtd += 1; cur.total += e.valor;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [entradas, currentMonth]);

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
      if (monthKey(e.data) === currentMonth) {
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
  }, [entradas, clientes, currentMonth, trintaDiasAtras, petClienteMap]);

  // Serviços mais realizados (mês) — para gráfico de barras
  const servicosMes = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === currentMonth).forEach((e) => {
      const k = e.descricao || "—";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [entradas, currentMonth]);

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

  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const semDados = entradas.length === 0 && saidas.length === 0;

  return (
    <AppLayout title="Dashboard" subtitle={monthLabel}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={TrendingUp} label="Receitas" value={fmtBRL(stats.totalE)} tone="success" />
          <Stat icon={TrendingDown} label="Despesas" value={fmtBRL(stats.totalS)} tone="destructive" />
          <Stat icon={Wallet} label="Resultado" value={fmtBRL(stats.lucro)} tone="primary" />
          <Stat icon={Activity} label="Atendimentos" value={String(stats.atendimentos)} tone="muted" />
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
