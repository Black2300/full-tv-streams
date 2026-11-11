import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Full TV Streams - Filmes, Séries e TV ao Vivo",
  description:
    "Assista a canais de TV ao vivo, filmes de sucesso e séries completas diretamente no seu navegador com a melhor qualidade e sem travamentos.",
  keywords: ["IPTV", "TV ao Vivo", "Filmes Online", "Séries", "Streaming", "HLS Player"],
  authors: [{ name: "Full TV Streams" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-red-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
