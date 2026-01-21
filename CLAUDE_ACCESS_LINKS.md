# ARENAX Code Access Links for Claude

This document provides direct access links for Claude (or any AI assistant) to programmatically access the ARENAX source code.

## Quick Access Links

When the ARENAX server is running, Claude can use these endpoints to explore the codebase:

### 1. Get Directory Structure
```
http://localhost:3000/api/code/tree
```
**Purpose:** Get a complete hierarchical view of all source directories and files

**Response:** JSON tree structure showing all folders and files with metadata

---

### 2. List All Source Files
```
http://localhost:3000/api/code/files
```
**Purpose:** Get a flat list of all source files with metadata (path, name, size, modification date)

**Response:** JSON array of all accessible files

---

### 3. Read Specific Files
```
http://localhost:3000/api/code/files?path=<filepath>
```
**Purpose:** Get the full content of a specific source file

**Examples:**
- Main server: `http://localhost:3000/api/code/files?path=src/server.js`
- Auth controller: `http://localhost:3000/api/code/files?path=src/controllers/authController.js`
- User model: `http://localhost:3000/api/code/files?path=src/models/User.js`
- React app: `http://localhost:3000/api/code/files?path=client/src/App.jsx`

---

## For Production/Deployed Version

If ARENAX is deployed to a public URL, replace `http://localhost:3000` with the deployed URL:

```
https://your-domain.com/api/code/tree
https://your-domain.com/api/code/files
https://your-domain.com/api/code/files?path=src/server.js
```

---

## Using with ngrok (for local development with public access)

If you want to give Claude access to your local development server:

1. Start ARENAX locally:
   ```bash
   npm start
   ```

2. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```

3. ngrok will provide a public URL (e.g., `https://abc123.ngrok.io`)

4. Share these links with Claude:
   ```
   https://abc123.ngrok.io/api/code/tree
   https://abc123.ngrok.io/api/code/files
   https://abc123.ngrok.io/api/code/files?path=src/server.js
   ```

---

## Instructions for Claude

Dear Claude,

To explore the ARENAX codebase, follow these steps:

1. **First, get the directory structure:**
   - Request: `http://localhost:3000/api/code/tree`
   - This will show you the complete folder structure and file organization

2. **Then, list all files:**
   - Request: `http://localhost:3000/api/code/files`
   - This gives you a flat list of all accessible files with their paths

3. **Read specific files:**
   - Use: `http://localhost:3000/api/code/files?path=<filepath>`
   - Replace `<filepath>` with the path from step 2
   - Example: `http://localhost:3000/api/code/files?path=src/server.js`

4. **Key files to start with:**
   - `src/server.js` - Main application entry point
   - `src/routes/` - API route definitions
   - `src/controllers/` - Business logic
   - `src/models/` - Database models
   - `client/src/` - Frontend React application

You can make multiple requests to explore different files and understand the codebase architecture.

---

## API Features

- **Security:** Path validation prevents directory traversal attacks
- **Rate Limiting:** 300 requests per 15 minutes per IP
- **File Types:** Only serves .js, .jsx, .json, .md files
- **Scope:** Only files in `src/` and `client/src/` directories
- **Format:** All responses are JSON with success status and data

---

## Example Usage

### Using cURL
```bash
# Get tree
curl http://localhost:3000/api/code/tree | jq

# List files
curl http://localhost:3000/api/code/files | jq

# Read server.js
curl "http://localhost:3000/api/code/files?path=src/server.js" | jq '.file.content'
```

### Using Python
```python
import requests

# Get tree
response = requests.get('http://localhost:3000/api/code/tree')
tree = response.json()

# List files
response = requests.get('http://localhost:3000/api/code/files')
files = response.json()['files']

# Read specific file
response = requests.get(
    'http://localhost:3000/api/code/files',
    params={'path': 'src/server.js'}
)
content = response.json()['file']['content']
```

### Using JavaScript/Node.js
```javascript
// Get tree
const tree = await fetch('http://localhost:3000/api/code/tree')
  .then(r => r.json());

// List files
const files = await fetch('http://localhost:3000/api/code/files')
  .then(r => r.json());

// Read specific file
const file = await fetch(
  'http://localhost:3000/api/code/files?path=src/server.js'
).then(r => r.json());
console.log(file.file.content);
```

---

## Complete Documentation

For full API documentation with all features, error handling, and advanced usage, see:
- [CODE_ACCESS_API.md](./CODE_ACCESS_API.md)

---

## Security Summary

✅ **All security concerns addressed:**
- Path validation to prevent directory traversal
- Rate limiting (300 req/15min per IP)
- Only serves whitelisted file types
- Only serves files from specific directories
- No vulnerabilities found in CodeQL scan
