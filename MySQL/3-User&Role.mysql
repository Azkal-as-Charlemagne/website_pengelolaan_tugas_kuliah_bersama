create role 'backend_application1'@'%';
grant select, insert, update, delete on database.* to 'backend_application1'@'%';
create user 'backend_writer'@'%' identified by '';
grant 'backend_application1'@'%' to 'backend_writer'@'%';
set default role 'backend_application1'@'%' to 'backend_writer'@'%';
