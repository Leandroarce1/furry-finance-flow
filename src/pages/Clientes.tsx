import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, PawPrint, Pencil, Trash2, ArrowLeft, Phone, ScrollText, MessageCircle, Sparkles, CalendarDays, TrendingUp } from "lucide-react";
import { useBancos, useClientes, useEntradas, usePets } from "@/store/useStore";
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
  const [bancos] = useBancos();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroPet, setFiltroPet] = useState<string>("todos");

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
    const todosAtendimentos = entradas
      .filter((e) => e.clienteId === selected.id || (e.petId && petIds.has(e.petId)))
      .sort((a, b) => (b.dataPagamento || b.dataVencimento || b.data).localeCompare(a.dataPagamento || a.dataVencimento || a.data));

    const atendimentosFiltrados = filtroPet === "todos"
      ? todosAtendimentos
      : todosAtendimentos.filter((a) => a.petId === filtroPet);

    const concluidos = todosAtendimentos.filter((a) => !!a.dataPagamento);
    const totalGasto = concluidos.reduce((a, b) => a + b.valor, 0);
    const totalFiltro = atendimentosFiltrados.reduce((a, b) => a + b.valor, 0);
    const qtdVisitas = todosAtendimentos.length;
    const ultimoAtendimento = todosAtendimentos[0]
      ? (todosAtendimentos[0].dataPagamento || todosAtendimentos[0].dataVencimento || todosAtendimentos[0].data)
      : undefined;
    const contagemServ: Record<string, number> = {};
    todosAtendimentos.forEach((a) => {
      const key = a.subcategoria || a.descricao;
      if (key) contagemServ[key] = (contagemServ[key] || 0) + 1;
    });
    const servicoTop = Object.entries(contagemServ).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const iniciais = selected.nome.split(/\s+/).map((n) => n.charAt(0)).slice(0, 2).join("").toUpperCase();
    const waNumber = selected.whatsapp.replace(/\D/g, "");
    const waLink = waNumber ? `https://wa.me/55${waNumber}` : null;
    const petName = (id?: string) => clientPets.find((p) => p.id === id)?.nome || "—";
    const bancoNome = (id?: string) => bancos.find((b) => b.id === id)?.nome || "—";

    // Status para o histórico
    const statusOf = (a: typeof todosAtendimentos[number]) => {
      if (a.dataPagamento) return { label: "Concluído", cls: "bg-success/15 text-success border-success/30" };
      const today = new Date().toISOString().slice(0, 10);
      const venc = a.dataVencimento || a.data;
      if (!venc) return { label: "—", cls: "bg-muted text-muted-foreground" };
      if (venc < today) return { label: "Atrasado", cls: "bg-destructive/15 text-destructive border-destructive/30" };
      if (venc === today) return { label: "Hoje", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
      return { label: "Previsto", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
    };

    const goNovoAtendimento = () => {
      const params = new URLSearchParams({ novaEntrada: "1", clienteId: selected.id });
      if (clientPets.length === 1) params.set("petId", clientPets[0].id);
      navigate(`/financeiro?${params.toString()}`);
    };

    return (
      <AppLayout title={selected.nome} subtitle="Perfil do cliente">
        <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        {/* Cabeçalho */}
        <Card className="shadow-card mb-4">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shrink-0 shadow-elegant">
                {iniciais || <PawPrint className="w-8 h-8" />}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h2 className="font-display font-bold text-2xl">{selected.nome}</h2>
                <div className="flex items-center gap-2 flex-wrap">
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

                {selected.observacoes && <p className="text-xs bg-muted p-3 rounded-lg">{selected.observacoes}</p>}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button onClick={goNovoAtendimento}>
                  <Plus className="w-4 h-4 mr-1" /> Novo Atendimento
                </Button>
                <Button variant="outline" onClick={() => openEditCliente(selected)}>
                  <Pencil className="w-4 h-4 mr-1" /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
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
          </CardContent>
        </Card>

        {/* Cards de resumo CRM */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" /> Total gasto
              </div>
              <p className="font-display font-bold text-xl text-success mt-1">{fmtBRL(totalGasto)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <ScrollText className="w-3.5 h-3.5" /> Visitas
              </div>
              <p className="font-display font-bold text-xl mt-1">{qtdVisitas}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" /> Última visita
              </div>
              <p className="font-display font-bold text-xl mt-1">{ultimoAtendimento ? fmtDate(ultimoAtendimento) : "—"}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" /> Serviço favorito
              </div>
              <p className="font-display font-bold text-sm mt-1 truncate" title={servicoTop}>{servicoTop}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pets */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2"><PawPrint className="w-5 h-5 text-primary" />Pets ({selectedPets.length})</h3>
                  <Button size="sm" onClick={openNewPet}><Plus className="w-4 h-4 mr-1" /> Pet</Button>
                </div>
                {selectedPets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum pet cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPets.map((p) => (
                      <div key={p.id} className="border rounded-xl p-3 bg-gradient-soft">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex gap-3 flex-1 min-w-0">
                            {p.foto ? (
                              <img src={p.foto} alt={p.nome} className="w-14 h-14 rounded-xl object-cover shrink-0 border" />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <PawPrint className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <h4 className="font-display font-bold text-sm">{p.nome}</h4>
                                <Badge variant="outline" className="text-[10px]">{p.porte}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.raca}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPet(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir pet?</AlertDialogTitle></AlertDialogHeader>
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

          {/* Histórico de Atendimentos */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-primary" />Histórico de Atendimentos
                  </h3>
                  {clientPets.length > 1 && (
                    <Select value={filtroPet} onValueChange={setFiltroPet}>
                      <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Filtrar por pet" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os pets</SelectItem>
                        {clientPets.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {atendimentosFiltrados.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nenhum atendimento registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Pet</TableHead>
                          <TableHead className="text-xs">Serviço</TableHead>
                          <TableHead className="text-xs text-right">Valor</TableHead>
                          <TableHead className="text-xs">Forma Pgto</TableHead>
                          <TableHead className="text-xs">Conta</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {atendimentosFiltrados.map((a) => {
                          const s = statusOf(a);
                          const d = a.dataPagamento || a.dataVencimento || a.data;
                          return (
                            <TableRow key={a.id}>
                              <TableCell className="text-xs whitespace-nowrap">{fmtDate(d)}</TableCell>
                              <TableCell className="text-xs">{petName(a.petId)}</TableCell>
                              <TableCell className="text-xs">{a.subcategoria || a.descricao}</TableCell>
                              <TableCell className="text-xs text-right font-semibold text-success">{fmtBRL(a.valor)}</TableCell>
                              <TableCell className="text-xs">{a.formaPagamento}</TableCell>
                              <TableCell className="text-xs">{bancoNome(a.contaBancariaId)}</TableCell>
                              <TableCell><Badge variant="outline" className={`text-[10px] ${s.cls}`}>{s.label}</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs font-bold">Total</TableCell>
                          <TableCell className="text-xs text-right font-bold text-success">{fmtBRL(totalFiltro)}</TableCell>
                          <TableCell colSpan={3} />
                        </TableRow>
                      </TableFooter>
                    </Table>
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
