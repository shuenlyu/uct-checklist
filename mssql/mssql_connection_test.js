const sql = require('mssql');
require("dotenv").config({path: `.env.${process.env.NODE_ENV || 'development'}`,});

const config = {
    user:process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options:{
        encrypt: false,
        trustServerCertificate: false
    }	
};

async function connectToDatabase(){
    try {
        await sql.connect(config);
        console.log(" Connected successfully to the database.");
        const result = await sql.query("SELECT * FROM dbo.surveys");
        console.log(result.recordset);
    }catch(err){
        console.error("Error connecting to the database:", err);
    }finally{
        sql.close();
    }
}

connectToDatabase();

