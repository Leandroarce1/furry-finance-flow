import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBancos, useEntradas, useSaidas } from "@/store/useStore";
import { fmtBRL, fmtDate, monthKey } from "@/lib/format";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function FluxoCaixa() {
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [bancos] = useBancos();
  const now = new Date();
  const [filtroMes, setFiltroMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [bancoId, setBancoId] = useState<string>("_");

  const monthOptions = useMemo(() => {
    const arr: string[] = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, []);

  const movimentacoes = useMemo(() => {
    const ents = entradas
      .filter((e) => monthKey(e.data) === filtroMes && (bancoId === "_" || e.contaBancariaId === bancoId))
      .map((e) => ({ id: e.id, data: e.data, tipo: "Entrada" as const, descricao: e.descricao, valor: e.valor, status: e.status, contaBancariaId: e.contaBancariaId }));
    const sais = saidas
      .filter((s) => monthKey(s.data) === filtroMes && (bancoId === "_" || s.contaBancariaId === bancoId))
      .map((s) => ({ id: s.id, data: s.data, tipo: "Saída" as const, descricao: s.descricao, valor: -s.valor, status: s.status, contaBancariaId: s.contaBancariaId }));
    return [...ents, ...sais].sort((a, b) => a.data.localeCompare(b.data));
  }, [entradas, saidas, filtroMes, bancoId]);

  const fluxoDiario = useMemo(() => {
    const map = new Map<string, number>();
    movimentacoes.filter((m) => m.status === "Pago").forEach((m) => {
      map.set(m.data, (map.get(m.data) || 0) + m.valor);
    });
    let acc = 0;
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([data, valor]) => {
      acc += valor;
      return { data, valor, acumulado: acc };
    });
  }, [movimentacoes]);

  const fluxoMensal = useMemo(() => {
    const ano = Number(filtroMes.split("-")[0]);
    return MESES_LABEL.map((label, i) => {
      const mk = `${ano}-${String(i + 1).padStart(2, "0")}`;
      const ent = entradas.filter((e) => monthKey(e.data) === mk && e.status === "Pago" && (bancoId === "_" || e.contaBancariaId === bancoId)).reduce((a, x) => a + x.valor, 0);
      const sai = saidas.filter((s) => monthKey(s.data) === mk && s.status === "Pago" && (bancoId === "_" || s.contaBancariaId === bancoId)).reduce((a, x) => a + x.valor, 0);
      return { mes: label, entradas: ent, saidas: sai, saldo: ent - sai };
    });
  }, [entradas, saidas, filtroMes, bancoId]);

  const bancoNome = (id?: string) => bancos.find((b) => b.id === id)?.nome || "—";

  return (
    <AppLayout
      title="Fluxo de Caixa"
      subtitle="Movimentações por banco e período"
      actions={
        <div className="flex gap-2">
          <Select value={bancoId} onValueChange={setBancoId}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">Todos os bancos</SelectItem>
              {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => {
                const [y, mm] = m.split("-");
                const d = new Date(Number(y), Number(mm) - 1, 1);
                return <SelectItem key={m} value={m}>{d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <Tabs defaultValue="movs">
        <TabsList className="mb-4">
          <TabsTrigger value="movs">Movimentações</TabsTrigger>
          <TabsTrigger value="diario">Fluxo Diário</TabsTrigger>
          <TabsTrigger value="mensal">Fluxo Mensal</TabsTrigger>
          <TabsTrigger value="anual">Mês a Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="movs">
          <Card className="shadow-card">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead>
                  <TableHead>Banco</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {movimentacoes.map((m) => (
                    <TableRow key={`${m.tipo}-${m.id}`}>
                      <TableCell>{fmtDate(m.data)}</TableCell>
                      <TableCell><Badge variant={m.tipo === "Entrada" ? "default" : "destructive"}>{m.tipo}</Badge></TableCell>
                      <TableCell className="font-medium">{m.descricao}</TableCell>
                      <TableCell className="text-sm">{bancoNome(m.contaBancariaId)}</TableCell>
                      <TableCell><Badge variant={m.status === "Pago" ? "secondary" : "outline"}>{m.status}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${m.valor >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(m.valor)}</TableCell>
                    </TableRow>
                  ))}
                  {movimentacoes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem movimentações.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diario">
          <Card className="shadow-card">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead className="text-right">Movimento do dia</TableHead><TableHead className="text-right">Saldo acumulado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {fluxoDiario.map((d) => (
                    <TableRow key={d.data}>
                      <TableCell>{fmtDate(d.data)}</TableCell>
                      <TableCell className={`text-right ${d.valor >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(d.valor)}</TableCell>
                      <TableCell className={`text-right font-semibold ${d.acumulado >= 0 ? "text-foreground" : "text-destructive"}`}>{fmtBRL(d.acumulado)}</TableCell>
                    </TableRow>
                  ))}
                  {fluxoDiario.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem dados pagos no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mensal">
          <Card className="shadow-card">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Mês</TableHead><TableHead className="text-right">Entradas</TableHead><TableHead className="text-right">Saídas</TableHead><TableHead className="text-right">Saldo</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {fluxoMensal.map((f) => (
                    <TableRow key={f.mes}>
                      <TableCell className="font-medium">{f.mes}</TableCell>
                      <TableCell className="text-right text-success">{fmtBRL(f.entradas)}</TableCell>
                      <TableCell className="text-right text-destructive">{fmtBRL(f.saidas)}</TableCell>
                      <TableCell className={`text-right font-semibold ${f.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(f.saldo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual">
          <Card className="shadow-card">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="sticky left-0 bg-card">Tipo</TableHead>
                  {MESES_LABEL.map((m) => <TableHead key={m} className="text-right">{m}</TableHead>)}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="sticky left-0 bg-card font-medium text-success">Entradas</TableCell>
                    {fluxoMensal.map((v) => <TableCell key={v.mes} className="text-right">{fmtBRL(v.entradas)}</TableCell>)}
                    <TableCell className="text-right font-semibold text-success">{fmtBRL(fluxoMensal.reduce((a, x) => a + x.entradas, 0))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="sticky left-0 bg-card font-medium text-destructive">Saídas</TableCell>
                    {fluxoMensal.map((v) => <TableCell key={v.mes} className="text-right">{fmtBRL(v.saidas)}</TableCell>)}
                    <TableCell className="text-right font-semibold text-destructive">{fmtBRL(fluxoMensal.reduce((a, x) => a + x.saidas, 0))}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="sticky left-0 bg-muted/30 font-semibold">Saldo</TableCell>
                    {fluxoMensal.map((v) => (
                      <TableCell key={v.mes} className={`text-right font-medium ${v.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(v.saldo)}</TableCell>
                    ))}
                    <TableCell className={`text-right font-bold ${fluxoMensal.reduce((a, x) => a + x.saldo, 0) >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(fluxoMensal.reduce((a, x) => a + x.saldo, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
