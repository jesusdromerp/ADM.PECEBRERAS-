/**
 * Normaliza un teléfono para WhatsApp: deja solo dígitos y antepone el indicativo 57
 * a celulares colombianos de 10 dígitos. Devuelve "" si no hay un número utilizable
 * (por ejemplo, un campo que solo contiene el prefijo "+57 ").
 */
export function normalizeWhatsAppPhone(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits.length >= 8 ? digits : "";
}

/**
 * Enlace de WhatsApp con el mensaje prearmado. Sin número válido no se usa ningún
 * destinatario de respaldo: WhatsApp le pide al usuario elegir el contacto.
 */
export function buildWhatsAppUrl(phone: string | null | undefined, text: string): string {
  const number = normalizeWhatsAppPhone(phone);
  const encoded = encodeURIComponent(text);
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
