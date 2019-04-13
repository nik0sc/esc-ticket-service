-- ticket.lepak.sg:17765/ticket1

drop database `ticket1`;
create database `ticket1`
	character set utf8mb4 
	collate utf8mb4_unicode_ci;
use `ticket1`;

create table tickets (
	id integer primary key auto_increment,
    title varchar(100) not null,
    message text not null,
    response text,
    open_time datetime not null,				-- UTC
    close_time datetime,						-- UTC
    priority integer,
    severity integer,
    opener_user varchar(20) not null,           -- acn_id
    assigned_team integer,
    status_flag integer not null default 0      -- Bitfield-like
    -- There used to be foreign key constraints here. What happened??
);

create table attachments (
	id integer primary key auto_increment,
    title varchar(100) not null,
    fs_path varchar(1000) not null,			-- Make sure filesystem and db are consistent (how?)
    upload_time datetime not null,
    ticket_id integer,						-- Careful with this: orphaned attachments that are too old should be deleted (cron job?)
    foreign key fk_attachments_tickets_id (ticket_id) references tickets(id)
        on delete restrict,     -- Need to delete attachment from fs first!
    uploader_user integer not null
);
