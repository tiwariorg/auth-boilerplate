/**
 * Tests for .github/workflows/deploy.yml
 *
 * Validates the structure, triggers, permissions, concurrency, jobs, and
 * steps of the Deploy to GitHub Pages workflow file.
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
  it('should define a "build" job', () => {
    expect(workflow.jobs['build']).toBeDefined()
  })

  it('should define a "deploy" job', () => {
    expect(workflow.jobs['deploy']).toBeDefined()
  })

  it('should define exactly 2 jobs', () => {
    expect(Object.keys(workflow.jobs).length).toBe(2)
  })

  it('"build" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['build']['runs-on']).toBe('ubuntu-latest')
  })

  it('"deploy" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['deploy']['runs-on']).toBe('ubuntu-latest')
  })

  it('"deploy" job should depend on the "build" job via "needs"', () => {
    const needs = workflow.jobs['deploy'].needs
    if (Array.isArray(needs)) {
      expect(needs).toContain('build')
    } else {
      expect(needs).toBe('build')
    }
  })

  it('"build" job should NOT have a "needs" dependency', () => {
    expect(workflow.jobs['build'].needs).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Jobs – environment (deploy)
// ---------------------------------------------------------------------------

describe('Deploy workflow – deploy job environment', () => {
  it('"deploy" job should specify a deployment environment', () => {
    expect(workflow.jobs['deploy'].environment).toBeDefined()
  })

  it('deployment environment name should be "github-pages"', () => {
    expect(workflow.jobs['deploy'].environment!.name).toBe('github-pages')
  })

  it('deployment environment url should reference the deployment output', () => {
    const url = workflow.jobs['deploy'].environment!.url
    expect(url).toContain('steps.deployment.outputs.page_url')
  })
})

// ---------------------------------------------------------------------------
// Build job – steps
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

  // Checkout
  it('should include a checkout step using actions/checkout@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('checkout step should be named "Checkout repository"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step!.name).toBe('Checkout repository')
  })

  // Node.js setup
  it('should include a Node.js setup step using actions/setup-node@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('Node.js setup step should configure node-version to "20"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(String(step!.with!['node-version'])).toBe('20')
  })

  it('Node.js setup step should enable npm caching', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.with!['cache']).toBe('npm')
  })

  it('Node.js step should be named "Set up Node.js"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.name).toBe('Set up Node.js')
  })

  // Configure Pages
  it('should include a "Configure GitHub Pages" step using actions/configure-pages@v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/configure-pages@v4')
  })

  it('configure-pages step should be named "Configure GitHub Pages"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/configure-pages'))
    expect(step!.name).toBe('Configure GitHub Pages')
  })

  // Install dependencies
  it('should include an "Install dependencies" step that runs npm ci', () => {
    const step = steps.find(
      (s) => s.name === 'Install dependencies' || s.run?.includes('npm ci'),
    )
    expect(step).toBeDefined()
    expect(step!.run).toContain('npm ci')
  })

  // Build production assets
  it('should include a "Build production assets" step that runs npm run build', () => {
    const step = steps.find(
      (s) => s.name === 'Build production assets' || s.run?.includes('npm run build'),
    )
    expect(step).toBeDefined()
    expect(step!.run).toContain('npm run build')
  })

  it('"Build production assets" step should have the correct name', () => {
    const step = steps.find((s) => s.run?.includes('npm run build'))
    expect(step!.name).toBe('Build production assets')
  })

  // Upload Pages artifact
  it('should include an upload-pages-artifact step using actions/upload-pages-artifact@v3', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step).toBeDefined()
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('upload-pages-artifact step should be named "Upload Pages artifact"', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.name).toBe('Upload Pages artifact')
  })

  it('upload-pages-artifact step should upload from the "./dist" directory', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/upload-pages-artifact'))
    expect(step!.with!['path']).toBe('./dist')
  })

  // Step count
  it('build job should have exactly 6 steps', () => {
    expect(steps.length).toBe(6)
  })

  // Step ordering
  it('steps should be ordered: checkout → node → configure-pages → install → build → upload', () => {
    const idx = (matcher: (s: WorkflowStep) => boolean) => steps.findIndex(matcher)

    const checkoutIdx = idx((s) => s.uses?.startsWith('actions/checkout') ?? false)
    const nodeIdx = idx((s) => s.uses?.startsWith('actions/setup-node') ?? false)
    const configurePagesIdx = idx(
      (s) => s.uses?.startsWith('actions/configure-pages') ?? false,
    )
    const installIdx = idx((s) => s.run?.includes('npm ci') ?? false)
    const buildIdx = idx((s) => s.run?.includes('npm run build') ?? false)
    const uploadIdx = idx(
      (s) => s.uses?.startsWith('actions/upload-pages-artifact') ?? false,
    )

    expect(checkoutIdx).toBeLessThan(nodeIdx)
    expect(nodeIdx).toBeLessThan(configurePagesIdx)
    expect(configurePagesIdx).toBeLessThan(installIdx)
    expect(installIdx).toBeLessThan(buildIdx)
    expect(buildIdx).toBeLessThan(uploadIdx)
  })

  it('every step should have either a "uses" or a "run" property', () => {
    for (const step of steps) {
      expect(step.uses !== undefined || step.run !== undefined).toBe(true)
    }
  })

  it('every step should have a "name" property', () => {
    for (const step of steps) {
      expect(step.name).toBeDefined()
      expect(typeof step.name).toBe('string')
      expect(step.name!.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Deploy job – steps
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

  it('deploy job should have exactly 1 step', () => {
    expect(steps.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Action version pinning
// ---------------------------------------------------------------------------

describe('Deploy workflow – action version pinning', () => {
  it('all actions across both jobs should be pinned to a major version tag (vN)', () => {
    const allSteps = [
      ...workflow.jobs['build'].steps,
      ...workflow.jobs['deploy'].steps,
    ].filter((s) => s.uses)

    for (const step of allSteps) {
      expect(step.uses).toMatch(/@v\d/)
    }
  })

  it('actions/checkout should be pinned to v4', () => {
    const step = workflow.jobs['build'].steps.find((s) =>
      s.uses?.startsWith('actions/checkout'),
    )
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('actions/setup-node should be pinned to v4', () => {
    const step = workflow.jobs['build'].steps.find((s) =>
      s.uses?.startsWith('actions/setup-node'),
    )
    expect(step!.uses).toBe('actions/setup-node@v4')
  })

  it('actions/configure-pages should be pinned to v4', () => {
    const step = workflow.jobs['build'].steps.find((s) =>
      s.uses?.startsWith('actions/configure-pages'),
    )
    expect(step!.uses).toBe('actions/configure-pages@v4')
  })

  it('actions/upload-pages-artifact should be pinned to v3', () => {
    const step = workflow.jobs['build'].steps.find((s) =>
      s.uses?.startsWith('actions/upload-pages-artifact'),
    )
    expect(step!.uses).toBe('actions/upload-pages-artifact@v3')
  })

  it('actions/deploy-pages should be pinned to v4', () => {
    const step = workflow.jobs['deploy'].steps.find((s) =>
      s.uses?.startsWith('actions/deploy-pages'),
    )
    expect(step!.uses).toBe('actions/deploy-pages@v4')
  })
})

// ---------------------------------------------------------------------------
// Cross-cutting concerns
// ---------------------------------------------------------------------------

describe('Deploy workflow – cross-cutting concerns', () => {
  it('both jobs should use the same runner (ubuntu-latest)', () => {
    expect(workflow.jobs['build']['runs-on']).toBe('ubuntu-latest')
    expect(workflow.jobs['deploy']['runs-on']).toBe('ubuntu-latest')
  })

  it('the workflow should NOT have a permissions block at the job level', () => {
    // Permissions are declared at the workflow level, not per-job
    for (const job of Object.values(workflow.jobs)) {
      expect((job as Record<string, unknown>)['permissions']).toBeUndefined()
    }
  })

  it('all Node.js versions across jobs should be consistently "20"', () => {
    const allSteps = [
      ...workflow.jobs['build'].steps,
      ...workflow.jobs['deploy'].steps,
    ]
    const nodeSteps = allSteps.filter((s) => s.uses?.startsWith('actions/setup-node'))
    for (const step of nodeSteps) {
      expect(String(step.with!['node-version'])).toBe('20')
    }
  })
})
