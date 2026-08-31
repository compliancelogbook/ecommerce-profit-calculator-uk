"""
Generates src/data/tiktok.fees.ts directly from the official TikTok Shop UK
commission-category workbook. This is a ONE-HOP, MECHANICAL extraction —
the source workbook is parsed byte-for-byte (via the stdlib zipfile/xml
modules, no external dependency) and the .ts array is generated directly
from it. No step retypes or manually transcribes a single value, which is
what eliminates transcription risk for this dataset (unlike the eBay
category schedule, which was hand-transcribed from a rendered page
capture).

The workbook itself is NOT committed to this repository (see
src/data/sources/README.md) — only this generator, the generated dataset,
and the expected hash/source/audit record are. Download the workbook from
the official TikTok Seller Academy category-rate page before running this:

    https://seller-uk.tiktok.com/university/essay?knowledge_id=3315312175236897

Usage:
    python3 scripts/generate-tiktok-data.py --source "/path/to/workbook.xlsx"

    # Optional: write somewhere other than src/data/tiktok.fees.ts
    python3 scripts/generate-tiktok-data.py --source "/path/to/workbook.xlsx" --out "/path/to/out.ts"

Do not hand-edit src/data/tiktok.fees.ts, and do not regenerate it from
anything other than a workbook downloaded from the official page above —
if the source workbook ever changes, re-download it and re-run this
script.

The script refuses to run if the source workbook's SHA-256 doesn't match
the hash the workbook was supplied and verified against (see
src/data/sources/README.md and /methodology), and refuses to emit a file
if the extracted data doesn't match the audited shape (343 rows, no
blanks, only 5%/9% rates, no duplicate category/subcategory combinations,
127 rows at 5% and 216 at 9%).
"""
import argparse
import zipfile
import xml.etree.ElementTree as ET
import json
import re
import sys
import hashlib
from pathlib import Path
from collections import Counter

NS = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
EXPECTED_SHA256 = '6de55ce5793c69ee2d22c1f1bc7b8a4cef9555b029cfde3e899476d9830adcb5'
OFFICIAL_SOURCE_URL = 'https://seller-uk.tiktok.com/university/essay?knowledge_id=3315312175236897'

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT_TS = REPO_ROOT / 'src' / 'data' / 'tiktok.fees.ts'


def col_to_index(cell_ref):
    letters = ''.join(c for c in cell_ref if c.isalpha())
    idx = 0
    for c in letters:
        idx = idx * 26 + (ord(c.upper()) - ord('A') + 1)
    return idx - 1


def parse_xlsx(path):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall('main:si', NS):
            texts = si.findall('.//main:t', NS)
            shared.append(''.join((t.text or '') for t in texts))

    root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    sheet_data = root.find('main:sheetData', NS)

    rows_out = []
    max_col = 0
    for row in sheet_data.findall('main:row', NS):
        row_cells = {}
        for c in row.findall('main:c', NS):
            ref = c.get('r')
            ctype = c.get('t')
            col_idx = col_to_index(ref)
            max_col = max(max_col, col_idx)
            v = c.find('main:v', NS)
            is_ = c.find('main:is', NS)
            if ctype == 's' and v is not None:
                val = shared[int(v.text)]
            elif is_ is not None:
                texts = is_.findall('.//main:t', NS)
                val = ''.join((t.text or '') for t in texts)
            elif v is not None:
                val = v.text
            else:
                val = ''
            row_cells[col_idx] = val
        rows_out.append([row_cells.get(i, '') for i in range(max_col + 1)])
    return rows_out


# Known abnormal source characters that get a tested display alias without
# mutating the underlying source value — see the `subcategory` doc comment
# in the generated interface.
ASCII_ALIASES = {
    'Ǫuartz Watches': 'Quartz Watches',  # source uses U+01EA (Ǫ), not a plain 'Q'
}


def slugify(s):
    s = ASCII_ALIASES.get(s, s)
    s = s.upper()
    s = re.sub(r"[^A-Z0-9]+", '_', s)
    s = re.sub(r"_+", '_', s).strip('_')
    return s


def ts_string(s):
    # json.dumps produces a valid double-quoted JS/TS string literal with
    # correct escaping (quotes, backslashes) and non-ASCII characters encoded
    # as \uXXXX — so the literal odd "Ǫ" character survives byte-for-byte
    # while the generated .ts file itself stays plain ASCII in any editor.
    return json.dumps(s, ensure_ascii=True)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Generate src/data/tiktok.fees.ts from the official TikTok Shop UK commission workbook.',
        epilog=f'Download the workbook from {OFFICIAL_SOURCE_URL} — the official TikTok Seller Academy category-rate page.',
    )
    parser.add_argument(
        '--source',
        required=True,
        type=Path,
        help='Path to the source .xlsx workbook, downloaded from the official TikTok Seller Academy category-rate page (see --help epilog / src/data/sources/README.md).',
    )
    parser.add_argument(
        '--out',
        type=Path,
        default=DEFAULT_OUT_TS,
        help=f'Where to write the generated TypeScript file (default: {DEFAULT_OUT_TS}).',
    )
    return parser.parse_args()


