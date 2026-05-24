const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const Version = require('../models/Version');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// ✅ GET analytics
router.get('/', auth, async (req, res) => {
  try {
    console.log('📊 [Analytics] Request started')
    console.log('📊 [Analytics] User ID:', req.user?.id)

    if (!req.user || !req.user.id) {
      console.error('❌ [Analytics] No user in request')
      return res.status(401).json({ message: 'Unauthorized: No user' })
    }

    const userId = req.user.id

    // ✅ Get all projects for this user
    const projects = await Project.find({ createdBy: userId })
    console.log('✅ [Analytics] Projects found:', projects.length)

    // ✅ Get all versions for user's projects
    const projectIds = projects.map(p => p._id)
    const versions = await Version.find({ projectId: { $in: projectIds } })
    console.log('✅ [Analytics] Versions found:', versions.length)

    // ✅ Get all feedback for user's versions
    const versionIds = versions.map(v => v._id)
    const feedbacks = await Feedback.find({ versionId: { $in: versionIds } })
      .populate('reviewerId', 'name email')
    console.log('✅ [Analytics] Feedbacks found:', feedbacks.length)

    // ✅ Calculate KPIs
    const totalProjects = projects.length
    const totalVersions = versions.length
    const totalFeedback = feedbacks.length
    const projectsShared = projects.filter(p => p.sharedWith && p.sharedWith.length > 0).length
    
    // Unique reviewers
    const uniqueReviewers = [...new Set(feedbacks.map(f => f.reviewerId?._id?.toString()))]
    const activeReviewers = uniqueReviewers.filter(r => r).length
    
    // Average feedback per project
    const averageFeedback = totalProjects > 0 ? (totalFeedback / totalProjects).toFixed(1) : 0

    // ✅ Calculate feedback status
    const pendingFeedback = feedbacks.filter(f => f.status !== 'resolved').length
    const resolvedFeedback = feedbacks.filter(f => f.status === 'resolved').length
    const totalFeedbackCount = pendingFeedback + resolvedFeedback
    const pendingPercentage = totalFeedbackCount > 0 ? Math.round((pendingFeedback / totalFeedbackCount) * 100) : 0
    const resolvedPercentage = totalFeedbackCount > 0 ? Math.round((resolvedFeedback / totalFeedbackCount) * 100) : 0

    // ✅ Top reviewers
    const reviewerMap = {}
    feedbacks.forEach(f => {
      const reviewerId = f.reviewerId?._id?.toString()
      if (reviewerId) {
        if (!reviewerMap[reviewerId]) {
          reviewerMap[reviewerId] = {
            name: f.reviewerId?.name || 'Unknown',
            feedbackCount: 0
          }
        }
        reviewerMap[reviewerId].feedbackCount++
      }
    })
    
    const topReviewers = Object.values(reviewerMap)
      .sort((a, b) => b.feedbackCount - a.feedbackCount)
      .slice(0, 5)
    
    console.log('✅ [Analytics] Top reviewers:', topReviewers.length)

    // ✅ Most commented projects
    const projectFeedbackMap = {}
    feedbacks.forEach(f => {
      const version = versions.find(v => v._id.toString() === f.versionId.toString())
      if (version) {
        const projectId = version.projectId.toString()
        const project = projects.find(p => p._id.toString() === projectId)
        if (project) {
          if (!projectFeedbackMap[projectId]) {
            projectFeedbackMap[projectId] = {
              title: project.title,
              feedbackCount: 0
            }
          }
          projectFeedbackMap[projectId].feedbackCount++
        }
      }
    })
    
    const mostCommentedProjects = Object.values(projectFeedbackMap)
      .sort((a, b) => b.feedbackCount - a.feedbackCount)
      .slice(0, 5)
    
    console.log('✅ [Analytics] Most commented projects:', mostCommentedProjects.length)

    // ✅ Active collaborators - FIXED!
    let activeCollaborators = []
    try {
      const sharedUserIds = []
      projects.forEach(p => {
        if (p.sharedWith && Array.isArray(p.sharedWith)) {
          p.sharedWith.forEach(id => {
            const idStr = id.toString()
            if (!sharedUserIds.includes(idStr)) {
              sharedUserIds.push(idStr)
            }
          })
        }
      })

      if (sharedUserIds.length > 0) {
        // Get user details
        const sharedUsers = await User.find({ _id: { $in: sharedUserIds } }).select('email name')
        activeCollaborators = sharedUsers.map(u => u.email || u.name || 'Unknown User')
      }
      
      console.log('✅ [Analytics] Active collaborators found:', activeCollaborators.length)
    } catch (err) {
      console.error('❌ [Analytics] Error fetching collaborators:', err.message)
      activeCollaborators = []
    }

    // ✅ Recent activities
    const recentActivities = []

    // Add project creation activities
    projects.forEach(p => {
      recentActivities.push({
        type: 'project',
        description: `Created project: ${p.title}`,
        date: p.createdAt,
        icon: '📁'
      })
    })

    // Add version upload activities
    versions.forEach(v => {
      const project = projects.find(p => p._id.toString() === v.projectId.toString())
      if (project) {
        recentActivities.push({
          type: 'version',
          description: `Uploaded version ${v.versionNumber} to ${project.title}`,
          date: v.uploadedAt || v.createdAt,
          icon: '📦'
        })
      }
    })

    // Add feedback activities
    feedbacks.forEach(f => {
      const version = versions.find(v => v._id.toString() === f.versionId.toString())
      if (version) {
        const project = projects.find(p => p._id.toString() === version.projectId.toString())
        if (project) {
          recentActivities.push({
            type: 'feedback',
            description: `Received feedback on ${project.title}`,
            date: f.createdAt,
            icon: '💬'
          })
        }
      }
    })

    // Sort by date descending and get latest 10
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

    console.log('✅ [Analytics] Recent activities:', sortedActivities.length)

    // ✅ Build response
    const analytics = {
      kpis: {
        totalProjects,
        totalVersions,
        totalFeedback,
        projectsShared,
        activeReviewers,
        averageFeedback: parseFloat(averageFeedback)
      },
      feedback: {
        pending: pendingFeedback,
        resolved: resolvedFeedback,
        pendingPercentage,
        resolvedPercentage
      },
      topReviewers,
      mostCommentedProjects,
      activeCollaborators,
      recentActivities: sortedActivities,
      versionsPerProject: []
    }

    console.log('✅ [Analytics] Analytics prepared successfully')
    res.json(analytics)

  } catch (error) {
    console.error('❌ [Analytics] Error:', error.message)
    res.status(500).json({ 
      message: 'Failed to fetch analytics',
      error: error.message
    })
  }
})

module.exports = router