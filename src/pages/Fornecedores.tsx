import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useFornecedores } from "@/store/useStore";
import { uid } from "@/lib/format";
import type { Fornecedor } from "@/lib/types";

const empty: Omit<Fornecedor, "id"> = { nome: "", documento: "", endereco: "", cidade: "", uf: "", telefone: "", email: "" };

export default function Fornecedores() {
  const [list, setList] = useFornecedores();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState<Omit<Fornecedor, "id">>(empty);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => list.filter((f) => f.nome.toLowerCase().includes(q.toLowerCase()) || f.documento.includes(q)), [list, q]);

  function openNew() { setEdit(null); setForm(empty); setOpen(true); }
  function openEdit(f: Fornecedor) { setEdit(f); setForm(f); setOpen(true); }
  function save() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (edit) {
      setList(list.map((x) => x.id === edit.id ? { ...edit, ...form } : x));
      toast.success("Fornecedor atualizado");
    } else {
      setList([...list, { ...form, id: uid() }]);
      toast.success("Fornecedor criado");
    }
    setOpen(false);
  }
  function del(id: string) { setList(list.filter((f) => f.id !== id)); toast.success("Fornecedor excluído"); }

  return (
    <AppLayout
      title="Fornecedores"
      subtitle="Cadastro de fornecedores"
      actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />Novo</Button>}
    >
      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou documento" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="text-sm">{f.documento || "—"}</TableCell>
                  <TableCell className="text-sm">{f.cidade}{f.uf && `/${f.uf}`}</TableCell>
                  <TableCell className="text-sm">{f.telefone || "—"}</TableCell>
                  <TableCell className="text-sm">{f.email || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(f)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(f.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum fornecedor.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Novo"} fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>CPF/CNPJ</Label><Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} /></div>
            <div className="col-span-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
