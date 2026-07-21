/**
 * Minimal local type declaration for uPlot (the package ships no types and
 * @types/uplot is not installed). We only type the surface our wrappers use.
 */
declare module "uplot" {
  export type AlignedData = (number | null)[][];

  export interface Options {
    width?: number;
    height?: number;
    series?: unknown[];
    axes?: unknown[];
    scales?: unknown;
    grid?: unknown;
    legend?: unknown;
    cursor?: unknown;
    padding?: unknown;
    hooks?: unknown;
    [key: string]: unknown;
  }

  export default class uPlot {
    constructor(opts: Options, data: unknown[][], target: HTMLElement | ((self: uPlot) => HTMLElement));
    setData(data: unknown[][]): void;
    setSize(opts: { width: number; height: number }): void;
    destroy(): void;
    [key: string]: unknown;
  }
}
