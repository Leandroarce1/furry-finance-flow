import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  seedClientes, seedEntradas, seedPets, seedSaidas, seedSettings,
  seedPlanoContas, seedMetas, seedBancos, seedFornecedores,
} from "@/lib/seed";
import type {
  Cliente, Entrada, Pet, Saida, Settings,
  PlanoConta, Meta, ContaBancaria, Fornecedor,
} from "@/lib/types";

// v3 — subcategorias do Plano de Contas viraram objetos { nome, valor }
export function useClientes() { return useLocalStorage<Cliente[]>("ps_clientes_v3", seedClientes); }
export function usePets() { return useLocalStorage<Pet[]>("ps_pets_v3", seedPets); }
export function useEntradas() { return useLocalStorage<Entrada[]>("ps_entradas_v2", seedEntradas); }
export function useSaidas() { return useLocalStorage<Saida[]>("ps_saidas_v2", seedSaidas); }
export function useSettings() { return useLocalStorage<Settings>("ps_settings_v2", seedSettings); }
export function usePlanoContas() { return useLocalStorage<PlanoConta[]>("ps_plano_contas_v4", seedPlanoContas); }
export function useMetas() { return useLocalStorage<Meta[]>("ps_metas_v3", seedMetas); }
export function useBancos() { return useLocalStorage<ContaBancaria[]>("ps_bancos_v2", seedBancos); }
export function useFornecedores() { return useLocalStorage<Fornecedor[]>("ps_fornecedores_v2", seedFornecedores); }
