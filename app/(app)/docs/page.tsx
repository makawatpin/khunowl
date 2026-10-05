import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/supabase/storage";
import { todayISOInBangkok } from "@/lib/dates/today";
import { DocsClient, type DocumentItem } from "@/components/docs/docs-client";

export default async function DocsPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const { data: docRows } = await supabase
    .from("documents")
    .select("id, name, type, expiry, related, note, file_path");

  const urls = await signedUrls(supabase, (docRows ?? []).map((d) => d.file_path));
  const documents: DocumentItem[] = (docRows ?? []).map((d) => ({
    id: d.id, name: d.name, type: d.type, expiry: d.expiry, related: d.related, note: d.note,
    fileUrl: (d.file_path && urls.get(d.file_path)) || null,
  }));

  return <DocsClient documents={documents} todayISO={todayISO} />;
}
