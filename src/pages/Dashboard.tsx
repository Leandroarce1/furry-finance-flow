import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  useEntradas, useSaidas, useClientes, usePets,
  useBancos, useFornecedores, usePlanoContas, useMetas,
} from "@/store/useStore";
import { fmtBRL, monthKey } from "@/lib/format";
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  Users, PawPrint, Building2, Truck, BookOpen, Target,
} from "lucide-react";

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

function MiniLink({
  to, icon: Icon, label, value,
}: { to: string; icon: any; label: string; value: number }) {
  return (
    <Link to={to}>
      <Card className="border-border/60 shadow-none hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-display font-semibold leading-tight">{value}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [clientes] = useClientes();
  const [pets] = usePets();
  const [bancos] = useBancos();
  const [fornecedores] = useFornecedores();
  const [planoContas] = usePlanoContas();
  const [metas] = useMetas();

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
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Mês atual</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={TrendingUp} label="Receitas" value={fmtBRL(stats.totalE)} tone="success" />
            <Stat icon={TrendingDown} label="Despesas" value={fmtBRL(stats.totalS)} tone="destructive" />
            <Stat icon={Wallet} label="Resultado" value={fmtBRL(stats.lucro)} tone="primary" />
            <Stat icon={Activity} label="Atendimentos" value={String(stats.atendimentos)} tone="muted" />
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cadastros</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniLink to="/clientes" icon={Users} label="Clientes" value={clientes.length} />
            <MiniLink to="/clientes" icon={PawPrint} label="Pets" value={pets.length} />
            <MiniLink to="/bancos" icon={Building2} label="Bancos" value={bancos.length} />
            <MiniLink to="/fornecedores" icon={Truck} label="Fornecedores" value={fornecedores.length} />
            <MiniLink to="/plano-de-contas" icon={BookOpen} label="Plano de Contas" value={planoContas.length} />
            <MiniLink to="/metas" icon={Target} label="Metas" value={metas.length} />
          </div>
        </section>

        {entradas.length === 0 && saidas.length === 0 && (
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
