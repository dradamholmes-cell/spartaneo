# OGB Studio Architecture

## Goal

OGB Studio is the owner-only control room for Spartaneo projects. Core operations must work without Codex and without Work mode. Normal ChatGPT conversations should be able to call safe server-side actions when the connector/tool bridge is available.

## Non-negotiable rules

1. **No Codex dependency.** Codex may never be required for routine operation.
2. **Project isolation is enforced in code.** A comic project tool receives one project isolation key and cannot search or mutate another project's canon, references, rejected generations, or production files.
3. **Rejected art is quarantined.** Rejected images may remain in history but can never be automatically promoted into future reference sets.
4. **Production changes are approval-gated.** AI may prepare edits, previews, builds, and proposed releases. Production publishing requires an explicit owner approval step.
5. **Charges/orders are separately locked.** No purchase, Printify order, paid API action, or other charge may execute without explicit owner approval.
6. **The project registry is the source of truth.** Hand-off files are exports from Studio state, not the canonical database.
7. **Every mutation is auditable and reversible.** Site/code changes should be tied to Git commits or versioned records with rollback paths.
8. **Private art stays private by default.** Binary source packages, character sheets, keeper art, working PDFs, and rejected generations must not be added to a public Git repository merely to make Studio work.

## First trusted import

`Mostly Empty, Somewhat Divine` is the first real Studio room.

Trusted import snapshot:

- Package: `MOSTLY_EMPTY_STUDIO_MASTER_CORE_2026-09-25.zip`
- Package date: 2026-09-25
- Package SHA-256: `77686673d5a6c89d5697c2d2fbd78b01ab967ada6ccd64d28ae2d7b77f4d8fbb`
- Internal checksum entries verified: 54 / 54
- Character locks indexed: 19
- Approved keepers indexed: 16
- Provisional-only references indexed: 4
- 201-page working compilation: explicitly recovery/reference only, never a final export
- Binary asset persistence: still pending private storage

The source package's newest START_HERE and status ledger supersede older conflicting notes. In particular, the youth profile section stays; later identity drift is repaired from the exact individual youth reference pages rather than deleting the youth section.

## Comic data model target

Each comic project will eventually contain:

- Project metadata and production rules
- Canon/script documents
- Character records and locked reference images
- Page records
  - page number
  - page brief
  - required characters
  - allowed references
  - current status: not-started / draft / keeper / locked
  - draft generations
  - rejected generations
  - locked final art
  - dialogue/lettering state
- Export history
  - print interior
  - cover
  - shareable PDF
  - web edition
  - thumbnails/social assets

## Tool surface target

### Read-only

- `studio_status`
- `list_projects`
- `get_project`
- `get_next_page`
- `get_page`
- `get_character`
- `list_locked_references`
- `preflight_book`
- `site_status`
- `list_site_projects`

### Draft/write but non-production

- `create_project`
- `update_project_metadata`
- `create_page`
- `update_page_brief`
- `submit_page_draft`
- `reject_page_draft`
- `mark_page_keeper`
- `lock_page`
- `add_character_reference`
- `prepare_site_patch`
- `build_preview`
- `build_shareable_pdf`
- `build_lulu_package`

### Explicit owner approval required

- `publish_site_patch`
- `publish_book`
- `rollback_production`
- any action that creates a charge or order

## Implementation phases

### Phase 1 — Foundation

- Owner-only `/tools/studio` dashboard
- Project registry
- Authenticated Studio status endpoint
- Hard-coded safety rules
- First trusted comic metadata import
- First authenticated project read endpoint

### Phase 2 — Private assets + page state

- Private binary asset storage
- Persist character locks, keeper art, recovery PDFs, and future drafts/rejects
- Persistent project/page/reference records
- Page state machine
- Locked reference enforcement
- Rejected-generation quarantine

### Phase 3 — ChatGPT tool bridge

- Expose the safe Studio actions through the existing Spartaneo/OGB bridge
- Keep all routine operations usable from normal ChatGPT
- Make tool responses compact and deterministic

### Phase 4 — Publishing

- Lulu preflight
- web/shareable/print exports
- metadata/social assets
- release checklist

### Phase 5 — Site operator

- Git-backed site edit plans
- preview deployment
- automated checks
- explicit publish
- rollback
