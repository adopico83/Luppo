"use client";

import { createContext, useContext, type ReactNode } from "react";
import { IDIOMA_POR_DEFECTO, t, type ClaveTexto, type Idioma } from "@/lib/i18n";

const IdiomaContext = createContext<Idioma>(IDIOMA_POR_DEFECTO);

export function I18nProvider({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return <IdiomaContext.Provider value={idioma}>{children}</IdiomaContext.Provider>;
}

// Para componentes de cliente. Sin proveedor (p. ej. en tests) usa el castellano.
export function useT() {
  const idioma = useContext(IdiomaContext);
  return (clave: ClaveTexto, variables?: Record<string, string | number>) =>
    t(clave, idioma, variables);
}
