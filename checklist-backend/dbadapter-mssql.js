const sql = require("mssql");
// select which env file, either .env.development and .env.production
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

function envToBool(variable){
  return variable === 'true'
}

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

const DEBUG = envToBool(process.env.DEBUG);

class MSSQLDBAdapter{
  constructor(){
    if(!MSSQLDBAdapter.instance){
      this.poolPromise = new sql.ConnectionPool(databaseConfig).connect();
      MSSQLDBAdapter.instance=this;
    }
    return MSSQLDBAdapter.instance;
  }

  async query(sqlQuery, inputParams=[]){
    const pool = await this.poolPromise;
    const request = pool.request();
    inputParams.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    if(DEBUG)console.log("-----mssql query before: sqlQuery, inputParams: ", sqlQuery, inputParams);
    try{
      const result = await request.query(sqlQuery);
      if(DEBUG)console.log("------mssql query result: ", result);
      return result.recordset;
    }catch(error){
      throw new Error(error.message);
    }
  }

  async getObjectFromStorage(tableName){
    if(DEBUG)console.log("------ mssql: getObjectFromStorage invoke!");
    return this.query(`SELECT * FROM ${tableName}`);
  }

  async addSurvey(name, customer, product, id, userId){
    if(DEBUG)console.log("------ mssql: addSurvey invoke!");
    return this.query(
      "INSERT INTO surveys (id, name, customer, prod_line, json, user_id) VALUES(@id, @name, @customer, @prod_line, '{}', @user_id); SELECT * FROM surveys WHERE id = @id;",
      [
        { name: 'id', type: sql.UniqueIdentifier, value: id },
        { name: 'name', type: sql.NVarChar, value: name },
        { name: 'customer', type: sql.NVarChar, value: customer },
        { name: 'prod_line', type: sql.NVarChar, value: product },
        { name: 'user_id', type: sql.NVarChar, value: userId }
      ]
    ); 
  }    

  async getSurvey(surveyId, user){
    if(DEBUG)console.log("------ mssql: getSurvey invoke!");
    let query = "SELECT * FROM surveys WHERE id = @surveyId";
    const params = [{name:"surveyId", type:sql.UniqueIdentifier, value:surveyId}];

    if (user.role !== "ADMIN"){
      query += " AND user_id = @userId";
      params.push({name:'userId', type:sql.NVarChar, value:user.email});
    }
    if(DEBUG){
      console.log("getSurvey surveyId, user: ", surveyId, user);
      console.log("getSurvey query and params: ", query);
    }
    return this.query(query, params);
  }

  async getResults(postId){
    if(DEBUG)console.log("------ mssql: getResults invoke!");
    return this.query(
      "SELECT * FROM results WHERE postid = @postId",
      [{ name: 'postId', type: sql.NVarChar, value: postId }]
    );
  }    

  async postResults(postId, json) {
    if(DEBUG)console.log("------ mssql: postResults invoke!");
    const json_str = JSON.stringify(json);
    return this.query(
      "INSERT INTO results (postid, json) VALUES(@postId, @json); SELECT json FROM results WHERE postid = @postId AND json = @json;",
      [
        { name: 'postId', type: sql.NVarChar, value: postId },
        { name: 'json', type: sql.NVarChar, value: json_str }
      ]
    );
  }

  async addImage(name, email) {
    if(DEBUG)console.log("------ mssql: addImage invoke!");
    return this.query(
      "INSERT INTO files (name, email) VALUES(@name, @email); SELECT * FROM files WHERE name = @name AND email = @email;",
      [
        { name: 'name', type: sql.NVarChar, value: name },
        { name: 'email', type: sql.NVarChar, value: email }
      ]
    );
  }

  async getImages() {
    if(DEBUG)console.log("------ mssql: getImages invoke!");
    const pool = await this.poolPromise;
    return this.query("SELECT * FROM files");
  }

  async deleteSurvey(surveyId, user) {
    if(DEBUG)console.log("------ mssql: deleteSurvey invoke! surveyId, user", surveyId, user);
    let query = "DELETE FROM surveys WHERE id = @surveyId";
    const params = [
      { name: 'surveyId', type: sql.UniqueIdentifier, value: surveyId }
    ];

    if (user.role !== "ADMIN") {
      query += " AND user_id = @userId";
      params.push({ name: 'userId', type: sql.NVarChar, value: user.email });
    }

    query += "; SELECT * FROM surveys WHERE id = @surveyId;";
    return this.query(query, params);
  }    

  async updateSurvey(id) {
    if(DEBUG)console.log("------ mssql: updateSurvey invoke!");
    const query1 = "UPDATE surveys SET available = 0 WHERE id <> @id";
    const query2 = "UPDATE surveys SET available = 1 WHERE id = @id; SELECT * FROM surveys WHERE id = @id;";
    await this.query(query1, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
    return this.query(query2, [{ name: 'id', type: sql.UniqueIdentifier, value: id }]);
  }    

  async changeName(id, name, customer, product) {
    if(DEBUG)console.log("------ mssql: changeName invoke!");
    return this.query(
      "UPDATE surveys SET name = @name, customer = @customer, prod_line = @prod_line WHERE id = @id; SELECT * FROM surveys WHERE id = @id;",
      [
        { name: 'id', type: sql.UniqueIdentifier, value: id },
        { name: 'name', type: sql.NVarChar, value: name },
        { name: 'customer', type: sql.NVarChar, value: customer },
        { name: 'prod_line', type: sql.NVarChar, value: product }
      ]
    );
  }    

  async storeSurvey(id, json) {
    if(DEBUG)console.log("------ mssql: storeSurvey invoke!",id, json);
    const json_str = JSON.stringify(json);
    return this.query(
      "UPDATE surveys SET json = @json WHERE id = @id; SELECT * FROM surveys WHERE id = @id;",
      [
        { name: 'id', type: sql.UniqueIdentifier, value: id },
        { name: 'json', type: sql.NVarChar, value: json_str }
      ]
    );
  }    

  async duplicateSurvey(name, customer, product, json, id, userId) {
    if(DEBUG)console.log("------ mssql: DB:duplicateSurvey invoke!");
    // const json_str = JSON.stringify(json);

    return this.query(
      "INSERT INTO surveys (id, name, customer, prod_line, json, user_id) VALUES(@id, @name, @customer, @prod_line, @json, @userId); SELECT * FROM surveys WHERE id = @id;",
      [
        { name: 'id', type: sql.UniqueIdentifier, value: id },
        { name: 'name', type: sql.NVarChar, value: name },
        { name: 'customer', type: sql.NVarChar, value: customer },
        { name: 'prod_line', type: sql.NVarChar, value: product },
        { name: 'json', type: sql.NVarChar, value: json },
        { name: 'userId', type: sql.NVarChar, value: userId }
      ]
    );
  }    

  async getSurveys(user) {
    if(DEBUG)console.log("------ mssql: getSurveys invoke!", user);
    const query = user.role !== 'ADMIN' ? "SELECT * FROM surveys WHERE user_id = @userId" : "SELECT * FROM surveys";
    const params = user.role !== 'ADMIN' ? [{ name: 'userId', type: sql.NVarChar, value: user.email }] : [];
    return this.query(query, params);
  }    
}
const instance = new MSSQLDBAdapter();
module.exports = instance;
