import { createClient } from "@/lib/supabase/server";
import { signedUrl } from "@/lib/supabase/storage";
import { todayISOInBangkok } from "@/lib/dates/today";
import { AssetsClient, type AssetItem } from "@/components/assets/assets-client";

export default async function AssetsPage() {
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();

  const [{ data: assetRows }, { data: accountRows }, { data: docRows }] = await Promise.all([
    supabase.from("assets").select("id, name, kind, brand, model, serial, price, purchased_on, store, warranty_until, note, sold, receipt_path").order("purchased_on", { ascending: false }),
    supabase.from("accounts").select("id, name").eq("archived", false),
    supabase.from("documents").select("id, name, type, expiry, related"),
  ]);

  const assets: AssetItem[] = await Promise.all(
    (assetRows ?? []).map(async (a) => ({
      id: a.id, name: a.name, kind: a.kind, brand: a.brand, model: a.model, serial: a.serial,
      price: a.price, purchasedOn: a.purchased_on, store: a.store, warrantyUntil: a.warranty_until,
      note: a.note, sold: a.sold, receiptUrl: await signedUrl(supabase, a.receipt_path),
    })),
  );

  const accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);
  const documents = (docRows ?? []).map((d) => ({ id: d.id, name: d.name, type: d.type, expiry: d.expiry, related: d.related }));

  return <AssetsClient assets={assets} accounts={accounts} documents={documents} todayISO={todayISO} />;
}
