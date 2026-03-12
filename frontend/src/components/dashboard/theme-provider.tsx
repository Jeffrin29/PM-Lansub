"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";

type Props = ThemeProviderProps & {
  children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}