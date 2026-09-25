import { HorseDietFeedConfig } from "@/types";

export interface FeedCalculationResult {
  daysDuration: number;
  depletionDate: string;
  alertDate: string;
  daysRemaining: number;
  kgRemaining: number;
  percentageRemaining: number;
  isLowFeed: boolean; // 2 días o menos
  isDepleted: boolean; // 0 días o menos
}

/**
 * Calcula la duración, fecha de agotamiento y días restantes del alimento
 */
export function calculateFeedDepletion(
  totalKg: number,
  dailyGrainKg: number,
  startDateStr: string
): FeedCalculationResult {
  const safeDailyKg =
    typeof dailyGrainKg === "number" && !isNaN(dailyGrainKg) && dailyGrainKg > 0
      ? dailyGrainKg
      : 1;
  const safeTotalKg =
    typeof totalKg === "number" && !isNaN(totalKg)
      ? Math.max(0, totalKg)
      : 0;

  // Días totales que dura el lote
  const daysDuration = Math.max(1, Math.floor(safeTotalKg / safeDailyKg));

  const start = new Date(startDateStr);
  const startTime = isNaN(start.getTime()) ? Date.now() : start.getTime();

  // Fecha exacta de agotamiento protegida contra desbordamientos o NaN
  const rawDepletion = startTime + daysDuration * 24 * 60 * 60 * 1000;
  const depletionTime = isNaN(rawDepletion) ? Date.now() + 30 * 24 * 60 * 60 * 1000 : rawDepletion;
  const depletionDate = new Date(depletionTime).toISOString().split("T")[0];

  // Fecha de alerta (2 días antes)
  const rawAlert = depletionTime - 2 * 24 * 60 * 60 * 1000;
  const alertTime = isNaN(rawAlert) ? Date.now() + 28 * 24 * 60 * 60 * 1000 : rawAlert;
  const alertDate = new Date(alertTime).toISOString().split("T")[0];

  // Días y kilos restantes calculados en base a hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = depletionTime - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  const kgRemaining = Math.max(
    0,
    Math.min(safeTotalKg, Math.round(daysRemaining * safeDailyKg * 10) / 10)
  );

  const percentageRemaining =
    safeTotalKg > 0
      ? Math.max(0, Math.min(100, Math.round((kgRemaining / safeTotalKg) * 100)))
      : 0;

  const isLowFeed = daysRemaining <= 2 && daysRemaining > 0;
  const isDepleted = daysRemaining <= 0;

  return {
    daysDuration,
    depletionDate,
    alertDate,
    daysRemaining,
    kgRemaining,
    percentageRemaining,
    isLowFeed,
    isDepleted,
  };
}

/**
 * Genera el enlace de WhatsApp con el mensaje prearmado para notificar 2 días antes al propietario
 */
export function buildFeedWhatsAppUrl({
  horseName,
  boxCode,
  ownerName,
  ownerPhone,
  feedConfig,
  stableName = "Hacienda & Pesebreras",
}: {
  horseName: string;
  boxCode?: string | null;
  ownerName: string;
  ownerPhone: string;
  feedConfig: HorseDietFeedConfig;
  stableName?: string;
}): { waUrl: string; messageText: string } {
  const calc = calculateFeedDepletion(
    feedConfig.totalKgSupplied,
    feedConfig.dailyGrainKg,
    feedConfig.startDate
  );

  const cleanPhone = ownerPhone.replace(/\D/g, "");
  const phoneWithCountry =
    cleanPhone.length === 10 && cleanPhone.startsWith("3") ? `57${cleanPhone}` : cleanPhone;

  let blendDetail = "";
  if (feedConfig.feedType === "mezcla" && feedConfig.blendIngredients?.length) {
    blendDetail =
      "\n🥣 *Composición de la mezcla:* " +
      feedConfig.blendIngredients.map((ing) => `${ing.name} (${ing.kg}kg)`).join(" + ");
  }

  const estadoDias =
    calc.daysRemaining <= 0
      ? "🚨 *URGENTE:* El alimento se ha agotado hoy."
      : calc.daysRemaining === 1
      ? "⚠️ Le queda ración para aproximadamente *1 DÍA*."
      : `⚠️ Le quedan raciones para aproximadamente *${calc.daysRemaining} DÍAS*.`;

  const messageText =
    `🔔 *AVISO DE ALIMENTO - ${stableName.toUpperCase()}*\n\n` +
    `Estimado(a) *${ownerName}*,\n\n` +
    `Le informamos desde la administración de pesebreras sobre su ejemplar *${horseName}* (Pesebrera ${boxCode || "Asignada"}):\n\n` +
    `🌾 *Alimento:* ${feedConfig.feedName}${blendDetail}\n` +
    `⚖️ *Ración diaria:* ${feedConfig.dailyGrainKg} kg/día\n` +
    `📦 *Stock actual restante:* ~${calc.kgRemaining} kg\n` +
    `⏳ *Estado:* ${estadoDias}\n` +
    `📅 *Fecha estimada fin:* ${calc.depletionDate}\n\n` +
    `Por favor coordinar la entrega o envío del nuevo bulto a la bodega del criadero para no interrumpir el plan alimenticio de su caballo.\n\n` +
    `¡Muchas gracias por su compromiso!\n` +
    `🤠 *Mayordomo & Administración*`;

  const waUrl = phoneWithCountry
    ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return { waUrl, messageText };
}

