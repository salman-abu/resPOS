import { redirect } from "next/navigation";

/**
 * Root redirect — send everyone to the staff PIN selector.
 * Auth middleware (Phase 5+) will redirect role-appropriately from there.
 */
export default function RootPage() {
  redirect("/pos/pin");
}
