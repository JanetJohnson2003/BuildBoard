const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    const { name, email, password, role } = req.body;

    // Check if user exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log('💾 Creating user...');
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    console.log('✅ User registered:', user._id);
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    console.log('🔑 Login request:', req.body.email);
    const { email, password } = req.body;

    console.log('🔍 Finding user by email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: "User not found" });
    }

    console.log('✅ User found:', user._id);
    console.log('🔐 Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log('✅ Password matched!');
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log('✅ Token created:', token.substring(0, 20) + '...');
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};