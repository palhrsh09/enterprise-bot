const fs = require("fs");
const path = require("path");

const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
// Function to create file with a template
const createFileIfNotExists = (dir, fileName, content) => {
  ensureDirectoryExistence(dir);
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created ${filePath}`);
  } else {
    console.log(`${filePath} already exists`);
  }
};
const snakeToCamelCase = (snake_case) => {
  return snake_case
    .toLowerCase()
    .split("_")
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
};

// Function to generate the file content
const getTemplate = (type, tableName) => {
  const tableNameCC = snakeToCamelCase(tableName);
  const tableNameLC = tableName.toLowerCase();
  switch (type) {
    case "route":
      return `const router = require("express").Router();
const ${tableNameCC} = require("../controllers/${tableNameLC}.controller")
router.get("/", ${tableNameCC}.getAll);
router.get("/:id", ${tableNameCC}.getById);
router.post("/", ${tableNameCC}.create);
router.put("/:id", ${tableNameCC}.update);
router.delete("/:id", ${tableNameCC}.delete);
router.patch("/:id", ${tableNameCC}.restore);
module.exports = router;
`;
    case "controller":
      return `const ${tableNameCC} = require("../services/${tableNameLC}.service");
exports.getAll = async (req, res) => {
    try {
        const { count, rows: ${tableNameCC}Data } = await ${tableNameCC}.getAll({
        pageIndex: parseInt(req.query.pageIndex) || 1,
        pageSize: parseInt(req.query.pageSize) || null,
        sortOrder: req.query.sort && req.query.sort.order ? req.query.sort.order : "DESC",
        sortKey: req.query.sort && req.query.sort.key ? req.query.sort.key : "createdAt",
        query: req.query.query || "",
        showDeleted: req.query.showDeleted !== "true",
      });
      res.status(200).json({ data: ${tableNameCC}Data, total: count })
    } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
    }
};
exports.getById = async (req, res) => {
    try {
        res.status(200).json({ data: await ${tableNameCC}.getById(req.params.id)});
    } catch (error) {
    console.error("error: ", error);
        res.status(500).json({ message: error.message });
    }
};
exports.create = async (req,res) => {
    try {
        const {} = req.body
        res.status(200).json({ data: await ${tableNameCC}.create({})})
    } catch (error){
    console.error("error: ", error);
        res.status(500).json({ message: error.message }); 
    }
}
exports.update = async (req, res) => {
    try {
        const {} = req.body
        const isUpdated = Boolean((await ${tableNameCC}.update(req.params.id, {}))[0])
        res.status(200).json({ isUpdated });
    } catch (error) {
    console.error("error: ", error);
        res.status(500).json({ message: error.message });
    }
};        
exports.delete = async (req, res) => {
    try {
        const isDeleted = Boolean(await ${tableNameCC}.delete(req.params.id, req.query));
        res.status(200).json({ isDeleted });
    } catch (error) {
    console.error("error: ", error);
        res.status(500).json({ message: error.message });
    }
};
exports.restore = async (req, res) => {
  try {
    const isRestored = Boolean(await ${tableNameCC}.restore(req.params.id));
    res.status(200).json({ isRestored });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};`;
    case "service":
      return `const db = require("../models");
const ${tableNameCC} = db.${tableNameLC};

class ${tableNameCC}Service {
    async getAll(params) {
        const { pageIndex, pageSize, sortOrder, sortKey, showDeleted, query, businessId } = params;
        const whereClause = query
        ? {
            [db.Op.or]: [{ title: { [db.Op.like]: \`%\${query}%\` } }, { parent: { [db.Op.like]: \`%\${query}%\` } }],
        }
        : {};
        if (businessId) whereClause.businessId = businessId;
        return await ${tableNameCC}.findAndCountAll({
            where: whereClause,
            paranoid: showDeleted,
            limit: pageSize,
            offset: (pageIndex - 1) * pageSize,
            order: [[sortKey, sortOrder]],
            include: [],
        })
    }
    async getById(id) {
        return await ${tableNameCC}.findByPk(id, { paranoid: false });
    }
    async create(data){
        return await ${tableNameCC}.create(data);
    }
    async update(id, data) {
        return await ${tableNameCC}.update(data,{ where: {id} });
    }
    async delete(id, params) {
        return await ${tableNameCC}.destroy({ where: {id}, force: params?.force == "true" });
    }
    async restore(id) {
        return await ${tableNameCC}.restore({ where: {id} });
    }
}
module.exports = new ${tableNameCC}Service();`;
    case "model":
      return `module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        "${tableNameLC}",
        {
            id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
            status: { type: DataTypes.BOOLEAN, defaultValue: true },

        },
        { underscored: true, paranoid: true }
    );
};`;
    default:
      return "";
  }
};

const getDefaultTemplate = (fileType) => {
  switch (fileType) {
    case "server":
      return `const express = require("express");
  require("dotenv").config();
const { NODE_ENV } = process.env;
if (NODE_ENV === "local") {
  require("dotenv").config({ path: \`.env.local\`, override: true });
}
  const app = express();
  const { PORT } = process.env;
  const cors = require("cors");
  const http = require("http");
  
  var whitelist = process.env.CORS_URLS.split(",");
  const corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) > -1 || NODE_ENV === "DEV" || NODE_ENV === "local") {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  
  app.use(cors(corsOptions));
  
  const db = require("../models");
  
  require("../routes")(app, express);
  
  db.sequelize
    .authenticate()
    .then(() => {
      console.warn("MySQL Connection established successfully.");
      console.warn("Creating tables ==================>");
      db.sequelize
        .sync({ alter: false, logging: false, force=false })
        .then(() => {
          console.warn("=============== Tables created per model");
          http.createServer(app).listen(PORT);
          console.log("Created Server on PORT", PORT);
        })
        .catch((error) => console.error("Unable to create tables:", error));
    })
    .catch((err) => console.error("Unable to connect to the database:", err));
  `;
    case "model":
      return `const mongodbConfig = require("../config/mongo.config");
  const dbConfig = require("../config/db.config");
  
  const { Sequelize, DataTypes, Model, Op } = require("sequelize");
  const { MongoClient } = require("mongodb");
  
  const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  });
  
  const db = {};
  const client = new MongoClient(mongodbConfig.uri);
  let mdb = client.db(mongodbConfig.mdbName);
  
  async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach((db) => console.log(\` - \${db.name}\`));
  }
  
  const initmongo = async () => {
    try {
      await client.connect();
      await listDatabases(client);
    } catch (e) {
      console.error(e);
    }
  };
  
  db.initmongo = initmongo;
  db.sequelize = sequelize;
  db.Op = Op;
  
  db.business_department_users = require("./business_department_users.model")(sequelize, DataTypes);
  db.business_departments = require("./business_departments.model")(sequelize, DataTypes);
  db.business_designations = require("./business_designations.model")(sequelize, DataTypes);
  db.business_users_contact = require("./business_users_contact.model")(sequelize, DataTypes);
  db.business_users = require("./business_users.model")(sequelize, DataTypes, Op);
  db.cards = require("./cards.model")(sequelize, DataTypes);
  db.employments = require("./employments.model")(sequelize, DataTypes);
  db.faqs = mdb.collection("faqs");
  db.follow = mdb.collection("follow");
  db.request = mdb.collection("request");
  db.share = mdb.collection("share");
  db.connection = mdb.collection("connection");
  db.onboardingData = mdb.collection("onboardingData");
  
  db.business_departments.belongsToMany(db.business_users, { through: "business_department_users" });
  db.business_users.belongsToMany(db.business_departments, { through: "business_department_users" });
  
  db.business_users.belongsTo(db.business_designations, { key: "business_designation_id" });
  db.business_designations.hasMany(db.business_users, { key: "id" });
  
  db.employments.belongsTo(db.cards);
  db.cards.hasMany(db.employments);
  
  module.exports = db;
  `;
    case "route":
      return `const { generateRoutes, generatePluginRoutes } = require("../scripts/generateRoutes");
  const { getModuleInfo } = require("../scripts/getModuleInfo");
  const { verifyToken } = require("../middleware");
  
  module.exports = (app, express) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  
    var router = express.Router();
    router.use("/business-users-contact", require("./business_users_contact.route"));
    router.use("/business-users", require("./business_users.route"));
    router.use("/cards", require("./cards.route"));
    router.use("/employments", require("./employments.route"));
    router.use("/business-designations", require("./business-designations.route"));
    router.use("/business-departments", require("./business-departments.route"));
  
    router.use("/customer/onboarding", require("./onboardingData.route"));
    router.use("/connection", require("./connection.route"));
    router.use("/faqs", require("./faqs.route"));
    router.use("/follow", require("./follow.route"));
    router.use("/request", require("./request.route"));
    router.use("/share", require("./share.route"));
  
    router.get("/plugin/modules", getModuleInfo);
    router.get("/plugin/routes", generateRoutes);
    app.use("/core", verifyToken, router);
  };
  `;
    default:
      return "";
  }
};

const generateDefaultFiles = () => {
  const defaultFiles = [
    { dir: path.join(__dirname, "../server"), fileName: "index.js", type: "server" },
    { dir: path.join(__dirname, "../models"), fileName: "index.js", type: "model" },
    { dir: path.join(__dirname, "../routes"), fileName: "index.js", type: "routes" },
  ];

  defaultFiles.forEach(({ dir, fileName, type }) => {
    const content = getDefaultTemplate(type);
    createFileIfNotExists(dir, fileName, content);
  });
};

// Main function to create files based on table name
const generateFiles = (tableName) => {
  generateDefaultFiles();
  const types = ["controller", "model", "route", "service"];
  types.forEach((type) => {
    const dir = path.join(__dirname, "../" + type + "s");
    const fileName = `${tableName}.${type}.js`;
    const content = getTemplate(type, tableName);
    createFileIfNotExists(dir, fileName, content);
  });
};

// Example: Generating files for the 'states' table
const tableName = process.argv[2] || "states";
generateFiles(tableName);
