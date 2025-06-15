const router = require("express").Router();
const users = require("../controllers/users.controller")

router.post("/signup", users.register);
router.post("/login", users.login);

module.exports = router;
