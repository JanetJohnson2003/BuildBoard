const Version = require('../models/Version');
const Project = require('../models/Project');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../config/storage');

// ✅ HELPER: Get user ID from auth middleware
const getUserId = (req) => {
  return req.user?.id || req.userId;
};

// GET ALL VERSIONS FOR A PROJECT
exports.getVersions = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { projectId } = req.params;

    console.log('📥 Fetching versions for project:', projectId);

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    const isOwner = project.createdBy.toString() === userId;
    const isSharedWith = project.sharedWith.some(id => id.toString() === userId);
    
    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versions = await Version.find({ projectId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log('✅ Versions fetched:', versions.length);
    res.json(versions);
  } catch (error) {
    console.error('❌ Get versions error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// CREATE/UPLOAD VERSION - ✅ SIMPLIFIED FILE PATH!
exports.createVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { projectId } = req.params;
    const { versionNumber, releaseNotes } = req.body;

    console.log('📦 Uploading version for project:', projectId);
    console.log('📦 User ID:', userId);
    console.log('📦 Version number:', versionNumber);

    // Validation
    if (!versionNumber) {
      return res.status(400).json({ message: 'Version number is required' });
    }

    if (!userId) {
      console.error('❌ No user ID in request');
      return res.status(401).json({ message: 'Unauthorized: No user ID' });
    }

    // Verify project exists and user is owner
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can upload versions' });
    }

    // Handle file - ✅ STORE ONLY FILENAME!
    let fileData = null;
    if (req.file) {
      // ✅ Store ONLY filename - no paths!
      fileData = {
        fileName: req.file.originalname,
        filePath: req.file.filename,  // ✅ ONLY FILENAME, not full path!
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      console.log('📄 File uploaded:', req.file.originalname);
      console.log('📄 Stored filename:', req.file.filename);
    }

    // Create version
    const version = await Version.create({
      projectId,
      versionNumber,
      releaseNotes: releaseNotes || '',
      uploadedBy: userId,
      file: fileData,
      uploadedAt: new Date()
    });

    await version.populate('uploadedBy', 'name email');

    console.log('✅ Version created:', version._id);
    res.status(201).json({
      message: 'Version uploaded successfully',
      version
    });
  } catch (error) {
    console.error('❌ Create version error:', error.message);
    console.error('❌ Error details:', error);
    
    // Clean up file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: error.message });
  }
};

// DELETE VERSION
exports.deleteVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId } = req.params;

    console.log('🗑️ Deleting version:', versionId);

    const version = await Version.findById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Verify project ownership
    const project = await Project.findById(version.projectId);
    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can delete versions' });
    }

    // Delete file if exists
    if (version.file && version.file.filePath) {
      const filePath = path.join(uploadDir, version.file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ File deleted:', version.file.filePath);
      }
    }

    // Delete version
    await Version.findByIdAndDelete(versionId);

    console.log('✅ Version deleted:', versionId);
    res.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('❌ Delete version error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET VERSION BY ID
exports.getVersionById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId } = req.params;

    console.log('📖 Getting version:', versionId);

    const version = await Version.findById(versionId)
      .populate('uploadedBy', 'name email')
      .populate({
        path: 'projectId',
        populate: {
          path: 'createdBy',
          select: 'name email'
        }
      });

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Check authorization
    const project = version.projectId;
    const isOwner = project.createdBy._id.toString() === userId;
    const isSharedWith = project.sharedWith.some(id => id.toString() === userId);

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(version);
  } catch (error) {
    console.error('❌ Get version error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ DOWNLOAD VERSION FILE - SIMPLIFIED!
exports.downloadVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId } = req.params;

    console.log('⬇️ Download requested for version:', versionId);
    console.log('⬇️ User ID:', userId);

    // Find version
    const version = await Version.findById(versionId).populate('projectId');

    if (!version) {
      console.error('❌ Version not found:', versionId);
      return res.status(404).json({ message: 'Version not found' });
    }

    if (!version.file) {
      console.error('❌ No file attached to version:', versionId);
      return res.status(404).json({ message: 'No file found for this version' });
    }

    // Check authorization
    const project = version.projectId;
    const isOwner = project.createdBy.toString() === userId;
    const isSharedWith = project.sharedWith.some(id => id.toString() === userId);

    if (!isOwner && !isSharedWith) {
      console.error('❌ Access denied for user:', userId);
      return res.status(403).json({ message: 'Access denied' });
    }

    // ✅ SIMPLIFIED: Build path from uploads folder + filename
    const filePath = path.join(uploadDir, version.file.filePath);

    console.log('📄 Stored filename:', version.file.filePath);
    console.log('📄 Full file path:', filePath);
    console.log('📄 File exists:', fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found at path:', filePath);
      // List what files exist in uploads folder
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        console.log('📁 Files in uploads folder:', files);
      }
      return res.status(404).json({ message: 'File not found on server' });
    }

    console.log('✅ Downloading file:', version.file.fileName);
    res.download(filePath, version.file.fileName, (err) => {
      if (err) {
        console.error('❌ Download error:', err.message);
      } else {
        console.log('✅ File downloaded successfully');
      }
    });
  } catch (error) {
    console.error('❌ Download version error:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE VERSION
exports.updateVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId } = req.params;
    const { releaseNotes } = req.body;

    console.log('✏️ Updating version:', versionId);

    const version = await Version.findById(versionId);

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Verify project ownership
    const project = await Project.findById(version.projectId);
    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can update versions' });
    }

    // Update release notes
    version.releaseNotes = releaseNotes || version.releaseNotes;
    await version.save();

    await version.populate('uploadedBy', 'name email');

    console.log('✅ Version updated:', versionId);
    res.json({
      message: 'Version updated successfully',
      version
    });
  } catch (error) {
    console.error('❌ Update version error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
