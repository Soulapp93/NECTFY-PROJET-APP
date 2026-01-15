/**
 * Logger de production - ne log que les erreurs critiques
 * Retire tous les console.log en production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Erreurs critiques uniquement
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    }
    // En production, envoyer à un service de monitoring (Sentry, etc.)
  },

  // Warnings importants
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  // Informations (développement uniquement)
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
  },

  // Debug (développement uniquement)
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};
