const mongoose = require("mongoose");

const db = {};


db.mongoose = mongoose;
db.users = require("./users.model.js");
db.patientSummary = require("./patientSummary.model.js");
db.appointment = require("./appointment.model.js");

module.exports = db;
