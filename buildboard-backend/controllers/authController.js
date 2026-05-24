const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ✅ REGISTER USER WITH ROLE
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log('📝 Registering user:', email);
    console.log('👤 Role:', role);

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Name, email, password, and role are required' 
      });
    }

    // Validate role
    const validRoles = ['user', 'reviewer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be user, reviewer, or admin' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role // ✅ SAVE ROLE
    });

    console.log('✅ User registered:', user._id);
    console.log('👤 User role:', user.role);

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated');

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role  // ✅ SEND ROLE
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Logging in user:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ User authenticated:', email);

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    console.log('👤 Getting current user:', userId);

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Get user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGOUT USER
exports.logout = (req, res) => {
  try {
    console.log('🚪 User logged out');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const { oldPassword, newPassword } = req.body;

    console.log('🔑 Changing password for user:', userId);

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Old password and new password are required' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Old password is incorrect' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password changed for user:', userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error.message);
    res.status(500).json({ message: error.message });
  }
};