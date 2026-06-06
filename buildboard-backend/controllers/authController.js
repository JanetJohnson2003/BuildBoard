const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'devhubpro_secret_key_2024',
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'devhubpro_refresh_secret_2024',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const OTP = require('../models/OTP');
const PlatformSettings = require('../models/PlatformSettings');
const { clientUrl } = require('../config/clientOrigins');
const nodemailer = require('nodemailer');

// Helper to create nodemailer transporter (using Ethereal for testing if no SMTP is provided)
const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    if (process.env.SMTP_HOST.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Create a test account on Ethereal if no SMTP credentials are provided
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// SEND OTP
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in DB (upsert if exists)
    await OTP.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send email
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"Nexus Auth" <noreply@nexus.dev>',
      to: email,
      subject: 'Your Nexus Identity OTP',
      text: `Your One-Time Password is: ${otpCode}. It will expire in 5 minutes.`,
      html: `<b>Your One-Time Password is: <span style="font-size:24px;">${otpCode}</span></b><br>It will expire in 5 minutes.`,
    });

    const isDev = !process.env.SMTP_HOST;
    let devOtp = null;
    let previewUrl = null;

    if (isDev) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      devOtp = otpCode;
      console.log('OTP Email sent! Preview URL: %s', previewUrl);
    }

    res.status(200).json({ 
      message: 'OTP sent successfully',
      devOtp,
      previewUrl
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};


// REGISTER
exports.register = async (req, res) => {
  try {
    const { username, name, email, password, role, otp } = req.body;

    if (!username || !name || !email || !password || !otp) {
      return res.status(400).json({
        message: 'Username, name, email, password, and OTP are required',
      });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP has expired or was not requested' });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid, clear it
    await OTP.deleteOne({ email: email.toLowerCase() });

    // Validate role
    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'developer';

    // Check duplicates
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      emailVerificationToken: crypto.randomBytes(24).toString('hex'),
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      success: true,
    });
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const platformSettings = await PlatformSettings.findOne({ key: 'global' });
    if (platformSettings?.loginLockdown && user.role !== 'admin') {
      return res.status(503).json({
        message: platformSettings.lockdownMessage || 'Platform is in lockdown',
        code: 'PLATFORM_LOCKDOWN',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    if (user.loginLocked) {
      if (user.loginLockedUntil && user.loginLockedUntil < new Date()) {
        user.loginLocked = false;
        user.loginLockReason = '';
        user.loginLockedUntil = null;
        await user.save();
      } else {
        return res.status(403).json({
          message: user.loginLockReason || 'Login access has been revoked by platform overseer',
          code: 'LOGIN_LOCKED',
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token & update lastActive
    user.refreshToken = refreshToken;
    user.lastActive = new Date();
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      success: true,
    });
    await user.save();

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'devhubpro_refresh_secret_2024'
    );

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (user.isBanned || user.loginLocked) {
      user.refreshToken = null;
      await user.save();
      return res.status(403).json({ message: 'Session revoked. Please sign in again.' });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken')
      .populate('pinnedRepos');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Old password and new password are required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REQUEST PASSWORD RESET
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been generated' });
    }

    user.passwordResetToken = crypto.randomBytes(24).toString('hex');
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    // Send email
    const transporter = await createTransporter();
    const resetUrl = `${clientUrl}/reset-password/${user.passwordResetToken}`;
    
    const info = await transporter.sendMail({
      from: '"Nexus Auth" <noreply@nexus.dev>',
      to: email,
      subject: 'Your Nexus Identity Password Reset',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `<b>Password Reset</b><br>Click <a href="${resetUrl}">here</a> to reset your password. It will expire in 30 minutes.`,
    });

    console.log('Password Reset Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));

    res.json({
      message: 'If that email exists, a reset link has been generated',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.body.token });
    if (!user) return res.status(400).json({ message: 'Invalid verification token' });

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ENABLE OR DISABLE 2FA PLACEHOLDER
exports.configureTwoFactor = async (req, res) => {
  try {
    const enabled = !!req.body.enabled;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.twoFactor.enabled = enabled;
    if (enabled && !user.twoFactor.secret) {
      user.twoFactor.secret = crypto.randomBytes(20).toString('hex');
      user.twoFactor.recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex'));
    }
    if (!enabled) {
      user.twoFactor.secret = null;
      user.twoFactor.recoveryCodes = [];
    }
    await user.save();

    res.json({
      enabled: user.twoFactor.enabled,
      recoveryCodes: enabled ? user.twoFactor.recoveryCodes : [],
      secret: process.env.NODE_ENV === 'production' ? undefined : user.twoFactor.secret,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