/**
 * Genera el enlace de WhatsApp con el mensaje de EMERGENCIA para el día que se agotó el alimento
 * y el dueño no lo ha llevado, consultando si el caballo se queda a solo forraje o si el criadero
 * le suministra la ración con cargo a su cuenta.
 */
export function buildEmergencyRunoutWhatsAppUrl({
  horseName,
  boxCode,
  ownerName,
  ownerPhone,
  feedConfig,
  emergencyCostCOP = 25000,
  stableName = "Hacienda & Pesebreras",
}: {
  horseName: string;
  boxCode?: string | null;
  ownerName: string;
  ownerPhone: string;
  feedConfig: HorseDietFeedConfig;
  emergencyCostCOP?: number;
  stableName?: string;
}): { waUrl: string; messageText: string } {
  const cleanPhone = ownerPhone.replace(/\D/g, "");
  const phoneWithCountry =
    cleanPhone.length === 10 && cleanPhone.startsWith("3") ? `57${cleanPhone}` : cleanPhone;

  const costFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(emergencyCostCOP);

  const messageText =
    `🚨 *ALERTA URGENTE: ALIMENTO AGOTADO EN PESEBRERA* 🚨\n\n` +
    `Estimado(a) *${ownerName}*,\n\n` +
    `Le informamos con carácter de *urgencia* desde *${stableName}* que el concentrado/mezcla de su ejemplar *${horseName}* (Pesebrera ${boxCode || "Asignada"}) se ha *AGOTADO COMPLETAMENTE* el día de hoy.\n\n` +
    `⚠️ A la fecha y hora de este comunicado, aún no tenemos registrado el ingreso del nuevo bulto de reposición en la bodega del criadero.\n\n` +
    `Por el bienestar metabólico, salud gástrica y régimen diario del ejemplar, requerimos su *AUTORIZACIÓN INMEDIATA* para proceder de una de las siguientes dos maneras:\n\n` +
    `1️⃣ *SUMINISTRO DE EMERGENCIA DEL CRIADERO:*\n` +
    `Autorizar que el mayordomo le sirva las raciones diarias (${feedConfig.dailyGrainKg} kg/día) de nuestro concentrado institucional de reserva en bodega, con un costo de *${costFormatted}* por ración diaria, cargado a su cuenta mensual de pesebrera.\n\n` +
    `2️⃣ *DIETA EXCLUSIVA DE FORRAJE / PASTO:*\n` +
    `O confirmar si prefiere que el ejemplar permanezca temporalmente únicamente a base de heno y pasto de corte hasta que usted traiga o envíe el bulto correspondiente a las instalaciones.\n\n` +
    `📲 *Por favor responda a este mensaje a la mayor brevedad indicando:* "¿Autoriza suministro de emergencia del criadero" o "Mantener solo a pasto hasta su entrega"?\n\n` +
    `Atentamente,\n` +
    `🤠 *Administración y Cuadras - ${stableName}*`;

  const waUrl = phoneWithCountry
    ? `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return { waUrl, messageText };
}

