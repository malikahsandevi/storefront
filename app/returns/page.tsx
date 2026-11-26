import type { Metadata } from "next";
import Link from "next/link";
import PolicyLayout from "@/components/PolicyLayout";
import { SITE_URL, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const description = `How returns and refunds work at ${name} — what can be returned, the time window, and how your refund is issued.`;
  return {
    title: "Returns & Refunds",
    description,
    alternates: { canonical: `${SITE_URL}/returns` },
    openGraph: { title: `Returns & Refunds | ${name}`, description, url: `${SITE_URL}/returns`, type: "website" },
  };
}

export default async function ReturnsPage() {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const contact = config.contactEmail
    ? `To start a return, contact us at ${config.contactEmail}${config.phone ? ` or ${config.phone}` : ""} with your order number, and we will guide you through the next step.`
    : "To start a return, contact us through the details shown in this store's footer with your order number, and we will guide you through the next step.";

  return (
    <PolicyLayout
      label="Customer Service"
      title={
        <>
          Returns &amp; <strong>Refunds</strong>
        </>
      }
      intro={`Something not right with your order from ${name}? This page explains what can be returned, how long you have, and how refunds are handled.`}
      sections={[
        {
          heading: "What can be returned",
          body: [
            "Items can be returned within 14 days of delivery if they are unused, in their original condition and, where applicable, in their original packaging. An item that arrives damaged, faulty, or different from what you ordered can always be returned — contact us as soon as you notice the problem.",
            "For hygiene and safety reasons, certain items that have been opened or used cannot be accepted back unless they are faulty. If you are unsure about an item, ask us before sending it.",
          ],
        },
        {
          heading: "How to return an item",
          body: [
            contact,
            "Please do not send anything back before speaking to us — we will confirm the return and tell you exactly where and how to send it. Keep your proof of posting until your refund is complete.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "Once your return reaches us and passes inspection, your refund is issued to your original payment method wherever possible. For Cash on Delivery orders, we will arrange the refund with you directly. Refunds are processed within a reasonable time after the returned item is received — delivery charges are refunded only where the return is due to our error or a faulty item.",
            <>
              You can follow the status of any order from the{" "}
              <Link href="/track-order" className="text-primary underline-offset-2 hover:underline">
                Track Your Order
              </Link>{" "}
              page, and of any refund from your account's order history.
            </>,
          ],
        },
        {
          heading: "Exchanges",
          body: [
            "If you would like a different item instead, tell us when you contact us about the return. Where stock allows, we will arrange the exchange; any price difference is settled before the replacement is sent.",
          ],
        },
      ]}
    />
  );
}
