-- Run after init.sql for existing databases
ALTER TABLE diagnoses DROP CONSTRAINT IF EXISTS diagnoses_severity_check;
ALTER TABLE diagnoses ADD CONSTRAINT diagnoses_severity_check
    CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Critical'));

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    from_department VARCHAR(100) NOT NULL,
    to_department VARCHAR(100) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled')),
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
