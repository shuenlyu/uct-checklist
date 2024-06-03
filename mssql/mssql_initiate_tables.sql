-- Using NEWID() for UUID generation in MSSQL
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'surveys')
CREATE TABLE surveys
(
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name NVARCHAR(MAX),
    json NVARCHAR(MAX),
    available BIT DEFAULT 0,
    customer NVARCHAR(255),
    prod_line NVARCHAR(255),
    user_id NVARCHAR(255)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'results')
CREATE TABLE results
(
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    postid NVARCHAR(MAX),
    json NVARCHAR(MAX)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'files')
CREATE TABLE files
(
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name NVARCHAR(MAX),
    email NVARCHAR(MAX)
);
