import { redirect } from "next/navigation";

/** Send visitors to the live, merchant-hosted checkout catalog. */
export default function ShirtsPage() {
  redirect("https://spartaneo.printify.me/products");
}
