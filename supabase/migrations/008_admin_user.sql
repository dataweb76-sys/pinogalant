-- Crear o actualizar usuario admin (propietaria)
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Si el usuario ya existe en auth.users, solo actualizar el perfil:
insert into public.profiles (id, role, full_name)
select id, 'super_admin', 'Pino Galant Admin'
from auth.users
where email = 'pinogalantbr@gmail.com'
on conflict (id) do update set role = 'super_admin';

-- 2. Si el usuario NO existe, crearlo via Supabase Auth Admin API (hacer desde dashboard):
--    Dashboard > Authentication > Users > Invite user
--    Email: pinogalantbr@gmail.com
--    Luego correr el INSERT de profiles de arriba.

-- Verificar:
-- select u.email, p.role from auth.users u join public.profiles p on p.id = u.id where u.email = 'pinogalantbr@gmail.com';
