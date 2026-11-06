import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, isLocalUrl } from "@/lib/site-url";

function safeNext(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

function baseUrl(request: NextRequest): string {
  if (process.env.NODE_ENV !== "production") return request.nextUrl.origin;
  const host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  const candidate = host ? `https://${host}` : "";
  return candidate && !isLocalUrl(candidate) ? candidate : getSiteUrl();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = baseUrl(request);
  const fail = (reason: string) =>
    NextResponse.redirect(`${base}/login?error=${reason}`);

  if (searchParams.get("error") || searchParams.get("error_code")) {
    return fail(
      searchParams.get("error_code") === "otp_expired"
        ? "link_expired"
        : "confirmation_failed"
    );
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("session_exchange_failed");
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail("confirmation_failed");
  } else {
    return fail("missing_code");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    await supabase.auth.signOut();
    return fail("not_confirmed");
  }

  let destination = safeNext(searchParams.get("next"));
  if (!destination) {
    const { data: role } = await supabase.rpc("my_admin_role");
    destination = role ? "/admin" : "/verification";
  }
  return NextResponse.redirect(`${base}${destination}`);
}
