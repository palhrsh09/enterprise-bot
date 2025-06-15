const db = require("../models")
const PatientSummary = db.patientSummary;

exports.getAll = async (req, res) => {
  try {
    const pageIndex = parseInt(req.query.pageIndex) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortOrder = req.query.sort?.order === "ASC" ? 1 : -1;
    const sortKey = req.query.sort?.key || "createdAt";
    const query = req.query.query || "";

    const filter = req.query.showDeleted !== "true" ? { deletedAt: null } : {};
    if (query) {
      filter.$or = [
        { "bloodType": { $regex: query, $options: "i" } },
        { "chronicConditions.condition": { $regex: query, $options: "i" } }
      ];
    }

    const total = await PatientSummary.countDocuments(filter);
    const data = await PatientSummary.find(filter)
      .sort({ [sortKey]: sortOrder })
      .skip((pageIndex - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({ data, total });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await PatientSummary.findById(req.params.id);
    res.status(200).json({ data });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await PatientSummary.create(req.body);
    res.status(200).json({ data });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await PatientSummary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ isUpdated: !!data });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const force = req.query.force === "true";
    if (force) {
      await PatientSummary.findByIdAndDelete(req.params.id);
      return res.status(200).json({ isDeleted: true });
    }
    const data = await PatientSummary.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    res.status(200).json({ isDeleted: !!data });
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ message: error.message });
  }
};
