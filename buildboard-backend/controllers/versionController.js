const Version = require('../models/Version');
const Project = require('../models/Project');
const User = require('../models/User');
const { createNotificationInternal } = require('./notificationController');

// UPLOAD VERSION (addVersion - matches routes.js)
exports.addVersion = async (req, res) => {
  try {
    const { projectId, versionNumber, releaseNotes } = req.body;

    if (!projectId || !versionNumber) {
      return res.status(400).json({ message: 'Project ID and version number are required' });
    }

    // Assuming file is uploaded
    const file = req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      uploadedAt: new Date()
    } : null;

    const version = await Version.create({
      project: projectId,
      versionNumber,
      releaseNotes: releaseNotes || '',
      file,
      uploadedBy: req.userId
    });

    console.log('✅ Version created:', version._id);

    await version.populate('uploadedBy', 'name email');

    // ✅ CREATE NOTIFICATION FOR PROJECT CREATOR
    try {
      const project = await Project.findById(projectId).populate('createdBy', '_id name email');
      
      if (project && project.createdBy) {
        if (project.createdBy._id.toString() !== req.userId) {
          await createNotificationInternal(
            project.createdBy._id,
            req.userId,
            'version_uploaded',
            'New Version Uploaded',
            `New version ${versionNumber} uploaded to "${project.title}"`,
            projectId,
            version._id
          );
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Notification creation error:', notifErr.message);
    }

    res.status(201).json(version);
  } catch (error) {
    console.error('❌ Create version error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET VERSIONS (getVersions - matches routes.js)
exports.getVersions = async (req, res) => {
  try {
    const { projectId } = req.params;

    const versions = await Version.find({ project: projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL VERSIONS
exports.getAllVersions = async (req, res) => {
  try {
    const versions = await Version.find()
      .populate('uploadedBy', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE VERSION
exports.deleteVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await Version.findById(versionId);

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    if (version.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Version.findByIdAndDelete(versionId);
    res.json({ message: 'Version deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};