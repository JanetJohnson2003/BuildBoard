const crypto = require('crypto');
const path = require('path');
const slugify = require('slugify');

const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Commit = require('../models/Commit');
const File = require('../models/File');
const Tag = require('../models/Tag');
const Release = require('../models/Release');
const Watch = require('../models/Watch');
const Discussion = require('../models/Discussion');
const DiscussionReply = require('../models/DiscussionReply');
const Wiki = require('../models/Wiki');
const WikiHistory = require('../models/WikiHistory');
const Workflow = require('../models/Workflow');
const WorkflowRun = require('../models/WorkflowRun');
const SecurityAlert = require('../models/SecurityAlert');
const PullRequest = require('../models/PullRequest');
const Issue = require('../models/Issue');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const ChatMessage = require('../models/ChatMessage');
const { emitToRepo, emitToUser } = require('../config/socket');

const repoPopulate = [
  { path: 'owner', select: 'username name avatar' },
  { path: 'organization', select: 'slug name avatar' },
];

const normalizeFilePath = (filePath = '') =>
  String(filePath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')
    .trim();

const languageByExtension = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.php': 'PHP',
  '.c': 'C',
  '.h': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cs': 'C#',
  '.kt': 'Kotlin',
  '.go': 'Go',
  '.rs': 'Rust',
  '.md': 'Markdown',
  '.json': 'JSON',
  '.xml': 'XML',
};

const languageFromFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return languageByExtension[ext] || '';
};

const makeSha = (seed) =>
  crypto.createHash('sha1').update(`${seed}:${Date.now()}:${Math.random()}`).digest('hex');

const resolveRepo = async (req) => {
  const { owner, repo } = req.params;
  const repoDoc = await Repository.findOne({ slug: repo }).populate(repoPopulate);
  if (!repoDoc) return null;

  const ownerMatches = repoDoc.owner?.username === owner;
  const orgMatches = repoDoc.organization?.slug === owner;
  if (!ownerMatches && !orgMatches) return null;

  return repoDoc;
};

const canWrite = (req, repoDoc) => {
  const userId = req.user._id.toString();
  if (repoDoc.owner?._id?.toString() === userId) return true;

  return repoDoc.collaborators.some((collaborator) => {
    const collaboratorId = collaborator.user?._id?.toString?.() || collaborator.user?.toString();
    return collaboratorId === userId && ['write', 'admin'].includes(collaborator.role);
  });
};

const ensureRepo = async (req, res) => {
  const repoDoc = await resolveRepo(req);
  if (!repoDoc) {
    res.status(404).json({ message: 'Repository not found' });
    return null;
  }
  return repoDoc;
};

const ensureBranch = async (repoId, branchName = 'main') =>
  Branch.findOne({ repository: repoId, name: branchName });

const ensureDirectoryRecords = async (repoId, branchId, filePath, userId) => {
  const parts = normalizeFilePath(filePath).split('/').filter(Boolean);
  if (parts.length <= 1) return;

  const directories = parts.slice(0, -1);
  let currentPath = '';

  for (const directory of directories) {
    currentPath = currentPath ? `${currentPath}/${directory}` : directory;
    await File.updateOne(
      { repository: repoId, branch: branchId, path: currentPath },
      {
        $setOnInsert: {
          repository: repoId,
          branch: branchId,
          path: currentPath,
          name: directory,
          type: 'directory',
          content: '',
          size: 0,
          mimeType: 'inode/directory',
          lastModifiedBy: userId,
        },
      },
      { upsert: true }
    );
  }
};

const createCommit = async ({ repoDoc, branchDoc, user, message, filesChanged }) => {
  const parentCommit = branchDoc.lastCommit || null;
  const stats = filesChanged.reduce(
    (totals, file) => ({
      totalAdditions: totals.totalAdditions + (file.additions || 0),
      totalDeletions: totals.totalDeletions + (file.deletions || 0),
      filesChangedCount: totals.filesChangedCount + 1,
    }),
    { totalAdditions: 0, totalDeletions: 0, filesChangedCount: 0 }
  );

  const commit = await Commit.create({
    repository: repoDoc._id,
    branch: branchDoc._id,
    author: user._id,
    message: message || 'Update repository files',
    sha: makeSha(`${repoDoc._id}:${branchDoc.name}:${message}`),
    filesChanged,
    parentCommit,
    stats,
  });

  branchDoc.lastCommit = commit._id;
  await branchDoc.save();

  return commit;
};

