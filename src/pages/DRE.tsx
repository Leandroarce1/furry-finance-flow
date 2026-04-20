import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEntradas, usePlanoContas, useSaidas } from "@/store/useStore";
import { fmtBRL } from "@/lib/format";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function DRE() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [planoContas] = usePlanoContas();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());

  const dados = useMemo(() => {
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

  const totalReceitas = MESES.map((_, i) =>
    planoContas.filter((p) => p.tipo === "Receita").reduce((a, p) => a + (dados.get(p.id)?.[i] || 0), 0)
  );
  const totalDespesas = MESES.map((_, i) =>
    planoContas.filter((p) => p.tipo === "Despesa").reduce((a, p) => a + (dados.get(p.id)?.[i] || 0), 0)
  );
  const resultado = MESES.map((_, i) => totalReceitas[i] - totalDespesas[i]);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const renderLinha = (label: string, arr: number[], cls = "") => (
    <TableRow className={cls}>
      <TableCell className="font-medium sticky left-0 bg-background">{label}</TableCell>
      {arr.map((v, i) => <TableCell key={i} className="text-right text-xs">{v ? fmtBRL(v) : "—"}</TableCell>)}
      <TableCell className="text-right font-semibold text-xs">{fmtBRL(sum(arr))}</TableCell>
    </TableRow>
  );

  const anos = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <AppLayout
      title="DRE Detalhado"
      subtitle="Demonstrativo de Resultado do Exercício"
      actions={
        <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
        </Select>
      }
    >
      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px] sticky left-0 bg-background">Conta</TableHead>
                {MESES.map((m) => <TableHead key={m} className="text-right min-w-[90px]">{m}</TableHead>)}
                <TableHead className="text-right min-w-[110px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-success/10">
                <TableCell className="font-bold sticky left-0 bg-success/10">RECEITAS</TableCell>
                {totalReceitas.map((v, i) => <TableCell key={i} className="text-right font-bold text-success text-xs">{fmtBRL(v)}</TableCell>)}
                <TableCell className="text-right font-bold text-success">{fmtBRL(sum(totalReceitas))}</TableCell>
              </TableRow>
              {planoContas.filter((p) => p.tipo === "Receita").map((p) =>
                renderLinha(`  ${p.nome}`, dados.get(p.id) || Array(12).fill(0))
              )}
              <TableRow className="bg-destructive/10">
                <TableCell className="font-bold sticky left-0 bg-destructive/10">DESPESAS</TableCell>
                {totalDespesas.map((v, i) => <TableCell key={i} className="text-right font-bold text-destructive text-xs">{fmtBRL(v)}</TableCell>)}
                <TableCell className="text-right font-bold text-destructive">{fmtBRL(sum(totalDespesas))}</TableCell>
              </TableRow>
              {planoContas.filter((p) => p.tipo === "Despesa").map((p) =>
                renderLinha(`  ${p.nome}`, dados.get(p.id) || Array(12).fill(0))
              )}
              <TableRow className="bg-primary/10">
                <TableCell className="font-bold sticky left-0 bg-primary/10">RESULTADO</TableCell>
                {resultado.map((v, i) => <TableCell key={i} className={`text-right font-bold text-xs ${v >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(v)}</TableCell>)}
                <TableCell className={`text-right font-bold ${sum(resultado) >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(sum(resultado))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
