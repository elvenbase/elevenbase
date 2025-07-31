-- Aggiorna le policies per la tabella profiles per permettere l'inserimento

-- Elimina la policy esistente di inserimento se esiste
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Crea una nuova policy che permette agli admin e superadmin di inserire profili
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Permetti anche agli utenti di inserire il proprio profilo (per compatibilità)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Aggiorna anche la policy di update per gli admin
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);