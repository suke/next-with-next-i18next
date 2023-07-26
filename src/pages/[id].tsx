import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import type { GetServerSidePropsContext, NextPage } from "next";
import { Footer } from "@/components/Footer";
import requiredNamespaces from "../required-namespaces.json";

const HomePage: NextPage = () => (
  <div>
    <main></main>
    <Footer />
  </div>
);

export async function getServerSideProps({
  locale = "ja",
}: GetServerSidePropsContext<{ locale: string }>) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        requiredNamespaces["/pages/[id]"]
      )),
    },
  };
}

export default HomePage;
