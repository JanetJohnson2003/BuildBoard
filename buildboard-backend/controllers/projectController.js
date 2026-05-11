const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET ALL PROJECTS (owned + shared with user)
exports.getProjects = async (req, res) => {
  try {
    console.log('📥 Fetching projects for user:', req.userId);
    
    const projects = await Project.find({
      $or: [
        { createdBy: req.userId },
        { sharedWith: req.userId }
      ]
    })
    .populate('createdBy', 'name email')
    .populate({
      path: 'sharedWith',
      select: 'name email role',
      match: { role: 'reviewer' }  // ← ONLY reviewers
    })
    .sort({ createdAt: -1 });

    console.log('✅ Projects fetched:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching projects:', error.message);
    res.status(500).json({ 
      message: 'Error fetching projects',
      error: error.message 
    });
  }
};

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    console.log('📝 Creating project:', title);

    const project = await Project.create({
      title,
      description,
      createdBy: req.userId
    });

    console.log('✅ Project created:', project._id);
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    res.status(500).json({ 
      message: 'Error creating project',
      error: error.message 
    });
  }
};

// GET SINGLE PROJECT
exports.getProject = async (req, res) => {
  try {
    console.log('📥 Fetching project:', req.params.id);

    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'sharedWith',
        select: 'name email role',
        match: { role: 'reviewer' }  // ← ONLY reviewers
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('✅ Project fetched:', project.title);
    res.json(project);
  } catch (error) {
    console.error('❌ Error fetching project:', error.message);
    res.status(500).json({ 
      message: 'Error fetching project',
      error: error.message 
    });
  }
};

// SHARE PROJECT - WITH NOTIFICATION (IMPROVED)
exports.shareProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    // Validate input
    if (!projectId || !userId) {
      return res.status(400).json({ message: 'Project ID and User ID are required' });
    }

    console.log('🔄 Sharing project:', projectId, 'with user:', userId);

    // Verify user is a reviewer
    const user = await User.findById(userId);
    if (!user || user.role !== 'reviewer') {
      console.error('❌ User is not a reviewer:', userId);
      return res.status(403).json({ message: 'Can only share with reviewers' });
    }

    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if already shared (using toString for proper ID comparison)
    const alreadyShared = project.sharedWith.some(id => id.toString() === userId);
    if (alreadyShared) {
      console.warn('⚠️ Project already shared with user:', userId);
      return res.status(400).json({ message: 'Already shared with this user' });
    }

    // Add user to sharedWith
    project.sharedWith.push(userId);
    await project.save();

    console.log(`✅ Project shared with reviewer ${userId}`);

    // Create notification
    try {
      await Notification.create({
        recipient: userId,
        sender: req.userId,
        type: 'project_shared',
        title: `Project "${project.title}" shared with you`,
        message: `${project.createdBy.name} shared the project "${project.title}" with you for review.`,
        project: projectId
      });
      console.log('✅ Notification created for project share');
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr.message);
      // Don't fail the share if notification fails
    }

    res.json({ message: 'Project shared successfully' });
  } catch (error) {
    console.error('❌ Share error:', error.message);
    res.status(500).json({ 
      message: 'Error sharing project',
      error: error.message 
    });
  }
};

// REMOVE USER ACCESS
exports.removeAccess = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    // Validate input
    if (!projectId || !userId) {
      return res.status(400).json({ message: 'Project ID and User ID are required' });
    }

    console.log('🗑️ Removing access for user:', userId, 'from project:', projectId);

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.createdBy.toString() !== req.userId) {
      console.error('❌ User is not project owner');
      return res.status(403).json({ message: 'Only project owner can remove access' });
    }

    // Check if user has access (using toString for proper ID comparison)
    const hasAccess = project.sharedWith.some(id => id.toString() === userId);
    if (!hasAccess) {
      console.warn('⚠️ User does not have access:', userId);
      return res.status(400).json({ message: 'This user does not have access to this project' });
    }

    // Remove user from sharedWith array
    project.sharedWith = project.sharedWith.filter(id => id.toString() !== userId);
    await project.save();

    console.log(`✅ Access removed for user ${userId}`);

    // Create notification for removed user
    try {
      await Notification.create({
        recipient: userId,
        sender: req.userId,
        type: 'access_revoked',
        title: `Access removed from "${project.title}"`,
        message: `Your access to the project "${project.title}" has been revoked.`,
        project: projectId
      });
      console.log('✅ Access removal notification created');
    } catch (notifErr) {
      console.error('⚠️ Notification error:', notifErr.message);
    }

    res.json({ message: 'User access removed successfully' });
  } catch (error) {
    console.error('❌ Remove access error:', error.message);
    res.status(500).json({ 
      message: 'Error removing access',
      error: error.message 
    });
  }
};

// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    console.log('🗑️ Deleting project:', req.params.id);

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.userId) {
      console.error('❌ User is not project owner');
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Project.findByIdAndDelete(req.params.id);
    console.log('✅ Project deleted:', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('❌ Error deleting project:', error.message);
    res.status(500).json({ 
      message: 'Error deleting project',
      error: error.message 
    });
  }
};