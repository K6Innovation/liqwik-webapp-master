"use client";

import { SessionProvider } from "next-auth/react";
import AppContainer from "./app-container";
import AppBar from "./app-bar";

export default function AuthContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppBar />
      <AppContainer>{children}</AppContainer>
    </SessionProvider>
  );
}
