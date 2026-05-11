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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["projects"]["Row"],
          "id" | "created_at" | "updated_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["projects"]["Row"],
              "id" | "created_at" | "updated_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["creatives"]["Row"],
          "id" | "created_at"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["creatives"]["Row"],
              "id" | "created_at"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["creatives"]["Insert"]>;
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
        Insert: Omit<
          Database["public"]["Tables"]["performance_uploads"]["Row"],
          "id" | "created_at" | "row_count" | "snapshot_number"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["performance_uploads"]["Row"],
              "id" | "created_at" | "row_count" | "snapshot_number"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["performance_uploads"]["Insert"]
        >;
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
        Insert: Omit<
          Database["public"]["Tables"]["performance_rows"]["Row"],
          "id" | "created_at" | "snapshot_number" | "is_latest"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["performance_rows"]["Row"],
              "id" | "created_at" | "snapshot_number" | "is_latest"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["performance_rows"]["Insert"]
        >;
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
        Insert: Omit<
          Database["public"]["Tables"]["creative_mappings"]["Row"],
          "id" | "created_at" | "updated_at" | "match_confidence"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["creative_mappings"]["Row"],
              "id" | "created_at" | "updated_at" | "match_confidence"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["creative_mappings"]["Insert"]
        >;
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
        Insert: Omit<
          Database["public"]["Tables"]["variable_schemas"]["Row"],
          "id" | "created_at" | "version" | "is_active"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["variable_schemas"]["Row"],
              "id" | "created_at" | "version" | "is_active"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["variable_schemas"]["Insert"]
        >;
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
        Insert: Omit<
          Database["public"]["Tables"]["analysis_runs"]["Row"],
          | "id"
          | "created_at"
          | "total_creatives"
          | "completed_creatives"
          | "failed_creatives"
          | "total_input_tokens"
          | "total_output_tokens"
          | "total_cost"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["analysis_runs"]["Row"],
              | "id"
              | "created_at"
              | "total_creatives"
              | "completed_creatives"
              | "failed_creatives"
              | "total_input_tokens"
              | "total_output_tokens"
              | "total_cost"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["analysis_runs"]["Insert"]
        >;
      };
      extraction_results: {
        Row: {
          id: string;
          run_id: string;
          creative_id: string;
          extracted_variables: Record<string, unknown>;
          confidence: number | null;
          notes: string | null;
          input_tokens: number;
          output_tokens: number;
          cost: number;
          duration_ms: number | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["extraction_results"]["Row"],
          "id" | "created_at" | "input_tokens" | "output_tokens" | "cost"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["extraction_results"]["Row"],
              "id" | "created_at" | "input_tokens" | "output_tokens" | "cost"
            >
          >;
        Update: Partial<
          Database["public"]["Tables"]["extraction_results"]["Insert"]
        >;
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
        Insert: Omit<
          Database["public"]["Tables"]["insights"]["Row"],
          "id" | "created_at" | "confidence_label"
        > &
          Partial<
            Pick<
              Database["public"]["Tables"]["insights"]["Row"],
              "id" | "created_at" | "confidence_label"
            >
          >;
        Update: Partial<Database["public"]["Tables"]["insights"]["Insert"]>;
      };
    };
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
