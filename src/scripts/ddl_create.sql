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
        CREATE TYPE appointment_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    plan_id BIGINT REFERENCES plans(id) ON DELETE RESTRICT
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);


CREATE TABLE IF NOT EXISTS public.services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    image_path VARCHAR(255) NOT NULL,
    whatsapp_link VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS public.call_center_chat (
    id SERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT REFERENCES call_center_agents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE SET NULL,
    appointment_date TIMESTAMP NOT NULL,
    status appointment_status_enum DEFAULT 'PENDING',
    notes TEXT,
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