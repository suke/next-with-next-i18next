import ts from "typescript";

import {
  InvalidIdentifierError,
  extractNameSpaceFromSourceFile,
  extractRequiredNamespaces,
} from "./extract-required-namespaces";
import { TranslationNamespaces } from "../src/constants/translationNamespaces";

describe("extractNameSpaceFromSourceFile", () => {
  const createSourceFile = (sourceFileText: string) =>
    ts.createSourceFile(
      "test.tsx",
      sourceFileText,
      ts.ScriptTarget.ES2015,
      /*setParentNodes */ true
    );

  it("should extract namespace from useTranslation hook", () => {
    const source = `
      import React from 'react'
      import { useTranslation } from 'next-i18next'

      export const Component: React.FC = () => {
        const { t } = useTranslation('common')
        const { t: testNamespaceT } = useTranslation('test-namespace', { keyPrefix: 'form' })
        return <div>{t('test')}</div>
      }
    `;

    expect(extractNameSpaceFromSourceFile(createSourceFile(source))).toEqual([
      "common",
      "test-namespace",
    ]);
  });

  it("should not extract namespace if it does not useTranslation", () => {
    const source = `
      import React from 'react'
      export const Component: React.FC = () => {
        return <div>test</div>
      }
    `;

    expect(extractNameSpaceFromSourceFile(createSourceFile(source))).toEqual(
      []
    );
  });

  it("should replace constant property access with actual values", () => {
    const source = `
      import React from 'react'
      import { useTranslation } from 'next-i18next'
      import { TranslationNamespaces } from 'src/constants/translationNamespaces'

      export const Component: React.FC = () => {
        const { t: commonT } = useTranslation(TranslationNamespaces.common)
        const { t: footerT } = useTranslation(TranslationNamespaces.footer)
        return <div>{t('test')}</div>
      }
    `;

    expect(extractNameSpaceFromSourceFile(createSourceFile(source))).toEqual([
      TranslationNamespaces.common,
      TranslationNamespaces.footer,
    ]);
  });

  it("should throw an error if an invalid identifier is specified in useTranslation", () => {
    const source = `
      import React from 'react'
      const namespace = 'test'

      export const Component: React.FC = () => {
        const { t } = useTranslation(namespace)
        return <div>{t('test')}</div>
      }
    `;

    expect(() =>
      extractNameSpaceFromSourceFile(createSourceFile(source))
    ).toThrowError(InvalidIdentifierError);
  });
});

describe("extractRequiredNamespaces", () => {
  it("should extract required namespaces", async () => {
    const result = await extractRequiredNamespaces();
    expect(result).toMatchSnapshot();
  });
});
