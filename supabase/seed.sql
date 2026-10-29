-- ============================================================
-- SEED DATA — Encuentrame / Tierra Blanca, Veracruz
-- Ejecuta esto en Supabase → SQL Editor DESPUÉS del migration
-- ============================================================

-- Negocios de ejemplo (sin owner_id, son registros demo)
INSERT INTO businesses (id, name, slug, description, category_id, address, phone, whatsapp, city, state, lat, lng, cover_image, is_active, is_verified)
VALUES
  -- COMIDA (category_id = 1)
  (
    'a1000000-0000-0000-0000-000000000001',
    'Buffet El Buen Sabor',
    'buffet-el-buen-sabor',
    'El buffet más completo de Tierra Blanca. Más de 30 platillos calientes, ensaladas, postres y agua fresca del día. Ideal para comer bien a precio justo.',
    1,
    'Av. Insurgentes 45, Centro, Tierra Blanca, Ver.',
    '2721234001',
    '2721234001',
    'Tierra Blanca',
    'Veracruz',
    18.4550000,
    -96.3550000,
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Tacos Don Beto',
    'tacos-don-beto',
    'Los mejores tacos de barbacoa y canasta desde 1998. Abierto todos los días desde las 7 am. Tortillas hechas a mano.',
    1,
    'Calle Hidalgo 12, Mercado Municipal, Tierra Blanca, Ver.',
    '2721234002',
    '2721234002',
    'Tierra Blanca',
    'Veracruz',
    18.4560000,
    -96.3540000,
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Mariscos La Perla',
    'mariscos-la-perla',
    'Ceviches, tostadas, camarones al mojo de ajo y más. Mariscos frescos traídos directamente del puerto. Solo fines de semana.',
    1,
    'Blvd. Adolfo Ruiz Cortines 78, Tierra Blanca, Ver.',
    '2721234003',
    '2721234003',
    'Tierra Blanca',
    'Veracruz',
    18.4540000,
    -96.3560000,
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    true,
    false
  ),

  -- BELLEZA (category_id = 2)
  (
    'a1000000-0000-0000-0000-000000000004',
    'Barbería El Estilo',
    'barberia-el-estilo',
    'Cortes modernos y clásicos, arreglo de barba, tintes y más. Agenda tu cita o pasa directo. Abiertos sábados y domingos.',
    2,
    'Calle Reforma 23, Col. Centro, Tierra Blanca, Ver.',
    '2721234004',
    '2721234004',
    'Tierra Blanca',
    'Veracruz',
    18.4570000,
    -96.3530000,
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    true,
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Salón de Belleza Karen',
    'salon-belleza-karen',
    'Corte, tinte, peinado, uñas y tratamientos capilares. 10 años embelleciendo a las mujeres de Tierra Blanca.',
    2,
    'Calle Morelos 56, Tierra Blanca, Ver.',
    '2721234005',
    '2721234005',
    'Tierra Blanca',
    'Veracruz',
    18.4545000,
    -96.3545000,
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    true,
    true
  ),

  -- SALUD (category_id = 3)
  (
    'a1000000-0000-0000-0000-000000000006',
    'Farmacia San Rafael',
    'farmacia-san-rafael',
    'Medicamentos de patente y genéricos, inyecciones, toma de presión y glucosa sin costo. Servicio 24 horas.',
    3,
    'Av. 5 de Mayo 101, Tierra Blanca, Ver.',
    '2721234006',
    '2721234006',
    'Tierra Blanca',
    'Veracruz',
    18.4555000,
    -96.3555000,
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
    true,
    true
  ),

  -- TIENDAS (category_id = 4)
  (
    'a1000000-0000-0000-0000-000000000007',
    'Abarrotes y Cremería Lupita',
    'abarrotes-cremeria-lupita',
    'Todo para el rancho y el hogar. Quesos, cremas, embutidos, víveres, bebidas y más. Precios directos al público.',
    4,
    'Mercado Municipal Local 14, Tierra Blanca, Ver.',
    '2721234007',
    '2721234007',
    'Tierra Blanca',
    'Veracruz',
    18.4558000,
    -96.3548000,
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80',
    true,
    false
  ),

  -- MECÁNICA (category_id = 5)
  (
    'a1000000-0000-0000-0000-000000000008',
    'Taller Mecánico Los Güeros',
    'taller-mecanico-los-gueros',
    'Servicio mecánico general, frenos, suspensión, afinaciones y hojalatería. Más de 20 años de experiencia. Trabajo garantizado.',
    5,
    'Carretera Tierra Blanca-Tuxtepec Km 2, Tierra Blanca, Ver.',
    '2721234008',
    '2721234008',
    'Tierra Blanca',
    'Veracruz',
    18.4530000,
    -96.3570000,
    'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=80',
    true,
    false
  ),

  -- ENTRETENIMIENTO (category_id = 7)
  (
    'a1000000-0000-0000-0000-000000000009',
    'Billar y Recreativo El Rincón',
    'billar-recreativo-el-rincon',
    'Mesas de billar, futbolito, ping pong y área de descanso. El lugar favorito de los jóvenes de Tierra Blanca los fines de semana.',
    7,
    'Calle Juárez 88, Col. Centro, Tierra Blanca, Ver.',
    '2721234009',
    '2721234009',
    'Tierra Blanca',
    'Veracruz',
    18.4562000,
    -96.3538000,
    'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=800&q=80',
    true,
    false
  ),

  -- HOGAR (category_id = 8)
  (
    'a1000000-0000-0000-0000-000000000010',
    'Ferretería y Materiales Hernández',
    'ferreteria-materiales-hernandez',
    'Materiales de construcción, herramientas, pinturas, tubería y todo lo que necesitas para tu obra o remodelación.',
    8,
    'Av. Veracruz 200, Tierra Blanca, Ver.',
    '2721234010',
    '2721234010',
    'Tierra Blanca',
    'Veracruz',
    18.4535000,
    -96.3565000,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    true,
    true
  );


