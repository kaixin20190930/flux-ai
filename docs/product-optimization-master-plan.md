# Product Optimization Master Plan

This document combines the short-term execution plan and the broader product optimization plan into one trackable list.

## Status Legend

- `待办` = not started
- `进行中` = actively being worked on
- `部分完成` = some sub-items are done, but the task is not finished
- `已完成` = done and verified
- `阻塞` = waiting on an external dependency

## Short-Term Plan

### 1. Revenue Math Stabilization

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| S1 | Keep model point costs in one shared config. | 已完成 | Update if a second source of truth is introduced later. |
| S2 | Verify frontend display, pricing page, and Worker deductions match. | 已完成 | Update if any display, pricing, or deduction path diverges. |
| S3 | Track cost per successful generated image. | 已完成 | Update if the success-cost metric stops appearing in reporting. |

### 2. Search Foundation

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| S4 | Keep `sitemap.xml` and `robots.txt` live. | 已完成 | Update only if either file changes or breaks. |
| S5 | Add page-specific metadata for the highest-value pages. | 已完成 | Update if one of the highest-value pages loses its intentional metadata again. |
| S6 | Prioritize helpful pages over thin AI-generated content. | 已完成 | Update if weak pages start competing with the main workflow again. |

### 3. Paid Conversion

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| S7 | Verify Stripe checkout session creation. | 部分完成 | Update when checkout creation is stable in staging and production. |
| S8 | Verify webhook fulfillment for credits or subscription state. | 部分完成 | Update when fulfillment is confirmed end to end. |
| S9 | Verify failed generations do not silently consume paid value. | 已完成 | Update if a failure path starts charging users again. |

### 4. Product-Photo Execution

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| S10 | Keep the core product-photo workflow stronger than the older routes. | 已完成 | Update if prompt, batch, download, copy, or remix flows drift again. |
| S11 | Keep scenario pages on shared defaults for the main traffic pages. | 部分完成 | Update when the main scenario pages all use the same default logic. |
| S12 | Keep GA4 and custom growth events aligned with logged-in attribution. | 已完成 | Update if route view, user_id, or custom event timing drifts again. |

## Broader Product Optimization Plan

### 30-Day Plan

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| P1 | Finish one complete paid workflow for AI Product Photo Generator. | 部分完成 | Update when upload, generation, download, history, and upgrade are all working smoothly. |
| P2 | Add product image upload as the first step of the workflow. | 部分完成 | Update when upload is stable and used in the main path. |
| P3 | Support product-background and lifestyle-scene generation. | 部分完成 | Update when both scene types are available in the main flow. |
| P4 | Provide presets for Amazon, Shopify, Etsy, TikTok Shop, and Instagram. | 部分完成 | Update when the presets are covered and verified. |
| P5 | Deliver 4-image batch output for paid users. | 已完成 | Update if paid batch output stops being reliable or tracked. |
| P6 | Add history, download, and remix entry points. | 已完成 | Update if users lose the direct reuse path. |
| P7 | Support free trial generation, then registration and credit/subscription upgrade. | 部分完成 | Update when the trial-to-paid handoff is measurable. |
| P8 | Align content pages with the same workflow and search intent. | 部分完成 | Update when generator, photography, and prompt pages all route into the core tool path. |
| P9 | Clean up duplicate pages and route weak variants into stronger pages. | 部分完成 | Update when remaining duplicates are clearly intentional or redirected. |

### 60-Day Plan

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| P10 | Expand the product-photo workflow only if conversion is healthy. | 待办 | Update when the core workflow shows healthy usage and retention. |
| P11 | Add subscription tiers around batch generation, priority queue, history, and reduced ads. | 待办 | Update when pricing and entitlement design is ready. |
| P12 | Separate reporting for ad revenue pages vs tool conversion pages. | 待办 | Update when reporting can isolate each page class cleanly. |
| P13 | Compare image model providers and route expensive models behind higher point costs. | 待办 | Update when model-cost comparisons are complete. |
| P14 | Translate only proven English pages into priority languages. | 待办 | Update when English pages prove conversion and traffic worth translating. |

### 90-Day Plan

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| P15 | Position the site as an AI image generator and editor platform, not only a Flux wrapper. | 待办 | Update when the brand and product surface support a broader identity. |
| P16 | Build a focused tool matrix around profitable image workflows. | 待办 | Update when the highest-value workflows are clear. |
| P17 | Add prompt/example galleries that drive both AdSense revenue and tool usage. | 待办 | Update when the galleries are integrated into traffic and conversion flows. |
| P18 | Use behavior data to choose the second vertical workflow, such as YouTube thumbnails or social ads. | 待办 | Update when enough behavior data supports the next bet. |

