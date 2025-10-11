# Contributing Guidelines

## Getting Started

### Initial Setup
1. Clone the repository
   ```bash
   git clone https://github.com/tmtperez/track-my-bids.git
   cd track-my-bids
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment files
   - Copy `.env.example` to `.env`
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.local.example` to `client/.env.local` (create if needed)
   - Update values as needed for your local environment

4. Set up the database
   ```bash
   cd server
   npx prisma migrate dev
   cd ..
   ```

5. Start development servers
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming Convention
- `feature/` - New features (e.g., `feature/add-bid-filtering`)
- `fix/` - Bug fixes (e.g., `fix/login-validation`)
- `refactor/` - Code refactoring (e.g., `refactor/cleanup-api-routes`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)

### Making Changes
1. **Always** start from the latest `main` branch
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and commit frequently
   ```bash
   git add .
   git commit -m "Clear, descriptive commit message"
   ```

4. Keep your branch updated with main
   ```bash
   git fetch origin
   git rebase origin/main
   ```

5. Push your branch
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub

### Commit Message Guidelines
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- First line should be 50 characters or less
- Reference issues when applicable

Examples:
```
Add bid filtering by status
Fix authentication token expiration
Refactor database query optimization
Update README with deployment instructions
```

### Pull Request Process
1. Ensure your code follows the project's style
2. Update documentation if needed
3. Make sure all tests pass (when available)
4. Request review from at least one team member
5. Address review feedback
6. Wait for approval before merging

### Code Review Guidelines
- Be respectful and constructive
- Explain the "why" behind suggestions
- Approve PRs when they're ready, even if minor changes are suggested
- Use "Request Changes" only for critical issues

## Common Issues

### Environment Variables
- **NEVER** commit `.env`, `.env.local`, or `server/.env` files
- Always use `.env.example` files as templates
- Ask team members for sensitive values (API keys, secrets)

### Database Conflicts
- If you make schema changes, create a new migration
- Coordinate with team before modifying existing migrations
- Run `npx prisma migrate dev` after pulling new migrations

### Merge Conflicts
- Pull latest changes frequently to minimize conflicts
- Communicate with team if working on same files
- Use `git rebase` instead of `git merge` for cleaner history

## Getting Help
- Check existing issues and PRs first
- Ask questions in team chat
- Tag team members in PR comments for specific questions
