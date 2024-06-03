const { pool } = require("mssql");

const sql = require("mssql")(/*options*/);
require("dotenv").config();

const databaseConfig = {
    user:process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options:{
        encrypt: false,
        trustServerCertificate: false
    }	
};

const DEBUG = true;

class MSSQLDBAdapter{
  constructor(){
    if(!MSSQLDBAdapter.instance){
      this.poolPromise = new sql.ConnectionPool(databaseConfig).connect();
      MSSQLDBAdapter.instance=this;
    }
    return MSSQLDBAdapter.instance;
  }

  async getObjectFromStorage(tableName){
    if(DEBUG)console.log("------ getObjectFromStorage invoke!");
    const pool = await this.poolPromise;
    return pool.request().query(`SELECT * FROM ${tableName}`);
  }

  async addSurvey(name, customer, product, id, userId){
    if(DEBUG)console.log("------ addSurvey invoke!");
    const pool = await this.poolPromise;
    return pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('name', sql.NVarChar, name)
      .input('customer', sql.NVarChar, customer)
      .input('prod_line', sql.NVarChar, product)
      .input('user_id', sql.NVarChar, userId)
      .query("INSERT INTO surveys (id, name, customer, prod_line, json, user_id) VALUES(@id, @name, @customer, @prod_line, '{}', @user_id); SELECT * FROM surveys WHERE id = @id;");
  }    

  async getSurvey(surveyId, user){
    if(DEBUG)console.log("------ getSurvey invoke!");
    const pool = await this.poolPromise;
    let query = "SELECT * FROM surveys WHERE id = @surveyId";
    const request = pool.request().input("surveyId", sql.UniqueIdentifier, surveyId);

    if (user.role !== "ADMIN"){
      query += " AND user_id = $2";
      request.input('userId', sql.NVarChar, user.email);
    }
    if(DEBUG){
      console.log("getSurvey surveyId, user: ", surveyId, user);
      console.log("getSurvey query and params: ", query);
    }
    return request.query(query);
  }

  async getResults(postId){
    if(DEBUG)console.log("------ getResults invoke!");
    const pool = await this.poolPromise;
    return pool.request()
    .input('postId', sql.NVarChar, postId)
    .query("SELECT * FROM results WHERE postid = @postId")
    .then(result => result.recordset.map(item => item.json));
  }

  async postResults(postId, json) {
    if(DEBUG)console.log("------ postResults invoke!");
    const pool = await this.poolPromise;
    return pool.request()
    .input('postId', sql.NVarChar, postId)
    .input('json', sql.NVarChar, json)
    .query("INSERT INTO results (postid, json) VALUES(@postId, @json); SELECT json FROM results WHERE postid = @postId AND json = @json;");
  }

  async addImage(name, email) {
    if(DEBUG)console.log("------ addImage invoke!");
    const pool = await this.poolPromise;
    return pool.request()
    .input('name', sql.NVarChar, name)
    .input('email', sql.NVarChar, email)
    .query("INSERT INTO files (name, email) VALUES(@name, @email); SELECT * FROM files WHERE name = @name AND email = @email;");
  }

  async getImages() {
    if(DEBUG)console.log("------ getImages invoke!");
    const pool = await this.poolPromise;
    return pool.request().query("SELECT * FROM files");
  }

  async deleteSurvey(surveyId, user) {
    if(DEBUG)console.log("------ deleteSurvey invoke! surveyId, user", surveyId, user);
    const pool = await this.poolPromise;
    let query = "DELETE FROM surveys WHERE id = @surveyId";
    const request = pool.request().input('surveyId', sql.UniqueIdentifier, surveyId);
    if(user.role !== "ADMIN"){
      query = " AND user_id = @userId";
      request.input('userId', sql.NVarChar, user.email);
    }
    query += "; SELECT * FROM surveys WHERE id = @surveyId;"
    return request.query(query);
  }

  async updateSurvey(id) {
    if(DEBUG)console.log("------ updateSurvey invoke!");
    const pool = await this.poolPromise;
    return pool.transaction(async trx => {
      await trx.request().input('id', sql.UniqueIdentifier, id).query("UPDATE surveys SET available = 0 WHERE id <> @id");
      return trx.request().input('id', sql.UniqueIdentifier, id).query("UPDATE surveys SET available = 1 WHERE id = @id; SELECT * FROM surveys WHERE id = @id;");
    }); // Return the result of the second query
  }

  async changeName(id, name, customer, product) {
    if(DEBUG)console.log("------ changeName invoke!");
    const pool = await this.poolPromise;
    return pool.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('name', sql.NVarChar, name)
    .input('customer', sql.NVarChar, customer)
    .input('prod_line', sql.NVarChar, product)
    .query("UPDATE surveys SET name = @name, customer=@customer, prod_line=@prod_line WHERE id = @id; SELECT * FROM surveys WHERE id = @id;");
  }

  async storeSurvey(id, json) {
    if(DEBUG)console.log("------ storeSurvey invoke!",id, json);
    const pool = await this.poolPromise;
    return pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .input("json", sql.NVarChar, json)
    .query("UPDATE surveys SET json=@json WHERE id = @id; SELECT * FROM surveys WHERE id=@id;");
  }

  async duplicateSurvey(name, customer, product, json, id, userId) {
    if(DEBUG)console.log("------ DB:duplicateSurvey invoke!");
    const pool = this.poolPromise;
    return pool.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('name', sql.NVarChar, name)
    .input('customer', sql.NVarChar, customer)
    .input('prod_line', sql.NVarChar, product)
    .input('json', sql.NVarChar, json)
    .input('userId', sql.NVarChar, userId)
    .query("INSERT INTO surveys (id, name, customer, prod_line, json, user_id) VALUES(@id, @name,@customer, @prod_line, @json, @userId); SELECT * FROM surveys WHERE id = @id;"); 
  }

  async getSurveys(user) {
    if(DEBUG)console.log("------ getSurveys invoke!", user);
    const pool = await this.poolPromise;
    let query = 'SELECT * FROM public.surveys';
    const request = pool.request();

    if (user.role !== 'ADMIN') {
      query += ' WHERE user_id = @userId';
      request.input('userId', sql.NVarChar, user.email);
    }
    return request.query(query);
  }
  
}
const instance = new MSSQLDBAdapter();
module.exports = instance;
