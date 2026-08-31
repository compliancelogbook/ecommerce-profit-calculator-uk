# EasyFeezy Product Roadmap

## 1. Purpose and roadmap rules

This is the canonical EasyFeezy feature and launch roadmap. It exists so that
future work — by any agent or contributor, in any session — has a durable,
version-controlled record of what's planned, what's done, and why, without
depending on conversation memory.

Rules for using this document:

- Completed work should be **checked off**, not deleted. The history of what
  shipped and when is part of the record.
- Every addition to this roadmap must include a short rationale — "why" is
  as important as "what".
- Marketplace calculations must **never** use guessed or inferred fees.
- Fee changes require official sources, verification dates and tests before
  they ship — no exceptions.
- New ideas must not delay the initial public launch unless they are legally
  or mathematically essential to it.

---

## 2. Launch gate — must happen before public release

**This section is launch work — required before EasyFeezy goes live publicly
— not post-launch scope.**

- [ ] Activate the selected Shelton Street, Covent Garden registered-office
      service.
- [ ] Confirm that the purchased service covers the registered office,
      director service address and PSC service address.
- [ ] Update the Companies House registered office, director service address
      and PSC service address.
- [ ] Add the confirmed address and final company disclosure to EasyFeezy.
- [ ] Build the contained UK HMRC seller-guidance feature:
  - [ ] Personal possessions versus trading.
  - [ ] £1,000 combined gross trading-income allowance.
  - [ ] Exceeding £1,000 does not mean the entire sales figure is taxed.
  - [ ] Marketplace reporting versus actual tax liability.
  - [ ] Separate £6,000 personal-possession CGT consideration.
  - [ ] Direct official HMRC links.
  - [ ] "General guidance, not personal tax advice" wording.
- [ ] Add a Privacy Policy.
- [ ] Add Terms of Use.
- [ ] Add a calculation disclaimer.
- [ ] Add a verified contact method.
- [ ] Decide on privacy-conscious analytics.
- [ ] Add cookie consent only if required by the final analytics or
      advertising implementation.
- [ ] Add appropriate structured data.
- [ ] Complete mobile, keyboard, accessibility, empty-field and error-state
      testing.
- [ ] Perform a final calculation and source audit.
- [ ] Deploy through Vercel.
- [ ] Connect `easyfeezy.com`.
- [ ] Redirect `easyfeezy.co.uk` to the canonical `.com` domain.
- [ ] Verify HTTPS, metadata, legal links, HMRC links and calculations in
      production.

---

## 3. Post-launch Priority 1 — connected profitability workflows

**Rationale:** isolated per-platform calculators answer "what does this fee
cost?" but not "is this product actually worth selling?" — connecting cost,
fee and advertising inputs into one scenario answers the question sellers
actually have.

### Multi-Step Profitability Scenarios

Move beyond isolated calculators by connecting:

- [ ] Product purchase or manufacturing cost.
- [ ] Quantity.
- [ ] Domestic or international sourcing.
- [ ] Inbound shipping.
- [ ] Import duty and import VAT where applicable.
- [ ] Packaging.
- [ ] Fulfilment and outbound shipping.
- [ ] Marketplace-specific charges.
- [ ] Affiliate or creator commission.
- [ ] Advertising spend.
- [ ] Customer acquisition cost.
- [ ] Target ROAS.
- [ ] Expected monthly sales volume.

Required outputs:

- [ ] Gross revenue.
- [ ] Total landed cost.
- [ ] Total marketplace fees.
- [ ] Advertising cost.
- [ ] Net profit per order.
- [ ] Profit margin.
- [ ] Break-even selling price.
- [ ] Maximum affordable advertising spend per order.
- [ ] Break-even ROAS.
- [ ] Expected monthly profit.
- [ ] Assumptions, exclusions, confidence status and source dates.

**Note:** tax, duty and VAT modelling must be carefully scoped and
source-verified before implementation — this is exactly the kind of area
where a guessed or inferred figure would be worse than no figure at all.

