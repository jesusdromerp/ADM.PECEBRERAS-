-- ==============================================================================
-- GESTIÓN ECUESTRE & PESEBRERAS - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Este archivo contiene las definiciones completas de tablas, llaves foráneas,
-- estructuras JSONB, índices de rendimiento y políticas RLS para sincronizar 
-- de manera idéntica con el modelo de datos de la aplicación.
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
    horses_count INT DEFAULT 0,
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
    horse_id UUID,
    horse_name TEXT,
    assigned_horse_id UUID,
    assigned_horse_name TEXT,
    current_maintenance_reason TEXT,
    current_maintenance_responsible TEXT,
    current_maintenance_date DATE,
    maintenance_history JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: CABALLOS / EQUINOS (MODELO COMPLETO)
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
    owner_name TEXT NOT NULL,
    pesebrera_id UUID REFERENCES public.pesebreras(id) ON DELETE SET NULL,
    pesebrera_code TEXT,
    health_status TEXT NOT NULL DEFAULT 'optimo' CHECK (health_status IN ('optimo', 'en_tratamiento', 'reposo', 'observacion')),
    diet_notes TEXT,
    image_url TEXT,
    
    -- Genealogía, Sanidad y Cuidados Especiales
    pedigree JSONB DEFAULT '{}'::jsonb,
    disease_history JSONB DEFAULT '[]'::jsonb,
    farrier_control JSONB DEFAULT '{}'::jsonb,
    feed_config JSONB DEFAULT '{}'::jsonb,
    
    -- Operación diaria (Raciones y Montador)
    daily_portions_count INT DEFAULT 3,
    scheduled_for_riding_today BOOLEAN DEFAULT FALSE,
    assigned_rider_name TEXT,
    riding_activity_type TEXT,
    daily_activity_history JSONB DEFAULT '[]'::jsonb,
    riding_session_history JSONB DEFAULT '[]'::jsonb,
    
    -- Planes de Servicio / Canon
    plan_code TEXT,
    plan_name TEXT,
    plan_price_cop NUMERIC(12, 2),
    plan_inclusions JSONB DEFAULT '[]'::jsonb,
    
    -- Retiro / Baja
    exit_date DATE,
    exit_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: SANIDAD Y REGISTROS VETERINARIOS
CREATE TABLE IF NOT EXISTS public.veterinary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
    horse_name TEXT NOT NULL,
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
    client_name TEXT NOT NULL,
    client_phone TEXT,
    horse_id UUID REFERENCES public.horses(id) ON DELETE SET NULL,
    horse_name TEXT,
    pesebrera_code TEXT,
    category TEXT NOT NULL CHECK (category IN ('alquiler_pesebrera', 'alimentacion', 'veterinaria', 'herraje', 'integral')),
    concept TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    due_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagado', 'pendiente', 'vencido')),
    payment_method TEXT CHECK (payment_method IN ('transferencia', 'efectivo', 'tarjeta')),
    bank_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: INVENTARIO DE ESTABLO
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('alimento', 'heno', 'cama', 'medicamento', 'suplemento')),
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 5,
    cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0,
    location TEXT NOT NULL,
    last_restocked DATE DEFAULT CURRENT_DATE,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: PLANTILLAS DE CONCENTRADOS / INSUMOS
CREATE TABLE IF NOT EXISTS public.feed_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    default_unit TEXT NOT NULL,
    default_min_stock_alert NUMERIC(10, 2) DEFAULT 5,
    default_cost_per_unit NUMERIC(12, 2) DEFAULT 0,
    default_location TEXT NOT NULL,
    default_supplier TEXT,
    nutritional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: PARÁMETROS DEL CENTRO ECUESTRE
CREATE TABLE IF NOT EXISTS public.center_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stable_name TEXT NOT NULL,
    location TEXT NOT NULL,
    nit TEXT NOT NULL,
    veterinarian_name TEXT NOT NULL,
    veterinarian_license TEXT NOT NULL,
    veterinarian_specialty TEXT NOT NULL,
    bank_details TEXT NOT NULL,
    tagline TEXT,
    contact_phone TEXT,
    default_emergency_ration_cost_cop NUMERIC(12, 2) DEFAULT 25000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: PLANES DE SERVICIO DEL CANON
CREATE TABLE IF NOT EXISTS public.canon_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    base_price_cop NUMERIC(12, 2) NOT NULL,
    base_plaza_cop NUMERIC(12, 2) DEFAULT 0,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: NOTIFICACIONES AL PROPIETARIO
CREATE TABLE IF NOT EXISTS public.owner_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    horse_id UUID NOT NULL REFERENCES public.horses(id) ON DELETE CASCADE,
    horse_name TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    covered_by_plan BOOLEAN NOT NULL DEFAULT FALSE,
    coverage_detail TEXT NOT NULL,
    extra_cost_cop NUMERIC(12, 2) DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'alerta', 'urgente')),
    reported_by TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    wa_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 12. ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_horses_owner_id ON public.horses(owner_id);
CREATE INDEX IF NOT EXISTS idx_horses_pesebrera_id ON public.horses(pesebrera_id);
CREATE INDEX IF NOT EXISTS idx_horses_is_active ON public.horses(is_active);
CREATE INDEX IF NOT EXISTS idx_pesebreras_status ON public.pesebreras(status);
CREATE INDEX IF NOT EXISTS idx_pesebreras_code ON public.pesebreras(code);
CREATE INDEX IF NOT EXISTS idx_vet_horse_id ON public.veterinary_records(horse_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_owner_notif_client_id ON public.owner_notifications(client_id);

-- ==============================================================================
-- 13. POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesebreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veterinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canon_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura abierta
CREATE POLICY "Permitir lectura clientes" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pesebreras" ON public.pesebreras FOR SELECT USING (true);
CREATE POLICY "Permitir lectura caballos" ON public.horses FOR SELECT USING (true);
CREATE POLICY "Permitir lectura veterinaria" ON public.veterinary_records FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pagos" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Permitir lectura inventario" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Permitir lectura feed_templates" ON public.feed_templates FOR SELECT USING (true);
CREATE POLICY "Permitir lectura center_settings" ON public.center_settings FOR SELECT USING (true);
CREATE POLICY "Permitir lectura canon_plans" ON public.canon_plans FOR SELECT USING (true);
CREATE POLICY "Permitir lectura owner_notifications" ON public.owner_notifications FOR SELECT USING (true);

-- Políticas de escritura (habilitadas para desarrollo y administración)
CREATE POLICY "Permitir escritura clientes" ON public.clients FOR ALL USING (true);
CREATE POLICY "Permitir escritura pesebreras" ON public.pesebreras FOR ALL USING (true);
CREATE POLICY "Permitir escritura caballos" ON public.horses FOR ALL USING (true);
CREATE POLICY "Permitir escritura veterinaria" ON public.veterinary_records FOR ALL USING (true);
CREATE POLICY "Permitir escritura pagos" ON public.payments FOR ALL USING (true);
CREATE POLICY "Permitir escritura inventario" ON public.inventory FOR ALL USING (true);
CREATE POLICY "Permitir escritura feed_templates" ON public.feed_templates FOR ALL USING (true);
CREATE POLICY "Permitir escritura center_settings" ON public.center_settings FOR ALL USING (true);
CREATE POLICY "Permitir escritura canon_plans" ON public.canon_plans FOR ALL USING (true);
CREATE POLICY "Permitir escritura owner_notifications" ON public.owner_notifications FOR ALL USING (true);
