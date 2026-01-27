"use client";

import { useResumeStore } from "@/stores/useResumeStore";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionEditor } from "@/components/editor/SectionEditor";
import { TrashIcon } from "lucide-react";

export function SectionManager() {
  const sections = useResumeStore((state) => state.resume.sections);
  const removeSection = useResumeStore((state) => state.removeSection);
  const updateSection = useResumeStore((state) => state.updateSection);

  const handleTitleChange = (sectionId: string, newTitle: string) => {
    updateSection(sectionId, { title: newTitle });
  };

  const handleRemoveSection = (sectionId: string) => {
    removeSection(sectionId);
  };

  return (
    <div className="space-y-4">
      {/* Existing Sections */}
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Input
                value={section.title}
                onChange={(e) => handleTitleChange(section.id, e.target.value)}
                className="text-base font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
              />
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveSection(section.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </CardAction>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <SectionEditor section={section} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}