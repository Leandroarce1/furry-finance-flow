import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useEntradas, useMetas, usePlanoContas, useSaidas } from "@/store/useStore";
import { fmtBRL } from "@/lib/format";
import { exportPrevistoRealizado } from "@/lib/exporters";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function PrevistoRealizado() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [metas] = useMetas();
  const [planoContas] = usePlanoContas();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);

  const realizadoPorConta = useMemo(() => {
    const map = new Map<string, number[]>();
    planoContas.forEach((p) => map.set(p.id, Array(12).fill(0)));
    const acc = (l: any) => {
      if (!l.planoContaId) return;
      // modo "somente concluídos" exige dataPagamento; caso contrário usa data de vencimento/data
      const refDate = incluirPrevistos
        ? (l.dataPagamento || l.dataVencimento || l.data)
        : l.dataPagamento;
      if (!refDate) return;
      const [y, m] = refDate.split("-").map(Number);
      if (y !== ano) return;
      const arr = map.get(l.planoContaId);
      if (arr) arr[m - 1] += l.valor;
    };
    entradas.forEach(acc);
    saidas.forEach(acc);
    return map;
  }, [entradas, saidas, planoContas, ano, incluirPrevistos]);

  const getMeta = (planoId: string, mIdx: number) => {
    const m = metas.find((x) => x.ano === ano && x.planoContaId === planoId);
    return m?.valores[mIdx] ?? 0;
  };

  const receitas = planoContas.filter((p) => p.tipo === "Receita");
  const despesas = planoContas.filter((p) => p.tipo === "Despesa");

  const sumArr = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const totalPrev = (lista: typeof planoContas) =>
    MESES.map((_, i) => lista.reduce((a, p) => a + getMeta(p.id, i), 0));
  const totalReal = (lista: typeof planoContas) =>
    MESES.map((_, i) => lista.reduce((a, p) => a + (realizadoPorConta.get(p.id)?.[i] || 0), 0));

  const recPrev = totalPrev(receitas);
  const recReal = totalReal(receitas);
  const despPrev = totalPrev(despesas);
  const despReal = totalReal(despesas);
  const resPrev = MESES.map((_, i) => recPrev[i] - despPrev[i]);
  const resReal = MESES.map((_, i) => recReal[i] - despReal[i]);

  // Coloração: para receitas, real >= prev é verde; para despesas, real <= prev é verde
  const corValor = (real: number, prev: number, tipo: "Receita" | "Despesa") => {
    if (prev === 0 && real === 0) return "";
    if (tipo === "Receita") return real >= prev ? "text-success" : "text-destructive";
    return real <= prev ? "text-success" : "text-destructive";
  };

  const renderLinhaConta = (p: typeof planoContas[number]) => {
    const realArr = realizadoPorConta.get(p.id) || Array(12).fill(0);
    const prevArr = MESES.map((_, i) => getMeta(p.id, i));
    return (
      <TableRow key={p.id}>
        <TableCell className="font-medium sticky left-0 bg-background z-10 whitespace-nowrap">{p.nome}</TableCell>
        {MESES.map((_, i) => (
          <>
            <TableCell key={`p-${i}`} className="text-right text-[11px] text-muted-foreground">
              {prevArr[i] ? fmtBRL(prevArr[i]) : "—"}
            </TableCell>
            <TableCell key={`r-${i}`} className={`text-right text-[11px] font-semibold ${corValor(realArr[i], prevArr[i], p.tipo)}`}>
              {realArr[i] ? fmtBRL(realArr[i]) : "—"}
            </TableCell>
          </>
        ))}
        <TableCell className="text-right text-xs text-muted-foreground">{fmtBRL(sumArr(prevArr))}</TableCell>
        <TableCell className={`text-right text-xs font-semibold ${corValor(sumArr(realArr), sumArr(prevArr), p.tipo)}`}>
          {fmtBRL(sumArr(realArr))}
        </TableCell>
      </TableRow>
    );
  };

  const renderLinhaTotal = (
    label: string,
    prevArr: number[],
    realArr: number[],
    tipo: "Receita" | "Despesa" | "Resultado",
    bg: string
  ) => (
    <TableRow className={bg}>
      <TableCell className={`font-bold sticky left-0 z-10 whitespace-nowrap ${bg}`}>{label}</TableCell>
      {MESES.map((_, i) => {
        const cor =
          tipo === "Resultado"
            ? realArr[i] >= 0 ? "text-success" : "text-destructive"
            : corValor(realArr[i], prevArr[i], tipo as "Receita" | "Despesa");
        return (
          <>
            <TableCell key={`tp-${i}`} className="text-right text-[11px] text-muted-foreground font-semibold">
              {prevArr[i] ? fmtBRL(prevArr[i]) : "—"}
            </TableCell>
            <TableCell key={`tr-${i}`} className={`text-right text-[11px] font-bold ${cor}`}>
              {realArr[i] ? fmtBRL(realArr[i]) : "—"}
            </TableCell>
          </>
        );
      })}
      <TableCell className="text-right text-xs font-bold text-muted-foreground">{fmtBRL(sumArr(prevArr))}</TableCell>
      <TableCell
        className={`text-right text-xs font-bold ${
          tipo === "Resultado"
            ? sumArr(realArr) >= 0 ? "text-success" : "text-destructive"
            : corValor(sumArr(realArr), sumArr(prevArr), tipo as "Receita" | "Despesa")
        }`}
      >
        {fmtBRL(sumArr(realArr))}
      </TableCell>
    </TableRow>
  );

  const anos = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <AppLayout
      title="Previsto x Realizado"
      subtitle="Comparativo anual por categoria"
      actions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="modo" checked={incluirPrevistos} onCheckedChange={setIncluirPrevistos} />
            <Label htmlFor="modo" className="text-xs cursor-pointer">
              {incluirPrevistos ? "Incluir Previstos" : "Somente Concluídos"}
            </Label>
          </div>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      }
    >
      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="min-w-[200px] sticky left-0 bg-background z-20 align-bottom">
                  Conta
                </TableHead>
                {MESES.map((m) => (
                  <TableHead key={m} colSpan={2} className="text-center border-l min-w-[150px]">{m}</TableHead>
                ))}
                <TableHead colSpan={2} className="text-center border-l min-w-[160px]">Total</TableHead>
              </TableRow>
              <TableRow>
                {MESES.map((m) => (
                  <>
                    <TableHead key={`${m}-p`} className="text-right text-[10px] uppercase text-muted-foreground border-l">Prev.</TableHead>
                    <TableHead key={`${m}-r`} className="text-right text-[10px] uppercase">Real.</TableHead>
                  </>
                ))}
                <TableHead className="text-right text-[10px] uppercase text-muted-foreground border-l">Prev.</TableHead>
                <TableHead className="text-right text-[10px] uppercase">Real.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-success/5">
                <TableCell className="font-bold text-success sticky left-0 bg-success/5 z-10" colSpan={2 * 12 + 3}>
                  RECEBIMENTOS
                </TableCell>
              </TableRow>
              {receitas.map(renderLinhaConta)}
              {renderLinhaTotal("Total Recebimentos", recPrev, recReal, "Receita", "bg-success/10")}

              <TableRow className="bg-destructive/5">
                <TableCell className="font-bold text-destructive sticky left-0 bg-destructive/5 z-10" colSpan={2 * 12 + 3}>
                  GASTOS
                </TableCell>
              </TableRow>
              {despesas.map(renderLinhaConta)}
              {renderLinhaTotal("Total Gastos", despPrev, despReal, "Despesa", "bg-destructive/10")}

              {renderLinhaTotal("Resultado Líquido", resPrev, resReal, "Resultado", "bg-primary/10")}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Prev. = Previsto (das metas) · Real. = Realizado · Verde indica performance favorável, vermelho desfavorável.
      </p>
    </AppLayout>
  );
}
