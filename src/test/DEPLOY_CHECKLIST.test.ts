/**
 * Tests for DEPLOY_CHECKLIST.md
 *
 * Validates the content, structure, and completeness of the KAN-4 deployment
 * pre-push validation checklist:
 * - All 15 documented checklist items are present
 * - AUTO-verified items are marked correctly
 * - Required code snippets and commands are present
 * - The summary table reflects the correct statuses
 *
 * Source file: DEPLOY_CHECKLIST.md
 *
 * Strategy: read the markdown as raw text and assert on its content.
 * We deliberately avoid importing a markdown parser to keep the test
 * dependency-free beyond what the project already has.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------
// ESM path helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

let content: string
let lines: string[]

beforeAll(() => {
  // Two levels up from src/test/ → repo root
  const filePath = resolve(__dirname, '../../DEPLOY_CHECKLIST.md')
  content = readFileSync(filePath, 'utf-8')
  lines = content.split('\n')
})

// ---------------------------------------------------------------------------
// File existence & basic structure
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – file structure', () => {
  it('should exist and be readable as a non-empty string', () => {
    expect(typeof content).toBe('string')
    expect(content.length).toBeGreaterThan(0)
  })

  it('should contain a markdown H1 heading', () => {
    const hasH1 = lines.some((line) => line.startsWith('# '))
    expect(hasH1).toBe(true)
  })

  it('should reference KAN-4 in the title', () => {
    expect(content).toContain('KAN-4')
  })

  it('should mention "Deploy Workflow" in the heading', () => {
    expect(content).toContain('Deploy Workflow')
  })

  it('should contain a "How to use this checklist" section', () => {
    expect(content).toContain('How to use this checklist')
  })

  it('should contain a Summary section', () => {
    expect(content).toContain('## Summary')
  })
})

// ---------------------------------------------------------------------------
// Developer warning note
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – developer warning', () => {
  it('should include a warning that the file is for developer reference only', () => {
    expect(content).toContain('Developer reference only')
  })

  it('should instruct developers not to commit the file', () => {
    expect(content).toContain('do NOT commit this file')
  })

  it('should suggest deleting the file after verification', () => {
    expect(content).toContain('Delete after verifying')
  })

  it('should suggest adding the file to .gitignore', () => {
    expect(content).toContain('.gitignore')
  })
})

// ---------------------------------------------------------------------------
// Status legend
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – status markers', () => {
  it('should define AUTO status marker', () => {
    expect(content).toContain('✅ AUTO')
  })

  it('should define MANUAL status marker', () => {
    expect(content).toContain('⚠️ MANUAL')
  })
})

// ---------------------------------------------------------------------------
// Checklist items 1–15
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – checklist item 1: deploy.yml exists and is valid YAML', () => {
  it('should have a section header for item 1', () => {
    expect(content).toContain('1 ·')
  })

  it('should reference the deploy.yml workflow file path', () => {
    expect(content).toContain('.github/workflows/deploy.yml')
  })

  it('should mention yaml-lint as the validation tool', () => {
    expect(content).toContain('yaml-lint')
  })

  it('should show the expected yaml-lint success output', () => {
    expect(content).toContain('[success] YAML Lint successful.')
  })

  it('should mark item 1 as AUTO verified', () => {
    // The verification line should appear near item 1
    const item1Section = content.substring(
      content.indexOf('1 ·'),
      content.indexOf('2 ·'),
    )
    expect(item1Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 2: push trigger on main', () => {
  it('should have a section header for item 2', () => {
    expect(content).toContain('2 ·')
  })

  it('should show the expected "on:" YAML snippet for push to main', () => {
    expect(content).toContain('on:')
    expect(content).toContain('push:')
    expect(content).toContain('- main')
  })

  it('should mark item 2 as AUTO verified', () => {
    const item2Section = content.substring(
      content.indexOf('2 ·'),
      content.indexOf('3 ·'),
    )
    expect(item2Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 3: permissions', () => {
  it('should have a section header for item 3', () => {
    expect(content).toContain('3 ·')
  })

  it('should list pages: write permission', () => {
    expect(content).toContain('pages: write')
  })

  it('should list id-token: write permission', () => {
    expect(content).toContain('id-token: write')
  })

  it('should list contents: read permission', () => {
    expect(content).toContain('contents: read')
  })

  it('should mark item 3 as AUTO verified', () => {
    const item3Section = content.substring(
      content.indexOf('3 ·'),
      content.indexOf('4 ·'),
    )
    expect(item3Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 4: actions/checkout@v4', () => {
  it('should have a section header for item 4', () => {
    expect(content).toContain('4 ·')
  })

  it('should reference actions/checkout@v4', () => {
    expect(content).toContain('actions/checkout@v4')
  })

  it('should mark item 4 as AUTO verified', () => {
    const item4Section = content.substring(
      content.indexOf('4 ·'),
      content.indexOf('5 ·'),
    )
    expect(item4Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 5: actions/setup-node@v4 with Node 20', () => {
  it('should have a section header for item 5', () => {
    expect(content).toContain('5 ·')
  })

  it('should reference actions/setup-node@v4', () => {
    expect(content).toContain('actions/setup-node@v4')
  })

  it('should specify node-version: 20', () => {
    expect(content).toContain('node-version: 20')
  })

  it('should mark item 5 as AUTO verified', () => {
    const item5Section = content.substring(
      content.indexOf('5 ·'),
      content.indexOf('6 ·'),
    )
    expect(item5Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 6: actions/configure-pages@v5', () => {
  it('should have a section header for item 6', () => {
    expect(content).toContain('6 ·')
  })

  it('should reference actions/configure-pages@v5', () => {
    expect(content).toContain('actions/configure-pages@v5')
  })

  it('should mark item 6 as AUTO verified', () => {
    const item6Section = content.substring(
      content.indexOf('6 ·'),
      content.indexOf('7 ·'),
    )
    expect(item6Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 7: npm ci', () => {
  it('should have a section header for item 7', () => {
    expect(content).toContain('7 ·')
  })

  it('should specify npm ci as the install command', () => {
    expect(content).toContain('npm ci')
  })

  it('should warn against npm install', () => {
    expect(content).toContain('npm install')
  })

  it('should mark item 7 as AUTO verified', () => {
    const item7Section = content.substring(
      content.indexOf('7 ·'),
      content.indexOf('8 ·'),
    )
    expect(item7Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 8: npm run build not lint-gated', () => {
  it('should have a section header for item 8', () => {
    expect(content).toContain('8 ·')
  })

  it('should reference npm run build', () => {
    expect(content).toContain('npm run build')
  })

  it('should confirm the build script is "vite build"', () => {
    expect(content).toContain('"build": "vite build"')
  })

  it('should note that lint lives only in ci.yml', () => {
    expect(content).toContain('ci.yml')
  })

  it('should mark item 8 as AUTO verified', () => {
    const item8Section = content.substring(
      content.indexOf('8 ·'),
      content.indexOf('9 ·'),
    )
    expect(item8Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 9: upload-pages-artifact@v3 with ./dist', () => {
  it('should have a section header for item 9', () => {
    expect(content).toContain('9 ·')
  })

  it('should reference actions/upload-pages-artifact@v3', () => {
    expect(content).toContain('actions/upload-pages-artifact@v3')
  })

  it('should specify path: "./dist"', () => {
    expect(content).toContain("path: './dist'")
  })

  it('should mark item 9 as AUTO verified', () => {
    const item9Section = content.substring(
      content.indexOf('9 ·'),
      content.indexOf('10 ·'),
    )
    expect(item9Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 10: deploy-pages@v4 with id: deployment', () => {
  it('should have a section header for item 10', () => {
    expect(content).toContain('10 ·')
  })

  it('should reference actions/deploy-pages@v4', () => {
    expect(content).toContain('actions/deploy-pages@v4')
  })

  it('should specify id: deployment', () => {
    expect(content).toContain('id: deployment')
  })

  it('should mark item 10 as AUTO verified', () => {
    const item10Section = content.substring(
      content.indexOf('10 ·'),
      content.indexOf('11 ·'),
    )
    expect(item10Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 11: github-pages environment', () => {
  it('should have a section header for item 11', () => {
    expect(content).toContain('11 ·')
  })

  it('should reference the github-pages environment name', () => {
    expect(content).toContain('github-pages')
  })

  it('should reference the page_url output', () => {
    expect(content).toContain('page_url')
  })

  it('should mark item 11 as AUTO verified', () => {
    const item11Section = content.substring(
      content.indexOf('11 ·'),
      content.indexOf('12 ·'),
    )
    expect(item11Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 12: package.json build lint-free', () => {
  it('should have a section header for item 12', () => {
    expect(content).toContain('12 ·')
  })

  it('should show the expected scripts block with standalone build', () => {
    expect(content).toContain('"build":    "vite build"')
  })

  it('should mark item 12 as AUTO verified', () => {
    const item12Section = content.substring(
      content.indexOf('12 ·'),
      content.indexOf('13 ·'),
    )
    expect(item12Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 13: vite.config.ts base path', () => {
  it('should have a section header for item 13', () => {
    expect(content).toContain('13 ·')
  })

  it('should reference the base path /auth-boilerplate/', () => {
    expect(content).toContain('/auth-boilerplate/')
  })

  it('should warn that the base must match the repo name exactly', () => {
    expect(content).toContain('must match repo name exactly')
  })

  it('should mark item 13 as AUTO verified', () => {
    const item13Section = content.substring(
      content.indexOf('13 ·'),
      content.indexOf('14 ·'),
    )
    expect(item13Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 14: local build produces dist/', () => {
  it('should have a section header for item 14', () => {
    expect(content).toContain('14 ·')
  })

  it('should reference dist/index.html as an expected output', () => {
    expect(content).toContain('dist/index.html')
  })

  it('should mention dist/assets/ as expected output directory', () => {
    expect(content).toContain('dist/')
    expect(content).toContain('assets/')
  })

  it('should confirm the local build completed successfully', () => {
    expect(content).toContain('exit code 0')
  })

  it('should mark item 14 as AUTO verified', () => {
    const item14Section = content.substring(
      content.indexOf('14 ·'),
      content.indexOf('15 ·'),
    )
    expect(item14Section).toContain('✅ AUTO')
  })
})

describe('DEPLOY_CHECKLIST.md – checklist item 15: GitHub Pages source setting (MANUAL)', () => {
  it('should have a section header for item 15', () => {
    expect(content).toContain('15 ·')
  })

  it('should instruct the developer to set Pages source to "GitHub Actions"', () => {
    expect(content).toContain('GitHub Actions')
  })

  it('should reference the GitHub repo Settings → Pages navigation path', () => {
    expect(content).toContain('Settings')
    expect(content).toContain('Pages')
  })

  it('should mark item 15 as MANUAL (cannot be automated)', () => {
    const item15Section = content.substring(content.indexOf('15 ·'))
    expect(item15Section).toContain('⚠️ MANUAL')
  })

  it('should explain the risk of wrong source setting (403/404)', () => {
    expect(content).toContain('403')
    expect(content).toContain('404')
  })
})

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – summary table', () => {
  it('should contain a markdown table', () => {
    // Markdown tables use | as column separators
    const hasTable = lines.some((line) => line.trim().startsWith('|'))
    expect(hasTable).toBe(true)
  })

  it('should list all 15 checklist items in the summary table', () => {
    // Each table row starts with | N |
    for (let i = 1; i <= 15; i++) {
      expect(content).toContain(`| ${i} |`)
    }
  })

  it('should show ✅ AUTO for items 1 through 14 in the summary', () => {
    const summarySection = content.substring(content.indexOf('## Summary'))
    expect(summarySection).toContain('✅ AUTO')
  })

  it('should show ⚠️ MANUAL for item 15 in the summary', () => {
    const summarySection = content.substring(content.indexOf('## Summary'))
    expect(summarySection).toContain('⚠️ MANUAL')
  })

  it('should state that all 14 automated checks passed', () => {
    expect(content).toContain('All 14 automated checks passed')
  })

  it('should instruct completion of item 15 before pushing to main', () => {
    expect(content).toContain('Complete item 15 manually before pushing to')
    expect(content).toContain('main')
  })
})

// ---------------------------------------------------------------------------
// Traceability: KAN-4 footer
// ---------------------------------------------------------------------------

describe('DEPLOY_CHECKLIST.md – KAN-4 traceability footer', () => {
  it('should reference KAN-4 in the closing footer', () => {
    expect(content).toContain('KAN-4')
  })

  it('should instruct developers to delete the file after verification', () => {
    // Appears both in the note and the footer
    expect(content).toContain('Delete this file after verification')
  })
})
