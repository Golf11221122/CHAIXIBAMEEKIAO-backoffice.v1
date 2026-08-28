JOKJUNG BACK OFFICE V3.23 — SAFE UI
====================================
Base: V3.22 Store Command Center supplied by the user.

This version intentionally does NOT use any V3.31–V3.34 UI automation.
It adds only:
  css/ui-safe-v3.23.css
  js/ui-safe-v3.23.js

Changes
1) Existing Share / Print / Refresh buttons are MOVED (not recreated) into the sticky topbar beside Logout.
   Order: Share -> Print -> Refresh -> Logout.
   Auto report buttons created later are observed and moved safely.
   Duplicate global/page report actions are suppressed.

2) Date ranges using IDs such as dateFrom/dateTo, from/to, start/end are displayed as one compact button.
   Example: 01/08/2569 - 31/08/2569
   Tap -> Step 1 select start date -> OK -> Step 2 select end date -> OK.
   Existing input values and change/input events are preserved for page business logic.

3) Operational buttons in page heads/toolbars/filters/action rows are compact on mobile.
   Existing Dashboard command tiles are not changed.

4) Tables scroll independently vertically/horizontally.
   Header row is sticky.
   First column is sticky.
   No table business data or rendering JS is changed.

Rollback
Remove references to ui-safe-v3.23.css and ui-safe-v3.23.js from HTML files.
