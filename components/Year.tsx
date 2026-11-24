"use client";

import { useEffect, useState } from "react";

/** The current year, computed on the client after mount so static
 *  prerendering never depends on the clock. */
export default function Year() {
  const [year, setYear] = useState("");
  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);
  return <>{year}</>;
}
