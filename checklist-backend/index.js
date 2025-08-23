// Backend index.js - Fixed with improved authentication and clear progress support
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

let dbAdapter;
const useMSSQL = envToBool(process.env.USE_MSSQL);
const DEBUG = process.env.NODE_ENV === 'development';

if (useMSSQL) {
  dbAdapter = require("./dbadapter-mssql");
} else {
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
    await dbAdapter.query("DELETE FROM ASSM_DataCollection WHERE id = @id", [
      { name: "id", type: sql.NVarChar, value: id },
    ]);

    const insertPromises = new_data.map((data) => {
      const columns = Object.keys(data).join(", ");
      const placeholders = Object.keys(data)
        .map((key) => `@${key}`)
        .join(", ");
      const params = Object.keys(data).map((key) => ({
        name: key,
        type: checkType(key),
        value: data[key],
      }));

      const query = `INSERT INTO ASSM_DataCollection (${columns}) VALUES (${placeholders})`;
      Logger.debug(`UpdateDataCollection data for Id ${id}:`, query, params);
      return dbAdapter.query(query, params);
    });

    await Promise.all(insertPromises);
    Logger.debug(`Data for Id ${id} has been updated successfully.`);
  } catch (error) {
    Logger.error(`Error updating data for Id ${id}:`, error.message);
    throw error;
  }
};

// Sequential Page Workflow Methods for dbAdapter
const dbAdapterExtensions = {
  async submitPage(pageData) {
    const { postId, pageIndex, pageData: data, userId, createdAt } = pageData;
    
    const query = `
      MERGE ASSM_PageProgress AS target
      USING (SELECT @postId as postId, @pageIndex as pageIndex) AS source
      ON target.postId = source.postId AND target.pageIndex = source.pageIndex
      WHEN MATCHED THEN
        UPDATE SET 
          pageData = @pageData,
          completedBy = @userId,
          completedAt = @createdAt,
          isCompleted = 1
      WHEN NOT MATCHED THEN
        INSERT (postId, pageIndex, pageData, completedBy, completedAt, isCompleted)
        VALUES (@postId, @pageIndex, @pageData, @userId, @createdAt, 1);
    `;
    
    const params = [
      { name: "postId", type: sql.NVarChar, value: postId },
      { name: "pageIndex", type: sql.Int, value: pageIndex },
      { name: "pageData", type: sql.NVarChar, value: JSON.stringify(data) },
      { name: "userId", type: sql.NVarChar, value: userId },
      { name: "createdAt", type: sql.DateTime, value: createdAt }
    ];
    
    return await this.query(query, params);
  },

  async getChecklistProgress(postId) {
    const query = `
      SELECT pageIndex, pageData, completedBy, completedAt, isCompleted
      FROM ASSM_PageProgress 
      WHERE postId = @postId
      ORDER BY pageIndex ASC
    `;
    
    const params = [
      { name: "postId", type: sql.NVarChar, value: postId }
    ];
    
    const result = await this.query(query, params);
    return result.map(row => ({
      ...row,
      pageData: row.pageData ? JSON.parse(row.pageData) : {}
    }));
  },

  async saveCurrentProgress(progressData) {
    const { postId, currentData, currentPageNo, userId, updatedAt } = progressData;
    
    const query = `
      MERGE ASSM_CurrentProgress AS target
      USING (SELECT @postId as postId) AS source
      ON target.postId = source.postId
      WHEN MATCHED THEN
        UPDATE SET 
          currentData = @currentData,
          currentPageNo = @currentPageNo,
          lastEditedBy = @userId,
          updatedAt = @updatedAt
      WHEN NOT MATCHED THEN
        INSERT (postId, currentData, currentPageNo, lastEditedBy, updatedAt)
        VALUES (@postId, @currentData, @currentPageNo, @userId, @updatedAt);
    `;
    
    const params = [
      { name: "postId", type: sql.NVarChar, value: postId },
      { name: "currentData", type: sql.NVarChar, value: JSON.stringify(currentData) },
      { name: "currentPageNo", type: sql.Int, value: currentPageNo },
      { name: "userId", type: sql.NVarChar, value: userId },
      { name: "updatedAt", type: sql.DateTime, value: updatedAt }
    ];
    
    return await this.query(query, params);
  },

  async getCurrentProgress(postId) {
    const query = `
      SELECT currentData, currentPageNo, lastEditedBy, updatedAt
      FROM ASSM_CurrentProgress 
      WHERE postId = @postId
    `;
    
    const params = [
      { name: "postId", type: sql.NVarChar, value: postId }
    ];
    
    const result = await this.query(query, params);
    if (result && result.length > 0) {
      const data = useMSSQL ? result[0] : result;
      return {
        ...data,
        currentData: data.currentData ? JSON.parse(data.currentData) : {}
      };
    }
    return null;
  },

  // NEW: Clear progress for "New" button functionality
  async clearProgress(postId, userId) {
    const queries = [
      {
        query: "DELETE FROM ASSM_PageProgress WHERE postId = @postId",
        params: [{ name: "postId", type: sql.NVarChar, value: postId }]
      },
      {
        query: "DELETE FROM ASSM_CurrentProgress WHERE postId = @postId",
        params: [{ name: "postId", type: sql.NVarChar, value: postId }]
      }
    ];

    for (const { query, params } of queries) {
      await this.query(query, params);
    }

    Logger.debug(`Cleared all progress for postId: ${postId} by user: ${userId}`);
    return { success: true, message: "Progress cleared" };
  },
  async getInFlightChecklists(userId) {
    const query = `
      SELECT DISTINCT
        cp.postId,
        COALESCE(s.name, 'Unknown Checklist') as surveyName,
        cp.lastEditedBy,
        cp.updatedAt as lastUpdated,
        cp.currentPageNo,
        (
          SELECT COUNT(DISTINCT pageIndex) 
          FROM ASSM_PageProgress pp 
          WHERE pp.postId = cp.postId AND pp.isCompleted = 1
        ) as completedPages,
        s.json
      FROM ASSM_CurrentProgress cp
      LEFT JOIN surveys s ON cp.postId = s.id
      WHERE cp.postId NOT IN (
        SELECT DISTINCT postid 
        FROM results 
        WHERE postid IS NOT NULL AND postid = cp.postId
      )
      AND LOWER(cp.lastEditedBy) = LOWER(@userId)
      ORDER BY cp.updatedAt DESC
    `;
    
    const params = [
      { name: "userId", type: sql.NVarChar, value: userId }
    ];
    
    return await this.query(query, params);
  }

};

