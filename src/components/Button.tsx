import { TranslationNamespaces } from "@/constants/translationNamespaces";
import { useTranslation } from "next-i18next";

export const Button: React.FC = () => {
  const { t } = useTranslation(TranslationNamespaces.button);
  return <button>{t("save")}</button>;
};
