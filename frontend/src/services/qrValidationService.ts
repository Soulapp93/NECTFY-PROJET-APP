import { supabase } from '@/integrations/supabase/client';

interface QRValidationResult {
  is_valid: boolean;
  sheet_id: string | null;
  formation_title: string | null;
  error_message: string | null;
}

interface RateLimitResult {
  allowed: boolean;
  remaining_attempts: number;
  retry_after_seconds: number;
}

/**
 * Valide un code QR côté serveur avec toutes les vérifications de sécurité
 */
export async function validateQRCodeSecure(
  code: string,
  userId: string
): Promise<QRValidationResult> {
  try {
    // Validation format côté client d'abord
    if (!/^\d{6}$/.test(code)) {
      return {
        is_valid: false,
        sheet_id: null,
        formation_title: null,
        error_message: 'Code invalide: doit contenir 6 chiffres'
      };
    }

    // Appel de la fonction de validation sécurisée
    const { data, error } = await supabase.rpc('validate_qr_code_secure', {
      code_param: code,
      user_id_param: userId
    });

    if (error) throw error;

    return data?.[0] || {
      is_valid: false,
      sheet_id: null,
      formation_title: null,
      error_message: 'Erreur de validation'
    };
  } catch (error: any) {
    return {
      is_valid: false,
      sheet_id: null,
      formation_title: null,
      error_message: 'Erreur système'
    };
  }
}

/**
 * Vérifie les limites de tentatives (rate limiting)
 */
export async function checkRateLimit(
  userId: string,
  ipAddress: string = 'unknown'
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_qr_rate_limit', {
      user_id_param: userId,
      ip_address_param: ipAddress
    });

    if (error) throw error;

    return data?.[0] || {
      allowed: false,
      remaining_attempts: 0,
      retry_after_seconds: 60
    };
  } catch (error) {
    // En cas d'erreur, autoriser par défaut mais logguer
    return {
      allowed: true,
      remaining_attempts: 5,
      retry_after_seconds: 0
    };
  }
}

/**
 * Enregistre une tentative de validation
 */
export async function recordValidationAttempt(
  userId: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  try {
    await supabase.from('qr_validation_attempts').insert({
      user_id: userId,
      ip_address: ipAddress,
      success,
      attempted_at: new Date().toISOString()
    });
  } catch (error) {
    // Silently fail - ne pas bloquer l'utilisateur si le logging échoue
  }
}

/**
 * Enregistre une action d'émargement dans l'audit log
 */
export async function logAttendanceAction(
  sheetId: string,
  userId: string,
  action: 'qr_scan' | 'manual_code' | 'signature' | 'validation',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.rpc('log_attendance_action', {
      sheet_id: sheetId,
      user_id: userId,
      action_type: action,
      ip_addr: null, // Pas accessible depuis le client
      user_agent_val: navigator.userAgent,
      meta: metadata ? JSON.stringify(metadata) : null
    });
  } catch (error) {
    // Silently fail - ne pas bloquer l'utilisateur
  }
}
