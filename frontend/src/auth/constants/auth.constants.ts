/**
 * Authentication Constants
 */

/**
 * Form validation patterns
 */
export const AUTH_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d).{6,}$/, // At least one letter, one number, min 6 chars
  NAME: /^[\p{L}\s]{2,50}$/u, // Unicode letters and spaces, 2-50 chars
  AGENCY_NAME: /^[\p{L}\p{N}\s\-.]{2,100}$/u, // Letters, numbers, spaces, hyphens, dots
} as const

/**
 * Validation messages
 */
export const AUTH_VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'El email es obligatorio',
  EMAIL_INVALID: 'Formato de email inválido',
  PASSWORD_REQUIRED: 'La contraseña es obligatoria',
  PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres',
  PASSWORD_PATTERN: 'La contraseña debe contener al menos una letra y un número',
  NAME_REQUIRED: 'El nombre completo es obligatorio',
  NAME_MIN_LENGTH: 'El nombre debe tener al menos 2 caracteres',
  NAME_PATTERN: 'El nombre solo puede contener letras y espacios',
  AGENCY_NAME_REQUIRED: 'El nombre de la agencia es obligatorio',
  AGENCY_NAME_MIN_LENGTH: 'El nombre de la agencia debe tener al menos 2 caracteres',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
} as const

/**
 * Error messages for API responses
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  USER_NOT_FOUND: 'No se encontró un usuario con ese email',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese email',
  WEAK_PASSWORD: 'La contraseña es muy débil',
  EMAIL_NOT_CONFIRMED: 'Por favor confirma tu email antes de iniciar sesión',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Por favor espera un momento',
  INVALID_TOKEN: 'El token de autenticación es inválido',
  EXPIRED_TOKEN: 'El token de autenticación ha expirado',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción',
  FORBIDDEN: 'Acceso denegado',
  EMAIL_CHECK_FAILED: 'Error al verificar el email',
  REGISTRATION_FAILED: 'Error al crear la cuenta',
  OAUTH_FAILED: 'Error al iniciar sesión con el proveedor',
  LOGOUT_FAILED: 'Error al cerrar sesión',
  PASSWORD_RESET_FAILED: 'Error al enviar el email de recuperación',
  PASSWORD_UPDATE_FAILED: 'Error al actualizar la contraseña',
  SESSION_FETCH_FAILED: 'Error al obtener la sesión',
  SESSION_REFRESH_FAILED: 'Error al refrescar la sesión',
  NETWORK_ERROR: 'Error de conexión. Por favor verifica tu internet',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado',
} as const

/**
 * Success messages
 */
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN: '¡Bienvenido de vuelta!',
  REGISTER: '¡Cuenta creada exitosamente!',
  LOGOUT: 'Has cerrado sesión correctamente',
  PASSWORD_RESET_SENT: 'Te hemos enviado un email con instrucciones',
  PASSWORD_UPDATED: 'Tu contraseña ha sido actualizada',
  PROFILE_UPDATED: 'Tu perfil ha sido actualizado',
} as const

/**
 * UI text labels
 */
export const AUTH_UI_TEXT = {
  // Titles
  WELCOME_TITLE: '¡Hola!',
  WELCOME_BACK_TITLE: '¡Bienvenido de vuelta!',
  CREATE_ACCOUNT_TITLE: '¡Vamos a crear tu cuenta!',

  // Subtitles
  ENTER_EMAIL_SUBTITLE: 'Ingresa tu email para comenzar',
  ENTER_PASSWORD_SUBTITLE: 'Ingresa tu contraseña para continuar',
  COMPLETE_INFO_SUBTITLE: 'Completa tu información para empezar',

  // Button labels
  CONTINUE_WITH_EMAIL: 'Continuar con Email',
  CONTINUE_WITH_GOOGLE: 'Continuar con Google',
  LOGIN_BUTTON: 'Iniciar Sesión',
  REGISTER_BUTTON: 'Crear Cuenta',
  BACK_BUTTON: 'Volver',
  CHANGE_EMAIL: 'Cambiar',
  FORGOT_PASSWORD: '¿Olvidaste tu contraseña?',

  // Loading states
  CHECKING_EMAIL: 'Verificando...',
  LOGGING_IN: 'Iniciando sesión...',
  CREATING_ACCOUNT: 'Creando cuenta...',

  // Placeholders
  EMAIL_PLACEHOLDER: 'tu@email.com',
  PASSWORD_PLACEHOLDER: 'Tu contraseña',
  NEW_PASSWORD_PLACEHOLDER: 'Crea una contraseña',
  NAME_PLACEHOLDER: 'Tu nombre completo',
  AGENCY_NAME_PLACEHOLDER: 'Nombre de tu agencia',

  // Other
  OR_SEPARATOR: 'o',
  EMAIL_LABEL: 'Email:',
} as const

/**
 * Animation configurations
 */
export const AUTH_ANIMATIONS = {
  FORM_TRANSITION: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  },
  BUTTON_HOVER: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  ERROR_SHAKE: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
} as const

/**
 * Style class names
 */
export const AUTH_STYLES = {
  INPUT_BASE:
    'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-border-strong)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent-blue)]/30',
  INPUT_ERROR: 'border-red-400 focus:border-red-400 focus:ring-red-400/30',
  PRIMARY_BUTTON: 'w-full btn-cyber px-4 py-2 font-semibold',
  GOOGLE_BUTTON:
    'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-white/5 px-4 py-2 font-semibold text-text-primary transition hover:bg-white/10',
  ERROR_TEXT: 'mt-1 text-sm text-red-400',
  LABEL_TEXT: 'text-sm text-text-muted',
  SEPARATOR_LINE: 'w-full border-t border-[color:var(--color-border-subtle)]',
  DISABLED_FIELD:
    'px-3 py-2 bg-white/5 border border-[color:var(--color-border-subtle)] rounded-md text-text-primary',
} as const
