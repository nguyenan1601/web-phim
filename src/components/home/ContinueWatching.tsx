import { getHistoryAction } from "@/app/actions/history";
import ClientGuestHistory from "./ClientGuestHistory";

export default async function ContinueWatching() {
  const history = await getHistoryAction();

  // Always render the client component which reactively reads localStorage
  // Pass server history as initial data - client component will merge/fallback
  return <ClientGuestHistory serverHistory={history || []} />;
}
