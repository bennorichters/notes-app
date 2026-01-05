export function loginPage(error?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Notes</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #ddd8b8;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .login-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(30,21,42,0.15);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      margin-bottom: 1.5rem;
      color: #1e152a;
      font-size: 1.5rem;
    }
    .error {
      background: #fce8e2;
      color: #c44e2f;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2a2b2a;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #c9c5ad;
      border-radius: 4px;
      font-size: 1rem;
    }
    input:focus {
      outline: none;
      border-color: #087e8b;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: #087e8b;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    button:hover {
      background: #065f69;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>Notes Login</h1>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST" action="/login">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autofocus>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>
  `.trim()
}

interface HomePageProps {
  username: string
  showAuth: boolean
  lastNotes: { title: string; firstHeader: string; lastModified: Date }[]
}

export function homePage({ username, showAuth, lastNotes }: HomePageProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notes</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #ddd8b8;
      padding: 1rem;
    }
    .header {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(30,21,42,0.15);
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      color: #1e152a;
      font-size: 1.5rem;
    }
    .user-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .username {
      color: #2a2b2a;
      font-size: 0.9rem;
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: #f78154;
      color: white;
      border: none;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .logout-btn:hover {
      background: #e56840;
    }
    .content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(30,21,42,0.15);
    }
    .note-link {
      display: block;
      text-decoration: none;
      color: inherit;
      margin-bottom: 1rem;
    }
    .note-card {
      padding: 1rem;
      background: #f8f8f8;
      border-radius: 4px;
      border-left: 4px solid #087e8b;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .note-link:hover .note-card {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Notes</h1>
    ${showAuth ? `
    <div class="user-info">
      <span class="username">Logged in as ${username}</span>
      <a href="/logout" class="logout-btn">Logout</a>
    </div>
    ` : ''}
  </div>
  <div class="content">
    ${lastNotes.length > 0 ? `
    <h2 style="color: #1e152a; margin-bottom: 1rem;">
      Last Modified Notes
    </h2>
    ${lastNotes.map(note => `
    <a href="/note/${note.title}" class="note-link">
      <div class="note-card">
        <div style="font-size: 1.1rem; color: #2a2b2a; font-weight: 500;">
          ${note.firstHeader}
        </div>
        <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
          Modified: ${note.lastModified.toLocaleString()} - ${note.title}.md
        </div>
      </div>
    </a>
    `).join('')}
    ` : '<p>No notes found. Create your first note!</p>'}
  </div>
</body>
</html>
  `.trim()
}

interface NoteDetailPageProps {
  username: string
  showAuth: boolean
  note: {
    title: string
    firstHeader: string
    lastModified: Date
    renderedContent: string
  }
}

export function noteDetailPage({ username, showAuth, note }: NoteDetailPageProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.firstHeader} - Notes</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #ddd8b8;
      padding: 1rem;
    }
    .header {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(30,21,42,0.15);
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      color: #1e152a;
      font-size: 1.5rem;
    }
    .user-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .username {
      color: #2a2b2a;
      font-size: 0.9rem;
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: #f78154;
      color: white;
      border: none;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .logout-btn:hover {
      background: #e56840;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: #087e8b;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(30,21,42,0.15);
    }
    .note-meta {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }
    .markdown-content {
      color: #2a2b2a;
      line-height: 1.6;
    }
    .markdown-content h1, .markdown-content h2, .markdown-content h3,
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      color: #1e152a;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .markdown-content h1 { font-size: 2rem; }
    .markdown-content h2 { font-size: 1.5rem; }
    .markdown-content h3 { font-size: 1.25rem; }
    .markdown-content h4 { font-size: 1.1rem; }
    .markdown-content p {
      margin-bottom: 1rem;
    }
    .markdown-content ul, .markdown-content ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }
    .markdown-content li {
      margin-bottom: 0.5rem;
    }
    .markdown-content a {
      color: #087e8b;
      text-decoration: none;
    }
    .markdown-content a:hover {
      text-decoration: underline;
    }
    .markdown-content code {
      background: #f8f8f8;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .markdown-content pre {
      background: #f8f8f8;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    .markdown-content pre code {
      background: none;
      padding: 0;
    }
    .markdown-content blockquote {
      border-left: 4px solid #087e8b;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #666;
    }
    .markdown-content strong {
      font-weight: 600;
    }
    .markdown-content em {
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Notes</h1>
    ${showAuth ? `
    <div class="user-info">
      <span class="username">Logged in as ${username}</span>
      <a href="/logout" class="logout-btn">Logout</a>
    </div>
    ` : ''}
  </div>
  <a href="/" class="back-link">← Back to Notes</a>
  <div class="content">
    <div class="note-meta">
      Modified: ${note.lastModified.toLocaleString()} - ${note.title}.md
    </div>
    <div class="markdown-content">
      ${note.renderedContent}
    </div>
  </div>
</body>
</html>
  `.trim()
}
