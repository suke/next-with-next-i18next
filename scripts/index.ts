import { exec } from "child_process";
import fs from "fs";
import path from "path";

import { extractRequiredNamespaces } from "./extract-required-namespaces";

const currentDir = process.cwd();
const fsPromises = fs.promises;

const outputFile = async (file: string, data: string) => {
  await fsPromises.writeFile(file, data, "utf8");
  console.log(`output file: ${file}`);
};

const formatFile = (file: string) => {
  console.log(`run 'npx prettier --write ${file}'`);
  exec(`npx prettier --write ${file}`);
  console.log(`done`);
};

const run = async () => {
  const result = await extractRequiredNamespaces();
  const outputFilename = path.join(
    currentDir,
    "src",
    "required-namespaces.json"
  );
  await outputFile(outputFilename, JSON.stringify(result, null, 2));
  formatFile(outputFilename);

  return result;
};

run().catch((err) => console.error(err));
