# TikTok Shop UK commission workbook

This directory is where you place the source workbook locally to
(re)generate `src/data/tiktok.fees.ts`. **The workbook itself is not
committed to this repository** — only the generated TypeScript dataset,
the generator script, and this record of how to verify the source are.

## Where to get the workbook

Download it from the official **TikTok Seller Academy** category-rate
page:

<https://seller-uk.tiktok.com/university/essay?knowledge_id=3315312175236897>

Do not use a copy from any other source — the generator will refuse to
run against a file that doesn't match the hash below.

## Expected file

| | |
|---|---|
| Expected SHA-256 | `6de55ce5793c69ee2d22c1f1bc7b8a4cef9555b029cfde3e899476d9830adcb5` |
| Official source URL | <https://seller-uk.tiktok.com/university/essay?knowledge_id=3315312175236897> |
| Cross-referenced against | knowledge_id=3337893683398432 (commission structure), knowledge_id=7753824408913665 (fee overview), knowledge_id=7753826522154754 (affiliate/creator commission formula) |
| Effective/source date | Not separately published on the source page — the workbook's contents were verified 31 August 2026 (see `verifiedAt` on `TIKTOK_SOURCE` in the generated file, and `/methodology`) |
| Audited shape | 343 rows; 127 rows at 5%, 216 rows at 9%; no blank cells; no duplicate category/subcategory combinations |

## Regenerating the dataset

```
python3 scripts/generate-tiktok-data.py --source "/path/to/TikTok Shop UK.xlsx"
```

The script re-verifies the SHA-256 above and re-asserts the audited shape
every time it runs, and refuses to write `src/data/tiktok.fees.ts` if
either check fails. See `scripts/generate-tiktok-data.py` for full
details.

Never hand-edit `src/data/tiktok.fees.ts` directly — regenerate it from a
verified source workbook instead.
