/**
 * Tests for vite.config.ts
 *
 * Validates the Vite configuration used for the GitHub Pages deployment:
 * - The `base` path is correctly set to the repository sub-path
 * - The React plugin is configured
 * - The Vitest test environment settings are present
 *
 * Source file: vite.config.ts
 *
 * Strategy: We read and parse the raw source file text rather than importing
 * the config module (which would re-execute Vite's defineConfig at test time
 * and require all Vite internals). This keeps tests fast and deterministic.
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

let source: string

beforeAll(() => {
  // One level up from src/test/ → src/ → repo root
  const filePath = resolve(__dirname, '../../vite.config.ts')
  source = readFileSync(filePath, 'utf-8')
})

// ---------------------------------------------------------------------------
// File structure
// ---------------------------------------------------------------------------

describe('vite.config.ts – file structure', () => {
  it('should exist and be readable as a non-empty string', () => {
    expect(typeof source).toBe('string')
    expect(source.length).toBeGreaterThan(0)
  })

  it('should import defineConfig from "vite"', () => {
    expect(source).toContain("from 'vite'")
    expect(source).toContain('defineConfig')
  })

  it('should import the react plugin from "@vitejs/plugin-react"', () => {
    expect(source).toContain('@vitejs/plugin-react')
  })

  it('should use defineConfig as a wrapper', () => {
    expect(source).toContain('defineConfig(')
  })

  it('should have a default export', () => {
    expect(source).toContain('export default')
  })

  it('should reference the vitest triple-slash directive', () => {
    // The /// <reference types="vitest" /> comment is required to give
    // TypeScript knowledge of the test config types in the same file.
    expect(source).toContain('/// <reference types="vitest" />')
  })
})

// ---------------------------------------------------------------------------
// Base path (KAN-4 checklist #13)
// ---------------------------------------------------------------------------

describe('vite.config.ts – base path (GitHub Pages deployment)', () => {
  it('should define a "base" property', () => {
    expect(source).toContain('base:')
  })

  it('base should be set to "/auth-boilerplate/"', () => {
    expect(source).toContain("base: '/auth-boilerplate/'")
  })

  it('base path should start and end with a forward slash', () => {
    // Extract the base value from source
    const match = source.match(/base:\s*['"]([^'"]+)['"]/)
    expect(match).not.toBeNull()
    const basePath = match![1]
    expect(basePath.startsWith('/')).toBe(true)
    expect(basePath.endsWith('/')).toBe(true)
  })

  it('base path should not be the root "/" (must be sub-path for GitHub Pages)', () => {
    const match = source.match(/base:\s*['"]([^'"]+)['"]/)
    expect(match).not.toBeNull()
    const basePath = match![1]
    expect(basePath).not.toBe('/')
  })

  it('base path should match the repository name "auth-boilerplate"', () => {
    expect(source).toContain('auth-boilerplate')
  })
})

// ---------------------------------------------------------------------------
// React plugin
// ---------------------------------------------------------------------------

describe('vite.config.ts – React plugin', () => {
  it('should include react() in the plugins array', () => {
    expect(source).toContain('plugins:')
    expect(source).toContain('react()')
  })

  it('should import react as the default export from @vitejs/plugin-react', () => {
    // e.g. import react from '@vitejs/plugin-react'
    expect(source).toMatch(/import\s+react\s+from\s+['"]@vitejs\/plugin-react['"]/)
  })
})

// ---------------------------------------------------------------------------
// Vitest configuration block
// ---------------------------------------------------------------------------

describe('vite.config.ts – vitest test configuration', () => {
  it('should include a "test" block inside defineConfig', () => {
    expect(source).toContain('test:')
  })

  it('should set environment to "jsdom"', () => {
    expect(source).toContain("environment: 'jsdom'")
  })

  it('should enable globals', () => {
    expect(source).toContain('globals: true')
  })

  it('should specify setupFiles', () => {
    expect(source).toContain('setupFiles:')
  })

  it('should reference src/test/setup.ts as the setup file', () => {
    expect(source).toContain('src/test/setup.ts')
  })

  it('setupFiles should be an array', () => {
    // e.g. setupFiles: ['src/test/setup.ts']
    expect(source).toContain("['src/test/setup.ts']")
  })
})

// ---------------------------------------------------------------------------
// TypeScript / syntax sanity
// ---------------------------------------------------------------------------

describe('vite.config.ts – TypeScript and syntax sanity', () => {
  it('should use TypeScript syntax (no plain JS constructs without types)', () => {
    // The file extension .ts implies TS — a reference types directive confirms it
    expect(source).toContain('/// <reference types="vitest" />')
  })

  it('should not contain any TODO or FIXME comments', () => {
    expect(source).not.toMatch(/\/\/\s*(TODO|FIXME)/i)
  })

  it('should not import from deprecated vite packages', () => {
    expect(source).not.toContain('@vitejs/plugin-react-refresh')
    expect(source).not.toContain('@vitejs/plugin-legacy')
  })

  it('configuration should not be empty (must have at least plugins and base)', () => {
    expect(source).toContain('plugins:')
    expect(source).toContain('base:')
  })
})
