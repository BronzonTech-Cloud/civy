"use client";

import { PersonalInfo } from "@/types/resume";
import { ColorScheme } from "@/components/pdf/engine/PdfStyles";
import { PreviewItem } from "./PreviewItem";

interface PreviewHeaderProps {
  personal: PersonalInfo;
  colors: ColorScheme;
}

export function PreviewHeader({ personal, colors }: PreviewHeaderProps) {
  return (
    <header style={{ textAlign: 'center', marginBottom: '20px' }}>
      <h1 style={{ 
        fontSize: '24pt', 
        fontWeight: 700, 
        margin: '0 0 4px 0',
        letterSpacing: '-0.02em',
        color: colors.accents?.[0] || colors.text 
      }}>
        {personal.fullName}
      </h1>

      {personal.jobTitle && (
        <p style={{ 
          fontSize: '14pt', 
          margin: '0 0 12px 0', 
          fontWeight: 400,
          color: colors.accents?.[1] || colors.text 
        }}>
          {personal.jobTitle}
        </p>
      )}

      {personal.details.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '8px 16px',
          fontSize: '10pt'
        }}>
          {personal.details.map((item) => (
            <PreviewItem key={item.id} item={item} colors={colors} />
          ))}
        </div>
      )}
    </header>
  );
}
