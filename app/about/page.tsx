import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { SITE_URL, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const description = `About ${name} — what we sell, how ordering works, and how to reach the store.`;
  return {
    title: "About Us",
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: { title: `About Us | ${name}`, description, url: `${SITE_URL}/about`, type: "website" },
  };
}

export default async function AboutPage() {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const paymentNames = config.paymentMethods.map((m) => m.name).filter(Boolean);
  const contact = config.contactEmail
    ? `Write to us at ${config.contactEmail}${config.phone ? ` or call ${config.phone}` : ""} — the store answers directly, with no ticket system in between.`
    : "Reach the store through the contact details in the footer below — we answer directly, with no ticket system in between.";

  return (
    <PolicyLayout
      label="The Store"
      title={
        <>
          About <strong>{name}</strong>
        </>
      }
      intro={
        config.tagline ||
        `${name} is an online store built around a simple idea: real products, honest prices, and delivery you can follow from checkout to your door.`
      }
      sections={[
        {
          heading: "What we sell",
          body: [
            "Everything in the catalog on this website is the store's live stock — the counts on a product page are the counts in the store, and a product that sells out says so. Prices are confirmed by the store's own server at checkout, so what you see before you place an order is what you pay.",
          ],
        },
        {
          heading: "How ordering works",
          body: [
            "Browse the catalog, add what you need to your cart, and check out as a guest or with an account. Every order gets an order number and can be tracked from this website. " +
              (paymentNames.length
                ? `We accept ${paymentNames.join(" and ")}.`
                : "Cash on Delivery is available on every order."),
          ],
        },
        {
          heading: "Talk to us",
          body: [contact],
        },
      ]}
    />
  );
}
