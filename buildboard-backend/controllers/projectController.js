const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ✅ HELPER: Get user ID from auth middleware
const getUserId = (req) => {
  return req.user?.id || req.userId;
};

// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('📥 Fetching projects for user:', userId);
    
    const projects = await Project.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });

    console.log('✅ Projects fetched:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('❌ Get projects error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description } = req.body;

    console.log('📝 Creating project for user:', userId);
    console.log('📝 Project title:', title);

    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    if (!userId) {
      console.error('❌ No user ID in request');
      return res.status(401).json({ message: 'Unauthorized: No user ID' });
    }

    const project = await Project.create({
      title,
      description: description || '',
      createdBy: userId,
      sharedWith: []
    });

    await project.populate('createdBy', 'name email');

    console.log('✅ Project created:', project._id);
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ Create project error:', error.message);
    console.error('❌ Error details:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can delete' });
    }

    await Project.findByIdAndDelete(id);

    console.log('✅ Project deleted:', id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('❌ Delete project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ SHARE PROJECT WITH USERS
exports.shareProject = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { sharedWith } = req.body;

    console.log('📤 Sharing project:', id);
    console.log('With users:', sharedWith);

    // Validation
    if (!sharedWith || !Array.isArray(sharedWith) || sharedWith.length === 0) {
      return res.status(400).json({ 
        message: 'Please select at least one user to share with' 
      });
    }

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization - only owner can share
    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Only project owner can share this project' 
      });
    }

    // Get current user for notification
    const currentUser = await User.findById(userId).select('name email');

    // Update project with new shared users
    const currentSharedIds = project.sharedWith.map(id => id.toString());
    const newSharedIds = sharedWith.map(id => id.toString());
    
    // Combine and remove duplicates
    const allSharedIds = [...new Set([...currentSharedIds, ...newSharedIds])];
    
    project.sharedWith = allSharedIds;
    await project.save();

    // Send notifications to newly shared users
    const newlySharedUsers = sharedWith.filter(userId => 
      !currentSharedIds.includes(userId.toString())
    );

    for (const sharedUserId of newlySharedUsers) {
      try {
        await Notification.create({
          recipient: sharedUserId,
          sender: userId,
          type: 'project_shared',
          title: '📤 Project Shared with You',
          message: `${currentUser.name} shared "${project.title}" with you`,
          project: id
        });
        console.log(`✅ Notification sent to user: ${sharedUserId}`);
      } catch (notifErr) {
        console.error('⚠️ Notification error:', notifErr.message);
      }
    }

    // Populate and return
    await project.populate('createdBy', 'name email');
    await project.populate('sharedWith', 'name email');

    console.log('✅ Project shared with', allSharedIds.length, 'users');
    
    res.json({
      message: `✅ Project shared with ${allSharedIds.length} user(s)!`,
      project,
      sharedCount: allSharedIds.length
    });
  } catch (error) {
    console.error('❌ Share project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// REMOVE USER FROM SHARED PROJECT
exports.removeShareAccess = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { userId: shareUserId } = req.body;

    console.log('🔐 Removing share access from project:', id);

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    if (project.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can manage shares' });
    }

    // Remove user from sharedWith
    project.sharedWith = project.sharedWith.filter(
      id => id.toString() !== shareUserId
    );

    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('sharedWith', 'name email');

    console.log('✅ Share access removed');
    res.json({
      message: 'User removed from project',
      project
    });
  } catch (error) {
    console.error('❌ Remove share error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET SHARED PROJECTS (For reviewers)
exports.getSharedProjects = async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('📥 Fetching shared projects for user:', userId);

    const projects = await Project.find({
      sharedWith: userId
    })
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });

    console.log('✅ Shared projects fetched:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('❌ Get shared projects error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET PROJECT BY ID (With all details)
exports.getProjectById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access (owner or shared with)
    const isOwner = project.createdBy._id.toString() === userId;
    const isSharedWith = project.sharedWith.some(
      user => user._id.toString() === userId
    );

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('❌ Get project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};