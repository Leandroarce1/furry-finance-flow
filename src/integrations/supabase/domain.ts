// Domain types for Supabase tables (manual definitions — auto-generated types
// live in ./types.ts and are managed by Lovable).

export interface Tutor {
  id: string
  nome: string
  telefone?: string
  whatsapp?: string
  email?: string
  cpf?: string
  endereco?: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface Pet {
  id: string
  tutor_id: string
  nome: string
  especie?: string
  raca?: string
  sexo?: 'macho' | 'femea'
  nascimento?: string
  peso?: number
  porte?: 'pequeno' | 'medio' | 'grande'
  foto_url?: string
  observacoes?: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface Servico {
  id: string
  nome: string
  descricao?: string
  preco_base?: number
  duracao_min?: number
  categoria?: 'banho' | 'tosa' | 'veterinario' | 'outros'
  ativo: boolean
}

export interface Agendamento {
  id: string
  pet_id: string
  servico_id?: string
  data_hora: string
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado'
  valor_cobrado?: number
  observacoes?: string
  created_at: string
}

export interface Vacina {
  id: string
  pet_id: string
  nome_vacina: string
  data_aplicacao: string
  proxima_dose?: string
  veterinario?: string
  observacoes?: string
}

export interface Pagamento {
  id: string
  agendamento_id?: string
  tutor_id?: string
  valor: number
  metodo?: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'
  status: 'pago' | 'pendente' | 'atrasado'
  data_pagamento?: string
  vencimento?: string
  observacoes?: string
  created_at: string
}

export interface Produto {
  id: string
  nome: string
  categoria?: string
  unidade?: string
  quantidade: number
  quantidade_minima: number
  preco_custo?: number
  ativo: boolean
}

export interface Notificacao {
  id: string
  tutor_id?: string
  pet_id?: string
  tipo: 'retorno' | 'vacina' | 'aniversario' | 'cobranca' | 'confirmacao'
  mensagem?: string
  canal: string
  status: 'pendente' | 'enviado' | 'erro'
  agendado_para?: string
  enviado_em?: string
  created_at: string
}
