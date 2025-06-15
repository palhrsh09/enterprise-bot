module.exports = {
  API_URL: process.env.API_URL || "http://localhost:8000",
  ADMIN_JWT_TOKEN: process.env.ADMIN_JWT_TOKEN || "your-secret-key",
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "DEV",
  CORS_URLS: process.env.CORS_URLS || "http://localhost:5173" || "http://127.0.0.1",
};
