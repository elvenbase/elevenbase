-- Update user role from player to superadmin for Admincarissi
UPDATE user_roles 
SET role = 'superadmin' 
WHERE user_id = '64decf34-592c-41b9-bba5-2ab909569fe3';