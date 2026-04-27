import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
import Index from "./pages/Index.tsx";
import Clientes from "./pages/Clientes.tsx";
import Financeiro from "./pages/Financeiro.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import NotFound from "./pages/NotFound.tsx";
import PlanoContas from "./pages/PlanoContas.tsx";
import Metas from "./pages/Metas.tsx";
import Bancos from "./pages/Bancos.tsx";

import PrevistoRealizado from "./pages/PrevistoRealizado.tsx";
import DRE from "./pages/DRE.tsx";
import FluxoCaixa from "./pages/FluxoCaixa.tsx";

import { useEntradas, useSaidas } from "@/store/useStore";
import { importHistoricoUmaVez } from "@/lib/importHistorico";

const queryClient = new QueryClient();

function HistoricoBootstrap() {
  const [entradas, setEntradas] = useEntradas();
  const [saidas, setSaidas] = useSaidas();
  useEffect(() => {
    const importou = importHistoricoUmaVez(entradas, saidas, setEntradas, setSaidas);
    if (importou) {
      toast.success("Histórico Jan–Abr/2026 importado", {
        description: "348 entradas e 97 saídas carregadas automaticamente.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <HistoricoBootstrap />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
          <Route path="/dre" element={<DRE />} />
          <Route path="/previsto-realizado" element={<PrevistoRealizado />} />
          <Route path="/plano-de-contas" element={<PlanoContas />} />
          <Route path="/bancos" element={<Bancos />} />

          <Route path="/metas" element={<Metas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
