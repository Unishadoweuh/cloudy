# Contributing to UniCloud

First off, thank you for considering contributing to UniCloud! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

### Types of Contributions

- 🐛 **Bug Reports** - Found a bug? Open an issue with a clear description
- 💡 **Feature Requests** - Have an idea? We'd love to hear it
- 📖 **Documentation** - Help improve our docs
- 🔧 **Code** - Submit a PR with bug fixes or new features
- 🌍 **Translations** - Help translate the interface

### First Time Contributors

Look for issues labeled `good first issue` - these are specifically curated for newcomers.

## Development Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Docker (recommended)
- Git

### Setting Up Your Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/unicloudovh.git
   cd unicloudovh
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Unishadow/unicloudovh.git
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd api && npm install
   
   # Frontend
   cd ../web && npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start development servers**
   ```bash
   # Database
   docker-compose up -d postgres
   
   # Backend (terminal 1)
   cd api && npm run start:dev
   
   # Frontend (terminal 2)
   cd web && npm run dev
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-snapshot-ui` - New features
- `fix/login-redirect-issue` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/optimize-api-calls` - Refactoring

### Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Build process or auxiliary tool changes

**Examples:**
```
feat(billing): add credit deduction functionality
fix(auth): resolve Discord OAuth callback issue
docs(readme): update installation instructions
```

### Code Quality

Before submitting, ensure:

```bash
# Lint your code
cd api && npm run lint
cd web && npm run lint

# Type checking
npm run typecheck

# Run tests (if available)
npm run test
```

## Pull Request Process

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a PR** with:
   - Clear title following commit conventions
   - Description of changes
   - Screenshots for UI changes
   - Link to related issue (if applicable)

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

4. **Review Process**
   - A maintainer will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React/Next.js

- Use functional components with hooks
- Follow the component file structure
- Use proper TypeScript types for props
- Keep components focused and small

### CSS/Styling

- Use Tailwind CSS utilities
- Follow the existing color scheme (slate-based)
- Ensure responsive design
- Use `cn()` utility for conditional classes

### API/Backend

- Follow NestJS conventions
- Use proper DTOs for validation
- Handle errors appropriately
- Add Swagger documentation for endpoints

---

## Questions?

Feel free to open an issue for any questions or reach out to the maintainers.

Thank you for contributing! 🚀
