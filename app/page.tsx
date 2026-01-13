// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/rank?platform=youtube&range=1d");
}
