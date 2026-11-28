"use client";

import { useState } from "react";

/** The account card's big profile disc: the customer's photo when
 *  there is a loadable one; their initials on the house disc when
 *  there is not — a stored placeholder value ("default-avatar.png")
 *  or a failed load must never paint the browser's broken-image
 *  glyph. Same fallback contract as ReviewAvatar, at profile size. */
export default function AccountAvatar({
  name,
  avatar,
  size = 148,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const usable = Boolean(avatar) && /^https?:\/\//i.test(avatar || "") && !failed;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  if (!usable) {
    return (
      <span
        aria-hidden
        className="flex items-center justify-center rounded-full bg-primary/20 font-display font-bold text-primary"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      >
        {initials || "?"}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={avatar}
      src={avatar}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
