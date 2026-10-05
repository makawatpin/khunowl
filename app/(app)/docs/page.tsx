import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/supabase/storage";
import { todayISOInBangkok } from "@/lib/dates/today";
import { DocsClient, type DocumentItem } from "@/components/docs/docs-client";

export default async function DocsPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const { data: docRows } = await supabase
    .from("documents")
    .select("id, name, type, expiry, related, note, file_path");

  const documents: DocumentItem[] = await Promise.all(
    (docRows ?? []).map(async (d) => ({
      id: d.id, name: d.name, type: d.type, expiry: d.expiry, related: d.related, note: d.note,
      fileUrl: await signedUrl(supabase, d.file_path),
    })),
  );

  return <DocsClient documents={documents} todayISO={todayISO} />;
}
