import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ResolvedResult = {
  resolvedUrl: string;
  isResolving: boolean;
  resolveError: string | null;
};

function parseSupabaseStorageUrl(input: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(input);

    // Already signed URLs (keep as-is)
    if (url.pathname.includes("/storage/v1/object/sign/") || url.searchParams.has("token")) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    // Expected:
    // storage/v1/object/public/{bucket}/{path...}
    // storage/v1/object/{bucket}/{path...}
    const storageIdx = parts.indexOf("storage");
    if (storageIdx === -1) return null;

    const objectIdx = parts.indexOf("object");
    if (objectIdx === -1) return null;

    const afterObject = parts.slice(objectIdx + 1);
    if (afterObject.length < 2) return null;

    const isPublic = afterObject[0] === "public";
    const bucket = isPublic ? afterObject[1] : afterObject[0];
    const pathParts = isPublic ? afterObject.slice(2) : afterObject.slice(1);
    const path = pathParts.join("/");

    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

export function useResolvedFileUrl(
  fileUrl: string,
  opts?: { enabled?: boolean; expiresInSeconds?: number }
): ResolvedResult {
  const enabled = opts?.enabled ?? true;
  const expiresInSeconds = opts?.expiresInSeconds ?? 60 * 10;

  const parsed = useMemo(() => parseSupabaseStorageUrl(fileUrl), [fileUrl]);
  const [resolvedUrl, setResolvedUrl] = useState(fileUrl);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setResolvedUrl(fileUrl);
      setResolveError(null);

      if (!enabled) return;
      if (!parsed) return;

      setIsResolving(true);
      try {
        const { data, error } = await supabase.storage
          .from(parsed.bucket)
          .createSignedUrl(parsed.path, expiresInSeconds);

        if (cancelled) return;
        if (error || !data?.signedUrl) throw error ?? new Error("signedUrl manquante");

        setResolvedUrl(data.signedUrl);
      } catch (e) {
        if (cancelled) return;
        setResolveError(e instanceof Error ? e.message : "Erreur de résolution URL");
        setResolvedUrl(fileUrl);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, expiresInSeconds, fileUrl, parsed]);

  return { resolvedUrl, isResolving, resolveError };
}
