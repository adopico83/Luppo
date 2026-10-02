# Luppo

App de cuentos interactivos y personalizados para niños de 3 a 6 años, con Luppo, un lince verde salvia con bufanda terracota, y sus amigos. Los cuentos se generan con IA, se narran con voz, los personajes se mueven y cada historia termina con una canción y un baile.

Estado: en construcción (fase 1).

Stack: Next.js (App Router) + TypeScript + Tailwind, PWA con Serwist, Supabase, Vercel.

## Cómo arrancar

```bash
npm install
cp .env.example .env.local   # rellena los valores (nunca se suben a git)
npm run dev                  # http://localhost:3000
```

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (sin service worker) |
| `npm run build` | Compila para producción (genera el service worker) |
| `npm run lint` | Revisa el estilo del código |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm test` | Ejecuta los tests (Vitest) |
| `npm run check:secretos` | Busca claves en lo que vas a commitear |
| `npm run iconos` | Regenera los iconos de la PWA |

`npm install` activa un hook de pre-commit que ejecuta `check:secretos`.

## Probar la PWA

El service worker solo existe en producción: `npm run build && npm start`, y abrir en el navegador (instalable desde el menú).

## Configurar el login (Supabase)

El login es por enlace mágico (sin contraseña). En el panel de Supabase, **Authentication → URL Configuration**:

- **Site URL**: la URL de producción (o `http://localhost:3000` mientras pruebas).
- **Redirect URLs**: añade `http://localhost:3000/auth/callback` y `https://<tu-dominio-vercel>/auth/callback` (las de los previews también, si los usas).

Por defecto el enlace solo funciona si se abre **en el mismo navegador** donde se pidió. Para que funcione también desde otro navegador (por ejemplo, pedirlo en la PWA instalada y abrir el email en Safari), cambia en **Authentication → Emails → Magic Link** el enlace por:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Entrar en Luppo</a>
```

Cuando tú y la madre hayáis entrado una vez, desactiva **Authentication → Sign In / Providers → Allow new users to sign up** para que nadie más pueda crear cuenta.

## Imágenes de los muñecos

Cada muñeco se busca en `public/munecos/<clave>.jpg` (por ejemplo `luppo.jpg`, `zorrito.jpg`). Si falta, la app enseña un bloque suave con su nombre.

## Reglas del repo (es público)

- Las claves van solo en `.env.local` y en las variables de Vercel. Nunca en el código, tests, commits ni PRs.
- Nada de datos reales de menores: en seeds y tests, perfiles inventados.
