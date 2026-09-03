import "server-only";
import { getDb } from "./client";
import { unwrap } from "./errors";
import type { Database } from "@/lib/supabase/types";

type StoreSettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];
type StoreSettingsUpdate = Database["public"]["Tables"]["store_settings"]["Update"];

/** The one settings row — public read (store_settings_select_all: `to authenticated, anon using (true)`), no auth required. */
export async function getStoreSettings(): Promise<StoreSettingsRow> {
  const db = await getDb();
  const { data, error } = await db.from("store_settings").select("*").eq("id", true).single();
  return unwrap({ data, error });
}

/** Requires settings:write (store_settings_update_staff). */
export async function updateStoreSettings(patch: StoreSettingsUpdate): Promise<StoreSettingsRow> {
  const db = await getDb();
  const { data, error } = await db.from("store_settings").update(patch).eq("id", true).select().single();
  return unwrap({ data, error });
}
