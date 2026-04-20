import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useBancos, useEntradas, useSaidas } from "@/store/useStore";
import { fmtBRL, fmtDate, uid, todayISO } from "@/lib/format";
import type { ContaBancaria } from "@/lib/types";

const empty: Omit<ContaBancaria, "id"> = { nome: "", saldoInicial: 0, dataInicio: todayISO() };

export default function Bancos() {
  const [bancos, setBancos] = useBancos();
  const [entradas] = useEntradas();
  const [saidas] = useSaidas();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ContaBancaria | null>(null);
  const [form, setForm] = useState<Omit<ContaBancaria, "id">>(empty);

  const saldos = useMemo(() => {
    const map = new Map<string, number>();
    bancos.forEach((b) => {
      const ent = entradas.filter((e) => e.contaBancariaId === b.id && e.status === "Pago" && e.data >= b.dataInicio).reduce((a, x) => a + x.valor, 0);
      const sai = saidas.filter((s) => s.contaBancariaId === b.id && s.status === "Pago" && s.data >= b.dataInicio).reduce((a, x) => a + x.valor, 0);
      map.set(b.id, b.saldoInicial + ent - sai);
    });
    return map;
  }, [bancos, entradas, saidas]);

  const totalSaldo = Array.from(saldos.values()).reduce((a, b) => a + b, 0);

  function openNew() { setEdit(null); setForm({ ...empty, dataInicio: todayISO() }); setOpen(true); }
  function openEdit(b: ContaBancaria) { setEdit(b); setForm(b); setOpen(true); }
  function save() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (edit) {
      setBancos(bancos.map((x) => x.id === edit.id ? { ...edit, ...form } : x));
      toast.success("Conta atualizada");
    } else {
      setBancos([...bancos, { ...form, id: uid() }]);
      toast.success("Conta criada");
    }
    setOpen(false);
  }
  function del(id: string) { setBancos(bancos.filter((b) => b.id !== id)); toast.success("Conta excluída"); }

  return (
    <AppLayout
      title="Bancos"
      subtitle="Contas bancárias e caixas"
      actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />Nova Conta</Button>}
    >
      <Card className="shadow-card mb-4 bg-gradient-primary text-primary-foreground">
        <CardContent className="p-5 flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <p className="text-xs uppercase opacity-80">Saldo total disponível</p>
            <p className="text-2xl font-display font-bold">{fmtBRL(totalSaldo)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Início</TableHead>
              <TableHead className="text-right">Saldo Inicial</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {bancos.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.nome}</TableCell>
                  <TableCell>{fmtDate(b.dataInicio)}</TableCell>
                  <TableCell className="text-right">{fmtBRL(b.saldoInicial)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtBRL(saldos.get(b.id) || 0)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(b.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {bancos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma conta cadastrada.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Nova"} conta bancária</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Saldo Inicial (R$)</Label><Input type="number" step="0.01" value={form.saldoInicial} onChange={(e) => setForm({ ...form, saldoInicial: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Data Início</Label><Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
