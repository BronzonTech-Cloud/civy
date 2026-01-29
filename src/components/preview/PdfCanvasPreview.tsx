"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import { pdf } from "@react-pdf/renderer";
import type { Resume } from "@/types/resume";
import { UniversalPdf } from "@/components/pdf/UniversalPdf";
import { PdfTranslations } from "@/components/pdf/engine/ItemRenderers";
import { ScrollArea } from "@/components/ui/scroll-area";

// Set worker path for pdf.js - use jsdelivr CDN which has the latest version
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfCanvasPreviewProps {
  resume: Resume;
  translations: PdfTranslations;
  templateName?: string;
}

export function PdfCanvasPreview({ 
  resume, 
  translations,
  templateName = "modern" 
}: PdfCanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  // Generate PDF blob from react-pdf/renderer
  const generatePdfBlob = useCallback(async () => {
    try {
      const pdfDocument = (
        <UniversalPdf 
          resume={resume} 
          templateName={templateName} 
          translations={translations} 
        />
      );
      const blob = await pdf(pdfDocument).toBlob();
      return blob;
    } catch (err) {
      console.error("Error generating PDF:", err);
      throw err;
    }
  }, [resume, templateName, translations]);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const blob = await generatePdfBlob();
        const arrayBuffer = await blob.arrayBuffer();
        
        if (cancelled) return;

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        
        if (cancelled) {
          doc.destroy();
          return;
        }

        setPdfDoc(doc);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [generatePdfBlob]);

  // Render PDF page to canvas - responsive to container width
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      const page = await pdfDoc.getPage(1);
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      // Get container width for responsive scaling
      const containerWidth = container.clientWidth;
      
      // Get original page dimensions
      const viewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit container width with padding
      const padding = 32; // 16px on each side
      const availableWidth = containerWidth - padding;
      const scale = availableWidth / viewport.width;
      
      // Apply scale
      const scaledViewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render
      renderTaskRef.current = page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas: canvas,
      });

      await renderTaskRef.current.promise;
    } catch (err) {
      // Ignore cancelled renders
      if (err instanceof Error && err.message.includes("cancelled")) {
        return;
      }
      console.error("Error rendering PDF page:", err);
    }
  }, [pdfDoc]);

  // Re-render on pdfDoc change
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, renderPage]);

  // Re-render on container resize - debounced to prevent blinking
  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastWidth = containerRef.current.clientWidth;

    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentRect.width;
      
      // Only re-render if width changed by more than 5px (prevents scrollbar flicker)
      if (Math.abs(newWidth - lastWidth) < 5) return;
      
      lastWidth = newWidth;

      // Debounce: wait for resize to settle
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        renderPage();
      }, 50);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [renderPage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div 
        ref={containerRef} 
        className="w-full flex flex-col items-center"
        style={{
          minHeight: '100%',
          backgroundColor: 'hsl(var(--muted) / 0.5)',
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.1) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Generating preview...</p>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="my-4 shadow-lg"
          style={{ 
            display: isLoading ? 'none' : 'block',
            maxWidth: '100%',
          }}
        />
      </div>
    </ScrollArea>
  );
}
