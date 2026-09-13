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
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: "user" | "admin";
          status: "active" | "blocked" | "suspended";
          plan_id: string | null;
          ai_provider: "openai" | "openrouter" | null;
          ai_api_key_encrypted: string | null;
          ai_model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: "user" | "admin";
          status?: "active" | "blocked" | "suspended";
          plan_id?: string | null;
          ai_provider?: "openai" | "openrouter" | null;
          ai_api_key_encrypted?: string | null;
          ai_model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: "user" | "admin";
          status?: "active" | "blocked" | "suspended";
          plan_id?: string | null;
          ai_provider?: "openai" | "openrouter" | null;
          ai_api_key_encrypted?: string | null;
          ai_model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          website_name: string;
          domain: string;
          phone: string;
          email: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          country: string;
          niche: string;
          description: string;
          logo_url: string | null;
          business_hours: Json | null;
          social_profiles: Json | null;
          google_business_url: string | null;
          additional_info: string | null;
          status: "draft" | "active" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          website_name: string;
          domain: string;
          phone: string;
          email?: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          country?: string;
          niche: string;
          description: string;
          logo_url?: string | null;
          business_hours?: Json | null;
          social_profiles?: Json | null;
          google_business_url?: string | null;
          additional_info?: string | null;
          status?: "draft" | "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          website_name?: string;
          domain?: string;
          phone?: string;
          email?: string | null;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          country?: string;
          niche?: string;
          description?: string;
          logo_url?: string | null;
          business_hours?: Json | null;
          social_profiles?: Json | null;
          google_business_url?: string | null;
          additional_info?: string | null;
          status?: "draft" | "active" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      websites: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          template_id: string;
          brand_settings: Json | null;
          navigation_data: Json | null;
          status: "pending" | "generating" | "generated" | "error";
          storage_path: string | null;
          total_pages: number;
          build_hash: string | null;
          zip_path: string | null;
          zip_build_hash: string | null;
          generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          template_id: string;
          brand_settings?: Json | null;
          navigation_data?: Json | null;
          status?: "pending" | "generating" | "generated" | "error";
          storage_path?: string | null;
          total_pages?: number;
          build_hash?: string | null;
          zip_path?: string | null;
          zip_build_hash?: string | null;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          template_id?: string;
          brand_settings?: Json | null;
          navigation_data?: Json | null;
          status?: "pending" | "generating" | "generated" | "error";
          storage_path?: string | null;
          total_pages?: number;
          build_hash?: string | null;
          zip_path?: string | null;
          zip_build_hash?: string | null;
          generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          primary_keyword: string;
          secondary_keywords: string[];
          slug: string;
          generate_page: boolean;
          show_in_menu: boolean;
          show_on_homepage: boolean;
          show_in_footer: boolean;
          blueprint_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          primary_keyword: string;
          secondary_keywords?: string[];
          slug: string;
          generate_page?: boolean;
          show_in_menu?: boolean;
          show_on_homepage?: boolean;
          show_in_footer?: boolean;
          blueprint_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          primary_keyword?: string;
          secondary_keywords?: string[];
          slug?: string;
          generate_page?: boolean;
          show_in_menu?: boolean;
          show_on_homepage?: boolean;
          show_in_footer?: boolean;
          blueprint_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      service_areas: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          area_name: string;
          city: string;
          state: string;
          zip: string;
          primary_keyword: string;
          slug: string;
          generate_page: boolean;
          show_in_menu: boolean;
          show_on_homepage: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          area_name: string;
          city: string;
          state: string;
          zip: string;
          primary_keyword: string;
          slug: string;
          generate_page?: boolean;
          show_in_menu?: boolean;
          show_on_homepage?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          area_name?: string;
          city?: string;
          state?: string;
          zip?: string;
          primary_keyword?: string;
          slug?: string;
          generate_page?: boolean;
          show_in_menu?: boolean;
          show_on_homepage?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          customer_name: string;
          rating: number;
          review_text: string;
          review_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          customer_name: string;
          rating: number;
          review_text: string;
          review_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          customer_name?: string;
          rating?: number;
          review_text?: string;
          review_date?: string | null;
          created_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          website_id: string;
          user_id: string;
          page_type: "homepage" | "service" | "service-area" | "contact";
          title: string;
          slug: string;
          file_path: string | null;
          content_data: Json | null;
          meta_title: string | null;
          meta_description: string | null;
          status: "pending" | "generated" | "edited" | "error";
          content_hash: string | null;
          published_hash: string | null;
          sort_order: number;
          reference_id: string | null;
          reference_type: "service" | "service_area" | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          user_id: string;
          page_type: "homepage" | "service" | "service-area" | "contact";
          title: string;
          slug: string;
          file_path?: string | null;
          content_data?: Json | null;
          meta_title?: string | null;
          meta_description?: string | null;
          status?: "pending" | "generated" | "edited" | "error";
          content_hash?: string | null;
          published_hash?: string | null;
          sort_order?: number;
          reference_id?: string | null;
          reference_type?: "service" | "service_area" | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          website_id?: string;
          user_id?: string;
          page_type?: "homepage" | "service" | "service-area" | "contact";
          title?: string;
          slug?: string;
          file_path?: string | null;
          content_data?: Json | null;
          meta_title?: string | null;
          meta_description?: string | null;
          status?: "pending" | "generated" | "edited" | "error";
          content_hash?: string | null;
          published_hash?: string | null;
          sort_order?: number;
          reference_id?: string | null;
          reference_type?: "service" | "service_area" | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          thumbnail_url: string | null;
          directory_name: string;
          page_types: string[];
          is_active: boolean;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          thumbnail_url?: string | null;
          directory_name: string;
          page_types?: string[];
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          directory_name?: string;
          page_types?: string[];
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blueprints: {
        Row: {
          id: string;
          name: string;
          niche: string | null;
          page_type: "service" | "service-area" | "homepage" | "contact";
          description: string | null;
          is_active: boolean;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          niche?: string | null;
          page_type?: "service" | "service-area" | "homepage" | "contact";
          description?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          niche?: string | null;
          page_type?: "service" | "service-area" | "homepage" | "contact";
          description?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blueprint_sections: {
        Row: {
          id: string;
          blueprint_id: string;
          section_name: string;
          section_purpose: string | null;
          topics: string[];
          entities: string[];
          suggested_length: string | null;
          tone: string | null;
          link_targets: string[];
          ai_instructions: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          blueprint_id: string;
          section_name: string;
          section_purpose?: string | null;
          topics?: string[];
          entities?: string[];
          suggested_length?: string | null;
          tone?: string | null;
          link_targets?: string[];
          ai_instructions?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          blueprint_id?: string;
          section_name?: string;
          section_purpose?: string | null;
          topics?: string[];
          entities?: string[];
          suggested_length?: string | null;
          tone?: string | null;
          link_targets?: string[];
          ai_instructions?: string | null;
          sort_order?: number;
        };
      };
      prompts: {
        Row: {
          id: string;
          name: string;
          page_type: "homepage" | "service" | "service-area" | "contact" | "seo_metadata" | "faq" | "rewrite";
          niche: string | null;
          system_message: string;
          prompt_text: string;
          output_schema: Json | null;
          variables: string[];
          version: number;
          is_active: boolean;
          is_default: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          page_type: "homepage" | "service" | "service-area" | "contact" | "seo_metadata" | "faq" | "rewrite";
          niche?: string | null;
          system_message: string;
          prompt_text: string;
          output_schema?: Json | null;
          variables?: string[];
          version?: number;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          page_type?: "homepage" | "service" | "service-area" | "contact" | "seo_metadata" | "faq" | "rewrite";
          niche?: string | null;
          system_message?: string;
          prompt_text?: string;
          output_schema?: Json | null;
          variables?: string[];
          version?: number;
          is_active?: boolean;
          is_default?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
