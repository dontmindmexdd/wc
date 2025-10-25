import { open, type CreateReadStreamOptions } from "node:fs/promises";

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
  return process.argv.pop();
}

async function getFileStream(
  filepath: string,
  options?: CreateReadStreamOptions,
) {
  const fileHandle = await open(filepath);
  return fileHandle.createReadStream(options);
}

async function getFileBytes(filepath: string) {
  const stream = await getFileStream(filepath);
  return new Promise((resolve, reject) => {
    let byteCount = 0;
    let chunk;

    stream.on("readable", () => {
      while ((chunk = stream.read()) !== null) {
        byteCount += chunk.length;
      }
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(byteCount);
    });
  });
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

    stream.on("readable", () => {
      let chunk;
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
  const stream = await getFileStream(filepath, { encoding: "utf8" });

  return new Promise((resolve, reject) => {
    let charCount = 0;

    stream.on("readable", () => {
      let chunk;
      while ((chunk = stream.read()) !== null) {
        for (let i = 0; i < chunk.length; i++) {
          // Any alphanumeric code
          if (chunk[i] >= 32 && chunk[i] <= 126) {
            charCount++;
          }
        }
      }
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

  console.log(value);
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
        console.log((await getFileLines(filepath)) + " " + filepath);
        break;
      case OPTIONS.w:
        console.log((await getFileWords(filepath)) + " " + filepath);
        break;
      case OPTIONS.m:
        console.log((await getFileChars(filepath)) + " " + filepath);
        break;
      default:
        await output(filepath, getFileLines, getFileWords, getFileBytes);
        break;
    }
  }
}

main();
