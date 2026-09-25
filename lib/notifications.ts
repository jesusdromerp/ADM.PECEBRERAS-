import {
  Horse,
  Client,
  CanonPlan,
  CenterSettings,
  OwnerNotification,
} from "@/types";

/**
 * Mapeo de reglas de cobertura por modalidad de canon:
 * Tipo A: Integral (Todo incluido: Comida, Herraje, Montador, Agua, Cama, Vitaminas)
 * Tipo B: Agua + Heno + Cama (Herrajes, montador, concentrado no incluidos)
 * Tipo C: Básico (Solo Agua + Cama)
 */
export function buildOwnerNotification({
  horse,
  owner,
  plan,
  serviceCategory,
  title,
  description,
  severity = "info",
  reportedBy = "Administración Criadero",
  suggestedCostCOP,
  centerSettings,
}: {
  horse: Horse;
  owner: Client;
  plan?: CanonPlan;
  serviceCategory: "Herraje" | "Sanidad" | "Alimentación" | "Montador / Pista" | "Novedad Operativa";
  title: string;
  description: string;
  severity?: "info" | "alerta" | "urgente";
  reportedBy?: string;
  suggestedCostCOP?: number;
  centerSettings: CenterSettings;
}): OwnerNotification {
  const planCode = plan?.code || "TIPO_A";
  const planName = plan?.name || "Pesebrera Tipo A";

  let coveredByPlan = false;
  let coverageDetail = "";

  if (planCode === "TIPO_A") {
    coveredByPlan = true;
    coverageDetail = `Cubierto 100% por su modalidad ${planName} (Servicio Integral)`;
  } else if (planCode === "TIPO_B") {
    if (serviceCategory === "Alimentación" && description.toLowerCase().includes("heno")) {
      coveredByPlan = true;
      coverageDetail = `Heno incluido en su modalidad ${planName}.`;
    } else {
      coveredByPlan = false;
      coverageDetail = `No cubierto en su modalidad ${planName} (El criadero asume solo Agua, Heno y Cama). Requiere aprobación del propietario.`;
    }
  } else {
    // TIPO_C u otro básico
    coveredByPlan = false;
    coverageDetail = `No cubierto en su modalidad ${planName} (El criadero asume únicamente Agua y Cama Básica).`;
  }

  // Generar mensaje prearmado para WhatsApp
  const phone = owner.phone?.replace(/\D/g, "") || "";
  const phoneWithCountry = phone.length === 10 && phone.startsWith("3") ? `57${phone}` : phone;

  const costLine =
    !coveredByPlan && suggestedCostCOP
      ? `\n💰 *Valor estimado:* $ ${new Intl.NumberFormat("es-CO").format(suggestedCostCOP)} COP`
      : "";

  const coverageBadgeText = coveredByPlan
    ? `✅ *COBERTURA:* ${coverageDetail}`
    : `⚠️ *ATENCIÓN PROPIETARIO:* ${coverageDetail}${costLine}`;

  const waText = encodeURIComponent(
    `🔔 *NOVEDAD EQUINA - ${centerSettings.stableName || "HACIENDA & PESEBRERAS"}*\n` +
      `Estimado(a) *${owner.fullName}*,\n\n` +
      `Le informamos sobre su ejemplar: *${horse.name}* (Pesebrera ${horse.pesebreraCode || "Asignada"}).\n\n` +
      `📋 *Novedad:* ${title}\n` +
      `📝 *Detalles:* ${description}\n` +
      `👤 *Reportado por:* ${reportedBy}\n\n` +
      `${coverageBadgeText}\n\n` +
      `Por favor responda este mensaje para coordinar cualquier inquietud. ¡Gracias!`
  );

  const waUrl = phoneWithCountry ? `https://wa.me/${phoneWithCountry}?text=${waText}` : undefined;

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    clientId: owner.id,
    clientName: owner.fullName,
    horseId: horse.id,
    horseName: horse.name,
    planCode,
    planName,
    serviceCategory,
    title,
    message: description,
    coveredByPlan,
    coverageDetail,
    extraCostCOP: !coveredByPlan ? suggestedCostCOP : undefined,
    severity,
    reportedBy,
    isRead: false,
    waUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const initialOwnerNotifications: OwnerNotification[] = [
  {
    id: "notif-1",
    clientId: "cli-2",
    clientName: "María Camila Gómez",
    horseId: "horse-2",
    horseName: "Tormenta de La Alborada",
    planCode: "TIPO_B",
    planName: "Pesebrera Tipo B",
    serviceCategory: "Herraje",
    title: "Herradura Floja en Pista",
    message: "Se detectó herradura desajustada tras sesión matutina de torno.",
    coveredByPlan: false,
    coverageDetail: "No cubierto en su modalidad Pesebrera Tipo B. El herraje es responsabilidad del propietario.",
    extraCostCOP: 210000,
    severity: "alerta",
    reportedBy: "Montador Carlos V.",
    isRead: false,
    createdAt: "2025-02-20T10:00:00Z",
    updatedAt: "2025-02-20T10:00:00Z",
  },
  {
    id: "notif-2",
    clientId: "cli-1",
    clientName: "Carlos Eduardo Restrepo",
    horseId: "horse-1",
    horseName: "Relámpago de San Isidro",
    planCode: "TIPO_A",
    planName: "Pesebrera Tipo A",
    serviceCategory: "Herraje",
    title: "Herraje de Pista Realizado",
    message: "Nivelación y recambio de herraduras lisas ejecutado con éxito por el maestro herrero.",
    coveredByPlan: true,
    coverageDetail: "Cubierto 100% por su modalidad Pesebrera Tipo A (Servicio Integral)",
    severity: "info",
    reportedBy: "Maestro Jairo Restrepo",
    isRead: true,
    createdAt: "2025-02-18T15:30:00Z",
    updatedAt: "2025-02-18T15:30:00Z",
  },
];
