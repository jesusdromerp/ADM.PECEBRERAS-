import { PaymentRecord, Client, CenterSettings } from "@/types";

/**
 * Genera y descarga un documento compatible con Microsoft Word (.doc)
 * con diseño profesional ecuestre, tablas estructuradas y datos de cobro.
 */
export function downloadWordReceipt(
  payment: PaymentRecord,
  client?: Client | null,
  centerSettings?: CenterSettings
) {
  const stableName = centerSettings?.stableName || "Hacienda & Pesebreras";
  const tagline = centerSettings?.tagline || "Centro Ecuestre y Cuidado Integral de Ejemplares";
  const bankDetails =
    payment.bankDetails ||
    centerSettings?.bankDetails ||
    "Bancolombia Cuenta de Ahorros # 108-928374-12 a nombre de Hacienda & Pesebreras SAS (NIT: 901.482.110-3)";

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statusLabel =
    payment.status === "pagado"
      ? `<span style="color: #15803d; font-weight: bold;">PAGADO (${payment.paymentDate || "Al día"})</span>`
      : payment.status === "vencido"
      ? `<span style="color: #b91c1c; font-weight: bold;">VENCIDO</span>`
      : `<span style="color: #b45309; font-weight: bold;">PENDIENTE DE PAGO</span>`;

  let itemsRows = "";
  if (payment.items && payment.items.length > 0) {
    itemsRows = payment.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4;">${it.concept}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: right; font-weight: 600;">${formatCOP(it.amount)}</td>
        </tr>
      `
      )
      .join("");
  } else {
    itemsRows = `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4;">${payment.concept}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e7e5e4; text-align: right; font-weight: 600;">${formatCOP(payment.amount)}</td>
      </tr>
    `;
  }

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Recibo ${payment.receiptNumber} - ${payment.clientName}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          color: #1c1917;
          margin: 40px;
          line-height: 1.4;
        }
        .header {
          border-bottom: 3px solid #065f46;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 22pt;
          font-weight: bold;
          color: #065f46;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .subtitle {
          font-size: 11pt;
          color: #78716c;
          margin: 4px 0 0 0;
        }
        .receipt-badge {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12pt;
          font-weight: bold;
          display: inline-block;
          margin-top: 8px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .info-table td {
          padding: 5px 0;
          font-size: 10.5pt;
          vertical-align: top;
        }
        .label {
          color: #78716c;
          width: 140px;
        }
        .value {
          color: #1c1917;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .items-table th {
          background-color: #065f46;
          color: #ffffff;
          padding: 10px 12px;
          text-align: left;
          font-size: 10.5pt;
        }
        .total-container {
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          text-align: right;
        }
        .total-title {
          font-size: 11pt;
          color: #78716c;
          margin: 0;
        }
        .total-val {
          font-size: 20pt;
          font-weight: bold;
          color: #065f46;
          margin: 4px 0 0 0;
        }
        .bank-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 30px;
          font-size: 10pt;
        }
        .bank-title {
          font-weight: bold;
          color: #166534;
          margin: 0 0 5px 0;
        }
        .signatures {
          width: 100%;
          margin-top: 60px;
          border-collapse: collapse;
        }
        .signatures td {
          width: 50%;
          text-align: center;
          padding: 0 20px;
        }
        .sig-line {
          border-top: 1px solid #1c1917;
          padding-top: 6px;
          font-size: 10pt;
          font-weight: 600;
        }
        .sig-sub {
          font-size: 9pt;
          color: #78716c;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 8.5pt;
          color: #a8a29e;
          border-top: 1px solid #e7e5e4;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="brand">${stableName.toUpperCase()}</h1>
        <p class="subtitle">${tagline}</p>
        <div class="receipt-badge">ESTADO DE CUENTA / RECIBO: ${payment.receiptNumber}</div>
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Propietario / Cliente:</td>
          <td class="value">${payment.clientName}</td>
          <td class="label">Fecha Emisión:</td>
          <td class="value">${payment.createdAt ? payment.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]}</td>
        </tr>
        <tr>
          <td class="label">Documento / ID:</td>
          <td class="value">${client?.identification || "Registrado en sistema"}</td>
          <td class="label">Fecha Límite:</td>
          <td class="value">${payment.dueDate}</td>
        </tr>
        <tr>
          <td class="label">Teléfono:</td>
          <td class="value">${payment.clientPhone || client?.phone || "No registrado"}</td>
          <td class="label">Estado Actual:</td>
          <td class="value">${statusLabel}</td>
        </tr>
        <tr>
          <td class="label">Pesebrera Asignada:</td>
          <td class="value">${payment.pesebreraCode || "General"}</td>
          <td class="label">Ejemplar:</td>
          <td class="value">${payment.horseName || "Servicios Varios"}</td>
        </tr>
      </table>

      <h3 style="font-size: 12pt; color: #1c1917; margin-bottom: 8px;">Detalle de Liquidación de Servicios</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Concepto / Descripción</th>
            <th style="text-align: right; width: 140px;">Valor (COP)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="total-container">
        <p class="total-title">TOTAL A CANCELAR</p>
        <p class="total-val">${formatCOP(payment.amount)}</p>
      </div>

      <div class="bank-box">
        <p class="bank-title">Canales de Pago Autorizados:</p>
        <p style="margin: 0; color: #166534;">
          ${bankDetails}
        </p>
        <p style="margin: 6px 0 0 0; font-size: 9pt; color: #4b5563;">
          Favor remitir el soporte de consignación o transferencia al WhatsApp administrativo para validar la aplicación del pago.
        </p>
      </div>

      <table class="signatures">
        <tr>
          <td>
            <div class="sig-line">Administración / Mayordomía</div>
            <div class="sig-sub">${stableName}</div>
          </td>
          <td>
            <div class="sig-line">${payment.clientName}</div>
            <div class="sig-sub">Firma de Recibido y Conformidad</div>
          </td>
        </tr>
      </table>

      <div class="footer">
        Este documento es un comprobante administrativo emitido por ${stableName}.
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  const sanitizedClient = payment.clientName.replace(/[^a-zA-Z0-9]/g, "_");
  downloadLink.href = url;
  downloadLink.download = `Recibo_${payment.receiptNumber}_${sanitizedClient}.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
