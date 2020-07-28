const path = require("path");
const fsp = require("fs").promises;
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

const run = async (cmd) => {
  console.log(`\n${cmd}`);
  return exec(cmd);
};

module.exports = {
  isAudio,
  isVideo,
  run,
  loadJSON,
};
