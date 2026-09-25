"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function VeterinarioPage() {
  return <PortalDashboard enforcedRole="veterinario" defaultTab="sanidad" />;
}
