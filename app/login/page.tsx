"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useShop } from "@/lib/store";

/** /login is not a page any more: sign-in is a POPUP (Ahsan,
 *  2026-11-26). A visit here lands on the home page with the
 *  popup open in Sign In mode — old bookmarks, the robots-
 *  disallowed URL and any stray link keep working, but no bare
 *  form surface exists. A visitor who is already signed in
 *  goes straight to their account instead. */
export default function LoginPage() {
  const { user, ready, openAuth } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace("/account");
      return;
    }
    openAuth("login");
    router.replace("/");
  }, [ready, user, openAuth, router]);

  return <p className="wrap py-16 text-center text-muted">Loading…</p>;
}
