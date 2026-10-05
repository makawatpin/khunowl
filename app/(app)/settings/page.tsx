import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let hasPin = false;
  let notifyEnabled = false;
  let budgets: Record<string, number> = {};
  let incomeList: { id: string; name: string; amount: number; dayOfMonth: number; accountId: string }[] = [];
  let accounts: { id: string; name: string }[] = [];

  if (user) {
    const [{ data: profile }, { data: budgetRows }, { data: incomeRows }, { data: accountRows }] = await Promise.all([
      supabase.from("profiles").select("prefs").eq("user_id", user.id).single(),
      supabase.from("budgets").select("category, monthly_limit"),
      supabase.from("recurring_income").select("id, name, amount, day_of_month, account_id"),
      supabase.from("accounts").select("id, name").eq("archived", false),
    ]);
    const prefs = (profile?.prefs as { pin?: string; notify?: boolean } | null) ?? {};
    hasPin = !!prefs.pin;
    notifyEnabled = !!prefs.notify;
    budgets = Object.fromEntries((budgetRows ?? []).map((b) => [b.category, b.monthly_limit]));
    incomeList = (incomeRows ?? []).map((i) => ({ id: i.id, name: i.name, amount: i.amount, dayOfMonth: i.day_of_month, accountId: i.account_id ?? "" }));
    accounts = (accountRows ?? []).filter((a): a is { id: string; name: string } => !!a.id && !!a.name);
  }

  return <SettingsClient hasPin={hasPin} budgets={budgets} incomeList={incomeList} accounts={accounts} notifyEnabled={notifyEnabled} />;
}
