// decide which env file should be used, either .env.development or .env.production
// require('dotenv').config();
const express = require("express");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const passport = require("passport");
const path = require("path");
const cors = require("cors");
const uuid = require("uuid");
const config = require("./config/config");
const samlStrategy = require("./config/passport");
const Logger = require("./logger");

function envToBool(variable) {
  return variable === "true";
}

let dbAdpater;
const useMSSQL = envToBool(process.env.USE_MSSQL);

if (useMSSQL) {
  //USE MSSQL db as backend db
  dbAdapter = require("./dbadapter-mssql");
} else {
  //USE postgresql db as backend db
  dbAdapter = require("./dbadapter-pgp");
}

const app = express();

app.use(cors({ origin: process.env.APP_URL, credentials: true }));

app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    parameterLimit: 100000,
    extended: false,
    limit: "50mb",
  })
);

app.get(
  "/login",
  passport.authenticate("saml", config.saml.options),
  (req, res, _next) => {
    if (DEBUG) {
      console.log("===== req.session: ", req.session);
      console.log("===== req.user: ", req.user);
    }
    res.redirect(process.env.APP_URL);
  }
);

app.post(
  "/login/callback",
  passport.authenticate("saml", config.saml.options),
  (req, res, _next) => {
    Logger.debug("====== /api/login/callback Authenticated user", req.user);
    res.redirect(process.env.APP_URL);
  }
);

app.get("/getMe", (req, res, _next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  } else {
    const { user } = req;
    Logger.debug("==== auth: /getMe: req", user);
    return res.status(200).json({ user });
  }
});

app.get("/logout", (req, res, _next) => {
  res.clearCookie("connect.sid");
  samlStrategy.logout(req, (err, request) => {
    if (!err) {
      res.redirect(request);
    } else {
      Logger.error(err);
      res.redirect(process.env.APP_URL);
    }
  });
});

app.post("/logout/callback", (req, res, _next) => {
  req.logout((err) => {
    if (!err) {
      return res.redirect(process.env.APP_URL);
    }
    Logger.error(err);
  });
});

