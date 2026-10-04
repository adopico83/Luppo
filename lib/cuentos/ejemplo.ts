import type { Idioma } from "@/lib/i18n";

// Cuento de ejemplo fijo, para cuando no hay claves de Anthropic (desarrollo en local) o algo falla.
// Es genérico («Luppo y sus amigos») para que encaje con cualquier personaje y lugar elegidos.
// No tiene audio. Se enseña en /cuento/ejemplo.
export const ID_CUENTO_EJEMPLO = "ejemplo";

export type CuentoEjemplo = { titulo: string; escenas: string[] };

export const CUENTOS_EJEMPLO: Record<Idioma, CuentoEjemplo> = {
  es: {
    titulo: "Un paseo tranquilo con Luppo",
    escenas: [
      "Había una vez un día muy bonito. Luppo y sus amigos salieron a pasear. El sol brillaba y todo estaba en calma.",
      "Por el camino encontraron un pajarito pequeñito. El pajarito cantó: pío, pío, pío. Todos sonrieron.",
      "Después jugaron juntos. Se rieron, dieron saltitos y se sintieron muy felices.",
      "Cuando llegó la noche, salió la luna. Luppo y sus amigos bostezaron: aaaah. Cerraron los ojitos y se fueron a dormir. Buenas noches, amigos.",
    ],
  },
  eu: {
    titulo: "Paseo lasai bat Luppo-rekin",
    escenas: [
      "Behin batean, egun oso polita zen. Luppo eta bere lagunak paseatzera atera ziren. Eguzkia distiratsu zegoen eta dena lasai zegoen.",
      "Bidean, txori txiki bat aurkitu zuten. Txoriak kantatu zuen: pi, pi, pi. Denek irribarre egin zuten.",
      "Gero, elkarrekin jolastu zuten. Barre egin zuten, jauzi txikiak egin zituzten eta oso pozik sentitu ziren.",
      "Iluntzean, ilargia atera zen. Luppo eta bere lagunak aho-zabalka hasi ziren: aaaah. Begi txikiak itxi zituzten eta lotara joan ziren. Gabon, lagunak.",
    ],
  },
};
