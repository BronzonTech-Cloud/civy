import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GDPR Data Export — GET /api/export
 * Returns all user data as a JSON download.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch all resumes (including soft-deleted)
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, slug, data, is_public, version, created_at, updated_at, deleted_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch resume history (if any)
  const { data: history } = await supabase
    .from("resume_history")
    .select("id, resume_id, data, version, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch analytics events
  const { data: events } = await supabase
    .from("resume_events")
    .select("id, resume_id, event_type, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || null,
      createdAt: user.created_at,
    },
    profile: profile || null,
    resumes: resumes || [],
    resumeHistory: history || [],
    events: events || [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="civy-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
