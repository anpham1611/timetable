# Proposal

## Why

On the home view, active timetables (TKBs) are listed oldest-first and the
default highlighted TKB is the latest one whose effective date has already
started. In practice users want the most recently published timetable up front:
it should appear first in the list and be selected by default, so the newest
schedule is what they see without extra clicks.

## What Changes

- Order the active TKB buttons on the home view **newest-first** (descending by
  effective date) instead of the current oldest-first order.
- Change the default-selected TKB to the **latest** TKB (the newest by effective
  date), rather than the latest one already in effect as of today.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `timetable-home`: The active TKB list's display order becomes newest-first,
  and the default-selected TKB becomes the latest TKB.

## Impact

- **Web**: home view TKB button ordering (`HeaderParts`/`TimetableHomePage`).
- **API**: default-selected id computation for `GET /timetables/active`
  (`computeDefaultSelectedId` in `services/timetable.ts`); the admin list already
  renders newest-first and is unaffected.
- **Out of scope**: admin page ordering, which active TKBs exist (import/toggle
  behavior), and the lookup section below the buttons.
