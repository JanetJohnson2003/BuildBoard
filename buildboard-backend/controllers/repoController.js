const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Star = require('../models/Star');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const Label = require('../models/Label');
const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');
const slugify = require('slugify');
const { findRepositoryByOwnerSlug } = require('../utils/repositoryResolver');

// GET ALL REPOS FOR CURRENT USER
exports.getMyRepos = async (req, res) => {
  try {
    const repos = await Repository.find({ owner: req.user._id })
      .populate('owner', 'username name avatar')
      .sort({ updatedAt: -1 });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PUBLIC/ACCESSIBLE REPOS
exports.getExploreRepos = async (req, res) => {
  try {
    const { sort = 'stars', language, q } = req.query;
    const filter = { visibility: 'public', isArchived: false };
    if (language) filter.language = language;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    let sortOption = { starCount: -1 };
    if (sort === 'recent') sortOption = { createdAt: -1 };
    if (sort === 'updated') sortOption = { updatedAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const repos = await Repository.find(filter)
      .populate('owner', 'username name avatar')
      .sort(sortOption)
      .limit(50);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE REPO
exports.getRepo = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username name avatar' },
      { path: 'collaborators.user', select: 'username name avatar' },
    ]);

    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    // Check access for private repos
    if (repoDoc.visibility === 'private') {
      const userId = req.user?._id?.toString();
      const isOwner = repoDoc.owner._id.toString() === userId;
      const isCollaborator = repoDoc.collaborators.some((c) => {
        const collaboratorId = c.user?._id?.toString?.() || c.user?.toString?.();
        return collaboratorId === userId;
      });
      const isReviewer = req.user?.role === 'reviewer' || req.user?.role === 'admin';

      if (!isOwner && !isCollaborator && !isReviewer) {
        return res.status(404).json({ message: 'Repository not found' });
      }
    }

    // Check if current user has starred/watched
    let isStarred = false;
    let isWatched = false;
    if (req.user) {
      const star = await Star.findOne({ user: req.user._id, repository: repoDoc._id });
      isStarred = !!star;
      
      const Watch = require('../models/Watch');
      const watch = await Watch.findOne({ user: req.user._id, repository: repoDoc._id });
      isWatched = !!watch;
    }

    res.json({ ...repoDoc.toJSON(), isStarred, isWatched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE REPO
exports.createRepo = async (req, res) => {
  try {
    const {
      name,
      description,
      visibility,
      topics,
      readme,
      isTemplate,
      templateSource,
      importedFrom,
      organization,
      website,
      license,
    } = req.body;

    if (!name) return res.status(400).json({ message: 'Repository name is required' });

    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists for this user
    const existing = await Repository.findOne({ owner: req.user._id, slug });
    if (existing) {
      return res.status(409).json({ message: 'Repository name already exists' });
    }

    const repo = await Repository.create({
      name,
      slug,
      description: description || '',
      owner: req.user._id,
      visibility: visibility || 'public',
      topics: topics || [],
      readme: readme || `# ${name}\n\nA new BuildBoard+ repository.`,
      isTemplate: !!isTemplate,
      templateSource: templateSource || null,
      importedFrom: importedFrom || undefined,
      organization: organization || null,
      website: website || '',
      license: license || '',
    });

    // Create default branch
    const branch = await Branch.create({
      repository: repo._id,
      name: 'main',
      isDefault: true,
      createdBy: req.user._id,
    });

    repo.defaultBranch = 'main';
    await repo.save();

    // Create README file
    await File.create({
      repository: repo._id,
      branch: branch._id,
      path: 'README.md',
      name: 'README.md',
      type: 'file',
      content: repo.readme,
      size: Buffer.byteLength(repo.readme, 'utf-8'),
      mimeType: 'text/markdown',
      lastModifiedBy: req.user._id,
    });

    await Label.insertMany(
      [
        { repository: repo._id, name: 'bug', color: '#d73a4a', description: 'Something is not working' },
        { repository: repo._id, name: 'enhancement', color: '#a2eeef', description: 'New feature or improvement' },
        { repository: repo._id, name: 'documentation', color: '#0075ca', description: 'Documentation work' },
        { repository: repo._id, name: 'security', color: '#b60205', description: 'Security-sensitive work' },
      ],
      { ordered: false }
    ).catch(() => {});

    // Log activity
    await ActivityLog.create({
      action: 'REPO_CREATED',
      user: req.user._id,
      repository: repo._id,
      referenceType: 'repository',
      referenceId: repo._id,
      details: { name: repo.name, visibility: repo.visibility },
    });

    await repo.populate('owner', 'username name avatar');

    res.status(201).json(repo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE REPO
exports.updateRepo = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);

    if (!repoDoc) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const isOwner = repoDoc.owner._id.toString() === req.user._id.toString();
    const isReviewer = req.user.role === 'reviewer' || req.user.role === 'admin';

    if (!isOwner && !isReviewer) {
      return res.status(403).json({ message: 'Only the owner or reviewer can update this repository' });
    }

    const { description, visibility, topics, website, license, isArchived, isTemplate, settings, security } = req.body;
    if (description !== undefined) repoDoc.description = description;
    if (visibility !== undefined) repoDoc.visibility = visibility;
    if (topics !== undefined) repoDoc.topics = topics;
    if (website !== undefined) repoDoc.website = website;
    if (license !== undefined) repoDoc.license = license;
    if (isArchived !== undefined) repoDoc.isArchived = isArchived;
    if (isTemplate !== undefined) repoDoc.isTemplate = isTemplate;
    if (settings !== undefined) repoDoc.settings = { ...repoDoc.settings.toObject?.(), ...settings };
    if (security !== undefined) repoDoc.security = { ...repoDoc.security.toObject?.(), ...security };

    await repoDoc.save();
    await repoDoc.populate('owner', 'username name avatar');

    res.json(repoDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE REPO
exports.deleteRepo = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);

    if (!repoDoc) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    if (repoDoc.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this repository' });
    }

    await Repository.findByIdAndDelete(repoDoc._id);

    // Clean up related data
    await Branch.deleteMany({ repository: repoDoc._id });
    await File.deleteMany({ repository: repoDoc._id });
    await Star.deleteMany({ repository: repoDoc._id });

    await ActivityLog.create({
      action: 'REPO_DELETED',
      user: req.user._id,
      details: { name: repoDoc.name },
    });

    res.json({ message: 'Repository deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STAR / UNSTAR
exports.toggleStar = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);

    if (!repoDoc) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const existing = await Star.findOne({ user: req.user._id, repository: repoDoc._id });

    if (existing) {
      await Star.deleteOne({ _id: existing._id });
      repoDoc.starCount = Math.max(0, repoDoc.starCount - 1);
      await repoDoc.save();
      res.json({ starred: false, starCount: repoDoc.starCount });
    } else {
      await Star.create({ user: req.user._id, repository: repoDoc._id });
      repoDoc.starCount += 1;
      await repoDoc.save();

      // Notify repo owner
      if (repoDoc.owner._id.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          recipient: repoDoc.owner._id,
          sender: req.user._id,
          type: 'repo_starred',
          title: 'Repository Starred',
          message: `${req.user.username} starred ${repoDoc.name}`,
          repository: repoDoc._id,
        });
        emitToUser(repoDoc.owner._id.toString(), 'notification:new', notification);
      }

      await ActivityLog.create({
        action: 'REPO_STARRED',
        user: req.user._id,
        repository: repoDoc._id,
        referenceType: 'repository',
        referenceId: repoDoc._id,
      });

      res.json({ starred: true, starCount: repoDoc.starCount });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORK REPO
exports.forkRepo = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const sourceRepo = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);

    if (!sourceRepo) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    if (sourceRepo.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot fork your own repository' });
    }

    // Check if already forked
    const existingFork = await Repository.findOne({
      owner: req.user._id,
      forkedFrom: sourceRepo._id,
    });
    if (existingFork) {
      return res.status(409).json({ message: 'You have already forked this repository' });
    }

    let forkName = sourceRepo.name;
    let forkSlug = sourceRepo.slug;

    // Check if slug already exists for this user
    let existingRepo = await Repository.findOne({ owner: req.user._id, slug: forkSlug });
    let counter = 1;
    while (existingRepo) {
      forkName = `${sourceRepo.name}-fork-${counter}`;
      forkSlug = `${sourceRepo.slug}-fork-${counter}`;
      existingRepo = await Repository.findOne({ owner: req.user._id, slug: forkSlug });
      counter++;
    }

    const forkedRepo = await Repository.create({
      name: forkName,
      slug: forkSlug,
      description: sourceRepo.description,
      owner: req.user._id,
      visibility: 'public',
      topics: sourceRepo.topics,
      readme: sourceRepo.readme,
      language: sourceRepo.language,
      forkedFrom: sourceRepo._id,
    });

    // Create default branch for fork
    await Branch.create({
      repository: forkedRepo._id,
      name: 'main',
      isDefault: true,
      createdBy: req.user._id,
    });

    // Update fork count
    sourceRepo.forkCount += 1;
    await sourceRepo.save();

    await ActivityLog.create({
      action: 'REPO_FORKED',
      user: req.user._id,
      repository: forkedRepo._id,
      details: { forkedFrom: sourceRepo.name, originalOwner: owner },
    });

    await forkedRepo.populate('owner', 'username name avatar');

    res.status(201).json(forkedRepo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STARRED REPOS
exports.getStarredRepos = async (req, res) => {
  try {
    const { username } = req.params;
    const User = require('../models/User');
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stars = await Star.find({ user: user._id })
      .populate({
        path: 'repository',
        populate: { path: 'owner', select: 'username name avatar' },
      })
      .sort({ createdAt: -1 });

    const repos = stars
      .filter((s) => s.repository)
      .map((s) => s.repository);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD COLLABORATOR
exports.addCollaborator = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { username, role } = req.body;

    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);
    if (!repoDoc) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    if (repoDoc.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' });
    }

    const User = require('../models/User');
    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Check if already a collaborator
    const isCollaborator = repoDoc.collaborators.some(
      (c) => c.user.toString() === targetUser._id.toString()
    );
    if (isCollaborator) {
      return res.status(409).json({ message: 'User is already a collaborator' });
    }

    repoDoc.collaborators.push({
      user: targetUser._id,
      role: role || 'write',
    });
    await repoDoc.save();

    // Notify the added collaborator
    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: req.user._id,
      type: 'collaborator_added',
      title: 'Added as Collaborator',
      message: `${req.user.username} added you as a collaborator on ${repoDoc.name}`,
      repository: repoDoc._id,
    });
    emitToUser(targetUser._id.toString(), 'notification:new', notification);

    await repoDoc.populate('collaborators.user', 'username name avatar');

    res.json(repoDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET STARGAZERS
exports.getStargazers = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const stars = await Star.find({ repository: repoDoc._id })
      .populate('user', 'username name avatar bio')
      .sort({ createdAt: -1 });

    const users = stars.map((s) => s.user).filter(Boolean);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FORKS
exports.getForks = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const forks = await Repository.find({ forkedFrom: repoDoc._id })
      .populate('owner', 'username name avatar bio')
      .sort({ createdAt: -1 });

    res.json(forks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
