const Feedback = require('../models/Feedback');
const Version = require('../models/Version');
const User = require('../models/User');
const { createNotificationInternal } = require('./notificationController');

// CREATE FEEDBACK
exports.createFeedback = async (req, res) => {
  try {
    console.log('📝 Creating feedback...');
    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);
    
    const { versionId, comment, rating } = req.body;

    if (!versionId || !comment || !rating) {
      console.error('❌ Missing fields:', { versionId, comment, rating });
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('✅ All fields present');
    
    const feedback = await Feedback.create({
      version: versionId,
      reviewer: req.userId,
      comment,
      rating
    });

    console.log('✅ Feedback created:', feedback._id);

    await feedback.populate('reviewer', 'name email role');

    // ✅ CREATE NOTIFICATION FOR VERSION UPLOADER
    try {
      const version = await Version.findById(versionId).populate('uploadedBy', '_id name email');
      
      if (version && version.uploadedBy) {
        const uploader = version.uploadedBy;
        const reviewer = await User.findById(req.userId);

        if (uploader._id.toString() !== req.userId) {
          await createNotificationInternal(
            uploader._id,
            req.userId,
            'feedback_received',
            'New Feedback Received',
            `${reviewer.name} gave feedback: "${comment}"`,
            version.project,
            versionId
          );
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Notification creation error:', notifErr.message);
    }

    res.status(201).json(feedback);
  } catch (error) {
    console.error('❌ Create feedback error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// GET FEEDBACK BY VERSION
exports.getFeedbackByVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const feedbacks = await Feedback.find({ version: versionId })
      .populate('reviewer', 'name email role')
      .populate('replies.author', 'name email role')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL FEEDBACK
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('reviewer', 'name email role')
      .populate('replies.author', 'name email role')
      .populate('version')
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD REPLY TO FEEDBACK
exports.addReply = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const feedback = await Feedback.findById(feedbackId).populate('reviewer', '_id name email');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.replies.push({
      author: req.userId,
      comment
    });

    await feedback.save();
    await feedback.populate('reviewer', 'name email role');
    await feedback.populate('replies.author', 'name email role');

    // ✅ CREATE NOTIFICATION FOR FEEDBACK AUTHOR
    try {
      if (feedback.reviewer._id.toString() !== req.userId) {
        const replier = await User.findById(req.userId);
        
        await createNotificationInternal(
          feedback.reviewer._id,
          req.userId,
          'reply_to_feedback',
          'Reply to Your Feedback',
          `${replier.name} replied: "${comment}"`,
          null,
          feedback.version
        );
      }
    } catch (notifErr) {
      console.error('⚠️ Notification creation error:', notifErr.message);
    }

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE REPLY
exports.deleteReply = async (req, res) => {
  try {
    const { feedbackId, replyId } = req.params;

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const reply = feedback.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    feedback.replies.id(replyId).deleteOne();
    await feedback.save();

    await feedback.populate('reviewer', 'name email role');
    await feedback.populate('replies.author', 'name email role');

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE FEEDBACK
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.reviewer.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Feedback.findByIdAndDelete(feedbackId);
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};