// Rutas que se pueden ver sin sesión. Todo lo demás exige que un padre haya entrado.
// Los archivos estáticos (iconos, imágenes, service worker) no pasan por el proxy: ver proxy.ts.
const RUTAS_PUBLICAS = ["/login", "/auth/callback"];

export function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}
