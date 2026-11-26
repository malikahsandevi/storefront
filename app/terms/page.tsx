import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { SITE_URL, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const description = `The terms that apply when you buy from ${name} — orders, payment, delivery, returns and your account.`;
  return {
    title: "Terms of Service",
    description,
    alternates: { canonical: `${SITE_URL}/terms` },
    openGraph: { title: `Terms of Service | ${name}`, description, url: `${SITE_URL}/terms`, type: "website" },
  };
}

export default async function TermsPage() {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const contact = config.contactEmail
    ? `Questions about these terms can be sent to ${config.contactEmail}${config.phone ? ` or raised by phone at ${config.phone}` : ""}.`
    : "Questions about these terms can be raised through the contact details shown in this store's footer.";

  return (
    <PolicyLayout
      label="Legal"
      title={
        <>
          Terms of <strong>Service</strong>
        </>
      }
      intro={`By placing an order with ${name}, you agree to these terms. Please read them before you buy — they set out how orders, payment, delivery and returns work in this store.`}
      sections={[
        {
          heading: "Orders",
          body: [
            "An order is an offer to buy the items in it. We confirm every order by email, and the sale is complete when we accept and prepare it. Prices and totals are recomputed by our server at checkout, so the total you see before placing the order is the total you pay — coupons included.",
            "We may cancel an order if an item is out of stock, a price was shown in clear error, or we cannot deliver to your address. If you have already paid for a cancelled order, you will be refunded in full.",
          ],
        },
        {
          heading: "Prices and payment",
          body: [
            `All prices are shown in ${config.currency}. The store accepts the payment methods listed at checkout. With Cash on Delivery, payment is due when your order arrives. With online payment, your card is charged through our payment provider when you complete checkout.`,
          ],
        },
        {
          heading: "Delivery",
          body: [
            "Delivery charges and the available delivery methods are shown at checkout before you place your order, calculated from the method and option you choose. Every order receives an order number you can use to follow its progress. Delivery times given by a courier are estimates — delays outside our control can happen, and we will keep your tracking page updated.",
          ],
        },
        {
          heading: "Returns and refunds",
          body: [
            "If something is wrong with your order, or you change your mind, our Returns & Refunds policy explains what can be returned, the condition items must be in, and how refunds are issued. That policy forms part of these terms.",
          ],
        },
        {
          heading: "Your account",
          body: [
            "You are responsible for keeping your account password private and for the orders placed through your account. Tell us promptly if you believe your account has been used without your permission.",
          ],
        },
        {
          heading: "Products and content",
          body: [
            "We work to keep product descriptions, prices and stock counts accurate, and stock shown on a product page is the store's live count. Reviews on this store are written by customers and moderated before they appear; a review reflects its writer's experience, not a promise about a product.",
          ],
        },
        {
          heading: "Changes and contact",
          body: [
            `We may update these terms from time to time; the version on this page applies to new orders from the moment it is published. ${contact}`,
          ],
        },
      ]}
    />
  );
}
