import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Users as UsersIcon, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import {
  exportLancamentosMes, exportLancamentosAno, exportClientes, exportRelatorioMesPDF,
  type LancContext, type RelatorioCtx,
} from "@/lib/exporters";
import type { Entrada, Saida, Cliente, Pet, PlanoConta, Meta, ContaBancaria } from "@/lib/types";

interface ExportMenuProps {
  ym: string; // yyyy-mm selecionado no Dashboard
  entradas: Entrada[];
  saidas: Saida[];
  clientes: Cliente[];
  pets: Pet[];
  planoContas: PlanoConta[];
  metas: Meta[];
  bancos: ContaBancaria[];
  nomeEmpresa: string;
}

export function ExportMenu({
  ym, entradas, saidas, clientes, pets, planoContas, metas, bancos, nomeEmpresa,
}: ExportMenuProps) {
  const ctx: LancContext = { planoContas, clientes, bancos };
  const ano = Number(ym.slice(0, 4));

  const handle = (fn: () => void, msg: string) => {
    try {
      fn();
      toast.success(msg);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar. Tente novamente.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Exportações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handle(
            () => exportLancamentosMes(entradas, saidas, ym, ctx),
            "Lançamentos do mês exportados",
          )}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-success" />
          Lançamentos do mês (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handle(
            () => exportLancamentosAno(entradas, saidas, ano, ctx),
            "Lançamentos do ano exportados",
          )}
        >
          <CalendarRange className="w-4 h-4 mr-2 text-primary" />
          Lançamentos do ano (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handle(
            () => exportClientes(clientes, pets, entradas),
            "Clientes exportados",
          )}
        >
          <UsersIcon className="w-4 h-4 mr-2 text-accent-foreground" />
          Clientes (Excel)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            const ctx2: RelatorioCtx = {
              nomeEmpresa, ym, entradas, saidas, planoContas, metas,
            };
            handle(() => exportRelatorioMesPDF(ctx2), "Relatório do mês gerado");
          }}
        >
          <FileText className="w-4 h-4 mr-2 text-destructive" />
          Relatório do Mês (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
