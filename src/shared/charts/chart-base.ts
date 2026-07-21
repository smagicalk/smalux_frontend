import { neonDivider, techAnimation } from "./echart";

/**
 * Shared animation + interaction baseline applied to every chart option via
 * `...S`. Kept in one place so a tweak to the look (easing, hover) propagates
 * to all chart factories without editing each one.
 */
export const S = techAnimation;

// neonDivider is re-exported for pages that want the top hairline on custom cards.
export { neonDivider };
