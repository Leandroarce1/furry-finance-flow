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
import { Plus, Search, PawPrint, Pencil, Trash2, ArrowLeft, Phone, MapPin, ScrollText, MessageCircle } from "lucide-react";
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
    const clientPets = selectedPets;
    const petIds = new Set(clientPets.map((p) => p.id));
    const atendimentos = entradas
      .filter((e) => e.clienteId === selected.id || (e.petId && petIds.has(e.petId)))
      .sort((a, b) => b.data.localeCompare(a.data));
    const totalGasto = atendimentos.reduce((a, b) => a + b.valor, 0);
    const ultimoAtendimento = atendimentos[0]?.data;
    const qtdVisitas = atendimentos.length;
    const contagemServ: Record<string, number> = {};
    atendimentos.forEach((a) => { contagemServ[a.descricao] = (contagemServ[a.descricao] || 0) + 1; });
    const servicoTop = Object.entries(contagemServ).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    const iniciais = selected.nome.split(/\s+/).map((n) => n.charAt(0)).slice(0, 2).join("").toUpperCase();
    const waNumber = selected.whatsapp.replace(/\D/g, "");
    const waLink = waNumber ? `https://wa.me/55${waNumber}` : null;
    const petName = (id?: string) => clientPets.find((p) => p.id === id)?.nome || "—";

    return (
      <AppLayout title={selected.nome} subtitle="Ficha do cliente">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        {/* Card de resumo */}
        <Card className="shadow-card mb-4">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shrink-0 shadow-elegant">
                {iniciais || <PawPrint className="w-8 h-8" />}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h2 className="font-display font-bold text-2xl">{selected.nome}</h2>
                    <p className="text-sm text-muted-foreground">{clientPets.length} pet{clientPets.length !== 1 ? "s" : ""} cadastrado{clientPets.length !== 1 ? "s" : ""}</p>
                  </div>
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

                {clientPets.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {clientPets.map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs gap-1">
                        <PawPrint className="w-3 h-3" />
                        {p.nome}<span className="text-muted-foreground">· {p.raca}</span>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selected.whatsapp || "—"}</span>
                  {waLink && (
                    <Button size="sm" variant="outline" asChild className="h-7 ml-1">
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                {selected.observacoes && <p className="text-xs bg-muted p-3 rounded-lg">{selected.observacoes}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 md:w-72 w-full shrink-0">
                <div className="rounded-xl bg-gradient-soft border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total gasto</p>
                  <p className="font-display font-bold text-lg text-success">{fmtBRL(totalGasto)}</p>
                </div>
                <div className="rounded-xl bg-gradient-soft border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Última visita</p>
                  <p className="font-display font-bold text-lg">{ultimoAtendimento ? fmtDate(ultimoAtendimento) : "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    {selectedPets.map((p) => (
                      <div key={p.id} className="border rounded-xl p-4 bg-gradient-soft">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-3 flex-1 min-w-0">
                            {p.foto ? (
                              <img src={p.foto} alt={p.nome} className="w-16 h-16 rounded-xl object-cover shrink-0 border" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <PawPrint className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                  <ScrollText className="w-5 h-5 text-primary" />Histórico de Atendimentos
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-lg border p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Visitas</p>
                    <p className="font-display font-bold text-base">{qtdVisitas}</p>
                  </div>
                  <div className="rounded-lg border p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Total gasto</p>
                    <p className="font-display font-bold text-base text-success">{fmtBRL(totalGasto)}</p>
                  </div>
                  <div className="rounded-lg border p-2 col-span-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Serviço mais utilizado</p>
                    <p className="font-medium text-sm truncate">{servicoTop}</p>
                  </div>
                </div>

                {atendimentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum atendimento registrado.</p>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {atendimentos.map((h) => (
                      <div key={h.id} className="border rounded-lg p-3 text-xs space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium">{fmtDate(h.data)}</span>
                          <span className="font-bold text-success">{fmtBRL(h.valor)}</span>
                        </div>
                        <p className="text-foreground/90">{h.descricao}</p>
                        <div className="flex flex-wrap gap-1">
                          {h.petId && <Badge variant="secondary" className="text-[10px]"><PawPrint className="w-2.5 h-2.5 mr-0.5" />{petName(h.petId)}</Badge>}
                          <Badge variant="outline" className="text-[10px]">{h.formaPagamento}</Badge>
                          <Badge variant="outline" className="text-[10px]">{h.categoria}</Badge>
                        </div>
                        {h.observacoes && <p className="text-muted-foreground italic">📝 {h.observacoes}</p>}
                      </div>
                    ))}
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
        <Input placeholder="Buscar por cliente, pet ou telefone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <div className="col-span-2 flex items-center gap-3">
            {form.foto ? (
              <img src={form.foto} alt="Pet" className="w-20 h-20 rounded-xl object-cover border" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                <PawPrint className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Label>Foto do pet</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setForm({ ...form, foto: reader.result as string });
                  reader.readAsDataURL(file);
                }}
              />
              {form.foto && (
                <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={() => setForm({ ...form, foto: "" })}>
                  Remover foto
                </Button>
              )}
            </div>
          </div>
          <div className="col-span-2"><Label>Nome do pet *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div>
            <Label>Espécie</Label>
            <Select value={form.especie} onValueChange={(v) => setForm({ ...form, especie: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Cão">Cão</SelectItem><SelectItem value="Gato">Gato</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Raça</Label>
            <Select value={form.raca} onValueChange={(v) => setForm({ ...form, raca: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RACAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
