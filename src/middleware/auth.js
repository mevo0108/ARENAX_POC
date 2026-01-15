import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

const config = {
  token: {
    access_token_secret: () => JWT_SECRET || '86e875834a433174cc846fda9103da59e0f93d393cd18baf29915eaf6636c478'
  }
};

// Export accessor so other modules sign/verify with the same secret
const accessTokenSecret = config.token.access_token_secret;
export { accessTokenSecret };

const unless = (paths) => {
  return (req, res, next) => {
    if (paths.includes(req.path)) {
      return next();
    }
    return authenticateToken(req, res, next);
  };
};

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. This is insecure and should only be used in development.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

const getTokenFromHeader = (req, res) => {
  const authHeader = (req.headers['authorization']) ?? (req.headers['Authorization']);
  res = authHeader?.split(' ')[1];
  return res;
}

const authenticateTokenHandler = async (req, res, next, ignoreExpiration = false) => {
  const token = getTokenFromHeader(req, res);

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await User.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(403).json({ message: 'Token has been invalidated. Please login again.' });
      return;
    }

    /** @type {jwt.JwtPayload} */
    const decoded = jwt.verify(token, config.token.access_token_secret(), { ignoreExpiration });
    const user = await User.findOne({ _id: decoded.id || decoded.userId }).select('_id username email').lean();

    if (!user) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }

    req.user = { id: user._id.toString(), username: user.username, email: user.email };
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
    } else {
      res.status(403).json({ message: 'Invalid token' });
    }
  }
};


const authMiddleware = async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to authenticate token for all requests
const authenticateToken = async (req, res, next) => {
  authenticateTokenHandler(req, res, next)
}
authenticateToken.unless = unless;



const authenticateTokenForParams = async (req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    authenticateTokenHandler(req, res, next, false)
  }
  else {
    next();
  }
}

const authenticateLogoutToken = async (req, res, next) => {
  authenticateTokenHandler(req, res, next, true)
}
authenticateLogoutToken.unless = unless;



export { authenticateToken, authenticateLogoutToken, authenticateTokenForParams };

