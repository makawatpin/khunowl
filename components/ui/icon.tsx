// Icon set recreated from design-reference/lifeos-ui.jsx (LIcon) — not imported directly.
const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  money: "M3 6h18v12H3zM3 10h18M7 14h4",
  card: "M2 6h20v12H2zM2 10h20M6 15h5",
  calendar: "M4 5h16v16H4zM4 9h16M9 3v4M15 3v4",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  box: "M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v9",
  car: "M3 15h18M5 15l2-6h10l2 6v4H5zM7 19v2M17 19v2",
  house: "M4 11 12 4l8 7v10H4zM10 21v-6h4v6",
  doc: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M16.5 16.5 21 21",
  plus: "M12 5v14M5 12h14",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  chevup: "M6 15l6-6 6 6",
  chevdown: "M6 9l6 6 6-6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  check: "M4 12.5 9 18 20 6",
  x: "M6 6l12 12M18 6 6 18",
  arrow: "M9 5l7 7-7 7",
  back: "M15 19l-7-7 7-7",
  fuel: "M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M4 11h9M16 8l3 2v9a2 2 0 0 1-4 0v-6h4",
  wrench: "M15 3a5 5 0 0 0-4 8L4 18l2 2 7-7a5 5 0 0 0 6-6l-3 3-3-3z",
  shield: "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2",
  minus: "M5 12h14",
  swap: "M4 8h15l-4-4M20 16H5l4 4",
  food: "M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 21V3c-2 1-3 4-3 7h3",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  eyeoff:
    "M3 3l18 18M10.6 5.1C11 5 11.5 5 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7c2 0 3.8-.6 5.4-1.6",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1",
  download: "M12 4v11M7 10l5 5 5-5M4 20h16",
  upload: "M12 16V5M7 10l5-5 5 5M4 20h16",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  trip: "M4 8h16v12H4zM9 8V5h6v3M4 13h16",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .5 3 2.5 3 5",
  hammer: "M13 4l7 7-3 3-7-7zM10 7l-7 7 3 3 7-7",
  phone: "M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2",
  pie: "M12 3v9h9M12 3a9 9 0 1 0 9 9",
  slip: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}) {
  const d = PATHS[name] || "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={"M" + seg} />
        ))}
    </svg>
  );
}
