

## Remove intro blurb section from landing page

A small change to `src/pages/Index.tsx` — remove the "Intro Section" block (the white card containing "Family life, made lighter" and the paragraph below it). The feature cards will move up directly beneath the banner.

### Technical detail
- In `src/pages/Index.tsx`, delete the `<section>` element with the comment `{/* Intro Section */}` (approximately lines 44-55).
- No other files are affected.

