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
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { usePlanoContas } from "@/store/useStore";
import type { PlanoConta, SubCategoria, TipoPlanoConta } from "@/lib/types";
import { fmtBRL, uid } from "@/lib/format";

const empty: Omit<PlanoConta, "id"> = { tipo: "Receita", nome: "", subcategorias: [] };

export default function PlanoContas() {
  const [contas, setContas] = usePlanoContas();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<PlanoConta | null>(null);
  const [form, setForm] = useState<Omit<PlanoConta, "id">>(empty);
  const [novoSubNome, setNovoSubNome] = useState("");
  const [novoSubValor, setNovoSubValor] = useState<number>(0);

  function openNew(tipo: TipoPlanoConta) {
    setEdit(null);
    setForm({ ...empty, tipo });
    setNovoSubNome(""); setNovoSubValor(0);
    setOpen(true);
  }
  function openEdit(c: PlanoConta) {
    setEdit(c); setForm({ ...c, subcategorias: [...c.subcategorias] });
    setNovoSubNome(""); setNovoSubValor(0);
    setOpen(true);
  }
  function addSub() {
    const nome = novoSubNome.trim();
    if (!nome) return;
    setForm({ ...form, subcategorias: [...form.subcategorias, { nome, valor: novoSubValor || undefined }] });
    setNovoSubNome(""); setNovoSubValor(0);
  }
  function removeSub(idx: number) {
    setForm({ ...form, subcategorias: form.subcategorias.filter((_, i) => i !== idx) });
  }
  function updateSub(idx: number, patch: Partial<SubCategoria>) {
    setForm({
      ...form,
      subcategorias: form.subcategorias.map((s, i) => i === idx ? { ...s, ...patch } : s),
    });
  }
  function save() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (edit) {
      setContas(contas.map((c) => c.id === edit.id ? { ...edit, ...form } : c));
      toast.success("Categoria atualizada");
    } else {
      setContas([...contas, { ...form, id: uid() }]);
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
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{c.nome}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.subcategorias.length === 0 && <span className="text-xs text-muted-foreground">Sem subcategorias</span>}
                      {c.subcategorias.map((s, i) => (
                        <Badge key={`${s.nome}-${i}`} variant="secondary">
                          {s.nome}{typeof s.valor === "number" && s.valor > 0 ? ` · ${fmtBRL(s.valor)}` : ""}
                        </Badge>
                      ))}
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit ? "Editar" : "Nova"} categoria</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>

            <div>
              <Label>Subcategorias / Serviços</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {form.tipo === "Receita"
                  ? "Cadastre os serviços com valor padrão. Aparecerão como sugestão nos lançamentos."
                  : "Itens de despesa desta categoria."}
              </p>
              <div className="space-y-2 mb-3">
                {form.subcategorias.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      value={s.nome}
                      onChange={(e) => updateSub(i, { nome: e.target.value })}
                    />
                    <Input
                      className="w-32"
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={s.valor ?? ""}
                      onChange={(e) => updateSub(i, { valor: parseFloat(e.target.value) || 0 })}
                    />
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeSub(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {form.subcategorias.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhum item ainda.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Nome do item"
                  value={novoSubNome}
                  onChange={(e) => setNovoSubNome(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }}
                />
                <Input
                  className="w-32"
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={novoSubValor || ""}
                  onChange={(e) => setNovoSubValor(parseFloat(e.target.value) || 0)}
                />
                <Button size="icon" variant="outline" onClick={addSub}><Plus className="w-4 h-4" /></Button>
              </div>
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
