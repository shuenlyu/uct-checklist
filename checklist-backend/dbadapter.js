var pgp = require("pg-promise")(/*options*/);
require("dotenv").config();

const databaseConfig = {
  host: "10.6.2.41",
  database: "retool_dev",
  user: "postgres",
  password: "Uct123!",
  port: 5432,
};

function PostgresDBAdapter() {
  var db = pgp(databaseConfig);

  //  function PostgresDBAdapter() {
  //    var db = pgp(
  //     process.env.DATABASE_URL ||
  //       "jdbc:postgresql://34.142.138.229:5432/postgres"
  //   );

  function getObjectFromStorage(tableName, callback) {
    db.any("SELECT * FROM " + tableName).then(function (result) {
      callback(result);
    });
  }

  function addSurvey(name, customer, product, id, callback) {
    db.one(
      "INSERT INTO public.surveys (id, name, customer, prod_line, json) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [id, name, customer, product, "{}"]
    ).then(callback);
  }

  function getSurvey(surveyId, callback) {
    db.one("SELECT * FROM public.surveys WHERE id=$1", [surveyId]).then(
      callback
    );
  }

  function duplicateSurvey(name, customer, product, json, id, callback) {
    db.one(
      "INSERT INTO public.surveys (id, name, customer, prod_line, json) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [id, name, customer, product, json]
    ).then(callback);
  }

  function getSurvey(surveyId, callback) {
    db.one("SELECT * FROM public.surveys WHERE id=$1", [surveyId]).then(
      callback
    );
  }

  function getResults(postId, callback) {
    db.any("SELECT * FROM public.results WHERE postid=$1", [postId]).then(
      function (data) {
        var results = (data || []).map(function (item) {
          return item["json"];
        });
        callback(results);
      }
    );
  }

  function postResults(postId, json, callback) {
    db.one(
      "INSERT INTO public.results (postid, json) VALUES($1, $2) RETURNING *",
      [postId, json]
    ).then(callback);
  }

  function addImage(name, email, callback) {
    db.one("INSERT INTO files (name, email) VALUES($1, $2) RETURNING *", [
      name,
      email,
    ]).then(callback);
  }

  function addImage(name, email, callback) {
    db.one("INSERT INTO files (name, email) VALUES($1, $2) RETURNING *", [
      name,
      email,
    ]).then(callback);
  }

  function getImages(callback) {
    db.any("SELECT * FROM files ").then(function (data) {
      callback(data);
    });
  }

  function deleteSurvey(surveyId, callback) {
    db.one("DELETE FROM public.surveys WHERE id=$1 RETURNING *", [
      surveyId,
    ]).then(callback);
  }

  function updateSurvey(id, callback) {
    console.log(id);
    db.any("UPDATE public.surveys SET available = FALSE WHERE id <> $1", [
      id,
    ]).then((data) => {
      db.one(
        "UPDATE public.surveys SET available = TRUE WHERE id = $1 RETURNING *",
        [id]
      ).then(callback);
      // callback();
    });
  }

  function changeName(id, name, customer, product, callback) {
    console.log("THIS IS THE NAME: " + name + " ID: " + id);
    db.one(
      "UPDATE public.surveys SET name = $1, customer = $2, prod_line = $3 WHERE id = $4 RETURNING *",
      [name, customer, product, id]
    ).then(callback);
  }

  function storeSurvey(id, json, callback) {
    db.one("UPDATE public.surveys SET json = $1 WHERE id = $2 RETURNING *", [
      json,
      id,
    ]).then(callback);
  }

  function getSurveys(callback) {
    var surveys = {
      MySurvey1: {
        pages: [
          {
            name: "page1",
            elements: [
              {
                type: "radiogroup",
                choices: ["item1", "item2", "item3"],
                name: "question from survey1",
              },
            ],
          },
        ],
      },
      MySurvey2: {
        pages: [
          {
            name: "page1",
            elements: [
              {
                type: "checkbox",
                choices: ["item1", "item2", "item3"],
                name: "question from survey2",
              },
            ],
          },
        ],
      },
    };
    getObjectFromStorage("surveys", function (objects) {
      if (Object.keys(objects).length > 0) {
        callback(objects);
      } else {
        callback(surveys);
      }
    });
    // if(count($result) == 0) {
    //     $id1 = $this->addSurvey('MySurvey1');
    //     $this->storeSurvey($id1, $surveys['MySurvey1']);
    //     $id2 = $this->addSurvey('MySurvey2');
    //     $this->storeSurvey($id2, $surveys['MySurvey2']);
    //     $result = surveys;
    // }
  }

  return {
    addSurvey: addSurvey,
    getSurvey: getSurvey,
    storeSurvey: storeSurvey,
    addImage: addImage,
    getImages: getImages,
    getSurveys: getSurveys,
    deleteSurvey: deleteSurvey,
    postResults: postResults,
    getResults: getResults,
    changeName: changeName,
    updateSurvey: updateSurvey,
    duplicateSurvey: duplicateSurvey,
  };
}

module.exports = PostgresDBAdapter;
