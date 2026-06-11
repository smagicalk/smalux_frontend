export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartSeries = {
  name: string;
  values: number[];
  color: string;
};

type ChartDomain = {
  min: number;
  max: number;
};

export function toPolylinePoints(
  values: number[],
  width = 100,
  height = 40,
  padding = 4,
  domain?: ChartDomain
) {
  const max = domain?.max ?? Math.max(...values, 1);
  const min = domain?.min ?? Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  return values
    .map((value, index) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(value, 100));
}
