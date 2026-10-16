import type { WeekCount } from "@/lib/progress";

// Plain SVG drawn on the server: no chart library and no client JavaScript.
// The viewBox is in made-up units; the SVG scales to its container's width.
const SLOT = 40; // horizontal space per week
const BAR = 24;
const TOP = 16; // room for the count above the tallest bar
const BASELINE = 110;
const HEIGHT = 130;

export function WeeklyBarChart({ weeks }: { weeks: WeekCount[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.count));
  const width = weeks.length * SLOT;
  // Screen readers get this sentence instead of the shapes.
  const label = `Workouts completed per week: ${weeks
    .map((week) => `week of ${formatWeek(week.weekStart)}, ${week.count}`)
    .join("; ")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="w-full text-zinc-500"
    >
      <line
        x1={0}
        x2={width}
        y1={BASELINE}
        y2={BASELINE}
        className="stroke-zinc-300 dark:stroke-zinc-700"
      />
      {weeks.map((week, i) => {
        const height = (week.count / max) * (BASELINE - TOP);
        const center = i * SLOT + SLOT / 2;
        return (
          <g key={week.weekStart}>
            <rect
              x={center - BAR / 2}
              y={BASELINE - height}
              width={BAR}
              height={height}
              rx={2}
              className="fill-zinc-800 dark:fill-zinc-200"
            />
            {week.count > 0 && (
              <text
                x={center}
                y={BASELINE - height - 4}
                textAnchor="middle"
                fontSize={10}
                className="fill-current"
              >
                {week.count}
              </text>
            )}
            <text
              x={center}
              y={HEIGHT - 6}
              textAnchor="middle"
              fontSize={9}
              className="fill-current"
            >
              {formatWeek(week.weekStart)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// "2026-10-12" → "Oct 12". Read as UTC so the date doesn't shift a day.
function formatWeek(weekStart: string) {
  return new Date(`${weekStart}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
