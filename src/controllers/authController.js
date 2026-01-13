import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. This is insecure and should only be used in development.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

const authController = {
  // Register a new user
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create(username, email, hashedPassword);

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },


  // Logout user with token blacklisting
  async logout(req, res) {
    try {
      // Extract token from authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);

      // Decode token to get expiration time
      const decoded = jwt.decode(token);

      if (!decoded || !decoded.exp) {
        return res.status(400).json({ error: 'Invalid token format' });
      }

      // Convert expiration timestamp to ISO date string
      const expiresAt = new Date(decoded.exp * 1000).toISOString();

      // Add token to blacklist
      await User.blacklistToken(token, decoded.id, expiresAt);

      res.json({
        message: 'User logged out successfully',
        info: 'Token has been invalidated'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete user account (authenticated user deletes their own account)
  async deleteAccount(req, res) {
    try {
      // Extract token from authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);

      // Verify and decode token to get user ID
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check if token is blacklisted
      const isBlacklisted = await User.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(403).json({ error: 'Token has been invalidated' });
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Optional: Verify password before deletion for extra security
      const password = req.body?.password;
      
      if (password) {
        // Get full user with password
        const userWithPassword = await User.findByEmail(user.email);
        
        if (!userWithPassword) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
        
        if (!isPasswordValid) {
          return res.status(403).json({ error: 'Invalid password. Account deletion cancelled.' });
        }
      }

      // Delete the user and all related data
      await User.deleteById(userId);

      // Blacklist the current token
      if (decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000).toISOString();
        try {
          await User.blacklistToken(token, userId, expiresAt);
        } catch (err) {
          // Token blacklisting failed, but user is already deleted, so continue
          console.warn('Failed to blacklist token after deletion:', err.message);
        }
      }

      res.json({ 
        message: 'Account deleted successfully',
        info: 'Your account and all associated data have been permanently removed'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      
      // Provide more specific error messages
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default authController;
