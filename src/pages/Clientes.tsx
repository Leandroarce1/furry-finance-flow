import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, PawPrint, Pencil, Trash2, ArrowLeft, Phone, MapPin, ScrollText } from "lucide-react";
import { useClientes, useEntradas, usePets } from "@/store/useStore";
import type { Cliente, Pet } from "@/lib/types";
import { fmtBRL, fmtDate, uid } from "@/lib/format";

const emptyCliente: Omit<Cliente, "id"> = { nome: "", cpf: "", whatsapp: "", endereco: "", bairro: "", cidade: "", observacoes: "" };
const emptyPet: Omit<Pet, "id" | "clienteId"> = {
  nome: "", especie: "Cão", raca: "Indefinido", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "", foto: "",
};

const RACAS = [
  "Pug", "Yorkshire Terrier", "Dachshund (Salsicha)", "Shih Tzu", "Bulldog Francês",
  "Lhasa Apso", "Poodle", "Beagle", "Vira Lata", "Chow Chow", "Pastor Alemão",
  "Siberian Husky", "Rottweiler", "Labrador Retriever", "Golden Retriever", "Indefinido",
];

export default function Clientes() {
  const [clientes, setClientes] = useClientes();
  const [pets, setPets] = usePets();
  const [entradas] = useEntradas();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [openCli, setOpenCli] = useState(false);
  const [editCli, setEditCli] = useState<Cliente | null>(null);
  const [cliForm, setCliForm] = useState(emptyCliente);

  const [openPet, setOpenPet] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [petForm, setPetForm] = useState(emptyPet);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter((c) => {
      if (c.nome.toLowerCase().includes(q)) return true;
      if (c.whatsapp.toLowerCase().includes(q)) return true;
      const clientePets = pets.filter((p) => p.clienteId === c.id);
      return clientePets.some((p) => p.nome.toLowerCase().includes(q));
    });
  }, [clientes, pets, search]);

  const selected = clientes.find((c) => c.id === selectedId) || null;
  const selectedPets = pets.filter((p) => p.clienteId === selectedId);

  function openNewCliente() { setEditCli(null); setCliForm(emptyCliente); setOpenCli(true); }
  function openEditCliente(c: Cliente) { setEditCli(c); setCliForm(c); setOpenCli(true); }
  function saveCliente() {
    if (!cliForm.nome.trim()) return toast.error("Nome do tutor é obrigatório");
    if (editCli) {
      setClientes(clientes.map((c) => c.id === editCli.id ? { ...editCli, ...cliForm } : c));
      toast.success("Cliente atualizado");
    } else {
      const novo: Cliente = { ...cliForm, id: uid() };
      setClientes([...clientes, novo]);
      toast.success("Cliente cadastrado");
    }
    setOpenCli(false);
  }
  function delCliente(id: string) {
    setClientes(clientes.filter((c) => c.id !== id));
    setPets(pets.filter((p) => p.clienteId !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success("Cliente excluído");
  }

  function openNewPet() { setEditPet(null); setPetForm(emptyPet); setOpenPet(true); }
  function openEditPet(p: Pet) { setEditPet(p); setPetForm(p); setOpenPet(true); }
  function savePet() {
    if (!selectedId) return;
    if (!petForm.nome.trim()) return toast.error("Nome do pet é obrigatório");
    if (editPet) {
      setPets(pets.map((p) => p.id === editPet.id ? { ...editPet, ...petForm } : p));
      toast.success("Pet atualizado");
    } else {
      setPets([...pets, { ...petForm, id: uid(), clienteId: selectedId }]);
      toast.success("Pet adicionado");
    }
    setOpenPet(false);
  }
  function delPet(id: string) { setPets(pets.filter((p) => p.id !== id)); toast.success("Pet excluído"); }

  if (selected) {
    return (
      <AppLayout title={selected.nome} subtitle="Ficha do cliente">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 shadow-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Dados</h3>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditCliente(selected)}><Pencil className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação removerá o cliente e todos os pets vinculados.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => delCliente(selected.id)} className="bg-destructive">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="text-sm space-y-2">
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{selected.whatsapp || "—"}</p>
                {(selected.bairro || selected.cidade) && (
                  <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5" /><span>{selected.bairro}{selected.bairro && selected.cidade ? " — " : ""}{selected.cidade}</span></p>
                )}
                {selected.observacoes && <p className="text-xs bg-muted p-3 rounded-lg mt-3">{selected.observacoes}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2"><PawPrint className="w-5 h-5 text-primary" />Pets ({selectedPets.length})</h3>
                  <Button size="sm" onClick={openNewPet}><Plus className="w-4 h-4 mr-1" /> Adicionar Pet</Button>
                </div>
                {selectedPets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pet cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPets.map((p) => {
                      const historico = entradas.filter((e) => e.petId === p.id);
                      return (
                        <div key={p.id} className="border rounded-xl p-4 bg-gradient-soft">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-display font-bold">{p.nome}</h4>
                                <Badge variant="secondary">{p.especie}</Badge>
                                <Badge variant="outline">{p.porte}</Badge>
                                <Badge variant="outline">{p.temperamento}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {p.raca} • {p.peso}kg • {p.idade} • {p.cor}
                              </p>
                              {p.observacoes && <p className="text-xs mt-2 text-foreground/80">📝 {p.observacoes}</p>}
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditPet(p)}><Pencil className="w-4 h-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir pet?</AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => delPet(p.id)} className="bg-destructive">Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {historico.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Histórico de atendimentos</p>
                              <div className="space-y-1">
                                {historico.map((h) => (
                                  <div key={h.id} className="flex justify-between text-xs">
                                    <span>{fmtDate(h.data)} — {h.descricao} <Badge variant="outline" className="ml-1 text-[10px]">{h.categoria}</Badge></span>
                                    <span className="font-medium">{fmtBRL(h.valor)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <PetDialog open={openPet} setOpen={setOpenPet} form={petForm} setForm={setPetForm} onSave={savePet} editing={!!editPet} />
        <ClienteDialog open={openCli} setOpen={setOpenCli} form={cliForm} setForm={setCliForm} onSave={saveCliente} editing={!!editCli} />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Clientes & Pets"
      subtitle={`${clientes.length} clientes cadastrados`}
      actions={<Button onClick={openNewCliente}><Plus className="w-4 h-4 mr-1" /> Novo Cliente</Button>}
    >
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou WhatsApp..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const qPets = pets.filter((p) => p.clienteId === c.id).length;
          return (
            <Card key={c.id} className="shadow-card hover:shadow-elegant transition-all cursor-pointer group" onClick={() => setSelectedId(c.id)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg shrink-0">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold truncate group-hover:text-primary transition-colors">{c.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{c.whatsapp}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs"><PawPrint className="w-3 h-3 mr-1" />{qPets} pet{qPets !== 1 ? "s" : ""}</Badge>
                      <span className="text-xs text-muted-foreground truncate">{c.bairro}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">Nenhum cliente encontrado.</p>
        )}
      </div>

      <ClienteDialog open={openCli} setOpen={setOpenCli} form={cliForm} setForm={setCliForm} onSave={saveCliente} editing={!!editCli} />
    </AppLayout>
  );
}

function ClienteDialog({ open, setOpen, form, setForm, onSave, editing }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} cliente</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome do tutor *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="col-span-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
          <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PetDialog({ open, setOpen, form, setForm, onSave, editing }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} pet</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome do pet *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div>
            <Label>Espécie</Label>
            <Select value={form.especie} onValueChange={(v) => setForm({ ...form, especie: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Cão">Cão</SelectItem><SelectItem value="Gato">Gato</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Raça</Label><Input value={form.raca} onChange={(e) => setForm({ ...form, raca: e.target.value })} /></div>
          <div>
            <Label>Porte</Label>
            <Select value={form.porte} onValueChange={(v) => setForm({ ...form, porte: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Pequeno", "Médio", "Grande", "Gigante"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: parseFloat(e.target.value) || 0 })} /></div>
          <div><Label>Cor / pelagem</Label><Input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
          <div><Label>Idade</Label><Input value={form.idade} onChange={(e) => setForm({ ...form, idade: e.target.value })} placeholder="ex: 3 anos" /></div>
          <div className="col-span-2">
            <Label>Temperamento</Label>
            <Select value={form.temperamento} onValueChange={(v) => setForm({ ...form, temperamento: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Dócil", "Agitado", "Agressivo"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Alergias, manias..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
