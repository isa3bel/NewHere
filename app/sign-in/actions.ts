"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInResult =
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

export async function sendMagicLinkAction(
  _prev: SignInResult | null,
  formData: FormData,
): Promise<SignInResult> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();

  // Resolve the origin (e.g. http://localhost:3000) at request time so the
  // callback redirect works locally and in production without hard-coding.
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // `next` is forwarded through so users land back on the page they were
  // trying to reach before being bounced to sign-in.
  const next = (formData.get("next") as string) || "/plan";
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      // Allow new sign-ups via magic link without a separate sign-up step.
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "sent", email };
}
