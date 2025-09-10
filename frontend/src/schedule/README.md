Schedule Module
===============

Domain Mapping
--------------
- Internal (canonical) values use English kebab-case.
- Backend/Supabase expects Spanish ASCII codes.
- UI labels are Spanish.

See `src/constants/domainMap.ts` for:
- `TASK_STATE_MAP`: internal -> { label (ES), color/bg, externalCode (ES ASCII) }
- `TASK_STATE_ORDER`: ordering for stats/UI
- `toExternalTaskState`, `fromExternalTaskState`: helpers at API boundaries
- `PRIORITY_INFO`: priority labels (ES)

ICS Export Timezone
-------------------
The `exportToICS` function accepts an optional `timeZone` parameter and defaults to the user's resolved timezone.

Manual Validation (per PR)
--------------------------
- Calendar: load current month, quick create task, edit status/priority, drag & drop, delete.
- Popovers/Modals: initial focus, close with Esc, dock toggle.
- Export: CSV/ICS/JSON — verify title, dates, timezone.
- Console: no warnings.

