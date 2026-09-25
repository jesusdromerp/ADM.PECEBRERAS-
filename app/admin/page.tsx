"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function AdminPage() {
  return <PortalDashboard enforcedRole="admin" defaultTab="resumen" />;
}
