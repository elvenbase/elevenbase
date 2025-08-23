-- Inserisci i nuovi ruoli specificati dall'utente
INSERT INTO field_options (field_name, option_value, option_label, sort_order, created_by) VALUES
-- Difensori
('player_role', 'difensore_centrale', 'Difensore centrale', 1, NULL),
('player_role', 'terzino_destro', 'Terzino destro', 2, NULL),
('player_role', 'terzino_sinistro', 'Terzino sinistro', 3, NULL),
('player_role', 'esterno_destro_basso', 'Esterno destro basso', 4, NULL),
('player_role', 'esterno_sinistro_basso', 'Esterno sinistro basso', 5, NULL),

-- Centrocampisti
('player_role', 'mediano', 'Mediano', 6, NULL),
('player_role', 'regista', 'Regista', 7, NULL),
('player_role', 'mezzala', 'Mezzala', 8, NULL),
('player_role', 'interno_centrocampo', 'Interno di centrocampo', 9, NULL),
('player_role', 'trequartista', 'Trequartista', 10, NULL),

-- Attaccanti
('player_role', 'ala_destra', 'Ala destra', 11, NULL),
('player_role', 'ala_sinistra', 'Ala sinistra', 12, NULL),
('player_role', 'seconda_punta', 'Seconda punta', 13, NULL),
('player_role', 'falso_nove', 'Falso nove', 14, NULL),
('player_role', 'centravanti', 'Centravanti', 15, NULL);