## Page-System Optimization Plan

| ID | Task | Status | Update Trigger |
| --- | --- | --- | --- |
| O1 | Keep the core pages as full products: product-photo, create, pricing. | 部分完成 | Update when all three pages support the full workflow and billing loop. |
| O2 | Keep scenario pages as focused scenario pages with one clear job. | 部分完成 | Update when each scenario page routes users into the core workflow cleanly. |
| O3 | Treat SEO landing pages as traffic entry points, not full tools. | 部分完成 | Update when landing pages are consistent and conversion-oriented. |
| O4 | Unify visual shell, CTA style, spacing, and background tone. | 部分完成 | Update when landing pages feel like one product family. |
| O5 | Standardize the form model: product type, use case, platform preset, ratio, size, background, scene, lighting, exclusions. | 已完成 | Update if the shared controls stop covering the common scenarios. |
| O6 | Ensure output expectations are clear: generate, copy prompt, download, batch variations, remix history. | 已完成 | Update if any core page loses these clear actions or routes. |
| O7 | Merge or de-emphasize nearly identical SEO pages. | 部分完成 | Update when overlapping `generator` / `creator` / `photo` / `picture` / `product` / `ecommerce` variants are reduced. |

## How To Update Status

When a task changes, update only the row status and the trigger note if needed.

Recommended status flow:

1. `待办` -> `进行中`
2. `进行中` -> `部分完成` or `已完成`
3. `部分完成` -> `已完成`
4. `进行中` -> `阻塞` only if an external dependency stops progress

## Current Snapshot

