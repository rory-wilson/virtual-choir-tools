const fsp = require("fs").promises;
const path = require("path");
const { run, isVideo } = require("./utils");

const resize = async (args) => {
  const sourceDir = args[0];
  const outputDir = path.join(__dirname, "../", "output");
  let files = await fsp.readdir(sourceDir);
  console.time("Total Time");

  for (file of files.filter(isVideo)) {
    console.log("\n*********");
    console.time(file);
    const sourcePath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file);

    //ffmpeg -i input.mp4 -vcodec libx264 -preset ultrafast -s 1280x720 -acodec copy output.mp4

    await run(
      `ffmpeg -y -i '${sourcePath}' -vcodec libx264 -preset ultrafast -s 1280x720 -acodec copy '${outputPath}'`
    );
    console.timeEnd(file);
  }
  console.timeEnd("Total Time");
};

var args = process.argv.slice(2);
try {
  if (args.length < 1) {
    console.log("Usage: resize <sourcefolder>");
  } else {
    resize(args);
  }
} catch (error) {
  console.error(error);
}
