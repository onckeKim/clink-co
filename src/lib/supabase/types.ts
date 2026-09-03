/**
 * Hand-authored placeholder for the Supabase generated database types.
 *
 * Once the real schema exists in your Supabase project, replace this file
 * by running:
 *
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 *
 * The shape below mirrors the tables this app expects, so the rest of the
 * codebase can already import `Database` safely. It's deliberately kept
 * thin/representative rather than tracking every table 1:1 — the many
 * admin-managed "tables" added for the admin dashboard (products,
 * categories, collections, coupons, media, content blocks, store settings,
 * audit log, order/customer notes, etc.) are each fully specified as an
 * in-memory store under src/lib/admin/ and src/lib/orders/, with a doc
 * comment on the store itself describing its target real-table shape —
 * that's the source of truth for those, not this file.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          date_of_birth: string | null;
          marketing_consent: boolean;
          /** "customer" for every shopper; the six admin roles are defined in src/lib/admin/roles.ts (ADMIN_ROLES), not duplicated here. */
          role: "customer" | "super_admin" | "store_admin" | "product_manager" | "order_fulfilment" | "content_editor" | "customer_support";
          is_disabled: boolean;
          disabled_reason: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          marketing_consent?: boolean;
          role?: "customer" | "super_admin" | "store_admin" | "product_manager" | "order_fulfilment" | "content_editor" | "customer_support";
          is_disabled?: boolean;
          disabled_reason?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          full_name: string;
          line1: string;
          line2: string | null;
          suburb: string;
          city: string;
          province: string;
          postal_code: string;
          phone: string;
          is_default_delivery: boolean;
          is_default_billing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          full_name: string;
          line1: string;
          line2?: string | null;
          suburb: string;
          city: string;
          province: string;
          postal_code: string;
          phone: string;
          is_default_delivery?: boolean;
          is_default_billing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          compare_at_price: number | null;
          category_id: string | null;
          images: string[];
          in_stock: boolean;
          is_bestseller: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          compare_at_price?: number | null;
          category_id?: string | null;
          images?: string[];
          in_stock?: boolean;
          is_bestseller?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "paid" | "fulfilled" | "cancelled";
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "paid" | "fulfilled" | "cancelled";
          total: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
