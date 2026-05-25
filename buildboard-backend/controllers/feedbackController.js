const Feedback = require('../models/Feedback');
const Version = require('../models/Version');
const Project = require('../models/Project');
const User = require('../models/User');

// ✅ Helper: Get user ID
const getUserId = (req) => {
  return req.user?.id || req.userId;
};

// GET FEEDBACK BY VERSION ID
exports.getFeedbackByVersion = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId } = req.params;

    console.log('📥 Getting feedback for version:', versionId);

    // Find version
    const version = await Version.findById(versionId).populate('projectId');
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Check authorization
    const project = version.projectId;
    const isOwner = project.createdBy.toString() === userId;
    const isSharedWith = project.sharedWith.some(id => id.toString() === userId);

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get feedback
    const feedback = await Feedback.find({ versionId })
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 });

    console.log('✅ Feedback fetched:', feedback.length);
    res.json(feedback);
  } catch (error) {
    console.error('❌ Error fetching feedback:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// CREATE FEEDBACK
exports.createFeedback = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { versionId, comment, status } = req.body;

    console.log('💬 Creating feedback...');
    console.log('💬 Version ID:', versionId);
    console.log('💬 User ID:', userId);

    // Validation
    if (!versionId || !comment) {
      return res.status(400).json({ 
        message: 'Version ID and comment are required' 
      });
    }

    // Find version
    const version = await Version.findById(versionId).populate('projectId');
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      versionId,
      reviewerId: userId,
      comment,
      status: status || 'pending'
    });

    await feedback.populate('reviewerId', 'name email');

    console.log('✅ Feedback created:', feedback._id);
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('❌ Create feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET FEEDBACK BY ID
exports.getFeedbackById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId)
      .populate('reviewerId', 'name email')
      .populate({
        path: 'versionId',
        populate: {
          path: 'projectId'
        }
      });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check authorization
    const project = feedback.versionId.projectId;
    const isOwner = project.createdBy.toString() === userId;
    const isReviewer = feedback.reviewerId._id.toString() === userId;

    if (!isOwner && !isReviewer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('❌ Get feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE FEEDBACK
exports.updateFeedback = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { feedbackId } = req.params;
    const { comment, status } = req.body;

    console.log('✏️ Updating feedback:', feedbackId);

    const feedback = await Feedback.findById(feedbackId).populate('versionId');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check authorization - only creator or project owner can update
    const version = await Version.findById(feedback.versionId).populate('projectId');
    const isOwner = version.projectId.createdBy.toString() === userId;
    const isCreator = feedback.reviewerId.toString() === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (comment) feedback.comment = comment;
    if (status) feedback.status = status;

    await feedback.save();
    await feedback.populate('reviewerId', 'name email');

    console.log('✅ Feedback updated');
    res.json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('❌ Update feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE FEEDBACK
exports.deleteFeedback = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { feedbackId } = req.params;

    console.log('🗑️ Deleting feedback:', feedbackId);

    const feedback = await Feedback.findById(feedbackId).populate('versionId');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check authorization
    const version = await Version.findById(feedback.versionId).populate('projectId');
    const isOwner = version.projectId.createdBy.toString() === userId;
    const isCreator = feedback.reviewerId.toString() === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    console.log('✅ Feedback deleted');
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('❌ Delete feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};