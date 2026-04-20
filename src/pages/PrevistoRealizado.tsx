import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEntradas, useMetas, usePlanoContas, useSaidas } from "@/store/useStore";
import { fmtBRL, monthKey } from "@/lib/format";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function PrevistoRealizado() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [metas] = useMetas();
  const [planoContas] = usePlanoContas();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());

  const realizadoPorConta = useMemo(() => {
    const map = new Map<string, number[]>();
    planoContas.forEach((p) => map.set(p.id, Array(12).fill(0)));
    const acc = (data: string, planoId: string | undefined, valor: number) => {
      if (!planoId) return;
      const [y, m] = data.split("-").map(Number);
      if (y !== ano) return;
      const arr = map.get(planoId);
      if (arr) arr[m - 1] += valor;
    };
    entradas.forEach((e) => acc(e.data, e.planoContaId, e.valor));
    saidas.forEach((s) => acc(s.data, s.planoContaId, s.valor));
    return map;
  }, [entradas, saidas, planoContas, ano]);

  function getMeta(planoId: string, mIdx: number) {
    const m = metas.find((x) => x.ano === ano && x.planoContaId === planoId);
    return m?.valores[mIdx] ?? 0;
  }

  const renderTabela = (tipo: "Receita" | "Despesa") => {
    const lista = planoContas.filter((p) => p.tipo === tipo);
    return (
      <Card className="shadow-card mb-4">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px] sticky left-0 bg-background">{tipo}</TableHead>
                {MESES.map((m) => (
                  <TableHead key={m} className="text-center min-w-[140px]">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((p) => {
                const realArr = realizadoPorConta.get(p.id) || Array(12).fill(0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium sticky left-0 bg-background">{p.nome}</TableCell>
                    {MESES.map((_, i) => {
                      const meta = getMeta(p.id, i);
                      const real = realArr[i];
                      const pct = meta > 0 ? (real / meta) * 100 : 0;
                      const corPct = tipo === "Receita"
                        ? (pct >= 100 ? "text-success" : pct >= 70 ? "text-warning" : "text-muted-foreground")
                        : (pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : "text-success");
                      return (
                        <TableCell key={i} className="text-xs">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-muted-foreground">M: {fmtBRL(meta)}</span>
                            <span className="font-semibold">R: {fmtBRL(real)}</span>
                            {meta > 0 && <span className={corPct}>{pct.toFixed(0)}%</span>}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const anos = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <AppLayout
      title="Previsto x Realizado"
      subtitle="Comparativo mensal por categoria"
      actions={
        <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
        </Select>
      }
    >
      <h2 className="font-display font-semibold mb-2 text-success">Receitas</h2>
      {renderTabela("Receita")}
      <h2 className="font-display font-semibold mb-2 text-destructive">Despesas</h2>
      {renderTabela("Despesa")}
      <p className="text-xs text-muted-foreground mt-2">M = Meta · R = Realizado</p>
    </AppLayout>
  );
}
