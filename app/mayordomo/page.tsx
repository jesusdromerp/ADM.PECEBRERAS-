"use client";

import React from "react";
import { PortalDashboard } from "@/components/dashboard/PortalDashboard";

export default function MayordomoPage() {
  return <PortalDashboard enforcedRole="mayordomo" defaultTab="pesebreras" />;
}
