/**
 * Tests for .github/workflows/ci.yml
 *
 * Validates the structure, triggers, jobs, steps, and configuration of the
 * CI workflow file without executing it against GitHub Actions infrastructure.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import jsYaml from 'js-yaml'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  jobs: Record<string, WorkflowJob>
  permissions?: Record<string, string>
  concurrency?: { group: string; 'cancel-in-progress': boolean }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let workflow: Workflow

beforeAll(() => {
  // Resolve relative to the repo root (3 levels up from src/test/workflows/)
  const filePath = resolve(__dirname, '../../../.github/workflows/ci.yml')
  const raw = readFileSync(filePath, 'utf-8')
  workflow = jsYaml.load(raw) as Workflow
})

// ---------------------------------------------------------------------------
// Workflow-level
// ---------------------------------------------------------------------------

describe('CI workflow – top-level metadata', () => {
  it('should parse as a valid YAML document', () => {
    expect(workflow).toBeDefined()
    expect(typeof workflow).toBe('object')
  })

  it('should be named "CI"', () => {
    expect(workflow.name).toBe('CI')
  })

  it('should define an "on" trigger block', () => {
    expect(workflow.on).toBeDefined()
  })

  it('should trigger on push events', () => {
    const triggers = Object.keys(workflow.on)
    expect(triggers).toContain('push')
  })

  it('should trigger on pull_request events', () => {
    const triggers = Object.keys(workflow.on)
    expect(triggers).toContain('pull_request')
  })

  it('should trigger on push to ALL branches (no branch filter)', () => {
    // push key present but no branches restriction means all branches
    const pushConfig = (workflow.on as Record<string, unknown>)['push']
    // Either pushConfig is null/undefined (bare key) or has no "branches" property
    if (pushConfig && typeof pushConfig === 'object') {
      expect((pushConfig as Record<string, unknown>)['branches']).toBeUndefined()
    } else {
      // bare `push:` with no sub-keys → null
      expect(pushConfig == null || pushConfig === undefined).toBe(true)
    }
  })

  it('should trigger on pull_request for ALL branches (no branch filter)', () => {
    const prConfig = (workflow.on as Record<string, unknown>)['pull_request']
    if (prConfig && typeof prConfig === 'object') {
      expect((prConfig as Record<string, unknown>)['branches']).toBeUndefined()
    } else {
      expect(prConfig == null || prConfig === undefined).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

describe('CI workflow – jobs', () => {
  it('should define at least one job', () => {
    expect(workflow.jobs).toBeDefined()
    expect(Object.keys(workflow.jobs).length).toBeGreaterThanOrEqual(1)
  })

  it('should define a job named "ci"', () => {
    expect(workflow.jobs['ci']).toBeDefined()
  })

  it('"ci" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['ci']['runs-on']).toBe('ubuntu-latest')
  })

  it('"ci" job should define steps', () => {
    const steps = workflow.jobs['ci'].steps
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

describe('CI workflow – steps', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
  })

  // --- Checkout ---
  it('should include a checkout step using actions/checkout@v4', () => {
    const checkoutStep = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(checkoutStep).toBeDefined()
    expect(checkoutStep!.uses).toBe('actions/checkout@v4')
  })

  it('checkout step should be named "Checkout repository"', () => {
    const checkoutStep = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(checkoutStep!.name).toBe('Checkout repository')
  })

  // --- Node.js setup ---
  it('should include a Node.js setup step using actions/setup-node@v4', () => {
    const nodeStep = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeStep).toBeDefined()
    expect(nodeStep!.uses).toBe('actions/setup-node@v4')
  })

  it('Node.js setup step should configure node-version to "20"', () => {
    const nodeStep = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeStep!.with).toBeDefined()
    expect(String(nodeStep!.with!['node-version'])).toBe('20')
  })

  it('Node.js setup step should enable npm caching', () => {
    const nodeStep = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeStep!.with!['cache']).toBe('npm')
  })

  it('Node.js step should be named "Set up Node.js"', () => {
    const nodeStep = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeStep!.name).toBe('Set up Node.js')
  })

  // --- Install dependencies ---
  it('should include an "Install dependencies" step that runs npm ci', () => {
    const installStep = steps.find(
      (s) => s.name === 'Install dependencies' || s.run?.includes('npm ci'),
    )
    expect(installStep).toBeDefined()
    expect(installStep!.run).toContain('npm ci')
  })

  // --- Lint ---
  it('should include a Lint step', () => {
    const lintStep = steps.find((s) => s.name === 'Lint' || s.run?.includes('lint'))
    expect(lintStep).toBeDefined()
  })

  it('Lint step should run "npm run lint"', () => {
    const lintStep = steps.find((s) => s.name === 'Lint' || s.run?.includes('lint'))
    expect(lintStep!.run).toContain('npm run lint')
  })

  it('Lint step should NOT have continue-on-error enabled', () => {
    const lintStep = steps.find((s) => s.name === 'Lint' || s.run?.includes('lint'))
    // continue-on-error should be absent (defaults to false) or explicitly false
    const continueOnError = (lintStep as Record<string, unknown>)?.['continue-on-error']
    expect(continueOnError === undefined || continueOnError === false).toBe(true)
  })

  // --- Test ---
  it('should include a Test step', () => {
    const testStep = steps.find((s) => s.name === 'Test' || s.run?.includes('test'))
    expect(testStep).toBeDefined()
  })

  it('Test step should run the test:run script', () => {
    const testStep = steps.find((s) => s.name === 'Test')
    expect(testStep!.run).toContain('npm run test:run')
  })

  it('Test step should pass the --passWithNoTests flag', () => {
    const testStep = steps.find((s) => s.name === 'Test')
    expect(testStep!.run).toContain('--passWithNoTests')
  })

  // --- Build ---
  it('should include a Build step', () => {
    const buildStep = steps.find((s) => s.name === 'Build' || s.run?.includes('build'))
    expect(buildStep).toBeDefined()
  })

  it('Build step should run "npm run build"', () => {
    const buildStep = steps.find((s) => s.name === 'Build')
    expect(buildStep!.run).toContain('npm run build')
  })

  // --- Order ---
  it('should execute steps in the correct order: checkout → node → install → lint → test → build', () => {
    const checkoutIdx = steps.findIndex((s) => s.uses?.startsWith('actions/checkout'))
    const nodeIdx = steps.findIndex((s) => s.uses?.startsWith('actions/setup-node'))
    const installIdx = steps.findIndex((s) => s.run?.includes('npm ci'))
    const lintIdx = steps.findIndex(
      (s) => s.name === 'Lint' || s.run?.toLowerCase().includes('lint'),
    )
    const testIdx = steps.findIndex((s) => s.name === 'Test')
    const buildIdx = steps.findIndex((s) => s.name === 'Build')

    expect(checkoutIdx).toBeLessThan(nodeIdx)
    expect(nodeIdx).toBeLessThan(installIdx)
    expect(installIdx).toBeLessThan(lintIdx)
    expect(lintIdx).toBeLessThan(testIdx)
    expect(testIdx).toBeLessThan(buildIdx)
  })

  it('should have exactly 6 steps', () => {
    expect(steps.length).toBe(6)
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
// Action version pinning
// ---------------------------------------------------------------------------

describe('CI workflow – action version pinning', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
  })

  const getActionSteps = () => steps.filter((s) => s.uses)

  it('all actions should be pinned to a major version tag (vN)', () => {
    for (const step of getActionSteps()) {
      // e.g. "actions/checkout@v4" — must include @v followed by a digit
      expect(step.uses).toMatch(/@v\d/)
    }
  })

  it('actions/checkout should be pinned to v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/checkout'))
    expect(step!.uses).toBe('actions/checkout@v4')
  })

  it('actions/setup-node should be pinned to v4', () => {
    const step = steps.find((s) => s.uses?.startsWith('actions/setup-node'))
    expect(step!.uses).toBe('actions/setup-node@v4')
  })
})
