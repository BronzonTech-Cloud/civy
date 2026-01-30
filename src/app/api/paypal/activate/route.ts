import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updatePremiumStatus } from "@/lib/profile/actions";

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, tier } = await request.json();

    if (!subscriptionId || !tier) {
      return NextResponse.json(
        { error: "Missing subscriptionId or tier" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Update premium status
    const result = await updatePremiumStatus(user.id, subscriptionId, tier);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayPal activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
