/**
 * Shared between the bot config screen (client-side validation) and the
 * repository (server-side guard) — the same number, checked in two places,
 * so the rule can never be bypassed by skipping the form.
 *
 * AIEC deals are quoted at roughly an 18% margin over supplier + install
 * cost (see seed `Deal.marginAmount` vs `quotedPrice`). A bot discount above
 * this ceiling would eat into that margin far enough to risk a loss-making
 * sale, so the Quotation Engine's margin floor caps it well below 18%.
 */
export const MAX_SAFE_BOT_DISCOUNT_PCT = 15;

/** Below this, auto-resolution rises but so does the risk of a bad reply
 *  reaching a customer un-reviewed — surfaced as an explicit trade-off. */
export const LOW_CONFIDENCE_WARNING_THRESHOLD = 0.4;
