---
name: Schedule workbook imports
description: Formatting quirks to preserve when refreshing schedule data from the supplied Excel workbooks
---

Schedule workbooks may use abbreviated month names such as `Aug` and may contain zero-width characters in course codes. Normalize both before converting cells into schedule records. Class-list workbooks provide enrollment assignments, while timetable workbooks provide dated sessions; blank timetable weeks must remain empty.

**Why:** A strict parser can silently omit valid sessions or create course-code mismatches, which makes otherwise registered students appear to have empty schedules.

**How to apply:** Normalize cell text and month names during every future workbook refresh, join class-list assignments to timetable course/section keys, and verify row counts by campus and retained date range against the source sheets.