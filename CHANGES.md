# Changelog

## Unreleased

- Increase Railway healthcheck timeout from `100`ms → `5000`ms to avoid false unhealthy during cold starts. (Applied to `railway.json`)

---

**Note:** To apply the patch locally:

1. From repo root run: `git apply .patches/0001-increase-railway-healthcheck.patch`
2. Review changes: `git diff`
3. Commit: `git add railway.json && git commit -m "chore: increase railway healthcheck timeout to 5000ms"`
4. Push and redeploy on Railway.
