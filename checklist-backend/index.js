// decide which env file should be used, either .env.development or .env.production
// require('dotenv').config();
const sql = require("mssql");
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
const { unpackSurvey } = require("./utils");

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

const checkType = (key) => {
  if (key === "is_fpy") {
    return sql.Bit;
  } else if (key === "created_at") {
    return sql.DateTime;
  } else if (key === "sequence") {
    return sql.Int;
  } else {
    return sql.NVarChar;
  }
};
// filter out the group from the array
const getGroup = (arr) => {
  let group = null;
  if (arr.includes("ChecklistGenerator_AllSites")) {
    group = "ALL_SITES";
  } else if (arr.includes("ChecklistGenerator_UCAP")) {
    group = "UCAP";
  } else if (arr.includes("ChecklistGenerator_UCTM")) {
    group = "UCTM";
  } else if (arr.includes("ChecklistGenerator_UCME")) {
    group = "UCME";
  }
  return group;
};

const updateDataCollection = async (id, new_data) => {
  try {
    // Delete existing data with the given postId
    await dbAdapter.query("DELETE FROM ASSM_DataCollection WHERE id = @id", [
      { name: "id", type: sql.NVarChar, value: id },
    ]);

    // Insert new data into the data_collection table
    const insertPromises = new_data.map((data) => {
      const columns = Object.keys(data).join(", ");
      const placeholders = Object.keys(data)
        .map((key) => `@${key}`)
        .join(", ");
      const params = Object.keys(data).map((key) => ({
        name: key,
        type: checkType(key), // Adjust the type as needed
        value: data[key],
      }));

      const query = `INSERT INTO ASSM_DataCollection (${columns}) VALUES (${placeholders})`;
      Logger.debug(`UpdateDataCollection data for Id ${id}:`, query, params);
      return dbAdapter.query(query, params);
    });
    // Wait for all insert operations to complete
    await Promise.all(insertPromises);

    Logger.debug(`Data for Id ${id} has been updated successfully.`);
  } catch (error) {
    Logger.error(`Error updating data for Id ${id}:`, error.message);
    throw error;
  }
};

const app = express();

app.use(cors({ origin: process.env.APP_URL, credentials: true }));

app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
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

