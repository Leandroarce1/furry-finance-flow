import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEntradas, useSaidas } from "@/store/useStore";
import { fmtBRL, monthKey } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["hsl(262 83% 58%)", "hsl(280 80% 65%)", "hsl(300 75% 65%)", "hsl(245 80% 65%)", "hsl(200 80% 60%)"];

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <Card className="shadow-card border-border/60 overflow-hidden relative">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl md:text-3xl font-display font-bold mt-2">{value}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const stats = useMemo(() => {
    const ents = entradas.filter((e) => monthKey(e.data) === currentMonth);
    const sais = saidas.filter((s) => monthKey(s.data) === currentMonth);
    const totalE = ents.reduce((a, b) => a + b.valor, 0);
    const totalS = sais.reduce((a, b) => a + b.valor, 0);
    return { totalE, totalS, lucro: totalE - totalS, atendimentos: ents.length };
  }, [entradas, saidas, currentMonth]);

  const monthsData = useMemo(() => {
    const arr: { mes: string; receitas: number; despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      arr.push({
        mes: label,
        receitas: entradas.filter((e) => monthKey(e.data) === key).reduce((a, b) => a + b.valor, 0),
        despesas: saidas.filter((s) => monthKey(s.data) === key).reduce((a, b) => a + b.valor, 0),
      });
    }
    return arr;
  }, [entradas, saidas]);

  const categoriaData = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === currentMonth).forEach((e) => {
      map.set(e.categoria, (map.get(e.categoria) || 0) + e.valor);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [entradas, currentMonth]);

  const pagamentoData = useMemo(() => {
    const map = new Map<string, number>();
    entradas.filter((e) => monthKey(e.data) === currentMonth).forEach((e) => {
      map.set(e.formaPagamento, (map.get(e.formaPagamento) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [entradas, currentMonth]);

  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AppLayout title="Dashboard" subtitle={`Visão geral — ${monthLabel}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Receitas" value={fmtBRL(stats.totalE)} accent="bg-gradient-to-br from-success to-emerald-400" />
        <StatCard icon={TrendingDown} label="Despesas" value={fmtBRL(stats.totalS)} accent="bg-gradient-to-br from-destructive to-rose-400" />
        <StatCard icon={Wallet} label="Lucro do mês" value={fmtBRL(stats.lucro)} accent="bg-gradient-primary" />
        <StatCard icon={Activity} label="Atendimentos" value={String(stats.atendimentos)} accent="bg-gradient-to-br from-primary-glow to-fuchsia-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-display">Receitas vs Despesas — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmtBRL(v)}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">Receitas por categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoriaData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                    {categoriaData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base font-display">Formas de pagamento</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pagamentoData} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                    {pagamentoData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
