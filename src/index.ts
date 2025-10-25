import { open, stat, type CreateReadStreamOptions } from "node:fs/promises";

const OPTIONS: { [key: string]: string } = {
  c: "-c",
  l: "-l",
  w: "-w",
  m: "-m",
};

function getCliOption() {
  return process.argv.find((arg) => Object.values(OPTIONS).includes(arg));
}

function getFilePath() {
  return process.argv
    .slice(2)
    .filter((arg) => !Object.values(OPTIONS).includes(arg))
    .pop();
}

async function getFileStream(
  filepath: string,
  options?: CreateReadStreamOptions,
) {
  const fileHandle = await open(filepath);
  return fileHandle.createReadStream(options);
}

async function getFileBytes(filepath: string) {
  const stats = await stat(filepath);
  return stats.size;
}

async function getFileLines(filepath: string) {
  const stream = await getFileStream(filepath);

  return new Promise((resolve, reject) => {
    let lineCount = 0;
    let chunk;

    stream.on("readable", () => {
      while ((chunk = stream.read()) !== null) {
        for (let i = 0; i < chunk.length; i++) {
          if (chunk[i] === 10) {
            lineCount++;
          }
        }
      }
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(lineCount);
    });
  });
}

async function getFileWords(filepath: string) {
  const stream = await getFileStream(filepath);

  return new Promise((resolve, reject) => {
    let wordCount = 0;
    let inWord = false;
    let chunk;

    stream.on("readable", () => {
      while ((chunk = stream.read()) !== null) {
        for (let i = 0; i < chunk.length; i++) {
          // Any whitespace code
          if (chunk[i] >= 1 && chunk[i] <= 32) {
            inWord = false;
          } else if (!inWord) {
            wordCount++;
            inWord = true;
          }
        }
      }
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(wordCount);
    });
  });
}

async function getFileChars(filepath: string) {
  const stream = await getFileStream(filepath, {
    encoding: "utf8",
  });

  return new Promise((resolve, reject) => {
    let charCount = 0;

    stream.on("data", (chunk) => {
      charCount += chunk.length;
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(charCount);
    });
  });
}

async function output(
  filepath: string,
  ...args: ((arg0: string) => Promise<unknown>)[]
) {
  let value = "";
  for (const arg of args) {
    value += await arg(filepath);
    value += " ";
  }

  value += filepath;

  console.info(value);
}

async function main() {
  const option = getCliOption();
  const filepath = getFilePath();

  if (filepath) {
    switch (option) {
      case OPTIONS.c:
        await output(filepath, getFileBytes);
        break;
      case OPTIONS.l:
        await output(filepath, getFileLines);
        break;
      case OPTIONS.w:
        await output(filepath, getFileWords);
        break;
      case OPTIONS.m:
        await output(filepath, getFileChars);
        break;
      default:
        await output(filepath, getFileLines, getFileWords, getFileBytes);
        break;
    }
  }
}

main();
