import { Horse, Client, VeterinaryRecord, CenterSettings } from "@/types";

/**
 * Genera y descarga el Pasaporte y Carné Sanitario Oficial del Ejemplar
 * en formato compatible con Microsoft Word (.doc) con diseño institucional.
 * Válido para ferias, exposiciones, tránsito y control veterinario.
 */
export function downloadWordHorsePassport(
  horse: Horse,
  client?: Client | null,
  vetRecords?: VeterinaryRecord[],
  centerSettings?: CenterSettings
) {
  const stableName = centerSettings?.stableName || "Hacienda & Pesebreras";
  const tagline = centerSettings?.tagline || "Centro Integral de Reproducción, Alojamiento y Cuidado Equino";
  const vetName = centerSettings?.veterinarianName || "Dr. Juan Pablo Morales (MVZ)";
  const vetLicense = centerSettings?.veterinarianLicense || "COMVEZCOL # 19.842";
  const vetSpecialty = centerSettings?.veterinarianSpecialty || "Médico Veterinario Zootecnista (MVZ)";
  // Filtrar registros médicos relevantes de este caballo
  const horseRecords = (vetRecords || []).filter((r) => r.horseId === horse.id);

  let vaccineRows = "";
  if (horseRecords.length > 0) {
    vaccineRows = horseRecords
      .map(
        (r) => `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e7e5e4;">${r.date}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; text-transform: capitalize;">${r.type}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e7e5e4;">${r.title} ${r.dosage ? `(${r.dosage})` : ""}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e7e5e4;">${r.administeredBy}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e7e5e4; font-weight: 600; color: #065f46;">${r.nextDueDate || "N/A"}</td>
        </tr>
      `
      )
      .join("");
  } else {
    vaccineRows = `
      <tr>
        <td colspan="5" style="padding: 10px; text-align: center; color: #78716c; font-style: italic;">
          Sin registros clínicos adicionales en el periodo reciente.
        </td>
      </tr>
    `;
  }

  // Línea de ancestros si tiene pedigrí
  const pedigreeBlock =
    horse.pedigree && (horse.pedigree.sire || horse.pedigree.dam)
      ? `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 6px;">
        <tr>
          <td style="padding: 8px 12px; width: 50%; border-right: 1px solid #e7e5e4; vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 9pt; color: #0369a1; font-weight: bold;">♂ LÍNEA PATERNA (SIRE)</p>
            <p style="margin: 0; font-size: 11pt; font-weight: bold; color: #0f172a;">${horse.pedigree.sire || "Desconocido"}</p>
            <p style="margin: 3px 0 0 0; font-size: 8.5pt; color: #64748b;">Abuelo: ${horse.pedigree.grandSirePaternal || "—"} | Abuela: ${horse.pedigree.grandDamPaternal || "—"}</p>
          </td>
          <td style="padding: 8px 12px; width: 50%; vertical-align: top;">
            <p style="margin: 0 0 4px 0; font-size: 9pt; color: #be123c; font-weight: bold;">♀ LÍNEA MATERNA (DAM)</p>
            <p style="margin: 0; font-size: 11pt; font-weight: bold; color: #0f172a;">${horse.pedigree.dam || "Desconocida"}</p>
            <p style="margin: 3px 0 0 0; font-size: 8.5pt; color: #64748b;">Abuelo: ${horse.pedigree.grandSireMaternal || "—"} | Abuela: ${horse.pedigree.grandDamMaternal || "—"}</p>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 6px 12px; background-color: #f5f5f4; font-size: 9pt; color: #44403c; border-top: 1px solid #e7e5e4;">
            <strong>Criadero de Origen:</strong> ${horse.pedigree.breedingFarm || stableName} &nbsp;|&nbsp; 
            <strong>Libro Genealógico / Registro:</strong> ${horse.pedigree.registryNumber || horse.passportNumber || "En trámite"}
          </td>
        </tr>
      </table>
    `
      : `
      <p style="font-size: 9.5pt; color: #78716c; font-style: italic; margin-bottom: 20px;">
        Ejemplar en proceso de homologación genealógica en el libro de razas.
      </p>
    `;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Pasaporte Sanitario - ${horse.name}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          color: #1c1917;
          margin: 35px;
          line-height: 1.35;
        }
        .header {
          border-bottom: 3px double #065f46;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .brand {
          font-size: 22pt;
          font-weight: bold;
          color: #065f46;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .subtitle {
          font-size: 10.5pt;
          color: #78716c;
          margin: 3px 0 0 0;
        }
        .passport-title {
          background-color: #065f46;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13pt;
          font-weight: bold;
          margin-top: 12px;
          display: inline-block;
          letter-spacing: 0.5px;
        }
        .section-title {
          font-size: 11.5pt;
          font-weight: bold;
          color: #065f46;
          border-bottom: 1.5px solid #a7f3d0;
          padding-bottom: 4px;
          margin-top: 20px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .data-table td {
          padding: 5px 0;
          font-size: 10pt;
          vertical-align: top;
        }
        .label {
          color: #78716c;
          width: 150px;
        }
        .value {
          color: #1c1917;
          font-weight: 600;
        }
        .records-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .records-table th {
          background-color: #065f46;
          color: #ffffff;
          padding: 8px 10px;
          text-align: left;
          font-size: 9.5pt;
        }
        .records-table td {
          font-size: 9pt;
        }
        .declaration-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 9.5pt;
          color: #166534;
          margin-top: 20px;
        }
        .signatures-table {
          width: 100%;
          margin-top: 50px;
          border-collapse: collapse;
        }
        .signatures-table td {
          width: 50%;
          text-align: center;
          padding: 0 25px;
        }
        .sig-line {
          border-top: 1px solid #1c1917;
          padding-top: 6px;
          font-size: 10pt;
          font-weight: 600;
        }
        .sig-sub {
          font-size: 8.5pt;
          color: #78716c;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="brand">${stableName.toUpperCase()}</h1>
        <p class="subtitle">${tagline}</p>
        <div class="passport-title">PASAPORTE SANITARIO Y GUÍA DE TRÁNSITO EQUINO</div>
      </div>

      <div class="section-title">1. Identificación Oficial del Ejemplar</div>
      <table class="data-table">
        <tr>
          <td class="label">Nombre del Ejemplar:</td>
          <td class="value" style="font-size: 12pt; color: #065f46;">${horse.name}</td>
          <td class="label">Raza / Modalidad:</td>
          <td class="value">${horse.breed}</td>
        </tr>
        <tr>
          <td class="label">Sexo:</td>
          <td class="value" style="text-transform: capitalize;">${horse.gender}</td>
          <td class="label">Capa / Color:</td>
          <td class="value">${horse.coatColor}</td>
        </tr>
        <tr>
          <td class="label">Edad:</td>
          <td class="value">${horse.ageYears} años (${horse.birthDate || "Registrada"})</td>
          <td class="label">Pesebrera Actual:</td>
          <td class="value">${horse.pesebreraCode || "En tránsito"}</td>
        </tr>
        <tr>
          <td class="label">Microchip Electrónico:</td>
          <td class="value" style="font-family: Consolas, monospace;">${horse.microchip || "COL-982-PENDIENTE"}</td>
          <td class="label">N° Pasaporte / Chapa:</td>
          <td class="value" style="font-family: Consolas, monospace;">${horse.passportNumber || "PFC-OFICIAL"}</td>
        </tr>
      </table>

      <div class="section-title">2. Información del Propietario / Tenedor Responsable</div>
      <table class="data-table">
        <tr>
          <td class="label">Propietario Registrado:</td>
          <td class="value">${horse.ownerName}</td>
          <td class="label">C.C. / Identificación:</td>
          <td class="value">${client?.identification || "Registrado en padrón"}</td>
        </tr>
        <tr>
          <td class="label">Teléfono de Contacto:</td>
          <td class="value">${client?.phone || "No especificado"}</td>
          <td class="label">Ubicación / Finca:</td>
          <td class="value">${client?.address || "Hacienda & Pesebreras"}</td>
        </tr>
      </table>

      <div class="section-title">3. Genealogía y Registro de Criadero</div>
      ${pedigreeBlock}

      <div class="section-title">4. Esquema Sanitario, Vacunas y Desparasitación</div>
      <table class="records-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Biológico / Tratamiento</th>
            <th>Profesional / Aplicador</th>
            <th>Próximo Control</th>
          </tr>
        </thead>
        <tbody>
          ${vaccineRows}
        </tbody>
      </table>

      <div class="section-title">5. Estado de Salud y Manejo Podal (Herraje)</div>
      <table class="data-table">
        <tr>
          <td class="label">Condición Clínica:</td>
          <td class="value" style="text-transform: capitalize;">
            ${horse.healthStatus === "optimo" ? "Óptimo Estado Físico y Sanitario" : horse.healthStatus}
          </td>
          <td class="label">Último Herraje:</td>
          <td class="value">${horse.farrierControl?.lastShoeingDate || "Al día"}</td>
        </tr>
        <tr>
          <td class="label">Tipo de Herradura:</td>
          <td class="value">${horse.farrierControl?.shoeingType || "Herradura Estándar"}</td>
          <td class="label">Próximo Mantenimiento:</td>
          <td class="value">${horse.farrierControl?.nextShoeingDate || "Programado"}</td>
        </tr>
        <tr>
          <td class="label">Herrero Responsable:</td>
          <td class="value">${horse.farrierControl?.farrierName || "Maestro Herrador"}</td>
          <td class="label">Dieta / Cuidados:</td>
          <td class="value">${horse.dietNotes ? horse.dietNotes.substring(0, 50) + "..." : "Balanceada estándar"}</td>
        </tr>
      </table>

      <div class="declaration-box">
        <strong>Certificación Médico-Veterinaria:</strong> Se certifica que en la fecha de expedición del presente documento, el ejemplar <strong>${horse.name}</strong> ha sido inspeccionado clínicamente en las instalaciones de la pesebrera, encontrándose en adecuado estado fisiológico, con su plan de inmunización al día y sin signos evidentes de afecciones transmisibles o infectocontagiosas que impidan su libre tránsito o permanencia en centros de concentración equina.
      </div>

      <table class="signatures-table">
        <tr>
          <td>
            <div class="sig-line">${vetName}</div>
            <div class="sig-sub">${vetSpecialty}<br>Matrícula Profesional ${vetLicense}</div>
          </td>
          <td>
            <div class="sig-line">${horse.ownerName}</div>
            <div class="sig-sub">Propietario / Representante Legal<br>${stableName}</div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 30px; text-align: center; font-size: 8pt; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 10px;">
        Expedido por ${stableName} • Registro generado el ${new Date().toLocaleDateString("es-CO")}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const sanitized = horse.name.replace(/[^a-zA-Z0-9]/g, "_");
  a.href = url;
  a.download = `Pasaporte_Sanitario_${sanitized}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
