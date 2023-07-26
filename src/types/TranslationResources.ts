import common from "../../public/locales/ja/common.json";
import header from "../../public/locales/ja/header.json";
import footer from "../../public/locales/ja/footer.json";
import button from "../../public/locales/ja/components/button.json";

export type TranslationResources = {
  common: typeof common;
  header: typeof header;
  footer: typeof footer;
  "components/button": typeof button;
};
