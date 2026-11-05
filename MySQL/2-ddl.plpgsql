create table user_authentication (
user_auth_id binary(16) primary key default (uuid_to_bin(uuid())),
email varchar(260) not null,
password_hash text not null,
created_at timestamp not null default current_timestamp,
password_reset_at timestamp null,
is_active boolean not null,

constraint uq_user_email unique (email),
constraint chk_user_email check (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table universities (
university_id binary(16) primary key default (uuid_to_bin(uuid())),
university_code varchar(30) not null,
university_source varchar(20) not null,
source_id varchar(100) not null,
university_name varchar(100) not null,
country_code varchar(5) not null, -- like 'IDN', 'SGP', 'USA', etc.
university_slug varchar(300) not null unique,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint uq_slug_university unique (university_slug),
constraint uq_university_comb unique (university_code, source_id, university_slug))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table faculties (
faculty_id binary(16) primary key default (uuid_to_bin(uuid())),
university_id binary(16) not null,
faculty_source varchar(20) not null,
faculty_source_id varchar(100) not null,
faculty_code varchar(30) not null,
faculty_name varchar(100) not null,
faculty_slug varchar(300) not null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint fk_faculty_university foreign key (university_id)
	references universities(university_id) on delete restrict,
constraint uq_faculty_code unique (faculty_code),
constraint uq_faculty_university_comb unique (university_id, faculty_source_id, faculty_slug))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table study_programs (
prodi_id binary(16) primary key default (uuid_to_bin(uuid())),
faculty_id binary(16) not null,
prodi_source varchar(20) not null,
prodi_source_id varchar(100) not null,
prodi_code varchar(30) not null,
prodi_name varchar(100) not null,
prodi_slug varchar(300) not null,
jenjang varchar(15) not null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint fk_prodi_faculty foreign key (faculty_id)
	references faculties(faculty_id) on delete restrict,
constraint uq_prodi_code unique (prodi_code),
constraint uq_prodi_faculty_comb unique (faculty_id, prodi_source_id, prodi_slug))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table user_profiles (
user_id binary(16) primary key default (uuid_to_bin(uuid())),
user_auth_id binary(16) not null,
front_name varchar(50) not null,
back_name varchar(50) not null,
username varchar(40) not null,
university_id binary(16) not null,
faculty_id binary(16) not null,
prodi_id binary(16) not null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,
avatar_url varchar(260) null,
theme enum('Light', 'Dark', 'System') not null default 'System',

constraint fk_user_auth foreign key (user_auth_id)
	references user_authentication(user_auth_id),
constraint fk_user_university foreign key (university_id)
	references universities(university_id),
constraint fk_user_faculty foreign key (faculty_id)
	references faculties(faculty_id) on delete restrict,
constraint fk_user_prodi foreign key (prodi_id)
	references study_programs(prodi_id) on delete restrict,
constraint uq_username unique (username),
constraint chk_regex_username check (username REGEXP '^[A-Za-z0-9_.-]+$'))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table mata_kuliah (
matkul_id binary(16) primary key default (uuid_to_bin(uuid())),
user_id binary(16) not null,
prodi_id binary(16) not null,
matkul_code varchar(30) not null,
matkul_name varchar(100) not null,
sks tinyint unsigned not null,
semester tinyint unsigned not null,
created_at timestamp not null default current_timestamp,

constraint fk_user_matkul foreign key (user_id)
	references user_profiles(user_id) on delete restrict,
constraint fk_matkul_prodi foreign key (prodi_id)
	references study_programs(prodi_id) on delete restrict,
constraint uq_matkul_code unique(matkul_code));

create table study_group (
group_id binary(16) primary key default (uuid_to_bin(uuid())),
matkul_id binary(16) not null,
created_by binary(16) not null,
group_name varchar(30) not null,
description varchar(250) null,
avatar_url varchar(260) null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint fk_matkul_group foreign key (matkul_id)
	references mata_kuliah(matkul_id) on delete restrict,
constraint fk_created_group foreign key (created_by)
	references user_profiles(user_id) on delete restrict)
ENGINE=InnoDB default CHARSET=utf8mb4;

create table group_member (
member_id binary(16) primary key default (uuid_to_bin(uuid())),
group_id binary(16) not null,
user_member binary(16) not null,
user_role enum('Admin', 'Member') not null default 'Member',
joined_method varchar(50) not null,
joined_at timestamp not null default current_timestamp,

constraint fk_user_member foreign key (user_member)
	references user_profiles(user_id) on delete restrict,
constraint fk_group_member foreign key (group_id)
	references study_group(group_id) on delete restrict)
ENGINE=InnoDB default CHARSET=utf8mb4;

create table universal_tasks (
task_id binary(16) primary key default (uuid_to_bin(uuid())),
user_id binary(16) null, -- untuk task personal
group_id binary(16) null, -- untuk task group
task_member binary(16) null, -- kalo baris tersebut adalah task group, maka wajib ada, tugas ini punya member siapa
matkul_id binary(16) not null,
created_by binary(16) not null,
task_title varchar(40) not null,
description varchar(250) null,
deadline datetime not null,
priority_status enum('Low', 'Medium', 'High', 'Urgent') not null default 'Medium',
task_status enum('Selesai', 'Belum Selesai') not null default 'Belum Selesai',
url_task_file varchar(300) null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint fk_user_task foreign key (user_id)
	references user_profiles(user_id) on delete restrict,
constraint fk_group_task foreign key (group_id)
	references study_group(group_id) on delete restrict,
constraint fk_task_member foreign key (task_member)
	references group_member(member_id) on delete restrict,
constraint fk_matkul_task foreign key (matkul_id)
	references mata_kuliah(matkul_id) on delete restrict,
constraint fk_created_task foreign key (created_by)
	references user_profiles(user_id) on delete restrict,
constraint chk_task_comb_identity check((user_id is not null and group_id is null and task_member is null)
	or (user_id is null and group_id is not null and task_member is not null)))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table universal_sub_task (
s_task_id binary(16) primary key default (uuid_to_bin(uuid())),
task_id binary(16) not null,
user_id binary(16) null, -- untuk sub task personal
group_id binary(16) null, -- untuk sub task group
s_task_member binary(16) null, -- jika baris tersebut adalah task group, maka wajib ada. untuk mengetahui tugas ini punya member siapa
matkul_id binary(16) not null,
created_by binary(16) not null,
s_task_title varchar(40) not null,
description varchar(250) null,
deadline datetime not null,
priority_status enum('Low', 'Medium', 'High', 'Urgent') not null default 'Medium',
s_task_status enum('Selesai', 'Belum Selesai') not null default 'Belum Selesai',
url_task_file varchar(300) null,
created_at timestamp not null default current_timestamp,
updated_at timestamp null,

constraint fk_s_task_task foreign key (task_id)
	references universal_tasks(task_id) on delete restrict,
constraint fk_user_s_task foreign key (user_id)
	references user_profiles(user_id) on delete restrict,
constraint fk_group_s_task foreign key (group_id)
	references study_group(group_id) on delete restrict,
constraint fk_s_task_member foreign key (s_task_member)
	references group_member(member_id) on delete restrict,
constraint fk_matkul_s_task foreign key (matkul_id)
	references mata_kuliah(matkul_id) on delete restrict,
constraint fk_created_s_task foreign key (created_by)
	references user_profiles(user_id) on delete restrict,
constraint chk_s_task_comb_identity check((user_id is not null and group_id is null and s_task_member is null)
	or (user_id is null and group_id is not null and s_task_member is not null)))
ENGINE=InnoDB default CHARSET=utf8mb4;

create table commentars (
commentar_id binary(16) primary key default (uuid_to_bin(uuid())),
user_id binary(16) not null,
task_id binary(16) null,
s_task_id binary(16) null,
commentar varchar(250) not null,
created_at timestamp not null default current_timestamp,
reply_id binary(16) null,
reply_count int null,

constraint fk_user_commentar foreign key (user_id)
	references user_profiles(user_id) on delete restrict,
constraint fk_task_commentat foreign key (task_id)
	references universal_tasks(task_id) on delete restrict,
constraint fk_s_task_commentar foreign key (s_task_id)
	references universal_sub_task(s_task_id) on delete restrict,
constraint fk_reply_commentar foreign key (reply_id)
	references commentars(commentar_id),
constraint chk_commentar_identity_comb check ((user_id is not null and task_id is not null and s_task_id is null)
	or (user_id is not null and task_id is null and s_task_id is not null)))
ENGINE=InnoDB default CHARSET=utf8mb4;
