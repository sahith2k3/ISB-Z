# Study Group Finder (Archived)

This directory contains the full source code and components for the **Study Group Finder (SG Planner)** feature, archived after Term 5 so that it can be cleanly restored at the start of next term.

---

## Archived Files

| Archived File | Original Target Location | Description |
|---|---|---|
| `page.tsx` | `app/sg-planner/page.tsx` | Full UI page for browsing sections, student lists, filtering by study group status, and updating own status |
| `api-route.ts` | `app/api/sg-planner/route.ts` | API route handling GET (summary / section roster) and POST (status update) |
| `sg-status-store.ts` | `lib/sg-status-store.ts` | Database read/write logic for Postgres / Neon with fallback local cache |
| `seating-ticker-banner.tsx` | `components/seating-ticker-banner.tsx` | Announcement marquee / ticker banner shown on the home page |

---

## How to Restore Next Term

1. **Restore Core Files**:
   - Move or copy `page.tsx` to `app/sg-planner/page.tsx`.
   - Move or copy `api-route.ts` to `app/api/sg-planner/route.ts`.
   - Move or copy `sg-status-store.ts` to `lib/sg-status-store.ts`.

2. **Database Table**:
   - Check `db/schema.ts` to ensure `study_group_status` table is present (it is preserved in `db/schema.ts`).
   - Run migrations / push if needed: `npm run db:push`.

3. **API Client Hooks**:
   - Check `lib/api-client.ts`: The hooks `useGetSgPlannerSummary`, `useGetSgSectionRoster`, and `useUpdateSgStatus` are kept in `lib/api-client.ts` for continuity.

4. **Add to Navigation**:
   - In `components/bottom-nav.tsx`:
     - Import `Users` from `"lucide-react"`.
     - Add `{ href: "/sg-planner", label: "SG planner", icon: Users }` back to `items`.
     - Update the layout grid class from `grid-cols-3` back to `grid-cols-4`.

5. **Prefetching**:
   - In `components/views/home-view.tsx`:
     - In the pre-fetch `useEffect`, re-add `router.prefetch("/sg-planner");`.

6. **Announcement Ticker (Optional)**:
   - If an announcement banner is desired, restore `components/seating-ticker-banner.tsx` and include `<SeatingTickerBanner />` in `components/views/home-view.tsx`.
