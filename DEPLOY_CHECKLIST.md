# KAN-4 · Deploy Workflow — Pre-Push Validation Checklist

> **⚠️ Developer reference only — do NOT commit this file.**
> Delete after verifying the deploy pipeline is ready. Add `DEPLOY_CHECKLIST.md` to `.gitignore` if needed.

---

## How to use this checklist

Work through each item top-to-bottom before pushing to `main`.  
Items marked **✅ AUTO** were verified programmatically during this dry-run.  
Items marked **⚠️ MANUAL** require a browser/UI check.

---

## 1 · Workflow file exists and is valid YAML

- [ ] `.github/workflows/deploy.yml` is present in the repository root
- [ ] YAML syntax is clean — run the linter:

  ```bash
  npx yaml-lint .github/workflows/deploy.yml
  # Expected output: [success] YAML Lint successful.
  ```

  > **✅ AUTO — verified:** `npx yaml-lint .github/workflows/deploy.yml` exited 0 with
  > `[success] YAML Lint successful.`

---

## 2 · Workflow triggers on `push` to `main`

- [ ] The `on:` block in `deploy.yml` contains exactly:

  ```yaml
  on:
    push:
      branches:
        - main
  ```

  > **✅ AUTO — verified:** `deploy.yml` lines 3-6 match the above exactly.

---

## 3 · Permissions include `pages: write` and `id-token: write`

- [ ] The top-level `permissions:` block grants both required scopes:

  ```yaml
  permissions:
    contents: read
    pages: write
    id-token: write
  ```

  > **✅ AUTO — verified:** Both `pages: write` and `id-token: write` are present in
  > `deploy.yml`.

---

## 4 · Uses `actions/checkout@v4`

- [ ] The Checkout step pins to the v4 major tag:

  ```yaml
  - name: Checkout
    uses: actions/checkout@v4
  ```

  > **✅ AUTO — verified:** `deploy.yml` uses `actions/checkout@v4`.

---

## 5 · Uses `actions/setup-node@v4` with Node 20

- [ ] The Setup Node step uses v4 of the action and targets Node 20:

  ```yaml
  - name: Setup Node
    uses: actions/setup-node@v4
    with:
      node-version: 20
  ```

  > **✅ AUTO — verified:** `deploy.yml` uses `actions/setup-node@v4` with
  > `node-version: 20`.

---

## 6 · Uses `actions/configure-pages@v5`

- [ ] The Configure Pages step pins to v5:

  ```yaml
  - name: Configure Pages
    uses: actions/configure-pages@v5
  ```

  > **✅ AUTO — verified:** `deploy.yml` uses `actions/configure-pages@v5`.

---

## 7 · Runs `npm ci` (not `npm install`)

- [ ] The Install Dependencies step uses `npm ci` for reproducible installs:

  ```yaml
  - name: Install Dependencies
    run: npm ci
  ```

  > **✅ AUTO — verified:** `deploy.yml` runs `npm ci`.  
  > `npm install` is **not** present in the deploy workflow.

---

## 8 · Runs `npm run build` — NOT lint-gated

- [ ] The Build step runs only the build script with no lint guard:

  ```yaml
  - name: Build
    run: npm run build
  ```

- [ ] `package.json` `"build"` script is **not** prefixed/suffixed with lint:

  ```json
  "build": "vite build"
  ```

  > **✅ AUTO — verified:**
  > - `deploy.yml` runs `npm run build` directly (no `&&` lint chaining).
  > - `package.json` `"build"` is `"vite build"` — lint-free.  
  > - Lint lives only in `ci.yml` (`npm run lint`), keeping deploy independent.

---

## 9 · Uses `actions/upload-pages-artifact@v3` with `path: './dist'`

- [ ] The Upload Artifact step pins to v3 and targets the `dist` folder:

  ```yaml
  - name: Upload Artifact
    uses: actions/upload-pages-artifact@v3
    with:
      path: './dist'
  ```

  > **✅ AUTO — verified:** `deploy.yml` uses `actions/upload-pages-artifact@v3`
  > with `path: './dist'`.

---

## 10 · Uses `actions/deploy-pages@v4` with `id: deployment`

