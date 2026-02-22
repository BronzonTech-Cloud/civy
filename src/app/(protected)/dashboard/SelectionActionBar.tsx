"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { bulkDuplicateResumes, deleteResume } from "@/lib/resumes/actions";
import { useTranslations } from "next-intl";

interface SelectionActionBarProps {
  selectedResumes: Set<string>;
  setSelectedResumes: (selected: Set<string>) => void;
  setIsSelectionMode: (isSelectionMode: boolean) => void;
}

export function SelectionActionBar({
  selectedResumes,
  setSelectedResumes,
  setIsSelectionMode,
}: SelectionActionBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("dashboard");

  if (selectedResumes.size === 0) return null;

  const handleClearSelection = () => {
    setSelectedResumes(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDuplicate = () => {
    startTransition(async () => {
      try {
        const ids = Array.from(selectedResumes);
        await bulkDuplicateResumes(ids);
        
        toastManager.add({
          type: "success",
          title: t("bulkDuplicatedSuccess", { count: ids.length }),
        });
        
        handleClearSelection();
        router.refresh();
      } catch {
        toastManager.add({
          type: "error",
          title: "Error duplicating resumes",
        });
      }
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        const ids = Array.from(selectedResumes);
        // Loop through and delete sequentially/parallel
        await Promise.all(ids.map(id => deleteResume(id)));
        
        toastManager.add({
          type: "success",
          title: t("bulkDeletedSuccess", { count: ids.length }),
        });
        
        handleClearSelection();
        router.refresh();
      } catch {
        toastManager.add({
          type: "error",
          title: "Error deleting resumes",
        });
      }
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-4 py-3 bg-card border shadow-xl rounded-full animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap px-2">
          {t("itemsSelected", { count: selectedResumes.size })}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClearSelection}
          className="rounded-full h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkDuplicate}
          disabled={isPending}
        >
          <Copy className="h-4 w-4 mr-2" />
          {t("bulkDuplicate")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("bulkDelete")}
        </Button>
      </div>
    </div>
  );
}
