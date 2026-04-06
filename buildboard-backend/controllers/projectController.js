const Project = require('../models/Project');

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const project = await Project.create({
      title,
      description,
      user: req.userId
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.userId });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.shareProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const project = await Project.findById(projectId);
    if (!project.sharedWith.includes(userId)) {
      project.sharedWith.push(userId);
      await project.save();
    }
    res.json({ message: "Project shared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};