// Edad en años cumplidos a partir de la fecha de nacimiento (perfiles_hijo.fecha_nacimiento).
// Se usa para adaptar los cuentos. Acepta "AAAA-MM-DD" (como llega de la base de datos) o Date.
// Lanza RangeError si la fecha no es válida o es posterior a `hoy`.
export function edadEnAnios(nacimiento: string | Date, hoy: Date = new Date()): number {
  const { anio, mes, dia } = partes(nacimiento);
  const ahora = partes(hoy);

  const edad =
    ahora.anio - anio - (ahora.mes < mes || (ahora.mes === mes && ahora.dia < dia) ? 1 : 0);
  if (edad < 0) throw new RangeError("La fecha de nacimiento es posterior a hoy");
  return edad;
}

function partes(fecha: string | Date) {
  if (typeof fecha === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (m) {
      const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
      // Date normaliza fechas imposibles (31 de febrero): comparamos para rechazarlas.
      const control = new Date(Date.UTC(anio, mes - 1, dia));
      if (control.getUTCMonth() === mes - 1 && control.getUTCDate() === dia) {
        return { anio, mes, dia };
      }
    }
    throw new RangeError(`Fecha de nacimiento no válida: ${fecha}`);
  }
  if (Number.isNaN(fecha.getTime())) throw new RangeError("Fecha no válida");
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, dia: fecha.getDate() };
}
