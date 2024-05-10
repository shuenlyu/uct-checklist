-- CREATE surveys table 
-- CREATE TABLE IF NOT EXISTS public.surveys
-- (
--     id uuid NOT NULL DEFAULT uuid_generate_v1(),
--     name text,
--     json text,
--     available boolean DEFAULT false;

-- )
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
CREATE TABLE IF NOT EXISTS public.surveys
(
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    name text COLLATE pg_catalog."default",
    json text COLLATE pg_catalog."default",
    available BOOLEAN DEFAULT FALSE,
    customer VARCHAR(255) COLLATE pg_catalog."default",
    prod_line VARCHAR(255) COLLATE pg_catalog."default",
    user_id VARCHAR(255) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
)
 
TABLESPACE pg_default;
 
ALTER TABLE public.surveys
    OWNER to postgres;
 
CREATE TABLE IF NOT EXISTS public.results
(
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    postid text COLLATE pg_catalog."default",
    json text COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;
 
ALTER TABLE public.results
    OWNER to postgres;
 
CREATE TABLE IF NOT EXISTS public.files(
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    name text COLLATE pg_catalog."default",
    email text COLLATE pg_catalog."default"
)
 
TABLESPACE pg_default;