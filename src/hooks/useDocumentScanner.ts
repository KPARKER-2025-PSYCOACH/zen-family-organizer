import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useDocumentScanner() {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const scanDocument = useCallback(async (file: File): Promise<number> => {
    setScanning(true);
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let fileContent = "";

      if (isPdf) {
        // Send raw base64 — Gemini will read the PDF directly via multimodal
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileContent = btoa(binary);
      } else {
        fileContent = await file.text();
      }

      if (!fileContent || fileContent.length < 10) {
        toast({ title: "Could not read file", variant: "destructive" });
        setScanning(false);
        return 0;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        setScanning(false);
        return 0;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scan-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileContent,
            isPdf,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast({
          title: `Found ${data.count} event${data.count !== 1 ? "s" : ""}`,
          description: "Review and approve detected events below",
        });
        return data.count;
      } else {
        toast({ title: "Scan failed", description: data.error, variant: "destructive" });
        return 0;
      }
    } catch (e) {
      console.error("Document scan error:", e);
      toast({ title: "Scan error", variant: "destructive" });
      return 0;
    } finally {
      setScanning(false);
    }
  }, [toast]);

  return { scanning, scanDocument };
}
