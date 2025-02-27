-- Médico 13: Cardiología (id 1) y Neurología (id 4)
INSERT INTO medical_professionals_specialties (medical_professional_id, specialty_id)
VALUES 
  (7, 1),
  (7, 4);


INSERT INTO professional_images (professional_id, public_name, private_name, profile_path, header_path)
VALUES 
(7, 'Dr. John Doe', 'john_doe_private.png', 'uploads/health_professional/health_professional_001.png', 'uploads/health_professional/consultation_13_header.png');
