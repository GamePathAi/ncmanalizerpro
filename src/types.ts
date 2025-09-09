// Tipos compartilhados
export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  subscription_type?: 'annual' | 'lifetime' | null
  subscription_status?: 'active' | 'canceled' | 'pending'
  subscription_id?: string
  customer_id?: string
  subscription_start_date?: string
  subscription_end_date?: string
  created_at?: string
  updated_at?: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  plan_type: 'annual' | 'lifetime'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

// Tipos para NCM Analyzer
export interface NCMOpportunity {
  suggestedNCM: string
  suggestedDescription: string
  currentRate: number
  suggestedRate: number
  savings: number
  confidence: 'ALTA' | 'MÉDIA' | 'BAIXA'
  caselaw: string
  category?: string
}

export interface NCMValidation {
  valid: boolean
  active?: boolean
  info?: {
    codigo: string
    descricao: string
    dataInicio: string
    dataFim: string
    ato: string
  }
  formatted?: string
  message: string
}

export interface ProcessedNCMItem {
  id: number
  ncm: string
  description: string
  value: number
  opportunity?: NCMOpportunity
  currentNCM: string
  potentialSavings: number
  ncmValidation: NCMValidation
  isValidNCM: boolean
  isActiveNCM: boolean
  officialDescription?: string | null
}

export interface NCMAnalysis {
  totalItems: number
  itemsWithOpportunities: number
  totalValue: number
  totalSavings: number
  avgSavingsPercent: number
  coveragePercent: number
  validNCMs: number
  activeNCMs: number
  invalidNCMs: number
  ncmValidationPercent: number
}