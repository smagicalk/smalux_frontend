/**
 * Ambient override for uplot-react. The package's runtime is a UMD bundle
 * that exports a *named* `UplotReact` (exports["UplotReact"] = ...), but its
 * shipped index.d.ts only declares a default export. That mismatch breaks
 * `import { UplotReact }`. This declaration aligns the types with the
 * runtime so the named import type-checks.
 */
declare module "uplot-react" {
  import type { ComponentType } from "react";
  import type { Options, AlignedData } from "uplot";

  export interface UplotReactProps {
    options: Options;
    data: AlignedData;
    onCreate?(chart: unknown): void;
    onDelete?(chart: unknown): void;
    [key: string]: unknown;
  }

  export const UplotReact: ComponentType<UplotReactProps>;
  export default UplotReact;
}