- [ ] The final deploy step pins to v4 and carries the `deployment` step ID
  (the environment URL references `steps.deployment.outputs.page_url`):

  ```yaml
  - name: Deploy to GitHub Pages
    id: deployment
    uses: actions/deploy-pages@v4
  ```

  > **✅ AUTO — verified:** `deploy.yml` uses `actions/deploy-pages@v4` with
  > `id: deployment`.

---

## 11 · Environment is set to `github-pages`

- [ ] The job-level `environment:` block names the deployment environment
  correctly and wires up the URL output:

  ```yaml
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  ```

  > **✅ AUTO — verified:** `deploy.yml` declares `name: github-pages` and uses
  > the `deployment` step output for the URL.

---

## 12 · `package.json` `build` script does not include lint

- [ ] Confirm the full `scripts` block — `build` must be a standalone Vite invocation:

  ```json
  "scripts": {
    "dev":      "vite",
    "build":    "vite build",
    "lint":     "eslint .",
    "preview":  "vite preview"
  }
  ```

  > **✅ AUTO — verified:** `"build": "vite build"` — no lint dependency.  
  > A lint failure in CI will never block a production deploy.

---

## 13 · `vite.config.ts` has `base` set for GitHub Pages

- [ ] The Vite config exports a `base` path matching the repository name so that
  all asset URLs resolve correctly under the Pages sub-path:

  ```ts
  export default defineConfig({
    plugins: [react()],
    base: '/auth-boilerplate/',   // ← must match repo name exactly
    // ...
  })
  ```

  > **✅ AUTO — verified:** `vite.config.ts` has `base: '/auth-boilerplate/'`.  
  > If the repository is renamed, this value **must** be updated to match.

---

## 14 · Local `npm run build` produces a `dist/` directory with `index.html`

- [ ] Run the build locally and inspect the output:

  ```bash
  npm run build
  ls dist/
  # Expected: index.html  assets/
  ```

- [ ] `dist/index.html` exists
- [ ] `dist/assets/` contains at least one `.js` and one `.css` bundle

  > **✅ AUTO — verified (this dry-run session):**
  >
  > ```
  > dist/
  > ├── index.html                 (0.50 kB │ gzip: 0.31 kB)
  > └── assets/
  >     ├── index-BqbI-FJw.css    (3.06 kB │ gzip: 1.00 kB)
  >     └── index-D6VTcZCD.js   (168.15 kB │ gzip: 55.06 kB)
  > ```
  >
  > Build completed in ~559 ms with exit code 0. ✓

---

## 15 · MANUAL: GitHub repo Pages source is set to "GitHub Actions"

- [ ] In the repository on GitHub, navigate to:
  **Settings → Pages → Build and deployment → Source**
- [ ] Confirm the source dropdown is set to **"GitHub Actions"** (not "Deploy from a branch")

  > **⚠️ MANUAL — cannot be automated.**  
  > If this is set to a branch source, the `deploy-pages` action will have no
  > environment to deploy to and the workflow will fail with a 403/404.

---

## Summary

| # | Check | Status |
|---|-------|--------|
| 1 | `deploy.yml` exists & passes YAML lint | ✅ AUTO |
| 2 | Triggers on `push` → `main` | ✅ AUTO |
| 3 | `pages: write` + `id-token: write` permissions | ✅ AUTO |
| 4 | `actions/checkout@v4` | ✅ AUTO |
| 5 | `actions/setup-node@v4` with Node 20 | ✅ AUTO |
| 6 | `actions/configure-pages@v5` | ✅ AUTO |
| 7 | `npm ci` (not `npm install`) | ✅ AUTO |
| 8 | `npm run build` — not lint-gated | ✅ AUTO |
| 9 | `actions/upload-pages-artifact@v3` → `./dist` | ✅ AUTO |
| 10 | `actions/deploy-pages@v4` with `id: deployment` | ✅ AUTO |
| 11 | Environment name `github-pages` | ✅ AUTO |
| 12 | `package.json` `build` script is lint-free | ✅ AUTO |
| 13 | `vite.config.ts` `base` set for GitHub Pages | ✅ AUTO |
| 14 | Local `npm run build` → `dist/index.html` exists | ✅ AUTO |
| 15 | Repo Settings → Pages → Source = "GitHub Actions" | ⚠️ MANUAL |

**All 14 automated checks passed. Complete item 15 manually before pushing to `main`.**

---

> _Generated for KAN-4 · Delete this file after verification._
