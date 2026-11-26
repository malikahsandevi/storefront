import type { Metadata } from "next";
import PolicyLayout from "@/components/PolicyLayout";
import { SITE_URL, fetchStoreConfig, storeDisplayName } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const description = `How ${name} collects, uses and protects your personal information when you shop with us.`;
  return {
    title: "Privacy Policy",
    description,
    alternates: { canonical: `${SITE_URL}/privacy` },
    openGraph: { title: `Privacy Policy | ${name}`, description, url: `${SITE_URL}/privacy`, type: "website" },
  };
}

export default async function PrivacyPage() {
  const config = await fetchStoreConfig();
  const name = storeDisplayName(config);
  const contact = config.contactEmail
    ? `You can reach us about anything in this policy at ${config.contactEmail}${config.phone ? ` or ${config.phone}` : ""}.`
    : "You can reach us about anything in this policy through the contact details shown in this store's footer.";

  return (
    <PolicyLayout
      label="Legal"
      title={
        <>
          Privacy <strong>Policy</strong>
        </>
      }
      intro={`This policy explains what information ${name} collects when you use our store, why we collect it, and the choices you have. It applies to every order and account on this website.`}
      sections={[
        {
          heading: "Information we collect",
          body: [
            "When you place an order or create an account, we collect the details needed to run the store: your name, email address, phone number, delivery address, and the contents of your order. If you pay online, your payment is processed by our payment provider — your full card details go directly to them and are never stored on our servers.",
            "We also keep the records a shop normally keeps: order history, delivery and tracking information, reviews you write, and messages you send us.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "We use your information to process and deliver your orders, to send order confirmations and status updates, to provide customer support, and — only where you have asked for it — to let you know about the store. We do not sell your personal information to anyone.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "Your delivery details are shared with the courier delivering your parcel, and payment details with the payment provider handling your transaction — only what each of them needs to do their job. We may disclose information if the law requires it.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "This store uses cookies and similar browser storage to keep your cart, wishlist and sign-in working, and to remember your display preferences. These are functional cookies — the store does not run without them.",
          ],
        },
        {
          heading: "Keeping and protecting your information",
          body: [
            "We keep order records for as long as needed for accounting, warranty and legal purposes. Account passwords are stored hashed, never in plain text. No system is perfectly secure, but we take reasonable technical and organisational steps to protect your information.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            `You can review and update your account details at any time from your account page. To ask what information we hold about you, or to have your account and personal information deleted, contact us and we will act on your request within a reasonable time, subject to records we must keep by law. ${contact}`,
          ],
        },
      ]}
    />
  );
}
