"use client";

import { useState } from "react";

/** A reviewer's avatar with the house fallback: the photo when
 *  it loads; the initials disc when there is no photo OR the
 *  photo fails to load — a stored value like "default-avatar.png"
 *  or a deleted upload must never paint the browser's
 *  broken-image glyph beside the reviewer's name. */
export default function ReviewAvatar({ name, avatar }: { name: string; avatar?: string }) {
  const [failed, setFailed] = useState(false);
  if (!avatar || failed) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-9 w-9 rounded-full object-cover"
    />
  );
}
