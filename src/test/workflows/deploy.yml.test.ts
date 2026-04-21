/**
 * Tests for .github/workflows/deploy.yml
 *
 * Validates the structure, triggers, permissions, concurrency, jobs, and
 * steps of the Deploy to GitHub Pages workflow file.
 *
 * Source file: .github/workflows/deploy.yml
 * Actual content verified against the live YAML before writing assertions.
 *
 * The deploy workflow uses a SINGLE combined job called "build-and-deploy"
 * that handles checkout, build, and GitHub Pages deployment in sequence.
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

  it('should define exactly 1 job', () => {
    expect(Object.keys(workflow.jobs).length).toBe(1)
  })

  it('should define a job named "build-and-deploy"', () => {
    expect(workflow.jobs['build-and-deploy']).toBeDefined()
  })

  it('"build-and-deploy" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['build-and-deploy']['runs-on']).toBe('ubuntu-latest')
  })

  it('"build-and-deploy" job should NOT have a "needs" dependency', () => {
    expect(workflow.jobs['build-and-deploy'].needs).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Jobs – environment block
// ---------------------------------------------------------------------------

describe('Deploy workflow – job environment', () => {
  it('"build-and-deploy" job should specify a deployment environment', () => {
    expect(workflow.jobs['build-and-deploy'].environment).toBeDefined()
  })

  it('deployment environment name should be "github-pages"', () => {
    expect(workflow.jobs['build-and-deploy'].environment!.name).toBe('github-pages')
  })

  it('deployment environment url should reference the deployment step output', () => {
    const url = workflow.jobs['build-and-deploy'].environment!.url
    expect(url).toContain('steps.deployment.outputs.page_url')
  })
})

// ---------------------------------------------------------------------------
// Steps – individual assertions
// ---------------------------------------------------------------------------

describe('Deploy workflow – build-and-deploy job steps', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build-and-deploy'].steps
  })

  it('should define steps for the build-and-deploy job', () => {
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
  })

  // --- Step count ---
  it('should have exactly 7 steps', () => {
    expect(steps.length).toBe(7)
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

  // --- Node.js setup ---
  it('should include a Node.js setup step using actions/setup-node@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('Node.js setup step should be named "Setup Node"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.name).toBe('Setup Node')
  })

  it('Node.js setup step should configure node-version to "20"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.with).toBeDefined()
    expect(String(step!.with!['node-version'])).toBe('20')
  })

  it('Node.js setup step should enable npm caching', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.with!['cache']).toBe('npm')
  })

  // --- Install dependencies ---
  it('should include an "Install Dependencies" step that runs npm ci', () => {
    const step = steps.find(
      (s) => s.name === 'Install Dependencies' || s.run?.includes('npm ci'),
    )
    expect(step).toBeDefined()
    expect(step!.run).toContain('npm ci')
    expect(step!.name).toBe('Install Dependencies')
  })

  // --- Build ---
  it('should include a "Build" step that runs npm run build', () => {
    const step = steps.find((s) => s.name === 'Build' || s.run?.includes('npm run build'))
    expect(step).toBeDefined()
    expect(step!.run).toContain('npm run build')
  })

  it('"Build" step should have the correct name', () => {
    const step = steps.find((s) => s.run?.includes('npm run build'))
    expect(step!.name).toBe('Build')
  })

  // --- Configure Pages ---
  it('should include a "Configure Pages" step using actions/configure-pages', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step).toBeDefined()
  })

  it('"Configure Pages" step should use actions/configure-pages@v5', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.uses).toBe('actions/configure-pages@v5')
  })

  it('"Configure Pages" step should have the correct name', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.name).toBe('Configure Pages')
  })

  // --- Upload artifact ---
  it('should include an "Upload Artifact" step using actions/upload-pages-artifact@v3', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('"Upload Artifact" step should have the correct name', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.name).toBe('Upload Artifact')
  })

  it('"Upload Artifact" step should upload from the "./dist" directory', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.with).toBeDefined()
    expect(step!.with!['path']).toBe('./dist')
  })

  // --- Deploy to GitHub Pages ---
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
// Steps – ordering
// ---------------------------------------------------------------------------

describe('Deploy workflow – step ordering', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build-and-deploy'].steps
  })

  it('steps should be ordered: checkout → node → install → build → configure-pages → upload → deploy', () => {
    const idx = (matcher: (s: WorkflowStep) => boolean) => steps.findIndex(matcher)

    const checkoutIdx = idx((s) => s.uses?.startsWith('actions/checkout') ?? false)
    const nodeIdx = idx((s) => s.uses?.startsWith('actions/setup-node') ?? false)
    const installIdx = idx((s) => s.run?.includes('npm ci') ?? false)
    const buildIdx = idx((s) => s.run?.includes('npm run build') ?? false)
    const configurePagesIdx = idx(
      (s) => s.uses?.startsWith('actions/configure-pages') ?? false,
    )
    const uploadIdx = idx(
      (s) => s.uses?.startsWith('actions/upload-pages-artifact') ?? false,
    )
    const deployIdx = idx((s) => s.uses?.startsWith('actions/deploy-pages') ?? false)

    // All steps must exist
    expect(checkoutIdx).toBeGreaterThanOrEqual(0)
    expect(nodeIdx).toBeGreaterThanOrEqual(0)
    expect(installIdx).toBeGreaterThanOrEqual(0)
    expect(buildIdx).toBeGreaterThanOrEqual(0)
    expect(configurePagesIdx).toBeGreaterThanOrEqual(0)
    expect(uploadIdx).toBeGreaterThanOrEqual(0)
    expect(deployIdx).toBeGreaterThanOrEqual(0)

    // Ordering assertions
    expect(checkoutIdx).toBeLessThan(nodeIdx)
    expect(nodeIdx).toBeLessThan(installIdx)
    expect(installIdx).toBeLessThan(buildIdx)
    expect(buildIdx).toBeLessThan(configurePagesIdx)
    expect(configurePagesIdx).toBeLessThan(uploadIdx)
    expect(uploadIdx).toBeLessThan(deployIdx)
  })
})

// ---------------------------------------------------------------------------
// Steps – structural invariants
// ---------------------------------------------------------------------------

describe('Deploy workflow – step structural invariants', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build-and-deploy'].steps
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
// Action version pinning
// ---------------------------------------------------------------------------

describe('Deploy workflow – action version pinning', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['build-and-deploy'].steps
  })

  it('all actions should be pinned to a major version tag (@vN)', () => {
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBeGreaterThan(0)
    for (const step of actionSteps) {
      expect(step.uses).toMatch(/@v\d/)
    }
  })

  it('actions/checkout should be pinned to @v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('actions/setup-node should be pinned to @v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('actions/configure-pages should be pinned to @v5', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.uses).toBe('actions/configure-pages@v5')
  })

  it('actions/upload-pages-artifact should be pinned to @v3', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('actions/deploy-pages should be pinned to @v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(step!.uses).toBe('actions/deploy-pages@v4')
  })

  it('should have exactly 5 action steps (uses:)', () => {
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBe(5)
  })

  it('should have exactly 2 run steps (run:)', () => {
    const runSteps = steps.filter((s) => s.run)
    expect(runSteps.length).toBe(2)
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

  it('the build-and-deploy job runner should be ubuntu-latest', () => {
    expect(workflow.jobs['build-and-deploy']['runs-on']).toBe('ubuntu-latest')
  })

  it('all Node.js setup steps should use version "20"', () => {
    const steps = workflow.jobs['build-and-deploy'].steps
    const nodeSteps = steps.filter((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeSteps.length).toBeGreaterThan(0)
    for (const step of nodeSteps) {
      expect(String(step.with!['node-version'])).toBe('20')
    }
  })

  it('the deploy step should capture its output via id "deployment"', () => {
    const steps = workflow.jobs['build-and-deploy'].steps
    const deployStep = steps.find((s) => s.uses?.startsWith('actions/deploy-pages'))
    expect(deployStep!.id).toBe('deployment')
  })

  it('the environment url should use the deployment step output', () => {
    const env = workflow.jobs['build-and-deploy'].environment!
    expect(env.url).toContain('deployment')
    expect(env.url).toContain('page_url')
  })
})
