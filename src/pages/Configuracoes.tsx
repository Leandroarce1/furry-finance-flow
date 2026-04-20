import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/store/useStore";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const PRESETS = ["#7C3AED", "#9333EA", "#DB2777", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];

export default function Configuracoes() {
  const [settings, setSettings] = useSettings();
  const [nome, setNome] = useState(settings.nomePetshop);
  const [cor, setCor] = useState(settings.corTema);

  function salvar() {
    setSettings({ nomePetshop: nome, corTema: cor });
    toast.success("Configurações salvas");
  }

  return (
    <AppLayout title="Configurações" subtitle="Personalize seu petshop">
      <Card className="shadow-card max-w-xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold">Identidade do petshop</h3>
              <p className="text-xs text-muted-foreground">Aparece na sidebar e no topo</p>
            </div>
          </div>

          <div>
            <Label>Nome do petshop</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div>
            <Label>Cor do tema</Label>
            <div className="flex items-center gap-3 mt-2">
              <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-14 h-10 rounded-lg border cursor-pointer" />
              <Input value={cor} onChange={(e) => setCor(e.target.value)} className="font-mono" />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setCor(p)}
                  className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: p }}
                  aria-label={p}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Dica: a cor é salva mas a paleta atual do tema é roxa por padrão.</p>
          </div>

          <Button onClick={salvar} className="w-full">Salvar alterações</Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
