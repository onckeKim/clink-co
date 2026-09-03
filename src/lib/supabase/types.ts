/**
 * Generated database types — hand-authored to mirror the real schema in
 * supabase/migrations/**, since this environment has no live Supabase
 * project to run codegen against. Once you have one, regenerate for real
 * and this file becomes a diff-checked drop-in replacement:
 *
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.ts
 *
 * Every table below has a matching migration in supabase/migrations/ — see
 * supabase/README.md for the full schema walkthrough, the RLS policy list,
 * and how the many admin-managed resources here relate to the in-memory
 * stores under src/lib/admin/ and src/lib/orders/ that the app currently
 * runs on (each of those stores' own doc comment names its target table
 * here 1:1, so swapping one over is a drop-in body change, not a rewrite).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Enums — supabase/migrations/20250101000000_extensions_and_enums.sql
// ---------------------------------------------------------------------------
export type AppRole =
  | "customer"
  | "super_admin"
  | "store_admin"
  | "product_manager"
  | "order_fulfilment"
  | "content_editor"
  | "customer_support";
export type OrderStatusEnum = "pending_payment" | "paid" | "payment_failed" | "cancelled" | "fulfilled";
export type PaymentMethodEnum = "test" | "payfast" | "peach" | "yoco" | "ozow" | "eft";
export type PaymentStatusEnum = "pending" | "authorized" | "succeeded" | "failed" | "refunded" | "partially_refunded";
export type DeliveryMethodEnum = "standard" | "express" | "pickup";
export type ShipmentStatusEnum = "pending" | "in_transit" | "delivered" | "failed" | "returned";
export type DiscountTypeEnum = "percentage" | "fixed";
export type PublishStatusEnum = "draft" | "published";
export type ModerationStatusEnum = "pending" | "published" | "rejected";
export type ReturnStatusEnum = "requested" | "approved" | "rejected" | "received" | "refunded";
export type ReturnReasonEnum = "changed-mind" | "damaged" | "wrong-item" | "not-as-described" | "other";
export type CartStatusEnum = "active" | "converted" | "abandoned";
export type NewsletterStatusEnum = "subscribed" | "unsubscribed";
export type ContactStatusEnum = "new" | "in_progress" | "resolved";

export interface Database {
  public: {
    Tables: {
      // ---------------------------------------------------------------
      // Identity & access — 0001_identity_and_access.sql
      // ---------------------------------------------------------------
      profiles: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          date_of_birth: string | null;
          marketing_consent: boolean;
          role: AppRole;
          is_disabled: boolean;
          disabled_reason: string | null;
          avatar_url: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          marketing_consent?: boolean;
          role?: AppRole;
          is_disabled?: boolean;
          disabled_reason?: string | null;
          avatar_url?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      role_permissions: {
        Row: { role: AppRole; permission: string };
        Insert: { role: AppRole; permission: string };
        Update: Partial<Database["public"]["Tables"]["role_permissions"]["Insert"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          granted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AppRole;
          granted_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
        Relationships: [];
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
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Catalog — 0002_catalog.sql
      // ---------------------------------------------------------------
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image: string | null;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          is_published: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image?: string | null;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          is_published?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image: string | null;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          is_published: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image?: string | null;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          is_published?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          sku: string;
          name: string;
          short_description: string | null;
          description: string;
          currency: string;
          price: number;
          compare_at_price: number | null;
          regular_price: number | null;
          sale_price: number | null;
          sale_starts_at: string | null;
          sale_ends_at: string | null;
          product_type: string | null;
          material: string | null;
          capacity: string | null;
          set_size: string | null;
          weight_grams: number | null;
          dimensions_height_cm: number | null;
          dimensions_width_cm: number | null;
          dimensions_depth_cm: number | null;
          care_instructions: string[];
          key_benefits: string[];
          tags: string[];
          colors: string[];
          badges: string[];
          pairs_with_product_ids: string[];
          lifestyle_image: string | null;
          lifestyle_caption: string | null;
          packaging_info: string | null;
          video_url: string | null;
          rating: number | null;
          review_count: number;
          stock_quantity: number;
          in_stock: boolean;
          low_stock_threshold: number | null;
          featured: boolean;
          discontinued: boolean;
          publish_status: PublishStatusEnum;
          seo_title: string | null;
          seo_description: string | null;
          deleted_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          /** Generated column (tsvector) — read-only, never set on Insert/Update. */
          search_vector: unknown;
        };
        Insert: {
          id?: string;
          slug: string;
          sku: string;
          name: string;
          short_description?: string | null;
          description: string;
          currency?: string;
          price: number;
          compare_at_price?: number | null;
          regular_price?: number | null;
          sale_price?: number | null;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
          product_type?: string | null;
          material?: string | null;
          capacity?: string | null;
          set_size?: string | null;
          weight_grams?: number | null;
          dimensions_height_cm?: number | null;
          dimensions_width_cm?: number | null;
          dimensions_depth_cm?: number | null;
          care_instructions?: string[];
          key_benefits?: string[];
          tags?: string[];
          colors?: string[];
          badges?: string[];
          pairs_with_product_ids?: string[];
          lifestyle_image?: string | null;
          lifestyle_caption?: string | null;
          packaging_info?: string | null;
          video_url?: string | null;
          low_stock_threshold?: number | null;
          featured?: boolean;
          discontinued?: boolean;
          publish_status?: PublishStatusEnum;
          seo_title?: string | null;
          seo_description?: string | null;
          deleted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          // rating/review_count/stock_quantity/in_stock are trigger-maintained — never set directly.
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_categories: {
        Row: { product_id: string; category_id: string; is_primary: boolean; created_at: string };
        Insert: { product_id: string; category_id: string; is_primary?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      collection_products: {
        Row: { collection_id: string; product_id: string; sort_order: number; created_at: string };
        Insert: { collection_id: string; product_id: string; sort_order?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["collection_products"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          sku: string | null;
          price_delta: number;
          swatch: string | null;
          sort_order: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          sku?: string | null;
          price_delta?: number;
          swatch?: string | null;
          sort_order?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          location: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          /** Generated column (quantity_on_hand - quantity_reserved) — read-only. */
          quantity_available: number;
          low_stock_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          location?: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Insert"]>;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Carts & wishlists — 0003_carts_and_wishlists.sql
      // ---------------------------------------------------------------
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          status: CartStatusEnum;
          coupon_code: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          status?: CartStatusEnum;
          coupon_code?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price_snapshot: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price_snapshot: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      wishlists: {
        Row: { id: string; user_id: string; share_token: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; share_token?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
        Relationships: [];
      };
      wishlist_items: {
        Row: { id: string; wishlist_id: string; product_id: string; created_at: string };
        Insert: { id?: string; wishlist_id: string; product_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Insert"]>;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Orders, payments, shipments — 0004_orders_payments_shipments.sql
      // ---------------------------------------------------------------
      orders: {
        Row: {
          id: string;
          order_number: string;
          idempotency_key: string;
          status: OrderStatusEnum;
          user_id: string | null;
          is_guest: boolean;
          customer_email: string;
          customer_name: string;
          currency: string;
          subtotal: number;
          discount_amount: number;
          delivery_fee: number;
          tax_amount: number;
          total: number;
          coupon_code: string | null;
          delivery_address: Json;
          billing_address: Json;
          delivery_method_id: DeliveryMethodEnum;
          delivery_label: string;
          estimated_delivery_earliest: string | null;
          estimated_delivery_latest: string | null;
          shipping_notes: string | null;
          gift_message: string | null;
          marketing_consent: boolean;
          payment_method: PaymentMethodEnum;
          payment_reference: string | null;
          payment_redirect_url: string | null;
          tracking_carrier: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          cancelled_reason: string | null;
          refund_amount: number | null;
          refund_reason: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        /** Written only by server-side (service-role) checkout logic — see supabase/README.md. */
        Insert: {
          id?: string;
          order_number: string;
          idempotency_key: string;
          status?: OrderStatusEnum;
          user_id?: string | null;
          is_guest?: boolean;
          customer_email: string;
          customer_name: string;
          currency?: string;
          subtotal: number;
          discount_amount?: number;
          delivery_fee?: number;
          tax_amount?: number;
          total: number;
          coupon_code?: string | null;
          delivery_address: Json;
          billing_address: Json;
          delivery_method_id: DeliveryMethodEnum;
          delivery_label: string;
          estimated_delivery_earliest?: string | null;
          estimated_delivery_latest?: string | null;
          shipping_notes?: string | null;
          gift_message?: string | null;
          marketing_consent?: boolean;
          payment_method: PaymentMethodEnum;
          payment_reference?: string | null;
          payment_redirect_url?: string | null;
          tracking_carrier?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          cancelled_reason?: string | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
          refunded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        /** authenticated staff (orders:fulfil) may only patch the operational subset — see the column GRANT in 0004_orders_payments_shipments.sql. */
        Update: Partial<
          Pick<
            Database["public"]["Tables"]["orders"]["Row"],
            | "status"
            | "payment_reference"
            | "payment_redirect_url"
            | "tracking_carrier"
            | "tracking_number"
            | "tracking_url"
            | "cancelled_reason"
            | "refund_amount"
            | "refund_reason"
            | "refunded_at"
          >
        >;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          sku: string;
          name: string;
          image: string | null;
          variant_label: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        /** Server-role only — never updated or deleted once written. */
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          sku: string;
          name: string;
          image?: string | null;
          variant_label?: string | null;
          unit_price: number;
          quantity: number;
          line_total: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: PaymentMethodEnum;
          provider_reference: string | null;
          status: PaymentStatusEnum;
          amount: number;
          currency: string;
          raw_response: Json | null;
          processed_webhook_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        /** Server-role only. */
        Insert: {
          id?: string;
          order_id: string;
          provider: PaymentMethodEnum;
          provider_reference?: string | null;
          status?: PaymentStatusEnum;
          amount: number;
          currency?: string;
          raw_response?: Json | null;
          processed_webhook_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          carrier: string;
          tracking_number: string;
          tracking_url: string | null;
          status: ShipmentStatusEnum;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier: string;
          tracking_number: string;
          tracking_url?: string | null;
          status?: ShipmentStatusEnum;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Promotions — 0005_promotions.sql
      // ---------------------------------------------------------------
      discount_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: DiscountTypeEnum;
          discount_value: number;
          free_delivery: boolean;
          min_spend: number | null;
          starts_at: string | null;
          ends_at: string | null;
          product_ids: string[];
          collection_ids: string[];
          customer_emails: string[];
          usage_limit: number | null;
          times_used: number;
          requires_code: boolean;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: DiscountTypeEnum;
          discount_value?: number;
          free_delivery?: boolean;
          min_spend?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          product_ids?: string[];
          collection_ids?: string[];
          customer_emails?: string[];
          usage_limit?: number | null;
          requires_code?: boolean;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          // times_used is trigger/function-maintained — never set directly.
        };
        Update: Omit<Partial<Database["public"]["Tables"]["discount_codes"]["Insert"]>, "code"> & { code?: string };
        Relationships: [];
      };
      discount_redemptions: {
        Row: {
          id: string;
          discount_code_id: string;
          order_id: string;
          user_id: string | null;
          customer_email: string;
          amount_discounted: number;
          redeemed_at: string;
        };
        /** Never inserted directly — see the redeem_discount_code() RPC in Functions below. */
        Insert: never;
        Update: never;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Reviews & Q&A — 0006_reviews_and_qa.sql
      // ---------------------------------------------------------------
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          order_item_id: string | null;
          customer_name: string;
          location: string | null;
          rating: number;
          title: string | null;
          body: string;
          verified: boolean;
          status: ModerationStatusEnum;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          order_item_id?: string | null;
          customer_name: string;
          location?: string | null;
          rating: number;
          title?: string | null;
          body: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
          // status always starts 'pending' server-side (guard_review_write) regardless of what's sent.
        };
        Update: Partial<Pick<Database["public"]["Tables"]["reviews"]["Row"], "rating" | "title" | "body" | "status">>;
        Relationships: [];
      };
      review_images: {
        Row: { id: string; review_id: string; url: string; sort_order: number; created_at: string };
        Insert: { id?: string; review_id: string; url: string; sort_order?: number; created_at?: string };
        Update: never;
        Relationships: [];
      };
      product_questions: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          asked_by_name: string;
          question: string;
          status: ModerationStatusEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          asked_by_name: string;
          question: string;
          created_at?: string;
        };
        Update: Partial<Pick<Database["public"]["Tables"]["product_questions"]["Row"], "status">>;
        Relationships: [];
      };
      product_answers: {
        Row: {
          id: string;
          question_id: string;
          answered_by_name: string;
          answered_by_user_id: string | null;
          answer: string;
          helpful_count: number;
          created_at: string;
        };
        /** Staff-authored only (content:write). */
        Insert: {
          id?: string;
          question_id: string;
          answered_by_name?: string;
          answered_by_user_id?: string | null;
          answer: string;
          helpful_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_answers"]["Insert"]>;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Site content — 0007_site_content.sql
      // ---------------------------------------------------------------
      homepage_sections: {
        Row: { id: string; section_key: string; sort_order: number; is_visible: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; section_key: string; sort_order?: number; is_visible?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["homepage_sections"]["Insert"]>;
        Relationships: [];
      };
      hero_slides: {
        Row: {
          id: string;
          eyebrow: string | null;
          heading: string;
          copy: string | null;
          image: string;
          image_alt: string | null;
          primary_cta_label: string | null;
          primary_cta_href: string | null;
          secondary_cta_label: string | null;
          secondary_cta_href: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eyebrow?: string | null;
          heading: string;
          copy?: string | null;
          image: string;
          image_alt?: string | null;
          primary_cta_label?: string | null;
          primary_cta_href?: string | null;
          secondary_cta_label?: string | null;
          secondary_cta_href?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hero_slides"]["Insert"]>;
        Relationships: [];
      };
      journal_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string[];
          cover_image: string | null;
          cover_image_alt: string | null;
          author_name: string;
          author_id: string | null;
          published_at: string | null;
          publish_status: PublishStatusEnum;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body?: string[];
          cover_image?: string | null;
          cover_image_alt?: string | null;
          author_name?: string;
          author_id?: string | null;
          published_at?: string | null;
          publish_status?: PublishStatusEnum;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["journal_posts"]["Insert"]>;
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: boolean;
          business_name: string;
          logo_url: string | null;
          contact_email: string;
          contact_phone: string | null;
          currency: string;
          tax_rate_percent: number;
          free_delivery_threshold: number;
          enabled_delivery_method_ids: DeliveryMethodEnum[];
          enabled_payment_method_ids: PaymentMethodEnum[];
          email_sender_name: string | null;
          email_sender_local_part: string | null;
          order_notification_email: string | null;
          social: Json;
          order_number_prefix: string;
          return_window_days: number;
          maintenance_mode: boolean;
          maintenance_message: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        /** The single row is created by its migration — only ever updated. */
        Insert: never;
        Update: Partial<Omit<Database["public"]["Tables"]["store_settings"]["Row"], "id">>;
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          storage_bucket: string;
          storage_path: string;
          url: string | null;
          filename: string;
          mime_type: string;
          size_bytes: number;
          alt_text: string | null;
          folder: string | null;
          labels: string[];
          uploaded_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          storage_bucket: string;
          storage_path: string;
          url?: string | null;
          filename: string;
          mime_type: string;
          size_bytes: number;
          alt_text?: string | null;
          folder?: string | null;
          labels?: string[];
          uploaded_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Ops — 0008_ops.sql
      // ---------------------------------------------------------------
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          status: NewsletterStatusEnum;
          source: string | null;
          unsubscribe_token: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        /** Only email/source are actually insertable by anon/authenticated — see the column GRANT. */
        Insert: { email: string; source?: string | null };
        Update: never;
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          status: ContactStatusEnum;
          handled_by: string | null;
          created_at: string;
          updated_at: string;
        };
        /** Only these four fields are actually insertable by anon/authenticated — see the column GRANT. */
        Insert: { name: string; email: string; subject?: string | null; message: string };
        Update: Partial<Pick<Database["public"]["Tables"]["contact_submissions"]["Row"], "status" | "handled_by">>;
        Relationships: [];
      };
      returns: {
        Row: {
          id: string;
          order_id: string;
          user_id: string | null;
          reason: ReturnReasonEnum;
          notes: string | null;
          status: ReturnStatusEnum;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          reason: ReturnReasonEnum;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          // status always starts 'requested' for a non-staff insert (guard_return_write).
        };
        Update: Partial<Pick<Database["public"]["Tables"]["returns"]["Row"], "status" | "notes" | "resolved_by" | "resolved_at">>;
        Relationships: [];
      };
      return_items: {
        Row: { id: string; return_id: string; order_item_id: string; quantity: number; created_at: string };
        Insert: { id?: string; return_id: string; order_item_id: string; quantity: number; created_at?: string };
        Update: never;
        Relationships: [];
      };

      // ---------------------------------------------------------------
      // Audit log — 0009_audit_log.sql
      // ---------------------------------------------------------------
      admin_audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          action: string;
          entity_type: string;
          entity_id: string;
          entity_label: string;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        /** Never inserted directly — see the log_admin_action() RPC in Functions below. */
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** The only path to read a wishlist's contents by its share token — see /wishlist/shared. */
      get_wishlist_by_share_token: {
        Args: { p_token: string };
        Returns: { wishlist_id: string; product_id: string }[];
      };
      /** One-click unsubscribe-link handler — an exact token match only. Returns true if a subscription was found and unsubscribed. */
      unsubscribe_newsletter: {
        Args: { p_token: string };
        Returns: boolean;
      };
      /**
       * Service-role only — EXECUTE is revoked from anon/authenticated at
       * the database (see supabase/README.md's security decisions). This
       * type doesn't and can't encode that Postgres-level GRANT
       * restriction (TypeScript has no notion of "callable, but only from
       * this other client instance"); in this codebase these two are only
       * ever called through createServiceClient() (src/lib/supabase/service.ts)
       * — see src/lib/db/discounts.ts and src/lib/db/audit.ts. Calling
       * either via the normal session-aware client compiles but fails at
       * the database with a permission-denied error.
       */
      redeem_discount_code: {
        Args: {
          p_code: string;
          p_order_id: string;
          p_user_id: string | null;
          p_customer_email: string;
          p_amount_discounted: number;
        };
        Returns: Database["public"]["Tables"]["discount_redemptions"]["Row"];
      };
      log_admin_action: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_entity_label: string;
          p_before?: Json | null;
          p_after?: Json | null;
        };
        Returns: Database["public"]["Tables"]["admin_audit_logs"]["Row"];
      };
    };
    Enums: {
      app_role: AppRole;
      order_status: OrderStatusEnum;
      payment_method: PaymentMethodEnum;
      payment_status: PaymentStatusEnum;
      delivery_method: DeliveryMethodEnum;
      shipment_status: ShipmentStatusEnum;
      discount_type: DiscountTypeEnum;
      publish_status: PublishStatusEnum;
      moderation_status: ModerationStatusEnum;
      return_status: ReturnStatusEnum;
      return_reason: ReturnReasonEnum;
      cart_status: CartStatusEnum;
      newsletter_status: NewsletterStatusEnum;
      contact_status: ContactStatusEnum;
    };
  };
}
