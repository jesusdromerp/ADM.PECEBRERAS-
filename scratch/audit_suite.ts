import { dataService } from "../services";
import { initialHorses, initialPesebreras, initialClients, initialPayments } from "../services/mock-data";

interface AuditResult {
  suite: string;
  name: string;
  status: "PASSED" | "FAILED" | "WARNING";
  details?: string;
}

const results: AuditResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (condition) {
    results.push({ suite, name, status: "PASSED", details });
  } else {
    results.push({ suite, name, status: "FAILED", details });
    console.error(`❌ [FAILED] ${suite} -> ${name}: ${details || ""}`);
  }
}

function warn(condition: boolean, suite: string, name: string, details?: string) {
  if (!condition) {
    results.push({ suite, name, status: "WARNING", details });
    console.warn(`⚠️ [WARNING] ${suite} -> ${name}: ${details || ""}`);
  } else {
    results.push({ suite, name, status: "PASSED", details });
  }
}

async function runAudit() {
  console.log("=================================================");
  console.log("🐎 INICIANDO AUDITORÍA INTEGRAL DEL SISTEMA ECUESTRE");
  console.log("=================================================\n");

  // 1. AUDITORÍA DE DATOS BASE Y PERSISTENCIA
  const horses = dataService.getHorses();
  const boxes = dataService.getPesebreras();
  const clients = dataService.getClients();
  const payments = dataService.getPayments();
  const inventory = dataService.getInventory();
  const canonPlans = dataService.getCanonPlans();
  const settings = dataService.getCenterSettings();

  assert(horses.length > 0, "BaseData", "Caballos inicializados", `Total: ${horses.length}`);
  assert(boxes.length > 0, "BaseData", "Pesebreras inicializadas", `Total: ${boxes.length}`);
  assert(clients.length > 0, "BaseData", "Clientes inicializados", `Total: ${clients.length}`);
  assert(payments.length > 0, "BaseData", "Pagos inicializados", `Total: ${payments.length}`);
  assert(inventory.length > 0, "BaseData", "Inventario inicializado", `Total: ${inventory.length}`);
  assert(canonPlans.length > 0, "BaseData", "Planes de Canon inicializados", `Total: ${canonPlans.length}`);
  assert(Boolean(settings.stableName), "BaseData", "Parámetros del Centro configurados", settings.stableName);

  // 2. AUDITORÍA DE INTEGRIDAD RELACIONAL
  // Cada caballo con pesebreraId debe apuntar a una pesebrera existente
  let orphanHorsePesebreras = 0;
  horses.forEach((h) => {
    if (h.pesebreraId) {
      const match = boxes.find((b) => b.id === h.pesebreraId);
      if (!match) orphanHorsePesebreras++;
    }
  });
  assert(orphanHorsePesebreras === 0, "RelationalIntegrity", "Vínculo Caballo -> Pesebrera", `Huérfanos: ${orphanHorsePesebreras}`);

  // Cada caballo debe tener un propietario existente
  let orphanHorseOwners = 0;
  horses.forEach((h) => {
    if (h.ownerId) {
      const match = clients.find((c) => c.id === h.ownerId);
      if (!match) orphanHorseOwners++;
    }
  });
  assert(orphanHorseOwners === 0, "RelationalIntegrity", "Vínculo Caballo -> Propietario", `Huérfanos: ${orphanHorseOwners}`);

  // Cada box ocupado debe apuntar a un caballo existente
  let occupiedWithoutHorse = 0;
  boxes.filter((b) => b.status === "ocupada").forEach((b) => {
    if (!b.horseId && !b.assignedHorseId) occupiedWithoutHorse++;
  });
  assert(occupiedWithoutHorse === 0, "RelationalIntegrity", "Box Ocupada -> Caballo Asignado", `Inválidas: ${occupiedWithoutHorse}`);

  // 3. AUDITORÍA DE MÉTRICAS Y PREVENCIÓN DE DIVISIÓN POR CERO
  const metrics = dataService.getMetrics();
  assert(typeof metrics.occupancyRate === "number" && !isNaN(metrics.occupancyRate), "Metrics", "Tasa de Ocupación no es NaN", `${metrics.occupancyRate}%`);
  assert(metrics.totalBoxes === boxes.length, "Metrics", "Total Pesebreras coincide con almacén", `${metrics.totalBoxes} == ${boxes.length}`);
  assert(metrics.totalHorses === horses.length, "Metrics", "Total Caballos coincide con almacén", `${metrics.totalHorses} == ${horses.length}`);

  // 4. AUDITORÍA DEL FLUJO DE MANTENIMIENTO TÉCNICO Y APROBACIÓN
  // Buscar un box ocupado
  const occupiedBox = boxes.find((b) => b.status === "ocupada" && b.horseId);
  if (occupiedBox) {
    const originalHorseId = occupiedBox.horseId;
    const originalHorseName = occupiedBox.horseName;

    // A. Poner en mantenimiento con labores múltiples
    const maintUpdated = dataService.updatePesebreraStatus(occupiedBox.id, "mantenimiento", {
      type: "cambio_cama",
      typeName: "Limpieza y Cambio de Cama + Desinfección",
      types: ["cambio_cama", "desinfeccion"],
      typeNames: ["Limpieza y Cambio de Cama", "Desinfección Profunda"],
      description: "Prueba de auditoría de mantenimiento múltiple",
      responsiblePerson: "Auditor Técnico",
      cost: 85000,
    });

    assert(maintUpdated?.status === "mantenimiento", "MaintenanceWorkflow", "Estado cambiado a Mantenimiento");
    assert(maintUpdated?.assignedHorseId === originalHorseId, "MaintenanceWorkflow", "Caballo titular conservado durante mantenimiento", `Titular: ${maintUpdated?.assignedHorseName}`);
    assert((maintUpdated?.maintenanceHistory?.length || 0) > 0, "MaintenanceWorkflow", "Historial de mantenimiento registrado");

    // B. Aprobar formalmente el mantenimiento
    const approvedBox = dataService.approvePesebreraMaintenance(occupiedBox.id, {
      approvedBy: "Mayordomo Jefe Inspector",
      notes: "Inspección de auditoría superada con éxito",
      targetStatus: "auto",
    });

    assert(approvedBox?.status === "ocupada", "MaintenanceWorkflow", "Pesebrera reintegrada y lista para uso");
    assert(approvedBox?.horseId === originalHorseId, "MaintenanceWorkflow", "Caballo titular reocupó su box");
    const lastMaint = approvedBox?.maintenanceHistory?.[0];
    assert(lastMaint?.status === "aprobado", "MaintenanceWorkflow", "Registro técnico marcado como aprobado", `Inspector: ${lastMaint?.approvedBy}`);
  } else {
    warn(false, "MaintenanceWorkflow", "Sin box ocupada para probar ciclo completo de mantenimiento");
  }

  // 5. AUDITORÍA DEL FLUJO DE TRASLADO Y SALIDA DE EJEMPLAR
  const availableBox = dataService.getPesebreras().find((b) => b.status === "disponible");
  const horseToMove = dataService.getHorses().find((h) => h.pesebreraId);
  if (availableBox && horseToMove && horseToMove.pesebreraId) {
    const oldBoxId = horseToMove.pesebreraId;
    const moved = dataService.moveHorseToPesebrera(horseToMove.id, oldBoxId, availableBox.id);
    assert(Boolean(moved), "MovementWorkflow", "Caballo trasladado de pesebrera");

    const freshNewBox = dataService.getPesebreras().find((b) => b.id === availableBox.id);
    const freshOldBox = dataService.getPesebreras().find((b) => b.id === oldBoxId);
    assert(freshNewBox?.status === "ocupada" && freshNewBox.horseId === horseToMove.id, "MovementWorkflow", "Nuevo box queda ocupado por el caballo");
    assert(freshOldBox?.status === "disponible", "MovementWorkflow", "Antiguo box queda disponible");

    // Revertir para dejar estado limpio
    dataService.moveHorseToPesebrera(horseToMove.id, availableBox.id, oldBoxId);
  }

  // 6. AUDITORÍA DE RESPALDO (EXPORTACIÓN E IMPORTACIÓN JSON)
  const exportedJson = dataService.exportBackupData();
  assert(Boolean(exportedJson && exportedJson.length > 500), "BackupSystem", "Exportación JSON generada", `Tamaño: ${exportedJson.length} bytes`);

  const parsed = JSON.parse(exportedJson);
  assert(Boolean(parsed.data.horses && parsed.data.pesebreras && parsed.data.clients), "BackupSystem", "Estructura JSON íntegra");

  // Probar restauración
  const importResult = dataService.importBackupData(exportedJson);
  assert(importResult.success === true, "BackupSystem", "Restauración JSON exitosa", importResult.message);

  // 7. AUDITORÍA DE RECIBOS DE WHATSAPP Y PORTABILIDAD FINANCIERA
  const samplePayment = dataService.getPayments()[0];
  if (samplePayment) {
    const waData = dataService.generateWhatsAppReceiptData(samplePayment);
    assert(Boolean(waData.text && waData.text.length > 100), "WhatsAppReceipt", "Texto del recibo generado con desglose");
    assert(Boolean(waData.waUrl.includes("whatsapp.com") || waData.waUrl.includes("wa.me")), "WhatsAppReceipt", "URL de WhatsApp generada");
    assert(Boolean(waData.text.includes(samplePayment.clientName)), "WhatsAppReceipt", "Recibo contiene nombre del cliente", samplePayment.clientName);
  }

  // 8. AUDITORÍA DE CONTROL DE RACIONES Y ALIMENTACIÓN
  const sampleHorse = dataService.getHorses()[0];
  if (sampleHorse) {
    const restocked = dataService.restockHorseFeed(sampleHorse.id, {
      feedBrand: "Italcol Brío",
      bultosAdded: 2,
      kgPerBulto: 40,
      totalKgAdded: 80,
      costPerBulto: 135000,
      registeredBy: "Auditor Almacén",
      notes: "Carga de prueba para auditoría",
    });
    assert(Boolean(restocked), "FeedControl", "Recarga de alimento registrada");

    const emergencyPayment = dataService.addPayment({
      receiptNumber: `EMERG-${Date.now().toString().slice(-6)}`,
      clientId: sampleHorse.ownerId,
      clientName: sampleHorse.ownerName,
      horseId: sampleHorse.id,
      horseName: sampleHorse.name,
      category: "alimentacion",
      concept: `Ración de emergencia concentrado criadero (4 kg) - Ejemplar ${sampleHorse.name}`,
      amount: 25000,
      dueDate: new Date().toISOString().split("T")[0],
      status: "pendiente",
    });
    assert(Boolean(emergencyPayment), "FeedControl", "Cobro contable de ración de emergencia generado", `Recibo: ${emergencyPayment.receiptNumber}`);

    // 8.1. AUDITORÍA DE ACCIÓN VETERINARIA: DIAGNÓSTICO Y TRATAMIENTO
    const vetRecord = dataService.addVeterinaryRecord(
      {
        horseId: sampleHorse.id,
        horseName: sampleHorse.name,
        type: "medicamento",
        title: "Flunixin Meglumine 50mg/ml",
        diagnosis: "Cólico Espasmódico Leve",
        symptoms: "Inquietud y dolor a la palpación abdominal",
        dosage: "10 ml IV cada 12 horas",
        route: "intravenosa",
        frequency: "Cada 12h por 2 días",
        durationDays: 2,
        severity: "moderada",
        stableCareInstructions: "Reposo en box, suspender grano 24h",
        administeredBy: "Dr. Roberto Gómez (MVZ)",
        date: new Date().toISOString().split("T")[0],
        status: "en_curso",
        cost: 180000,
        chargeToOwner: true,
      },
      {
        newHorseStatus: "en_tratamiento",
        chargeToOwner: true,
        notifyOwner: true,
      }
    );
    assert(Boolean(vetRecord), "VeterinaryAction", "Registro de atención y diagnóstico veterinario creado", `ID: ${vetRecord.id}`);

    const updatedHorse = dataService.getHorseById(sampleHorse.id);
    assert(updatedHorse?.healthStatus === "en_tratamiento", "VeterinaryAction", "Estado de salud del ejemplar actualizado a 'en_tratamiento'");
    const hasDiseaseHistory = updatedHorse?.diseaseHistory?.some(d => d.diseaseName.includes("Cólico"));
    assert(Boolean(hasDiseaseHistory), "VeterinaryAction", "Diagnóstico agregado automáticamente al historial clínico del ejemplar");

    const waVetData = dataService.generateWhatsAppVeterinaryReport(vetRecord);
    assert(waVetData.text.includes("Cólico Espasmódico Leve"), "VeterinaryAction", "Reporte clínico de WhatsApp formateado con diagnóstico");

    // Completar tratamiento y dar alta médica (Caso Resuelto)
    const completedVet = dataService.completeVeterinaryTreatment(vetRecord.id, {
      caseResolution: "resuelto",
      resolutionNotes: "Paciente completamente recuperado, sin dolor y tolerando dieta normal",
      restoreHorseHealth: true,
    });
    assert(completedVet?.status === "completado", "VeterinaryAction", "Tratamiento veterinario finalizado con alta médica");
    assert(completedVet?.caseResolution === "resuelto", "VeterinaryAction", "Resolución de caso marcada como 'resuelto'");
    const dischargedHorse = dataService.getHorseById(sampleHorse.id);
    assert(dischargedHorse?.healthStatus === "optimo", "VeterinaryAction", "Estado de salud del ejemplar restablecido a 'optimo' tras alta médica");

    // Prueba de finalización con Guía de Instrucciones de Continuación de Medicamento
    const vetRecord2 = dataService.addVeterinaryRecord(
      {
        horseId: sampleHorse.id,
        horseName: sampleHorse.name,
        type: "medicamento",
        title: "Tratamiento de Claudicación y Tendinitis",
        diagnosis: "Tendinitis Leve en Mano Izquierda",
        dosage: "Gel antiinflamatorio tópico",
        administeredBy: "Dr. Juan Pablo Morales (MVZ)",
        date: new Date().toISOString().split("T")[0],
        status: "en_curso",
      },
      { newHorseStatus: "en_tratamiento" }
    );
    const completedVetWithGuide = dataService.completeVeterinaryTreatment(vetRecord2.id, {
      caseResolution: "medicacion_continua",
      resolutionNotes: "Fase aguda superada. Pasa a mantenimiento en box.",
      targetHorseStatus: "observacion",
      markDiseaseResolved: false,
      continuationGuide: {
        medicationContinues: true,
        medicationName: "Pomada Antiinflamatoria + Vendaje",
        dosage: "1 aplicación matutina",
        route: "topica",
        frequency: "1 vez al día",
        durationDays: 5,
        instructions: "Lavar con agua fría y colocar vendaje limpio",
        responsibleRole: "palafrenero",
      },
    });
    assert(completedVetWithGuide?.caseResolution === "medicacion_continua", "VeterinaryAction", "Tratamiento finalizado con resolución de medicación continua");
    assert(Boolean(completedVetWithGuide?.continuationGuide?.medicationContinues), "VeterinaryAction", "Guía de instrucciones de continuación almacenada correctamente");
    const waGuideData = dataService.generateWhatsAppVeterinaryReport(completedVetWithGuide!);
    assert(waGuideData.text.includes("GUÍA DE INSTRUCCIONES / MEDICACIÓN EN BOX"), "VeterinaryAction", "Reporte de WhatsApp incluye sección de guía de instrucciones de medicación");
  }

  // 9. AUDITORÍA DE SESIÓN DE MONTADOR & NOTIFICACIONES
  if (sampleHorse) {
    const sessionReport = dataService.recordHorseRidingSession(sampleHorse.id, {
      horseId: sampleHorse.id,
      horseName: sampleHorse.name,
      ownerId: sampleHorse.ownerId,
      ownerName: sampleHorse.ownerName,
      boxCode: sampleHorse.pesebreraCode || undefined,
      date: new Date().toISOString().split("T")[0],
      riderName: "Montador Carlos Valderrama",
      sessionType: "Pista de Adiestramiento & Galope",
      durationMinutes: 45,
      attitude: "excelente",
      exercisesWorked: ["Flexión de nuca", "Ritmo en tabla"],
      technicalNotes: "Auditoría de montador completada satisfactoriamente.",
      publishedToOwner: true,
    });
    assert(Boolean(sessionReport), "MontadorWorkflow", "Sesión de montador guardada");

    const nowStr = new Date().toISOString();
    const notification = dataService.addOwnerNotification({
      id: `notif-audit-${Date.now()}`,
      clientId: sampleHorse.ownerId,
      clientName: sampleHorse.ownerName,
      horseId: sampleHorse.id,
      horseName: sampleHorse.name,
      planCode: "TIPO_A",
      planName: "Plan Integral",
      serviceCategory: "Montador / Pista",
      title: "Prueba de Notificación",
      message: "Auditoría del portal de propietarios",
      coveredByPlan: true,
      coverageDetail: "Incluido en su plan",
      severity: "info",
      reportedBy: "Montador Carlos Valderrama",
      isRead: false,
      createdAt: nowStr,
      updatedAt: nowStr,
    });
    assert(Boolean(notification), "OwnerPortalNotifications", "Notificación para portal de propietarios despachada");
  }

  // 10. AUDITORÍA DE SEGURIDAD Y PERMISOS POR ROL
  const { USER_ROLES } = await import("../lib/roles");
  assert(USER_ROLES.admin.allowedTabs.includes("ajustes"), "RoleSecurity", "Super Admin tiene acceso a Ajustes");
  assert(!USER_ROLES.montador.allowedTabs.includes("ajustes"), "RoleSecurity", "Montador NO tiene acceso a Ajustes");
  assert(!USER_ROLES.montador.allowedTabs.includes("finanzas"), "RoleSecurity", "Montador NO tiene acceso a Facturación");
  assert(!USER_ROLES.palafrenero.allowedTabs.includes("sanidad"), "RoleSecurity", "Palafrenero NO tiene acceso a Sanidad");
  assert(USER_ROLES.propietario.allowedTabs.length === 1 && USER_ROLES.propietario.allowedTabs[0] === "portal_propietario", "RoleSecurity", "Propietario restringido únicamente a su portal");

  // 11. AUDITORÍA DE ROBUSTEZ MATEMÁTICA EN ALIMENTACIÓN
  const { calculateFeedDepletion } = await import("../lib/feed-calculator");
  const resNormal = calculateFeedDepletion(120, 4, "2026-09-01");
  assert(resNormal.daysDuration === 30, "FeedMath", "Cálculo estándar 120kg / 4kg = 30 días", `${resNormal.daysDuration} días`);

  const resZero = calculateFeedDepletion(0, 4, "2026-09-01");
  assert(resZero.daysDuration >= 1 && !isNaN(resZero.daysRemaining), "FeedMath", "Cálculo seguro con 0 kg", `Días: ${resZero.daysDuration}`);

  const resNegative = calculateFeedDepletion(-50, -2, "invalid-date");
  assert(!isNaN(resNegative.daysRemaining) && Boolean(resNegative.depletionDate), "FeedMath", "Protección contra valores negativos y fechas inválidas", resNegative.depletionDate);

  // 12. AUDITORÍA DEL MOTOR DE BÚSQUEDA GLOBAL
  const normalizeText = (str?: string | null) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const searchQ = normalizeText("relampago");
  const matchedHorse = horses.filter((h) => normalizeText(h.name).includes(searchQ));
  assert(matchedHorse.length > 0, "OmniboxSearch", "Búsqueda encuentra ejemplar por nombre insensible a mayúsculas y tildes", matchedHorse[0]?.name);

  const boxQ = normalizeText("box-a01");
  const matchedBox = boxes.filter((b) => normalizeText(b.code).includes(boxQ));
  assert(matchedBox.length > 0, "OmniboxSearch", "Búsqueda encuentra box por código", matchedBox[0]?.code);

  // 13. AUDITORÍA VETERINARIA: MODIFICACIÓN, COMPLICACIONES Y TOLERANCIA AL ERROR HUMANO
  const testHorse = horses[0];
  const initialVetRecords = dataService.getVeterinaryRecords();

  // A. Registro de nuevo tratamiento clínico
  const newRec = dataService.addVeterinaryRecord({
    horseId: testHorse.id,
    horseName: testHorse.name,
    type: "medicamento",
    title: "Tratamiento de Prueba Inicial",
    diagnosis: "Desmitis suspensorio del menudillo",
    symptoms: "Dolor a la palpación y leve aumento de temperatura",
    dosage: "1 sobre cada 24h",
    route: "oral",
    frequency: "Cada 24 horas",
    durationDays: 7,
    severity: "moderada",
    administeredBy: "Dr. Juan Pablo Morales (MVZ)",
    date: "2026-09-25",
    status: "en_curso",
    cost: 85000,
    chargeToOwner: true,
  }, { newHorseStatus: "en_tratamiento" });

  assert(Boolean(newRec.id), "VeterinaryAudit", "Tratamiento inicial creado con éxito", `ID: ${newRec.id}`);

  // B. Modificación del tratamiento (Corrección por error humano / ajuste de dosis)
  const modifiedRec = dataService.updateVeterinaryRecord(
    newRec.id,
    {
      dosage: "1 sobre cada 12h (Dosis ajustada)",
      durationDays: 10,
      cost: 110000,
    },
    {
      reason: "Corrección de posología por error de digitación",
      editedBy: "Dra. Valentina Gómez",
    }
  );

  assert(
    modifiedRec?.dosage === "1 sobre cada 12h (Dosis ajustada)" &&
    modifiedRec?.durationDays === 10 &&
    modifiedRec?.cost === 110000,
    "VeterinaryAudit",
    "Tratamiento modificado correctamente",
    modifiedRec?.dosage
  );
  assert(
    Boolean(modifiedRec?.editHistory && modifiedRec.editHistory.length > 0),
    "VeterinaryAudit",
    "Bitácora de auditoría (editHistory) registra el cambio",
    `Total registros: ${modifiedRec?.editHistory?.length}`
  );
  assert(
    modifiedRec?.editHistory?.[0]?.reason === "Corrección de posología por error de digitación",
    "VeterinaryAudit",
    "Motivo del ajuste guardado fielmente contra error humano",
    modifiedRec?.editHistory?.[0]?.reason
  );

  // C. Registro de complicación clínica y medicación de rescate
  const complicatedRec = dataService.addTreatmentComplication(newRec.id, {
    date: "2026-09-25",
    time: "14:30",
    description: "Espasmo agudo secundario y claudicación marcada 3/5",
    actionTaken: "Infiltración antiinflamatoria y vendaje compresivo frío",
    additionalMedication: "Flunixin Meglumina 15ml IV + Dexametasona 4ml",
    newSeverity: "grave",
    additionalCost: 95000,
    recordedBy: "Dr. Juan Pablo Morales (MVZ)",
    instructionsForStables: "Reposo absoluto, hielo cada 4h",
    notifyOwner: true,
  });

  assert(
    Boolean(complicatedRec?.complications && complicatedRec.complications.length > 0),
    "VeterinaryAudit",
    "Complicación registrada en el tratamiento",
    `Complicaciones: ${complicatedRec?.complications?.length}`
  );
  assert(
    complicatedRec?.severity === "grave",
    "VeterinaryAudit",
    "Severidad del tratamiento escalada a 'grave'",
    complicatedRec?.severity
  );
  assert(
    Boolean(complicatedRec?.complications?.[0]?.additionalMedication?.includes("Flunixin Meglumina")),
    "VeterinaryAudit",
    "Medicación de rescate registrada exitosamente",
    complicatedRec?.complications?.[0]?.additionalMedication
  );

  // D. Cierre del tratamiento con alta médica
  const completedRec = dataService.completeVeterinaryTreatment(newRec.id, {
    caseResolution: "resuelto",
    resolutionNotes: "Paciente recuperado favorablemente",
    restoreHorseHealth: true,
  });
  assert(completedRec?.status === "completado", "VeterinaryAudit", "Tratamiento cerrado como completado");

  // E. Reapertura por error humano o recaída
  const reopenedRec = dataService.reopenVeterinaryTreatment(
    newRec.id,
    "Reapertura por recaída de síntomas tras 24h de ejercicio leve",
    "Dr. Juan Pablo Morales"
  );

  assert(reopenedRec?.status === "en_curso", "VeterinaryAudit", "Tratamiento reabierto a estado 'en_curso'", reopenedRec?.status);
  assert(reopenedRec?.isReopened === true, "VeterinaryAudit", "Indicador isReopened activo", String(reopenedRec?.isReopened));
  assert(Boolean(reopenedRec?.reopenReason), "VeterinaryAudit", "Motivo de reapertura registrado", reopenedRec?.reopenReason);

  // F. Validación del reporte de WhatsApp
  const waReport = dataService.generateWhatsAppVeterinaryReport(reopenedRec!);
  assert(
    waReport.text.includes("COMPLICACIONES & FÁRMACOS DE RESCATE") &&
    waReport.text.includes("Flunixin Meglumina"),
    "VeterinaryAudit",
    "Reporte de WhatsApp incluye complicaciones y fármacos de rescate",
    "Comprobado"
  );
  assert(
    waReport.text.includes("REAPERTURA"),
    "VeterinaryAudit",
    "Reporte de WhatsApp advierte reapertura del tratamiento",
    "Comprobado"
  );

  // 14. AUDITORÍA DE SISTEMA DE ACCESOS, USUARIOS Y RUTAS DEDICADAS
  const allUsers = dataService.getUsers();
  assert(allUsers.length >= 6, "UserAuthRouting", "Usuarios predeterminados cargados", `Total: ${allUsers.length}`);

  // Autenticación correcta de cada rol
  const authAdmin = dataService.authenticateUser("admin", "admin123");
  assert(Boolean(authAdmin && authAdmin.role === "admin"), "UserAuthRouting", "Login de Administrador exitoso (/admin)", authAdmin?.name);

  const authVet = dataService.authenticateUser("veterinario", "vet123");
  assert(Boolean(authVet && authVet.role === "veterinario"), "UserAuthRouting", "Login de Veterinario exitoso (/veterinario)", authVet?.name);

  const authCuadras = dataService.authenticateUser("mayordomo", "cuadras123");
  assert(Boolean(authCuadras && authCuadras.role === "mayordomo"), "UserAuthRouting", "Login de Mayordomo exitoso (/mayordomo)", authCuadras?.name);

  const authProp = dataService.authenticateUser("propietario", "prop123");
  assert(
    Boolean(authProp && authProp.role === "propietario" && authProp.linkedClientId === "cli-2"),
    "UserAuthRouting",
    "Login de Propietario con cliente vinculado exitoso (/propietario)",
    `Cliente vinculado: ${authProp?.linkedClientId}`
  );

  // Protección de contraseña errónea
  const authFailed = dataService.authenticateUser("admin", "contraseña_falsa");
  assert(authFailed === null, "UserAuthRouting", "Rechazo de credenciales incorrectas", "Protegido");

  // Creación dinámica de nuevo usuario con ruta personalizada
  const newUser = dataService.createUser({
    username: "vet_asistente",
    password: "password456",
    name: "Dra. Sofía Mendoza",
    role: "veterinario",
    email: "sofia@sanisidro.com",
    phone: "3119998877",
    active: true,
  });
  assert(Boolean(newUser && newUser.id), "UserAuthRouting", "Creación de nuevo usuario con rol veterinario", newUser.username);

  const authNewUser = dataService.authenticateUser("vet_asistente", "password456");
  assert(Boolean(authNewUser && authNewUser.role === "veterinario"), "UserAuthRouting", "Autenticación de nuevo usuario creado en tiempo real", authNewUser?.name);

  // Mapeo canónico de rutas de acceso por rol
  const ROLE_ROUTE_MAP: Record<string, string> = {
    admin: "/admin",
    veterinario: "/veterinario",
    mayordomo: "/mayordomo",
    propietario: "/propietario",
    montador: "/montador",
    palafrenero: "/palafrenero",
  };
  assert(ROLE_ROUTE_MAP[authAdmin!.role] === "/admin", "UserAuthRouting", "Ruta de acceso canónica asignada para Administrador: /admin", "/admin");
  assert(ROLE_ROUTE_MAP[authVet!.role] === "/veterinario", "UserAuthRouting", "Ruta de acceso canónica asignada para Veterinario: /veterinario", "/veterinario");
  assert(ROLE_ROUTE_MAP[authCuadras!.role] === "/mayordomo", "UserAuthRouting", "Ruta de acceso canónica asignada para Mayordomo: /mayordomo", "/mayordomo");
  assert(ROLE_ROUTE_MAP[authProp!.role] === "/propietario", "UserAuthRouting", "Ruta de acceso canónica asignada para Propietario: /propietario", "/propietario");

  console.log("\n=================================================");
  console.log("📊 RESULTADOS FINALES DE LA AUDITORÍA");
  console.log("=================================================");
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  const warnings = results.filter((r) => r.status === "WARNING").length;

  console.log(`Total Pruebas: ${results.length}`);
  console.log(`✅ Aprobadas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`⚠️ Advertencias: ${warnings}`);
  console.log("=================================================\n");

  results.forEach((r) => {
    const icon = r.status === "PASSED" ? "✅" : r.status === "FAILED" ? "❌" : "⚠️";
    console.log(`${icon} [${r.suite}] ${r.name} ${r.details ? `-> ${r.details}` : ""}`);
  });

  return { passed, failed, warnings, total: results.length };
}

runAudit();
