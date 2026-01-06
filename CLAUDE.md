# Gerneral Info
- This app is a web app.
- The web runs on a VPS as a Dokku app
- It interacts with the git repo at /var/lib/dokku/data/storage/notes
- It can search through notes and create new ones
- It's mobile friendly and usable on a desktop
- Login with user name password
- Has MFA 
- Each file is a separate note
- Each note is written in Markdown
- Most notes end with a colon separated line of tags, i.e., :tag1:tag2:tag3:
- The app needs full text search and fuzzy search.
- The app needs to be able to search through tags
- There are less than 1000 files
- The total size of the notes is a few MB.
- Changing and creating notes need to trigger git commit and push
- It's single user for now
- Note editing is with a simple text area for now.

# Code style
- Never use comments
- Try to limit the line size to 100 characters

# Workflow
- When adding new dependencies, use the latest version 
