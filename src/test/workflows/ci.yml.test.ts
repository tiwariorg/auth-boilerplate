/**
 * Tests for .github/workflows/ci.yml
 *
 * Validates the structure, triggers, jobs, steps, and configuration of the
 * CI workflow file without executing it against GitHub Actions infrastructure.
 *
 * Source file: .github/workflows/ci.yml
 * Actual content verified against the live YAML before writing assertions.
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
// Workflow-level metadata
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

  it('push trigger should be scoped to the "main" branch', () => {
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

  it('pull_request trigger should be scoped to the "main" branch', () => {
    const prConfig = (workflow.on as Record<string, unknown>)[
      'pull_request'
    ] as Record<string, unknown>
    expect(prConfig).toBeDefined()
    expect(prConfig['branches']).toBeDefined()
    expect(prConfig['branches']).toContain('main')
  })

  it('pull_request trigger should list exactly one branch', () => {
    const prConfig = (workflow.on as Record<string, unknown>)[
      'pull_request'
    ] as Record<string, unknown>
    expect((prConfig['branches'] as string[]).length).toBe(1)
  })

  it('should define exactly 2 event triggers (push + pull_request)', () => {
    expect(Object.keys(workflow.on).length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Workflow-level: absence of optional blocks
// ---------------------------------------------------------------------------

describe('CI workflow – optional top-level blocks', () => {
  it('should NOT define a top-level permissions block', () => {
    expect(workflow.permissions).toBeUndefined()
  })

  it('should NOT define a top-level concurrency block', () => {
    expect(workflow.concurrency).toBeUndefined()
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

  it('should define exactly one job', () => {
    expect(Object.keys(workflow.jobs).length).toBe(1)
  })

  it('should define a job named "ci"', () => {
    expect(workflow.jobs['ci']).toBeDefined()
  })

  it('"ci" job should run on ubuntu-latest', () => {
    expect(workflow.jobs['ci']['runs-on']).toBe('ubuntu-latest')
  })

  it('"ci" job should define steps', () => {
    const { steps } = workflow.jobs['ci']
    expect(Array.isArray(steps)).toBe(true)
    expect(steps.length).toBeGreaterThan(0)
  })

  it('"ci" job should NOT declare a "needs" dependency', () => {
    expect(workflow.jobs['ci'].needs).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Steps – individual assertions
// ---------------------------------------------------------------------------

describe('CI workflow – steps', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
  })

  // --- Step count ---
  it('should have exactly 6 steps', () => {
    expect(steps.length).toBe(6)
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

  // --- Lint ---
  it('should include a "Lint" step', () => {
    const step = steps.find((s) => s.name === 'Lint')
    expect(step).toBeDefined()
  })

  it('Lint step should run "npm run lint"', () => {
    const step = steps.find((s) => s.name === 'Lint')
    expect(step!.run).toContain('npm run lint')
  })

  it('Lint step should NOT have continue-on-error set (it is not present in the YAML)', () => {
    const step = steps.find((s) => s.name === 'Lint') as Record<string, unknown>
    // The CI workflow does not declare continue-on-error on the lint step
    expect(step!['continue-on-error']).toBeUndefined()
  })

  // --- Run Tests ---
  it('should include a "Run Tests" step', () => {
    const step = steps.find((s) => s.name === 'Run Tests')
    expect(step).toBeDefined()
  })

  it('"Run Tests" step should run "npm test --if-present"', () => {
    const step = steps.find((s) => s.name === 'Run Tests')
    expect(step!.run).toBe('npm test --if-present')
  })

  it('"Run Tests" step should contain "npm test"', () => {
    const step = steps.find((s) => s.name === 'Run Tests')
    expect(step!.run).toContain('npm test')
  })

  it('"Run Tests" step should pass the --if-present flag', () => {
    const step = steps.find((s) => s.name === 'Run Tests')
    expect(step!.run).toContain('--if-present')
  })

  // --- Build ---
  it('should include a "Build" step', () => {
    const step = steps.find((s) => s.name === 'Build')
    expect(step).toBeDefined()
  })

  it('Build step should run "npm run build"', () => {
    const step = steps.find((s) => s.name === 'Build')
    expect(step!.run).toContain('npm run build')
  })
})

// ---------------------------------------------------------------------------
// Steps – ordering
// ---------------------------------------------------------------------------

describe('CI workflow – step ordering', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
  })

  it('should execute steps in order: checkout → node → install → lint → run-tests → build', () => {
    const checkoutIdx = steps.findIndex((s) => s.uses?.startsWith('actions/checkout'))
    const nodeIdx = steps.findIndex((s) => s.uses?.startsWith('actions/setup-node'))
    const installIdx = steps.findIndex((s) => s.run?.includes('npm ci'))
    const lintIdx = steps.findIndex((s) => s.name === 'Lint')
    const testIdx = steps.findIndex((s) => s.name === 'Run Tests')
    const buildIdx = steps.findIndex((s) => s.name === 'Build')

    expect(checkoutIdx).toBeGreaterThanOrEqual(0)
    expect(nodeIdx).toBeGreaterThanOrEqual(0)
    expect(installIdx).toBeGreaterThanOrEqual(0)
    expect(lintIdx).toBeGreaterThanOrEqual(0)
    expect(testIdx).toBeGreaterThanOrEqual(0)
    expect(buildIdx).toBeGreaterThanOrEqual(0)

    expect(checkoutIdx).toBeLessThan(nodeIdx)
    expect(nodeIdx).toBeLessThan(installIdx)
    expect(installIdx).toBeLessThan(lintIdx)
    expect(lintIdx).toBeLessThan(testIdx)
    expect(testIdx).toBeLessThan(buildIdx)
  })
})

// ---------------------------------------------------------------------------
// Steps – structural invariants
// ---------------------------------------------------------------------------

describe('CI workflow – step structural invariants', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
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

describe('CI workflow – action version pinning', () => {
  let steps: WorkflowStep[]

  beforeAll(() => {
    steps = workflow.jobs['ci'].steps
  })

  it('all actions should be pinned to a major version tag (@vN)', () => {
    const actionSteps = steps.filter((s) => s.uses)
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

  it('should have exactly 2 action steps (uses:)', () => {
    const actionSteps = steps.filter((s) => s.uses)
    expect(actionSteps.length).toBe(2)
  })

  it('should have exactly 4 run steps (run:)', () => {
    const runSteps = steps.filter((s) => s.run)
    expect(runSteps.length).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Node.js version consistency
// ---------------------------------------------------------------------------

describe('CI workflow – Node.js version', () => {
  it('all setup-node steps should use Node.js 20', () => {
    const steps = workflow.jobs['ci'].steps
    const nodeSteps = steps.filter((s) => s.uses?.startsWith('actions/setup-node'))
    expect(nodeSteps.length).toBeGreaterThan(0)
    for (const step of nodeSteps) {
      expect(String(step.with!['node-version'])).toBe('20')
    }
  })
})
