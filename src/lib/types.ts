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
  foto?: string;
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
export type FormaPagamento = "Dinheiro" | "Pix" | "Cartão Débito" | "Cartão Crédito" | "Permuta";
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
  contaBancariaId?: string;
  planoContaId?: string;
  observacoes?: string;
}

export interface Saida {
  id: string;
  data: string;
  descricao: string;
  categoria: CategoriaSaida;
  valor: number;
  formaPagamento: FormaPagamento;
  status: StatusSaida;
  contaBancariaId?: string;
  fornecedorId?: string;
  planoContaId?: string;
}

export interface Settings {
  nomePetshop: string;
  corTema: string;
}

// Plano de Contas
export type TipoPlanoConta = "Receita" | "Despesa";
export interface SubCategoria {
  nome: string;
  valor?: number; // valor padrão (usado como serviço quando tipo = Receita)
}
export interface PlanoConta {
  id: string;
  tipo: TipoPlanoConta;
  nome: string;
  subcategorias: SubCategoria[];
}

// Metas (categoria × mês)
export interface Meta {
  id: string;
  ano: number;
  planoContaId: string;
  // 12 valores mensais (jan..dez)
  valores: number[];
}

// Bancos
export interface ContaBancaria {
  id: string;
  nome: string;
  saldoInicial: number;
  dataInicio: string; // yyyy-mm-dd
}

// Fornecedores
export interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
  endereco: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
}
