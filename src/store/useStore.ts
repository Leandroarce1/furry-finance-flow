import { useLocalStorage } from "@/hooks/useLocalStorage";
import { seedClientes, seedEntradas, seedPets, seedSaidas, seedSettings } from "@/lib/seed";
import type { Cliente, Entrada, Pet, Saida, Settings } from "@/lib/types";

export function useClientes() {
  return useLocalStorage<Cliente[]>("ps_clientes", seedClientes);
}
export function usePets() {
  return useLocalStorage<Pet[]>("ps_pets", seedPets);
}
export function useEntradas() {
  return useLocalStorage<Entrada[]>("ps_entradas", seedEntradas);
}
export function useSaidas() {
  return useLocalStorage<Saida[]>("ps_saidas", seedSaidas);
}
export function useSettings() {
  return useLocalStorage<Settings>("ps_settings", seedSettings);
}
