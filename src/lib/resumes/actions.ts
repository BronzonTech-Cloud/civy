"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ResumeListItem = {
  id: string;
  title: string;
  updated_at: string;
  is_public: boolean;
  slug: string | null;
};

const defaultResumeData = {
  metadata: {
    template: "modern",
    typography: { fontFamily: "inter", fontSize: "md" },
    colors: {
      background: "#ffffff",
      text: "#1f2937",
      accents: ["#2563eb", "#3b82f6", "#e5e7eb", "#6b7280"],
    },
  },
  personal: {
    fullName: "",
    details: [],
  },
  sections: [],
};

export async function getResumes(): Promise<ResumeListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, updated_at, is_public, slug")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch resumes:", error.message);
    return [];
  }

  return data ?? [];
}

import { RESUME_LIMITS } from "@/constants/limits";
import { getProfile } from "@/lib/profile/actions";

export async function createResume(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-side limit check
  const [countResult, profile] = await Promise.all([
    supabase
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null),
    getProfile(),
  ]);

  const resumeCount = countResult.count ?? 0;
  const isPremium = profile?.is_premium ?? false;
  const maxResumes = isPremium ? RESUME_LIMITS.PRO_MAX_RESUMES : RESUME_LIMITS.FREE_MAX_RESUMES;

  if (resumeCount >= maxResumes) {
    throw new Error("Resume limit reached. Please upgrade to Pro.");
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: "Untitled Resume",
      data: defaultResumeData,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create resume:", error.message);
    throw new Error(error.message);
  }

  redirect(`/editor/${data.id}`);
}

export async function deleteResume(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("resumes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete resume:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return {};
}

export type ResumeData = {
  id: string;
  title: string;
  data: Record<string, unknown>;
  is_public: boolean;
  slug: string | null;
};

export async function getResume(id: string): Promise<ResumeData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, data, is_public, slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Failed to fetch resume:", error.message);
    return null;
  }

  return data;
}

export async function saveResume(
  id: string,
  updates: { title?: string; data?: Record<string, unknown> }
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("resumes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to save resume:", error.message);
    return { error: error.message };
  }

  return {};
}

// ============================================
// PUBLIC SHARING ACTIONS
// ============================================

export type PublicResumeData = {
  id: string;
  title: string;
  data: Record<string, unknown>;
};

/**
 * Get a public resume by its share slug.
 * No authentication required - but resume must be public.
 */
export async function getPublicResume(slug: string): Promise<PublicResumeData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, data")
    .eq("slug", slug)
    .eq("is_public", true)
    .is("deleted_at", null)
    .single();

  if (error) {
    // Not found or not public
    return null;
  }

  return data;
}

/**
 * Generate a unique 8-character slug
 */
function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

/**
 * Toggle resume visibility (public/private).
 * If making public and no slug exists, generate one.
 */
export async function toggleResumeVisibility(
  id: string
): Promise<{ isPublic: boolean; slug: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isPublic: false, slug: null, error: "Not authenticated" };
  }

  // Get current state
  const { data: current, error: fetchError } = await supabase
    .from("resumes")
    .select("is_public, slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !current) {
    return { isPublic: false, slug: null, error: "Resume not found" };
  }

  const newIsPublic = !current.is_public;
  const slug = newIsPublic && !current.slug ? generateSlug() : current.slug;

  const { error: updateError } = await supabase
    .from("resumes")
    .update({ is_public: newIsPublic, slug })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { isPublic: current.is_public, slug: current.slug, error: updateError.message };
  }

  revalidatePath("/dashboard");
  return { isPublic: newIsPublic, slug };
}

/**
 * Regenerate share slug (invalidates old public link).
 */
export async function regenerateSlug(
  id: string
): Promise<{ slug: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { slug: null, error: "Not authenticated" };
  }

  const newSlug = generateSlug();

  const { error } = await supabase
    .from("resumes")
    .update({ slug: newSlug })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { slug: null, error: error.message };
  }

  revalidatePath("/dashboard");
  return { slug: newSlug };
}

