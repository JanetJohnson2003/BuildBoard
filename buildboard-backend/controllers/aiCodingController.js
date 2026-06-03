const { GoogleGenerativeAI } = require('@google/generative-ai');
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const File = require('../models/File');
const Commit = require('../models/Commit');
const PullRequest = require('../models/PullRequest');
const Issue = require('../models/Issue'); // Just for getNextNumber
const crypto = require('crypto');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

const makeSha = (content) => crypto.createHash('sha1').update(content).digest('hex');

const resolveRepo = async (owner, repo) => {
  const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username name avatar');
  if (!repoDoc || repoDoc.owner.username !== owner) return null;
  return repoDoc;
};

const getNextNumber = async (repoId) => {
  const lastIssue = await Issue.findOne({ repository: repoId }).sort({ number: -1 });
  const lastPr = await PullRequest.findOne({ repository: repoId }).sort({ number: -1 });
  const maxIssue = lastIssue ? lastIssue.number : 0;
  const maxPr = lastPr ? lastPr.number : 0;
  return Math.max(maxIssue, maxPr) + 1;
};

// IDE Chat Assistant
exports.ideChat = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { prompt, activeFile, activeContent, provider, apiKey } = req.body;
    
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    let finalProvider = provider || 'gemini';
    let finalKey = apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!finalKey || finalKey === 'MISSING_KEY') {
      return res.json({ text: `*(Mock Mode: No API Key Provided)*\n\nI see you are asking: "${prompt}".\n\nClick the Settings Gear icon at the top of this chat to enter your Gemini or ChatGPT API key, and I will analyze your active file \`${activeFile || 'none'}\` and generate real code for you!`});
    }

    let fullPrompt = `You are an expert AI developer assistant inside an IDE. The user is asking: "${prompt}"\n`;
    if (activeFile) {
        fullPrompt += `\nThey currently have this file open: ${activeFile}\n\n=== FILE CONTENT ===\n${activeContent || '(Empty file)'}\n====================\n`;
    }
    fullPrompt += `\nProvide a helpful, conversational response. Include code snippets in markdown blocks if appropriate. Keep it concise.`;

    let responseText = '';

    if (finalProvider === 'gemini') {
      const customGenAI = new GoogleGenerativeAI(finalKey);
      const model = customGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(fullPrompt);
      responseText = result.response.text();
    } else if (finalProvider === 'chatgpt') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'You are an AI Copilot.' }, { role: 'user', content: fullPrompt }],
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`OpenAI Error: ${errData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      responseText = data.choices[0].message.content;
    } else {
      return res.status(400).json({ message: 'Invalid AI provider selected.' });
    }

    res.json({ text: responseText });
  } catch (err) {
    console.error('IDE Chat Error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Route alias used in routes/ai.js
exports.generateCodeDiff = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const repoDoc = await resolveRepo(owner, repo);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    // 1. Fetch source files from default branch
    const defaultBranchName = repoDoc.defaultBranch || 'main';
    const mainBranch = await Branch.findOne({ repository: repoDoc._id, name: defaultBranchName });
    if (!mainBranch) return res.status(404).json({ message: 'Default branch not found' });

    const files = await File.find({ repository: repoDoc._id, branch: mainBranch._id, type: 'file' });
    
    // Filter out huge files or non-code files to save token context
    const contextFiles = files.filter(f => 
      !f.path.includes('node_modules') && 
      !f.path.includes('.git') && 
      !f.path.includes('build/') &&
      f.size < 50000 // roughly 50kb max
    );

    const fileContextString = contextFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n');

    // 2. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemInstruction = `You are an expert AI developer assistant. You will be provided with the current codebase context and a user request. 
