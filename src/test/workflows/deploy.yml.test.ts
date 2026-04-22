/**
 * Tests for .github/workflows/deploy.yml
 *
 * Validates the structure, triggers, permissions, concurrency, jobs, and
 * steps of the Deploy to GitHub Pages workflow file.
 *
 * Source file: .github/workflows/deploy.yml
 * Actual content verified against the live YAML before writing assertions.
 *
 * The deploy workflow has TWO jobs:
 *   1. "build"  – checks out, detects package manager, installs, builds,
 *                 configures Pages, determines output dir, and uploads the
 *                 pages artifact.
 *   2. "deploy" – needs "build"; runs actions/deploy-pages@v4 with the
 *                 "github-pages" environment.
 *
 * Build job step inventory (9 steps total):
 *   0. Checkout                          (uses: actions/checkout@v4)
 *   1. Detect package manager            (run)
 *   2. Enable pnpm via corepack         (run, conditional)
 *   3. Setup Node                        (uses: actions/setup-node@v4)
 *   4. Install dependencies             (run)
 *   5. Build                            (run)
 *   6. Configure Pages                  (uses: actions/configure-pages@v5)
 *   7. Determine build output directory (run)
 *   8. Upload Pages artifact            (uses: actions/upload-pages-artifact@v3)
 *
 * Action steps (uses:): checkout, setup-node, configure-pages, upload → 4 total
 * Run steps:            detect-pm, enable-pnpm, install, build, detect-output → 5 total
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import jsYaml from 'js-yaml'

// ---------------------------------------------------------------------------
// ESM path helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkflowStep = {
  name?: string
  uses?: string
  run?: string
  with?: Record<string, unknown>
  id?: string
  if?: string
  [key: string]: unknown
}

type WorkflowJob = {
  'runs-on': string
  steps: WorkflowStep[]
  needs?: string | string[]
  environment?: { name: string; url: string }
  [key: string]: unknown
}

type Workflow = {
  name: string
  on: Record<string, unknown>
  permissions: Record<string, string>
  concurrency: { group: string; 'cancel-in-progress': boolean }
  jobs: Record<string, WorkflowJob>
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

let workflow: Workflow

beforeAll(() => {
  // Resolve relative to the repo root (3 levels up from src/test/workflows/)
  const filePath = resolve(__dirname, '../../../.github/workflows/deploy.yml')
  const raw = readFileSync(filePath, 'utf-8')
  workflow = jsYaml.load(raw) as Workflow
})

// ---------------------------------------------------------------------------
// Top-level metadata
// ---------------------------------------------------------------------------

describe('Deploy workflow – top-level metadata', () => {
  it('should parse as a valid YAML document', () => {
    expect(workflow).toBeDefined()
    expect(typeof workflow).toBe('object')
  })

  it('should be named "Deploy to GitHub Pages"', () => {
    expect(workflow.name).toBe('Deploy to GitHub Pages')
  })

  it('should define an "on" trigger block', () => {
    expect(workflow.on).toBeDefined()
  })

  it('should only trigger on "push" events', () => {
    const triggers = Object.keys(workflow.on)
    expect(triggers).toEqual(['push'])
  })

  it('should NOT trigger on pull_request events', () => {
    const triggers = Object.keys(workflow.on)
    expect(triggers).not.toContain('pull_request')
  })

  it('should restrict push trigger to the "main" branch only', () => {
    const pushConfig = (workflow.on as Record<string, unknown>)['push'] as Record<
      string,
      unknown
    >
    expect(pushConfig).toBeDefined()
    expect(pushConfig['branches']).toBeDefined()
    expect(pushConfig['branches']).toContain('main')
  })

  it('push trigger should list exactly one branch', () => {
    const pushConfig = (workflow.on as Record<string, unknown>)['push'] as Record<
      string,
      unknown
    >
    expect((pushConfig['branches'] as string[]).length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

describe('Deploy workflow – permissions', () => {
  it('should define a permissions block', () => {
    expect(workflow.permissions).toBeDefined()
    expect(typeof workflow.permissions).toBe('object')
  })

  it('should grant "read" permission for contents', () => {
    expect(workflow.permissions['contents']).toBe('read')
  })

  it('should grant "write" permission for pages', () => {
    expect(workflow.permissions['pages']).toBe('write')
  })

  it('should grant "write" permission for id-token', () => {
    expect(workflow.permissions['id-token']).toBe('write')
  })

  it('should define exactly 3 permissions', () => {
    expect(Object.keys(workflow.permissions).length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

describe('Deploy workflow – concurrency', () => {
  it('should define a concurrency block', () => {
    expect(workflow.concurrency).toBeDefined()
  })

  it('concurrency group should be "pages"', () => {
    expect(workflow.concurrency.group).toBe('pages')
  })

  it('cancel-in-progress should be false (protecting in-flight deployments)', () => {
    expect(workflow.concurrency['cancel-in-progress']).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Jobs – structure
// ---------------------------------------------------------------------------

describe('Deploy workflow – jobs', () => {
  it('should define jobs', () => {
    expect(workflow.jobs).toBeDefined()
    expect(typeof workflow.jobs).toBe('object')
  })

  it('should define exactly 2 jobs', () => {
    expect(Object.keys(workflow.jobs).length).toBe(2)
  })

  it('should define a job named "build"', () => {
    expect(workflow.jobs['build']).toBeDefined()
  })

  it('should define a job named "deploy"', () => {
    expect(workflow.jobs['deploy']).toBeDefined()
  })

  it('"build" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['build']['runs-on']).toBe('ubuntu-latest')
  })

  it('"deploy" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['deploy']['runs-on']).toBe('ubuntu-latest')
  })

  it('"build" job should NOT have a "needs" dependency', () => {
    expect(workflow.jobs['build'].needs).toBeUndefined()
  })

  it('"deploy" job should have a "needs: build" dependency', () => {
    expect(workflow.jobs['deploy'].needs).toBe('build')
  })
})

// ---------------------------------------------------------------------------
// "deploy" job – environment block
// ---------------------------------------------------------------------------

describe('Deploy workflow – deploy job environment', () => {
  it('"deploy" job should specify a deployment environment', () => {
    expect(workflow.jobs['deploy'].environment).toBeDefined()
  })

  it('deployment environment name should be "github-pages"', () => {
    expect(workflow.jobs['deploy'].environment!.name).toBe('github-pages')
  })

  it('deployment environment url should reference the deployment step output', () => {
    const url = workflow.jobs['deploy'].environment!.url
    expect(url).toContain('steps.deployment.outputs.page_url')
  })

  it('"build" job should NOT have a deployment environment', () => {
    expect(workflow.jobs['build'].environment).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// "build" job – steps
// ---------------------------------------------------------------------------

describe('Deploy workflow – build job steps', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build'].steps
  })

  it('should define steps for the build job', () => {
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
  })

  // --- Step count ---
  // 9 steps: checkout, detect-pm, enable-pnpm, setup-node, install,
  //          build, configure-pages, detect-output, upload-artifact
  it('should have exactly 9 steps', () => {
    expect(steps.length).toBe(9)
  })

  // --- Checkout ---
  it('should include a checkout step using actions/checkout@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('checkout step should be named "Checkout"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step!.name).toBe('Checkout')
  })

  // --- Detect package manager ---
  it('should include a "Detect package manager" step', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step).toBeDefined()
  })

  it('"Detect package manager" step should have id "detect-pm"', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.id).toBe('detect-pm')
  })

  it('"Detect package manager" step should be a run step', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toBeDefined()
  })

  it('"Detect package manager" step should detect yarn', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('yarn.lock')
  })

  it('"Detect package manager" step should detect pnpm', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('pnpm-lock.yaml')
  })

  it('"Detect package manager" step should fall back to npm', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('npm ci')
  })

  it('"Detect package manager" step should output "manager"', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('manager=')
  })

  it('"Detect package manager" step should output "install"', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('install=')
  })

  it('"Detect package manager" step should output "build"', () => {
    const step = steps.find((s) => s.name === 'Detect package manager')
    expect(step!.run).toContain('build=')
  })

  // --- Enable pnpm via corepack ---
  it('should include an "Enable pnpm via corepack" step', () => {
    const step = steps.find((s) => s.name === 'Enable pnpm via corepack')
    expect(step).toBeDefined()
  })

  it('"Enable pnpm via corepack" step should be conditional on pnpm being selected', () => {
    const step = steps.find((s) => s.name === 'Enable pnpm via corepack')
    expect(step!.if).toBeDefined()
    expect(step!.if).toContain('detect-pm')
    expect(step!.if).toContain('pnpm')
  })

  it('"Enable pnpm via corepack" step should run corepack enable', () => {
    const step = steps.find((s) => s.name === 'Enable pnpm via corepack')
    expect(step!.run).toContain('corepack enable')
  })

  // --- Setup Node ---
  it('should include a "Setup Node" step using actions/setup-node@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('"Setup Node" step should configure node-version to "20"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.with).toBeDefined()
    expect(String(step!.with!['node-version'])).toBe('20')
  })

  it('"Setup Node" step should use the detected package manager for caching', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    const cache = step!.with!['cache'] as string
    expect(cache).toContain('detect-pm')
    expect(cache).toContain('manager')
  })

  // --- Install dependencies ---
  it('should include an "Install dependencies" step', () => {
    const step = steps.find((s) => s.name === 'Install dependencies')
    expect(step).toBeDefined()
  })

  it('"Install dependencies" step should use the detected install command', () => {
    const step = steps.find((s) => s.name === 'Install dependencies')
    expect(step!.run).toContain('detect-pm')
    expect(step!.run).toContain('install')
  })

  // --- Build ---
  it('should include a "Build" step', () => {
    const step = steps.find((s) => s.name === 'Build')
    expect(step).toBeDefined()
  })

  it('"Build" step should use the detected build command', () => {
    const step = steps.find((s) => s.name === 'Build')
    expect(step!.run).toContain('detect-pm')
    expect(step!.run).toContain('build')
  })

  // --- Configure Pages ---
  it('should include a "Configure Pages" step using actions/configure-pages@v5', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/configure-pages@v5')
  })

  it('"Configure Pages" step should be named "Configure Pages"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.name).toBe('Configure Pages')
  })

  // --- Determine build output directory ---
  it('should include a "Determine build output directory" step', () => {
    const step = steps.find((s) => s.name === 'Determine build output directory')
    expect(step).toBeDefined()
  })

  it('"Determine build output directory" step should have id "detect-output"', () => {
    const step = steps.find((s) => s.name === 'Determine build output directory')
    expect(step!.id).toBe('detect-output')
  })

  it('"Determine build output directory" step should check for "dist" directory', () => {
    const step = steps.find((s) => s.name === 'Determine build output directory')
    expect(step!.run).toContain('dist')
  })

  it('"Determine build output directory" step should check for "build" directory', () => {
    const step = steps.find((s) => s.name === 'Determine build output directory')
    expect(step!.run).toContain('build')
  })

  it('"Determine build output directory" step should exit 1 if neither dir found', () => {
    const step = steps.find((s) => s.name === 'Determine build output directory')
    expect(step!.run).toContain('exit 1')
  })

  // --- Upload Pages artifact ---
  it('should include an "Upload Pages artifact" step using actions/upload-pages-artifact@v3', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('"Upload Pages artifact" step should be named "Upload Pages artifact"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.name).toBe('Upload Pages artifact')
  })

  it('"Upload Pages artifact" step should use the detected output path', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.with).toBeDefined()
    const path = step!.with!['path'] as string
    expect(path).toContain('detect-output')
    expect(path).toContain('path')
  })
})

// ---------------------------------------------------------------------------
// "deploy" job – steps
// ---------------------------------------------------------------------------

describe('Deploy workflow – deploy job steps', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['deploy'].steps
  })

  it('should define steps for the deploy job', () => {
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
  })

  it('should have exactly 1 step', () => {
    expect(steps.length).toBe(1)
  })

  it('should include a deploy-pages step using actions/deploy-pages@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/deploy-pages@v4')
  })

  it('deploy-pages step should be named "Deploy to GitHub Pages"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(step!.name).toBe('Deploy to GitHub Pages')
  })

  it('deploy-pages step should have id "deployment"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(step!.id).toBe('deployment')
  })
})

// ---------------------------------------------------------------------------
// Build job – step ordering
// ---------------------------------------------------------------------------

describe('Deploy workflow – build job step ordering', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build'].steps
  })

  it('steps should be ordered: checkout → detect-pm → [pnpm] → node → install → build → configure-pages → detect-output → upload', () => {
    const idx = (matcher: (s: WorkflowStep) => boolean) => steps.findIndex(matcher)

    const checkoutIdx = idx((s) => s.uses?.startsWith('actions/checkout') ?? false)
    const detectPmIdx = idx((s) => s.name === 'Detect package manager')
    const nodeIdx = idx((s) => s.uses?.startsWith('actions/setup-node') ?? false)
    const installIdx = idx((s) => s.name === 'Install dependencies')
    const buildIdx = idx((s) => s.name === 'Build')
    const configurePagesIdx = idx(
      (s) => s.uses?.startsWith('actions/configure-pages') ?? false,
    )
    const detectOutputIdx = idx((s) => s.name === 'Determine build output directory')
    const uploadIdx = idx(
      (s) => s.uses?.startsWith('actions/upload-pages-artifact') ?? false,
    )

    // All steps must exist
    expect(checkoutIdx).toBeGreaterThanOrEqual(0)
    expect(detectPmIdx).toBeGreaterThanOrEqual(0)
    expect(nodeIdx).toBeGreaterThanOrEqual(0)
    expect(installIdx).toBeGreaterThanOrEqual(0)
    expect(buildIdx).toBeGreaterThanOrEqual(0)
    expect(configurePagesIdx).toBeGreaterThanOrEqual(0)
    expect(detectOutputIdx).toBeGreaterThanOrEqual(0)
    expect(uploadIdx).toBeGreaterThanOrEqual(0)

    // Ordering assertions
    expect(checkoutIdx).toBeLessThan(detectPmIdx)
    expect(detectPmIdx).toBeLessThan(nodeIdx)
    expect(nodeIdx).toBeLessThan(installIdx)
    expect(installIdx).toBeLessThan(buildIdx)
    expect(buildIdx).toBeLessThan(configurePagesIdx)
    expect(configurePagesIdx).toBeLessThan(detectOutputIdx)
    expect(detectOutputIdx).toBeLessThan(uploadIdx)
  })

  it('checkout should be the very first step (index 0)', () => {
    const checkoutIdx = steps.findIndex((s) => s.uses?.startsWith('actions/checkout'))
    expect(checkoutIdx).toBe(0)
  })

  it('upload-pages-artifact should be the very last step of the build job', () => {
    const uploadIdx = steps.findIndex((s) =>
      s.uses?.startsWith('actions/upload-pages-artifact'),
    )
    expect(uploadIdx).toBe(steps.length - 1)
  })
})

// ---------------------------------------------------------------------------
// Build job – structural invariants
// ---------------------------------------------------------------------------

describe('Deploy workflow – build job step structural invariants', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build'].steps
  })

  it('every step should have either a "uses" or a "run" property', () => {
    for (const step of steps) {
      expect(step.uses !== undefined || step.run !== undefined).toBe(true)
    }
  })

  it('every step should have a non-empty "name" property', () => {
    for (const step of steps) {
      expect(step.name).toBeDefined()
      expect(typeof step.name).toBe('string')
      expect(step.name!.length).toBeGreaterThan(0)
    }
  })

  it('no step should declare both "uses" and "run" simultaneously', () => {
    for (const step of steps) {
      const hasUses = step.uses !== undefined
      const hasRun = step.run !== undefined
      expect(hasUses && hasRun).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// Deploy job – structural invariants
// ---------------------------------------------------------------------------

describe('Deploy workflow – deploy job step structural invariants', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['deploy'].steps
  })

  it('every step should have either a "uses" or a "run" property', () => {
    for (const step of steps) {
      expect(step.uses !== undefined || step.run !== undefined).toBe(true)
    }
  })

  it('every step should have a non-empty "name" property', () => {
    for (const step of steps) {
      expect(step.name).toBeDefined()
      expect(typeof step.name).toBe('string')
      expect(step.name!.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Action version pinning
// ---------------------------------------------------------------------------

describe('Deploy workflow – action version pinning', () => {
  it('all build-job actions should be pinned to a major version tag (@vN)', () => {
    const steps = workflow.jobs['build'].steps
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBeGreaterThan(0)
    for (const step of actionSteps) {
      expect(step.uses).toMatch(/@v\d/)
    }
  })

  it('all deploy-job actions should be pinned to a major version tag (@vN)', () => {
    const steps = workflow.jobs['deploy'].steps
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBeGreaterThan(0)
    for (const step of actionSteps) {
      expect(step.uses).toMatch(/@v\d/)
    }
  })

  it('actions/checkout should be pinned to @v4', () => {
    const steps = workflow.jobs['build'].steps
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('actions/setup-node should be pinned to @v4', () => {
    const steps = workflow.jobs['build'].steps
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('actions/configure-pages should be pinned to @v5', () => {
    const steps = workflow.jobs['build'].steps
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.uses).toBe('actions/configure-pages@v5')
  })

  it('actions/upload-pages-artifact should be pinned to @v3', () => {
    const steps = workflow.jobs['build'].steps
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('actions/deploy-pages should be pinned to @v4', () => {
    const steps = workflow.jobs['deploy'].steps
    const step = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(step!.uses).toBe('actions/deploy-pages@v4')
  })

  // Build job action steps: checkout, setup-node, configure-pages, upload-pages-artifact = 4
  it('build job should have exactly 4 action steps (uses:)', () => {
    const steps = workflow.jobs['build'].steps
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBe(4)
  })

  // Build job run steps: detect-pm, enable-pnpm, install, build, detect-output = 5
  it('build job should have exactly 5 run steps (run:)', () => {
    const steps = workflow.jobs['build'].steps
    const runSteps = steps.filter((s) => s.run)
    expect(runSteps.length).toBe(5)
  })

  it('deploy job should have exactly 1 action step (uses:)', () => {
    const steps = workflow.jobs['deploy'].steps
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Cross-cutting concerns
// ---------------------------------------------------------------------------

describe('Deploy workflow – cross-cutting concerns', () => {
  it('the workflow should NOT have a permissions block at the job level', () => {
    // Permissions are declared at the workflow level, not per-job
    for (const job of Object.values(workflow.jobs)) {
      expect((job as Record<string, unknown>)['permissions']).toBeUndefined()
    }
  })

  it('all jobs should run on ubuntu-latest', () => {
    for (const job of Object.values(workflow.jobs)) {
      expect(job['runs-on']).toBe('ubuntu-latest')
    }
  })

  it('all setup-node steps should use Node.js version "20"', () => {
    const buildSteps = workflow.jobs['build'].steps
    const nodeSteps = buildSteps.filter((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeSteps.length).toBeGreaterThan(0)
    for (const step of nodeSteps) {
      expect(String(step.with!['node-version'])).toBe('20')
    }
  })

  it('the deploy step should capture its output via id "deployment"', () => {
    const deploySteps = workflow.jobs['deploy'].steps
    const deployStep = deploySteps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(deployStep!.id).toBe('deployment')
  })

  it('the environment url should reference the "deployment" step page_url output', () => {
    const env = workflow.jobs['deploy'].environment!
    expect(env.url).toContain('deployment')
    expect(env.url).toContain('page_url')
  })

  it('only the "deploy" job should have an environment block', () => {
    expect(workflow.jobs['deploy'].environment).toBeDefined()
    expect(workflow.jobs['build'].environment).toBeUndefined()
  })

  it('"deploy" job must declare "needs: build" so it runs after the build', () => {
    expect(workflow.jobs['deploy'].needs).toBe('build')
  })
})
