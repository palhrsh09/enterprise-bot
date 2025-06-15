const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const { ADMIN_JWT_TOKEN } = process.env;
exports.isAdmin = (user) => {
  return ["SUPER_ADMIN", "ADMIN"].includes(user.role);
};
exports.hashText = async (text) => {
  return crypto.createHash("sha256").update(text).digest("hex");
};
exports.encryptData = (data) => {
  const { SECRET_KEY } = process.env;
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};
exports.decryptData = (data) => {
  const { SECRET_KEY } = process.env;
  return CryptoJS.AES.decrypt(data, SECRET_KEY).toString(CryptoJS.enc.Utf8);
};
exports.ADMIN_TOKEN = ADMIN_JWT_TOKEN.split(" ")[1].split(".")[2];