- The product-photo core workflow is stronger than before.
- The shared SEO shell is in place for the main traffic pages.
- The homepage now has its own page-level metadata instead of relying only on layout defaults.
- The auth page now has dedicated metadata for sign-in and conversion sharing.
- GA4 and custom growth reporting are wired.
- Legacy generation naming is now kept for comparison only.
- Revenue math now has a visible success-cost metric in the growth dashboard.
- Failed generations now complete without silently consuming paid value, and successful generations write `points_used` only after the image is actually produced.
- The legacy purchase points entry now also writes into the transaction ledger instead of relying on a separate `purchases` table.
- Paid image generations now finalize the user balance, transaction row, and generation history in one atomic commit.
- High-intent SEO pages now use specific default prompts instead of generic fallback text.
- Several broad product-image landing pages now use more concrete ecommerce scenarios and example prompts.
- The most generic ecommerce/product-image landing pages now point at more specific listing-style prompts.
- Marketplace, listing, background, and Etsy landing pages now describe more concrete output examples.
- The product-photography ideas page now frames studio, lifestyle, and ad directions with clearer reusable prompts.
- The product-photography prompts page now uses clearer listing, lifestyle, and social ad prompt examples.
- The product-photo and ecommerce-image generators now use slightly more concrete storefront-ready language.
- AI product photography, AI ecommerce image, white background, Instagram, and ecommerce product image pages now use more reuse-oriented commercial phrasing.
- Lifestyle, marketplace, and the general product-image generator now also use more reuse-oriented commercial phrasing.
- Amazon, product listing, and ecommerce photo generator pages now call out Amazon or store reuse more explicitly.
- Shopify and TikTok Shop pages now call out store reuse or paid/organic reuse more explicitly.
- The AI product image generator now calls out reuse in listings, storefronts, and social ads more clearly.
- The core product-photo page now advertises history, remix, and download entry points in structured data.
- The product-photography prompts page now names Amazon, Shopify, TikTok, and Instagram examples more explicitly.
- The AI product photography page now calls out listings, storefronts, and ads more explicitly.
- The AI ecommerce photography and AI background generator pages now call out reuse across listings, storefronts, and ads more explicitly.
- The main product-photo tool now uses more direct button and section labels for generation, bundles, pricing, and related use cases.
- The shared SEO shell now uses more direct example and quick-start labels across landing pages.
- The shared SEO shell now also uses a more direct final CTA path from inspiration into creation.
- The shared SEO shell now uses shorter primary CTA and related-use-case labels.
- The shared SEO shell now uses more direct creation and generator labels in its remaining CTA copy.
- The shared SEO shell now uses creation vocabulary instead of workflow vocabulary in its explanatory text.
- The main product-photo page now also uses generator/generation wording in its remaining commerce copy.
- The shared shell and main generator now use generator/setup wording in the remaining visible labels.
- The remaining visible page headers are still being normalized away from workflow wording where users see them.
- Several top-traffic pages now call themselves generators instead of workflows in visible page copy.
- The last visible product-photo structured-data wording now also uses generator language.
- The remaining related-page titles now point to the shared generator instead of the old workflow phrasing.
- The last visible related-page titles now point to the shared generator as well.
- The pricing success page now points users to the shared generator instead of the older workflow label.
- The main product-photo page now uses more direct section titles for batch directions, prompt patterns, and the final CTA.
- The visible workflow wording on the main product-photo surface has been normalized; only internal tracking identifiers still keep legacy names for compatibility.
- The main product-photo hero now includes a compact capability strip that makes upload, batch generation, download, and remix affordances obvious at a glance.
- The batch area now spells out output expectations more clearly, so download, open, copy, and remix actions are easier to understand before users click.
- The product-photo builder now treats background, lighting, and exclusions as first-class controls, and the presets, prompt preview, and bundles carry those details through.
- The shared SEO page now carries scene, background, lighting, and exclusion defaults into the generated prompt, so key entry pages start from the same output model.
- The main SEO entry pages for Amazon, Shopify, Instagram, TikTok Shop, white background, lifestyle, and general product-image searches now all start from the same scene/background/lighting/exclusion skeleton.
- The broader ecommerce/product-image pages now also share that same skeleton, so general, AI-prefixed, and marketplace-flavored entry points begin from the same prompt model.
- The remaining product-photography idea and background pages now also use that same skeleton, so nearly all high-intent SEO entry points begin from a shared prompt structure.
- The shared form model is now standardized across the core generator and the main SEO entry pages, including product type, use case, platform preset, ratio, background, scene, lighting, and exclusions.
- The shared SEO shell now also records the same default scene data in its schema and analytics, so the page family is aligned in both presentation and measurement.
- The shared SEO shell now also uses "shared generator" CTA wording consistently, so the entry pages sound like one product family instead of several near-duplicates.
- The shared SEO shell now also normalizes repeated related-link labels to the shared generator wording, which reduces a little more duplicate page noise in the page family.
- The shared SEO shell now also keeps the related-use-case card titles normalized in the rendered UI, so the visible landing page copy matches the shared generator wording consistently.
- The shared SEO shell now also normalizes related-use-case click labels in analytics, so the reporting side matches the same shared-generator wording.
- The remaining SEO entry pages now also use `Open shared generator` in their visible related-card titles, which clears out the last obvious old generator phrasing from the page family.
- The SEO entry page source files now also match that same shared-generator wording, so the codebase no longer keeps the old generator title around in those related blocks.
- The shared SEO shell now also filters the shared-generator entry out of the quick-start and related-use-case lists, so the page family shows fewer duplicate navigation choices.
- The shared SEO shell now also deduplicates related pages by title and href, so accidental repeat entries do not leak back into the landing UI.
- The shared SEO shell now also filters out the shared generator by path, so the duplicate-entry guard still works even if the page title changes later.
- The source files for the SEO entry pages now also remove the shared-generator related-page item entirely, so the duplicate entry is gone from both UI and configuration.
- The shared SEO shell now only needs a path-level guard for the shared generator entry, which keeps the related-page cleanup logic simpler and easier to maintain.
- The product-photography ideas page now gives users a direct `Create Example` path, which makes the ideas layer more likely to turn into real generation.
- The product-photography prompts page now also gives users a direct `Create Example` path, which keeps the prompt layer close to actual generation.
- The Etsy product-photo ideas page now also gives users a direct `Create Example` path, which makes the handmade-listing content easier to convert into a real prompt.
- The AI product image, AI product photography, and lifestyle product photo pages now also give users a direct `Create Example` path, which shortens the step from content to generation on three more high-intent pages.
- The AI ecommerce image, AI ecommerce photography, Shopify product photo, and Amazon product image pages now also give users a direct `Create Example` path, which shortens the step from content to generation on four more high-intent pages.
- The marketplace product image, product listing image, and ecommerce image pages now also give users a direct `Create Example` path, which pulls three more listing-oriented pages closer to generation.
- The AI background, white background, and Instagram product photo pages now also give users a direct `Create Example` path, which brings three more high-intent pages closer to actual generation.
- The product image and ecommerce product image pages now also give users a direct `Create Example` path, which pulls the last two main general-purpose listing pages closer to generation.
- The remaining high-intent content pages now also give users a direct `Create Example` path, so the content layer is consistently one click from actual generation.
- The main product-photo generator now uses `Generate` and `Open shared generator` wording in its core hero and bottom CTA, which keeps the primary product surface aligned with the shared-page vocabulary.
- The main product-photo generator now also uses `Compare pricing` wording in its batch bridge, which keeps the point/price handoff more consistent.
- The main product-photo generator now also uses `Batch pricing` wording for the batch gate, which keeps the paid-upgrade path more explicit.
- The remaining product-photo CTA wiring now uses generator terminology consistently, including the batch pricing bridge back to the main tool.
- The product-photo reference image now carries across to the create draft and is reflected in the generation prompt, so the uploaded context survives the page jump.
- The create page now shows the carried reference image as a visible draft element instead of hiding it in local state.
- Recent generation deduping now keeps reference-image variants separate, so different uploaded contexts do not collapse into one entry.
- Reference image metadata now persists into generation history, and the dashboard history list shows the attached reference filename inline.
- The history detail panel and compact grid cards now also surface reference image metadata for quick review.
- The dashboard history list is now denser and easier to scan without wasting vertical space.
- The legacy users-id migration has been reduced to a safe no-op so local D1 migrations can continue cleanly.
- The production deployment script now applies the D1 migration chain against the production environment explicitly.
- The auth-success, payment-success, hub, dashboard, and admin routes are now marked noindex so utility pages do not compete in search.
- Trial generation success and trial exhaustion are now tracked as explicit growth events so the free-to-paid handoff can be measured.
- The auth page and pricing page now show a trial-bridge message when users arrive from the free-generation flow.
- The create page now offers a direct history entry point after generation so logged-in users can continue from prior results.
- The dashboard now gives direct return-to-create and top-up actions, and shows reference image metadata in the recent history list.
- The main product-photo hero now includes a direct history entry point, so users can jump back into prior work without hunting for it.
- The create-page recent generations area is now denser and includes a direct history link, so reuse takes less visual space.
- The payment success page now shows an explicit worker-confirmation badge when credits are actually fulfilled, so post-purchase status is easier to trust.
- The payment success page now re-pulls the Stripe session status alongside the balance refresh, so the fulfillment badge can update without a manual reload.
- Stripe fulfillment checks are now scoped by both session id and user id, which makes the idempotency guard safer.
- The payment success page now also shows the fulfillment timestamp when worker crediting has completed, which makes the receipt easier to audit.
- The purchase history rows now surface the Stripe session id and an explicit confirmed badge, which makes the payment record easier to scan later.
- The create page now shows an explicit trial-exhausted bridge with sign-up and credit actions, which makes the free-to-paid handoff harder to miss.
- The auth page now defaults trial-bridge visitors into registration instead of login, which removes one extra decision at the handoff.
- Trial-bridge clicks now preserve a return-to-origin redirect, which keeps the user from losing the page they came from after auth.
- The main generate button now routes exhausted free users into auth or pricing instead of leaving them on a dead-end CTA.
- The main generate button and helper copy now say exactly whether the next step is sign up or buy credits, which makes the handoff easier to understand.
- The auth success page now shows a visible continue button and tracks the successful auth handoff, which makes the bridge easier to measure.
- The auth success redirect now carries an explicit return marker, and the create page now shows a resume banner after sign-up so the draft handoff is visible.
- The create-page auth return banner now includes a direct continue action that scrolls users back to the main generate control.
- The payment success page now auto-polls the checkout session for a short window, which makes delayed worker fulfillment surface without manual refreshing.
- The payment success page now records which confirmation path actually landed, which makes webhook and refresh behavior easier to compare.
- The Stripe webhook now logs fulfillment outcome details, which makes duplicate delivery and first-time confirmation easier to distinguish.
- The payment success page now tracks fulfillment with a live ref during polling, which keeps the auto-confirm loop from drifting on stale state.
- The payment success page now gives confirmed users a clear ready-state banner and a stronger create-now CTA, which shortens the final handoff.
- The payment success page now auto-continues confirmed users back into creation after a short pause, which reduces the last bit of friction.
- The payment success return now marks the create page as a post-purchase entry, which keeps the follow-up banner aligned with the actual journey.
- The create page now auto-focuses the prompt for returning buyers and auth returns, which makes the next action immediate.
- The create-page post-purchase banner now says the new points are ready and invites a prompt-first next step.
- The payment success page now shows the resolved package label alongside the point total, which makes the purchase receipt easier to read.
- The checkout session now carries a package key through Stripe, so the success page can read the purchased tier directly.
- The success page now types the package key as a Stripe package enum, which keeps the receipt data tighter.
- The payment success page now shows a visible countdown before returning to creation, which keeps the auto-continue feeling intentional.
- The payment success page now guards the auto-continue trigger so the redirect and tracking only fire once.
- The payment success page now uses `replace` for the automatic return to creation, so the browser back button stays cleaner.
- The payment success page now cancels the auto-continue if the user chooses a manual next step, which keeps the handoff calm.
- The payment success page now marks the generator link as a post-purchase return as well, so every follow-up path lands in the same analysis bucket.
- The payment success page now surfaces whether the Worker has already confirmed the credit transfer.
- The Stripe points guide now includes the confirmed-transfer checkpoint in its acceptance test.
- The checkout-session helpers and Stripe webhook fulfillment route now have focused unit coverage, which makes the remaining production verification gap easier to isolate.
- The create page now exposes an explicit reference-image upload, paste, and clear step before prompt generation, which makes the upload-first workflow visible on the main execution page instead of only on the product-photo surface.
- The main product-photo generator now uses tighter CTA wording like `Generate 4` and `Regenerate`, which keeps the batch actions and rerun states more direct.
- The main AI image generator now also uses `Regenerate` for its recent-item rerun action, which keeps the broader generator suite on the same wording.
- The main AI image generator now also uses `Load setup` and `Copy setup` wording for recent-result actions, which makes the intent of those utility buttons easier to scan.
- The main AI image generator recently compacted its recent-generation header and setup actions further, which reduces the horizontal footprint of the result area.
- The main AI image generator also shortened the top result toolbar labels to `Prompt`, `Image URL`, `Download`, `Share link`, and `Credits`, which makes the action strip read faster.
- The main AI image generator now uses `Recent` and `History` instead of the longer recent-results phrasing, which trims a little more visual weight from the result section.
- The main AI image generator now shortens the setup summary card to `Setup` with a `Copy` action, which keeps the supporting panel quieter.
- The main AI image generator now shortens the result toolbar further with `URL`, `Share`, and `Setups`, which trims another bit of visual weight.
- The main AI image generator now also tightens padding and gaps in the result toolbar and recent-generation cards, which makes the whole right column denser.
- The main AI image generator now shortens the setup field labels to `Size`, `Excl.`, `Tone`, and `Cost`, which keeps the left summary card from feeling wordy.
- The main AI image generator now shortens the free-limit recovery copy, which makes the gating message read more like a status nudge than a paragraph.
- The main AI image generator now shortens the free-access status lines to `Free to try.` and `Daily limit reached.`, which keeps the credit card quieter.
- The main AI image generator now also shortens the button hints to `Add credits to keep generating.`, `Sign in to unlock this model.`, and `Sign up to continue.`, which keeps the guidance line lighter.
- The main AI image generator now shortens the shortcut hint to `Ctrl/Cmd + Enter to generate`, which keeps the microcopy simpler.
- The main AI image generator now shortens the free counter and free sign-up CTA to `Free:` and `Sign up`, which makes the left-side state card read more like a status block.
- The main AI image generator now shortens the recent-item metadata to `Pts:` and `Free`, and the prompt copy button to `Prompt`, which trims a little more text from each result row.
- The main AI image generator now shortens the recent-item detail labels to `Excl.` and `Tone`, which keeps each history row a little more compact.
- The main AI image generator now shortens the main button hints to `Sign up to use it`, `Sign up`, `Generate (n free)`, `Buy credits`, `Add credits.`, `Sign in to unlock it.`, and `Sign up.`, which keeps the gating language very direct.
- The main AI image generator now shortens the free-limit recovery copy to `Keep this draft and get credits.`, which keeps the recovery state tighter.
- The main AI image generator now shortens the input labels and help copy to `Exclusions` / `Tone` plus shorter optional guidance, which keeps the left form section less wordy.
- The main AI image generator now shortens the tone preset heading and the free-test recovery state again, which keeps the supporting microcopy tighter.
- The main AI image generator now shortens the current bundle action to `Setup` / `Copied`, which removes one more redundant word from the result toolbar.
- The main AI image generator now shortens the tone helper and preset heading once more to `Keeps prompt aligned.` and `Tones`, which trims a little more from the form section.
- GA4 is now confirmed in the root layout with the exact measurement id `G-TH3L4SZ1R0`, and route-level `page_view` plus logged-in `user_id` sync remain wired through the shared analytics component.
- The main remaining work is completion, validation, and conversion hardening.