// Extend dbAdapter with new methods
Object.assign(dbAdapter, dbAdapterExtensions);

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

// Request timing middleware
app.use((req, res, next) => {
  const start = process.hrtime();

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

// ============================
// AUTHENTICATION ENDPOINTS
// ============================
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

// Add this new endpoint to your backend index.js file in the appropriate section

// ============================
// IN-FLIGHT CHECKLISTS ENDPOINT
// ============================

// Add this endpoint to your backend index.js file (around line 800-900)

// Add this to your backend index.js file
app.get("/getInFlightChecklists", async (req, res) => {
  try {
    Logger.debug("---- api call: /getInFlightChecklists Started!");
    
    const userId = req.user ? req.user.email : null;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // FIXED: Use LEFT JOIN and case-insensitive comparison
    const query = `
      SELECT DISTINCT
        cp.postId,
        COALESCE(s.name, 'Unknown Checklist') as surveyName,
        cp.lastEditedBy,
        cp.updatedAt as lastUpdated,
        cp.currentPageNo,
        (
          SELECT COUNT(DISTINCT pageIndex) 
          FROM ASSM_PageProgress pp 
          WHERE pp.postId = cp.postId AND pp.isCompleted = 1
        ) as completedPages,
        s.json
      FROM ASSM_CurrentProgress cp
      LEFT JOIN surveys s ON cp.postId = s.id
      WHERE cp.postId NOT IN (
        SELECT DISTINCT postid 
        FROM results 
        WHERE postid IS NOT NULL AND postid = cp.postId
      )
      AND LOWER(cp.lastEditedBy) = LOWER(@userId)
      ORDER BY cp.updatedAt DESC
    `;
    
    const params = [
      { name: "userId", type: sql.NVarChar, value: userId }
    ];
    
    Logger.debug("Query:", query);
    Logger.debug("Params:", params);
    
    const result = await dbAdapter.query(query, params);
    Logger.debug("Raw query result:", result);
    
    // Process the results to add total pages count
    const processedResults = result.map(row => {
      let totalPages = 1;
      
      try {
        if (row.json) {
          const surveyJson = JSON.parse(row.json);
          totalPages = surveyJson.pages ? surveyJson.pages.length : 1;
        }
      } catch (error) {
        Logger.error("Error parsing survey JSON for page count:", error);
      }
      
      return {
        postId: row.postId,
        surveyName: row.surveyName || 'Unknown Checklist',
        totalPages: totalPages,
        completedPages: row.completedPages || 0,
        lastEditedBy: row.lastEditedBy,
        lastUpdated: row.lastUpdated,
        currentPageNo: row.currentPageNo || 0
      };
    });
    
    Logger.debug("---- api call: /getInFlightChecklists, result count: ", processedResults.length);
    Logger.debug("Processed results:", processedResults);
    
    res.json({ data: processedResults });
    
  } catch (error) {
    Logger.error("===== ERROR in /getInFlightChecklists:", error.message);
    Logger.error("Error stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// IMPROVED: Enhanced /getMe endpoint with better user data handling
app.get("/getMe", (req, res, _next) => {
  // Use console.log in addition to Logger.debug to ensure we see output in Docker logs
  console.log("=== /getMe ENDPOINT CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request IP:", req.ip);
  console.log("User Agent:", req.headers['user-agent']);
  
  Logger.debug("==== /getMe endpoint called ====");
  Logger.debug("req.isAuthenticated():", req.isAuthenticated());
  Logger.debug("req.user exists:", !!req.user);
  
  // Additional session debugging
  console.log("=== SESSION DEBUG ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session exists:", !!req.session);
  console.log("Session keys:", req.session ? Object.keys(req.session) : 'No session');
  if (req.session) {
    console.log("Session data:", JSON.stringify(req.session, null, 2));
  }
  
  // Cookie debugging
  console.log("=== COOKIE DEBUG ===");
  console.log("Request cookies:", req.headers.cookie);
  console.log("Has connect.sid cookie:", req.headers.cookie ? req.headers.cookie.includes('connect.sid') : false);
  
  // Authentication state debugging
  console.log("=== AUTHENTICATION STATE ===");
  console.log("req.isAuthenticated():", req.isAuthenticated());
  console.log("req.user exists:", !!req.user);
  console.log("passport user:", req.user);
  
  if (!req.isAuthenticated()) {
    console.log("❌ USER NOT AUTHENTICATED");
    Logger.debug("User not authenticated");
    return res.status(401).json({
      message: "Unauthorized",
      authenticated: false,
      debug: {
        hasSession: !!req.session,
        sessionID: req.sessionID,
        hasCookies: !!req.headers.cookie
      }
    });
  } else {
    console.log("✅ USER IS AUTHENTICATED");
    const { user } = req;
    
    // Enhanced debugging to see user object structure
    console.log("=== COMPLETE USER OBJECT ===");
    console.log("User keys:", Object.keys(user || {}));
    console.log("Full user object:", JSON.stringify(user, null, 2));
    
    Logger.debug("==== Complete user object ====");
    Logger.debug("user keys:", Object.keys(user || {}));
    Logger.debug("user object:", JSON.stringify(user, null, 2));
    
    // Check common Okta/SAML user properties
    console.log("=== USER PROPERTIES ANALYSIS ===");
    console.log("user.email:", user?.email);
    console.log("user.preferred_username:", user?.preferred_username);
    console.log("user.name:", user?.name);
    console.log("user.given_name:", user?.given_name);
    console.log("user.family_name:", user?.family_name);
    console.log("user.displayName:", user?.displayName);
    console.log("user.sub:", user?.sub);
    console.log("user.login:", user?.login);
    console.log("user.profile:", user?.profile);
    console.log("user._json:", user?._json);
    
    Logger.debug("==== User properties ====");
    Logger.debug("user.email:", user?.email);
    Logger.debug("user.preferred_username:", user?.preferred_username);
    Logger.debug("user.name:", user?.name);
    Logger.debug("user.given_name:", user?.given_name);
    Logger.debug("user.family_name:", user?.family_name);
    Logger.debug("user.displayName:", user?.displayName);
    Logger.debug("user.sub:", user?.sub);
    Logger.debug("user.login:", user?.login);
    Logger.debug("user.profile:", user?.profile);
    Logger.debug("user._json:", user?._json);
    
    // Normalize user data for consistent frontend consumption
    const normalizedUser = {
      // Try multiple possible email fields
      email: user?.email || 
             user?.preferred_username || 
             user?.login || 
             user?._json?.email || 
             user?._json?.preferred_username ||
             user?.profile?.email ||
             'unknown@company.com',
      
      // Try multiple possible name fields
      name: user?.name || 
            user?.displayName || 
            user?.given_name || 
            user?._json?.name ||
            user?._json?.given_name ||
            user?.profile?.name ||
            user?.profile?.displayName ||
            (user?.email || user?.preferred_username || 'Unknown User'),
      
      // Display name
      displayName: user?.displayName || 
                   user?.name || 
                   user?._json?.name ||
                   user?.profile?.displayName ||
                   user?.given_name ||
                   'User',
      
      // Additional fields
      given_name: user?.given_name || user?._json?.given_name,
      family_name: user?.family_name || user?._json?.family_name,
      sub: user?.sub || user?._json?.sub,
      
      // Include original for debugging
      _original: DEBUG ? user : undefined
    };
    
    console.log("=== NORMALIZED USER OBJECT ===");
    console.log("Normalized user:", JSON.stringify(normalizedUser, null, 2));
    console.log("Final email will be:", normalizedUser.email);
    console.log("Final name will be:", normalizedUser.name);
    
    Logger.debug("==== Normalized user object ====");
    Logger.debug("Normalized user:", JSON.stringify(normalizedUser, null, 2));
    
    const responseData = {
      user: normalizedUser,
      authenticated: true,
      timestamp: new Date().toISOString(),
      debug: DEBUG ? {
        originalUserKeys: Object.keys(user || {}),
        sessionID: req.sessionID,
        hasSession: !!req.session
      } : undefined
    };
    
    console.log("=== FINAL RESPONSE ===");
    console.log("Response being sent:", JSON.stringify(responseData, null, 2));
    
    return res.status(200).json(responseData);
  }
});

// DEBUG endpoint (development only)
app.get("/debug-auth", (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  Logger.debug("==== Debug Auth Endpoint ====");
  
  const debugInfo = {
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    hasSession: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    userKeys: req.user ? Object.keys(req.user) : [],
    headers: {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie ? 'present' : 'not present',
      'user-agent': req.headers['user-agent']
    },
    session: req.session,
    user: req.user
  };
  
  Logger.debug("Debug info:", JSON.stringify(debugInfo, null, 2));
  return res.json(debugInfo);
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

// ============================
// SURVEY MANAGEMENT ENDPOINTS
// ============================
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
    
    const result = await dbAdapter.addSurvey(
      name,
      customer,
      product,
      folder_id,
      id,
      userId,
      user_group
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
    const user = { email: req.user.email, role: req.user.role };
    const result = await dbAdapter.getSurveys(user);
    res.json(result);
  } catch (error) {
    Logger.error("===== path: /getActive ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getSurvey", async (req, res) => {
  try {
    Logger.debug("---- api call: /getSurvey Started!");
    const surveyId = req.query["surveyId"];
    const user = req.isAuthenticated()
      ? { email: req.user.email, role: req.user.role }
      : null;
    const result = await dbAdapter.getSurvey(surveyId, user);
    useMSSQL ? res.json(result[0]) : res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/getTheme", async (req, res) => {
  try {
    Logger.debug("---- api call: /getTheme Started!");
    const surveyId = req.query["surveyId"];
    const user = req.isAuthenticated()
      ? { email: req.user.email, role: req.user.role }
      : null;
    const result = await dbAdapter.getTheme(surveyId, user);
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
    const name = req.body.name;
    const theme = req.body.theme;
    const result = await dbAdapter.storeTheme(id, name, theme);
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
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// SEQUENTIAL PAGE WORKFLOW ENDPOINTS
// ============================

// Save page completion
app.post("/submitPage", async (req, res) => {
  try {
    Logger.debug("---- api call: /submitPage Started!");
    const postId = req.body.postId;
    const pageIndex = req.body.pageIndex;
    const pageData = req.body.pageData;
    const userId = req.user ? req.user.email : req.body.userId;
    const createdAt = new Date().toISOString();

    const result = await dbAdapter.submitPage({
      postId,
      pageIndex,
      pageData,
      userId,
      createdAt
    });

    Logger.debug("---- api call: /submitPage, result: ", result);
    res.json({ success: true, result });
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get checklist progress
app.get("/getProgress", async (req, res) => {
  try {
    Logger.debug("---- api call: /getProgress Started!");
    const postId = req.query["postId"];
    const result = await dbAdapter.getChecklistProgress(postId);
    Logger.debug("---- api call: /getProgress, result: ", result);
    res.json({ data: result });
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Save current progress (auto-save)
app.post("/saveProgress", async (req, res) => {
  try {
    Logger.debug("---- api call: /saveProgress Started!");
    const postId = req.body.postId;
    const currentData = req.body.currentData;
    const currentPageNo = req.body.currentPageNo;
    const userId = req.user ? req.user.email : req.body.userId;
    const updatedAt = new Date().toISOString();

    const result = await dbAdapter.saveCurrentProgress({
      postId,
      currentData,
      currentPageNo,
      userId,
      updatedAt
    });

    Logger.debug("---- api call: /saveProgress, result: ", result);
    res.json({ success: true });
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Clear progress endpoint for "New" button
app.post("/clearProgress", async (req, res) => {
  try {
    Logger.debug("---- api call: /clearProgress Started!");
    const postId = req.body.postId;
    const userId = req.user ? req.user.email : req.body.userId;

    const result = await dbAdapter.clearProgress(postId, userId);
    
    Logger.debug("---- api call: /clearProgress, result: ", result);
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// MAIN SURVEY ENDPOINTS
// ============================

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
    
    // Data collection processing
    const postResult = JSON.parse(result[0].json);

    if (postResult.hasOwnProperty("datacollection_header")) {
      const new_data = [];
      const surveyJson = await dbAdapter.getSurvey(postId, userId);
      const unpackedSurvey = unpackSurvey(JSON.parse(surveyJson[0].json));

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

      await updateDataCollection(id, new_data);
    }

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
      res.json({ message: "File deleted successfully", details: result });
    } else {
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
    res.json(result);
  } catch (error) {
    Logger.error("===== ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================
// FOLDER MANAGEMENT ENDPOINTS
// ============================

app.get("/getFolders", async (req, res) => {
  try {
    Logger.debug("---- api call: /getFolders Started!");
    const result = await dbAdapter.getFolders();
    const folders = result.map((folder) => ({ ...folder, files: [] }));
    res.json(folders);
  } catch (error) {
    Logger.error("=====getFolders ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/folders/:folderId/files", async (req, res) => {
  Logger.debug("---- api call: /folders/:folderId/files Started!");
  
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      error: "Unauthorized - Please login to access folders"
    });
  }
  
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

app.delete("/folders/:folderId", async (req, res) => {
  const { folderId } = req.params;
  
  try {
    Logger.debug('---- api call: api.delete("/folders/:folderId") Started!');
    const result = await dbAdapter.deleteFolder(folderId);
    res.json(result);
  } catch (error) {
    Logger.error("=====delete Folder ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/folders", async (req, res) => {
  try {
    Logger.debug('---- api call: api.post("/folders") Started!');
    const name = req.body.name;
    const result = await dbAdapter.createFolder(name);
    const folders = result.map((folder) => ({ ...folder, files: [] }));
    res.json(folders);
  } catch (error) {
    Logger.error("=====create Folder ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// Start server
app.listen(process.env.PORT || 3002, () => {
  console.log("Server is listening on port", process.env.PORT || 3002);
  console.log("Environment:", process.env.NODE_ENV || 'development');
  console.log("Enhanced authentication and progress management enabled");
});