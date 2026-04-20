import type {
  Cliente, Entrada, Pet, Saida, Settings,
  PlanoConta, Meta, ContaBancaria, Fornecedor,
} from "./types";

export const seedClientes: Cliente[] = [
  { id: "c1", nome: "Mariana Souza", cpf: "123.456.789-00", whatsapp: "(11) 98765-4321", endereco: "Rua das Flores, 120", bairro: "Vila Mariana", cidade: "São Paulo", observacoes: "Prefere atendimento pela manhã." },
  { id: "c2", nome: "Rafael Almeida", cpf: "987.654.321-00", whatsapp: "(11) 91234-5678", endereco: "Av. Paulista, 900", bairro: "Bela Vista", cidade: "São Paulo", observacoes: "" },
  { id: "c3", nome: "Beatriz Lima", cpf: "456.123.789-11", whatsapp: "(11) 99988-7766", endereco: "Rua Augusta, 555", bairro: "Consolação", cidade: "São Paulo", observacoes: "Cliente desde 2023." },
];

export const seedPets: Pet[] = [
  { id: "p1", clienteId: "c1", nome: "Thor", especie: "Cão", raca: "Golden Retriever", porte: "Grande", peso: 32, cor: "Dourado", idade: "3 anos", temperamento: "Dócil", observacoes: "Adora água. Alergia a shampoo com fragrância forte." },
  { id: "p2", clienteId: "c2", nome: "Mel", especie: "Cão", raca: "Shih Tzu", porte: "Pequeno", peso: 6, cor: "Branco e caramelo", idade: "5 anos", temperamento: "Dócil", observacoes: "Não gosta de secador alto." },
  { id: "p3", clienteId: "c3", nome: "Luna", especie: "Gato", raca: "Persa", porte: "Pequeno", peso: 4, cor: "Cinza", idade: "2 anos", temperamento: "Agitado", observacoes: "Necessita contenção delicada." },
];

export const seedPlanoContas: PlanoConta[] = [
  { id: "pc-r1", tipo: "Receita", nome: "Banho", subcategorias: ["Pequeno", "Médio", "Grande"] },
  { id: "pc-r2", tipo: "Receita", nome: "Tosa", subcategorias: ["Higiênica", "Completa", "Bebê"] },
  { id: "pc-r3", tipo: "Receita", nome: "Banho+Tosa", subcategorias: [] },
  { id: "pc-r4", tipo: "Receita", nome: "Hidratação", subcategorias: [] },
  { id: "pc-r5", tipo: "Receita", nome: "Outros Serviços", subcategorias: ["Corte de unha", "Limpeza de ouvido"] },
  { id: "pc-d1", tipo: "Despesa", nome: "Produtos", subcategorias: ["Shampoo", "Condicionador", "Perfume"] },
  { id: "pc-d2", tipo: "Despesa", nome: "Energia", subcategorias: [] },
  { id: "pc-d3", tipo: "Despesa", nome: "Aluguel", subcategorias: [] },
  { id: "pc-d4", tipo: "Despesa", nome: "Manutenção", subcategorias: ["Equipamentos", "Predial"] },
  { id: "pc-d5", tipo: "Despesa", nome: "Outros", subcategorias: [] },
];

export const seedBancos: ContaBancaria[] = [
  { id: "b1", nome: "Banco do Brasil CC", saldoInicial: 3000, dataInicio: "2026-01-01" },
  { id: "b2", nome: "Caixa Dinheiro", saldoInicial: 500, dataInicio: "2026-01-01" },
];

export const seedFornecedores: Fornecedor[] = [
  { id: "f1", nome: "PetSupply Distribuidora", documento: "12.345.678/0001-90", endereco: "Rua Comercial, 200", cidade: "São Paulo", uf: "SP", telefone: "(11) 3456-7890", email: "vendas@petsupply.com" },
  { id: "f2", nome: "Eletro Manutenção Ltda", documento: "98.765.432/0001-10", endereco: "Av. Industrial, 50", cidade: "São Paulo", uf: "SP", telefone: "(11) 2345-6789", email: "contato@eletroman.com" },
];

export const seedMetas: Meta[] = [
  { id: "m1", ano: 2026, planoContaId: "pc-r1", valores: [800, 800, 900, 1000, 1000, 1100, 1100, 1100, 1200, 1200, 1300, 1500] },
  { id: "m2", ano: 2026, planoContaId: "pc-r2", valores: [400, 400, 450, 500, 500, 550, 550, 550, 600, 600, 650, 750] },
  { id: "m3", ano: 2026, planoContaId: "pc-r3", valores: [600, 600, 700, 800, 800, 900, 900, 900, 1000, 1000, 1100, 1300] },
  { id: "m4", ano: 2026, planoContaId: "pc-d1", valores: [200, 200, 250, 250, 250, 300, 300, 300, 350, 350, 400, 400] },
  { id: "m5", ano: 2026, planoContaId: "pc-d2", valores: [350, 350, 380, 380, 380, 400, 400, 400, 380, 380, 380, 400] },
  { id: "m6", ano: 2026, planoContaId: "pc-d3", valores: Array(12).fill(1500) },
];

export const seedEntradas: Entrada[] = [
  { id: "e1", data: "2026-04-02", descricao: "Banho + Tosa Thor", categoria: "Banho+Tosa", valor: 130, formaPagamento: "Pix", clienteId: "c1", petId: "p1", status: "Pago", contaBancariaId: "b1", planoContaId: "pc-r3" },
  { id: "e2", data: "2026-04-05", descricao: "Banho Mel", categoria: "Banho", valor: 60, formaPagamento: "Dinheiro", clienteId: "c2", petId: "p2", status: "Pago", contaBancariaId: "b2", planoContaId: "pc-r1" },
  { id: "e3", data: "2026-04-09", descricao: "Hidratação Luna", categoria: "Hidratação", valor: 80, formaPagamento: "Cartão Débito", clienteId: "c3", petId: "p3", status: "Pago", contaBancariaId: "b1", planoContaId: "pc-r4" },
  { id: "e4", data: "2026-04-12", descricao: "Tosa Higiênica Mel", categoria: "Tosa", valor: 50, formaPagamento: "Pix", clienteId: "c2", petId: "p2", status: "Pago", contaBancariaId: "b1", planoContaId: "pc-r2" },
  { id: "e5", data: "2026-04-15", descricao: "Banho + Tosa Thor", categoria: "Banho+Tosa", valor: 130, formaPagamento: "Cartão Crédito", clienteId: "c1", petId: "p1", status: "A Receber", contaBancariaId: "b1", planoContaId: "pc-r3" },
];

export const seedSaidas: Saida[] = [
  { id: "s1", data: "2026-04-03", descricao: "Compra de shampoo neutro 5L", categoria: "Produtos", valor: 220, formaPagamento: "Pix", status: "Pago", contaBancariaId: "b1", fornecedorId: "f1", planoContaId: "pc-d1" },
  { id: "s2", data: "2026-04-10", descricao: "Conta de energia", categoria: "Energia", valor: 380, formaPagamento: "Dinheiro", status: "Pago", contaBancariaId: "b2", planoContaId: "pc-d2" },
  { id: "s3", data: "2026-04-14", descricao: "Manutenção do secador", categoria: "Manutenção", valor: 150, formaPagamento: "Dinheiro", status: "A Pagar", contaBancariaId: "b2", fornecedorId: "f2", planoContaId: "pc-d4" },
];

export const seedSettings: Settings = {
  nomePetshop: "PetShop Pet & Cia",
  corTema: "#7C3AED",
};
