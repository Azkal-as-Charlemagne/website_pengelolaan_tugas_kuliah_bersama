create role 'backend_application1'@'%';
grant select, insert, update, delete on tidb_db.* to 'backend_application1'@'%';
create user 'PLsVPbUUijTWiM3.backend_writer'@'%' identified by '5&hAE#6L97*@V^@56u';
grant 'backend_application1'@'%' to 'PLsVPbUUijTWiM3.backend_writer'@'%';
set default role 'backend_application1'@'%' to 'PLsVPbUUijTWiM3.backend_writer'@'%';
