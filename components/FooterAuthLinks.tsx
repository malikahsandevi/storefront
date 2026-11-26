"use client";

import { useShop } from "@/lib/store";

/**
 * The footer Account column's sign-in entries. The footer itself
 * is server-rendered; these two are a client island because
 * login/signup are a POPUP now (opened through the shop state),
 * not pages. A signed-in visitor does not see them at all —
 * pointing a live session at a sign-in form is a dead end.
 */
export default function FooterAuthLinks() {
  const { user, openAuth } = useShop();
  if (user) return null;
  return (
    <>
      <li>
        <button type="button" className="ftr__authlink" onClick={() => openAuth("login")}>
          Sign In
        </button>
      </li>
      <li>
        <button type="button" className="ftr__authlink" onClick={() => openAuth("register")}>
          Create Account
        </button>
      </li>
    </>
  );
}