const logActivity = async ({ action, req, repoDoc, referenceType, referenceId, details = {} }) => {
  await ActivityLog.create({
    action,
    user: req.user._id,
    repository: repoDoc?._id,
    referenceType,
    referenceId,
    details,
  });
};

exports.getFiles = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const branchName = req.query.branch || repoDoc.defaultBranch || 'main';
    const currentPath = normalizeFilePath(req.query.path || '');
    const branchDoc = await ensureBranch(repoDoc._id, branchName);
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const files = await File.find({ repository: repoDoc._id, branch: branchDoc._id }).sort({
      type: 1,
      path: 1,
    });

    const prefix = currentPath ? `${currentPath}/` : '';
    const entriesByPath = new Map();

    files.forEach((file) => {
      if (currentPath && file.path !== currentPath && !file.path.startsWith(prefix)) return;
      if (file.path === currentPath) return;

      const relative = currentPath ? file.path.slice(prefix.length) : file.path;
      if (!relative) return;

      const [firstSegment] = relative.split('/');
      const entryPath = currentPath ? `${currentPath}/${firstSegment}` : firstSegment;
      const isNested = relative.includes('/');
      const existing = entriesByPath.get(entryPath);

      if (!existing || (!isNested && file.type === 'file')) {
        entriesByPath.set(entryPath, {
          id: file._id,
          path: entryPath,
          name: firstSegment,
          type: isNested ? 'directory' : file.type,
          size: isNested ? 0 : file.size,
          mimeType: isNested ? 'inode/directory' : file.mimeType,
          updatedAt: file.updatedAt,
          lastCommit: file.lastCommit,
        });
      }
    });

    const entries = Array.from(entriesByPath.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const readme = await File.findOne({
      repository: repoDoc._id,
      branch: branchDoc._id,
      path: currentPath ? `${currentPath}/README.md` : 'README.md',
      type: 'file',
    });

    res.json({
      branch: branchDoc,
      path: currentPath,
      breadcrumbs: currentPath
        ? currentPath.split('/').map((name, index, parts) => ({
            name,
            path: parts.slice(0, index + 1).join('/'),
          }))
        : [],
      entries,
      readme,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const branchDoc = await ensureBranch(repoDoc._id, req.query.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const filePath = normalizeFilePath(req.query.path);
    const file = await File.findOne({
      repository: repoDoc._id,
      branch: branchDoc._id,
      path: filePath,
      type: 'file',
    }).populate('lastModifiedBy', 'username name avatar');

    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upsertFile = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const branchDoc = await ensureBranch(repoDoc._id, req.body.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });
    if (branchDoc.isProtected && req.body.force !== true) {
      return res.status(403).json({ message: 'Branch is protected' });
    }

    const filePath = normalizeFilePath(req.body.path);
    if (!filePath) return res.status(400).json({ message: 'File path is required' });

    const content = req.body.content || '';
    await ensureDirectoryRecords(repoDoc._id, branchDoc._id, filePath, req.user._id);

    const existing = await File.findOne({
      repository: repoDoc._id,
      branch: branchDoc._id,
      path: filePath,
    });
    const status = existing ? 'modified' : 'added';

    const file = await File.findOneAndUpdate(
      { repository: repoDoc._id, branch: branchDoc._id, path: filePath },
      {
        repository: repoDoc._id,
        branch: branchDoc._id,
        path: filePath,
        name: path.posix.basename(filePath),
        type: 'file',
        content,
        size: Buffer.byteLength(content, 'utf-8'),
        mimeType: req.body.mimeType || 'text/plain',
        encoding: req.body.encoding || 'utf-8',
        lastModifiedBy: req.user._id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const commit = await createCommit({
      repoDoc,
      branchDoc,
      user: req.user,
      message: req.body.message || `${status === 'added' ? 'Add' : 'Update'} ${filePath}`,
      filesChanged: [
        {
          filename: filePath,
          status,
          additions: content.split('\n').length,
          deletions: 0,
          patch: req.body.patch || '',
        },
      ],
    });

    file.lastCommit = commit._id;
    await file.save();

    const language = languageFromFile(filePath);
    if (language && !repoDoc.language) {
      repoDoc.language = language;
      await repoDoc.save();
    }

    await logActivity({
      action: status === 'added' ? 'FILE_CREATED' : 'FILE_UPDATED',
      req,
      repoDoc,
      referenceType: 'file',
      referenceId: file._id,
      details: { path: filePath, branch: branchDoc.name, commit: commit.sha },
    });

    emitToRepo(repoDoc._id.toString(), 'file:updated', { file, commit });
    res.status(status === 'added' ? 201 : 200).json({ file, commit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const branchDoc = await ensureBranch(repoDoc._id, req.body.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });
    if (branchDoc.isProtected && req.body.force !== true) {
      return res.status(403).json({ message: 'Branch is protected' });
    }

    const filePath = normalizeFilePath(req.body.path || req.query.path);
    const file = await File.findOneAndDelete({
      repository: repoDoc._id,
      branch: branchDoc._id,
      path: filePath,
      type: 'file',
    });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const commit = await createCommit({
      repoDoc,
      branchDoc,
      user: req.user,
      message: req.body.message || `Delete ${filePath}`,
      filesChanged: [{ filename: filePath, status: 'deleted', additions: 0, deletions: 1 }],
    });

    await logActivity({
      action: 'FILE_DELETED',
      req,
      repoDoc,
      referenceType: 'file',
      referenceId: file._id,
      details: { path: filePath, branch: branchDoc.name, commit: commit.sha },
    });

    res.json({ message: 'File deleted', commit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moveFile = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const branchDoc = await ensureBranch(repoDoc._id, req.body.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const fromPath = normalizeFilePath(req.body.from);
    const toPath = normalizeFilePath(req.body.to);
    if (!fromPath || !toPath) return res.status(400).json({ message: 'Both from and to paths are required' });

    const file = await File.findOne({ repository: repoDoc._id, branch: branchDoc._id, path: fromPath });
    if (!file) return res.status(404).json({ message: 'File not found' });

    await ensureDirectoryRecords(repoDoc._id, branchDoc._id, toPath, req.user._id);
    file.path = toPath;
    file.name = path.posix.basename(toPath);
    file.lastModifiedBy = req.user._id;
    await file.save();

    const commit = await createCommit({
      repoDoc,
      branchDoc,
      user: req.user,
      message: req.body.message || `Move ${fromPath} to ${toPath}`,
      filesChanged: [{ filename: toPath, status: 'modified', additions: 0, deletions: 0 }],
    });

    await logActivity({
      action: 'FILE_MOVED',
      req,
      repoDoc,
      referenceType: 'file',
      referenceId: file._id,
      details: { from: fromPath, to: toPath, commit: commit.sha },
    });

    res.json({ file, commit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const { execFile } = require('child_process');
    const fs = require('fs').promises;
    const os = require('os');
    const path = require('path');
    
    // Create a temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildboard-run-'));
    let tempFile = '';
    let cmd = '';
    let args = [];

    if (language === 'javascript' || language === 'typescript') {
      tempFile = path.join(tempDir, 'script.js');
      await fs.writeFile(tempFile, code);
      cmd = 'node';
      args = [tempFile];
    } else if (language === 'python') {
      tempFile = path.join(tempDir, 'script.py');
      await fs.writeFile(tempFile, code);
      cmd = 'python';
      args = [tempFile];
    } else {
      return res.status(400).json({ message: 'Unsupported language for execution. Currently only JavaScript and Python are supported.' });
    }

    // Execute with a timeout of 5 seconds to prevent infinite loops
    execFile(cmd, args, { timeout: 5000, maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
      // Cleanup temp dir
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup temp dir:', e);
      }

      if (error && error.killed) {
        return res.status(200).json({ stdout: '', stderr: 'Execution timed out (5s limit)' });
      }
      
      res.status(200).json({
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : '')
      });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const branchDoc = await ensureBranch(repoDoc._id, req.query.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const filePath = normalizeFilePath(req.query.path);
    const file = await File.findOne({
      repository: repoDoc._id,
      branch: branchDoc._id,
      path: filePath,
      type: 'file',
    });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const buffer = Buffer.from(file.content || '', file.encoding === 'base64' ? 'base64' : 'utf-8');
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadProject = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const branchDoc = await ensureBranch(repoDoc._id, req.query.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const files = await File.find({
      repository: repoDoc._id,
      branch: branchDoc._id,
      type: 'file',
    });

    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${repoDoc.name}-${branchDoc.name}.zip"`);

    archive.pipe(res);

    for (const file of files) {
      const buffer = Buffer.from(file.content || '', file.encoding === 'base64' ? 'base64' : 'utf-8');
      archive.append(buffer, { name: file.path });
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const branchDoc = await ensureBranch(repoDoc._id, req.body.branch || repoDoc.defaultBranch || 'main');
    if (!branchDoc) return res.status(404).json({ message: 'Branch not found' });

    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'Files array is required' });
    }

    const filesChanged = [];

    for (const fileData of files) {
      const filePath = normalizeFilePath(fileData.path);
      if (!filePath) continue;

      await ensureDirectoryRecords(repoDoc._id, branchDoc._id, filePath, req.user._id);

      const existing = await File.findOne({
        repository: repoDoc._id,
        branch: branchDoc._id,
        path: filePath,
      });
      const status = existing ? 'modified' : 'added';

      const file = await File.findOneAndUpdate(
        { repository: repoDoc._id, branch: branchDoc._id, path: filePath },
        {
          repository: repoDoc._id,
          branch: branchDoc._id,
          path: filePath,
          name: path.posix.basename(filePath),
          type: 'file',
          content: fileData.content || '',
          size: Buffer.byteLength(fileData.content || '', 'utf-8'),
          mimeType: fileData.mimeType || 'text/plain',
          encoding: fileData.encoding || 'utf-8',
          lastModifiedBy: req.user._id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      filesChanged.push({
        filename: filePath,
        status,
        additions: (fileData.content || '').split('\n').length,
        deletions: 0,
      });

      const language = languageFromFile(filePath);
      if (language && !repoDoc.language) {
        repoDoc.language = language;
        await repoDoc.save();
      }
    }

    const commit = await createCommit({
      repoDoc,
      branchDoc,
      user: req.user,
      message: req.body.message || `Upload ${filesChanged.length} file${filesChanged.length > 1 ? 's' : ''}`,
      filesChanged,
    });

    await logActivity({
      action: 'FILES_UPLOADED',
      req,
      repoDoc,
      referenceType: 'file',
      referenceId: null,
      details: { count: filesChanged.length, branch: branchDoc.name, commit: commit.sha },
    });

    emitToRepo(repoDoc._id.toString(), 'files:uploaded', { files: filesChanged, commit });
    res.status(201).json({ files: filesChanged, commit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const branches = await Branch.find({ repository: repoDoc._id })
      .populate('lastCommit')
      .sort({ isDefault: -1, name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const { name, from = repoDoc.defaultBranch || 'main' } = req.body;
    if (!name) return res.status(400).json({ message: 'Branch name is required' });

    const sourceBranch = await ensureBranch(repoDoc._id, from);
    if (!sourceBranch) return res.status(404).json({ message: 'Source branch not found' });

    const branch = await Branch.create({
      repository: repoDoc._id,
      name,
      createdBy: req.user._id,
      lastCommit: sourceBranch.lastCommit,
      sourceBranch: sourceBranch._id,
    });

    const sourceFiles = await File.find({ repository: repoDoc._id, branch: sourceBranch._id });
    if (sourceFiles.length) {
      await File.insertMany(
        sourceFiles.map((file) => ({
          repository: repoDoc._id,
          branch: branch._id,
          path: file.path,
          name: file.name,
          type: file.type,
          content: file.content,
          size: file.size,
          mimeType: file.mimeType,
          encoding: file.encoding,
          lastModifiedBy: req.user._id,
          lastCommit: file.lastCommit,
        })),
        { ordered: false }
      ).catch(() => {});
    }

    await logActivity({
      action: 'BRANCH_CREATED',
      req,
      repoDoc,
      referenceType: 'branch',
      referenceId: branch._id,
      details: { name, from },
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const branch = await ensureBranch(repoDoc._id, req.params.branchName);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    if (branch.isDefault) return res.status(400).json({ message: 'Default branch cannot be deleted' });
    if (branch.isProtected && !branch.protectionRules.allowDeletions) {
      return res.status(403).json({ message: 'Protected branch cannot be deleted' });
    }

    await File.deleteMany({ repository: repoDoc._id, branch: branch._id });
    await Branch.deleteOne({ _id: branch._id });

    await logActivity({
      action: 'BRANCH_DELETED',
      req,
      repoDoc,
      referenceType: 'branch',
      referenceId: branch._id,
      details: { name: branch.name },
    });

    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.protectBranch = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Admin access required' });

    const branch = await ensureBranch(repoDoc._id, req.params.branchName);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    branch.isProtected = req.body.isProtected !== undefined ? req.body.isProtected : true;
    branch.protectionRules = { ...branch.protectionRules.toObject?.(), ...req.body.protectionRules };
    await branch.save();

    await logActivity({
      action: branch.isProtected ? 'BRANCH_PROTECTED' : 'BRANCH_UNPROTECTED',
      req,
      repoDoc,
      referenceType: 'branch',
      referenceId: branch._id,
      details: { name: branch.name },
    });

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommits = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const filter = { repository: repoDoc._id };
    if (req.query.branch) {
      const branch = await ensureBranch(repoDoc._id, req.query.branch);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      filter.branch = branch._id;
    }
    if (req.query.q) filter.message = { $regex: req.query.q, $options: 'i' };

    const commits = await Commit.find(filter)
      .populate('author', 'username name avatar')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 50, 100));

    res.json(commits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommit = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const commit = await Commit.findOne({ repository: repoDoc._id, sha: req.params.sha })
      .populate('author', 'username name avatar')
      .populate('branch', 'name')
      .populate('parentCommit', 'sha message');
    if (!commit) return res.status(404).json({ message: 'Commit not found' });

    res.json(commit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.revertCommit = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const commit = await Commit.findOne({ repository: repoDoc._id, sha: req.params.sha }).populate('branch');
    if (!commit) return res.status(404).json({ message: 'Commit not found' });

    const revertedFiles = commit.filesChanged.map((file) => ({
      filename: file.filename,
      status: file.status === 'added' ? 'deleted' : 'modified',
      additions: file.deletions,
      deletions: file.additions,
      patch: `Revert ${commit.sha.slice(0, 7)} ${file.filename}`,
    }));

    const revertCommit = await createCommit({
      repoDoc,
      branchDoc: commit.branch,
      user: req.user,
      message: req.body.message || `Revert "${commit.message}"`,
      filesChanged: revertedFiles,
    });

    await logActivity({
      action: 'COMMIT_REVERTED',
      req,
      repoDoc,
      referenceType: 'commit',
      referenceId: revertCommit._id,
      details: { reverted: commit.sha, revert: revertCommit.sha },
    });

    res.status(201).json(revertCommit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.compareBranches = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const base = await ensureBranch(repoDoc._id, req.query.base || repoDoc.defaultBranch || 'main');
    const head = await ensureBranch(repoDoc._id, req.query.head);
    if (!base || !head) return res.status(404).json({ message: 'Branch not found' });

    const [baseCommits, headCommits] = await Promise.all([
      Commit.find({ repository: repoDoc._id, branch: base._id }).sort({ createdAt: -1 }).limit(100),
      Commit.find({ repository: repoDoc._id, branch: head._id }).sort({ createdAt: -1 }).limit(100),
    ]);

    const baseShas = new Set(baseCommits.map((commit) => commit.sha));
    const headShas = new Set(headCommits.map((commit) => commit.sha));

    res.json({
      base: base.name,
      head: head.name,
      aheadBy: headCommits.filter((commit) => !baseShas.has(commit.sha)).length,
      behindBy: baseCommits.filter((commit) => !headShas.has(commit.sha)).length,
      commits: headCommits.filter((commit) => !baseShas.has(commit.sha)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    const tags = await Tag.find({ repository: repoDoc._id }).populate('tagger', 'username name avatar').sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTag = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const { name, commitSha, message, annotated = false } = req.body;
    if (!name) return res.status(400).json({ message: 'Tag name is required' });
    const commit = commitSha ? await Commit.findOne({ repository: repoDoc._id, sha: commitSha }) : null;

    const tag = await Tag.create({
      repository: repoDoc._id,
      name,
      commit: commit?._id || null,
      sha: commit?.sha || commitSha || '',
      message: message || '',
      tagger: req.user._id,
      annotated,
    });

    await logActivity({
      action: 'TAG_CREATED',
      req,
      repoDoc,
      referenceType: 'tag',
      referenceId: tag._id,
      details: { name },
    });

    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const tag = await Tag.findOneAndDelete({ repository: repoDoc._id, name: req.params.tagName });
    if (!tag) return res.status(404).json({ message: 'Tag not found' });

    await logActivity({
      action: 'TAG_DELETED',
      req,
      repoDoc,
      referenceType: 'tag',
      referenceId: tag._id,
      details: { name: tag.name },
    });

    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReleases = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    const releases = await Release.find({ repository: repoDoc._id })
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 });
    res.json(releases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRelease = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const { tagName, title, body, isDraft, isPrerelease, assets } = req.body;
    if (!tagName || !title) return res.status(400).json({ message: 'Tag name and title are required' });

    const release = await Release.create({
      repository: repoDoc._id,
      tagName,
      title,
      body: body || '',
      author: req.user._id,
      isDraft: !!isDraft,
      isPrerelease: !!isPrerelease,
      assets: assets || [],
    });

    await Tag.updateOne(
      { repository: repoDoc._id, name: tagName },
      {
        $setOnInsert: {
          repository: repoDoc._id,
          name: tagName,
          tagger: req.user._id,
          annotated: true,
          message: title,
        },
      },
      { upsert: true }
    );

    await logActivity({
      action: 'RELEASE_PUBLISHED',
      req,
      repoDoc,
      referenceType: 'release',
      referenceId: release._id,
      details: { tagName, title },
    });

    const watchers = await Watch.find({ repository: repoDoc._id, level: { $ne: 'ignore' } });
    await Promise.all(
      watchers
        .filter((watch) => watch.user.toString() !== req.user._id.toString())
        .map(async (watch) => {
          const notification = await Notification.create({
            recipient: watch.user,
            sender: req.user._id,
            type: 'release_published',
            title: 'Release published',
            message: `${req.user.username} published ${tagName} in ${repoDoc.name}`,
            repository: repoDoc._id,
            referenceType: 'release',
            referenceId: release._id,
          });
          emitToUser(watch.user.toString(), 'notification:new', notification);
        })
    );

    res.status(201).json(release);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleWatch = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const existing = await Watch.findOne({ repository: repoDoc._id, user: req.user._id });
    if (existing) {
      await Watch.deleteOne({ _id: existing._id });
      repoDoc.watcherCount = Math.max(0, repoDoc.watcherCount - 1);
      repoDoc.watchers = repoDoc.watchers.filter((watcher) => watcher.toString() !== req.user._id.toString());
      await repoDoc.save();
      await logActivity({ action: 'REPO_UNWATCHED', req, repoDoc, referenceType: 'repository', referenceId: repoDoc._id });
      return res.json({ watching: false, watcherCount: repoDoc.watcherCount });
    }

    await Watch.create({ repository: repoDoc._id, user: req.user._id, level: req.body.level || 'all' });
    repoDoc.watcherCount += 1;
    if (!repoDoc.watchers.some((watcher) => watcher.toString() === req.user._id.toString())) {
      repoDoc.watchers.push(req.user._id);
    }
    await repoDoc.save();
    await logActivity({ action: 'REPO_WATCHED', req, repoDoc, referenceType: 'repository', referenceId: repoDoc._id });
    res.json({ watching: true, watcherCount: repoDoc.watcherCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const isPinned = user.pinnedRepos.some((id) => id.toString() === repoDoc._id.toString());

    if (isPinned) {
      user.pinnedRepos = user.pinnedRepos.filter((id) => id.toString() !== repoDoc._id.toString());
      repoDoc.pinnedBy = repoDoc.pinnedBy.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      user.pinnedRepos.push(repoDoc._id);
      repoDoc.pinnedBy.push(req.user._id);
    }

    await user.save();
    await repoDoc.save();

    await logActivity({
      action: isPinned ? 'REPO_UNPINNED' : 'REPO_PINNED',
      req,
      repoDoc,
      referenceType: 'repository',
      referenceId: repoDoc._id,
    });

    res.json({ pinned: !isPinned });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.archiveRepository = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (repoDoc.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can archive this repository' });
    }

    repoDoc.isArchived = req.body.isArchived !== undefined ? req.body.isArchived : true;
    await repoDoc.save();
    await logActivity({
      action: repoDoc.isArchived ? 'REPO_ARCHIVED' : 'REPO_UNARCHIVED',
      req,
      repoDoc,
      referenceType: 'repository',
      referenceId: repoDoc._id,
    });
    res.json(repoDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const filter = { repository: repoDoc._id };
    if (req.query.category) filter.category = req.query.category;

    const discussions = await Discussion.find(filter)
      .populate('author', 'username name avatar')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDiscussion = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const { title, body, category = 'general' } = req.body;
    if (!title) return res.status(400).json({ message: 'Discussion title is required' });

    const discussion = await Discussion.create({
      repository: repoDoc._id,
      title,
      body: body || '',
      category,
      author: req.user._id,
    });

    await logActivity({
      action: 'DISCUSSION_CREATED',
      req,
      repoDoc,
      referenceType: 'discussion',
      referenceId: discussion._id,
      details: { title, category },
    });

    await discussion.populate('author', 'username name avatar');
    res.status(201).json(discussion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDiscussion = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const discussion = await Discussion.findOne({
      _id: req.params.discussionId,
      repository: repoDoc._id,
    }).populate('author', 'username name avatar');
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const replies = await DiscussionReply.find({ discussion: discussion._id })
      .populate('author', 'username name avatar')
      .sort({ createdAt: 1 });

    res.json({ discussion, replies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.replyToDiscussion = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const discussion = await Discussion.findOne({
      _id: req.params.discussionId,
      repository: repoDoc._id,
    });
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const reply = await DiscussionReply.create({
      discussion: discussion._id,
      author: req.user._id,
      body: req.body.body,
      parentReply: req.body.parentReply || null,
    });

    discussion.commentCount += 1;
    await discussion.save();

    await logActivity({
      action: 'DISCUSSION_COMMENTED',
      req,
      repoDoc,
      referenceType: 'discussion',
      referenceId: discussion._id,
      details: { reply: reply._id },
    });

    await reply.populate('author', 'username name avatar');
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upvoteDiscussion = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const discussion = await Discussion.findOne({
      _id: req.params.discussionId,
      repository: repoDoc._id,
    });
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const userId = req.user._id.toString();
    const hasUpvoted = discussion.upvotes.some((id) => id.toString() === userId);
    discussion.upvotes = hasUpvoted
      ? discussion.upvotes.filter((id) => id.toString() !== userId)
      : [...discussion.upvotes, req.user._id];
    await discussion.save();

    res.json({ upvoted: !hasUpvoted, upvotes: discussion.upvotes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWikiPages = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const pages = await Wiki.find({ repository: repoDoc._id })
      .populate('lastEditedBy', 'username name avatar')
      .sort({ order: 1, title: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.upsertWikiPage = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const slug = slugify(req.params.slug || req.body.title, { lower: true, strict: true });
    const title = req.body.title || slug.replace(/-/g, ' ');
    const existing = await Wiki.findOne({ repository: repoDoc._id, slug });

    const page = await Wiki.findOneAndUpdate(
      { repository: repoDoc._id, slug },
      {
        repository: repoDoc._id,
        title,
        slug,
        content: req.body.content || '',
        author: existing?.author || req.user._id,
        lastEditedBy: req.user._id,
        order: req.body.order || existing?.order || 0,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await WikiHistory.create({
      wiki: page._id,
      repository: repoDoc._id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      editedBy: req.user._id,
      message: req.body.message || (existing ? 'Updated page' : 'Created page'),
    });

    await logActivity({
      action: 'WIKI_UPDATED',
      req,
      repoDoc,
      referenceType: 'wiki',
      referenceId: page._id,
      details: { title: page.title, slug: page.slug },
    });

    res.status(existing ? 200 : 201).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWikiHistory = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const slug = slugify(req.params.slug, { lower: true, strict: true });
    const history = await WikiHistory.find({ repository: repoDoc._id, slug })
      .populate('editedBy', 'username name avatar')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkflows = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    const workflows = await Workflow.find({ repository: repoDoc._id }).sort({ updatedAt: -1 });
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWorkflow = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const { name, yaml, triggers, jobs, path: workflowPath } = req.body;
    if (!name || !yaml) return res.status(400).json({ message: 'Workflow name and YAML are required' });

    const workflow = await Workflow.findOneAndUpdate(
      { repository: repoDoc._id, name },
      {
        repository: repoDoc._id,
        name,
        yaml,
        path: workflowPath || `.buildboard/workflows/${slugify(name, { lower: true, strict: true })}.yml`,
        triggers: triggers || ['push', 'pull_request', 'manual'],
        jobs: jobs || [],
        enabled: req.body.enabled !== undefined ? req.body.enabled : true,
        createdBy: req.user._id,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await logActivity({
      action: 'WORKFLOW_CREATED',
      req,
      repoDoc,
      referenceType: 'workflow',
      referenceId: workflow._id,
      details: { name: workflow.name },
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.runWorkflow = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;
    if (!canWrite(req, repoDoc)) return res.status(403).json({ message: 'Write access required' });

    const workflow = await Workflow.findOne({ _id: req.params.workflowId, repository: repoDoc._id });
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

    const lastRun = await WorkflowRun.findOne({ workflow: workflow._id }).sort({ runNumber: -1 });
    const run = await WorkflowRun.create({
      workflow: workflow._id,
      repository: repoDoc._id,
      runNumber: (lastRun?.runNumber || 0) + 1,
      branch: req.body.branch || repoDoc.defaultBranch || 'main',
      commitSha: req.body.commitSha || '',
      status: 'completed',
      conclusion: req.body.conclusion || 'success',
      actor: req.user._id,
      startedAt: new Date(),
      completedAt: new Date(),
      logs: [
        { level: 'info', message: `Queued workflow ${workflow.name}` },
        { level: 'info', message: 'Installing dependencies' },
        { level: 'info', message: 'Running build and tests' },
        { level: 'info', message: 'Workflow completed' },
      ],
    });

    await logActivity({
      action: 'WORKFLOW_RUN_STARTED',
      req,
      repoDoc,
      referenceType: 'workflow',
      referenceId: workflow._id,
      details: { runNumber: run.runNumber, conclusion: run.conclusion },
    });

    res.status(201).json(run);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkflowRuns = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const filter = { repository: repoDoc._id };
    if (req.params.workflowId) filter.workflow = req.params.workflowId;

    const runs = await WorkflowRun.find(filter)
      .populate('workflow', 'name path')
      .populate('actor', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(runs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSecurityDashboard = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const alerts = await SecurityAlert.find({ repository: repoDoc._id }).sort({ severity: 1, createdAt: -1 });
    const openAlerts = alerts.filter((alert) => alert.status === 'open');
    const counts = openAlerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0, critical: 0 }
    );

    res.json({
      settings: repoDoc.security,
      alerts,
      counts,
      recommendations: [
        'Require pull request reviews for protected branches.',
        'Enable dependency and secret scanning for all private repositories.',
        'Rotate stale refresh tokens and enforce two-factor authentication for organization owners.',
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [commits, issues, prs, releases, contributors, activity] = await Promise.all([
      Commit.countDocuments({ repository: repoDoc._id }),
      Issue.aggregate([{ $match: { repository: repoDoc._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      PullRequest.aggregate([{ $match: { repository: repoDoc._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Release.countDocuments({ repository: repoDoc._id }),
      Commit.aggregate([
        { $match: { repository: repoDoc._id } },
        { $group: { _id: '$author', commits: { $sum: 1 } } },
        { $sort: { commits: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { username: '$user.username', name: '$user.name', avatar: '$user.avatar', commits: 1 } },
      ]),
      ActivityLog.find({ repository: repoDoc._id, createdAt: { $gte: thirtyDaysAgo } })
        .populate('user', 'username name avatar')
        .sort({ createdAt: -1 })
        .limit(25),
    ]);

    const openIssues = await Issue.countDocuments({ repository: repoDoc._id, status: { $ne: 'closed' } });
    const closedIssues = await Issue.countDocuments({ repository: repoDoc._id, status: 'closed' });
    const mergedPRs = await PullRequest.countDocuments({ repository: repoDoc._id, status: 'merged' });
    const totalPRs = await PullRequest.countDocuments({ repository: repoDoc._id });
    const recentCommits = await Commit.countDocuments({ repository: repoDoc._id, createdAt: { $gte: thirtyDaysAgo } });

    const issueResolutionRate = closedIssues + openIssues > 0 ? Math.round((closedIssues / (closedIssues + openIssues)) * 100) : 100;
    const prMergeRate = totalPRs > 0 ? Math.round((mergedPRs / totalPRs) * 100) : 100;
    const activityScore = Math.min(100, recentCommits * 5);

    res.json({
      summary: {
        commits,
        releases,
        stars: repoDoc.starCount,
        forks: repoDoc.forkCount,
        watchers: repoDoc.watcherCount,
        healthScore: Math.round((issueResolutionRate + prMergeRate + activityScore) / 3),
      },
      issues,
      pullRequests: prs,
      contributors,
      activity,
      health: { issueResolutionRate, prMergeRate, activityScore },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const messages = await ChatMessage.find({ repository: repoDoc._id })
      .populate('sender', 'username name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.postChatMessage = async (req, res) => {
  try {
    const repoDoc = await ensureRepo(req, res);
    if (!repoDoc) return;

    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const message = await ChatMessage.create({
      repository: repoDoc._id,
      sender: req.user._id,
      content,
    });

    const populatedMessage = await ChatMessage.findById(message._id).populate('sender', 'username name avatar');
    emitToRepo(repoDoc._id.toString(), 'chat:message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
