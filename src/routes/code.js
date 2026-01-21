import express from 'express';
import {
  listSourceFiles,
  getFileContent,
  getDirectoryTree
} from '../controllers/codeController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all code routes
router.use(apiLimiter);

/**
 * @route   GET /api/code/files
 * @desc    Get list of all source files or specific file content (with ?path= query param)
 * @access  Public
 */
router.get('/files', (req, res) => {
  if (req.query.path) {
    return getFileContent(req, res);
  }
  return listSourceFiles(req, res);
});

/**
 * @route   GET /api/code/tree
 * @desc    Get directory tree structure
 * @access  Public
 */
router.get('/tree', getDirectoryTree);

export default router;
