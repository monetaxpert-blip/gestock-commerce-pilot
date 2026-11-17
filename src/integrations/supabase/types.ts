export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          archived_at: string | null
          avg_cost: number
          barcode: string | null
          created_at: string
          fixed_cost: number | null
          id: string
          low_stock_threshold: number
          price_retail: number
          price_semi: number | null
          price_wholesale: number | null
          product_id: string
          shop_id: string
          sku: string
          stock_qty: number
          updated_at: string
          variant_name: string
        }
        Insert: {
          archived_at?: string | null
          avg_cost?: number
          barcode?: string | null
          created_at?: string
          fixed_cost?: number | null
          id?: string
          low_stock_threshold?: number
          price_retail: number
          price_semi?: number | null
          price_wholesale?: number | null
          product_id: string
          shop_id: string
          sku: string
          stock_qty?: number
          updated_at?: string
          variant_name?: string
        }
        Update: {
          archived_at?: string | null
          avg_cost?: number
          barcode?: string | null
          created_at?: string
          fixed_cost?: number | null
          id?: string
          low_stock_threshold?: number
          price_retail?: number
          price_semi?: number | null
          price_wholesale?: number | null
          product_id?: string
          shop_id?: string
          sku?: string
          stock_qty?: number
          updated_at?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          shop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          shop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          note: string | null
          phone: string
          price_tier: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          note?: string | null
          phone: string
          price_tier?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          note?: string | null
          phone?: string
          price_tier?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      document_counters: {
        Row: {
          doc_type: string
          last_value: number
          shop_id: string
          year: number
        }
        Insert: {
          doc_type: string
          last_value?: number
          shop_id: string
          year: number
        }
        Update: {
          doc_type?: string
          last_value?: number
          shop_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_counters_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          article_id: string
          base_quantity: number
          factor: number
          id: string
          line_discount: number
          line_gross: number
          line_total: number
          order_id: string
          packaging_id: string | null
          packaging_name: string
          product_name: string
          quantity: number
          shop_id: string
          unit_price: number
          variant_name: string
        }
        Insert: {
          article_id: string
          base_quantity: number
          factor: number
          id?: string
          line_discount?: number
          line_gross: number
          line_total: number
          order_id: string
          packaging_id?: string | null
          packaging_name: string
          product_name: string
          quantity: number
          shop_id: string
          unit_price: number
          variant_name?: string
        }
        Update: {
          article_id?: string
          base_quantity?: number
          factor?: number
          id?: string
          line_discount?: number
          line_gross?: number
          line_total?: number
          order_id?: string
          packaging_id?: string | null
          packaging_name?: string
          product_name?: string
          quantity?: number
          shop_id?: string
          unit_price?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivered_at: string | null
          deposit_total: number
          expected_date: string | null
          id: string
          note: string | null
          number: string
          operation_key: string
          prepared_at: string | null
          price_tier: string
          retained_amount: number
          sale_id: string | null
          shop_id: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivered_at?: string | null
          deposit_total?: number
          expected_date?: string | null
          id?: string
          note?: string | null
          number: string
          operation_key: string
          prepared_at?: string | null
          price_tier?: string
          retained_amount?: number
          sale_id?: string | null
          shop_id: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivered_at?: string | null
          deposit_total?: number
          expected_date?: string | null
          id?: string
          note?: string | null
          number?: string
          operation_key?: string
          prepared_at?: string | null
          price_tier?: string
          retained_amount?: number
          sale_id?: string | null
          shop_id?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sale_fk"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      packagings: {
        Row: {
          archived_at: string | null
          created_at: string
          factor: number
          id: string
          name: string
          product_id: string
          shop_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          factor: number
          id?: string
          name: string
          product_id: string
          shop_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          factor?: number
          id?: string
          name?: string
          product_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packagings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packagings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          direction: string
          id: string
          kind: string
          method: string
          note: string | null
          operation_key: string | null
          order_id: string | null
          sale_id: string | null
          shop_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction: string
          id?: string
          kind: string
          method: string
          note?: string | null
          operation_key?: string | null
          order_id?: string | null
          sale_id?: string | null
          shop_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          direction?: string
          id?: string
          kind?: string
          method?: string
          note?: string | null
          operation_key?: string | null
          order_id?: string | null
          sale_id?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_decimal: boolean | null
          archived_at: string | null
          base_unit: string
          category_id: string | null
          created_at: string
          description: string | null
          has_variants: boolean
          id: string
          is_stocked: boolean
          name: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          allow_decimal?: boolean | null
          archived_at?: string | null
          base_unit: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          is_stocked?: boolean
          name: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          allow_decimal?: boolean | null
          archived_at?: string | null
          base_unit?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          is_stocked?: boolean
          name?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_lines: {
        Row: {
          article_id: string
          base_quantity: number
          factor: number
          id: string
          line_total: number
          packaging_id: string | null
          packaging_name: string
          product_name: string
          purchase_id: string
          quantity: number
          shop_id: string
          unit_cost: number
          variant_name: string
        }
        Insert: {
          article_id: string
          base_quantity: number
          factor: number
          id?: string
          line_total: number
          packaging_id?: string | null
          packaging_name: string
          product_name: string
          purchase_id: string
          quantity: number
          shop_id: string
          unit_cost: number
          variant_name?: string
        }
        Update: {
          article_id?: string
          base_quantity?: number
          factor?: number
          id?: string
          line_total?: number
          packaging_id?: string | null
          packaging_name?: string
          product_name?: string
          purchase_id?: string
          quantity?: number
          shop_id?: string
          unit_cost?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          number: string
          operation_key: string
          received_at: string
          shop_id: string
          supplier_name: string | null
          total_cost: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          number: string
          operation_key: string
          received_at: string
          shop_id: string
          supplier_name?: string | null
          total_cost?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          number?: string
          operation_key?: string
          received_at?: string
          shop_id?: string
          supplier_name?: string | null
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_lines: {
        Row: {
          article_id: string
          base_quantity: number
          factor: number
          global_discount_share: number
          id: string
          line_cost: number
          line_discount: number
          line_gross: number
          line_margin: number
          line_net: number
          packaging_id: string | null
          packaging_name: string
          product_name: string
          quantity: number
          sale_id: string
          shop_id: string
          unit_cost: number
          unit_price: number
          variant_name: string
        }
        Insert: {
          article_id: string
          base_quantity: number
          factor: number
          global_discount_share?: number
          id?: string
          line_cost?: number
          line_discount?: number
          line_gross: number
          line_margin?: number
          line_net: number
          packaging_id?: string | null
          packaging_name: string
          product_name: string
          quantity: number
          sale_id: string
          shop_id: string
          unit_cost?: number
          unit_price: number
          variant_name?: string
        }
        Update: {
          article_id?: string
          base_quantity?: number
          factor?: number
          global_discount_share?: number
          id?: string
          line_cost?: number
          line_discount?: number
          line_gross?: number
          line_margin?: number
          line_net?: number
          packaging_id?: string | null
          packaging_name?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          shop_id?: string
          unit_cost?: number
          unit_price?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_lines_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_due: number
          amount_paid: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cost_total: number
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_total: number
          has_unreliable_margin: boolean
          id: string
          margin: number
          note: string | null
          number: string
          operation_key: string
          order_id: string | null
          price_tier: string
          shop_id: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cost_total?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_total?: number
          has_unreliable_margin?: boolean
          id?: string
          margin?: number
          note?: string | null
          number: string
          operation_key: string
          order_id?: string | null
          price_tier?: string
          shop_id: string
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cost_total?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_total?: number
          has_unreliable_margin?: boolean
          id?: string
          margin?: number
          note?: string | null
          number?: string
          operation_key?: string
          order_id?: string | null
          price_tier?: string
          shop_id?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          created_at: string
          role: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          allow_negative_stock: boolean
          city: string | null
          created_at: string
          id: string
          name: string
          owner_id: string
          phone: string | null
          plan: string
          receipt_footer: string | null
          sector: string | null
          subscription_ends_at: string | null
          timezone: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_negative_stock?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          plan?: string
          receipt_footer?: string | null
          sector?: string | null
          subscription_ends_at?: string | null
          timezone?: string
          trial_ends_at: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_negative_stock?: boolean
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          plan?: string
          receipt_footer?: string | null
          sector?: string | null
          subscription_ends_at?: string | null
          timezone?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          article_id: string
          avg_cost_after: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          operation_key: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          shop_id: string
          stock_after: number
          type: string
          unit_cost: number
          value: number
        }
        Insert: {
          article_id: string
          avg_cost_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          operation_key?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          shop_id: string
          stock_after: number
          type: string
          unit_cost?: number
          value?: number
        }
        Update: {
          article_id?: string
          avg_cost_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          operation_key?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          shop_id?: string
          stock_after?: number
          type?: string
          unit_cost?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          contact_phone: string
          created_at: string
          id: string
          message: string | null
          requested_by: string
          shop_id: string
          status: string
        }
        Insert: {
          contact_phone: string
          created_at?: string
          id?: string
          message?: string | null
          requested_by?: string
          shop_id: string
          status?: string
        }
        Update: {
          contact_phone?: string
          created_at?: string
          id?: string
          message?: string | null
          requested_by?: string
          shop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      article_stock: {
        Row: {
          allow_decimal: boolean | null
          archived_at: string | null
          available_qty: number | null
          avg_cost: number | null
          barcode: string | null
          base_unit: string | null
          category_id: string | null
          engaged_qty: number | null
          fixed_cost: number | null
          has_variants: boolean | null
          id: string | null
          is_stocked: boolean | null
          low_stock_threshold: number | null
          price_retail: number | null
          price_semi: number | null
          price_wholesale: number | null
          product_archived_at: string | null
          product_id: string | null
          product_name: string | null
          shop_id: string | null
          sku: string | null
          stock_qty: number | null
          variant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_balances: {
        Row: {
          customer_id: string | null
          last_sale_at: string | null
          receivable: number | null
          sales_count: number | null
          shop_id: string | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _add_payments: {
        Args: {
          _customer: string
          _kind: string
          _max: number
          _order: string
          _payments: Json
          _sale: string
          _shop: string
        }
        Returns: number
      }
      _apply_movement: {
        Args: {
          _article: string
          _key: string
          _note: string
          _qty: number
          _reason: string
          _ref_id: string
          _ref_number: string
          _ref_type: string
          _revalue: boolean
          _shop: string
          _type: string
          _unit_cost: number
        }
        Returns: number
      }
      _assert_can_write: { Args: { _shop: string }; Returns: undefined }
      _assert_member: { Args: { _shop: string }; Returns: undefined }
      _insert_article: {
        Args: {
          _a: Json
          _allow_decimal: boolean
          _is_stocked: boolean
          _product: string
          _shop: string
        }
        Returns: string
      }
      _insert_sale: {
        Args: {
          _customer: string
          _global_discount: number
          _key: string
          _note: string
          _order: string
          _resolved: Json
          _shop: string
          _tier: string
        }
        Returns: string
      }
      _next_number: { Args: { _shop: string; _type: string }; Returns: string }
      _next_sku: { Args: { _shop: string }; Returns: string }
      _refresh_order: { Args: { _order: string }; Returns: undefined }
      _refresh_sale: { Args: { _sale: string }; Returns: undefined }
      _resolve_lines: {
        Args: { _lines: Json; _shop: string; _tier: string }
        Returns: Json
      }
      _shop_tz: { Args: { _shop: string }; Returns: string }
      add_article: {
        Args: { _payload: Json; _product: string; _shop: string }
        Returns: string
      }
      add_order_deposit: {
        Args: {
          _amount: number
          _method: string
          _operation_key: string
          _order: string
          _shop: string
        }
        Returns: string
      }
      adjust_stock: {
        Args: {
          _article: string
          _note: string
          _operation_key: string
          _quantity: number
          _reason: string
          _shop: string
        }
        Returns: string
      }
      can_write_shop: { Args: { _shop: string }; Returns: boolean }
      cancel_order: {
        Args: {
          _deposit_action: string
          _order: string
          _reason: string
          _shop: string
        }
        Returns: undefined
      }
      cancel_sale: {
        Args: { _reason: string; _sale: string; _shop: string }
        Returns: undefined
      }
      create_order: {
        Args: {
          _customer_id: string
          _deposit: Json
          _expected_date: string
          _lines: Json
          _note: string
          _operation_key: string
          _price_tier: string
          _shop: string
        }
        Returns: string
      }
      create_product: {
        Args: { _payload: Json; _shop: string }
        Returns: string
      }
      create_sale: {
        Args: {
          _customer_id: string
          _global_discount: number
          _lines: Json
          _note: string
          _operation_key: string
          _payments: Json
          _price_tier: string
          _shop: string
        }
        Returns: string
      }
      create_shop: {
        Args: {
          _address: string
          _city: string
          _name: string
          _phone: string
          _sector: string
        }
        Returns: string
      }
      delete_product: {
        Args: { _product: string; _shop: string }
        Returns: undefined
      }
      deliver_order: {
        Args: {
          _operation_key: string
          _order: string
          _payments: Json
          _shop: string
        }
        Returns: string
      }
      get_dashboard: { Args: { _shop: string }; Returns: Json }
      get_period_report: {
        Args: { _from: string; _shop: string; _to: string }
        Returns: Json
      }
      is_shop_member: { Args: { _shop: string }; Returns: boolean }
      record_purchase: {
        Args: {
          _lines: Json
          _note: string
          _operation_key: string
          _received_at: string
          _shop: string
          _supplier: string
        }
        Returns: string
      }
      record_sale_payment: {
        Args: {
          _amount: number
          _method: string
          _note: string
          _operation_key: string
          _sale: string
          _shop: string
        }
        Returns: string
      }
      set_order_status: {
        Args: { _order: string; _shop: string; _status: string }
        Returns: undefined
      }
      settle_customer: {
        Args: {
          _amount: number
          _customer: string
          _method: string
          _operation_key: string
          _shop: string
        }
        Returns: number
      }
      shop_is_writable: { Args: { _shop: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
