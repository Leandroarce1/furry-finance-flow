export type Especie = "Cão" | "Gato";
export type Porte = "Pequeno" | "Médio" | "Grande" | "Gigante";
export type Temperamento = "Dócil" | "Agitado" | "Agressivo";

export interface Pet {
  id: string;
  clienteId: string;
  nome: string;
  especie: Especie;
  raca: string;
  porte: Porte;
  peso: number;
  cor: string;
  idade: string;
  temperamento: Temperamento;
  observacoes: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
  cidade: string;
  observacoes: string;
}

export type CategoriaEntrada = "Banho" | "Tosa" | "Banho+Tosa" | "Hidratação" | "Outros";
export type CategoriaSaida = "Produtos" | "Energia" | "Aluguel" | "Manutenção" | "Outros";
export type FormaPagamento = "Dinheiro" | "Pix" | "Cartão Débito" | "Cartão Crédito";
export type StatusEntrada = "Pago" | "A Receber";
export type StatusSaida = "Pago" | "A Pagar";

export interface Entrada {
  id: string;
  data: string; // ISO yyyy-mm-dd
  descricao: string;
  categoria: CategoriaEntrada;
  valor: number;
  formaPagamento: FormaPagamento;
  clienteId?: string;
  petId?: string;
  status: StatusEntrada;
}

export interface Saida {
  id: string;
  data: string;
  descricao: string;
  categoria: CategoriaSaida;
  valor: number;
  formaPagamento: FormaPagamento;
  status: StatusSaida;
}

export interface Settings {
  nomePetshop: string;
  corTema: string;
}
