import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useEntradas, useSaidas } from "@/store/useStore";
import { fmtBRL, monthKey } from "@/lib/format";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "success" | "destructive" | "muted" }) {
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

  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AppLayout title="Dashboard" subtitle={monthLabel}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={TrendingUp} label="Receitas" value={fmtBRL(stats.totalE)} tone="success" />
        <Stat icon={TrendingDown} label="Despesas" value={fmtBRL(stats.totalS)} tone="destructive" />
        <Stat icon={Wallet} label="Resultado" value={fmtBRL(stats.lucro)} tone="primary" />
        <Stat icon={Activity} label="Atendimentos" value={String(stats.atendimentos)} tone="muted" />
      </div>
    </AppLayout>
  );
}
