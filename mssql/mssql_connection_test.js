const sql = require('mssql');

const config = {
    user:"svc_MESSAP",
    password: "jNob7DBQRMImVjL",
    server: "io-sql-mes01",
    database: "DocGen",
    options:{
        encrypt: false,
        trustServerCertificate: false
    }	
};

async function connectToDatabase(){
    try {
        await sql.connect(config);
        console.log(" Connected successfully to the database.");
        const result = await sql.query("SELECT * FROM dbo.test_table");
        console.log(result.recordset);
    }catch(err){
        console.error("Error connecting to the database:", err);
    }finally{
        sql.close();
    }
}

connectToDatabase();