Your task is to fulfill the request by writing or modifying code. 
You must output ONLY valid JSON in the following format, with NO markdown code blocks (\`\`\`) surrounding it, and no other text:
{
  "title": "Short title for the Pull Request",
  "message": "Commit message explaining changes",
  "files": [
    { "path": "path/to/file.ext", "content": "Full new content of the file" }
  ]
}
Ensure you provide the FULL content of any modified file, not just a patch.`;

    const fullPrompt = `${systemInstruction}\n\n=== REPOSITORY CONTEXT ===\n${fileContextString}\n\n=== USER REQUEST ===\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    
    // Clean up markdown if AI accidentally included it
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let generatedChanges;
    try {
      generatedChanges = JSON.parse(jsonStr);
    } catch (err) {
      console.error("Failed to parse Gemini JSON:", jsonStr);
      return res.status(500).json({ message: 'AI returned invalid formatted response', raw: jsonStr });
    }

    if (!generatedChanges.files || generatedChanges.files.length === 0) {
      return res.status(400).json({ message: 'AI did not suggest any file changes.' });
    }

    // 3. Create a new branch
    const timestamp = Date.now();
    const newBranchName = `ai-generated-${timestamp}`;
    const newBranch = await Branch.create({
      repository: repoDoc._id,
      name: newBranchName,
      createdBy: req.user._id,
      sourceBranch: mainBranch._id,
      lastCommit: mainBranch.lastCommit,
    });

    // Copy existing files to the new branch
    const allSourceFiles = await File.find({ repository: repoDoc._id, branch: mainBranch._id });
    const copiedFiles = allSourceFiles.map(file => ({
      repository: repoDoc._id,
      branch: newBranch._id,
      path: file.path,
      name: file.name,
      type: file.type,
      content: file.content,
      size: file.size,
      mimeType: file.mimeType,
      encoding: file.encoding,
      lastModifiedBy: req.user._id,
      lastCommit: file.lastCommit,
    }));
    await File.insertMany(copiedFiles);

    // Apply Gemini's changes
    const filesChangedStats = [];
    for (const change of generatedChanges.files) {
      const existingFile = copiedFiles.find(f => f.path === change.path);
      
      const fileName = change.path.split('/').pop();
      const contentBuffer = Buffer.from(change.content, 'utf-8');

      if (existingFile) {
        // Update
        await File.updateOne(
          { repository: repoDoc._id, branch: newBranch._id, path: change.path },
          { $set: { content: change.content, size: contentBuffer.length, lastModifiedBy: req.user._id } }
        );
        filesChangedStats.push({
          filename: change.path,
          status: 'modified',
          additions: 1, // simplified stat
          deletions: 1
        });
      } else {
        // Create
        await File.create({
          repository: repoDoc._id,
          branch: newBranch._id,
          path: change.path,
          name: fileName,
          type: 'file',
          content: change.content,
          size: contentBuffer.length,
          mimeType: 'text/plain', // Simplification
          lastModifiedBy: req.user._id,
        });
        filesChangedStats.push({
          filename: change.path,
          status: 'added',
          additions: 1,
          deletions: 0
        });
      }
    }

    // 4. Create a Commit
    const stats = filesChangedStats.reduce(
      (totals, file) => ({
        totalAdditions: totals.totalAdditions + file.additions,
        totalDeletions: totals.totalDeletions + file.deletions,
        filesChangedCount: totals.filesChangedCount + 1,
      }),
      { totalAdditions: 0, totalDeletions: 0, filesChangedCount: 0 }
    );

    const commitMessage = generatedChanges.message || 'AI generated changes';
    const commit = await Commit.create({
      repository: repoDoc._id,
      branch: newBranch._id,
      author: req.user._id,
      message: commitMessage,
      sha: makeSha(`${repoDoc._id}:${newBranchName}:${commitMessage}:${timestamp}`),
      filesChanged: filesChangedStats,
      parentCommit: mainBranch.lastCommit,
      stats,
    });

    newBranch.lastCommit = commit._id;
    await newBranch.save();

    // 5. Open Pull Request
    const prNumber = await getNextNumber(repoDoc._id);
    const pullRequest = await PullRequest.create({
      repository: repoDoc._id,
      number: prNumber,
      title: generatedChanges.title || 'AI Generated Code Updates',
      body: `This Pull Request was automatically generated by the BuildBoard+ AI Assistant.\n\n**Prompt:**\n> ${prompt}\n\n**Changes:**\n${commitMessage}`,
      author: req.user._id,
      sourceBranch: newBranch._id,
      targetBranch: mainBranch._id,
      isDraft: false,
    });

    repoDoc.openPrCount += 1;
    await repoDoc.save();

    res.status(201).json({
      message: 'Code generated and Pull Request created successfully',
      pullRequest: pullRequest,
      branch: newBranchName
    });
  } catch (error) {
    console.error('AI Code Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateCode = exports.generateCodeDiff;

// Generate AI Review for a Pull Request based on Persona
exports.generateAiReview = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { persona } = req.body;
    
    if (!persona) return res.status(400).json({ message: 'Persona is required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const User = require('../models/User');
    const Repository = require('../models/Repository');
    const PullRequest = require('../models/PullRequest');
    const Commit = require('../models/Commit');
    const File = require('../models/File');
    const Comment = require('../models/Comment');

    // Find Repo
    const ownerUser = await User.findOne({ username: owner });
    if (!ownerUser) return res.status(404).json({ message: 'Owner not found' });
    const repoDoc = await Repository.findOne({ owner: ownerUser._id, name: repo });
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    // Find PR
    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    // We need to construct the diff for the AI to review
    // Since we don't have literal diffs saved natively in text, we gather the changed files from commits
    const commits = await Commit.find({ _id: { $in: pr.commits } });
    let diffText = `Pull Request #${pr.number}: ${pr.title}\n\n`;
    
    // To keep it simple, we just pass the raw files from the source branch
    const sourceFiles = await File.find({ repository: repoDoc._id, branch: pr.sourceBranch });
    const targetFiles = await File.find({ repository: repoDoc._id, branch: pr.targetBranch });

    // Map target files for comparison
    const targetFileMap = new Map();
    targetFiles.forEach(f => targetFileMap.set(f.path, f.content));

    for (const file of sourceFiles) {
      if (file.type !== 'file') continue;
      // Skip binary-like or large files
      if (file.path.match(/\.(png|jpg|jpeg|gif|ico|pdf|woff|woff2|ttf|eot)$/i)) continue;
      
      const targetContent = targetFileMap.get(file.path) || '';
      if (file.content !== targetContent) {
        diffText += `--- ${file.path} (target)\n`;
        diffText += `+++ ${file.path} (source)\n`;
        // Provide the full new content to review. In a real scenario we'd use a diff library.
        diffText += `[NEW CONTENT FOR ${file.path}]\n${file.content}\n\n`;
      }
    }

    if (diffText.length > 50000) {
      diffText = diffText.substring(0, 50000) + '\n\n...[TRUNCATED DUE TO SIZE]...';
    }

    // Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promptText = `
You are an expert AI Code Reviewer adopting the following persona: "${persona}".
Your task is to review the code changes in this Pull Request and provide feedback strictly adhering to your persona's tone and focus.

For example:
- If you are a "Strict Security Auditor", focus heavily on vulnerabilities, SQLi, XSS, and use a stern tone.
- If you are a "Performance Guru", focus on Big O, memory leaks, efficient algorithms.
- If you are a "Friendly Mentor", be very encouraging, use emojis, and explain concepts simply.

Here are the changes:
${diffText}

Provide your code review as a markdown response. Include specific line references or file references if possible. Do NOT include any markdown codeblocks enclosing your entire response. Just write the review text naturally.
`;

    const result = await model.generateContent(promptText);
    const reviewText = result.response.text();

    // Save as a Comment
    const comment = new Comment({
      repository: repoDoc._id,
      pullRequest: pr._id,
      author: req.user.id, // For now, the user who triggered it is the author
      content: `🤖 **AI Review [Persona: ${persona}]**\n\n${reviewText}`,
    });

    await comment.save();

    // Update PR comment count
    pr.commentCount = (pr.commentCount || 0) + 1;
    await pr.save();

    // Return the new comment
    await comment.populate('author', 'username avatar');
    
    res.status(201).json({ comment });
  } catch (error) {
    console.error('AI Review Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateReleaseSlideshow = async (req, res) => {
  try {
    const { owner, repo, tag } = req.params;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const User = require('../models/User');
    const Repository = require('../models/Repository');
    const Release = require('../models/Release');

    const ownerUser = await User.findOne({ username: owner });
    if (!ownerUser) return res.status(404).json({ message: 'Owner not found' });
    
    const repoDoc = await Repository.findOne({ owner: ownerUser._id, name: repo });
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const release = await Release.findOne({ repository: repoDoc._id, tagName: tag });
    if (!release) return res.status(404).json({ message: 'Release not found' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are a developer relations expert. Summarize the following software release notes into a 3-5 slide presentation.
Output MUST be valid JSON matching this schema exactly, and nothing else (NO markdown code blocks):
{
  "slides": [
    { "title": "Slide Title", "content": "Bullet points or short paragraph" }
  ]
}`;
    
    const fullPrompt = `${systemInstruction}\n\nRelease Name: ${release.name}\nTag: ${release.tagName}\nRelease Notes:\n${release.body}`;

    const result = await model.generateContent(fullPrompt);
    const jsonStr = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);

  } catch (error) {
    console.error('AI Slideshow Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateFlowchart = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code snippet is required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are an expert developer. Analyze the following code and generate a mermaid.js flowchart explaining its logic.
Output MUST be a raw, valid mermaid syntax flowchart (starting with graph TD or flowchart TD) and nothing else. DO NOT use markdown code blocks like \`\`\`mermaid. Just the raw string.`;
    
    const fullPrompt = `${systemInstruction}\n\nCode:\n${code}`;
    const result = await model.generateContent(fullPrompt);
    
    let mermaidCode = result.response.text().trim();
    if (mermaidCode.startsWith('\`\`\`mermaid')) mermaidCode = mermaidCode.replace(/^\`\`\`mermaid\n?/, '');
    if (mermaidCode.startsWith('\`\`\`')) mermaidCode = mermaidCode.replace(/^\`\`\`\n?/, '');
    if (mermaidCode.endsWith('\`\`\`')) mermaidCode = mermaidCode.replace(/\n?\`\`\`$/, '');
    
    res.json({ mermaid: mermaidCode });

  } catch (error) {
    console.error('AI Flowchart Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.predictPr = async (req, res) => {
  try {
    const { branch, targetBranch } = req.body;
    if (!branch) return res.status(400).json({ message: 'Branch is required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are a CI/CD predicting AI. Based on the fact that the user wants to merge a branch into another branch, simulate a pre-flight PR check.
Output MUST be valid JSON matching this schema:
{
  "mergeConflictRisk": "Low" | "Medium" | "High",
  "buildPassProbability": 0-100,
  "testPassProbability": 0-100,
  "estimatedReviewTime": "string",
  "suggestions": ["string"]
}`;
    
    const fullPrompt = `${systemInstruction}\n\nTarget Branch: ${targetBranch || 'main'}\nSource Branch: ${branch}\n(No code provided for this prototype, generate realistic mock predictions for an average PR)`;
    const result = await model.generateContent(fullPrompt);
    
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/^\`\`\`\n?/, '');
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.replace(/\n?\`\`\`$/, '');
    
    res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('AI Predict PR Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateTests = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: 'Code snippet is required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are an expert ${language || 'software'} test engineer. Analyze the following code and generate a complete suite of unit tests for it.
Use a standard testing framework appropriate for the language (e.g., Jest/Mocha for JS/TS, pytest for Python).
Output MUST be raw, valid test code and nothing else. DO NOT use markdown code blocks like \`\`\`javascript. Just the raw string code.`;
    
    const fullPrompt = `${systemInstruction}\n\nCode:\n${code}`;
    const result = await model.generateContent(fullPrompt);
    
    let testCode = result.response.text().trim();
    if (testCode.startsWith('\`\`\`')) testCode = testCode.replace(/^\`\`\`[a-z]*\n?/, '');
    if (testCode.endsWith('\`\`\`')) testCode = testCode.replace(/\n?\`\`\`$/, '');
    
    res.json({ testCode });

  } catch (error) {
    console.error('AI Test Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.autoFix = async (req, res) => {
  try {
    const { code, language, errorMessage } = req.body;
    if (!code || !errorMessage) return res.status(400).json({ message: 'Code and errorMessage are required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are an elite autonomous debugging AI. The user has provided broken ${language || 'software'} code and the resulting stack trace/error message.
Your job is to identify the root cause and provide ONLY the fully corrected raw code. 
DO NOT use markdown formatting like \`\`\`javascript. Return pure, valid code that replaces the original. Do not explain the fix.`;
    
    const fullPrompt = `${systemInstruction}\n\nError Message:\n${errorMessage}\n\nBroken Code:\n${code}`;
    const result = await model.generateContent(fullPrompt);
    
    let fixedCode = result.response.text().trim();
    if (fixedCode.startsWith('\`\`\`')) fixedCode = fixedCode.replace(/^\`\`\`[a-z]*\n?/, '');
    if (fixedCode.endsWith('\`\`\`')) fixedCode = fixedCode.replace(/\n?\`\`\`$/, '');
    
    res.json({ fixedCode });

  } catch (error) {
    console.error('AI Auto-Fix Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.auditSecrets = async (req, res) => {
  try {
    const { secrets } = req.body;
    if (!secrets || !Array.isArray(secrets)) return res.status(400).json({ message: 'Secrets array is required' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are a strict DevSecOps AI. Analyze these environment variable key-value pairs for security vulnerabilities.
Check for easily guessable passwords, bad formatting, plaintext API keys, and weak encryption keys.
Output MUST be valid JSON matching this schema:
{
  "score": 0-100 (100 is perfectly secure),
  "vulnerabilities": [
    { "key": "string", "severity": "Low" | "Medium" | "High" | "Critical", "issue": "string" }
  ],
  "summary": "string"
}`;
    
    const secretsStr = secrets.map(s => `${s.key}=${s.value}`).join('\n');
    const fullPrompt = `${systemInstruction}\n\nSecrets:\n${secretsStr}`;
    const result = await model.generateContent(fullPrompt);
    
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/^\`\`\`\n?/, '');
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.replace(/\n?\`\`\`$/, '');
    
    res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('AI Audit Secrets Error:', error);
    res.status(500).json({ message: error.message });
  }
};
