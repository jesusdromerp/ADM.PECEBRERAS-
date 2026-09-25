-- ==============================================================================
-- GESTIÓN ECUESTRE & PESEBRERAS - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Este archivo contiene las definiciones completas de tablas, llaves foráneas,
-- índices, políticas RLS y datos iniciales (seeds) para sincronizar con Supabase.
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: PROPIETARIOS / CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    identification TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    payment_status TEXT NOT NULL DEFAULT 'al_dia' CHECK (payment_status IN ('al_dia', 'pendiente', 'mora')),
    outstanding_balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: PESEBRERAS / BOXES
CREATE TABLE IF NOT EXISTS public.pesebreras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'estandar' CHECK (type IN ('estandar', 'paridera', 'paddock', 'premium')),
    status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupada', 'mantenimiento', 'cuarentena')),
    monthly_price NUMERIC(12, 2) NOT NULL,
    dimensions TEXT NOT NULL DEFAULT '3.5m x 3.5m',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: CABALLOS / EQUINOS
CREATE TABLE IF NOT EXISTS public.horses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('macho', 'hembra', 'castrado')),
    coat_color TEXT NOT NULL,
    birth_date DATE,
    age_years INT DEFAULT 0,
    microchip TEXT UNIQUE,
    passport_number TEXT,
    owner_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    pesebrera_id UUID UNIQUE REFERENCES public.pesebreras(id) ON DELETE SET NULL,
    health_status TEXT NOT NULL DEFAULT 'optimo' CHECK (health_status IN ('optimo', 'en_tratamiento', 'reposo', 'observacion')),
    diet_notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: SANIDAD Y REGISTROS VETERINARIOS
CREATE TABLE IF NOT EXISTS public.veterinary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('medicamento', 'vacuna', 'desparasitacion', 'herraje', 'control')),
    title TEXT NOT NULL,
    dosage TEXT,
    administered_by TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE,
    status TEXT NOT NULL DEFAULT 'en_curso' CHECK (status IN ('programado', 'en_curso', 'completado')),
    cost NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: FINANZAS / PAGOS Y ALQUILERES
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    horse_id UUID REFERENCES public.horses(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('alquiler_pesebrera', 'alimentacion', 'veterinaria', 'entrenamiento')),
    concept TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagado', 'pendiente', 'vencido')),
    payment_method TEXT CHECK (payment_method IN ('transferencia', 'efectivo', 'tarjeta')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_horses_owner_id ON public.horses(owner_id);
CREATE INDEX IF NOT EXISTS idx_horses_pesebrera_id ON public.horses(pesebrera_id);
CREATE INDEX IF NOT EXISTS idx_pesebreras_status ON public.pesebreras(status);
CREATE INDEX IF NOT EXISTS idx_vet_horse_id ON public.veterinary_records(horse_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 8. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesebreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura abierta para usuarios autenticados / anónimos según rol
CREATE POLICY "Permitir lectura completa de pesebreras" ON public.pesebreras FOR SELECT USING (true);
CREATE POLICY "Permitir lectura completa de clientes" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Permitir lectura completa de caballos" ON public.horses FOR SELECT USING (true);
CREATE POLICY "Permitir lectura completa de veterinaria" ON public.veterinary_records FOR SELECT USING (true);
CREATE POLICY "Permitir lectura completa de pagos" ON public.payments FOR SELECT USING (true);

-- Políticas de escritura (habilitadas para desarrollo inicial o rol de administrador)
CREATE POLICY "Permitir inserción de pesebreras" ON public.pesebreras FOR ALL USING (true);
CREATE POLICY "Permitir gestión de caballos" ON public.horses FOR ALL USING (true);
CREATE POLICY "Permitir gestión de clientes" ON public.clients FOR ALL USING (true);
CREATE POLICY "Permitir gestión de veterinaria" ON public.veterinary_records FOR ALL USING (true);
CREATE POLICY "Permitir gestión de pagos" ON public.payments FOR ALL USING (true);
