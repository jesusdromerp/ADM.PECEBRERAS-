import { CanonServiceInclusion } from "@/types";

export type CoverageCategory =
  | "Herraje"
  | "Sanidad"
  | "Alimentación"
  | "Montador / Pista"
  | "Novedad Operativa";

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Palabras clave que identifican, dentro del nombre de una inclusión del plan,
 * el servicio al que corresponde cada categoría de novedad.
 * En alimentación se distingue forraje (heno/pasto) de concentrado según el texto de la novedad.
 */
function keywordsFor(category: CoverageCategory, context: string): string[] {
  switch (category) {
    case "Herraje":
      return ["herraje", "herrador", "herradura"];
    case "Sanidad":
      return ["veterin", "sanidad", "medic"];
    case "Montador / Pista":
      return ["montador", "adiestr", "pista"];
    case "Alimentación":
      return /heno|forraje|pasto/.test(normalize(context))
        ? ["heno", "forraje"]
        : ["comida", "concentrado", "alimento"];
    case "Novedad Operativa":
      return [];
  }
}

/**
 * Determina si un servicio está cubierto según las inclusiones marcadas en el plan
 * (no según el código TIPO_A/B/C), de modo que los planes editados en Ajustes se respetan.
 */
export function getPlanCoverage(
  inclusions: CanonServiceInclusion[] | undefined,
  category: CoverageCategory,
  context = ""
): { covered: boolean; inclusionName?: string } {
  const keywords = keywordsFor(category, context);
  const match = (inclusions || []).find(
    (inc) => inc.included && keywords.some((k) => normalize(inc.name).includes(k))
  );
  return match ? { covered: true, inclusionName: match.name } : { covered: false };
}
