--Enums

-- Crear ENUM para identification_type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'identification_type_enum') THEN
        CREATE TYPE identification_type_enum AS ENUM ('CC', 'TI', 'CE', 'PASSPORT', 'OTHER');
    END IF;
END $$;

-- Crear ENUM para status de citas médicas
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_enum') THEN
        CREATE TYPE appointment_status_enum AS ENUM ('PENDING', 'TO_BE_CONFIRMED', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'EXPIRED', 'ATTENDED');
    END IF;
END $$;

-- Crear ENUM para tipos de notificación
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
    END IF;
END $$;

-- Crear ENUM para estado de pagos
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
    END IF;
END $$;

-- Crear ENUM para métodos de pago
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE payment_method_enum AS ENUM ('CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER');
    END IF;
END $$;

-- Crear ENUM para severidad de alergias
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'allergy_severity_enum') THEN
        CREATE TYPE allergy_severity_enum AS ENUM ('MILD', 'MODERATE', 'SEVERE');
    END IF;
END $$;

-- Create ENUM types if they do not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
        CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status_enum') THEN
        CREATE TYPE notification_status_enum AS ENUM ('SENT', 'FAILED');
    END IF;
END $$;


-- NEW TABLES

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_mode_enum') THEN
        CREATE TYPE consultation_mode_enum AS ENUM ('PRESENCIAL', 'VIRTUAL', 'DOMICILIARIA');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_document_type_enum') THEN
        CREATE TYPE professional_document_type_enum AS ENUM (
            'ID_COPY',                
            'PROFESSIONAL_CARD',      
            'STUDIES_CERTIFICATE',    
            'MEDICAL_RECORD',         -- Registro de la consulta médica (si aplica)
            'RUT',                    -- Registro Único Tributario
            'BANK_CERTIFICATION'      -- Certificación bancaria para pagos
        );
    END IF;
END $$;



CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    code integer NOT NULL
);


CREATE TABLE townships (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT NOT NULL,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(255) NOT NULL UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    max_beneficiaries INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    identification_type identification_type_enum  NOT NULL,
    identification_number VARCHAR(80) NOT NULL,
    address VARCHAR(100) NOT NULL,
    gender VARCHAR(30) NOT NULL,
    birth_date VARCHAR(30) NOT NULL,
    city_id BIGINT REFERENCES townships(id) ON DELETE RESTRICT,
    phone VARCHAR(80) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    online_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    plan_id BIGINT NULL REFERENCES plans(id) ON DELETE SET NULL
);


CREATE TABLE user_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id integer NOT NULL REFERENCES users(id),
    plan_id integer NOT NULL REFERENCES plans(id),
    transaction_id TEXT NOT NULL UNIQUE, -- ID de transacción de Wompi
    reference TEXT NOT NULL UNIQUE,      -- Referencia única generada
    amount NUMERIC(10,2) NOT NULL,       -- Monto de la transacción
    currency VARCHAR(3) NOT NULL DEFAULT 'COP', -- Moneda
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', 
    is_valid BOOLEAN NOT NULL DEFAULT FALSE, -- Validez de la transacción
    wompi_status TEXT,      -- Estado exacto de Wompi
    wompi_response JSONB,   -- Respuesta completa de Wompi
    payment_method VARCHAR(50),  -- Método de pago (CARD, PSE, etc)
    installments INTEGER DEFAULT 1, -- Número de cuotas
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar rendimiento
    CONSTRAINT unique_transaction_id UNIQUE (transaction_id),
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Índices para optimizar consultas
CREATE INDEX idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX idx_user_transactions_status ON user_transactions(status);
CREATE INDEX idx_user_transactions_created_at ON user_transactions(created_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_transactions_modtime
BEFORE UPDATE ON user_transactions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Crear tabla de pagos si no existe
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    transaction_id VARCHAR(100),
    payment_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Agregar columna plan_name a user_transactions si no existe
ALTER TABLE user_transactions 
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(created_at);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);



CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    identification_type identification_type_enum  NOT NULL,
    identification_number VARCHAR(80) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    birth_date DATE,
    gender VARCHAR(30) NOT NULL,
    city_id BIGINT REFERENCES townships(id) ON DELETE RESTRICT,
    address VARCHAR(255) NOT NULL,
    blood_type VARCHAR(35),
    health_provider VARCHAR(50),
    prepaid_health VARCHAR(50),
    work_risk_insurance VARCHAR(50),
    funeral_insurance VARCHAR(50),
    removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL
);


CREATE TABLE IF NOT EXISTS public.call_center_agents (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    status status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.chats (
    id SERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT REFERENCES call_center_agents(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'PENDING')),
    closed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    last_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chats_sender ON chats(sender_id);
CREATE INDEX idx_chats_receiver ON chats(receiver_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL, 
    sender_type VARCHAR(10) CHECK (sender_type IN ('USER', 'AGENT')),
    status VARCHAR(10) CHECK (status IN ('READ', 'DELIVERED', 'FAILED')),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_chat ON messages(chat_id);

-- TRIGGER para actualizar updated_at en chats cuando se inserte un nuevo mensaje
CREATE OR REPLACE FUNCTION update_chat_timestamp() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats SET updated_at = CURRENT_TIMESTAMP, last_message = NEW.message WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_after_insert
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_chat_timestamp();






CREATE TABLE IF NOT EXISTS public.beneficiary_history (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    removed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    message TEXT NOT NULL,
    status notification_status_enum DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





CREATE TABLE IF NOT EXISTS user_images (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    public_name VARCHAR(100),
    private_name VARCHAR(100),
    image_path VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiary_images (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    public_name VARCHAR(100),
    private_name VARCHAR(100),
    image_path VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.beneficiary_distinctives (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    description VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_disabilities (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_allergies (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    allergy_type VARCHAR(100),
    description VARCHAR(1000),
    severity allergy_severity_enum DEFAULT 'MILD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_medical_history (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    history_type VARCHAR(50),
    description VARCHAR(1000),
    history_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_family_history (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    history_type VARCHAR(50),
    relationship VARCHAR(100),
    description VARCHAR(1000),
    history_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_diseases (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    disease VARCHAR(200),
    diagnosed_date DATE,
    treatment_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.beneficiary_medications (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    medication VARCHAR(100),
    laboratory VARCHAR(100),
    prescription VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiary_vaccinations (
    id SERIAL PRIMARY KEY,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE CASCADE,
    vaccine VARCHAR(100),
    vaccination_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.user_emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(80) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS medical_professionals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- 
    
    nationality VARCHAR(100),
    
    -- Información profesional
    profession VARCHAR(255) NOT NULL,           -- Profesión (ej. Médico)
    medical_registration VARCHAR(255),          -- Número de registro médico 
    professional_card_number VARCHAR(255),      -- Número de tarjeta profesional
    university VARCHAR(255),                    -- Universidad de graduación
    graduation_year INT,                        -- Año de graduación
    additional_certifications TEXT,             -- Cursos, certificaciones o especializaciones adicionales
    years_experience INT,                       -- Años de experiencia profesional
    
    -- Información de atención
    consultation_address VARCHAR(255),          -- Dirección del consultorio o centro médico
    institution_name VARCHAR(255),              -- Nombre de la institución o clínica (si aplica)
    attention_township_id BIGINT REFERENCES townships(id) ON DELETE SET NULL,  -- Ciudad de atención
    consultation_schedule TEXT,                 -- Horarios de consulta 
    consultation_modes consultation_mode_enum[] NOT NULL,  -- Modalidades de atención (pueden ser varias)
    weekly_availability VARCHAR(255),           -- Disponibilidad semanal (ej. "Lunes a Viernes 8:00-17:00")
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_professional_availability (
    id SERIAL PRIMARY KEY,
    professional_id INT NOT NULL REFERENCES medical_professionals(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);


CREATE TABLE IF NOT EXISTS medical_specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,       -- Nombre de la especialidad
    description TEXT ,                 -- Descripción u observaciones de la especialidad
    public_name VARCHAR(100),                  -- Descripción u observaciones de la especialidad
    private_name VARCHAR(100),                  -- Descripción u observaciones de la especialidad
    image_path TEXT                  -- Descripción u observaciones de la especialidad
);

CREATE TABLE IF NOT EXISTS medical_professionals_specialties (
    medical_professional_id INT NOT NULL REFERENCES medical_professionals(id) ON DELETE CASCADE,
    specialty_id INT NOT NULL REFERENCES medical_specialties(id) ON DELETE CASCADE,
    PRIMARY KEY (medical_professional_id, specialty_id)
);



CREATE TABLE IF NOT EXISTS professional_documents (
    id SERIAL PRIMARY KEY,
    professional_id INT REFERENCES medical_professionals(id) ON DELETE CASCADE,
    document_type professional_document_type_enum NOT NULL, 
    document_path VARCHAR(255) NOT NULL,               
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- TABLA PARA IMÁGENES DEL PROFESIONAL

CREATE TABLE IF NOT EXISTS professional_images (
    id SERIAL PRIMARY KEY,
    professional_id INT REFERENCES medical_professionals(id) ON DELETE CASCADE,
    public_name VARCHAR(100),
    private_name VARCHAR(100),
    profile_path VARCHAR(100),
    header_path VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    beneficiary_id BIGINT NULL REFERENCES beneficiaries(id) ON DELETE SET NULL,
    professional_id INT NOT NULL REFERENCES medical_professionals(id) ON DELETE CASCADE,
    specialty_id INT NOT NULL REFERENCES medical_specialties(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP,
    status appointment_status_enum DEFAULT 'PENDING',
    appointment_time TIME,
    duration_minutes INT NOT NULL DEFAULT 30,
    notes TEXT,
    is_for_beneficiary BOOLEAN NOT NULL,
    firstTime BOOLEAN NOT NULL DEFAULT TRUE,
    control BOOLEAN NOT NULL DEFAULT TRUE,
    city_id BIGINT REFERENCES townships(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.call_assignments (
    id SERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES call_center_agents(id) ON DELETE SET NULL,
    appointment_id BIGINT REFERENCES medical_appointments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status appointment_status_enum DEFAULT 'PENDING'
);

CREATE TABLE message_logs (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  channel VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  message_sid VARCHAR(50),
  status VARCHAR(20),
  error TEXT,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Índice para búsquedas rápidas de tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);


-- Schema para la tabla de tokens de verificación de correo electrónico
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id)
);

-- Índice para búsquedas rápidas de tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Asegurarse de que la tabla users tenga la columna verified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verified'
  ) THEN
    ALTER TABLE users ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END
$$;


-- Crear tabla para los chats entre agentes y usuarios
CREATE TABLE agent_chats (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES call_center_agents(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_message TEXT,
    closed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_agent_chats_agent_id ON agent_chats(agent_id);
CREATE INDEX idx_agent_chats_user_id ON agent_chats(user_id);
CREATE INDEX idx_agent_chats_status ON agent_chats(status);

-- Crear tabla para los mensajes de chat
CREATE TABLE agent_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES agent_chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('USER', 'AGENT', 'SYSTEM')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para la tabla de mensajes
CREATE INDEX idx_agent_chat_messages_chat_id ON agent_chat_messages(chat_id);
CREATE INDEX idx_agent_chat_messages_sender_id ON agent_chat_messages(sender_id);
CREATE INDEX idx_agent_chat_messages_sent_at ON agent_chat_messages(sent_at);

-- Añadir columna last_seen a la tabla users para tracking de usuarios en línea
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT FALSE;

-- Añadir el campo schedule_type a la tabla medical_professionals
ALTER TABLE medical_professionals 
ADD COLUMN schedule_type VARCHAR(20) NOT NULL DEFAULT 'UNAVAILABLE';

ALTER TABLE medical_professionals 
ADD CONSTRAINT schedule_type_check 
CHECK (schedule_type IN ('ONLINE', 'MANUAL', 'UNAVAILABLE'));

COMMENT ON COLUMN medical_professionals.schedule_type IS 'Tipo de agenda del profesional: ONLINE (agenda en línea disponible), MANUAL (agenda manual), UNAVAILABLE (agenda no disponible)';

-- Por defecto, establecemos todos a 'UNAVAILABLE' hasta que se configure manualmente
UPDATE medical_professionals SET schedule_type = 'UNAVAILABLE';

-- Comentarios de las tablas
COMMENT ON TABLE agent_chats IS 'Almacena las conversaciones entre agentes del call center y usuarios';
COMMENT ON TABLE agent_chat_messages IS 'Almacena los mensajes individuales enviados en los chats de agentes';
COMMENT ON COLUMN agent_chats.agent_id IS 'ID del agente de call center';
COMMENT ON COLUMN agent_chats.user_id IS 'ID del usuario cliente';
COMMENT ON COLUMN agent_chats.status IS 'Estado del chat: ACTIVE, CLOSED';
COMMENT ON COLUMN agent_chats.last_message IS 'Último mensaje enviado en el chat';
COMMENT ON COLUMN agent_chats.closed_by IS 'ID del usuario o agente que cerró el chat';
COMMENT ON COLUMN agent_chat_messages.sender_id IS 'ID del remitente del mensaje';
COMMENT ON COLUMN agent_chat_messages.sender_type IS 'Tipo de remitente: USER, AGENT o SYSTEM';
COMMENT ON COLUMN agent_chat_messages.status IS 'Estado del mensaje: SENT, DELIVERED, READ';
COMMENT ON COLUMN users.last_seen IS 'Última vez que el usuario estuvo activo';
COMMENT ON COLUMN users.online_status IS 'Indica si el usuario está actualmente en línea';

-- New Tables for Medical data user ---------------------------------------------------
-- Table for user allergies
CREATE TABLE IF NOT EXISTS user_allergies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allergy_type VARCHAR(100) NOT NULL,
  description TEXT,
  severity VARCHAR(20) CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE')) DEFAULT 'MILD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user disabilities
CREATE TABLE IF NOT EXISTS user_disabilities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user diseases
CREATE TABLE IF NOT EXISTS user_diseases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disease VARCHAR(200) NOT NULL,
  diagnosed_date DATE,
  treatment_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user distinctives (physical characteristics or identifiers)
CREATE TABLE IF NOT EXISTS user_distinctives (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user family medical history
CREATE TABLE IF NOT EXISTS user_family_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  history_type VARCHAR(50) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  description TEXT,
  history_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user medical history
CREATE TABLE IF NOT EXISTS user_medical_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  history_type VARCHAR(50) NOT NULL,
  description TEXT,
  history_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user medications
CREATE TABLE IF NOT EXISTS user_medications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medication VARCHAR(100) NOT NULL,
  laboratory VARCHAR(100),
  prescription TEXT,
  dosage VARCHAR(100),
  frequency VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for user vaccinations
CREATE TABLE IF NOT EXISTS user_vaccinations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vaccine VARCHAR(100) NOT NULL,
  vaccination_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_disabilities_user_id ON user_disabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_diseases_user_id ON user_diseases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_distinctives_user_id ON user_distinctives(user_id);
CREATE INDEX IF NOT EXISTS idx_user_family_history_user_id ON user_family_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medical_history_user_id ON user_medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medications_user_id ON user_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vaccinations_user_id ON user_vaccinations(user_id);