# Auth Feature – TS Migration Checklist

Estado: en progreso

## Hotfixes (bloqueantes)
- [ ] Corregir `AUTH_UI_TEXT.WELCOME_TITLE` y mojibake en `auth.constants.ts`.
- [ ] Normalizar acentos en mensajes (contraseña, sesión, conexión, inválido).
- [ ] Reemplazar regex NAME/AGENCY por Unicode (`\p{L}`, `\p{N}`, flag `u`).
- [ ] Arreglar barrels con extensión incorrecta (`.jsx` -> extensionless/`.tsx`).

## Limpieza y consistencia
- [ ] Eliminar imports/variables sin uso (p. ej. `useState` en `useAuthFlow.ts`, `finalClass` en `GoogleLoginButton.tsx`).
- [ ] Unificar exports (preferir nombrados) en componentes del feature.
- [ ] Revisar re-exports de `LoginForm.jsx`/`RegisterForm.jsx` en `components/index.ts` (JS en barrel TS).
- [ ] Corregir textos con mojibake en `AuthPage.tsx`/`WelcomePage.tsx` (e.g., “inválido”, “página”).

## Refactor de flujo
- [ ] Reescribir `AuthPage.tsx` para delegar estado y handlers a `useAuthFlow` (DRY).
- [ ] Mantener solo composición UI y validación en `AuthPage`.

## Tipado y DX
- [ ] Tipar `FormField` con `UseFormRegister<AuthFormData>` y `HTMLInputTypeAttribute`.
- [ ] `useAuthFlow` debe exponer `UseFormReturn<AuthFormData>` (sin `any`).
- [ ] `auth.service`: tipar `code` como `AuthErrorCode` y declarar retornos.

## Organización de API (opcional, posterior)
- [ ] Mover `fetch('/api/v1/...')` a `src/api/auth.ts` y consumirlo desde `authService`.
- [ ] Migrar `supabaseClient` a TS y publicar bajo `@lib/supabaseClient`.

## Estilos
- [ ] Decidir uso de `styles/auth.module.css`; eliminar si no se usa o integrar.

## Verificación
- [ ] `tsc --noEmit` sin errores en `auth/*`.
- [ ] Smoke test de `AuthPage` (render por estado, submits mockeados).
- [ ] Unit tests: `auth.service` (mock `fetch`/`supabase`), `useAuthFlow` (transiciones y errores).

## Notas
- Mantener imports con alias (`@auth/*`, `@components/*`).
- No introducir cambios de comportamiento fuera de hotfixes sin acordarlo.

