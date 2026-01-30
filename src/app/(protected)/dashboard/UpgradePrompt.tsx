"use client";

import { useTranslations } from "next-intl";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { Button } from "@/components/ui/button";
import { CrownIcon } from "lucide-react";

export function UpgradePrompt() {
  const t = useTranslations("dashboard");

  return (
    <div className="mt-8 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 text-center">
      <h3 className="text-lg font-semibold">{t("upgradeTitle")}</h3>
      <p className="text-muted-foreground mb-4">
        {t("upgradeDescription")}
      </p>
      <UpgradeModal
        trigger={
          <Button variant="default">
            <CrownIcon className="size-4" />
            {t("upgradeButton")}
          </Button>
        }
      />
    </div>
  );
}
