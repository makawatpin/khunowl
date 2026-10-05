"use client";

import { avatarInitial } from "@/lib/domain/trips";

/** Ported from design-reference/lifeos-trips.jsx (Av/AvStack/PChip) — a trip
 * member's avatar is just a colored initial, not a photo. */
export interface TripPerson {
  id: string;
  name: string;
  color: string;
}

export function Avatar({ person, size = 28 }: { person: TripPerson; size?: number }) {
  return (
    <span className="av" style={{ width: size, height: size, background: person.color, fontSize: size * 0.42 }}>
      {avatarInitial(person.name)}
    </span>
  );
}

export function AvatarStack({ people, size = 26 }: { people: TripPerson[]; size?: number }) {
  const shown = people.slice(0, 5);
  const extra = people.length - 5;
  return (
    <span className="avs">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size={size} />
      ))}
      {extra > 0 && (
        <span className="av" style={{ width: size, height: size, background: "var(--panel-2)", color: "var(--ink-soft)", fontSize: size * 0.38 }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

export function PersonChip({
  person,
  on,
  onClick,
  disabled,
}: {
  person: TripPerson;
  on?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={"chip pchip" + (on ? " on" : "")} onClick={onClick} disabled={disabled}>
      <Avatar person={person} size={24} />
      {person.name}
    </button>
  );
}
