exports.getModuleInfo = async (req, res) => {
  try {
    res.status(200).json(require("../config/config.json"));
  } catch (error) {
    console.log("🚀 ~ exports.getModuleInfo= ~ error:", error);
    res.status(500).json({ message: error.message });
  }
};
