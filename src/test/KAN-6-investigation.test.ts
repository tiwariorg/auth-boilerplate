/**
 * Tests for docs/blocked-tickets/KAN-6-investigation.md
 *
 * Validates the structure, completeness, and content of the KAN-6 blocker
 * investigation document:
 *   - Document exists and is readable
 *   - H1 heading and status banner are present
 *   - All five required sections (§1–§5) are present
 *   - Both clarification-request rounds are documented
 *   - All information-required checklists are present (§3.1–§3.5)
 *   - Both unblocking options (A & B) are documented
 *   - The decision log table is present
 *   - Footer guidance is present
 *   - Known codebase components are referenced
 *
 * Source file: docs/blocked-tickets/KAN-6-investigation.md
 *
 * Strategy: read the markdown as raw text and assert on its content.
 * No markdown parser is needed — plain string assertions keep the tests
 * fast, deterministic, and dependency-free.
 *
 * Ticket: KAN-6
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
  // Two levels up from src/test/ → repo root → docs/blocked-tickets/
  const filePath = resolve(
    __dirname,
    '../../docs/blocked-tickets/KAN-6-investigation.md',
  )
  content = readFileSync(filePath, 'utf-8')
  lines = content.split('\n')
})

// ---------------------------------------------------------------------------
// File existence & basic structure
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – file existence and basic structure', () => {
  it('should exist and be readable as a non-empty string', () => {
    expect(typeof content).toBe('string')
    expect(content.length).toBeGreaterThan(0)
  })

  it('should contain a markdown H1 heading', () => {
    const hasH1 = lines.some((line) => line.startsWith('# '))
    expect(hasH1).toBe(true)
  })

  it('should reference KAN-6 in the heading', () => {
    const h1 = lines.find((line) => line.startsWith('# '))
    expect(h1).toBeDefined()
    expect(h1).toContain('KAN-6')
  })

  it('should mention "UI Issues" in the heading', () => {
    const h1 = lines.find((line) => line.startsWith('# '))
    expect(h1).toContain('UI Issues')
  })

  it('should contain multiple H2 section headings', () => {
    const h2Count = lines.filter((line) => line.startsWith('## ')).length
    expect(h2Count).toBeGreaterThanOrEqual(5)
  })

  it('should not be a trivially short document (at least 80 lines)', () => {
    expect(lines.length).toBeGreaterThanOrEqual(80)
  })
})

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – status banner', () => {
  it('should include a BLOCKED status banner', () => {
    expect(content).toContain('BLOCKED')
  })

  it('should display the 🚫 emoji to signal a blocked state', () => {
    expect(content).toContain('🚫')
  })

  it('should explain that the ticket is awaiting reporter clarification', () => {
    expect(content).toContain('awaiting reporter clarification')
  })

  it('should describe the document as the "single actionable artifact"', () => {
    expect(content).toContain('single actionable artifact')
  })

  it('should instruct readers to update the document in-place', () => {
    expect(content).toContain('Update it in-place')
  })
})

// ---------------------------------------------------------------------------
// Section 1 – Summary
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §1 Summary', () => {
  it('should contain a "Summary" section', () => {
    expect(content).toContain('## 1')
    expect(content).toContain('Summary')
  })

  it('should state that no specific problem was described by the reporter', () => {
    // The phrase is split across two lines in the source:
    //   "but **no specific problem was\ndescribed** by the reporter"
    // We match the portion that is guaranteed to appear on a single line.
    expect(content).toContain('no specific problem was')
  })

  it('should mention that the reporter filed the ticket without a specific description', () => {
    // The bold "described" appears on the next line right after the split
    expect(content).toContain('described** by the reporter')
  })

  it('should mention two rounds of clarification requests', () => {
    expect(content).toContain('two rounds')
  })

  it('should note that no reply was received', () => {
    expect(content).toContain('no reply')
  })

  it('should state that development cannot begin', () => {
    expect(content).toContain('development cannot begin')
  })

  it('should explain that it is impossible to identify the affected component', () => {
    expect(content).toContain('impossible to identify')
  })

  it('should mention that acceptance criteria cannot be defined', () => {
    expect(content).toContain('acceptance criteria')
  })

  it('should state the ticket has been moved to Blocked', () => {
    expect(content).toContain('moved to **Blocked**')
  })
})

// ---------------------------------------------------------------------------
// Section 2 – Clarification Request Log
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §2 Clarification Request Log', () => {
  it('should contain a "Clarification Request Log" section', () => {
    expect(content).toContain('Clarification Request Log')
  })

  it('should document Round 1', () => {
    expect(content).toContain('Round 1')
  })

  it('should document Round 2', () => {
    expect(content).toContain('Round 2')
  })

  it('should show that Round 1 received no response', () => {
    expect(content).toContain('Response received')
    expect(content).toContain('❌ No')
  })

  it('should show that Round 2 also received no response', () => {
    // Two occurrences of "❌ No" — one per round
    const noResponseCount = (content.match(/❌ No/g) || []).length
    expect(noResponseCount).toBeGreaterThanOrEqual(2)
  })

  it('Round 1 message should ask which page or component shows the issue', () => {
    expect(content).toContain('Which page or component shows the issue')
  })

  it('Round 1 message should request reproduction steps', () => {
    expect(content).toContain('steps can we follow to reproduce')
  })

  it('Round 1 message should ask for expected vs actual behaviour', () => {
    expect(content).toContain('What did you expect to see')
    expect(content).toContain('what did you actually see')
  })

  it('Round 1 message should request screenshots or a recording', () => {
    expect(content).toContain('screenshots')
  })

  it('Round 1 message should ask for browser and device information', () => {
    expect(content).toContain('browser and device')
  })

  it('Round 2 message should offer a Slack call as an alternative', () => {
    expect(content).toContain('Slack')
  })

  it('Round 2 message should state the ticket has been marked Blocked', () => {
    expect(content).toContain('marking the ticket')
    expect(content).toContain('Blocked')
  })

  it('Round 1 table should include a "Sent by" field', () => {
    expect(content).toContain('Sent by')
  })

  it('Round 1 table should include a "Channel" field', () => {
    expect(content).toContain('Channel')
  })

  it('clarification requests should have been sent via ticket comment', () => {
    expect(content).toContain('Ticket comment')
  })

  it('rounds should be sent by the Development team', () => {
    expect(content).toContain('Development team')
  })
})

// ---------------------------------------------------------------------------
// Section 3 – Information Required
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §3 Information Required Before Work Can Begin', () => {
  it('should contain a section on information required before work begins', () => {
    expect(content).toContain('Information Required Before Work Can Begin')
  })

  it('should state all items must be answered before any code changes', () => {
    expect(content).toContain('before any code changes are made')
  })

  // §3.1 – Affected area
  it('§3.1 should document the "Affected area" sub-section', () => {
    expect(content).toContain('Affected area')
  })

  it('§3.1 should ask which pages are impacted', () => {
    expect(content).toContain('page(s)')
  })

  it('§3.1 should reference LoginPage as a known page', () => {
    expect(content).toContain('LoginPage')
  })

  it('§3.1 should reference DashboardPage as a known page', () => {
    expect(content).toContain('DashboardPage')
  })

  it('§3.1 should ask which components show the problem', () => {
    expect(content).toContain('component(s)')
  })

  it('§3.1 should list LoginForm as a known component', () => {
    expect(content).toContain('LoginForm')
  })

  it('§3.1 should list ProtectedRoute as a known component', () => {
    expect(content).toContain('ProtectedRoute')
  })

  it('§3.1 should list UserInfo as a known component', () => {
    expect(content).toContain('UserInfo')
  })

  it('§3.1 should ask if the issue is present on every visit or only under certain conditions', () => {
    expect(content).toContain('every')
    expect(content).toContain('certain conditions')
  })

  // §3.2 – Steps to reproduce
  it('§3.2 should document the "Steps to reproduce" sub-section', () => {
    expect(content).toContain('Steps to reproduce')
  })

  it('§3.2 should ask for numbered, step-by-step reproduction instructions', () => {
    expect(content).toContain('Numbered, step-by-step instructions')
  })

  it('§3.2 should reference the /login URL as a starting point', () => {
    expect(content).toContain('/login')
  })

  it('§3.2 should mention starting from a fresh browser tab', () => {
    expect(content).toContain('fresh browser tab')
  })

  // §3.3 – Visual evidence
  it('§3.3 should document the "Visual evidence" sub-section', () => {
    expect(content).toContain('Visual evidence')
  })

  it('§3.3 should request at least one screenshot of the broken state', () => {
    expect(content).toContain('screenshot')
  })

  it('§3.3 should request a screen recording', () => {
    expect(content).toContain('screen recording')
  })

  it('§3.3 should mention Loom as a recording option', () => {
    expect(content).toContain('Loom')
  })

  // §3.4 – Expected vs. actual behaviour
  it('§3.4 should document the "Expected vs. actual behaviour" sub-section', () => {
    expect(content).toContain('Expected vs. actual behaviour')
  })

  it('§3.4 should ask what the expected behaviour is', () => {
    expect(content).toContain('Expected:')
  })

  it('§3.4 should ask what the actual behaviour is', () => {
    expect(content).toContain('Actual:')
  })

  // §3.5 – Environment details
  it('§3.5 should document the "Environment details" sub-section', () => {
    expect(content).toContain('Environment details')
  })

  it('§3.5 should ask for the browser name and version', () => {
    expect(content).toContain('Browser')
    expect(content).toContain('version')
  })

  it('§3.5 should ask for the operating system', () => {
    expect(content).toContain('Operating system')
  })

  it('§3.5 should ask for the device type', () => {
    expect(content).toContain('Device type')
  })

  it('§3.5 should ask for screen resolution or zoom level', () => {
    expect(content).toContain('Screen resolution')
    expect(content).toContain('zoom level')
  })

  it('§3.5 should ask about network conditions for load-related issues', () => {
    expect(content).toContain('Network conditions')
  })
})

// ---------------------------------------------------------------------------
// Section 3 – Checklist format
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §3 checklist format', () => {
  it('should use markdown checkboxes for open items', () => {
    // Unchecked checkboxes: - [ ]
    expect(content).toContain('- [ ]')
  })

  it('should have multiple unchecked checklist items (information not yet gathered)', () => {
    const uncheckedCount = (content.match(/- \[ \]/g) || []).length
    expect(uncheckedCount).toBeGreaterThanOrEqual(5)
  })

  it('should NOT have any pre-checked items (all items are still outstanding)', () => {
    // Checked: - [x] or - [X]
    const checkedCount = (content.match(/- \[[xX]\]/g) || []).length
    expect(checkedCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Section 4 – Recommended Next Steps
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §4 Recommended Next Steps', () => {
  it('should contain a "Recommended Next Steps" section', () => {
    expect(content).toContain('Recommended Next Steps')
  })

  it('should present at least two options for unblocking the ticket', () => {
    expect(content).toContain('Option A')
    expect(content).toContain('Option B')
  })

  // Option A
  it('Option A should recommend a synchronous conversation', () => {
    expect(content).toContain('synchronous conversation')
  })

  it('Option A should be marked as the preferred path', () => {
    expect(content).toContain('preferred')
  })

  it('Option A should suggest a Slack huddle or video call', () => {
    expect(content).toContain('Slack huddle')
    expect(content).toContain('video call')
  })

  it('Option A action items should include DMing the reporter on Slack', () => {
    expect(content).toContain('DM the reporter on Slack')
  })

  it('Option A should include recording the outcome as a ticket comment', () => {
    expect(content).toContain('Record the outcome')
  })

  it('Option A should include updating §3 with gathered information', () => {
    expect(content).toContain('Update §3')
  })

  it('Option A should include removing the Blocked label', () => {
    expect(content).toContain('Remove the **Blocked** label')
  })

  // Option B
  it('Option B should suggest requesting separate, well-described tickets', () => {
    expect(content).toContain('separate, well-described tickets')
  })

  it('Option B should mention closing KAN-6 after replacement tickets exist', () => {
    expect(content).toContain('Close KAN-6')
  })

  it("Option B should suggest closing as Won't Fix / Duplicate Effort", () => {
    expect(content).toContain("Won't Fix")
  })

  it('Option B should mention linking new tickets back to KAN-6 for traceability', () => {
    expect(content).toContain('Link the new tickets back to KAN-6')
  })

  it('Option B should describe what a well-formed replacement ticket should include', () => {
    expect(content).toContain('clear title')
  })

  it('Option A action items should use markdown checkboxes', () => {
    const optionAStart = content.indexOf('Option A')
    const optionBStart = content.indexOf('Option B')
    const optionASection = content.substring(optionAStart, optionBStart)
    expect(optionASection).toContain('- [ ]')
  })

  it('Option B action items should use markdown checkboxes', () => {
    const optionBStart = content.indexOf('Option B')
    const section5Start = content.indexOf('## 5')
    const optionBSection = content.substring(optionBStart, section5Start)
    expect(optionBSection).toContain('- [ ]')
  })
})

// ---------------------------------------------------------------------------
// Section 5 – Decision Log
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – §5 Decision Log', () => {
  it('should contain a "Decision Log" section', () => {
    expect(content).toContain('Decision Log')
  })

  it('should use a markdown table for the decision log', () => {
    const decisionLogSection = content.substring(content.indexOf('Decision Log'))
    const hasTable = decisionLogSection
      .split('\n')
      .some((line) => line.trim().startsWith('|'))
    expect(hasTable).toBe(true)
  })

  it('Decision Log table should have a "Date" column', () => {
    expect(content).toContain('| Date |')
  })

  it('Decision Log table should have a "Decision" column', () => {
    expect(content).toContain('| Decision |')
  })

  it('Decision Log table should have an "Owner" column', () => {
    expect(content).toContain('| Owner |')
  })

  it('should record that the ticket was created with no description', () => {
    expect(content).toContain('no description provided')
  })

  it('should record that Round 1 clarification was sent', () => {
    expect(content).toContain('Round 1 clarification request sent')
  })

  it('should record that Round 2 clarification was sent and ticket moved to Blocked', () => {
    expect(content).toContain('Round 2 clarification request sent')
    expect(content).toContain('moved to Blocked')
  })

  it('should record the Reporter as the owner of ticket creation', () => {
    expect(content).toContain('Reporter')
  })

  it('should record the Dev team as the owner of clarification requests', () => {
    expect(content).toContain('Dev team')
  })

  it('should include a placeholder row for the next action', () => {
    expect(content).toContain('next action taken')
  })
})

// ---------------------------------------------------------------------------
// Footer / closing guidance
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – footer and closing guidance', () => {
  it('should include a closing guidance note', () => {
    // The closing blockquote is a standard Markdown > blockquote
    expect(content).toContain('> _This document was created')
  })

  it('footer should explain the document was created to track KAN-6', () => {
    expect(content).toContain('track KAN-6')
  })

  it('footer should instruct updating the document when new information arrives', () => {
    expect(content).toContain('updated whenever new information arrives')
  })

  it('footer should suggest moving to docs/resolved-tickets/ once unblocked', () => {
    expect(content).toContain('docs/resolved-tickets/')
  })

  it('footer should mention deletion as a disposal option', () => {
    expect(content).toContain('delete it')
  })
})

// ---------------------------------------------------------------------------
// Section ordering – the document must flow in a predictable order
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – section ordering', () => {
  it('sections should appear in the correct numerical order (§1 → §5)', () => {
    const indices = [
      content.indexOf('## 1'),
      content.indexOf('## 2'),
      content.indexOf('## 3'),
      content.indexOf('## 4'),
      content.indexOf('## 5'),
    ]

    // All sections must be present
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0)
    }

    // Each section must appear after the previous one
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1])
    }
  })

  it('§3 sub-sections should appear in order (3.1 → 3.5)', () => {
    const sub = [
      content.indexOf('3.1'),
      content.indexOf('3.2'),
      content.indexOf('3.3'),
      content.indexOf('3.4'),
      content.indexOf('3.5'),
    ]

    for (const idx of sub) {
      expect(idx).toBeGreaterThanOrEqual(0)
    }

    for (let i = 1; i < sub.length; i++) {
      expect(sub[i]).toBeGreaterThan(sub[i - 1])
    }
  })

  it('Option A should appear before Option B in §4', () => {
    const optionAIdx = content.indexOf('Option A')
    const optionBIdx = content.indexOf('Option B')
    expect(optionAIdx).toBeGreaterThanOrEqual(0)
    expect(optionBIdx).toBeGreaterThanOrEqual(0)
    expect(optionAIdx).toBeLessThan(optionBIdx)
  })

  it('§2 (clarification log) should appear before §3 (info required)', () => {
    expect(content.indexOf('## 2')).toBeLessThan(content.indexOf('## 3'))
  })

  it('§4 (next steps) should appear before §5 (decision log)', () => {
    expect(content.indexOf('## 4')).toBeLessThan(content.indexOf('## 5'))
  })
})

// ---------------------------------------------------------------------------
// Known codebase component references (internal consistency)
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – codebase component references', () => {
  it('should reference the LoginPage component by exact name', () => {
    expect(content).toContain('`LoginPage`')
  })

  it('should reference the DashboardPage component by exact name', () => {
    expect(content).toContain('`DashboardPage`')
  })

  it('should reference the LoginForm component by exact name', () => {
    expect(content).toContain('`LoginForm`')
  })

  it('should reference the ProtectedRoute component by exact name', () => {
    expect(content).toContain('`ProtectedRoute`')
  })

  it('should reference the UserInfo component by exact name', () => {
    expect(content).toContain('`UserInfo`')
  })
})

// ---------------------------------------------------------------------------
// Content quality – no debugging artifacts or incomplete drafts
// ---------------------------------------------------------------------------

describe('KAN-6-investigation.md – content quality', () => {
  it('should not contain any raw TODO markers', () => {
    expect(content).not.toMatch(/\bTODO\b/)
  })

  it('should not contain placeholder "FIXME" markers', () => {
    expect(content).not.toMatch(/\bFIXME\b/)
  })

  it('should use proper markdown horizontal rule (---) as section dividers', () => {
    expect(content).toContain('---')
  })

  it('should not have any broken markdown heading syntax (# without space)', () => {
    const brokenHeadings = lines.filter(
      (line) =>
        line.startsWith('#') &&
        !line.startsWith('# ') &&
        !line.startsWith('## ') &&
        !line.startsWith('### ') &&
        !line.startsWith('#### '),
    )
    expect(brokenHeadings.length).toBe(0)
  })

  it('should not have any Windows-style line endings (CRLF)', () => {
    expect(content).not.toContain('\r\n')
  })
})