---

## 4. Post-launch Priority 1 — marketplace comparison

**Rationale:** sellers choosing between platforms need a like-for-like view,
not five separate tabs to reconcile by hand.

- [ ] Compare the same product across supported marketplaces using one
      shared scenario.
- [ ] Show profit, margin and total fees for each platform.
- [ ] Identify the highest-profit platform without implying it is
      universally "best".
- [ ] Show the cash and percentage difference between platforms.
- [ ] Allow different selling prices and shipping arrangements per
      marketplace.
- [ ] Include TikTok affiliate commission where entered.
- [ ] Display verification dates and material exclusions for every
      platform.
- [ ] Never compare unknown fees as though they were zero.
- [ ] Add comparison-specific tests covering inconsistent fee bases and VAT
      treatment.

---

## 5. Post-launch Priority 1 — professional exports

**Rationale:** a number on screen is useful for one person in one session; a
clean, sourced export is what a seller can actually take to an accountant,
a supplier negotiation, or a client.

### Profitability Scenario Report

- [ ] Clean EasyFeezy-branded PDF.
- [ ] Calculation date and fee-verification date.
- [ ] All user inputs.
- [ ] Platform comparison.
- [ ] Profit and break-even results.
- [ ] Assumptions, exclusions, source links and disclaimer.
- [ ] Suitable for sellers, consultants and agencies.
- [ ] Do not call it an official marketplace quotation or tax calculation.

### Additional exports

- [ ] CSV export.
- [ ] Pre-filled spreadsheet model with formulas.
- [ ] Google Sheets export later, after authentication and permission
      requirements are assessed.
- [ ] Optional professional or white-labelled reports as a future paid
      feature.
- [ ] Accessible tables and print-safe formatting.
- [ ] Deterministic export tests to ensure report values match the
      on-screen calculation.

### Copy Financial Breakdown

**Rationale:** users often need a quick portable result before requiring a
complete PDF or spreadsheet export.

- [ ] One-click copy as clean, professionally formatted plain text.
- [ ] Optional copy as CSV-formatted text.
- [ ] Include marketplace, inputs, gross revenue, every fee deduction,
      total fees, net profit and margin.
- [ ] Include assumptions, exclusions, confidence status and
      fee-verification date.
- [ ] Never represent an unknown or excluded fee as zero.
- [ ] Provide visible confirmation when copying succeeds.
- [ ] Provide an accessible fallback when clipboard permission is
      unavailable.
- [ ] Ensure copied values are generated from the same calculation result
      object shown on screen.
- [ ] Add deterministic tests proving copied values match displayed
      results.
- [ ] Keep this feature usable without an account or database.

---

## 6. Post-launch Priority 2 — saved scenarios and repeat use

**Rationale:** sellers re-run the same product's numbers repeatedly as fees
and costs change — losing that history on every visit is real friction.

- [ ] Saved products and cost profiles.
- [ ] Duplicate and revise a scenario.
- [ ] Scenario history.
- [ ] Compare current results with previous marketplace fee schedules.
- [ ] Record the fee-data version used for each saved calculation.
- [ ] Optional account system only when saved data genuinely requires it.
- [ ] Data export and deletion controls.
- [ ] Appropriate privacy and security review before storing user
      information.

### Bulk CSV Product Analysis — EasyFeezy Pro candidate

**Rationale:** established sellers need to evaluate an entire catalogue
rather than entering products individually, making this a credible paid
EasyFeezy Pro feature.

- [ ] Upload a CSV containing multiple products or SKUs.
- [ ] Publish a downloadable CSV template with documented required and
      optional columns.
- [ ] Provide column mapping rather than requiring one rigid external file
      format.
- [ ] Support product name/SKU, selling price, product cost, quantity,
      shipping charged, actual postage, marketplace and relevant platform
      options.
- [ ] Validate every row before calculation.
- [ ] Show understandable row-specific errors without failing the complete
      file.
- [ ] Preview parsed products before running calculations.
- [ ] Process valid rows through the same audited marketplace engines used
      by the individual calculators.
