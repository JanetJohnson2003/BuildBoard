const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    console.log('🔐 [Auth] Middleware check');
    console.log('🔐 [Auth] Token received:', token ? 'YES' : 'NO');

    if (!token) {
      console.error('❌ [Auth] No token in headers');
      return res.status(401).json({ message: 'No token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'buildboardplus_secret_key_2024'
    );

    console.log('✅ [Auth] Token decoded:', decoded);
    console.log('✅ [Auth] User ID from token:', decoded.id);

    if (!decoded.id) {
      console.error('❌ [Auth] Token has no user ID');
      return res.status(401).json({ message: 'Invalid token: no user ID' });
    }

    // Attach user to request
    req.user = { id: decoded.id };
    
    console.log('✅ [Auth] Token verified for user:', decoded.id);
    next();

  } catch (error) {
    console.error('❌ [Auth] Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;