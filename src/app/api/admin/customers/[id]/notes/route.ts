import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { addCustomerNote, listCustomerNotes } from "@/lib/admin/customer-notes-store";
import { getAdminCustomerById } from "@/lib/admin/customers-store";
import { customerNoteSchema } from "@/lib/validations/admin-customers";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/customers/[id]/notes">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:view")) {
    return NextResponse.json({ error: "You don't have permission to view customers." }, { status: 403 });
  }

  const { id } = await params;
  return NextResponse.json({ notes: listCustomerNotes(id) });
}

export async function POST(request: Request, { params }: RouteContext<"/api/admin/customers/[id]/notes">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:write")) {
    return NextResponse.json({ error: "You don't have permission to add customer notes." }, { status: 403 });
  }

  const { id } = await params;
  const customer = getAdminCustomerById(id);
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = customerNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid note." }, { status: 400 });
  }

  const note = addCustomerNote({
    customerId: id,
    authorId: ctx.user.id,
    authorEmail: ctx.user.email ?? "",
    note: parsed.data.note,
  });

  return NextResponse.json({ note }, { status: 201 });
}