- [ ] Never create a second simplified calculation implementation for bulk
      files.
- [ ] Return gross revenue, total fees, net profit, margin, confidence and
      exclusions per row.
- [ ] Allow the completed analysis to be downloaded as CSV.
- [ ] Provide a summary showing profitable, loss-making, incomplete and
      excluded-fee rows.
- [ ] Add file-size, row-count and performance limits based on testing
      rather than guesswork.
- [ ] Assess formula injection, malformed files and other CSV security
      risks.
- [ ] Keep processing client-side where practical.
- [ ] If uploaded data will ever be transmitted or stored, complete a
      privacy, security and retention review before implementation.
- [ ] Add parity tests proving a CSV row returns the same result as
      entering identical data in the relevant individual calculator.
- [ ] Treat bulk analysis as a potential EasyFeezy Pro feature; pricing
      remains undecided and must be validated.

---

## 7. Post-launch Priority 2 — fee intelligence and data moat

**Rationale:** verified, versioned, sourced fee data is the hardest part of
this product to replicate — it's the actual defensibility, not any single
feature built on top of it.

- [ ] Versioned marketplace fee schedules.
- [ ] Historical effective dates.
- [ ] Official source URL and verification date for every rule.
- [ ] Automated scheduled checks of official marketplace documentation.
- [ ] A human review queue when a source changes.
- [ ] Never automatically publish a changed fee merely because a scraper or
      agent detected it.
- [ ] Regression tests before any fee-data update is released.
- [ ] Public "last verified" information.
- [ ] Optional fee-change alerts for users.
- [ ] Maintain reproducible source-generation scripts where appropriate.

EasyFeezy's defensibility comes from verified data, connected workflows,
reproducible calculations, saved scenarios and trusted exports — not from
the PDF button alone.

---

## 8. Post-launch Priority 2 — monetisation

### Affiliate partnerships

**Rationale:** revenue that doesn't depend on ads or asking sellers to pay
directly, as long as it never compromises calculation integrity.

- [ ] Investigate accounting, tax and seller-business tools.
- [ ] Potential candidates already discussed: Xero, FreshBooks, Shopify and
      Tide.
- [ ] Do not publish QuickBooks affiliate links unless a legitimate
      applicable UK programme is verified.
- [ ] No affiliate link may go live until EasyFeezy is accepted into the
      relevant programme.
- [ ] Add a clear affiliate disclosure.
- [ ] Use appropriate sponsored-link attributes.
- [ ] Keep recommendations relevant to the calculation context.
- [ ] Never allow commission to influence calculation results or editorial
      guidance.
- [ ] Investigate shipping and seller-operations affiliates: parcel-label
      providers, shipping-management platforms, fulfilment services,
      inventory-management tools and returns-management tools.
- [ ] Research candidates such as Parcel2Go and ShipStation without
      presenting them as approved partners or endorsements.
- [ ] Confirm UK programme availability, eligibility, commission terms and
      brand rules before publishing anything.
- [ ] Only display an offer where it is contextually useful to the seller.
- [ ] Never rank or recommend a provider solely because it pays a higher
      commission.
- [ ] Clearly distinguish affiliate offers from marketplace calculations.
- [ ] Do not publish financial-product or business-bank promotions without
      a separate compliance review.

### Advertising

- [ ] Reserve unobtrusive advertising positions.
- [ ] Investigate an appropriate advertising network after launch.
- [ ] Do not obstruct calculator inputs or results.
- [ ] Do not delay launch for advertising approval.
- [ ] Review consent, privacy and performance implications before adding
      advertising scripts.
- [ ] Preserve the first revenue milestone of £13.36.

### Potential paid product

- [ ] Free individual calculators for search and acquisition.
- [ ] EasyFeezy Pro for saved scenarios, connected landed-cost modelling,
      comparison, exports and bulk CSV catalogue analysis.
- [ ] Professional tier for branded or white-labelled client reports.
- [ ] Pricing remains undecided and must be validated rather than invented.

