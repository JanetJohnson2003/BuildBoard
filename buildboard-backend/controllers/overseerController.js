const Repository = require('../models/Repository');
const User = require('../models/User');
const Commit = require('../models/Commit');
const File = require('../models/File');
const Branch = require('../models/Branch');
const PullRequest = require('../models/PullRequest');
const ActivityLog = require('../models/ActivityLog');
const SecurityAlert = require('../models/SecurityAlert');

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** 1. Neural Anomaly Scanner — platform-wide repo behavior outliers */
exports.neuralAnomalyScan = async (req, res) => {
  try {
    const repos = await Repository.find({})
      .populate('owner', 'username name')
      .limit(500);

    const anomalies = [];

    for (const repo of repos) {
      const branch = await Branch.findOne({ repository: repo._id, name: repo.defaultBranch || 'main' });
      const fileCount = branch
        ? await File.countDocuments({ repository: repo._id, branch: branch._id, type: 'file' })
        : 0;
      const recentCommits = await Commit.countDocuments({
        repository: repo._id,
        createdAt: { $gte: daysAgo(3) },
      });
      const openAlerts = await SecurityAlert.countDocuments({
        repository: repo._id,
        status: 'open',
      });

      const signals = [];
      if (repo.starCount >= 5 && fileCount === 0) {
        signals.push({ code: 'GHOST_STAR_MAGNET', severity: 'critical', detail: 'High stars but empty codebase' });
      }
      if (repo.forkCount >= 10 && fileCount < 3) {
        signals.push({ code: 'FORK_FARM_SHELL', severity: 'high', detail: 'Many forks on near-empty repo' });
      }
      if (repo.isArchived && recentCommits > 0) {
        signals.push({ code: 'ARCHIVE_ZOMBIE', severity: 'medium', detail: 'Archived repo still receiving commits' });
      }
      if (recentCommits > 40) {
        signals.push({ code: 'COMMIT_BURST', severity: 'high', detail: `${recentCommits} commits in 72h` });
      }
      if (openAlerts >= 3) {
        signals.push({ code: 'SECURITY_CLUSTER', severity: 'critical', detail: `${openAlerts} open security alerts` });
      }
      if (repo.visibility === 'private' && repo.starCount > 20) {
        signals.push({ code: 'PRIVATE_STAR_LEAK', severity: 'medium', detail: 'Private repo with public-level star count' });
      }

      if (signals.length) {
        anomalies.push({
          repoId: repo._id,
          name: repo.name,
          slug: repo.slug,
          owner: repo.owner?.username,
          visibility: repo.visibility,
          neuralScore: Math.min(100, signals.length * 22 + (signals.some((s) => s.severity === 'critical') ? 25 : 0)),
          signals,
        });
      }
    }

    anomalies.sort((a, b) => b.neuralScore - a.neuralScore);

    res.json({
      scannedAt: new Date().toISOString(),
      totalScanned: repos.length,
      anomalyCount: anomalies.length,
      anomalies: anomalies.slice(0, 25),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 2. Shadow Fork Matrix — duplicate identities & fork webs */
exports.shadowForkMatrix = async (req, res) => {
  try {
    const forked = await Repository.find({ forkedFrom: { $ne: null } })
      .populate('owner', 'username')
      .populate('forkedFrom', 'name slug owner');

    const nameClusters = await Repository.aggregate([
      { $group: { _id: '$slug', count: { $sum: 1 }, owners: { $addToSet: '$owner' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const shadowNodes = [];
    for (const cluster of nameClusters) {
      const ownerUsers = await User.find({ _id: { $in: cluster.owners } }).select('username createdAt');
      shadowNodes.push({
        slug: cluster._id,
        cloneCount: cluster.count,
        distinctOwners: cluster.owners.length,
        risk: cluster.count >= 5 ? 'high' : cluster.count >= 3 ? 'medium' : 'low',
        owners: ownerUsers.map((u) => ({
          username: u.username,
          accountAgeDays: Math.floor((Date.now() - new Date(u.createdAt)) / 86400000),
        })),
      });
    }

    const forkWebs = {};
    forked.forEach((r) => {
      const key = r.forkedFrom?._id?.toString() || 'unknown';
      if (!forkWebs[key]) {
        forkWebs[key] = {
          sourceName: r.forkedFrom?.name || 'Unknown',
          sourceSlug: r.forkedFrom?.slug,
          forks: [],
        };
      }
      forkWebs[key].forks.push({
        owner: r.owner?.username,
        name: r.name,
        createdAt: r.createdAt,
      });
    });

    const webs = Object.values(forkWebs)
      .filter((w) => w.forks.length >= 2)
      .sort((a, b) => b.forks.length - a.forks.length)
      .slice(0, 15);

    res.json({
      matrixId: `SFM-${Date.now().toString(36).toUpperCase()}`,
      shadowNodes,
      forkWebs: webs,
      totalForksTracked: forked.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 3. Contributor Velocity Radar — commit velocity outliers */
exports.contributorVelocityRadar = async (req, res) => {
  try {
    const since = daysAgo(7);
    const velocityRows = await Commit.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$author',
          commits7d: { $sum: 1 },
          repos: { $addToSet: '$repository' },
        },
      },
      { $sort: { commits7d: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]);

    const historical = await Commit.aggregate([
      { $match: { createdAt: { $lt: since, $gte: daysAgo(37) } } },
      { $group: { _id: '$author', commits30d: { $sum: 1 } } },
    ]);
    const histMap = new Map(historical.map((h) => [h._id?.toString(), h.commits30d]));

    const blips = velocityRows.map((row) => {
      const authorId = row._id?.toString();
      const prior30 = histMap.get(authorId) || 0;
      const weeklyBaseline = prior30 / 4.3;
      const velocityRatio = weeklyBaseline > 0 ? row.commits7d / weeklyBaseline : row.commits7d;
      let threatLevel = 'nominal';
      if (row.commits7d >= 80 || velocityRatio >= 8) threatLevel = 'critical';
      else if (row.commits7d >= 35 || velocityRatio >= 4) threatLevel = 'elevated';
      else if (row.commits7d >= 15 || velocityRatio >= 2.5) threatLevel = 'watch';

      return {
        username: row.user?.username || 'unknown',
        role: row.user?.role,
        commits7d: row.commits7d,
        repoSpread: row.repos.length,
        velocityRatio: Math.round(velocityRatio * 10) / 10,
        threatLevel,
        signature: threatLevel === 'critical' ? 'BOT_STORM' : threatLevel === 'elevated' ? 'VELOCITY_SPIKE' : 'HUMAN_PACE',
      };
    });

    res.json({
      window: '7d',
      trackedContributors: blips.length,
      blips: blips.filter((b) => b.threatLevel !== 'nominal').slice(0, 20),
      leaderboard: blips.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 4. Zero-Trust Session Lens — trust scores for active identities */
exports.zeroTrustLens = async (req, res) => {
  try {
    const recentWindow = daysAgo(1);
    const activeUsers = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: recentWindow } } },
      { $group: { _id: '$user', events24h: { $sum: 1 }, actions: { $addToSet: '$action' } } },
      { $sort: { events24h: -1 } },
      { $limit: 40 },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ]);

    const trustProfiles = [];

    for (const row of activeUsers) {
      if (!row.user) continue;
      const accountAgeDays = Math.floor(
        (Date.now() - new Date(row.user.createdAt)) / 86400000
      );
      const repoCount = await Repository.countDocuments({ owner: row.user._id });
      let trustScore = 100;
      const flags = [];

      if (row.user.isBanned) {
        trustScore = 0;
        flags.push({ code: 'BANNED_ENTITY', weight: 100 });
      }
      if (accountAgeDays < 3 && row.events24h > 50) {
        trustScore -= 40;
        flags.push({ code: 'NEWBURST', weight: 40 });
      }
      if (accountAgeDays < 7 && repoCount > 8) {
        trustScore -= 30;
        flags.push({ code: 'REPO_SPRAWL', weight: 30 });
      }
      if (row.events24h > 120) {
        trustScore -= 25;
        flags.push({ code: 'HYPER_ACTIVITY', weight: 25 });
      }
      if (row.actions.includes('REPO_DELETED') && row.events24h > 20) {
        trustScore -= 15;
        flags.push({ code: 'DESTRUCTIVE_PATTERN', weight: 15 });
      }

      trustScore = Math.max(0, trustScore);

      trustProfiles.push({
        userId: row.user._id,
        username: row.user.username,
        role: row.user.role,
        trustScore,
        clearance: trustScore >= 80 ? 'trusted' : trustScore >= 50 ? 'review' : 'quarantine',
        events24h: row.events24h,
        accountAgeDays,
        repoCount,
        flags,
      });
    }

    trustProfiles.sort((a, b) => a.trustScore - b.trustScore);

    res.json({
      lensVersion: 'ZT-2.4',
      profiles: trustProfiles.slice(0, 25),
      quarantineCount: trustProfiles.filter((p) => p.clearance === 'quarantine').length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 5. Quantum Merge Oracle — simulate merge conflict probability */
exports.quantumMergeOracle = async (req, res) => {
  try {
    const { owner, repo, sourceBranch, targetBranch } = req.body;
    if (!owner || !repo || !sourceBranch || !targetBranch) {
      return res.status(400).json({
        message: 'owner, repo, sourceBranch, and targetBranch are required',
      });
    }

    const { findRepositoryByOwnerSlug } = require('../utils/repositoryResolver');
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, [
      { path: 'owner', select: 'username' },
    ]);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const source = await Branch.findOne({ repository: repoDoc._id, name: sourceBranch });
    const target = await Branch.findOne({ repository: repoDoc._id, name: targetBranch });
    if (!source || !target) {
      return res.status(404).json({ message: 'One or both branches not found' });
    }

    const [sourceFiles, targetFiles] = await Promise.all([
      File.find({ repository: repoDoc._id, branch: source._id, type: 'file' }).select('path content size'),
      File.find({ repository: repoDoc._id, branch: target._id, type: 'file' }).select('path content size'),
    ]);

    const targetMap = new Map(targetFiles.map((f) => [f.path, f]));
    const conflicts = [];
    let additions = 0;
    let modifications = 0;

    sourceFiles.forEach((sf) => {
      const tf = targetMap.get(sf.path);
      if (!tf) {
        additions += 1;
        return;
      }
      if (sf.content !== tf.content) {
        modifications += 1;
        const divergence =
          Math.abs((sf.content || '').length - (tf.content || '').length) /
          Math.max((tf.content || '').length, 1);
        conflicts.push({
          path: sf.path,
          conflictType: divergence > 0.6 ? 'hard' : 'soft',
          divergencePercent: Math.round(divergence * 100),
        });
      }
    });

    const openPrs = await PullRequest.countDocuments({
      repository: repoDoc._id,
      status: 'open',
      sourceBranch: source._id,
      targetBranch: target._id,
    });

    const conflictScore = Math.min(
      100,
      conflicts.filter((c) => c.conflictType === 'hard').length * 18 +
        conflicts.filter((c) => c.conflictType === 'soft').length * 8 +
        modifications * 2
    );

    const mergeProbability = Math.max(0, 100 - conflictScore - openPrs * 5);
    const recommendation =
      mergeProbability >= 75
        ? 'AUTO_MERGE_SAFE'
        : mergeProbability >= 45
          ? 'HUMAN_REVIEW_REQUIRED'
          : 'ABORT_MERGE_SIMULATION';

    res.json({
      oracleId: `QMO-${Date.now().toString(36)}`,
      repository: `${owner}/${repo}`,
      sourceBranch,
      targetBranch,
      conflictScore,
      mergeProbability,
      recommendation,
      stats: { additions, modifications, conflicts: conflicts.length, openPrs },
      conflictFiles: conflicts.slice(0, 15),
      timeline: [
        { phase: 'ENTANGLEMENT', status: 'complete', ms: 12 },
        { phase: 'WAVE_COLLAPSE', status: 'complete', ms: 34 },
        { phase: 'PROBABILITY_LOCK', status: 'complete', ms: 8 },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
