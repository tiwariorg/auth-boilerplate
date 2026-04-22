# KAN-6 · UI Issues — Blocker Investigation & Action Plan

> **Status: 🚫 BLOCKED — awaiting reporter clarification**
> This document is the single actionable artifact for KAN-6 until the ticket is
> unblocked. Update it in-place as new information arrives.

---

## 1 · Summary

KAN-6 was filed under the theme of "UI issues" but **no specific problem was
described** by the reporter. After two rounds of written clarification requests
(see §2 below) that received no reply, development cannot begin — it is
impossible to identify which page or component is affected, reproduce any
defect, or define acceptance criteria for a fix.

The ticket has been moved to **Blocked** and will remain there until the
information listed in §3 is provided.

---

## 2 · Clarification Request Log

### Round 1

| Field | Detail |
|-------|--------|
| **Sent by** | Development team |
| **Channel** | Ticket comment (KAN-6) |
| **Date** | _(fill in actual date)_ |
| **Response received** | ❌ No |

**Message sent:**

> Hi — thanks for raising this! To start investigating we need a bit more
> detail. Could you let us know:
>
> 1. Which page or component shows the issue? (e.g. Login page, Dashboard,
>    navigation bar)
> 2. What steps can we follow to reproduce it?
> 3. What did you expect to see, and what did you actually see?
> 4. Any screenshots or a screen recording would be very helpful.
> 5. Which browser and device were you using?
>
> We'll pick this up as soon as we hear back. Thanks!

---

### Round 2

| Field | Detail |
|-------|--------|
| **Sent by** | Development team |
| **Channel** | Ticket comment (KAN-6) |
| **Date** | _(fill in actual date — min. 3 business days after Round 1)_ |
| **Response received** | ❌ No |

**Message sent:**

> Following up on our earlier message — we still need a few details before we
> can start work on KAN-6. Without knowing which part of the UI is affected or
> how to reproduce the problem, we can't safely make any changes.
>
> If it's easier, feel free to hop on a quick Slack call or reply with
> screenshots and we can take it from there. We're marking the ticket
> **Blocked** for now and will re-open it the moment we have enough
> information. Thanks!

---

## 3 · Information Required Before Work Can Begin

All items below must be answered **before any code changes are made**.

### 3.1 Affected area

- [ ] Which **page(s)** are impacted?
  - Known pages in the codebase: `LoginPage`, `DashboardPage`
- [ ] Which **component(s)** show the problem?
  - Known components: `LoginForm`, `ProtectedRoute`, `UserInfo`
- [ ] Is the issue present on **every** visit, or only under certain conditions
      (e.g. after login, after a page refresh, on first load only)?

### 3.2 Steps to reproduce

- [ ] Numbered, step-by-step instructions that consistently reproduce the issue
      starting from a fresh browser tab — for example:
  1. Navigate to `https://<app-url>/login`
  2. Enter valid credentials and click **Sign in**
  3. _(describe next step)_
  4. Observe _(describe what goes wrong)_

### 3.3 Visual evidence

- [ ] At least one **screenshot** of the broken state
- [ ] A **screen recording** (Loom, GIF, or video) is strongly preferred for
      any animation, layout-shift, or interaction-timing bug

### 3.4 Expected vs. actual behaviour

- [ ] **Expected:** what should the UI look like / do?
- [ ] **Actual:** what is it currently showing / doing?

### 3.5 Environment details

- [ ] **Browser** name and version (e.g. Chrome 125, Safari 17.4)
- [ ] **Operating system** (e.g. macOS 14, Windows 11, iOS 17)
- [ ] **Device type** — desktop, tablet, or mobile? If mobile, which model?
- [ ] **Screen resolution / zoom level** (relevant for layout issues)
- [ ] **Network conditions** if the issue appears load-related (e.g. slow 3G)

---

## 4 · Recommended Next Steps

Choose **one** of the following paths to unblock KAN-6:

### Option A — Schedule a synchronous conversation (preferred)

A 15-minute Slack huddle or video call with the reporter is the fastest way to
gather all required information in one go.

**Action items:**

- [ ] DM the reporter on Slack and propose two or three time slots
- [ ] Record the outcome of the call as a comment on KAN-6
- [ ] Update §3 of this document with the information gathered
- [ ] Remove the **Blocked** label and assign the ticket to a developer

### Option B — Request separate, well-described tickets

If the reporter has multiple distinct issues in mind, asking them to create one
ticket per issue (with full descriptions from the start) keeps the backlog
clean and each ticket independently actionable.

**Action items:**

- [ ] Reply on KAN-6 asking the reporter to close this ticket and open one new
      ticket **per UI issue**, each containing:
  - A clear title (e.g. "LoginForm — submit button disabled after failed auth")
  - All fields from §3 filled in at creation time
- [ ] Close KAN-6 as **Won't Fix / Duplicate Effort** once replacement tickets
      exist
- [ ] Link the new tickets back to KAN-6 for traceability

---

## 5 · Decision Log

| Date | Decision | Owner |
|------|----------|-------|
| _(fill in)_ | Ticket created; no description provided | Reporter |
| _(fill in)_ | Round 1 clarification request sent | Dev team |
| _(fill in)_ | Round 2 clarification request sent; ticket moved to Blocked | Dev team |
| _(fill in)_ | _(next action taken)_ | _(owner)_ |

---

> _This document was created to track KAN-6 while it is blocked. It should be
> updated whenever new information arrives or a decision is made. Once the
> ticket is unblocked, move this file to `docs/resolved-tickets/` or delete it
> at the team's discretion._
