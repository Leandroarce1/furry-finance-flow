import type { Entrada, Saida } from "./types";
import { historicoEntradas, historicoSaidas } from "./historico";

const FLAG_KEY = "ps_historico_importado_v1";

/**
 * Importa o histórico real da planilha (Jan–Abr 2026) uma única vez.
 * - Só executa se a flag no localStorage ainda não foi setada.
 * - Mescla com lançamentos existentes evitando duplicação por id.
 */
export function importHistoricoUmaVez(
  entradas: Entrada[],
  saidas: Saida[],
  setEntradas: (e: Entrada[]) => void,
  setSaidas: (s: Saida[]) => void,
): boolean {
  try {
    if (localStorage.getItem(FLAG_KEY) === "1") return false;

    const idsE = new Set(entradas.map((e) => e.id));
    const idsS = new Set(saidas.map((s) => s.id));

    const novasE = historicoEntradas.filter((e) => !idsE.has(e.id));
    const novasS = historicoSaidas.filter((s) => !idsS.has(s.id));

    if (novasE.length) setEntradas([...entradas, ...novasE]);
    if (novasS.length) setSaidas([...saidas, ...novasS]);

    localStorage.setItem(FLAG_KEY, "1");
    return novasE.length > 0 || novasS.length > 0;
  } catch {
    return false;
  }
}

/** Força reimportação (usado em botão manual). */
export function resetImportacaoHistorico() {
  localStorage.removeItem(FLAG_KEY);
}
