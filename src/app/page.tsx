// Required: middleware calls supabase.auth.getUser() on every request — needs runtime env
export const dynamic = "force-dynamic";

import { AtlasApp } from "@/components/atlas-app";

export default function Home() {
  return <AtlasApp />;
}
