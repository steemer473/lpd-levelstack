# Name: Full Git Workflow
# Description: Automate the entire git add, commit, issue, PR, review, test, and merge process.

**Instructions for the Agent:**

## Conventional commits (recommended)

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit subjects and PR titles: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`, etc. Present tense, under ~100 chars.

## Steps

1. Use `git add .` to stage all current changes.
2. Commit with a **conventional** message, e.g. `feat: add report scorecard` or `fix: intake form validation`. Use a HEREDOC for multi-line bodies if needed.
3. Push the changes to the current feature branch on GitHub.
4. If not already created, use the GitHub CLI (`gh`) to create a new issue, noting the task being completed (if applicable).
5. Create a pull request with a **conventional title**:
   - Preferred: `gh pr create --title "type: description" --body "$(cat <<'EOF' ... EOF)"` and link the issue (`Closes #N`).
   - If using `gh pr create --fill`, verify the PR title matches conventional format; edit with `gh pr edit` if needed.
6. Once the PR is open, run the "Agent Review" on the changes and wait for **merge-blocking** checks only (see below).
7. After required checks pass, merge the PR into `main` (squash merge) and delete the feature branch.
8. Return the final PR or issue URL.

## CI: merge-blocking vs advisory

### Wait for these (all must pass)

| Check name (exact) | Workflow |
|--------------------|----------|
| `Check` | lint, type-check, unit tests, build |

### Do not wait before merge

| Check | Why |
|-------|-----|
| `Vercel` / `Vercel Preview Comments` | Deploy preview; not merge gate |

### Polling pattern

Poll until merge-blocking checks pass; merge as soon as they do — do **not** use `gh pr checks --watch` if advisory checks are present.

```bash
PR=123  # replace with PR number
REQUIRED=("Check")

while true; do
  OUTPUT=$(gh pr checks "$PR" 2>&1) || true
  ALL_PASS=true
  for name in "${REQUIRED[@]}"; do
    if ! echo "$OUTPUT" | grep -F "$name" | grep -q $'\tpass\t'; then
      ALL_PASS=false
      break
    fi
  done
  if [ "$ALL_PASS" = true ]; then break; fi
  sleep 15
done
gh pr merge "$PR" --squash --delete-branch
```
