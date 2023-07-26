import { TranslationNamespaces } from "@/constants/translationNamespaces";
import { useTranslation } from "next-i18next";

export const Footer: React.FC = () => {
  const { t } = useTranslation(TranslationNamespaces.footer);
  return <div>{t("footer")}</div>;
};
