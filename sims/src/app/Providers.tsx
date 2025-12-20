"use client";

import React from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "../lib/convex";
import { AuthProvider } from "../contexts/AuthContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexProvider>
  );
}
