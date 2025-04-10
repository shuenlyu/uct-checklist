const sql = require("mssql");
// select which env file, either .env.development and .env.production
require("dotenv").config();

function envToBool(variable) {
  return variable === "true";
}

const databaseConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: false,
  },
};

const DEBUG = envToBool(process.env.DEBUG);

class MSSQLDBAdapter {
  constructor() {
    if (!MSSQLDBAdapter.instance) {
      this.poolPromise = new sql.ConnectionPool(databaseConfig).connect();
      MSSQLDBAdapter.instance = this;
    }
    return MSSQLDBAdapter.instance;
  }

  async query(sqlQuery, inputParams = []) {
    const pool = await this.poolPromise;
    const request = pool.request();
    inputParams.forEach((param) => {
      request.input(param.name, param.type, param.value);
    });
    if (DEBUG)
      console.log(
        "-----mssql query before: sqlQuery, inputParams: ",
        sqlQuery,
        inputParams
      );
    try {
      const result = await request.query(sqlQuery);
      // if (DEBUG) console.log("------mssql query result: ", result);
      return result.recordset;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getObjectFromStorage(tableName) {
    if (DEBUG) console.log("------ mssql: getObjectFromStorage invoke!");
    return this.query(`SELECT * FROM ${tableName}`);
  }

  async addSurvey(name, customer, product, folder_id, id, userId, user_group) {
    if (DEBUG) console.log("------ mssql: addSurvey invoke!");
    return this.query(
      "INSERT INTO surveys (id, name, customer, prod_line, folder_id, json, user_id, groups) VALUES(@id, @name, @customer, @prod_line, @folder_id, '{}', @user_id, @user_group); SELECT * FROM surveys WHERE id = @id;",
      [
        { name: "id", type: sql.UniqueIdentifier, value: id },
        { name: "name", type: sql.NVarChar, value: name },
        { name: "customer", type: sql.NVarChar, value: customer },
        { name: "prod_line", type: sql.NVarChar, value: product },
        { name: "folder_id", type: sql.Int, value: folder_id },
        { name: "user_id", type: sql.NVarChar, value: userId },
        { name: "user_group", type: sql.NVarChar, value: user_group },
      ]
    );
  }

  async getSurvey(surveyId, user) {
    if (DEBUG) console.log("------ mssql: getSurvey invoke!");
    let query = "SELECT * FROM surveys WHERE id = @surveyId";
    const params = [
      { name: "surveyId", type: sql.UniqueIdentifier, value: surveyId },
    ];

    // if (user.role !== "ADMIN"){
    //   query += " AND user_id = @userId";
    //   params.push({name:'userId', type:sql.NVarChar, value:user.email});
    // }
    if (DEBUG) {
      console.log("getSurvey surveyId, user: ", surveyId, user);
      console.log("getSurvey query and params: ", query);
    }
    return this.query(query, params);
  }

  async getTheme(surveyId, user) {
    if (DEBUG) console.log("------ mssql: getTheme invoke!");
    let query = "SELECT * FROM theme WHERE id = @surveyId";
    const params = [
      { name: "surveyId", type: sql.UniqueIdentifier, value: surveyId },
    ];
    if (DEBUG) {
      console.log("getTheme surveyId, user: ", surveyId, user);
      console.log("getTheme query and params: ", query);
    }
    return this.query(query, params);
  }

  async getResults(postId) {
    if (DEBUG) console.log("------ mssql: getResults invoke!");
    return this.query("SELECT * FROM results WHERE postid = @postId", [
      { name: "postId", type: sql.NVarChar, value: postId },
    ]);
  }

  async postResults(postId, json, userId, createdAt) {
    if (DEBUG) console.log("------ mssql: postResults invoke!");
    const json_str = JSON.stringify(json);
    return this.query(
      "INSERT INTO results (postid, json, submittedBy, createdAt) VALUES(@postId, @json, @userId, @createdAt); SELECT json FROM results WHERE postid = @postId AND json = @json AND submittedBy=@userId AND createdAt=@createdAt;",
      [
        { name: "postId", type: sql.NVarChar, value: postId },
        { name: "json", type: sql.NVarChar, value: json_str },
        { name: "userId", type: sql.VarChar, value: userId },
        { name: "createdAt", type: sql.DateTime, value: createdAt },
      ]
    );
  }

  async addImage(name, email) {
    if (DEBUG) console.log("------ mssql: addImage invoke!");
    return this.query(
      "INSERT INTO files (name, email) VALUES(@name, @email); SELECT * FROM files WHERE name = @name AND email = @email;",
      [
        { name: "name", type: sql.NVarChar, value: name },
        { name: "email", type: sql.NVarChar, value: email },
      ]
    );
  }

  async getImages() {
    if (DEBUG) console.log("------ mssql: getImages invoke!");
    const pool = await this.poolPromise;
    return this.query("SELECT * FROM files");
  }

  async deleteSurvey(surveyId, user) {
    if (DEBUG)
      console.log(
        "------ mssql: deleteSurvey invoke! surveyId, user",
        surveyId,
        user
      );
    let query = "DELETE FROM surveys WHERE id = @surveyId";
    const params = [
      { name: "surveyId", type: sql.UniqueIdentifier, value: surveyId },
    ];

    // if (user.role !== "ADMIN") {
    //   query += " AND user_id = @userId";
    //   params.push({ name: 'userId', type: sql.NVarChar, value: user.email });
    // }

    query += "; SELECT * FROM surveys WHERE id = @surveyId;";
    return this.query(query, params);
  }

  async updateSurvey(id) {
    if (DEBUG) console.log("------ mssql: updateSurvey invoke!");
    const query1 = "UPDATE surveys SET available = 0 WHERE id <> @id";
    const query2 =
      "UPDATE surveys SET available = 1 WHERE id = @id; SELECT * FROM surveys WHERE id = @id;";
    await this.query(query1, [
      { name: "id", type: sql.UniqueIdentifier, value: id },
    ]);
    return this.query(query2, [
      { name: "id", type: sql.UniqueIdentifier, value: id },
    ]);
  }

  async changeName(id, name, customer, product, folder_id, user_group) {
    if (DEBUG) console.log("------ mssql: changeName invoke!");
    return this.query(
      "UPDATE surveys SET name = @name, customer = @customer, prod_line = @prod_line, folder_id=@folder_id, groups=@user_group WHERE id = @id; SELECT * FROM surveys WHERE id = @id;",
      [
        { name: "id", type: sql.UniqueIdentifier, value: id },
        { name: "name", type: sql.NVarChar, value: name },
        { name: "customer", type: sql.NVarChar, value: customer },
        { name: "prod_line", type: sql.NVarChar, value: product },
        { name: "folder_id", type: sql.Int, value: folder_id },
        { name: "user_group", type: sql.NVarChar, value: user_group },
      ]
    );
  }

  async storeSurvey(id, json) {
    if (DEBUG) console.log("------ mssql: storeSurvey invoke!", id, json);
    const json_str = JSON.stringify(json);
    return this.query(
      "UPDATE surveys SET json = @json, updatedAt=@updatedAt WHERE id = @id; SELECT * FROM surveys WHERE id = @id;",
      [
        { name: "id", type: sql.UniqueIdentifier, value: id },
        { name: "json", type: sql.NVarChar, value: json_str },
        {
          name: "updatedAt",
          type: sql.DateTime,
          value: new Date().toISOString(),
        },
      ]
    );
  }

  async storeTheme(id, name, json) {
    if (DEBUG) console.log("------- mssql: storeTheme invoke!", id, name, json);
    const json_str = JSON.stringify(json);
    return this.query(
      `
    MERGE INTO theme AS target
    USING (SELECT @id AS id, @name AS name, @theme AS theme) AS source
    ON target.id = source.id
    WHEN MATCHED THEN
        UPDATE SET 
          theme = source.theme,
          name = source.name
    WHEN NOT MATCHED THEN
        INSERT (id, name, theme)
        VALUES (source.id, source.name, source.theme);
    SELECT * FROM theme WHERE id = @id;
  `,
      [
        { name: "id", type: sql.UniqueIdentifier, value: id },
        { name: "name", type: sql.NVarChar, value: name },
        { name: "theme", type: sql.NVarChar, value: json_str },
      ]
    );
  }

  async duplicateSurvey(
    name,
    customer,
    product,
    folder_id,
    json,
    id,
    userId,
    user_group
  ) {
    if (DEBUG) console.log("------ mssql: DB:duplicateSurvey invoke!");
    // const json_str = JSON.stringify(json);

    return this.query(
      "INSERT INTO surveys (id, name, customer, prod_line, folder_id, json, user_id, groups) VALUES(@id, @name, @customer, @prod_line, @folder_id,  @json, @userId, @user_group); SELECT * FROM surveys WHERE id = @id;",
      [
        { name: "id", type: sql.UniqueIdentifier, value: id },
        { name: "name", type: sql.NVarChar, value: name },
        { name: "customer", type: sql.NVarChar, value: customer },
        { name: "prod_line", type: sql.NVarChar, value: product },
        { name: "folder_id", type: sql.Int, value: folder_id },
        { name: "json", type: sql.NVarChar, value: json },
        { name: "userId", type: sql.NVarChar, value: userId },
        { name: "user_group", type: sql.NVarChar, value: user_group },
      ]
    );
  }

  async getSurveys(user) {
    if (DEBUG) console.log("------ mssql: getSurveys invoke!", user);
    // const query = user.role !== 'ADMIN' ? "SELECT * FROM surveys WHERE user_id = @userId" : "SELECT * FROM surveys";
    // const params = user.role !== 'ADMIN' ? [{ name: 'userId', type: sql.NVarChar, value: user.email }] : [];
    const query = "SELECT * FROM surveys";
    const params = [];
    return this.query(query, params);
  }

  async getEmailList() {
    if (DEBUG) console.log("------ mssql: getEmailList invoke!");
    return this.query(
      "SELECT TOP (1000) [Email] FROM [MES].[dbo].[GLOB_User] where isActive = '1' and PlantCode = '6101'"
    );
  }

  //get Folders
  async getFolders() {
    if (DEBUG) console.log("------ mssql: getFolders invoke!");
    return this.query("SELECT * FROM folders");
  }
  //get folder files
  async getFolderFiles(folderId, user_group) {
    if (DEBUG) console.log("------ mssql: getFolderFiles invoke!");
    if (user_group === "ALL_SITES") {
      return this.query("SELECT * FROM surveys WHERE folder_id = @folderId", [
        { name: "folderId", type: sql.Int, value: folderId },
      ]);
    } else {
      return this.query(
        "SELECT * FROM surveys WHERE folder_id = @folderId AND groups = @user_group",
        [
          { name: "folderId", type: sql.Int, value: folderId },
          { name: "user_group", type: sql.NVarChar, value: user_group },
        ]
      );
    }
  }
  //update folder_id
  async moveSurvey(surveyId, targetFolderId) {
    if (DEBUG) console.log("------ mssql: moveSurvey invoke!");
    return this.query(
      "UPDATE surveys SET folder_id = @folderId WHERE id = @surveyId; SELECT * FROM surveys WHERE id = @surveyId;",
      [
        { name: "folderId", type: sql.Int, value: targetFolderId },
        { name: "surveyId", type: sql.UniqueIdentifier, value: surveyId },
      ]
    );
  }
  //delete folder
  async deleteFolder(folderId) {
    if (DEBUG) console.log("------ mssql: deleteFolder invoke!");
    return this.query("DELETE FROM folders WHERE id = @folderId", [
      { name: "folderId", type: sql.Int, value: folderId },
    ]);
  }

  //add folder
  async createFolder(name) {
    if (DEBUG) console.log("------ mssql: createFolder invoke!");
    return this.query(
      "INSERT INTO folders (name) VALUES(@name); SELECT * FROM folders WHERE name = @name;",
      [{ name: "name", type: sql.NVarChar, value: name }]
    );
  }
}
const instance = new MSSQLDBAdapter();
module.exports = instance;
