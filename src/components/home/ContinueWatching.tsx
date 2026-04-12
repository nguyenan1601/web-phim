import { getHistoryAction } from "@/app/actions/history";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ClientGuestHistory from "./ClientGuestHistory";

export default async function ContinueWatching() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const history = await getHistoryAction();

  return <ClientGuestHistory serverHistory={history || []} userId={user?.id} />;
}
