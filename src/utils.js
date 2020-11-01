const path = require("path");
const fsp = require("fs").promises;
const fs = require("fs");
const util = require("util");

const exec = util.promisify(require("child_process").exec);

const isAudio = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const validExtensions = [".wav", ".mp3", ".m4a", ".aifc", ".mp4"];
  return validExtensions.indexOf(ext) > -1;
};

const isVideo = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const validExtensions = [".mov", ".mp4", ".m4v"];
  return validExtensions.indexOf(ext) > -1;
};

const loadJSON = async (filepath) => {
  const source = await fsp.readFile(filepath, "utf8");
  return JSON.parse(source);
};

const createFolderIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

const setup = () => {
  createFolderIfNotExists('output');
  createFolderIfNotExists('working');
}

const run = async (cmd) => {
 
    console.log(`\nCommand: ${cmd}`);

  try {
    const promise = exec(cmd);
    const child = promise.child;

    child.stdout.on('data', function(data) {
        console.log(data);
    });
    child.stderr.on('data', function(data) {
        console.error(data);
    });

    return await promise;
  }
  catch(error) {
    console.error(error);
  }
};

module.exports = {
  isAudio,
  isVideo,
  run,
  loadJSON,
  createFolderIfNotExists,
  setup
};
