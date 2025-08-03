import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sushi Express - Delivery de Sushi Fresco",
  description: "Los mejores sabores japoneses directo a tu mesa. Sushi fresco, ingredientes de calidad y entrega rápida.",
  keywords: "sushi, delivery, comida japonesa, rolls, sashimi, nigiri, pedidos online",
  authors: [{ name: "Sushi Express" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ef4444',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍣</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}