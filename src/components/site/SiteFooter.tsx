import Link from 'next/link';
import { COMPANY } from '../../lib/legal/company';

// Same clamp() in both the wordmark's font-size and the overlap math below —
// kept as one constant so they can never drift apart.
const WORDMARK_FONT_SIZE = 'clamp(4.5rem, 20vw, 18rem)';

export default function SiteFooter() {
  return (
    <footer className="w-full bg-black">
      {/* Purely decorative — the real, accessible "EasyFeezy" identity is the
          logo link in SiteHeader and the "EasyFeezy" text in the disclosure
          line below. aria-hidden + select-none/pointer-events-none keep this
          out of the accessible tree and off-limits to focus/selection, so a
          screen reader never announces the brand twice.

          Unlike a naive "crop top and bottom evenly" box, this follows the
          reference's actual mechanism: the wordmark renders at its natural
          height (top never clipped) inside an overflow-hidden strip, and the
          content below slides up over it with a negative top margin, so its
          own opaque background is what crops the letters' lower portion —
          fluid, not boxed into a fixed-height frame.

          The overlap is deliberately shallower than the reference's own
          (~9% of the wordmark's own font-size here, vs. their much deeper
          crop) — "Resend" has no descenders at all, but "EasyFeezy" has two
          — a 'y' cropped as aggressively as their reference reads as a 'v'.
          Keeping most of the descender in view preserves the cropped/flared
          look without that ambiguity. */}
      <div aria-hidden="true" className="w-full select-none overflow-hidden pointer-events-none">
        <p
          className="whitespace-nowrap text-center font-bold leading-none tracking-tighter text-[#131313]"
          style={{ fontSize: WORDMARK_FONT_SIZE }}
        >
          EasyFeezy
        </p>
      </div>

      <div className="relative bg-black" style={{ marginTop: `calc(${WORDMARK_FONT_SIZE} * -0.09)` }}>
        {/* No hard border here — a soft, centre-lit hairline instead, fading
            to nothing at both edges so the wordmark reads as bleeding
            naturally into the footer rather than being boxed off from it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-2/5"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(143,143,143,0.67) 50%, transparent)' }}
        />
        {/* A soft glow spilling down onto that hairline from the wordmark above. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[70%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(rgba(200,200,200,0.1), transparent 80%)',
            WebkitMaskImage: 'conic-gradient(from 90deg, black 0deg 180deg, transparent 180deg 360deg)',
            maskImage: 'conic-gradient(from 90deg, black 0deg 180deg, transparent 180deg 360deg)',
          }}
        />

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-[#666] md:flex-row md:items-start md:justify-between md:px-8">
          <div className="max-w-md space-y-1 text-center md:text-left">
            <p className="font-medium text-[#888]">© {new Date().getFullYear()} EasyFeezy. All rights reserved.</p>
            <p className="text-xs leading-relaxed text-[#555]">
              EasyFeezy is a trading name of Compliance Logbook Ltd, registered in England and Wales. Company number 16932013.
              Registered office: 71–75 Shelton Street, Covent Garden, London, WC2H 9JQ.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
            >
              Terms
            </Link>
            <a
              href={`mailto:${COMPANY.contactEmail}`}
              className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
            >
              {COMPANY.contactEmail}
            </a>
            <Link
              href="/methodology"
              className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
            >
              Methodology
            </Link>
            <Link
              href="/uk-online-selling-tax-guide"
              className="hover:text-[#eaeaea] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
            >
              UK Seller Tax Guide
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
