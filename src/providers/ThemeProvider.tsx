// src/providers/ThemeProvider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

// src/components/ThemeToggle.tsx
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.button
      className="relative w-14 h-7 bg-gray-700 dark:bg-gray-800 rounded-full p-1 transition-colors"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
        animate={{
          x: theme === 'dark' ? 0 : 28,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        <motion.div
          animate={{ rotate: theme === 'dark' ? 0 : 360 }}
          transition={{ duration: 0.3 }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

// src/app/layout.tsx actualizado
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍣</text></svg>"
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// Actualización de globals.css para temas
export const themeStyles = `
/* Variables para Light Mode */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --card-bg: #ffffff;
  --card-hover: #f3f4f6;
}

/* Variables para Dark Mode */
.dark {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --text-primary: #ffffff;
  --text-secondary: #9ca3af;
  --border-color: rgba(255,255,255,0.08);
  --card-bg: #111111;
  --card-hover: #1f1f1f;
}

/* Aplicar variables */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.glass-card {
  background: var(--card-bg);
  border-color: var(--border-color);
}

.glass-card:hover {
  background: var(--card-hover);
}

/* Smooth transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
`;