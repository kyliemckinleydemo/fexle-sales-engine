# Contributing to Sales Engine

First off, thank you for considering contributing to the Sales Engine! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Browser and OS** information

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear description** of the feature
- **Use case** - why is this needed?
- **Potential implementation** ideas (optional)

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sales-engine.git
cd sales-engine

# Open in browser for testing
open index.html
```

### Project Structure

```
sales-engine/
├── index.html          # Main application (single-file React app)
├── docs/               # Documentation
├── scripts/            # Backend scripts (Apps Script)
└── assets/             # Images and other assets
```

### Making Changes

Since the app is a single HTML file with embedded React:

1. Open `index.html` in your editor
2. Find the relevant section (search for component names)
3. Make changes
4. Refresh browser to test
5. Check browser console for errors

## Style Guidelines

### JavaScript/React

- Use functional components with hooks
- Keep components focused and small
- Use meaningful variable names
- Comment complex logic

```javascript
// Good
const calculateLeadScore = (lead) => {
  // Score based on company size, revenue, title, etc.
  let score = 0;
  // ... implementation
  return score;
};

// Avoid
const calc = (l) => {
  let s = 0;
  // ...
  return s;
};
```

### CSS (Tailwind)

- Use Tailwind utility classes
- Keep class strings readable
- Extract repeated patterns to components

```html
<!-- Good: Readable and semantic -->
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>

<!-- Avoid: Hard to read -->
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
```

### Commit Messages

Use clear, descriptive commit messages:

```
# Good
feat: Add Google Sheets sync functionality
fix: Resolve score calculation for empty fields
docs: Update setup guide with API instructions

# Avoid
update
fixed stuff
changes
```

Format: `type: description`

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change that neither fixes nor adds
- `test` - Adding tests
- `chore` - Maintenance tasks

## Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
2. **Update documentation** if needed
3. **Check for console errors**
4. **Ensure no regressions** in existing features

### PR Description

Include:

- **What** does this PR do?
- **Why** is this change needed?
- **How** was it tested?
- **Screenshots** for UI changes

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, it will be merged

### After Merge

- Your contribution will be in the next release
- You'll be credited in the changelog

## Questions?

Feel free to open an issue for any questions about contributing!

---

Thank you for helping make Sales Engine better! 🚀
