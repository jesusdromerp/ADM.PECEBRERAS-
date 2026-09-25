"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function PropietarioPage() {
  return <PortalDashboard enforcedRole="propietario" defaultTab="portal_propietario" />;
}
