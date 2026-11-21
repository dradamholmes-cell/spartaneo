import { redirect } from "next/navigation";

/** Never send a customer to the disabled on-site PayPal checkout.
 * Product-specific Printify URLs must be verified before being linked.
 */
export default function TrippyProductFallback() {
  redirect("https://spartaneo.printify.me/products");
}
