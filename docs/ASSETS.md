# Image assets

No real photography was supplied. Product, hero and close-up images are **3D renders** of each design's real standard specification, produced by the site's own 3D engine (`npm run renders`). They are accurate to the configuration and fine to launch with, and the footer states that product images are renders. The two visualiser sample rooms are still generated placeholder illustrations (`scripts/placeholders/`).

Photography of installed doors will still lift the site further — the shot list below says what to photograph for each slot.

List the outstanding slots at any time:

```bash
npm run assets:check            # list placeholders and renders
npm run assets:check -- --strict  # exit non-zero if placeholders remain
```

## How to replace an image

1. Export the photograph as JPEG (sRGB, quality ~85). Use at least the pixel size in the table; larger is fine — Next.js serves resized AVIF/WebP automatically.
2. Put it in `public/images/` (e.g. `public/images/hero-entrance.jpg`).
3. In `src/content/assets.ts`, change that slot's `src`, `width`, `height`, set `status: "final"` and update `alt` to describe the actual photo.

## Shot list

| Slot | File | Min size | Brief |
| --- | --- | --- | --- |
| Hero | `hero-entrance` | 3000 × 1875 | A Threshold pivot or carved entrance installed in a contemporary Hyderabad home. Late-afternoon light. Keep the **left 40%** calm for the headline; the door sits right of centre. |
| Final call to action | `cta-dusk` | 2400 × 1350 | An installed entrance door at dusk with warm exterior lights. Centre is covered by text, so keep it low-contrast. |
| Collections ×5 | `collection-*` | 1200 × 1500 | Portrait 4:5. One installed door per collection, full height visible, simply styled. |
| Products ×9 | `door-*` | 1200 × 1500 | Portrait 4:5. Each design in its **default specification** (see `/doors/<slug>`), installed, straight on, full height. |
| Materials ×4 | `material-*` | 1600 × 1067 | Macro photographs of real timber/veneer samples, finish samples, painted sample boards, and a handle on a finished door. |
| Process | `process-measure` | 1600 × 1067 | A team member measuring an opening on site. |
| Visualiser samples ×2 | `sample-room-*` | 1600 × 1200 | Straight-on photos of an empty doorway. If replaced, update `ROOM_GEOMETRY` in `src/components/visualiser/visualiser.tsx` with the room's real width, height, floor line and doorway centre (in mm) so sample placement stays at true scale. |
| Social preview | — | 1200 × 630 | Optional: add `src/app/opengraph-image.jpg`. |

The homepage "See it in your space" section positions a door over `sample-room-hallway` using fixed percentages (`src/components/home/visualiser-feature.tsx`); update them if that image changes.

## Regenerating renders and placeholders

```bash
npm run renders                 # all 3D renders (hero, products, close-ups)
npm run renders -- product      # only product shots
```


```bash
npm run placeholders            # all
npm run placeholders -- door-   # only product shots
```

Requires Chromium (set `CHROMIUM_PATH` if Playwright's browser isn't at the default path).

## Fonts

Instrument Serif (display) and Hanken Grotesk (text) are self-hosted from `src/fonts/` under the SIL Open Font License (licence files alongside).
