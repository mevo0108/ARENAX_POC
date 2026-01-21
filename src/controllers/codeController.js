import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

// Helper function to check if path is safe (no directory traversal)
const isSafePath = (requestedPath) => {
  const normalized = path.normalize(requestedPath);
  return !normalized.includes('..') && !normalized.startsWith('/');
};

// Get list of all source files
export const listSourceFiles = async (req, res) => {
  try {
    const files = [];
    
    // Define directories to scan
    const dirsToScan = ['src', 'client/src'];
    
    // Recursive function to get all files
    const scanDirectory = (dir) => {
      const fullPath = path.join(projectRoot, dir);
      
      if (!fs.existsSync(fullPath)) {
        return;
      }
      
      try {
        const items = fs.readdirSync(fullPath);
        
        items.forEach(item => {
          const itemPath = path.join(fullPath, item);
          const relativePath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            scanDirectory(relativePath);
          } else if (stat.isFile()) {
            // Only include source files
            const ext = path.extname(item);
            if (['.js', '.jsx', '.json', '.md'].includes(ext)) {
              files.push({
                path: relativePath.replace(/\\/g, '/'),
                name: item,
                size: stat.size,
                modified: stat.mtime
              });
            }
          }
        });
      } catch (err) {
        console.error(`Error scanning directory ${dir}:`, err);
      }
    };
    
    dirsToScan.forEach(dir => scanDirectory(dir));
    
    res.json({
      success: true,
      count: files.length,
      files: files.sort((a, b) => a.path.localeCompare(b.path))
    });
  } catch (error) {
    console.error('Error listing source files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list source files'
    });
  }
};

// Get file content
export const getFileContent = async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath || !isSafePath(filePath)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }
    
    const fullPath = path.join(projectRoot, filePath);
    
    // Security check: ensure file is within project root
    const resolvedPath = path.resolve(fullPath);
    const resolvedRoot = path.resolve(projectRoot);
    
    if (!resolvedPath.startsWith(resolvedRoot)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    const stat = fs.statSync(fullPath);
    
    if (!stat.isFile()) {
      return res.status(400).json({
        success: false,
        error: 'Path is not a file'
      });
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const ext = path.extname(filePath);
    
    res.json({
      success: true,
      file: {
        path: filePath,
        name: path.basename(filePath),
        size: stat.size,
        modified: stat.mtime,
        extension: ext,
        content: content,
        lines: content.split('\n').length
      }
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read file'
    });
  }
};

// Get directory tree structure
export const getDirectoryTree = async (req, res) => {
  try {
    const buildTree = (dir) => {
      const fullPath = path.join(projectRoot, dir);
      
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (!stat.isDirectory()) {
          return null;
        }
        
        const items = fs.readdirSync(fullPath);
        const children = [];
        
        items.forEach(item => {
          // Skip node_modules and hidden files
          if (item === 'node_modules' || item.startsWith('.')) {
            return;
          }
          
          const itemPath = path.join(fullPath, item);
          const relativePath = path.join(dir, item);
          
          try {
            const itemStat = fs.statSync(itemPath);
            
            if (itemStat.isDirectory()) {
              const subtree = buildTree(relativePath);
              if (subtree) {
                children.push(subtree);
              }
            } else if (itemStat.isFile()) {
              const ext = path.extname(item);
              if (['.js', '.jsx', '.json', '.md'].includes(ext)) {
                children.push({
                  name: item,
                  path: relativePath.replace(/\\/g, '/'),
                  type: 'file',
                  size: itemStat.size,
                  extension: ext
                });
              }
            }
          } catch (err) {
            console.error(`Error processing item ${relativePath}:`, err);
          }
        });
        
        return {
          name: path.basename(dir) || dir,
          path: dir.replace(/\\/g, '/'),
          type: 'directory',
          children: children.sort((a, b) => {
            // Directories first, then files
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          })
        };
      } catch (err) {
        console.error(`Error building tree for ${dir}:`, err);
        return null;
      }
    };
    
    const tree = {
      name: 'ARENAX_POC',
      type: 'directory',
      children: [
        buildTree('src'),
        buildTree('client/src')
      ].filter(Boolean)
    };
    
    res.json({
      success: true,
      tree
    });
  } catch (error) {
    console.error('Error building directory tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build directory tree'
    });
  }
};
