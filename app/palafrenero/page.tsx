"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function PalafreneroPage() {
  return <PortalDashboard enforcedRole="palafrenero" defaultTab="operativo_montador" />;
}
