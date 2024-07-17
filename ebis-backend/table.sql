
create table user(
    id int primary key AUTO_INCREMENT,
    name varchar(250),
    contactNumber varchar(20),
    email varchar(60),
    password varchar(250),
    status varchar(20), 
    role varchar(20),
    UNIQUE (email)
); 

insert into user(name,contactNumber,email,password,status,role) values('Admin','76397079','sims@karooz.co.za','admin','true','admin'); 

create table category(
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    primary key(id)
);

create table announcement(
    id int primary key AUTO_INCREMENT,
    title varchar(255) NOT NULL,
    content LONGTEXT NOT NULL,
    categoryId integer NOT NULL,
    publication_date DATE NOT NULL,
    expiry_date DATE,
    Price integer,
    status varchar(25)
);

create table invoice(
    id int NOT NULL AUTO_INCREMENT, 
    uuid varchar(200) NOT NULL,
    invoice_date DATE,
    name varchar(255) NOT NULL,
    title VARCHAR(300),
    email varchar(255) NOT NULL,
    contactNumber varchar(20) NOT NULL,
    total int NOT NULL,
    announcementDetails JSON DEFAULT NULL,
    createdBy varchar(255) NOT NULL,
    primary KEY(id)
);