app.post("/create", async (req, res) => {
  try {
    Logger.debug("---- api call: /create Started!");
    const id = uuid.v4();
    const name = req.body.name;
    const customer = req.body.customer;
    const product = req.body.product;
    const userId = req.user.email;
    const result = await dbAdapter.addSurvey(
      name,
      customer,
      product,
      id,
      userId
    );
    Logger.debug(
      "---- api call: /create,id, name, customer, product, userId, result, result: ",
      id,
      name,
      customer,
      product,
      userId,
      result
    );
    useMSSQL
      ? res.json({ name: result[0].name, id: id })
      : res.json({ name: result.name, id: id });
  } catch (error) {
    Logger.error("/create", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/duplicate", async (req, res) => {
  try {
    Logger.debug("---- api call: /duplicate Started!");
    const id = uuid.v4();
    const name = req.body.name;
    const customer = req.body.customer;
    const product = req.body.product;
    const json = req.body.json;
    const userId = req.user.email;
    const result = await dbAdapter.duplicateSurvey(
      name,
      customer,
      product,
      json,
      id,
      userId
    );
    Logger.debug(
      "---- api call: /duplicate, name, customer, product, json, userId, result: ",
      name,
      customer,
      product,
      json,
      userId,
      result
    );
    useMSSQL
      ? res.json({ name: result[0].name, id: id })
      : res.json({ name: result.name, id: id });
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getActive", async (req, res) => {
  try {
    Logger.debug("---- api call: /getActive Started!");
    const user = { email: req.user.email, role: req.user.role };
    const result = await dbAdapter.getSurveys(user);
    Logger.debug("---- api call: /getActive, user, result: ", user, result);
    res.json(result);
  } catch (error) {
    Logger.error("===== path: /getActive ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getSurvey", async (req, res) => {
  try {
    Logger.debug("---- api call: /getSurvey Started!, req: ", req);
    const surveyId = req.query["surveyId"];
    const user = req.isAuthenticated()
      ? { email: req.user.email, role: req.user.role }
      : null;
    const result = await dbAdapter.getSurvey(surveyId, user);
    Logger.debug("---- api call: /getSurvey, user, result: ", user, result);
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getTheme", async (req, res) => {
  try {
    Logger.debug("---- api call: /getTheme Started! req: ", req);
    const surveyId = req.query["surveyId"];
    const user = req.isAuthenticated()
      ? { email: req.user.email, role: req.user.role }
      : null;
    const result = await dbAdapter.getTheme(surveyId, user);
    Logger.debug("---- api call: /getTheme, user, result: ", user, result);
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/changeName", async (req, res) => {
  try {
    Logger.debug("---- api call: /changeName Started!");
    const id = req.query["id"];
    const name = req.query["name"];
    const customer = req.query["customer"];
    const product = req.query["product"];
    const result = await dbAdapter.changeName(id, name, customer, product);
    Logger.debug(
      "---- api call: /changeName, name, customer, product, result, result: ",
      name,
      customer,
      product,
      result
    );
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/changeJson", async (req, res) => {
  try {
    Logger.debug("---- api call: /changeJson Started!");
    const id = req.body.id;
    const json = req.body.json;
    const result = await dbAdapter.storeSurvey(id, json);
    Logger.debug(
      "---- api call: /changeJson, id, json, result: ",
      id,
      json,
      result
    );
    useMSSQL ? res.json(result[0]) : res.json(result.json);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/changeTheme", async (req, res) => {
  try {
    Logger.debug("---- api call: /changeTheme Started!");
    const id = req.body.id;
    const theme = req.body.theme;
    const result = await dbAdapter.changeTheme(id, theme);
    Logger.debug(
      "---- api call: /changeTheme, id, theme, result: ",
      id,
      theme,
      result
    );
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/uploadFile", async (req, res) => {
  try {
    Logger.debug("---- api call: /uploadFile Started!");
    const fileNames = Object.keys(req.files);
    fileNames.map((item) => {
      req.files[item].mv(
        path.join(__dirname, `./public/${req.files[item].name}`)
      );
    });
    const result = await dbAdapter.addImage(
      req.files[item].name,
      req.body.email
    );
    Logger.debug("---- api call: /uploadFile, result: ", result);
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getImages", async (req, res) => {
  try {
    Logger.debug("---- api call: /getImages Started!");
    const result = await dbAdapter.getImages();
    Logger.debug("---- api call: /getImages, result: ", result);
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/post", async (req, res) => {
  try {
    Logger.debug("---- api call: /post Started!");
    const postId = req.body.postId;
    const surveyResult = req.body.surveyResult;
    const result = await dbAdapter.postResults(postId, surveyResult);
    Logger.debug("---- api call: /post, result: ", result);
    useMSSQL ? res.json(result[0]) : res.json(result.json);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/delete", async (req, res) => {
  try {
    Logger.debug("---- api call: /delete Started!");
    const surveyId = req.query["id"];
    const user = { email: req.user.email, role: req.user.role };
    const result = await dbAdapter.deleteSurvey(surveyId, user);
    if (result) {
      Logger.debug("---- api call: /delete, result: ", result);
      res.json({ message: "File deleted successfully", details: result });
    } else {
      Logger.debug("No data found to delete for surveyId:", surveyId);
      res.status(404).json({ message: "No survey found with given ID" });
    }
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/update", async (req, res) => {
  try {
    Logger.debug("---- api call: /update Started!");
    const surveyId = req.query["id"];
    const result = await dbAdapter.updateSurvey(surveyId);
    Logger.debug("---- api call: /update, result: ", result);
    res.json({});
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/results", async (req, res) => {
  try {
    Logger.debug("---- api call: /results Started!");
    const postId = req.query["postId"];
    const result = await dbAdapter.getResults(postId);
    Logger.debug("---- api call: /results, result: ", result);
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(__dirname + "/public"));
app.listen(process.env.PORT || 3002, () => {
  console.log("Server is listening on port", process.env.PORT || 3002);
});
