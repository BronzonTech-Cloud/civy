"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CrownIcon, SparklesIcon } from "lucide-react";
import { PremiumUpgradeForm, PricingTier } from "@/components/upgrade/PremiumUpgradeForm";

type UpgradeModalProps = {
  trigger?: React.ReactElement;
  isPremium?: boolean;
  currentTier?: PricingTier | null;
};

export function UpgradeModal({ trigger, isPremium, currentTier }: UpgradeModalProps) {
  const t = useTranslations("premium");
  const isChangingPlan = isPremium && currentTier;

  return (
    <Dialog>
      <DialogTrigger render={trigger ?? <Button variant="default" />}>
        <CrownIcon className="size-4" />
        {isChangingPlan ? t("changePlan") : t("title")}
      </DialogTrigger>

      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-yellow-500" />
            {isChangingPlan ? t("changePlan") : t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <PremiumUpgradeForm 
            isPremium={isPremium}
            currentTier={currentTier}
          />
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
