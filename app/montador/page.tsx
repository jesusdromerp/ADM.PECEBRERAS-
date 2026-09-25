"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function MontadorPage() {
  return <PortalDashboard enforcedRole="montador" defaultTab="operativo_montador" />;
}
