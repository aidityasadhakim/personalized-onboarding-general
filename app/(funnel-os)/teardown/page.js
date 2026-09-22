import { permanentRedirect } from "next/navigation";

/* The console used to start here; it now lives at the site root. */
export default function TeardownIndex() {
  permanentRedirect("/");
}
