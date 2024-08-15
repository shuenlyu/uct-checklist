const pgp = require("pg-promise")(/*options*/);
require("dotenv").config();

function envToBool(variable) {
  return variable === "true";
}

const databaseConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};
const DEBUG = envToBool(process.env.DEBUG);

class PostgresDBAdapter {
  constructor() {
    if (!PostgresDBAdapter.instance) {
      this.db = pgp(databaseConfig);
      PostgresDBAdapter.instance = this;
    }
    return PostgresDBAdapter.instance;
  }

  getObjectFromStorage(tableName) {
    if (DEBUG) console.log("------ getObjectFromStorage invoke!");
    return this.db.any("SELECT * FROM ${tableName:name}", { tableName });
  }

  addSurvey(name, customer, product, id, userId) {
    if (DEBUG) console.log("------ addSurvey invoke!");
    return this.db.one(
      "INSERT INTO public.surveys (id, name, customer, prod_line, json, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, name, customer, product, "{}", userId]
    );
  }

  getSurvey(surveyId, user) {
    if (DEBUG) console.log("------ getSurvey invoke!");
    let query = "SELECT * FROM public.surveys WHERE id=$1";
    let params = [surveyId];
    // if (user.role !== "ADMIN"){
    //   query += " AND user_id = $2";
    //   params.push(user.email);
    // }
    if (DEBUG) {
      console.log("getSurvey surveyId, user: ", surveyId, user);
      console.log("getSurvey query and params: ", query, params);
    }
    return this.db.one(query, params);
  }

  getResults(postId) {
    if (DEBUG) console.log("------ getResults invoke!");
    return this.db.any("SELECT * FROM public.results WHERE postid=$1", [
      postId,
    ]);
    // .then(data=> data.map(item=>item.json));
  }

  postResults(postId, json) {
    if (DEBUG) console.log("------ postResults invoke!");
    return this.db.one(
      "INSERT INTO public.results (postid, json) VALUES($1, $2) RETURNING json",
      [postId, json]
    );
  }

  addImage(name, email) {
    if (DEBUG) console.log("------ addImage invoke!");
    return this.db.one(
      "INSERT INTO files (name, email) VALUES($1, $2) RETURNING *",
      [name, email]
    );
  }

  getImages() {
    if (DEBUG) console.log("------ getImages invoke!");
    return this.db.any("SELECT * FROM files");
  }

  deleteSurvey(surveyId, user) {
    if (DEBUG)
      console.log("------ deleteSurvey invoke! surveyId, user", surveyId, user);
    // Define the base query and common parameters
    let query = "DELETE FROM public.surveys WHERE id=$1";
    let params = [surveyId];

    // Conditionally add constraints based on user role
    // if (user.role !== "ADMIN") {
    //     // Make sure this matches the expected column data type
    //     query += " AND user_id = $2";
    //     params.push(user.id); // Assuming user.id is the correct identifier for user_id column
    // }

    // Always return the deleted record
    query += " RETURNING *";
    if (DEBUG) {
      console.log("Running query:", query);
      console.log("With parameters:", params);
    }
    return this.db.oneOrNone(query, params);
  }

  updateSurvey(id) {
    if (DEBUG) console.log("------ updateSurvey invoke!");
    return this.db
      .tx((t) => {
        return t.batch([
          t.none("UPDATE public.surveys SET available = FALSE WHERE id <> $1", [
            id,
          ]),
          t.one(
            "UPDATE public.surveys SET available = TRUE WHERE id = $1 RETURNING *",
            [id]
          ),
        ]);
      })
      .then((data) => data[1]); // Return the result of the second query
  }

  changeName(id, name, customer, product) {
    if (DEBUG) console.log("------ changeName invoke!");
    return this.db.one(
      "UPDATE public.surveys SET name = $1, customer = $2, prod_line = $3 WHERE id = $4 RETURNING *",
      [name, customer, product, id]
    );
  }

  storeSurvey(id, json) {
    if (DEBUG) console.log("------ storeSurvey invoke!", id, json);
    return this.db.one(
      "UPDATE public.surveys SET json = $1 WHERE id = $2 RETURNING *",
      [json, id]
    );
  }

  duplicateSurvey(name, customer, product, json, id, userId) {
    if (DEBUG) console.log("------ DB:duplicateSurvey invoke!");
    return this.db.one(
      "INSERT INTO public.surveys (id, name, customer, prod_line, json, user_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, name, customer, product, json, userId]
    );
  }

  getSurveys(user) {
    if (DEBUG) console.log("------ getSurveys invoke!", user);
    // return this.db.any(query);
    let query = "SELECT * FROM public.surveys";
    let params = [];
    // if (user.role !== 'ADMIN') {
    //   query += ' WHERE user_id = $1';
    //   params.push(user.email);
    // }
    return this.db.any(query, params);
  }
}
const instance = new PostgresDBAdapter();
module.exports = instance;
