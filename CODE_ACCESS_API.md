# Code Access API Documentation

The Code Access API provides programmatic access to the ARENAX source code files. This API allows you to list, browse, and retrieve the content of source files in the project.

## Base URL

When running locally:
```
http://localhost:3000/api/code
```

When deployed:
```
https://your-domain.com/api/code
```

## Endpoints

### 1. List All Source Files

Get a complete list of all source files in the project with metadata.

**Endpoint:** `GET /api/code/files`

**Response:**
```json
{
  "success": true,
  "count": 32,
  "files": [
    {
      "path": "src/server.js",
      "name": "server.js",
      "size": 3001,
      "modified": "2026-01-21T08:48:52.315Z"
    },
    {
      "path": "src/controllers/authController.js",
      "name": "authController.js",
      "size": 6988,
      "modified": "2026-01-21T08:45:05.884Z"
    }
    // ... more files
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/code/files
```

---

### 2. Get Specific File Content

Retrieve the full content of a specific source file.

**Endpoint:** `GET /api/code/files?path=<filepath>`

**Query Parameters:**
- `path` (required): The relative path to the file from the project root

**Response:**
```json
{
  "success": true,
  "file": {
    "path": "src/server.js",
    "name": "server.js",
    "size": 3001,
    "modified": "2026-01-21T08:48:52.315Z",
    "extension": ".js",
    "content": "import 'dotenv/config';\nimport express from 'express';\n...",
    "lines": 115
  }
}
```

**Examples:**
```bash
# Get server.js content
curl "http://localhost:3000/api/code/files?path=src/server.js"

# Get a controller file
curl "http://localhost:3000/api/code/files?path=src/controllers/authController.js"

# Get a React component
curl "http://localhost:3000/api/code/files?path=client/src/App.jsx"
```

---

### 3. Get Directory Tree

Get the complete directory structure of the project as a tree.

**Endpoint:** `GET /api/code/tree`

**Response:**
```json
{
  "success": true,
  "tree": {
    "name": "ARENAX_POC",
    "type": "directory",
    "children": [
      {
        "name": "src",
        "path": "src",
        "type": "directory",
        "children": [
          {
            "name": "config",
            "path": "src/config",
            "type": "directory",
            "children": [
              {
                "name": "database.js",
                "path": "src/config/database.js",
                "type": "file",
                "size": 363,
                "extension": ".js"
              }
            ]
          }
          // ... more directories and files
        ]
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/code/tree
```

---

## Security

- The API only exposes source code files from `src/` and `client/src/` directories
- Directory traversal attacks are prevented (paths containing `..` are rejected)
- Only specific file types are served: `.js`, `.jsx`, `.json`, `.md`
- The API uses path validation to ensure files are within the project root

## Supported File Types

- **JavaScript**: `.js`
- **React**: `.jsx`
- **JSON**: `.json`
- **Markdown**: `.md`

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid file path"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "File not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to read file"
}
```

## Usage Examples

### Using JavaScript/Node.js

```javascript
// List all files
const response = await fetch('http://localhost:3000/api/code/files');
const data = await response.json();
console.log(`Found ${data.count} files`);

// Get specific file
const fileResponse = await fetch(
  'http://localhost:3000/api/code/files?path=src/server.js'
);
const fileData = await fileResponse.json();
console.log(fileData.file.content);

// Get directory tree
const treeResponse = await fetch('http://localhost:3000/api/code/tree');
const treeData = await treeResponse.json();
console.log(JSON.stringify(treeData.tree, null, 2));
```

### Using Python

```python
import requests

# List all files
response = requests.get('http://localhost:3000/api/code/files')
data = response.json()
print(f"Found {data['count']} files")

# Get specific file
response = requests.get(
    'http://localhost:3000/api/code/files',
    params={'path': 'src/server.js'}
)
file_data = response.json()
print(file_data['file']['content'])

# Get directory tree
response = requests.get('http://localhost:3000/api/code/tree')
tree_data = response.json()
print(tree_data['tree'])
```

### Using cURL

```bash
# List all files
curl http://localhost:3000/api/code/files | jq

# Get specific file with formatted output
curl "http://localhost:3000/api/code/files?path=src/server.js" | jq '.file.content'

# Get directory tree
curl http://localhost:3000/api/code/tree | jq '.tree'
```

## Integration with AI Assistants

This API is designed to be easily consumable by AI assistants like Claude. Here's how an AI can use it:

1. **Discover available files:** Use `GET /api/code/files` to get a list of all source files
2. **Browse the structure:** Use `GET /api/code/tree` to understand the project structure
3. **Read file contents:** Use `GET /api/code/files?path=<filepath>` to read specific files

Example AI workflow:
```
1. GET /api/code/tree → Understand project structure
2. GET /api/code/files → Get list of all files
3. GET /api/code/files?path=src/server.js → Read main server file
4. GET /api/code/files?path=src/controllers/authController.js → Read auth logic
```

## Access Links for Claude

If you want to provide Claude (or another AI assistant) with access to your code:

**Option 1: Share deployed URL**
```
Base URL: https://your-deployed-app.com/api/code
Tree: https://your-deployed-app.com/api/code/tree
Files: https://your-deployed-app.com/api/code/files
Get File: https://your-deployed-app.com/api/code/files?path=<filepath>
```

**Option 2: Use local development URL (with tunneling)**
If running locally, use a tool like ngrok to create a public URL:
```bash
# Start ngrok
ngrok http 3000

# Then share the ngrok URL
https://your-id.ngrok.io/api/code
```

**Option 3: Direct instructions for Claude**
```
Claude, you can access the ARENAX source code at these endpoints:

1. List all files: http://localhost:3000/api/code/files
2. Get directory tree: http://localhost:3000/api/code/tree
3. Read a file: http://localhost:3000/api/code/files?path=src/server.js

Please use these endpoints to explore and understand the codebase.
```

## Rate Limiting

Currently, there is no rate limiting on the Code Access API endpoints. In production, you may want to add rate limiting to prevent abuse.

## Notes

- The API is public by default (no authentication required)
- To add authentication, you can apply the `authenticateToken` middleware to the routes
- The API excludes `node_modules` and hidden files (starting with `.`)
- Only files from `src/` and `client/src/` directories are accessible