-- ============================================================
-- HORARIOS DE LOS NEGOCIOS
-- day_of_week: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles,
--              4=Jueves, 5=Viernes, 6=Sábado
-- ============================================================

-- Buffet El Buen Sabor (Lun-Dom 8am-6pm)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000001', 0, '09:00', '17:00', false),
  ('a1000000-0000-0000-0000-000000000001', 1, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000001', 2, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000001', 3, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000001', 4, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000001', 5, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000001', 6, '08:00', '18:00', false);

-- Tacos Don Beto (Todos los días 7am-2pm)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000002', 0, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 1, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 2, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 3, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 4, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 5, '07:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000002', 6, '07:00', '14:00', false);

-- Mariscos La Perla (Solo Sábado y Domingo 10am-5pm)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000003', 0, '10:00', '17:00', false),
  ('a1000000-0000-0000-0000-000000000003', 1, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000003', 2, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000003', 3, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000003', 4, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000003', 5, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000003', 6, '10:00', '17:00', false);

-- Barbería El Estilo (Mar-Sáb 9am-8pm, Dom 10am-3pm, Lun cerrado)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000004', 0, '10:00', '15:00', false),
  ('a1000000-0000-0000-0000-000000000004', 1, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000004', 2, '09:00', '20:00', false),
  ('a1000000-0000-0000-0000-000000000004', 3, '09:00', '20:00', false),
  ('a1000000-0000-0000-0000-000000000004', 4, '09:00', '20:00', false),
  ('a1000000-0000-0000-0000-000000000004', 5, '09:00', '20:00', false),
  ('a1000000-0000-0000-0000-000000000004', 6, '09:00', '20:00', false);

-- Salón de Belleza Karen (Lun-Sáb 9am-7pm, Dom cerrado)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000005', 0, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000005', 1, '09:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000005', 2, '09:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000005', 3, '09:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000005', 4, '09:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000005', 5, '09:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000005', 6, '09:00', '17:00', false);

-- Farmacia San Rafael (24 horas todos los días)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000006', 0, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 1, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 2, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 3, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 4, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 5, '00:00', '23:59', false),
  ('a1000000-0000-0000-0000-000000000006', 6, '00:00', '23:59', false);

-- Abarrotes Lupita (Lun-Sáb 7am-9pm, Dom 8am-2pm)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000007', 0, '08:00', '14:00', false),
  ('a1000000-0000-0000-0000-000000000007', 1, '07:00', '21:00', false),
  ('a1000000-0000-0000-0000-000000000007', 2, '07:00', '21:00', false),
  ('a1000000-0000-0000-0000-000000000007', 3, '07:00', '21:00', false),
  ('a1000000-0000-0000-0000-000000000007', 4, '07:00', '21:00', false),
  ('a1000000-0000-0000-0000-000000000007', 5, '07:00', '21:00', false),
  ('a1000000-0000-0000-0000-000000000007', 6, '07:00', '21:00', false);

-- Taller Mecánico Los Güeros (Lun-Vie 8am-6pm, Sáb 8am-2pm, Dom cerrado)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000008', 0, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000008', 1, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000008', 2, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000008', 3, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000008', 4, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000008', 5, '08:00', '18:00', false),
  ('a1000000-0000-0000-0000-000000000008', 6, '08:00', '14:00', false);

-- Billar El Rincón (Todos los días 2pm-11pm)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000009', 0, '14:00', '23:00', false),
  ('a1000000-0000-0000-0000-000000000009', 1, '14:00', '23:00', false),
  ('a1000000-0000-0000-0000-000000000009', 2, '14:00', '23:00', false),
  ('a1000000-0000-0000-0000-000000000009', 3, '14:00', '23:00', false),
  ('a1000000-0000-0000-0000-000000000009', 4, '14:00', '23:00', false),
  ('a1000000-0000-0000-0000-000000000009', 5, '14:00', '00:00', false),
  ('a1000000-0000-0000-0000-000000000009', 6, '12:00', '00:00', false);

-- Ferretería Hernández (Lun-Sáb 8am-7pm, Dom cerrado)
INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_closed) VALUES
  ('a1000000-0000-0000-0000-000000000010', 0, NULL,    NULL,    true),
  ('a1000000-0000-0000-0000-000000000010', 1, '08:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000010', 2, '08:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000010', 3, '08:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000010', 4, '08:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000010', 5, '08:00', '19:00', false),
  ('a1000000-0000-0000-0000-000000000010', 6, '08:00', '14:00', false);
