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
        CREATE TYPE appointment_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED');
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


CREATE TABLE IF NOT EXISTS medical_professionals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,  
    
    nationality VARCHAR(100),
    
    -- Información profesional
    profession VARCHAR(255) NOT NULL,           -- Profesión (ej. Médico)
    specialty VARCHAR(255) NOT NULL,            -- Especialidad médica
    medical_registration VARCHAR(255),          -- Número de registro médico 
    professional_card_number VARCHAR(255),      -- Número de tarjeta profesional
    university VARCHAR(255),                    -- Universidad de graduación
    graduation_year INT,                        -- Año de graduación
    additional_certifications TEXT,             -- Cursos, certificaciones o especializaciones adicionales
    years_experience INT,                       -- Años de experiencia profesional
    
    -- Información de atención
    consultation_address VARCHAR(255),          -- Dirección del consultorio o centro médico
    institution_name VARCHAR(255),              -- Nombre de la institución o clínica (si aplica)
    attention_township_id BIGINT REFERENCES townships(id) ON DELETE SET NULL,  -- Ciudad de atención (a través de "townships")
    consultation_schedule TEXT,                 -- Horarios de consulta (se puede almacenar como texto o JSON)
    consultation_modes consultation_mode_enum[] NOT NULL,  -- Modalidades de atención (pueden ser varias)
    weekly_availability VARCHAR(255),           -- Disponibilidad semanal (ej. "Lunes a Viernes 8:00-17:00")
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professional_documents (
    id SERIAL PRIMARY KEY,
    professional_id INT REFERENCES medical_professionals(id) ON DELETE CASCADE,
    document_type professional_document_type_enum NOT NULL, 
    document_path VARCHAR(255) NOT NULL,               
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



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
    blood_type VARCHAR(35) NOT NULL,
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
    message_type VARCHAR(10) CHECK (message_type IN ('SENT', 'RECEIVED')),
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



CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    beneficiary_id BIGINT NULL REFERENCES beneficiaries(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP NOT NULL,
    status appointment_status_enum DEFAULT 'PENDING',
    notes TEXT,
    is_for_beneficiary BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS public.call_assignments (
    id SERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES call_center_agents(id) ON DELETE SET NULL,
    appointment_id BIGINT REFERENCES medical_appointments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status appointment_status_enum DEFAULT 'PENDING'
);



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

CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT REFERENCES plans(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status_enum  DEFAULT 'PENDING',
    transaction_id VARCHAR(255) UNIQUE,
    payment_method payment_method_enum  NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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