import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePremiumStatus, cancelPremium } from "@/lib/profile/actions";

// PayPal Webhook Event Types
type PayPalEvent = {
  event_type: string;
  resource: {
    id: string;
    plan_id?: string;
    custom_id?: string;
    subscriber?: {
      email_address?: string;
    };
    billing_info?: {
      cycle_executions?: Array<{
        tenure_type: string;
        sequence: number;
      }>;
    };
  };
};

/**
 * PayPal Webhook Handler
 * 
 * Events handled:
 * - BILLING.SUBSCRIPTION.ACTIVATED: Subscription started
 * - BILLING.SUBSCRIPTION.CANCELLED: User cancelled
 * - BILLING.SUBSCRIPTION.EXPIRED: Subscription ended
 * - BILLING.SUBSCRIPTION.SUSPENDED: Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    const body: PayPalEvent = await request.json();
    
    // TODO: Verify webhook signature in production
    // const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    // const verified = await verifyPayPalWebhook(request, webhookId);
    
    console.log("PayPal webhook received:", body.event_type);

    const subscriptionId = body.resource.id;
    const customId = body.resource.custom_id; // This should be the user ID

    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    
    let userId = customId;
    
    if (!userId) {
      // Look up user by subscription ID
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("paypal_subscription_id", subscriptionId)
        .single();
      
      userId = profile?.id;
    }

    if (!userId) {
      console.error("Could not find user for subscription:", subscriptionId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const planId = body.resource.plan_id;
        let tier: "monthly" | "quarterly" | "yearly" = "monthly";

        if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_YEARLY) {
          tier = "yearly";
        } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_QUARTERLY) {
          tier = "quarterly";
        }

        await updatePremiumStatus(userId, subscriptionId, tier);
        console.log(`Subscription activated for user: ${userId} (${tier})`);
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await cancelPremium(userId);
        console.log("Subscription cancelled for user:", userId);
        break;

      default:
        console.log("Unhandled PayPal event:", body.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
