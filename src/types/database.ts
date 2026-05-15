export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          brand_name: string;
          brand_category: string;
          campaign_goal: string | null;
          target_audience: string | null;
          primary_kpi: string;
          tone: string | null;
          platform: string;
          pre_registered_variables: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          brand_name: string;
          brand_category: string;
          campaign_goal?: string | null;
          target_audience?: string | null;
          primary_kpi: string;
          tone?: string | null;
          platform: string;
          pre_registered_variables?: string[];
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          brand_name?: string;
          brand_category?: string;
          campaign_goal?: string | null;
          target_audience?: string | null;
          primary_kpi?: string;
          tone?: string | null;
          platform?: string;
          pre_registered_variables?: string[];
        };
        Relationships: [];
      };
      creatives: {
        Row: {
          id: string;
          project_id: string;
          filename: string;
          storage_path: string;
          media_type: string;
          file_size_bytes: number | null;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          filename: string;
          storage_path: string;
          media_type: string;
          file_size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          id?: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          filename?: string;
          storage_path?: string;
          media_type?: string;
          file_size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
        };
        Relationships: [];
      };
      performance_uploads: {
        Row: {
          id: string;
          project_id: string;
          original_filename: string;
          row_count: number;
          columns_detected: string[];
          validation_status: string;
          validation_details: Record<string, unknown>;
          snapshot_number: number;
          created_at: string;
        };
        Insert: {
          project_id: string;
          original_filename: string;
          columns_detected: string[];
          validation_status: string;
          validation_details: Record<string, unknown>;
          row_count?: number;
          snapshot_number?: number;
          id?: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          original_filename?: string;
          row_count?: number;
          columns_detected?: string[];
          validation_status?: string;
          validation_details?: Record<string, unknown>;
          snapshot_number?: number;
        };
        Relationships: [];
      };
      performance_rows: {
        Row: {
          id: string;
          upload_id: string;
          project_id: string;
          creative_id: string | null;
          source_filename: string | null;
          source_creative_id: string | null;
          source_ad_id: string | null;
          source_asset_id: string | null;
          source_ad_name: string | null;
          source_creative_name: string | null;
          impressions: number | null;
          clicks: number | null;
          spend: number | null;
          conversions: number | null;
          revenue: number | null;
          date_start: string | null;
          date_end: string | null;
          campaign_name: string | null;
          adset_name: string | null;
          platform: string | null;
          placement: string | null;
          snapshot_number: number;
          is_latest: boolean;
          extra_columns: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          upload_id: string;
          project_id: string;
          creative_id?: string | null;
          source_filename?: string | null;
          source_creative_id?: string | null;
          source_ad_id?: string | null;
          source_asset_id?: string | null;
          source_ad_name?: string | null;
          source_creative_name?: string | null;
          impressions?: number | null;
          clicks?: number | null;
          spend?: number | null;
          conversions?: number | null;
          revenue?: number | null;
          date_start?: string | null;
          date_end?: string | null;
          campaign_name?: string | null;
          adset_name?: string | null;
          platform?: string | null;
          placement?: string | null;
          snapshot_number?: number;
          is_latest?: boolean;
          extra_columns?: Record<string, unknown>;
          id?: string;
          created_at?: string;
        };
        Update: {
          upload_id?: string;
          project_id?: string;
          creative_id?: string | null;
          source_filename?: string | null;
          impressions?: number | null;
          clicks?: number | null;
          spend?: number | null;
          conversions?: number | null;
          revenue?: number | null;
          snapshot_number?: number;
          is_latest?: boolean;
          extra_columns?: Record<string, unknown>;
        };
        Relationships: [];
      };
      creative_mappings: {
        Row: {
          id: string;
          project_id: string;
          creative_id: string;
          performance_row_id: string;
          match_method: string;
          match_confidence: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          creative_id: string;
          performance_row_id: string;
          match_method: string;
          status: string;
          match_confidence?: number;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          match_method?: string;
          match_confidence?: number;
          status?: string;
        };
        Relationships: [];
      };
      variable_schemas: {
        Row: {
          id: string;
          project_id: string;
          version: number;
          is_active: boolean;
          variables: VariableDefinition[];
          created_at: string;
        };
        Insert: {
          project_id: string;
          variables: VariableDefinition[];
          version?: number;
          is_active?: boolean;
          id?: string;
          created_at?: string;
        };
        Update: {
          variables?: VariableDefinition[];
          version?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      analysis_runs: {
        Row: {
          id: string;
          project_id: string;
          schema_id: string;
          status: string;
          total_creatives: number;
          completed_creatives: number;
          failed_creatives: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          schema_id: string;
          status: string;
          started_at?: string | null;
          completed_at?: string | null;
          total_creatives?: number;
          completed_creatives?: number;
          failed_creatives?: number;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_cost?: number;
          id?: string;
          created_at?: string;
        };
        Update: {
          status?: string;
          total_creatives?: number;
          completed_creatives?: number;
          failed_creatives?: number;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_cost?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      extraction_results: {
        Row: {
          id: string;
          run_id: string;
          creative_id: string;
          extracted_variables: Record<string, unknown>;
          input_tokens: number;
          output_tokens: number;
          cost: number;
          duration_ms: number | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          run_id: string;
          creative_id: string;
          extracted_variables: Record<string, unknown>;
          status: string;
          input_tokens?: number;
          output_tokens?: number;
          cost?: number;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: {
          extracted_variables?: Record<string, unknown>;
          input_tokens?: number;
          output_tokens?: number;
          cost?: number;
          duration_ms?: number | null;
          status?: string;
          error_message?: string | null;
        };
        Relationships: [];
      };
      insights: {
        Row: {
          id: string;
          project_id: string;
          run_id: string | null;
          title: string;
          body: string;
          evidence: string | null;
          sample_size: number | null;
          confidence_label: string;
          recommended_test: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          title: string;
          body: string;
          run_id?: string | null;
          evidence?: string | null;
          sample_size?: number | null;
          confidence_label?: string;
          recommended_test?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          evidence?: string | null;
          sample_size?: number | null;
          confidence_label?: string;
          recommended_test?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type VariableDefinition = {
  name: string;
  type: "string" | "boolean" | "integer" | "enum";
  enum_values?: string[];
  description?: string;
  source: "universal" | "category" | "ai_suggested" | "custom";
  enabled: boolean;
};

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Creative = Database["public"]["Tables"]["creatives"]["Row"];
export type PerformanceUpload =
  Database["public"]["Tables"]["performance_uploads"]["Row"];
export type PerformanceRow =
  Database["public"]["Tables"]["performance_rows"]["Row"];
export type CreativeMapping =
  Database["public"]["Tables"]["creative_mappings"]["Row"];
export type VariableSchema =
  Database["public"]["Tables"]["variable_schemas"]["Row"];
export type AnalysisRun = Database["public"]["Tables"]["analysis_runs"]["Row"];
export type ExtractionResult =
  Database["public"]["Tables"]["extraction_results"]["Row"];
export type Insight = Database["public"]["Tables"]["insights"]["Row"];
