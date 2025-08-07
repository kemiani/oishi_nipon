La base de datos se creo y configuro de la siguiente manera:

-- supabase/seed.sql

-- Insertar configuración inicial del restaurante
INSERT INTO restaurant_settings (
  name,
  phone,
  whatsapp_number,
  address,
  delivery_cost,
  is_delivery_free,
  opening_hours,
  is_open,
  social_media
) VALUES (
  'Sushi Express',
  '+5491123456789',
  '+5491123456789',
  'Av. Corrientes 1234, CABA, Argentina',
  0,
  true,
  '{
    "monday": {"is_open": true, "open_time": "18:00", "close_time": "23:00"},
    "tuesday": {"is_open": true, "open_time": "18:00", "close_time": "23:00"},
    "wednesday": {"is_open": true, "open_time": "18:00", "close_time": "23:00"},
    "thursday": {"is_open": true, "open_time": "18:00", "close_time": "23:00"},
    "friday": {"is_open": true, "open_time": "18:00", "close_time": "00:00"},
    "saturday": {"is_open": true, "open_time": "18:00", "close_time": "00:00"},
    "sunday": {"is_open": true, "open_time": "18:00", "close_time": "23:00"}
  }',
  true,
  '{
    "instagram": "@sushiexpress",
    "facebook": "sushiexpress",
    "website": ""
  }'
);

-- Insertar categorías
INSERT INTO categories (name, display_order, is_active) VALUES
('Rolls', 1, true),
('Sashimi', 2, true),
('Nigiri', 3, true),
('Combos', 4, true),
('Bebidas', 5, true),
('Postres', 6, true);

-- Insertar productos de ejemplo

-- Rolls
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('California Roll', 'Salmón, palta, pepino y sésamo', 1200, 'Rolls', true, null),
('Philadelphia Roll', 'Salmón, queso philadelphia y cebollín', 1350, 'Rolls', true, null),
('Ebi Roll', 'Langostino tempura, palta y mayonesa japonesa', 1400, 'Rolls', true, null),
('Spicy Tuna Roll', 'Atún spicy, pepino y palta', 1300, 'Rolls', true, null),
('Vegetarian Roll', 'Palta, pepino, zanahoria y brotes de soja', 950, 'Rolls', true, null);

-- Sashimi
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('Sashimi de Salmón', '5 cortes de salmón fresco', 1100, 'Sashimi', true, null),
('Sashimi de Atún', '5 cortes de atún rojo', 1250, 'Sashimi', true, null),
('Sashimi Mixto', '10 cortes: salmón, atún y pez mantequilla', 2200, 'Sashimi', true, null);

-- Nigiri
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('Nigiri de Salmón', '2 piezas sobre arroz sushi', 650, 'Nigiri', true, null),
('Nigiri de Atún', '2 piezas sobre arroz sushi', 750, 'Nigiri', true, null),
('Nigiri de Langostino', '2 piezas sobre arroz sushi', 800, 'Nigiri', true, null);

-- Combos
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('Combo Para Uno', '1 California Roll + 4 Sashimi de salmón + 2 Nigiri', 2800, 'Combos', true, null),
('Combo Para Dos', '2 Rolls a elección + 8 Sashimi mixto + 4 Nigiri mixto', 4500, 'Combos', true, null),
('Combo Familiar', '4 Rolls + 12 Sashimi + 8 Nigiri + 2 bebidas', 7200, 'Combos', true, null);

-- Bebidas
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('Coca Cola 500ml', 'Coca Cola lata', 400, 'Bebidas', true, 50),
('Agua sin gas 500ml', 'Agua mineral Villavicencio', 300, 'Bebidas', true, 30),
('Cerveza Stella 473ml', 'Cerveza importada', 650, 'Bebidas', true, 24),
('Té Verde', 'Té verde japonés caliente', 350, 'Bebidas', true, null);

-- Postres
INSERT INTO products (name, description, price, category, is_available, stock) VALUES
('Mochi de Vainilla', '3 unidades de mochi', 800, 'Postres', true, null),
('Dorayaki', 'Panqueque japonés relleno de dulce de leche', 600, 'Postres', true, null);

-- Insertar variaciones para algunos productos
DO $$
DECLARE
    california_roll_id UUID;
    philadelphia_roll_id UUID;
    combo_dos_id UUID;
BEGIN
    -- Obtener IDs de productos
    SELECT id INTO california_roll_id FROM products WHERE name = 'California Roll';
    SELECT id INTO philadelphia_roll_id FROM products WHERE name = 'Philadelphia Roll';
    SELECT id INTO combo_dos_id FROM products WHERE name = 'Combo Para Dos';

    -- Variaciones para California Roll
    INSERT INTO product_variations (product_id, name, type, price_change, is_required) VALUES
    (california_roll_id, 'Salsa extra spicy', 'addon', 150, false),
    (california_roll_id, 'Salsa teriyaki', 'addon', 100, false),
    (california_roll_id, 'Sin sésamo', 'removal', 0, false),
    (california_roll_id, 'Extra palta', 'addon', 200, false);

    -- Variaciones para Philadelphia Roll
    INSERT INTO product_variations (product_id, name, type, price_change, is_required) VALUES
    (philadelphia_roll_id, 'Doble queso philadelphia', 'addon', 250, false),
    (philadelphia_roll_id, 'Sin cebollín', 'removal', 0, false),
    (philadelphia_roll_id, 'Salsa spicy mayo', 'addon', 150, false);

    -- Variaciones para Combo Para Dos (selección de rolls)
    INSERT INTO product_variations (product_id, name, type, price_change, is_required, options) VALUES
    (combo_dos_id, 'Primer Roll', 'option', 0, true, '["California Roll", "Philadelphia Roll", "Ebi Roll", "Spicy Tuna Roll"]'),
    (combo_dos_id, 'Segundo Roll', 'option', 0, true, '["California Roll", "Philadelphia Roll", "Ebi Roll", "Spicy Tuna Roll"]');
END $$;



-- Crear tabla de perfiles para almacenar roles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para que los admins puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar un usuario admin de ejemplo (debes cambiar el email y crear el usuario en Supabase Auth)
-- INSERT INTO profiles (id, email, role) 
-- VALUES ('tu-user-id-aqui', 'admin@oishinpon.com', 'admin');

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload (cualquier usuario autenticado)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Política para lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');

-- Política para update/delete (solo admin)
CREATE POLICY "Admin full access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND auth.jwt() ->> 'role' = 'admin');


## Agregar admin manualmente

UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '52920ff4-6640-4306-bc55-a0e514339064';

-- Crear el bucket 'img' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'img',
  'img', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Política para permitir que todos vean las imágenes (SELECT)
CREATE POLICY "Public Access - Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'img');

-- Política para permitir que usuarios autenticados suban imágenes (INSERT)
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'img');

-- Política para permitir que usuarios autenticados actualicen imágenes (UPDATE)
CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'img');

-- Política para permitir que usuarios autenticados eliminen imágenes (DELETE)
CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'img');

-- Habilitar RLS en la tabla storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
