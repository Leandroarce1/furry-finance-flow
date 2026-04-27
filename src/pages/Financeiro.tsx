import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet, Check, ChevronsUpDown, PawPrint } from "lucide-react";
import { useBancos, useClientes, useEntradas, usePets, usePlanoContas, useSaidas } from "@/store/useStore";
import type { CategoriaEntrada, CategoriaSaida, Entrada, FormaPagamento, Saida } from "@/lib/types";
import { fmtBRL, fmtDate, monthKey, todayISO, uid } from "@/lib/format";
import { cn } from "@/lib/utils";

const CAT_E: CategoriaEntrada[] = ["Banho", "Tosa", "Banho+Tosa", "Hidratação", "Outros"];
const CAT_S: CategoriaSaida[] = ["Produtos", "Energia", "Aluguel", "Manutenção", "Outros"];
const FP: FormaPagamento[] = ["Dinheiro", "Pix", "Cartão Débito", "Cartão Crédito", "Permuta"];
const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const emptyE: Omit<Entrada, "id"> = { data: todayISO(), descricao: "", categoria: "Banho", valor: 0, formaPagamento: "Pix", clienteId: "", petId: "", status: "Pago", contaBancariaId: "", subcategoria: "", dataVencimento: todayISO(), dataPagamento: "", observacoes: "" };

