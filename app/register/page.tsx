"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useShop } from "@/lib/store";

/** /register is not a page any more: creating an account is
 *  the auth POPUP's second mode (Ahsan, 2026-11-26). A visit
 *  here lands on the home page with the popup open in Create
 *  Account mode; a signed-in visitor goes to their account. */
export default function RegisterPage() {
  const { user, ready, openAuth } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (user) {
      router.replace("/account");
      return;
    }
    openAuth("register");
    router.replace("/");
  }, [ready, user, openAuth, router]);

  return <p className="wrap py-16 text-center text-muted">Loading…</p>;
}
