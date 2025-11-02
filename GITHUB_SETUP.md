# How to Push Your Code to GitHub

## Prerequisites

Make sure Git is installed on your computer:
- Download from: https://git-scm.com/download/win
- Or check if installed: Open Command Prompt and type `git --version`

---

## Step-by-Step Instructions

### Step 1: Open Terminal/Command Prompt

**Option A - Using VS Code:**
- Press `Ctrl + ~` (backtick) to open terminal
- Or: View → Terminal

**Option B - Using Command Prompt:**
- Press `Win + R`
- Type `cmd` and press Enter
- Navigate to project folder:
  ```
  cd C:\Users\pavan\Downloads\blablabla
  ```

**Option C - Using PowerShell:**
- Right-click in project folder
- Select "Open PowerShell window here"

---

### Step 2: Initialize Git Repository

Run these commands one by one:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: Automated Parking Ticket System"
```

**What these do:**
- `git init` - Creates a new Git repository
- `git add .` - Stages all files for commit
- `git commit -m "..."` - Saves your files to Git

---

### Step 3: Connect to GitHub Repository

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
If your GitHub username is `johndoe` and repository name is `parking-system`, the command would be:
```bash
git remote add origin https://github.com/johndoe/parking-system.git
```

---

### Step 4: Rename Branch to Main (if needed)

```bash
git branch -M main
```

---

### Step 5: Push Code to GitHub

```bash
git push -u origin main
```

**You'll be prompted to:**
1. Enter your GitHub username
2. Enter your GitHub password (or Personal Access Token)

**Note:** GitHub no longer accepts passwords. You need a **Personal Access Token**:
- Go to: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Select scope: `repo` (full control of private repositories)
- Copy the token and use it as your password

---

## Complete Command Sequence

Copy and paste these commands (one at a time):

```bash
git init
git add .
git commit -m "Initial commit: Automated Parking Ticket System"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Troubleshooting

### Error: "git is not recognized"
**Solution:** Install Git from https://git-scm.com/download/win

### Error: "Repository not found"
**Solution:** 
- Check your GitHub username and repository name
- Make sure the repository exists on GitHub
- Verify the repository URL is correct

### Error: "Authentication failed"
**Solution:**
- Use Personal Access Token instead of password
- Create token: https://github.com/settings/tokens

### Error: "fatal: not a git repository"
**Solution:** 
- Run `git init` first
- Make sure you're in the project folder

### Error: "Updates were rejected"
**Solution:**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## After Pushing

✅ **Verify your code is on GitHub:**
1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files

✅ **Share your repository:**
- Copy the repository URL
- Share with others: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

---

## Future Updates

After making changes to your code, push updates with:

```bash
git add .
git commit -m "Description of changes"
git push
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git init` | Initialize Git repository |
| `git add .` | Stage all files |
| `git commit -m "message"` | Save changes |
| `git remote add origin URL` | Connect to GitHub |
| `git push -u origin main` | Upload to GitHub |
| `git status` | Check repository status |
| `git log` | View commit history |

---

## Need Help?

- GitHub Docs: https://docs.github.com
- Git Tutorial: https://git-scm.com/docs/gittutorial