### Launch distribution and demand validation

**Rationale:** deployment alone does not produce users; distribution
should test genuine demand without spam or fabricated claims.

- [ ] Submit the production site and sitemap to Google Search Console.
- [ ] Confirm production pages can be crawled and indexed.
- [ ] Create worked comparison examples for representative £20, £50 and
      £100 products.
- [ ] Produce a clean visual showing the calculated profit difference
      across supported marketplaces.
- [ ] Ensure every marketing comparison states its inputs, assumptions,
      exclusions and fee-verification date.
- [ ] Prepare a transparent founder launch post explaining why EasyFeezy
      was built.
- [ ] Prepare an Indie Hackers launch post.
- [ ] Identify relevant Reddit communities and read each community's
      self-promotion rules before posting.
- [ ] Do not mass-post identical promotional copy.
- [ ] Prefer useful worked examples and transparent methodology over
      generic promotion.
- [ ] Create appropriately sized social assets for LinkedIn, Instagram and
      other chosen channels.
- [ ] Track calculator completions, marketplace selections and comparison
      usage using the approved privacy-conscious analytics setup.
- [ ] Define initial validation signals such as real calculator use,
      repeat visits, export usage and EasyFeezy Pro interest.
- [ ] Do not treat impressions alone as product validation.
- [ ] Do not make unsubstantiated "most accurate", "best" or savings
      claims.
- [ ] Record the existing first-revenue milestone of £13.36 without
      allowing it to distort product integrity.

**Note:** do not add a live Pro waitlist requirement yet. A waitlist would
collect personal data and must only be introduced after its purpose,
consent wording, privacy treatment and email provider are deliberately
chosen.

---

## 9. Post-launch Priority 3 — additional coverage

**Rationale:** broader coverage is valuable, but only once it can meet the
same "never guess" bar as everything already shipped.

- [ ] Vinted UK calculator.
- [ ] US marketplace and reseller tax guidance as a separately researched
      phase.
- [ ] Additional currencies only when each marketplace/country combination
      is independently verified.
- [ ] Additional marketplaces based on demand and reliable source
      availability.
- [ ] Do not assume one country's fee schedule applies internationally.

---

## 10. Separate future product — FeezyAI

Recorded here without mixing it into the EasyFeezy launch — this is a
distinct product idea, not a feature of the marketplace fee calculator.

- [ ] Possible dedicated AI model, token and compute-cost comparison
      product.
- [ ] Working brand: FeezyAI.
- [ ] Compare model input, cached-input, output and other published usage
      charges.
- [ ] Explain token limits, context windows and billing units in plain
      English.
- [ ] Scenario calculator for estimated workload cost.
- [ ] Official provider sources and effective dates.
- [ ] Scheduled source-change monitoring with human verification before
      publication.
- [ ] Account for providers changing terminology beyond "tokens".
- [ ] Separate brand, repository and legal assessment before development.

**This is not part of the EasyFeezy marketplace launch.**

---

## 11. Explicitly parked ideas

**Rationale:** naming what's deliberately out of scope prevents it from
quietly becoming an unplanned distraction later.

- [ ] Elaborate logo system.
- [ ] Additional countries and currencies.
- [ ] Native mobile application.
- [ ] Automated accounting integrations.
- [ ] User accounts before saved scenarios require them.
- [ ] Any feature that delays the verified public calculator without a
      legal or mathematical reason.

---

## 12. Maintenance log

| Date | Item added or changed | Reason | Status | Related issue/commit |
|---|---|---|---|---|
| 2026-08-31 | Created this roadmap | Following identification of connected profitability workflows and professional exports as the long-term product direction | Done | — |
| 2026-08-31 | Added clipboard export, bulk CSV analysis, seller-operations affiliate opportunities, and launch-distribution planning | External 24-hour product-plan review identified four worthwhile additions not fully captured in the original roadmap | Planned | `docs: expand EasyFeezy post-launch roadmap` |
