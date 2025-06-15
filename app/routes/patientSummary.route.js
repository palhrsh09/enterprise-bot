const router = require("express").Router();
const patientsummary = require("../controllers/patientsummary.controller")
router.get("/", patientsummary.getAll);
router.get("/:id", patientsummary.getById);
router.post("/", patientsummary.create);
router.put("/:id", patientsummary.update);
router.delete("/:id", patientsummary.delete);
module.exports = router;
