import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { updateProfile, ensureProfile } from "@/lib/account/profiles-store";
import { profileSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const profile = ensureProfile({ id: user.id, email: user.email });
  return NextResponse.json({
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: user.email ?? "",
      phone: profile.phone ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      marketingConsent: profile.marketingConsent,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });
  }

  const { firstName, lastName, email, phone, dateOfBirth, marketingConsent } = parsed.data;

  // Changing email re-triggers Supabase's own confirmation flow (a
  // confirmation link is sent to the *new* address, and the change only
  // takes effect once it's clicked) — we never just overwrite it here.
  if (email !== user.email) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      return NextResponse.json({ error: "We couldn't update your email address." }, { status: 500 });
    }
  }

  const profile = updateProfile(user.id, {
    firstName,
    lastName,
    phone: phone || null,
    dateOfBirth: dateOfBirth || null,
    marketingConsent,
  });

  return NextResponse.json({
    profile: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email,
      phone: profile.phone ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      marketingConsent: profile.marketingConsent,
    },
    emailChangePending: email !== user.email,
  });
}
