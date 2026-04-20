import type { Cliente, Entrada, Pet, Saida, Settings } from "./types";

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

export const seedEntradas: Entrada[] = [
  { id: "e1", data: "2026-04-02", descricao: "Banho + Tosa Thor", categoria: "Banho+Tosa", valor: 130, formaPagamento: "Pix", clienteId: "c1", petId: "p1", status: "Pago" },
  { id: "e2", data: "2026-04-05", descricao: "Banho Mel", categoria: "Banho", valor: 60, formaPagamento: "Dinheiro", clienteId: "c2", petId: "p2", status: "Pago" },
  { id: "e3", data: "2026-04-09", descricao: "Hidratação Luna", categoria: "Hidratação", valor: 80, formaPagamento: "Cartão Débito", clienteId: "c3", petId: "p3", status: "Pago" },
  { id: "e4", data: "2026-04-12", descricao: "Tosa Higiênica Mel", categoria: "Tosa", valor: 50, formaPagamento: "Pix", clienteId: "c2", petId: "p2", status: "Pago" },
  { id: "e5", data: "2026-04-15", descricao: "Banho + Tosa Thor", categoria: "Banho+Tosa", valor: 130, formaPagamento: "Cartão Crédito", clienteId: "c1", petId: "p1", status: "A Receber" },
];

export const seedSaidas: Saida[] = [
  { id: "s1", data: "2026-04-03", descricao: "Compra de shampoo neutro 5L", categoria: "Produtos", valor: 220, formaPagamento: "Pix", status: "Pago" },
  { id: "s2", data: "2026-04-10", descricao: "Conta de energia", categoria: "Energia", valor: 380, formaPagamento: "Dinheiro", status: "Pago" },
  { id: "s3", data: "2026-04-14", descricao: "Manutenção do secador", categoria: "Manutenção", valor: 150, formaPagamento: "Dinheiro", status: "A Pagar" },
];

export const seedSettings: Settings = {
  nomePetshop: "PetShop Pet & Cia",
  corTema: "#7C3AED",
};
