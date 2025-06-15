const fs = require("fs");
const path = require("path");

const extractRoutesFromFile = (filePath) => {
  const routes = [];
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const routeRegex = /router\.(get|post|put|delete|options)\(['"`](.*?)['"`],\s*(.*)\)/g;
  let match;

  while ((match = routeRegex.exec(fileContent)) !== null) {
    const method = match[1]; 
    const uri = match[2]; 
    const handlerPart = match[3]; 

    const handlerArray = handlerPart.split(",").map((part) => part.trim());
    const classAndFunction = handlerArray[handlerArray.length - 1];

    routes.push({
      method: method.toUpperCase(),
      uri: uri, 
      handler: classAndFunction, 
    });
  }

  return routes;
};

const extractBaseUris = (indexFilePath) => {
  const baseUris = {};
  const fileContent = fs.readFileSync(indexFilePath, "utf-8");
  const baseUriRegex = /router\.use\(['"`](.*?)['"`],\s*require\(['"`](.*?)['"`]\)\)/g;
  let match;
  while ((match = baseUriRegex.exec(fileContent)) !== null) {
    baseUris[match[1]] = match[2];
  }
  return baseUris;
};

const extractAllRoutes = (routesDir) => {
  const indexFilePath = path.join(routesDir, "index.js");
  if (!fs.existsSync(indexFilePath)) {
    throw new Error("index.js file not found in the routes directory");
  }
  const baseUris = extractBaseUris(indexFilePath);
  const allRoutes = [];
  for (const [baseUri, routeFile] of Object.entries(baseUris)) {
    const routeFilePath = path.join(routesDir, `${routeFile}.js`);
    if (!fs.existsSync(routeFilePath)) {
      console.warn(`Route file ${routeFilePath} not found`);
      continue;
    }
    const routes = extractRoutesFromFile(routeFilePath);
    routes.forEach((route) => {
      allRoutes.push({
        type: route.method,
        uri: path.posix
          .join(baseUri, route.uri)
          .replace(/^\/v\d+\//, "/")
          .replace(/:\w+/g, ":id"),
        params: route.uri.includes(":") ? route.uri.match(/:(\w+)/g).map((param) => param.substring(1)) : [],
        class: route.handler.split(".")[0],
        method: route.handler.split(".")[1],
        description: "",
        version: baseUri.slice(0, 3),
      });
    });
  }
  return allRoutes;
};

const groupRoutesByMicroservice = (routes, baseUrl) => {
  const groupedData = {};

  routes.forEach((route) => {
    const microserviceName = baseUrl || "core"; // Default to 'core' if baseUrl isn't defined
    const moduleName = route.class;
    const methodType = route.type.toUpperCase();
    const methodName = mapMethodToName(route.method);

    if (!groupedData[microserviceName]) {
      groupedData[microserviceName] = {
        name: microserviceName,
        modules: {},
      };
    }

    if (!groupedData[microserviceName].modules[moduleName]) {
      groupedData[microserviceName].modules[moduleName] = {
        name: moduleName,
        methods: [],
      };
    }

    groupedData[microserviceName].modules[moduleName].methods.push({
      name: mapTypeToMethodName(methodType),
      type: methodType,
      uri: route.uri,
      service: methodName,
      version: route.version,
      params: route.params,
    });
  });

  return Object.values(groupedData).map((microservice) => ({
    ...microservice,
    modules: Object.values(microservice.modules).map((module) => ({
      ...module,
      methods: module.methods,
    })),
  }));
};

const mapMethodToName = (method) => {
  const methodMap = {
    getAll: "All",
    getById: "By Id",
    register: "register",
    login: "login",
    resetPassword: "reset password",
    update: "By Id",
    delete: "By Id",
  };
  return methodMap[method] || method;
};

const mapTypeToMethodName = (type) => {
  const typeMap = {
    GET: "VIEW",
    POST: "ADD",
    PUT: "EDIT",
    DELETE: "DELETE",
  };
  return typeMap[type] || type;
};

exports.generateRoutes = async (req, res) => {
  const routesDir = path.join(__dirname, "../routes");
  var token = req.headers.authorization;
  try {
    const allRoutes = extractAllRoutes(routesDir, []);
    const groupedRoutes = groupRoutesByMicroservice(allRoutes, req.baseUrl.slice(1).toUpperCase());
    res.status(200).json(groupedRoutes);
  } catch (error) {
    console.error("Error extracting routes:", error.message);
    res.status(404).json({ message: error.message });
  }
};

exports.generatePluginRoutes = async (req, res) => {
  const routesDir = path.join(__dirname, "../routes");
  try {
    const allRoutes = extractAllRoutes(routesDir);
    const groupedRoutes = groupRoutesByMicroservice(allRoutes, req.baseUrl.slice(1).toUpperCase());
    const endpoints = groupedRoutes.flatMap((microservice) => {
      return Object.values(microservice.modules).flatMap((module) => {
        return module.methods.map((method) => {
          const formattedUri = method.uri.replace(/\/$/, "");
          return {
            type: method.type,
            uri: formattedUri,
            params: method.params,
            class: module.name,
            method: method.service,
            description: "",
            version: method.version,
          };
        });
      });
    });
    res.status(200).json(endpoints);
  } catch (error) {
    console.log("🚀 ~ exports.generatePluginRoutes= ~ error:", error)
    console.error("Error extracting routes:", error.message);
    res.status(404).json({ message: error.message });
  }
};