// Status calculado para entradas (vencimento/pagamento)
type StatusCalc = "Concluído" | "Atrasado" | "Previsto para hoje" | "Previsto" | "—";
function calcStatus(e: { dataVencimento?: string; dataPagamento?: string }): StatusCalc {
  if (e.dataPagamento) return "Concluído";
  if (!e.dataVencimento) return "—";
  const hoje = todayISO();
  if (e.dataVencimento < hoje) return "Atrasado";
  if (e.dataVencimento === hoje) return "Previsto para hoje";
  return "Previsto";
}
function statusBadgeClass(s: StatusCalc): string {
  switch (s) {
    case "Concluído": return "bg-success/15 text-success border-success/30 hover:bg-success/15";
    case "Atrasado": return "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15";
    case "Previsto para hoje": return "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/15 dark:text-amber-400";
    case "Previsto": return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
const emptyS: Omit<Saida, "id"> = { data: todayISO(), descricao: "", categoria: "Produtos", valor: 0, formaPagamento: "Pix", status: "A Pagar", contaBancariaId: "", subcategoria: "", planoContaId: "", fornecedor: "", dataVencimento: todayISO(), dataPagamento: "", observacoes: "" };

export default function Financeiro() {
  const [entradas, setEntradas] = useEntradas();
  const [saidas, setSaidas] = useSaidas();
  const [clientes] = useClientes();
  const [pets] = usePets();
  const [bancos] = useBancos();
  const [planoContas] = usePlanoContas();

  const now = new Date();
  const [filtroMes, setFiltroMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [anoAnual, setAnoAnual] = useState<number>(now.getFullYear());

  const [openE, setOpenE] = useState(false);
  const [editE, setEditE] = useState<Entrada | null>(null);
  const [formE, setFormE] = useState<Omit<Entrada, "id">>(emptyE);
  const [clientePopOpen, setClientePopOpen] = useState(false);

  const [openS, setOpenS] = useState(false);
  const [editS, setEditS] = useState<Saida | null>(null);
  const [formS, setFormS] = useState<Omit<Saida, "id">>(emptyS);

  // Caixa da Loja id (para fallback de Permuta)
  const caixaLojaId = useMemo(
    () => bancos.find((b) => /caixa/i.test(b.nome) && /loja/i.test(b.nome))?.id || bancos[0]?.id || "",
    [bancos],
  );
  const permutaBancoId = useMemo(
    () => bancos.find((b) => /^permuta$/i.test(b.nome))?.id || "",
    [bancos],
  );

  // Categorias do plano de contas por tipo
  const categoriasReceita = useMemo(() => planoContas.filter((p) => p.tipo === "Receita"), [planoContas]);
  const categoriasDespesa = useMemo(() => planoContas.filter((p) => p.tipo === "Despesa"), [planoContas]);

  // Lista de serviços (subcategorias do plano de contas tipo Receita)
  const servicos = useMemo(() => {
    const arr: { id: string; nome: string; valor: number; planoContaId: string }[] = [];
    planoContas.filter((p) => p.tipo === "Receita").forEach((p) => {
      p.subcategorias.forEach((s, i) => {
        arr.push({ id: `${p.id}::${i}`, nome: s.nome, valor: s.valor || 0, planoContaId: p.id });
      });
    });
    return arr;
  }, [planoContas]);

  const itensDespesa = useMemo(() => {
    const arr: { id: string; nome: string; planoContaId: string }[] = [];
    planoContas.filter((p) => p.tipo === "Despesa").forEach((p) => {
      p.subcategorias.forEach((s, i) => arr.push({ id: `${p.id}::${i}`, nome: s.nome, planoContaId: p.id }));
    });
    return arr;
  }, [planoContas]);

  // Filtros adicionais — entradas
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroConta, setFiltroConta] = useState<string>("todas");
  // Filtros — saídas
  const [filtroStatusS, setFiltroStatusS] = useState<string>("todos");
  const [filtroContaS, setFiltroContaS] = useState<string>("todas");
  // Filtro — lançamentos combinados
  const [filtroTipoLanc, setFiltroTipoLanc] = useState<"todos" | "entrada" | "saida">("todos");

  // Data de referência: vencimento se houver, senão data
  const refDate = (e: { dataVencimento?: string; data: string }) => e.dataVencimento || e.data;

  const filtroEntradas = useMemo(() => {
    return entradas
      .filter((e) => monthKey(refDate(e)) === filtroMes)
      .filter((e) => filtroStatus === "todos" ? true : calcStatus(e) === filtroStatus)
      .filter((e) => filtroConta === "todas" ? true : e.contaBancariaId === filtroConta)
      .sort((a, b) => refDate(b).localeCompare(refDate(a)));
  }, [entradas, filtroMes, filtroStatus, filtroConta]);
  const filtroSaidas = useMemo(() => {
    return saidas
      .filter((s) => monthKey(refDate(s)) === filtroMes)
      .filter((s) => filtroStatusS === "todos" ? true : calcStatus(s) === filtroStatusS)
      .filter((s) => filtroContaS === "todas" ? true : s.contaBancariaId === filtroContaS)
      .sort((a, b) => refDate(b).localeCompare(refDate(a)));
  }, [saidas, filtroMes, filtroStatusS, filtroContaS]);

  const totalE = filtroEntradas.reduce((a, b) => a + b.valor, 0);
  const totalS = filtroSaidas.reduce((a, b) => a + b.valor, 0);
  const lucro = totalE - totalS;

  const petsDoCliente = (cliId: string) => pets.filter((p) => p.clienteId === cliId);
  const bancoNome = (id?: string) => bancos.find((b) => b.id === id)?.nome || "—";

  // Banco efetivo: se Permuta → Caixa da Loja
  function bancoEfetivo(banco: string | undefined, fp: FormaPagamento): string {
    if (fp === "Permuta") return caixaLojaId;
    return banco || "";
  }

  function onPickServico(servId: string) {
    const s = servicos.find((x) => x.id === servId);
    if (!s) return;
    setFormE((prev) => ({ ...prev, descricao: s.nome, valor: s.valor || prev.valor, planoContaId: s.planoContaId }));
  }
  function onPickItemDespesa(itemId: string) {
    const i = itensDespesa.find((x) => x.id === itemId);
    if (!i) return;
    setFormS((prev) => ({ ...prev, descricao: i.nome, planoContaId: i.planoContaId }));
  }

  function openNewE() {
    setEditE(null);
    setFormE({ ...emptyE, data: todayISO(), dataVencimento: todayISO(), contaBancariaId: bancos[0]?.id || "" });
    setOpenE(true);
  }
  function openEditE(e: Entrada) { setEditE(e); setFormE({ ...emptyE, ...e }); setOpenE(true); }
  function saveE() {
    if (!formE.planoContaId) return toast.error("Selecione a categoria");
    if (!formE.subcategoria) return toast.error("Selecione a subcategoria");
    if (!formE.valor || formE.valor <= 0) return toast.error("Informe um valor maior que zero");
    if (!formE.contaBancariaId) return toast.error("Selecione a conta bancária");
    if (!formE.dataVencimento) return toast.error("Informe a data de vencimento");

    // se conta = Permuta, força forma = Permuta
    let formaPagamento = formE.formaPagamento;
    if (permutaBancoId && formE.contaBancariaId === permutaBancoId) formaPagamento = "Permuta";

    const dataRef = formE.dataPagamento || formE.dataVencimento || todayISO();
    const descricao = formE.subcategoria || formE.descricao || "";
    const status = formE.dataPagamento ? "Pago" : "A Receber";

    const clean: Omit<Entrada, "id"> = {
      ...formE,
      formaPagamento,
      data: dataRef,
      descricao,
      status,
      clienteId: formE.clienteId || undefined,
      petId: formE.petId || undefined,
    };
    if (editE) {
      setEntradas(entradas.map((x) => x.id === editE.id ? { ...editE, ...clean } : x));
      toast.success("Entrada atualizada");
    } else {
      setEntradas([...entradas, { ...clean, id: uid() }]);
      toast.success("Entrada registrada");
    }
    setOpenE(false);
  }
  function delE(id: string) { setEntradas(entradas.filter((e) => e.id !== id)); toast.success("Entrada excluída"); }

  function openNewS() {
    setEditS(null);
    setFormS({ ...emptyS, data: todayISO(), dataVencimento: todayISO(), contaBancariaId: bancos[0]?.id || "" });
    setOpenS(true);
  }
  function openEditS(s: Saida) { setEditS(s); setFormS({ ...emptyS, ...s }); setOpenS(true); }
  function saveS() {
    if (!formS.planoContaId) return toast.error("Selecione a categoria");
    if (!formS.subcategoria) return toast.error("Selecione a subcategoria");
    if (!formS.valor || formS.valor <= 0) return toast.error("Informe um valor maior que zero");
    if (!formS.dataVencimento) return toast.error("Informe a data de vencimento");

    let formaPagamento = formS.formaPagamento;
    let contaBancariaId = formS.contaBancariaId;
    if (permutaBancoId && contaBancariaId === permutaBancoId) formaPagamento = "Permuta";
    if (formaPagamento === "Permuta" && !contaBancariaId) contaBancariaId = caixaLojaId;
    if (!contaBancariaId) return toast.error("Selecione a conta bancária");

    const dataRef = formS.dataPagamento || formS.dataVencimento || todayISO();
    const descricao = formS.subcategoria || formS.descricao || "";
    const status: "Pago" | "A Pagar" = formS.dataPagamento ? "Pago" : "A Pagar";

    const clean: Omit<Saida, "id"> = {
      ...formS,
      formaPagamento,
      contaBancariaId,
      data: dataRef,
      descricao,
      status,
    };
    if (editS) {
      setSaidas(saidas.map((x) => x.id === editS.id ? { ...editS, ...clean } : x));
      toast.success("Saída atualizada");
    } else {
      setSaidas([...saidas, { ...clean, id: uid() }]);
      toast.success("Saída registrada");
    }
    setOpenS(false);
  }
  function delS(id: string) { setSaidas(saidas.filter((s) => s.id !== id)); toast.success("Saída excluída"); }

  const monthOptions = useMemo(() => {
    const arr: string[] = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return arr;
  }, []);

  // Visão anual (Jan..Dez do ano selecionado)
  const visaoAnual = useMemo(() => {
    return MESES_LABEL.map((label, i) => {
      const mk = `${anoAnual}-${String(i + 1).padStart(2, "0")}`;
      const ent = entradas.filter((e) => monthKey(e.data) === mk).reduce((a, x) => a + x.valor, 0);
      const sai = saidas.filter((s) => monthKey(s.data) === mk).reduce((a, x) => a + x.valor, 0);
      return { mes: label, entradas: ent, saidas: sai, saldo: ent - sai };
    });
  }, [entradas, saidas, anoAnual]);

  const totalAnualE = visaoAnual.reduce((a, x) => a + x.entradas, 0);
  const totalAnualS = visaoAnual.reduce((a, x) => a + x.saidas, 0);

  return (
    <AppLayout
      title="Financeiro"
      subtitle="Controle de entradas e saídas"
      actions={
        <Select value={filtroMes} onValueChange={setFiltroMes}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => {
              const [y, mm] = m.split("-");
              const d = new Date(Number(y), Number(mm) - 1, 1);
              return <SelectItem key={m} value={m}>{d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      }
    >
      <Tabs defaultValue="visao">
        <TabsList className="mb-4">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="entradas">Entradas</TabsTrigger>
          <TabsTrigger value="saidas">Saídas</TabsTrigger>
          <TabsTrigger value="anual">Mês a Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center gap-3"><ArrowUpCircle className="w-8 h-8 text-success" />
                <div><p className="text-xs uppercase text-muted-foreground">Receitas</p><p className="text-2xl font-display font-bold">{fmtBRL(totalE)}</p></div>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center gap-3"><ArrowDownCircle className="w-8 h-8 text-destructive" />
                <div><p className="text-xs uppercase text-muted-foreground">Despesas</p><p className="text-2xl font-display font-bold">{fmtBRL(totalS)}</p></div>
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center gap-3"><Wallet className="w-8 h-8 text-primary" />
                <div><p className="text-xs uppercase text-muted-foreground">Resultado</p><p className="text-2xl font-display font-bold">{fmtBRL(lucro)}</p></div>
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="entradas">
          <div className="flex flex-wrap items-end gap-2 justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Previsto para hoje">Previsto para hoje</SelectItem>
                    <SelectItem value="Previsto">Previsto</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conta bancária</Label>
                <Select value={filtroConta} onValueChange={setFiltroConta}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as contas</SelectItem>
                    {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={openNewE}><Plus className="w-4 h-4 mr-1" />Nova Entrada</Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroEntradas.map((e) => {
                    const st = calcStatus(e);
                    const cli = clientes.find((c) => c.id === e.clienteId);
                    const cat = planoContas.find((p) => p.id === e.planoContaId)?.nome || "—";
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap">{fmtDate(refDate(e))}</TableCell>
                        <TableCell><Badge variant="secondary">{cat}</Badge></TableCell>
                        <TableCell className="font-medium">{e.subcategoria || e.descricao}</TableCell>
                        <TableCell className="text-sm">{cli?.nome || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-success">{fmtBRL(e.valor)}</TableCell>
                        <TableCell className="text-sm">{bancoNome(e.contaBancariaId)}</TableCell>
                        <TableCell className="text-sm">{e.formaPagamento}</TableCell>
                        <TableCell><Badge variant="outline" className={statusBadgeClass(st)}>{st}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEditE(e)}><Pencil className="w-4 h-4" /></Button>
                          <DeleteBtn onConfirm={() => delE(e.id)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtroEntradas.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
                <span className="text-sm">Total: <strong className="text-success">{fmtBRL(totalE)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas">
          <div className="flex flex-wrap items-end gap-2 justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filtroStatusS} onValueChange={setFiltroStatusS}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Previsto para hoje">Previsto para hoje</SelectItem>
                    <SelectItem value="Previsto">Previsto</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conta bancária</Label>
                <Select value={filtroContaS} onValueChange={setFiltroContaS}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as contas</SelectItem>
                    {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={openNewS}><Plus className="w-4 h-4 mr-1" />Nova Saída</Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroSaidas.map((s) => {
                    const st = calcStatus(s);
                    const cat = planoContas.find((p) => p.id === s.planoContaId)?.nome || s.categoria || "—";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">{fmtDate(refDate(s))}</TableCell>
                        <TableCell><Badge variant="secondary">{cat}</Badge></TableCell>
                        <TableCell className="font-medium">{s.subcategoria || s.descricao}</TableCell>
                        <TableCell className="text-sm">{s.fornecedor || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">{fmtBRL(s.valor)}</TableCell>
                        <TableCell className="text-sm">{bancoNome(s.contaBancariaId)}</TableCell>
                        <TableCell className="text-sm">{s.formaPagamento}</TableCell>
                        <TableCell><Badge variant="outline" className={statusBadgeClass(st)}>{st}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => openEditS(s)}><Pencil className="w-4 h-4" /></Button>
                          <DeleteBtn onConfirm={() => delS(s.id)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtroSaidas.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
                <span className="text-sm">Total: <strong className="text-destructive">{fmtBRL(totalS)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lancamentos">
          <div className="flex flex-wrap items-end gap-2 justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filtroTipoLanc} onValueChange={(v: any) => setFiltroTipoLanc(v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Conta bancária</Label>
                <Select value={filtroConta} onValueChange={setFiltroConta}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as contas</SelectItem>
                    {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openNewS}><Plus className="w-4 h-4 mr-1" />Saída</Button>
              <Button onClick={openNewE}><Plus className="w-4 h-4 mr-1" />Entrada</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead>Cliente / Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(() => {
                    type Row = { id: string; tipo: "entrada" | "saida"; data: string; cat: string; sub: string; party: string; valor: number; conta: string; fp: string; st: StatusCalc };
                    const rows: Row[] = [];
                    if (filtroTipoLanc !== "saida") {
                      filtroEntradas.forEach((e) => {
                        const cat = planoContas.find((p) => p.id === e.planoContaId)?.nome || "—";
                        const cli = clientes.find((c) => c.id === e.clienteId)?.nome || "—";
                        rows.push({ id: "e-" + e.id, tipo: "entrada", data: refDate(e), cat, sub: e.subcategoria || e.descricao, party: cli, valor: e.valor, conta: bancoNome(e.contaBancariaId), fp: e.formaPagamento, st: calcStatus(e) });
                      });
                    }
                    if (filtroTipoLanc !== "entrada") {
                      filtroSaidas.forEach((s) => {
                        const cat = planoContas.find((p) => p.id === s.planoContaId)?.nome || s.categoria || "—";
                        rows.push({ id: "s-" + s.id, tipo: "saida", data: refDate(s), cat, sub: s.subcategoria || s.descricao, party: s.fornecedor || "—", valor: s.valor, conta: bancoNome(s.contaBancariaId), fp: s.formaPagamento, st: calcStatus(s) });
                      });
                    }
                    rows.sort((a, b) => b.data.localeCompare(a.data));
                    if (rows.length === 0) {
                      return <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Sem lançamentos no período.</TableCell></TableRow>;
                    }
                    return rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{fmtDate(r.data)}</TableCell>
                        <TableCell>
                          {r.tipo === "entrada"
                            ? <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15" variant="outline"><ArrowUpCircle className="w-3 h-3 mr-1" />Entrada</Badge>
                            : <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/15" variant="outline"><ArrowDownCircle className="w-3 h-3 mr-1" />Saída</Badge>}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{r.cat}</Badge></TableCell>
                        <TableCell className="font-medium">{r.sub}</TableCell>
                        <TableCell className="text-sm">{r.party}</TableCell>
                        <TableCell className={cn("text-right font-medium", r.tipo === "entrada" ? "text-success" : "text-destructive")}>
                          {r.tipo === "entrada" ? "+" : "−"} {fmtBRL(r.valor)}
                        </TableCell>
                        <TableCell className="text-sm">{r.conta}</TableCell>
                        <TableCell className="text-sm">{r.fp}</TableCell>
                        <TableCell><Badge variant="outline" className={statusBadgeClass(r.st)}>{r.st}</Badge></TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-4 px-4 py-3 border-t bg-muted/30 text-sm">
                <span>Entradas: <strong className="text-success">{fmtBRL(totalE)}</strong></span>
                <span>Saídas: <strong className="text-destructive">{fmtBRL(totalS)}</strong></span>
                <span>Saldo: <strong className={lucro >= 0 ? "text-success" : "text-destructive"}>{fmtBRL(lucro)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual">
          <div className="flex justify-end mb-3">
            <Select value={String(anoAnual)} onValueChange={(v) => setAnoAnual(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
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
                    {visaoAnual.map((v) => <TableCell key={v.mes} className="text-right">{fmtBRL(v.entradas)}</TableCell>)}
                    <TableCell className="text-right font-semibold text-success">{fmtBRL(totalAnualE)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="sticky left-0 bg-card font-medium text-destructive">Saídas</TableCell>
                    {visaoAnual.map((v) => <TableCell key={v.mes} className="text-right">{fmtBRL(v.saidas)}</TableCell>)}
                    <TableCell className="text-right font-semibold text-destructive">{fmtBRL(totalAnualS)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="sticky left-0 bg-muted/30 font-semibold">Saldo</TableCell>
                    {visaoAnual.map((v) => (
                      <TableCell key={v.mes} className={`text-right font-medium ${v.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(v.saldo)}</TableCell>
                    ))}
                    <TableCell className={`text-right font-bold ${(totalAnualE - totalAnualS) >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(totalAnualE - totalAnualS)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Entrada */}
      <Dialog open={openE} onOpenChange={setOpenE}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editE ? "Editar" : "Nova"} entrada</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* Categoria */}
            <div>
              <Label>Categoria *</Label>
              <Select
                value={formE.planoContaId || ""}
                onValueChange={(v) => setFormE({ ...formE, planoContaId: v, subcategoria: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {categoriasReceita.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategoria filha */}
            <div>
              <Label>Subcategoria *</Label>
              <Select
                value={formE.subcategoria || ""}
                onValueChange={(v) => {
                  const pc = categoriasReceita.find((p) => p.id === formE.planoContaId);
                  const sub = pc?.subcategorias.find((s) => s.nome === v);
                  setFormE({
                    ...formE,
                    subcategoria: v,
                    descricao: v,
                    valor: sub?.valor && (!formE.valor || formE.valor === 0) ? sub.valor : (sub?.valor ?? formE.valor),
                  });
                }}
                disabled={!formE.planoContaId}
              >
                <SelectTrigger><SelectValue placeholder={formE.planoContaId ? "Selecione…" : "Escolha a categoria"} /></SelectTrigger>
                <SelectContent>
                  {(categoriasReceita.find((p) => p.id === formE.planoContaId)?.subcategorias || []).map((s) => (
                    <SelectItem key={s.nome} value={s.nome}>
                      {s.nome}{s.valor ? ` — ${fmtBRL(s.valor)}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formE.valor || ""}
                onChange={(e) => setFormE({ ...formE, valor: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Conta bancária */}
            <div>
              <Label>Conta bancária *</Label>
              <Select
                value={formE.contaBancariaId || ""}
                onValueChange={(v) => {
                  // se conta = Permuta, força forma = Permuta
                  const ehPermuta = permutaBancoId && v === permutaBancoId;
                  setFormE({ ...formE, contaBancariaId: v, formaPagamento: ehPermuta ? "Permuta" : formE.formaPagamento });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Datas */}
            <div>
              <Label>Data de vencimento *</Label>
              <Input
                type="date"
                value={formE.dataVencimento || ""}
                onChange={(e) => setFormE({ ...formE, dataVencimento: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de pagamento</Label>
              <Input
                type="date"
                value={formE.dataPagamento || ""}
                onChange={(e) => setFormE({ ...formE, dataPagamento: e.target.value })}
              />
            </div>

            {/* Forma de pagamento */}
            <div className="col-span-2">
              <Label>
                Forma de pagamento *
                {permutaBancoId && formE.contaBancariaId === permutaBancoId && (
                  <span className="text-xs text-muted-foreground ml-2">(Conta Permuta → forma Permuta)</span>
                )}
              </Label>
              <Select
                value={formE.formaPagamento}
                onValueChange={(v: any) => setFormE({ ...formE, formaPagamento: v })}
                disabled={!!(permutaBancoId && formE.contaBancariaId === permutaBancoId)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FP.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Cliente com autocomplete */}
            <div className="col-span-2">
              <Label>Cliente (opcional)</Label>
              <Popover open={clientePopOpen} onOpenChange={setClientePopOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formE.clienteId
                      ? clientes.find((c) => c.id === formE.clienteId)?.nome || "Selecione…"
                      : "Buscar cliente por nome…"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Digite o nome…" />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => { setFormE({ ...formE, clienteId: "", petId: "" }); setClientePopOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !formE.clienteId ? "opacity-100" : "opacity-0")} />
                          — Nenhum —
                        </CommandItem>
                        {clientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.nome}
                            onSelect={() => { setFormE({ ...formE, clienteId: c.id, petId: "" }); setClientePopOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formE.clienteId === c.id ? "opacity-100" : "opacity-0")} />
                            <span className="flex-1">{c.nome}</span>
                            {c.whatsapp && <span className="text-xs text-muted-foreground ml-2">{c.whatsapp}</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Pets do cliente */}
            {formE.clienteId && petsDoCliente(formE.clienteId).length > 0 && (
              <div className="col-span-2">
                <Label>Pet atendido</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {petsDoCliente(formE.clienteId).map((p) => {
                    const active = formE.petId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormE({ ...formE, petId: active ? "" : p.id })}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors",
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
                        )}
                      >
                        {p.foto ? (
                          <img src={p.foto} alt={p.nome} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <PawPrint className="w-4 h-4" />
                        )}
                        {p.nome}
                        <span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>{p.raca}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status calculado (preview) */}
            <div className="col-span-2">
              <Label>Status</Label>
              <div className="mt-1">
                <Badge variant="outline" className={statusBadgeClass(calcStatus(formE))}>
                  {calcStatus(formE)}
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">calculado automaticamente</span>
              </div>
            </div>

            {/* Observações */}
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={formE.observacoes || ""}
                onChange={(e) => setFormE({ ...formE, observacoes: e.target.value })}
                placeholder="Anotações sobre o lançamento…"
              />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenE(false)}>Cancelar</Button><Button onClick={saveE}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Saída */}
      <Dialog open={openS} onOpenChange={setOpenS}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editS ? "Editar" : "Nova"} saída</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* Categoria */}
            <div>
              <Label>Categoria *</Label>
              <Select
                value={formS.planoContaId || ""}
                onValueChange={(v) => {
                  const pc = categoriasDespesa.find((p) => p.id === v);
                  setFormS({ ...formS, planoContaId: v, subcategoria: "", categoria: (pc?.nome as any) || formS.categoria });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {categoriasDespesa.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategoria filha */}
            <div>
              <Label>Subcategoria *</Label>
              <Select
                value={formS.subcategoria || ""}
                onValueChange={(v) => setFormS({ ...formS, subcategoria: v, descricao: v })}
                disabled={!formS.planoContaId}
              >
                <SelectTrigger><SelectValue placeholder={formS.planoContaId ? "Selecione…" : "Escolha a categoria"} /></SelectTrigger>
                <SelectContent>
                  {(categoriasDespesa.find((p) => p.id === formS.planoContaId)?.subcategorias || []).map((s) => (
                    <SelectItem key={s.nome} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formS.valor || ""}
                onChange={(e) => setFormS({ ...formS, valor: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Fornecedor (texto livre) */}
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={formS.fornecedor || ""}
                onChange={(e) => setFormS({ ...formS, fornecedor: e.target.value })}
                placeholder="Nome do fornecedor (opcional)"
              />
            </div>

            {/* Conta bancária */}
            <div className="col-span-2">
              <Label>Conta bancária *</Label>
              <Select
                value={formS.contaBancariaId || ""}
                onValueChange={(v) => {
                  const ehPermuta = permutaBancoId && v === permutaBancoId;
                  setFormS({ ...formS, contaBancariaId: v, formaPagamento: ehPermuta ? "Permuta" : formS.formaPagamento });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Datas */}
            <div>
              <Label>Data de vencimento *</Label>
              <Input type="date" value={formS.dataVencimento || ""} onChange={(e) => setFormS({ ...formS, dataVencimento: e.target.value })} />
            </div>
            <div>
              <Label>Data de pagamento</Label>
              <Input type="date" value={formS.dataPagamento || ""} onChange={(e) => setFormS({ ...formS, dataPagamento: e.target.value })} />
            </div>

            {/* Forma de pagamento */}
            <div className="col-span-2">
              <Label>
                Forma de pagamento *
                {permutaBancoId && formS.contaBancariaId === permutaBancoId && (
                  <span className="text-xs text-muted-foreground ml-2">(Conta Permuta → forma Permuta)</span>
                )}
              </Label>
              <Select
                value={formS.formaPagamento}
                onValueChange={(v: any) => setFormS({ ...formS, formaPagamento: v })}
                disabled={!!(permutaBancoId && formS.contaBancariaId === permutaBancoId)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FP.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Status calculado */}
            <div className="col-span-2">
              <Label>Status</Label>
              <div className="mt-1">
                <Badge variant="outline" className={statusBadgeClass(calcStatus(formS))}>{calcStatus(formS)}</Badge>
                <span className="text-xs text-muted-foreground ml-2">calculado automaticamente</span>
              </div>
            </div>

            {/* Observações */}
            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={formS.observacoes || ""}
                onChange={(e) => setFormS({ ...formS, observacoes: e.target.value })}
                placeholder="Anotações sobre o lançamento…"
              />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenS(false)}>Cancelar</Button><Button onClick={saveS}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function DeleteBtn({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Excluir lançamento?</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
