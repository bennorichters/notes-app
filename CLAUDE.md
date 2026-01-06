# Gerneral Info
- This app is a web app.
- The web runs on a VPS as a Dokku app
- It interacts with the git repo at /var/lib/dokku/data/storage/notes
- It can search through notes and create new ones
- It's mobile friendly and usable on a desktop
- Login with user name password
- Has MFA 
- There are max a few thousand files
- Each file is a separate note
- Each note is written in Markdown
- Each note ends with a colon separated line of tags
- The app needs full text search and fuzzy search.
- The app needs to be able to search through tags
- In memory search is good enough for now
- Changing and creating notes need to trigger git commit and push
- It's single user for now
- Note editing is with a simple text area for now.

# Code style
- Never use comments
- Try to limit the line size to 100 characters

# Workflow
- When adding new dependencies, use the latest version 
