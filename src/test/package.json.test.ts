/**
 * Tests for package.json
 *
 * Validates the project manifest: required scripts, dependency presence,
 * module type, and key constraints documented in the KAN-4 deploy checklist.
 *
 * Source file: package.json
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
// Types
// ---------------------------------------------------------------------------

type PackageJson = {
  name: string
  version: string
  private: boolean
  type: string
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

let pkg: PackageJson

beforeAll(() => {
  // Two levels up from src/test/ → repo root
  const filePath = resolve(__dirname, '../../package.json')
  const raw = readFileSync(filePath, 'utf-8')
  pkg = JSON.parse(raw) as PackageJson
})

// ---------------------------------------------------------------------------
// Top-level fields
// ---------------------------------------------------------------------------

describe('package.json – top-level fields', () => {
  it('should parse as a valid JSON object', () => {
    expect(pkg).toBeDefined()
    expect(typeof pkg).toBe('object')
  })

  it('should have a "name" field', () => {
    expect(pkg.name).toBeDefined()
    expect(typeof pkg.name).toBe('string')
    expect(pkg.name.length).toBeGreaterThan(0)
  })

  it('should be a private package (private: true)', () => {
    expect(pkg.private).toBe(true)
  })

  it('should have a "version" field', () => {
    expect(pkg.version).toBeDefined()
    expect(typeof pkg.version).toBe('string')
  })

  it('should declare "type": "module" for ESM', () => {
    expect(pkg.type).toBe('module')
  })
})

// ---------------------------------------------------------------------------
// Scripts – presence
// ---------------------------------------------------------------------------

describe('package.json – scripts', () => {
  it('should define a "scripts" block', () => {
    expect(pkg.scripts).toBeDefined()
    expect(typeof pkg.scripts).toBe('object')
  })

  it('should define a "dev" script', () => {
    expect(pkg.scripts['dev']).toBeDefined()
    expect(typeof pkg.scripts['dev']).toBe('string')
  })

  it('should define a "build" script', () => {
    expect(pkg.scripts['build']).toBeDefined()
    expect(typeof pkg.scripts['build']).toBe('string')
  })

  it('should define a "lint" script', () => {
    expect(pkg.scripts['lint']).toBeDefined()
    expect(typeof pkg.scripts['lint']).toBe('string')
  })

  it('should define a "preview" script', () => {
    expect(pkg.scripts['preview']).toBeDefined()
    expect(typeof pkg.scripts['preview']).toBe('string')
  })

  it('should define a "test" script', () => {
    expect(pkg.scripts['test']).toBeDefined()
    expect(typeof pkg.scripts['test']).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Scripts – content: KAN-4 checklist requirements
// ---------------------------------------------------------------------------

describe('package.json – build script (KAN-4 checklist #8 & #12)', () => {
  it('"build" script should invoke vite build', () => {
    expect(pkg.scripts['build']).toContain('vite build')
  })

  it('"build" script should be exactly "vite build" with no extras', () => {
    expect(pkg.scripts['build']).toBe('vite build')
  })

  it('"build" script should NOT include lint (must be lint-free per KAN-4)', () => {
    expect(pkg.scripts['build']).not.toContain('lint')
  })

  it('"build" script should NOT chain npm run lint via &&', () => {
    expect(pkg.scripts['build']).not.toContain('&&')
  })

  it('"build" script should NOT use npm install (must use vite directly)', () => {
    expect(pkg.scripts['build']).not.toContain('npm install')
  })
})

describe('package.json – dev script', () => {
  it('"dev" script should invoke vite', () => {
    expect(pkg.scripts['dev']).toContain('vite')
  })
})

describe('package.json – lint script', () => {
  it('"lint" script should invoke eslint', () => {
    expect(pkg.scripts['lint']).toContain('eslint')
  })

  it('"lint" script should target the current directory', () => {
    expect(pkg.scripts['lint']).toContain('.')
  })
})

describe('package.json – preview script', () => {
  it('"preview" script should invoke vite preview', () => {
    expect(pkg.scripts['preview']).toContain('vite preview')
  })
})

describe('package.json – test script', () => {
  it('"test" script should invoke vitest', () => {
    expect(pkg.scripts['test']).toContain('vitest')
  })
})

// ---------------------------------------------------------------------------
// Dependencies – runtime
// ---------------------------------------------------------------------------

describe('package.json – dependencies', () => {
  it('should define a "dependencies" block', () => {
    expect(pkg.dependencies).toBeDefined()
    expect(typeof pkg.dependencies).toBe('object')
  })

  it('should include react as a dependency', () => {
    expect(pkg.dependencies['react']).toBeDefined()
  })

  it('should include react-dom as a dependency', () => {
    expect(pkg.dependencies['react-dom']).toBeDefined()
  })

  it('react version should be in the ^18 range', () => {
    expect(pkg.dependencies['react']).toMatch(/\^18/)
  })

  it('react-dom version should be in the ^18 range', () => {
    expect(pkg.dependencies['react-dom']).toMatch(/\^18/)
  })
})

// ---------------------------------------------------------------------------
// DevDependencies – toolchain
// ---------------------------------------------------------------------------

describe('package.json – devDependencies', () => {
  it('should define a "devDependencies" block', () => {
    expect(pkg.devDependencies).toBeDefined()
    expect(typeof pkg.devDependencies).toBe('object')
  })

  it('should include vite as a devDependency', () => {
    expect(pkg.devDependencies['vite']).toBeDefined()
  })

  it('should include vitest as a devDependency', () => {
    expect(pkg.devDependencies['vitest']).toBeDefined()
  })

  it('should include @vitejs/plugin-react as a devDependency', () => {
    expect(pkg.devDependencies['@vitejs/plugin-react']).toBeDefined()
  })

  it('should include eslint as a devDependency', () => {
    expect(pkg.devDependencies['eslint']).toBeDefined()
  })

  it('should include typescript as a devDependency', () => {
    expect(pkg.devDependencies['typescript']).toBeDefined()
  })

  it('should include @testing-library/react as a devDependency', () => {
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined()
  })

  it('should include @testing-library/jest-dom as a devDependency', () => {
    expect(pkg.devDependencies['@testing-library/jest-dom']).toBeDefined()
  })

  it('should include jsdom as a devDependency (for vitest environment)', () => {
    expect(pkg.devDependencies['jsdom']).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Separation of concerns: lint NOT in build pipeline
// ---------------------------------------------------------------------------

describe('package.json – lint vs build separation (KAN-4 deploy independence)', () => {
  it('"build" script must not reference lint to keep deploy independent of lint failures', () => {
    expect(pkg.scripts['build']).not.toContain('lint')
  })

  it('"lint" script should exist independently so CI can run it separately', () => {
    expect(pkg.scripts['lint']).toBeDefined()
    expect(pkg.scripts['lint'].length).toBeGreaterThan(0)
  })

  it('"build" and "lint" should be separate, independent scripts', () => {
    // Build must be purely a build command
    expect(pkg.scripts['build']).not.toBe(pkg.scripts['lint'])
    // Each must stand alone
    expect(pkg.scripts['build']).not.toContain('npm run lint')
    expect(pkg.scripts['lint']).not.toContain('npm run build')
  })
})

// ---------------------------------------------------------------------------
// No unexpected fields
// ---------------------------------------------------------------------------

describe('package.json – structural sanity', () => {
  it('should not have a "main" field (ESM module project uses "type": "module")', () => {
    // Vite projects typically omit main; they use index.html as the entry
    expect(pkg['main']).toBeUndefined()
  })

  it('all scripts values should be non-empty strings', () => {
    for (const [key, value] of Object.entries(pkg.scripts)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0, `script "${key}" should not be empty`)
    }
  })

  it('all dependency version values should be non-empty strings', () => {
    for (const [pkg_name, version] of Object.entries(pkg.dependencies)) {
      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(
        0,
        `dependency "${pkg_name}" should have a version`,
      )
    }
  })

  it('all devDependency version values should be non-empty strings', () => {
    for (const [pkg_name, version] of Object.entries(pkg.devDependencies)) {
      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(
        0,
        `devDependency "${pkg_name}" should have a version`,
      )
    }
  })
})
