const Version = require('../models/Version');

// ADD VERSION
exports.addVersion = async (req, res) => {
  try {
    const { projectId, description } = req.body;

    const count = await Version.countDocuments({ project: projectId });

    const version = await Version.create({
      project: projectId,
      versionNumber: count + 1,
      description,
      file: req.file ? req.file.filename : null
    });

    res.status(201).json(version);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET VERSIONS
exports.getVersions = async (req, res) => {
  try {
    const { projectId } = req.params;

    const versions = await Version.find({ project: projectId });
    res.json(versions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};