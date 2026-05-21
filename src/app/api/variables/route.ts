import { NextRequest, NextResponse } from "next/server";
import type { VariableDefinition } from "@/types/database";
import { getServerSupabase } from "@/lib/supabase";

/**
 * GET /api/variables?projectId=... — Fetch the active variable schema.
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from("variable_schemas")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ schema: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/variables — Save a new variable schema version.
 * Deactivates previous versions and inserts the new one as active.
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, variables } = (await request.json()) as {
      projectId: string;
      variables: VariableDefinition[];
    };

    if (!projectId || !variables || !Array.isArray(variables)) {
      return NextResponse.json(
        { error: "Missing projectId or variables" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Get the latest version number
    const { data: latest } = await supabase
      .from("variable_schemas")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version ?? 0) + 1;

    // Deactivate previous versions
    await supabase
      .from("variable_schemas")
      .update({ is_active: false })
      .eq("project_id", projectId);

    // Insert new version
    const { data, error } = await supabase
      .from("variable_schemas")
      .insert({
        project_id: projectId,
        variables,
        version: nextVersion,
        is_active: true,
      })
      .select("id, version")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schemaId: data.id,
      version: data.version,
      variableCount: variables.filter((v) => v.enabled).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
