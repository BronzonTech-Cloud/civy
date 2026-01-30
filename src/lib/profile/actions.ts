"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type Profile = {
  id: string;
  is_premium: boolean;
  premium_tier: "monthly" | "quarterly" | "yearly" | null;
  premium_until: string | null;
  paypal_subscription_id: string | null;
};

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // Profile might not exist yet - return default
    if (error.code === "PGRST116") {
      return {
        id: user.id,
        is_premium: false,
        premium_tier: null,
        premium_until: null,
        paypal_subscription_id: null,
      };
    }
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Update user's premium status (Admin/Server-only)
 * Uses Service Role Key to bypass RLS
 */
export async function updatePremiumStatus(
  userId: string,
  subscriptionId: string,
  tier: "monthly" | "quarterly" | "yearly"
): Promise<{ error?: string }> {
  // Use Admin Client because users should NOT be able to update their own profile's is_premium field
  const supabase = createAdminClient();

  // Calculate premium_until based on tier
  const now = new Date();
  let premiumUntil: Date;
  
  switch (tier) {
    case "monthly":
      premiumUntil = new Date(now.setMonth(now.getMonth() + 1));
      break;
    case "quarterly":
      premiumUntil = new Date(now.setMonth(now.getMonth() + 3));
      break;
    case "yearly":
      premiumUntil = new Date(now.setFullYear(now.getFullYear() + 1));
      break;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      is_premium: true,
      premium_tier: tier,
      premium_until: premiumUntil.toISOString(),
      paypal_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating premium status:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {};
}

/**
 * Cancel premium subscription (Admin/Server-only)
 */
export async function cancelPremium(userId: string): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_premium: false,
      premium_tier: null,
      paypal_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error canceling premium:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {};
}
