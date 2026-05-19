import type { DailyClick } from "@acuvis-demo/shared";

type Props = {
  data: DailyClick[];
  width?: number;
  height?: number;
};

export function Sparkline({ data, width = 120, height = 32 }: Props) {
  if (data.length === 0) {
    return <div className="text-xs text-slate-400">no clicks yet</div>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = height - (d.count / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-indigo-500">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
