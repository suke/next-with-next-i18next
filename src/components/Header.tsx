import { useTranslation } from "next-i18next";
import { Button } from "./Button";

export const Header: React.FC = () => {
  const { t } = useTranslation("header");
  return (
    <div>
      <span>{t("header")}</span>
      <Button />
    </div>
  );
};
