import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMetas, usePlanoContas } from "@/store/useStore";
import { fmtBRL } from "@/lib/format";
import { uid } from "@/lib/format";
import type { Meta } from "@/lib/types";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Metas() {
  const [metas, setMetas] = useMetas();
  const [planoContas] = usePlanoContas();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());

  function getValor(planoContaId: string, mIdx: number) {
    const m = metas.find((x) => x.ano === ano && x.planoContaId === planoContaId);
    return m?.valores[mIdx] ?? 0;
  }
  function setValor(planoContaId: string, mIdx: number, valor: number) {
    const existing = metas.find((x) => x.ano === ano && x.planoContaId === planoContaId);
    if (existing) {
      const valores = [...existing.valores];
      valores[mIdx] = valor;
      setMetas(metas.map((x) => x.id === existing.id ? { ...x, valores } : x));
    } else {
      const valores = Array(12).fill(0);
      valores[mIdx] = valor;
      setMetas([...metas, { id: uid(), ano, planoContaId, valores }]);
    }
  }

  const renderTabela = (tipo: "Receita" | "Despesa") => {
    const lista = planoContas.filter((p) => p.tipo === tipo);
    return (
      <Card className="shadow-card mb-4">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px] sticky left-0 bg-background">{tipo}s</TableHead>
                {MESES.map((m) => <TableHead key={m} className="text-center min-w-[90px]">{m}</TableHead>)}
                <TableHead className="text-right min-w-[110px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((p) => {
                const total = MESES.reduce((a, _, i) => a + getValor(p.id, i), 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium sticky left-0 bg-background">{p.nome}</TableCell>
                    {MESES.map((_, i) => (
                      <TableCell key={i} className="p-1">
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-right text-xs"
                          value={getValor(p.id, i) || ""}
                          onChange={(e) => setValor(p.id, i, parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold">{fmtBRL(total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const anos = useMemo(() => [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1], []);

  return (
    <AppLayout
      title="Metas"
      subtitle="Defina metas mensais por categoria"
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
    </AppLayout>
  );
}
