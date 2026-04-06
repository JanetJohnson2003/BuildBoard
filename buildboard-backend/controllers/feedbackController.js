const Feedback = require('../models/Feedback');

// ADD FEEDBACK
exports.addFeedback = async (req, res) => {
  try {
    const { versionId, comment, rating } = req.body;

    const feedback = await Feedback.create({
      version: versionId,
      comment,
      rating
    });

    res.status(201).json(feedback);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FEEDBACK
exports.getFeedback = async (req, res) => {
  try {
    const { versionId } = req.params;

    const feedback = await Feedback.find({ version: versionId });
    res.json(feedback);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};