import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase-browser";

export const headerAccountPath = "/account/header-session";
export const engineeringToolOrigins = [
  "https://snow.linkoteq.com",
  "https://wsection.linkoteq.com",
  "https://3dmodel.linkoteq.com",
];

type HeaderAccount = { name: string; internalTools: boolean };
const signedOut = { name: "", internalTools: false };

export function subscribeHeaderAccount(render: (account: HeaderAccount) => void) {
  const client = getSupabase();
  if (!client) {
    render(signedOut);
    return () => {};
  }
  const supabase = client;

  let revision = 0;
  let accountId: string | undefined;
  let account = signedOut;
  function update(user: User | undefined) {
    const check = ++revision;
    const name = [user?.user_metadata.full_name, user?.user_metadata.name, user?.email?.split("@")[0]]
      .find(value => typeof value === "string" && value.trim());
    account = {
      name: user ? (typeof name === "string" ? name.trim().slice(0, 120) : "Account") : "",
      internalTools: Boolean(user && user.id === accountId && account.internalTools),
    };
    accountId = user?.id;
    render(account);
    if (!user) return;

    // Run database reads after the Supabase auth callback has returned.
    setTimeout(async () => {
      if (check !== revision) return;
      try {
        const [permissions, owner] = await Promise.all([
          supabase.rpc("platform_my_permissions"),
          supabase.rpc("platform_access_is_owner"),
        ]);
        if (check !== revision) return;
        const grants: unknown = permissions.data;
        account = {
          ...account,
          internalTools: owner.data === true ||
            (Array.isArray(grants) && grants.includes("engineering_tools_internal")),
        };
      } catch {
        if (check !== revision) return;
        account = { ...account, internalTools: false };
      }
      render(account);
    }, 0);
  }

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => update(session?.user));
  async function restore() {
    const check = revision;
    const { data } = await supabase.auth.getSession();
    if (check === revision) update(data.session?.user);
  }
  function onPageShow(event: PageTransitionEvent) {
    if (event.persisted) void restore();
  }
  window.addEventListener("pageshow", onPageShow);

  return () => {
    ++revision;
    listener.subscription.unsubscribe();
    window.removeEventListener("pageshow", onPageShow);
  };
}

export async function signOutHeaderAccount() {
  const supabase = getSupabase();
  if (!supabase) return true;
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (!error) return true;
    const { data, error: sessionError } = await supabase.auth.getSession();
    return !sessionError && !data.session;
  } catch {
    return false;
  }
}
