import fs from "fs";
import path from "path";

import dependencyTree from "dependency-tree";
import ts from "typescript";
import { TranslationNamespaces } from "../src/constants/translationNamespaces";

const fsPromises = fs.promises;
const ignoreFileOrDirectory = [
  path.join("src", "pages", "_app.tsx"),
  path.join("src", "pages", "_document.tsx"),
  path.join("src", "pages", "api"),
];
const currentDir = process.cwd();
const pagesDir = path.join(currentDir, "src", "pages");
const nextI18nNextPath = path.join("node_modules", "next-i18next");

const isDependOnNextI18Next = (tree: dependencyTree.Tree) => {
  return Object.keys(tree).some((value) => {
    if (typeof value === "string") {
      return isNextI18NextPath(value);
    }
    return false;
  });
};

export const isNextI18NextPath = (filePath: string) =>
  filePath.indexOf(nextI18nNextPath) !== -1;

export const getPageFiles = async (dir = pagesDir, files: string[] = []) => {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
  const dirs: string[] = [];

  for (const dirent of dirents) {
    const pagePath = path.join(dir, dirent.name);
    if (ignoreFileOrDirectory.some((value) => pagePath.indexOf(value) !== -1)) {
      console.log(`skipped: ${pagePath}`);
      continue;
    }

    if (dirent.isDirectory()) dirs.push(pagePath);
    if (dirent.isFile()) files.push(pagePath);
  }

  for (const d of dirs) {
    files = await getPageFiles(d, files);
  }
  return Promise.resolve(files);
};

const createSourceFile = (filename: string) =>
  ts.createSourceFile(
    filename,
    fs.readFileSync(filename).toString(),
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
  );

const visitAll = (node: ts.Node, callback: (node: ts.Node) => void) => {
  callback(node);
  node.forEachChild((child) => {
    visitAll(child, callback);
  });
};

const extractAccessedProperty = (str: string) => {
  const properties = str.split(".");
  properties.shift();

  return properties;
};

const dig = (obj: object, properties: string[]) => {
  const dupProperties = [...properties];
  let result = obj as any;
  while (dupProperties.length > 0) {
    const property = dupProperties.shift()!;
    if (result.hasOwnProperty(property)) {
      result = result[property];
    } else {
      throw new Error(`can not access property ${property}`);
    }
  }

  return result;
};

export class InvalidIdentifierError extends Error {
  constructor(identifier: string) {
    super(
      `invalid identifier ${identifier} detected. please use src/constants/translationNamespaces`
    );
    this.name = "InvalidIdentifierError";
  }
}

const extractNamespaceFromArgumentNode = (argument: ts.Expression) => {
  if (ts.isPropertyAccessExpression(argument)) {
    const propertyAccessText = argument.getText();
    const [variableName, ...properties] = propertyAccessText.split(".");
    if (variableName !== "TranslationNamespaces") {
      throw new InvalidIdentifierError(variableName);
    }

    return dig(TranslationNamespaces, properties);
  } else {
    if (ts.isIdentifier(argument)) {
      throw new InvalidIdentifierError(argument.getText());
    }

    const namespace = argument.getText();
    if (namespace) {
      return namespace.replace(/['‘’"“”]/g, "");
    }
  }

  return undefined;
};

export const extractNameSpaceFromSourceFile = (sourceFile: ts.SourceFile) => {
  const result = new Set<string>();

  visitAll(sourceFile, (node) => {
    if (!ts.isVariableDeclaration(node)) {
      return;
    }

    if (
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText() === "useTranslation"
    ) {
      const firstArgument = node.initializer.arguments.at(0);
      if (!firstArgument) {
        return;
      }

      const namespace = extractNamespaceFromArgumentNode(firstArgument);
      if (namespace) {
        result.add(namespace);
      }
    }
  });

  return Array.from(result);
};

export const extractRequiredNamespacesFromTree = (
  tree: dependencyTree.Tree,
  visited = new Set<string>(),
  result = new Set<string>()
) => {
  for (const [key, value] of Object.entries(tree)) {
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    if (key.indexOf("node_modules") !== -1) {
      continue;
    }

    if (isDependOnNextI18Next(value)) {
      const requiredNamespaces = extractNameSpaceFromSourceFile(
        createSourceFile(key)
      );
      requiredNamespaces.forEach((value) => result.add(value));
    }

    if (typeof value !== "string") {
      extractRequiredNamespacesFromTree(value, visited, result);
    }
  }

  return Array.from(result);
};

export const extractRequiredNamespaces = async () => {
  const allPageFiles = await getPageFiles();
  const result: Record<string, string[]> = {};
  const directory = path.join(currentDir, "src");

  for (const file of allPageFiles) {
    console.log(`extracting required namespaces from ${file}`);

    const tree = dependencyTree({
      filename: file,
      directory,
      tsConfig: path.join(currentDir, "tsconfig.json"),
      nodeModulesConfig: {
        entry: "module",
      },
      filter: (modulePath) =>
        isNextI18NextPath(modulePath) ||
        modulePath.indexOf("node_modules") === -1,
      nonExistent: [],
      noTypeDefinitions: false,
    });

    const outputKey = file.replace(directory, "").split(".")[0];
    result[outputKey] = extractRequiredNamespacesFromTree(tree);
  }

  return result;
};