def main():
    args = parse_args()
    source_xlsx = args.source
    out_ts = args.out

    if not source_xlsx.is_file():
        print(f'Source workbook not found: {source_xlsx}', file=sys.stderr)
        print(f'Download it from the official TikTok Seller Academy category-rate page: {OFFICIAL_SOURCE_URL}', file=sys.stderr)
        sys.exit(1)

    raw = source_xlsx.read_bytes()
    actual_sha = hashlib.sha256(raw).hexdigest()
    if actual_sha != EXPECTED_SHA256:
        print(f'SHA-256 MISMATCH: expected {EXPECTED_SHA256}, got {actual_sha}', file=sys.stderr)
        print('Refusing to generate from an unverified/altered workbook.', file=sys.stderr)
        print(f'Re-download from the official page: {OFFICIAL_SOURCE_URL}', file=sys.stderr)
        sys.exit(1)

    rows = parse_xlsx(source_xlsx)
    header, data = rows[0], rows[1:]
    assert [c.strip() for c in header] == ['Category', 'Sub-category', 'Commission Rate'], header

    assert len(data) == 343, f'expected 343 rows, got {len(data)}'
    for i, r in enumerate(data):
        assert all(c.strip() != '' for c in r), f'blank cell in row {i}: {r}'
    rates = set(r[2] for r in data)
    assert rates == {'0.05', '0.09'}, rates
    combos = [(r[0], r[1]) for r in data]
    assert len(set(combos)) == len(combos), 'duplicate category/subcategory combo found'
    rc = Counter(r[2] for r in data)
    assert rc['0.05'] == 127 and rc['0.09'] == 216, rc

    seen_ids = set()
    out_rows = []
    for cat, sub, rate in data:
        display = ASCII_ALIASES.get(sub)
        id_ = f'{slugify(cat)}__{slugify(sub)}'
        assert id_ not in seen_ids, f'duplicate generated id: {id_}'
        seen_ids.add(id_)
        out_rows.append((id_, cat, sub, display, rate))

    lines = []
    lines.append('// AUTO-GENERATED by scripts/generate-tiktok-data.py from the SHA-256-verified')
    lines.append('// TikTok Shop UK commission workbook (see /methodology for the verification')
    lines.append('// record). Do not hand-edit this array — regenerate it via that script if the')
    lines.append('// source workbook ever changes.')
    lines.append('//')
    lines.append(f'// Source SHA-256: {EXPECTED_SHA256}')
    lines.append("import type { SourceRef } from './types';")
    lines.append('')
    lines.append('export interface TikTokCategoryRule {')
    lines.append('  /** Stable internal identifier, derived from category + subcategory. */')
    lines.append('  id: string;')
    lines.append('  category: string;')
    lines.append(
        '  /** Verbatim from the source workbook — never silently corrected, even where '
        'the source text is visibly unusual (see subcategoryDisplay). */'
    )
    lines.append('  subcategory: string;')
    lines.append(
        '  /** Present only when it differs from `subcategory` — a tested display alias, '
        'not a mutation of the source value. */'
    )
    lines.append('  subcategoryDisplay?: string;')
    lines.append('  rate: 0.05 | 0.09;')
    lines.append('  source: SourceRef;')
    lines.append('}')
    lines.append('')
    lines.append('export const TIKTOK_SOURCE: SourceRef = {')
    lines.append("  platform: 'TIKTOK',")
    lines.append("  sellerMarket: 'GB',")
    lines.append("  feeType: 'commission',")
    lines.append("  currency: 'GBP',")
    lines.append(
        f"  conditions: {ts_string('Commission rate is inclusive of applicable VAT — no separate UK VAT is added on top.')},"
    )
    lines.append('  effectiveDate: null,')
    lines.append(
        f"  url: {ts_string('https://seller-uk.tiktok.com/university/essay?knowledge_id=3315312175236897')},"
    )
    lines.append(f"  verifiedAt: {ts_string('2026-08-31')},")
    lines.append("  verificationStatus: 'AUDIT_VERIFIED',")
    lines.append(
        '  notes: '
        + ts_string(
            "Sourced from the official TikTok Shop UK commission-category workbook, downloaded from TikTok "
            "Seller Academy and supplied directly for this build (SHA-256 verified byte-for-byte against the "
            "sender's own hash before any row was encoded; 343 rows mechanically extracted from the source .xlsx "
            "by script, not hand-retyped, eliminating transcription risk). Cross-referenced against TikTok Seller "
            "Academy essay pages knowledge_id=3337893683398432 (commission structure) and "
            "knowledge_id=7753824408913665 (fee overview)."
        )
        + ','
    )
    lines.append('};')
    lines.append('')
    lines.append('export const TIKTOK_CATEGORIES: TikTokCategoryRule[] = [')
    for id_, cat, sub, display, rate in out_rows:
        parts = [f'{{ id: {ts_string(id_)}, category: {ts_string(cat)}, subcategory: {ts_string(sub)}']
        if display:
            parts.append(f', subcategoryDisplay: {ts_string(display)}')
        parts.append(f', rate: {rate}, source: TIKTOK_SOURCE }},')
        lines.append('  ' + ''.join(parts))
    lines.append('];')
    lines.append('')

    out_ts.write_text('\n'.join(lines), encoding='utf-8', newline='\n')

    print(f'Wrote {len(out_rows)} rows to {out_ts}')
    print('All integrity assertions passed: 343 rows, 0 blanks, rates={0.05,0.09} only,')
    print('0 duplicate category/subcategory combos, 0 duplicate generated ids,')
    print(f'127 x 5% + 216 x 9% = {rc["0.05"]} + {rc["0.09"]}.')


if __name__ == '__main__':
    main()
