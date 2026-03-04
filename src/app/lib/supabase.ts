
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Configuração Industrial do Cliente Supabase.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Verifica se as credenciais do Supabase estão minimamente configuradas.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
)

/**
 * Alerta de Segurança: Detecta se a chave configurada é a secreta (service_role).
 */
export const isUsingSecretKeyInBrowser = typeof window !== 'undefined' && supabaseAnonKey.length > 150;

/**
 * Função helper para criar novos clientes com tratamento de erro agressivo.
 * Se houver erro de chave, retorna um cliente placeholder para não quebrar o app.
 */
export function createClient() {
  if (!isSupabaseConfigured || isUsingSecretKeyInBrowser) {
    // Retorna um mock minimalista para evitar erros de referência nula
    return createSupabaseClient('https://placeholder-project.supabase.co', 'placeholder-key')
  }
  
  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (e) {
    return createSupabaseClient('https://placeholder-project.supabase.co', 'placeholder-key')
  }
}

export const supabase = createClient()
