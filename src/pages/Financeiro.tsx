import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { useClientes, useEntradas, usePets, useSaidas } from "@/store/useStore";
import type { CategoriaEntrada, CategoriaSaida, Entrada, FormaPagamento, Saida } from "@/lib/types";
import { fmtBRL, fmtDate, monthKey, todayISO, uid } from "@/lib/format";

const CAT_E: CategoriaEntrada[] = ["Banho", "Tosa", "Banho+Tosa", "Hidratação", "Outros"];
const CAT_S: CategoriaSaida[] = ["Produtos", "Energia", "Aluguel", "Manutenção", "Outros"];
const FP: FormaPagamento[] = ["Dinheiro", "Pix", "Cartão Débito", "Cartão Crédito"];

const emptyE: Omit<Entrada, "id"> = { data: todayISO(), descricao: "", categoria: "Banho", valor: 0, formaPagamento: "Pix", clienteId: "", petId: "", status: "Pago" };
const emptyS: Omit<Saida, "id"> = { data: todayISO(), descricao: "", categoria: "Produtos", valor: 0, formaPagamento: "Pix", status: "Pago" };

export default function Financeiro() {
  const [entradas, setEntradas] = useEntradas();
  const [saidas, setSaidas] = useSaidas();
  const [clientes] = useClientes();
  const [pets] = usePets();

  const now = new Date();
  const [filtroMes, setFiltroMes] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const [openE, setOpenE] = useState(false);
  const [editE, setEditE] = useState<Entrada | null>(null);
  const [formE, setFormE] = useState<Omit<Entrada, "id">>(emptyE);

  const [openS, setOpenS] = useState(false);
  const [editS, setEditS] = useState<Saida | null>(null);
  const [formS, setFormS] = useState<Omit<Saida, "id">>(emptyS);

  const filtroEntradas = useMemo(() => entradas.filter((e) => monthKey(e.data) === filtroMes).sort((a, b) => b.data.localeCompare(a.data)), [entradas, filtroMes]);
  const filtroSaidas = useMemo(() => saidas.filter((s) => monthKey(s.data) === filtroMes).sort((a, b) => b.data.localeCompare(a.data)), [saidas, filtroMes]);

  const totalE = filtroEntradas.reduce((a, b) => a + b.valor, 0);
  const totalS = filtroSaidas.reduce((a, b) => a + b.valor, 0);
  const lucro = totalE - totalS;

  const petsDoCliente = (cliId: string) => pets.filter((p) => p.clienteId === cliId);

  function openNewE() { setEditE(null); setFormE({ ...emptyE, data: todayISO() }); setOpenE(true); }
  function openEditE(e: Entrada) { setEditE(e); setFormE(e); setOpenE(true); }
  function saveE() {
    if (!formE.descricao.trim()) return toast.error("Descrição obrigatória");
    const clean: Omit<Entrada, "id"> = { ...formE, clienteId: formE.clienteId || undefined, petId: formE.petId || undefined };
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

  function openNewS() { setEditS(null); setFormS({ ...emptyS, data: todayISO() }); setOpenS(true); }
  function openEditS(s: Saida) { setEditS(s); setFormS(s); setOpenS(true); }
  function saveS() {
    if (!formS.descricao.trim()) return toast.error("Descrição obrigatória");
    if (editS) {
      setSaidas(saidas.map((x) => x.id === editS.id ? { ...editS, ...formS } : x));
      toast.success("Saída atualizada");
    } else {
      setSaidas([...saidas, { ...formS, id: uid() }]);
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
        </TabsList>

        <TabsContent value="visao">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card className="shadow-card"><CardContent className="p-5">
              <div className="flex items-center gap-3"><ArrowUpCircle className="w-8 h-8 text-success" />
                <div><p className="text-xs uppercase text-muted-foreground">Receitas</p><p className="text-2xl font-display font-bold">{fmtBRL(totalE)}</p></div>
              </div>
            </CardContent></Card>
            <Card className="shadow-card"><CardContent className="p-5">
              <div className="flex items-center gap-3"><ArrowDownCircle className="w-8 h-8 text-destructive" />
                <div><p className="text-xs uppercase text-muted-foreground">Despesas</p><p className="text-2xl font-display font-bold">{fmtBRL(totalS)}</p></div>
              </div>
            </CardContent></Card>
            <Card className="shadow-card bg-gradient-primary text-primary-foreground"><CardContent className="p-5">
              <div className="flex items-center gap-3"><Wallet className="w-8 h-8" />
                <div><p className="text-xs uppercase opacity-80">Lucro</p><p className="text-2xl font-display font-bold">{fmtBRL(lucro)}</p></div>
              </div>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="entradas">
          <div className="flex justify-end mb-3"><Button onClick={openNewE}><Plus className="w-4 h-4 mr-1" />Nova Entrada</Button></div>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Pagamento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroEntradas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{fmtDate(e.data)}</TableCell>
                      <TableCell className="font-medium">{e.descricao}</TableCell>
                      <TableCell><Badge variant="secondary">{e.categoria}</Badge></TableCell>
                      <TableCell className="text-sm">{e.formaPagamento}</TableCell>
                      <TableCell><Badge variant={e.status === "Pago" ? "default" : "outline"}>{e.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-success">{fmtBRL(e.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEditE(e)}><Pencil className="w-4 h-4" /></Button>
                        <DeleteBtn onConfirm={() => delE(e.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtroEntradas.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
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
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Pagamento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtroSaidas.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{fmtDate(s.data)}</TableCell>
                      <TableCell className="font-medium">{s.descricao}</TableCell>
                      <TableCell><Badge variant="secondary">{s.categoria}</Badge></TableCell>
                      <TableCell className="text-sm">{s.formaPagamento}</TableCell>
                      <TableCell><Badge variant={s.status === "Pago" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-destructive">{fmtBRL(s.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEditS(s)}><Pencil className="w-4 h-4" /></Button>
                        <DeleteBtn onConfirm={() => delS(s.id)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtroSaidas.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem registros no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex justify-end px-4 py-3 border-t bg-muted/30">
                <span className="text-sm">Total: <strong className="text-destructive">{fmtBRL(totalS)}</strong></span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openE} onOpenChange={setOpenE}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editE ? "Editar" : "Nova"} entrada</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={formE.data} onChange={(e) => setFormE({ ...formE, data: e.target.value })} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formE.valor} onChange={(e) => setFormE({ ...formE, valor: parseFloat(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><Label>Descrição</Label><Input value={formE.descricao} onChange={(e) => setFormE({ ...formE, descricao: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={formE.categoria} onValueChange={(v: any) => setFormE({ ...formE, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAT_E.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={formE.formaPagamento} onValueChange={(v: any) => setFormE({ ...formE, formaPagamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FP.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={formE.clienteId || "_"} onValueChange={(v) => setFormE({ ...formE, clienteId: v === "_" ? "" : v, petId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">— Nenhum —</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pet (opcional)</Label>
              <Select value={formE.petId || "_"} onValueChange={(v) => setFormE({ ...formE, petId: v === "_" ? "" : v })} disabled={!formE.clienteId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">— Nenhum —</SelectItem>
                  {petsDoCliente(formE.clienteId || "").map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={formE.status} onValueChange={(v: any) => setFormE({ ...formE, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pago">Pago</SelectItem><SelectItem value="A Receber">A Receber</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenE(false)}>Cancelar</Button><Button onClick={saveE}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openS} onOpenChange={setOpenS}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editS ? "Editar" : "Nova"} saída</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data</Label><Input type="date" value={formS.data} onChange={(e) => setFormS({ ...formS, data: e.target.value })} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formS.valor} onChange={(e) => setFormS({ ...formS, valor: parseFloat(e.target.value) || 0 })} /></div>
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
