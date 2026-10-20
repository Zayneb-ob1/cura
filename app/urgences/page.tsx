import { permanentRedirect } from "next/navigation";

// The emergency page was removed; old links go to the appointment page.
export default function EmergencyPage() {
  permanentRedirect("/rendez-vous");
}
