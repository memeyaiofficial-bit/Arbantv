/**
 * Authentication Middleware
 * Extracts user from existing auth session/JWT
 * 
 * This middleware should integrate with your existing auth system.
 * Modify this to match your actual auth implementation.
 */

/**
 * Auth middleware - extracts user from session/JWT
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function authMiddleware(req, res, next) {
  // TODO: Replace with your actual auth implementation
  // Examples:
  
  // Option 1: Session-based (if using express-session)
  // if (req.session && req.session.userId) {
  //   req.user = { id: req.session.userId };
  //   return next();
  // }
  
  // Option 2: JWT token (if using jsonwebtoken)
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (token) {
  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //     req.user = { id: decoded.userId };
  //     return next();
  //   } catch (error) {
  //     return res.status(401).json({ error: 'Invalid token' });
  //   }
  // }
  
  // Option 3: Appwrite session cookie
  // const sessionCookie = req.cookies?.['a_session_' + process.env.APPWRITE_PROJECT_ID];
  // if (sessionCookie) {
  //   // Verify session with Appwrite
  //   req.user = { id: extractUserIdFromSession(sessionCookie) };
  //   return next();
  // }

  // TEMPORARY: For demo purposes, allow header-based user ID
  // Remove this in production and use your actual auth
  const userId = req.headers['x-user-id'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (userId) {
    req.user = { id: userId, $id: userId };
    return next();
  }

  // If no auth found, return 401
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Authentication required. Please provide valid session or token.',
  });
}

module.exports = authMiddleware;
