import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePlanoContas } from "@/store/useStore";
import type { PlanoConta, TipoPlanoConta } from "@/lib/types";
import { uid } from "@/lib/format";

const empty: Omit<PlanoConta, "id"> = { tipo: "Receita", nome: "", subcategorias: [] };

export default function PlanoContas() {
  const [contas, setContas] = usePlanoContas();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<PlanoConta | null>(null);
  const [form, setForm] = useState<Omit<PlanoConta, "id">>(empty);
  const [subRaw, setSubRaw] = useState("");

  function openNew(tipo: TipoPlanoConta) {
    setEdit(null);
    setForm({ ...empty, tipo });
    setSubRaw("");
    setOpen(true);
  }
  function openEdit(c: PlanoConta) {
    setEdit(c); setForm(c); setSubRaw(c.subcategorias.join(", ")); setOpen(true);
  }
  function save() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    const subs = subRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const clean = { ...form, subcategorias: subs };
    if (edit) {
      setContas(contas.map((c) => c.id === edit.id ? { ...edit, ...clean } : c));
      toast.success("Categoria atualizada");
    } else {
      setContas([...contas, { ...clean, id: uid() }]);
      toast.success("Categoria criada");
    }
    setOpen(false);
  }
  function del(id: string) {
    setContas(contas.filter((c) => c.id !== id));
    toast.success("Categoria excluída");
  }

  const renderList = (tipo: TipoPlanoConta) => {
    const list = contas.filter((c) => c.tipo === tipo);
    return (
      <>
        <div className="flex justify-end mb-3">
          <Button onClick={() => openNew(tipo)}><Plus className="w-4 h-4 mr-1" />Nova {tipo}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold">{c.nome}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.subcategorias.length === 0 && <span className="text-xs text-muted-foreground">Sem subcategorias</span>}
                      {c.subcategorias.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma categoria cadastrada.</p>}
        </div>
      </>
    );
  };

  return (
    <AppLayout title="Plano de Contas" subtitle="Categorias de receitas e despesas">
      <Tabs defaultValue="Receita">
        <TabsList className="mb-4">
          <TabsTrigger value="Receita">Receitas</TabsTrigger>
          <TabsTrigger value="Despesa">Despesas</TabsTrigger>
        </TabsList>
        <TabsContent value="Receita">{renderList("Receita")}</TabsContent>
        <TabsContent value="Despesa">{renderList("Despesa")}</TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Nova"} categoria</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Subcategorias (separadas por vírgula)</Label>
              <Input value={subRaw} onChange={(e) => setSubRaw(e.target.value)} placeholder="Ex: Pequeno, Médio, Grande" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
