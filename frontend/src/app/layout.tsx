import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/dashboard/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Project Intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${inter.className} bg-[#0b0f19] text-white font-sans`}>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>

      </body>

    </html>
  );
}