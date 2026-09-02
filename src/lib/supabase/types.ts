/**
 * Hand-authored placeholder for the Supabase generated database types.
 *
 * Once the real schema exists in your Supabase project, replace this file
 * by running:
 *
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 *
 * The shape below mirrors the tables this app expects, so the rest of the
 * codebase can already import `Database` safely.
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
          /** "customer" for every shopper; "admin" is reserved for a future admin area — see src/lib/supabase/dal.ts. */
          role: "customer" | "admin";
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
          role?: "customer" | "admin";
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
