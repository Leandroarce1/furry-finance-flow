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
const emptyS: Omit<Saida, "id"> = { data: todayISO(), descricao: "", categoria: "Produtos", valor: 0, formaPagamento: "Pix", status: "Pago", contaBancariaId: "" };

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

  // Categorias de receita do plano de contas
  const categoriasReceita = useMemo(() => planoContas.filter((p) => p.tipo === "Receita"), [planoContas]);

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

  // Filtros adicionais da lista de entradas
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroConta, setFiltroConta] = useState<string>("todas");

  // Data de referência para listagem: vencimento se houver, senão data
  const refDate = (e: Entrada) => e.dataVencimento || e.data;

  const filtroEntradas = useMemo(() => {
    return entradas
      .filter((e) => monthKey(refDate(e)) === filtroMes)
      .filter((e) => filtroStatus === "todos" ? true : calcStatus(e) === filtroStatus)
      .filter((e) => filtroConta === "todas" ? true : e.contaBancariaId === filtroConta)
      .sort((a, b) => refDate(b).localeCompare(refDate(a)));
  }, [entradas, filtroMes, filtroStatus, filtroConta]);
  const filtroSaidas = useMemo(() => saidas.filter((s) => monthKey(s.data) === filtroMes).sort((a, b) => b.data.localeCompare(a.data)), [saidas, filtroMes]);

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

  function openNewS() { setEditS(null); setFormS({ ...emptyS, data: todayISO(), contaBancariaId: bancos[0]?.id || "" }); setOpenS(true); }
  function openEditS(s: Saida) { setEditS(s); setFormS(s); setOpenS(true); }
  function saveS() {
    if (!formS.descricao.trim()) return toast.error("Descrição obrigatória");
    const conta = bancoEfetivo(formS.contaBancariaId, formS.formaPagamento);
    if (!conta) return toast.error("Selecione o banco que vai pagar");
    const clean: Omit<Saida, "id"> = { ...formS, contaBancariaId: conta };
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
          <div className="flex justify-end mb-3"><Button onClick={openNewE}><Plus className="w-4 h-4 mr-1" />Nova Entrada</Button></div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Banco</TableHead><TableHead>Pagamento</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroEntradas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{fmtDate(e.data)}</TableCell>
                      <TableCell className="font-medium">{e.descricao}</TableCell>
                      <TableCell><Badge variant="secondary">{e.categoria}</Badge></TableCell>
                      <TableCell className="text-sm">{bancoNome(e.contaBancariaId)}</TableCell>
                      <TableCell className="text-sm">{e.formaPagamento}</TableCell>
                      <TableCell><Badge variant={e.status === "Pago" ? "default" : "outline"}>{e.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-success">{fmtBRL(e.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEditE(e)}><Pencil className="w-4 h-4" /></Button>
                        <DeleteBtn onConfirm={() => delE(e.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtroEntradas.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
                <span className="text-sm">Total: <strong className="text-success">{fmtBRL(totalE)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas">
          <div className="flex justify-end mb-3"><Button onClick={openNewS}><Plus className="w-4 h-4 mr-1" />Nova Saída</Button></div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Banco</TableHead><TableHead>Pagamento</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroSaidas.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{fmtDate(s.data)}</TableCell>
                      <TableCell className="font-medium">{s.descricao}</TableCell>
                      <TableCell><Badge variant="secondary">{s.categoria}</Badge></TableCell>
                      <TableCell className="text-sm">{bancoNome(s.contaBancariaId)}</TableCell>
                      <TableCell className="text-sm">{s.formaPagamento}</TableCell>
                      <TableCell><Badge variant={s.status === "Pago" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-destructive">{fmtBRL(s.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEditS(s)}><Pencil className="w-4 h-4" /></Button>
                        <DeleteBtn onConfirm={() => delS(s.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtroSaidas.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
                <span className="text-sm">Total: <strong className="text-destructive">{fmtBRL(totalS)}</strong></span>
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
            <div><Label>Data do atendimento</Label><Input type="date" value={formE.data} onChange={(e) => setFormE({ ...formE, data: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={formE.status} onValueChange={(v: any) => setFormE({ ...formE, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pago">Pago</SelectItem><SelectItem value="A Receber">A Receber</SelectItem></SelectContent>
              </Select>
            </div>

            {/* Cliente com autocomplete */}
            <div className="col-span-2">
              <Label>Cliente</Label>
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
            {formE.clienteId && (
              <div className="col-span-2">
                <Label>Pet atendido</Label>
                {petsDoCliente(formE.clienteId).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Este cliente não possui pets cadastrados.</p>
                ) : (
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
                )}
              </div>
            )}

            {/* Serviço */}
            <div className="col-span-2">
              <Label>Serviço realizado</Label>
              <Select onValueChange={onPickServico}>
                <SelectTrigger><SelectValue placeholder="Selecione um serviço (preenche descrição e valor)" /></SelectTrigger>
                <SelectContent>
                  {servicos.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}{s.valor > 0 ? ` — ${fmtBRL(s.valor)}` : ""}
                    </SelectItem>
                  ))}
                  {servicos.length === 0 && <SelectItem value="_" disabled>Cadastre serviços no Plano de Contas</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2"><Label>Descrição</Label><Input value={formE.descricao} onChange={(e) => setFormE({ ...formE, descricao: e.target.value })} /></div>

            <div><Label>Valor cobrado (R$)</Label><Input type="number" step="0.01" value={formE.valor} onChange={(e) => setFormE({ ...formE, valor: parseFloat(e.target.value) || 0 })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={formE.categoria} onValueChange={(v: any) => setFormE({ ...formE, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAT_E.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label>Forma de pagamento</Label>
              <Select value={formE.formaPagamento} onValueChange={(v: any) => setFormE({ ...formE, formaPagamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FP.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta bancária {formE.formaPagamento === "Permuta" && <span className="text-xs text-muted-foreground">(Permuta → Caixa da Loja)</span>}</Label>
              <Select
                value={formE.formaPagamento === "Permuta" ? caixaLojaId : (formE.contaBancariaId || "")}
                onValueChange={(v) => setFormE({ ...formE, contaBancariaId: v })}
                disabled={formE.formaPagamento === "Permuta"}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={formE.observacoes || ""}
                onChange={(e) => setFormE({ ...formE, observacoes: e.target.value })}
                placeholder="Anotações sobre o atendimento…"
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
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={formS.data} onChange={(e) => setFormS({ ...formS, data: e.target.value })} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formS.valor} onChange={(e) => setFormS({ ...formS, valor: parseFloat(e.target.value) || 0 })} /></div>

            <div className="col-span-2">
              <Label>Item cadastrado</Label>
              <Select onValueChange={onPickItemDespesa}>
                <SelectTrigger><SelectValue placeholder="Selecione um item de despesa" /></SelectTrigger>
                <SelectContent>
                  {itensDespesa.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  {itensDespesa.length === 0 && <SelectItem value="_" disabled>Cadastre despesas no Plano de Contas</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2"><Label>Descrição</Label><Input value={formS.descricao} onChange={(e) => setFormS({ ...formS, descricao: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={formS.categoria} onValueChange={(v: any) => setFormS({ ...formS, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAT_S.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={formS.formaPagamento} onValueChange={(v: any) => setFormS({ ...formS, formaPagamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FP.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Banco que vai pagar {formS.formaPagamento === "Permuta" && <span className="text-xs text-muted-foreground">(Permuta sai do Caixa da Loja)</span>}</Label>
              <Select
                value={formS.formaPagamento === "Permuta" ? caixaLojaId : (formS.contaBancariaId || "")}
                onValueChange={(v) => setFormS({ ...formS, contaBancariaId: v })}
                disabled={formS.formaPagamento === "Permuta"}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>
                  {bancos.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={formS.status} onValueChange={(v: any) => setFormS({ ...formS, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pago">Pago</SelectItem><SelectItem value="A Pagar">A Pagar</SelectItem></SelectContent>
              </Select>
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
