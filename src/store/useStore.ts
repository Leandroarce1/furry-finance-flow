import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  seedClientes, seedEntradas, seedPets, seedSaidas, seedSettings,
  seedPlanoContas, seedMetas, seedBancos, seedFornecedores,
} from "@/lib/seed";
import type {
  Cliente, Entrada, Pet, Saida, Settings,
  PlanoConta, Meta, ContaBancaria, Fornecedor,
} from "@/lib/types";

export function useClientes() { return useLocalStorage<Cliente[]>("ps_clientes", seedClientes); }
export function usePets() { return useLocalStorage<Pet[]>("ps_pets", seedPets); }
export function useEntradas() { return useLocalStorage<Entrada[]>("ps_entradas", seedEntradas); }
export function useSaidas() { return useLocalStorage<Saida[]>("ps_saidas", seedSaidas); }
export function useSettings() { return useLocalStorage<Settings>("ps_settings", seedSettings); }
export function usePlanoContas() { return useLocalStorage<PlanoConta[]>("ps_plano_contas", seedPlanoContas); }
export function useMetas() { return useLocalStorage<Meta[]>("ps_metas", seedMetas); }
export function useBancos() { return useLocalStorage<ContaBancaria[]>("ps_bancos", seedBancos); }
export function useFornecedores() { return useLocalStorage<Fornecedor[]>("ps_fornecedores", seedFornecedores); }
