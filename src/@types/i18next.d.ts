import "i18next";
import { TranslationResources } from "../types/TranslationResources";

// see: https://www.i18next.com/overview/typescript
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: TranslationResources;
  }
}
