import type {
  Cliente, Entrada, Pet, Saida, Settings,
  PlanoConta, Meta, ContaBancaria, Fornecedor,
} from "./types";

// Clientes reais importados da planilha 2026
export const seedClientes: Cliente[] = [
  { id: "c1", nome: "Lidiane (Poodle Moto)", cpf: "", whatsapp: "(92) 99300-1262", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c2", nome: "Kelly Cidade", cpf: "", whatsapp: "(92) 98403-0377", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c3", nome: "Eliandro", cpf: "", whatsapp: "(92) 99195-8585", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c4", nome: "Sitronio", cpf: "", whatsapp: "(92) 99461-6952", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c5", nome: "Virna", cpf: "", whatsapp: "(92) 99482-6010", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c6", nome: "Beatriz", cpf: "", whatsapp: "(92) 99141-8472", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c7", nome: "Frank", cpf: "", whatsapp: "(92) 98228-5688", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c8", nome: "Neide Moça", cpf: "", whatsapp: "(92) 98276-6394", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c9", nome: "Maria Eduarda", cpf: "", whatsapp: "(92) 99498-5456", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c10", nome: "Inez", cpf: "", whatsapp: "(92) 99128-7555", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c11", nome: "Francisca Dilizia", cpf: "", whatsapp: "(92) 90108-3686", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c12", nome: "Angela", cpf: "", whatsapp: "(92) 98159-1807", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c13", nome: "Mayara", cpf: "", whatsapp: "(92) 98198-0186", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c14", nome: "Erivan", cpf: "", whatsapp: "(92) 99143-4008", endereco: "", bairro: "", cidade: "", observacoes: "" },
  { id: "c15", nome: "Debora", cpf: "", whatsapp: "(92) 99519-4530", endereco: "", bairro: "", cidade: "", observacoes: "" },
];

export const seedPets: Pet[] = [
  { id: "p1", clienteId: "c1", nome: "Sofia", especie: "Cão", raca: "Poodle", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p2", clienteId: "c2", nome: "Meg", especie: "Cão", raca: "Buldog Francês", porte: "Médio", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p3", clienteId: "c2", nome: "Bolt", especie: "Cão", raca: "Labrador", porte: "Grande", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p4", clienteId: "c3", nome: "Mel", especie: "Cão", raca: "Buldog Americano", porte: "Grande", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p5", clienteId: "c4", nome: "Poly", especie: "Cão", raca: "Poodle Médio", porte: "Médio", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p6", clienteId: "c4", nome: "Juju", especie: "Cão", raca: "Poodle / Shih Tzu", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p7", clienteId: "c8", nome: "Mia", especie: "Cão", raca: "Yorkshire", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p8", clienteId: "c8", nome: "Zoe", especie: "Cão", raca: "Yorkshire", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p9", clienteId: "c10", nome: "Estrela", especie: "Cão", raca: "Vira-lata", porte: "Médio", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p10", clienteId: "c10", nome: "Hanna", especie: "Cão", raca: "Vira-lata", porte: "Médio", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p11", clienteId: "c13", nome: "Zeus", especie: "Cão", raca: "Shih Tzu", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p12", clienteId: "c13", nome: "Luna", especie: "Cão", raca: "Shih Tzu", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p13", clienteId: "c14", nome: "Luna", especie: "Cão", raca: "Chow Chow", porte: "Grande", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
  { id: "p14", clienteId: "c15", nome: "Príncipe", especie: "Cão", raca: "Spitz Alemão", porte: "Pequeno", peso: 0, cor: "", idade: "", temperamento: "Dócil", observacoes: "" },
];

// Plano de contas conforme planilha
export const seedPlanoContas: PlanoConta[] = [
  { id: "pc-r1", tipo: "Receita", nome: "Serviços", subcategorias: [
    "Banho Porte Pequeno", "Banho Porte Médio", "Banho Porte Grande",
    "Banho e Tosa Higiênica Peq.", "Banho e Tosa Higiênica Med.", "Banho e Tosa Higiênica Gra.",
    "Banho e Tosa Porte Pequeno", "Banho e Tosa Porte Médio", "Banho e Tosa Porte Grande",
    "Banho e Tosa Bebê", "Banho e Tosa Higiênica + Desembolo",
  ] },
  { id: "pc-r2", tipo: "Receita", nome: "Serviços II", subcategorias: ["Corte de Unha"] },
  { id: "pc-d1", tipo: "Despesa", nome: "Despesas Fixas", subcategorias: ["Energia Elétrica", "Internet", "Aluguel"] },
  { id: "pc-d2", tipo: "Despesa", nome: "Custo de Consumo", subcategorias: ["Shampoo Neutro", "Pré lavagem", "Laços", "Algodão", "Perfume", "Hidratante", "Afiação de Lâminas"] },
  { id: "pc-d3", tipo: "Despesa", nome: "Custo de Descartáveis", subcategorias: ["Limpeza", "Copo Descartáveis", "Papel Higiênico", "Água"] },
  { id: "pc-d4", tipo: "Despesa", nome: "Comissões", subcategorias: ["Comissão Emidio"] },
  { id: "pc-d5", tipo: "Despesa", nome: "Despesas Variáveis", subcategorias: ["Medicamento"] },
  { id: "pc-d6", tipo: "Despesa", nome: "Taxas de Cartão", subcategorias: ["Pagseguro", "Mercado Pago"] },
  { id: "pc-d7", tipo: "Despesa", nome: "Manutenção", subcategorias: ["Equipamento", "Predial"] },
];

// Bancos conforme planilha
export const seedBancos: ContaBancaria[] = [
  { id: "b1", nome: "Mercado Pago Jurídico", saldoInicial: 0, dataInicio: "2026-01-01" },
  { id: "b2", nome: "Pagseguro Jurídico", saldoInicial: 0, dataInicio: "2026-01-01" },
  { id: "b3", nome: "Pagseguro", saldoInicial: 0, dataInicio: "2026-01-01" },
  { id: "b4", nome: "Caixa da Loja", saldoInicial: 0, dataInicio: "2026-01-01" },
  { id: "b5", nome: "Permuta", saldoInicial: 0, dataInicio: "2026-01-01" },
];

export const seedFornecedores: Fornecedor[] = [];

// Metas conforme planilha (apenas Janeiro preenchido)
export const seedMetas: Meta[] = [
  { id: "m1", ano: 2026, planoContaId: "pc-r1", valores: [7500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m2", ano: 2026, planoContaId: "pc-d1", valores: [1240, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m3", ano: 2026, planoContaId: "pc-d2", valores: [480, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m4", ano: 2026, planoContaId: "pc-d3", valores: [40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m5", ano: 2026, planoContaId: "pc-d4", valores: [3000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m6", ano: 2026, planoContaId: "pc-d5", valores: [100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "m7", ano: 2026, planoContaId: "pc-d6", valores: [40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

// Sem lançamentos pré-cadastrados — a planilha não traz movimentações ainda.
export const seedEntradas: Entrada[] = [];
export const seedSaidas: Saida[] = [];

export const seedSettings: Settings = {
  nomePetshop: "Pet & Cia Banho e Tosa",
  corTema: "#7C3AED",
};
