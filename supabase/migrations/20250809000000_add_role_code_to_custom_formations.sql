-- Add role_code key into positions objects if missing, by normalizing existing roleShort/role/name heuristically
-- NOTE: since positions is JSONB array, we transform each element

DO $$
DECLARE
  rec RECORD;
  new_positions JSONB;
BEGIN
  FOR rec IN SELECT id, positions FROM public.custom_formations LOOP
    new_positions := (
      SELECT jsonb_agg(
        CASE WHEN (pos->>'role_code') IS NOT NULL THEN pos
             ELSE (
               pos || jsonb_build_object('role_code', (
                 CASE
                   -- direct codes
                   WHEN lower(coalesce(pos->>'role_code','')) IN ('p','td','dc','dcd','dcs','ts','med','reg','mc','md','ms','qd','qs','att','pu','ad','as') THEN upper(pos->>'role_code')
                   WHEN lower(coalesce(pos->>'roleShort','')) IN ('p','td','dc','dcd','dcs','ts','med','reg','mc','md','ms','qd','qs','att','pu','ad','as') THEN upper(pos->>'roleShort')
                   WHEN lower(coalesce(pos->>'role','')) IN ('p','td','dc','dcd','dcs','ts','med','reg','mc','md','ms','qd','qs','att','pu','ad','as') THEN upper(pos->>'role')
                   -- heuristics by text
                   WHEN (pos->>'role') ILIKE '%port%' OR (pos->>'name') ILIKE '%port%' THEN 'P'
                   WHEN (pos->>'role') ILIKE '%goal%' OR (pos->>'name') ILIKE '%goal%' THEN 'P'
                   WHEN (pos->>'role') ILIKE '%terzino dest%' OR (pos->>'name') ILIKE '%terzino dest%' THEN 'TD'
                   WHEN (pos->>'role') ILIKE '%terzino sin%' OR (pos->>'name') ILIKE '%terzino sin%' THEN 'TS'
                   WHEN (pos->>'role') ILIKE '%centrale dest%' OR (pos->>'name') ILIKE '%centrale dest%' OR (pos->>'role') ILIKE '%dcd%' THEN 'DCD'
                   WHEN (pos->>'role') ILIKE '%centrale sin%' OR (pos->>'name') ILIKE '%centrale sin%' OR (pos->>'role') ILIKE '%dcs%' THEN 'DCS'
                   WHEN (pos->>'role') ILIKE '%difensore%' OR (pos->>'name') ILIKE '%difensore%' OR (pos->>'role') ILIKE '%centrale%' THEN 'DC'
                   WHEN (pos->>'role') ILIKE '%mediano%' OR (pos->>'name') ILIKE '%mediano%' THEN 'MED'
                   WHEN (pos->>'role') ILIKE '%regista%' OR (pos->>'name') ILIKE '%regista%' THEN 'REG'
                   WHEN (pos->>'role') ILIKE '%mezzala dx%' OR (pos->>'name') ILIKE '%mezzala dx%' OR (pos->>'role') ILIKE '%md%' THEN 'MD'
                   WHEN (pos->>'role') ILIKE '%mezzala sx%' OR (pos->>'name') ILIKE '%mezzala sx%' OR (pos->>'role') ILIKE '%ms%' THEN 'MS'
                   WHEN (pos->>'role') ILIKE '%mezzala%' OR (pos->>'name') ILIKE '%mezzala%' OR (pos->>'role') ILIKE '%interno%' THEN 'MC'
                   WHEN (pos->>'role') ILIKE '%quinto dx%' OR (pos->>'name') ILIKE '%quinto dx%' OR (pos->>'role') ILIKE '%rwb%' THEN 'QD'
                   WHEN (pos->>'role') ILIKE '%quinto sx%' OR (pos->>'name') ILIKE '%quinto sx%' OR (pos->>'role') ILIKE '%lwb%' THEN 'QS'
                   WHEN (pos->>'role') ILIKE '%punta%' OR (pos->>'name') ILIKE '%punta%' OR (pos->>'role') ILIKE '%centravanti%' THEN 'PU'
                   WHEN (pos->>'role') ILIKE '%ala dx%' OR (pos->>'name') ILIKE '%ala dx%' OR (pos->>'role') ILIKE '% ad %' THEN 'AD'
                   WHEN (pos->>'role') ILIKE '%ala sx%' OR (pos->>'name') ILIKE '%ala sx%' OR (pos->>'role') ILIKE '% as %' THEN 'AS'
                   WHEN (pos->>'role') ILIKE '%attacc%' OR (pos->>'name') ILIKE '%attacc%' OR (pos->>'role') ILIKE '%trequart%' THEN 'ATT'
                   ELSE 'ALTRI'
                 END
               ))
             )
        END
      )
      FROM jsonb_array_elements(rec.positions) AS pos
    );

    UPDATE public.custom_formations
    SET positions = new_positions
    WHERE id = rec.id;
  END LOOP;
END$$;