/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilitar features experimentales si es necesario
  },
  images: {
    domains: [
      // Agregar dominios permitidos para imágenes
      'localhost',
      // Agregar aquí los dominios donde estarán las imágenes de productos
    ],
  },
  // Configuración para variables de entorno
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig