"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SparklesIcon } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { PremiumUpgradeForm } from "@/components/upgrade/PremiumUpgradeForm";

export default function UpgradePage() {
  const { isPremium, profile } = useUser();
  const t = useTranslations("premium");
  const router = useRouter();

  const isChangingPlan = isPremium && profile?.premium_tier;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="size-6 text-yellow-500" />
            {isChangingPlan ? t("changePlan") : t("title")}
          </h1>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-3xl mb-2">
              {isChangingPlan ? t("changePlan") : t("title")}
            </CardTitle>
            <CardDescription className="text-base max-w-xl mx-auto">
              {t("subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <PremiumUpgradeForm 
              isPremium={isPremium}
              currentTier={profile?.premium_tier}
              onSuccess={() => router.push("/dashboard/settings")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
