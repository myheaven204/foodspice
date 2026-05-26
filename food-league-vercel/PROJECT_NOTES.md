# FoodSpice / Food League T5 - Project Notes

Last updated: 2026-05-26

## Links

- Live web: https://food-league-vercel.vercel.app
- GitHub repo: https://github.com/myheaven204/foodspice
- Google Sheet: https://docs.google.com/spreadsheets/d/1MFgr9UzqoybNH3jybqb-piY63DEf1t0lub46B0czmwg/edit?gid=1221285139#gid=1221285139
- API endpoint: https://food-league-vercel.vercel.app/api/sheet

## Local project

Path:

```text
C:\Users\Dui\.openclaw\workspace\food-league-vercel
```

Important files:

```text
api/sheet.js             # Vercel API: reads Google Sheet CSV and returns parsed JSON
public/index.html        # Dashboard UI
public/payment-qr.jpg    # Payment QR image
vercel.json              # Vercel routing/config
README.md
```

## Current behavior

Dashboard reads live data via:

```text
/api/sheet?month=<month>&refresh=1
```

Examples:

```text
/api/sheet?month=5&refresh=1
/api/sheet?month=6&refresh=1
```

The frontend has a month dropdown. If URL does not specify `?month=...`, it defaults to the current month from the user's device/browser:

```js
new Date().getMonth() + 1
```

So:

- During May, default month is 5.
- During June, default month is 6.
- Old months can be viewed via dropdown or direct URL, e.g. `/?month=5`.

## Google Sheet naming convention

Tabs should be named exactly:

```text
Bill Hải tháng 5
Bill Hải tháng 6
Bill Hải tháng 7
...
```

API reads by tab name using Google gviz CSV:

```text
https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<encoded tab name>
```

Important: Google may return the first/default sheet when a requested tab does not exist. To avoid showing wrong month data, API now checks that non-default months contain date rows starting with that month number, e.g. `6/` for month 6. If not, it returns an empty state instead of month 5 data.

## Known month behavior

- Month 5 currently works and returns correct totals.
- If Month 6 tab is copied from Month 5 but dates still start with `5/`, the API treats it as empty for Month 6.
- For Month 6 to display, the tab should contain date values starting with `6/`, e.g. `6/1/2026`.

## Current verified Month 5 totals

As of latest check:

- Total: `5177.384`
- Việt: `1262`
- Hải: `1199`
- Tâm: `1029`
- Duy: `822`
- Tin: `394`
- Đạt: `214`
- Khánh: `196`
- Nhung: `61`
- Công ty: `0`

## Features implemented

### Dashboard UI

- Dark premium UI / leaderboard style.
- Title: `Food League T5`.
- Champion card.
- Podium Top 3.
- KPI cards.
- Leaderboard ranking.
- Donut chart for `Tỷ trọng Top`.
- Bar chart for total spend comparison.
- Favorite dishes section.
- Load animations across dashboard sections.
- Hover/touch tooltip on charts.
- Hover effects on cards/rows/dishes.
- Mobile responsive polish.

### Donut chart labels

User wanted names directly inside colored donut slices, not only on hover.

Current behavior:

- Draws name + percentage directly inside slices.
- Uses small glass/pill label style.
- Hides only extremely tiny slices to avoid overlap.
- Đạt label threshold was lowered so smaller slices are more likely to show.

### Month selector

- Dropdown for months 1-12.
- Defaults to current month if URL has no `month` query.
- Updates URL query when changed.
- Refresh button fetches the currently selected month.

### Sheet and payment buttons

Header contains:

- `📄 Mở Sheet` — opens the Google Sheet in a new tab.
- `💳 QR Thanh toán` — opens modal with payment QR.
- `↻ Refresh Sheet` — refetches sheet data.

Payment QR:

- File: `public/payment-qr.jpg`
- Name: `LƯƠNG MINH HẢI`
- Bank info shown: `VietinBank • 105873877077`

## Important bugs fixed

1. Initial local HTML fetch could be blocked by CORS.
   - Solved by Vercel API proxy.

2. API initially used wrong `Tổng` column index.
   - Fixed `Tổng` to index 13 for CSV layout.

3. Sheet `Tổng` row sometimes exported without visible `Tổng` label when using gviz/tab name.
   - API now detects total row if date/content are empty but people totals and row total exist.

4. Month 6 returned Month 5 data when tab did not exist.
   - API now validates requested month date rows for non-default months and returns empty state instead.

5. Mobile layout was cramped after adding Sheet/QR buttons.
   - Added mobile CSS polish.

## Deploy workflow

From project directory:

```powershell
cd C:\Users\Dui\.openclaw\workspace\food-league-vercel
git status
git add <files>
git commit -m "message"
git push
npx vercel@latest deploy --prod --yes
```

Current Vercel project alias:

```text
https://food-league-vercel.vercel.app
```

Note: User originally wanted the web name to start with `foodspice`, but current Vercel alias is `food-league-vercel.vercel.app`. Repo is `foodspice`.

## If context is lost

To resume:

1. Read this file.
2. Check git status/log:

```powershell
git status
git log --oneline -5
```

3. Check API live:

```text
https://food-league-vercel.vercel.app/api/sheet?month=5&refresh=1
```

4. Edit `api/sheet.js` or `public/index.html` as needed.
5. Push and deploy.