app.use((req, res, next) => {
  const start = process.hrtime(); // High-resolution real time

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationInMs = (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${
        req.originalUrl
      } took ${durationInMs} ms`
    );
  });

  next();
});
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
    const folder_id = req.body.folderId;
    const userId = req.user.email;
    const user_group = getGroup(req.user.group);
    Logger.debug(
      "---- api call: /create, req.user.group, req.user: ",
      user_group,
      req.user
    );
    const result = await dbAdapter.addSurvey(
      name,
      customer,
      product,
      folder_id,
      id,
      userId,
      user_group
    );
    Logger.debug(
      "---- api call: /create,id, name, customer, product, userId, result, result: ",
      id,
      name,
      customer,
      product,
      folder_id,
      userId,
      result
    );
    useMSSQL
      ? res.json({
          name: result[0].name,
          id: id,
          customer: result[0].customer,
          prod_line: result[0].prod_line,
          folder_id: result[0].folder_id,
          groups: result[0].groups,
        })
      : res.json({
          name: result.name,
          id: id,
          customer: result.customer,
          prod_line: result.prod_line,
          folder_id: result.folder_id,
          groups: result[0].groups,
        });
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
    const folder_id = req.body.folderId;
    const json = req.body.json;
    const userId = req.user.email;
    const user_group = getGroup(req.user.group);
    const result = await dbAdapter.duplicateSurvey(
      name,
      customer,
      product,
      folder_id,
      json,
      id,
      userId,
      user_group
    );
    Logger.debug(
      "---- api call: /duplicate, name, customer, product, folder_id, json, userId, result: ",
      name,
      customer,
      product,
      folder_id,
      json,
      userId,
      result
    );
    useMSSQL
      ? res.json({
          name: result[0].name,
          id: id,
          customer: result[0].customer,
          prod_line: result[0].prod_line,
          folder_id: result[0].folder_id,
          groups: result[0].groups,
        })
      : res.json({
          name: result.name,
          id: id,
          customer: result.customer,
          prod_line: result.prod_line,
          folder_id: result.folder_id,
          groups: result.groups,
        });
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getActive", async (req, res) => {
  try {
    Logger.debug("---- api call: /getActive Started!");
    Logger.debug("---- req: ", req);
    const user = { email: req.user.email, role: req.user.role };
    const result = await dbAdapter.getSurveys(user);
    // Logger.debug("---- api call: /getActive, user, result: ", user, result);
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
    const folder_id = req.query["folderId"];
    const user_group = getGroup(req.user.group);
    const result = await dbAdapter.changeName(
      id,
      name,
      customer,
      product,
      folder_id,
      user_group
    );
    Logger.debug(
      "---- api call: /changeName, name, customer, product, result, result: ",
      name,
      customer,
      product,
      folder_id,
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
    Logger.debug("---- api call: /changeTheme Started!", req);
    const id = req.body.id;
    const name = req.body.name;
    const theme = req.body.theme;
    const result = await dbAdapter.storeTheme(id, name, theme);
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
    const userId = req.body.userId;
    const createdAt = req.body.createdAt;
    const result = await dbAdapter.postResults(
      postId,
      surveyResult,
      userId,
      createdAt
    );
    Logger.debug("---- api call: /post, result: ", result);
    //TODO: add logic here for data collection to unpack the survey Result json and store it in the db
    //and replace the question name with the question title
    //check if there is FPY is in the question tile, if yes, then extract the FPY value and store it in the table
    // Process the survey result and prepare new_data array
    const postResult = JSON.parse(result[0].json);

    if (postResult.hasOwnProperty("datacollection_header")) {
      const new_data = [];
      const surveyJson = await dbAdapter.getSurvey(postId, userId);
      const unpackedSurvey = unpackSurvey(JSON.parse(surveyJson[0].json));

      Logger.debug("---- api call: /post, unpackedSurvey: ", unpackedSurvey);
      const id = `${postResult["datacollection_header"]["wo"]}_${postResult["datacollection_header"]["oms"]}_${postResult["datacollection_header"]["step"]}_${postResult["datacollection_header"]["station"]}_${postResult["datacollection_header"]["omssn"]}_${postResult["datacollection_header"]["plant_code"]}`;

      const common_columns = {
        ...postResult["datacollection_header"],
        postid: postId,
        created_at: createdAt,
        id: id,
      };
      delete postResult["datacollection_header"];

      const createTempData = (
        is_fpy,
        answer,
        failed_reason,
        question,
        sequence
      ) => ({
        ...common_columns,
        is_fpy,
        answer:
          typeof answer === "boolean" ? (answer ? "Fail" : "Pass") : answer,
        failed_reason: failed_reason ?? "",
        question,
        sequence,
      });

      let sequence = 0;

      if (
        postResult.hasOwnProperty("datacollection_fpy") &&
        unpackedSurvey.hasOwnProperty("datacollection_fpy")
      ) {
        const { is_fpy, is_failed, failed_reason } =
          postResult["datacollection_fpy"];
        const question =
          unpackedSurvey["datacollection_fpy"]["is_failed_title"];
        new_data.push(
          createTempData(is_fpy, is_failed, failed_reason, question, sequence)
        );
        delete postResult["datacollection_fpy"];
        sequence++;
      }

      for (const key in postResult) {
        if (postResult.hasOwnProperty(key)) {
          const answer = postResult[key];
          const question = unpackedSurvey[key]?.title || "Unknown";
          new_data.push(createTempData(false, answer, "", question, sequence));
          sequence++;
        }
      }
      Logger.debug("---- api call: /post, new_data: ", new_data);

      new_data.forEach((data, index) => {
        if (!data.hasOwnProperty("type")) {
          Logger.error(
            `Data at index ${index} is missing 'type' property:`,
            data
          );
        }
      });
      await updateDataCollection(id, new_data);
    }

    // Update the data_collection table with new data

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

app.get("/getEmailList", async (req, res) => {
  try {
    Logger.debug("---- api call: /getEmailList Started!");
    const result = await dbAdapter.getEmailList();
    Logger.debug("---- api call: /getEmailList, result: ", result);
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// folders manipulation
//get folders
app.get("/getFolders", async (req, res) => {
  try {
    Logger.debug("---- api call: /getFolders Started!");
    const result = await dbAdapter.getFolders();
    const folders = result.map((folder) => ({ ...folder, files: [] })); // initail files to empty list
    Logger.debug("---- api call: /getFolders, result: ", folders);
    res.json(folders);
  } catch (error) {
    Logger.error("=====getFolders ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});
//fetch files for a specific folder
app.get("/folders/:folderId/files", async (req, res) => {
  Logger.debug("---- api call: /folders/:folderId/files Started!", req);
  const user_group = getGroup(req.user.group);
  const { folderId } = req.params;
  try {
    const result = await dbAdapter.getFolderFiles(folderId, user_group);
    res.json(result);
  } catch (error) {
    console.error("=====getFiles ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});
//move file to a different folder
app.put("/surveys/:surveyId/move", async (req, res) => {
  const { surveyId } = req.params;
  const { targetFolderId } = req.body;
  try {
    const updatedSurvey = await dbAdapter.moveSurvey(surveyId, targetFolderId);
    res.sendStatus(200);
  } catch (error) {
    Logger.error("=====moveFile ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});
//delete folder
app.delete("/folders/:folderId", async (req, res) => {
  const { folderId } = req.params;
  try {
    Logger.debug('---- api call: api.delete("/folders/:folderId") Started!');
    const result = await dbAdapter.deleteFolder(folderId);
    Logger.debug("---- api call: /deleteFolder, result: ", result);
    res.json(result);
  } catch (error) {
    Logger.error("=====delete Folder ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});
//create folder
app.post("/folders", async (req, res) => {
  try {
    Logger.debug('---- api call: api.post("/folders") Started!');
    const name = req.body.name;
    const result = await dbAdapter.createFolder(name);
    Logger.debug('---- api call: api.post("/folders"), result: ', result);
    const folders = result.map((folder) => ({ ...folder, files: [] })); // initail files to empty list
    Logger.debug("---- api call: /getFolders, result: ", folders);
    res.json(folders);
  } catch (error) {
    Logger.error("=====create Folder ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// app.use(express.static(__dirname + "/public"));
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});
app.listen(process.env.PORT || 3002, () => {
  console.log("Server is listening on port", process.env.PORT || 3002);
});
