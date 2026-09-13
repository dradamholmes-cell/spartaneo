import { notFound, redirect } from "next/navigation";
import { requireChatGPTUser } from "../../chatgpt-auth";

export const metadata = { title: "OGB Book Runner | Spartaneo", robots: { index: false, follow: false } };

export default async function BookRunnerPage() {
  const user = await requireChatGPTUser("/tools/book-runner");
  const allowed = (process.env.SPARTANEO_ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) notFound();
  redirect("https://ogb-free-comic-runner.l3onidas.chatgpt.site");
}
