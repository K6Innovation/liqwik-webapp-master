"use client";

import { SessionProvider } from "next-auth/react";
import AppContainer from "./app-container";
import AppBar from "./app-bar";
import ResponsiveBar from "./responsive-bar";

export default function AuthContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ResponsiveBar />
      <AppContainer>{children}</AppContainer>
    </SessionProvider>
  );
}
