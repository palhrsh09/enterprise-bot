const router = require("express").Router();
const appointment = require("../controllers/appointment.controller")
router.get("/", appointment.getAppointments);
router.get("/:id", appointment.getAppointmentById);
router.post("/", appointment.createAppointment);
router.put("/:id", appointment.updateAppointment);
router.delete("/:id", appointment.deleteAppointment);
module.exports = router;
