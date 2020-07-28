const fsp = require("fs").promises;
const path = require("path");
const { run, loadJSON } = require("./utils");

const OUTPUTSIZE = "1280x720";
const BORDERCOLOR = "black";

const LAYOUTS = {
  4: "0_0|0_h0|w0_0|w0_h0",
  9: "0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1",
  16: "0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2",
  25: "0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3",
  36: "0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|w0+w1+w2+w3+w4_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|w0+w1+w2+w3+w4_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|w0+w1+w2+w3+w4_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|w0+w1+w2+w3+w4_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3|w0+w1+w2+w3+w4_h0+h1+h2+h3|0_h0+h1+h2+h3+h4|w0_h0+h1+h2+h3+h4|w0+w1_h0+h1+h2+h3+h4|w0+w1+w2_h0+h1+h2+h3+h4|w0+w1+w2+w3_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4",
  49: "0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|w0+w1+w2+w3+w4_0|w0+w1+w2+w3+w4+w5_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|w0+w1+w2+w3+w4_h0|w0+w1+w2+w3+w4+w5_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|w0+w1+w2+w3+w4_h0+h1|w0+w1+w2+w3+w4+w5_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|w0+w1+w2+w3+w4_h0+h1+h2|w0+w1+w2+w3+w4+w5_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3|w0+w1+w2+w3+w4_h0+h1+h2+h3|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3|0_h0+h1+h2+h3+h4|w0_h0+h1+h2+h3+h4|w0+w1_h0+h1+h2+h3+h4|w0+w1+w2_h0+h1+h2+h3+h4|w0+w1+w2+w3_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3+h4|0_h0+h1+h2+h3+h4+h5|w0_h0+h1+h2+h3+h4+h5|w0+w1_h0+h1+h2+h3+h4+h5|w0+w1+w2_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3+h4+h5|",
  64: "0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|w0+w1+w2+w3+w4_0|w0+w1+w2+w3+w4+w5_0|w0+w1+w2+w3+w4+w5+w6_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|w0+w1+w2+w3+w4_h0|w0+w1+w2+w3+w4+w5_h0|w0+w1+w2+w3+w4+w5+w6_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|w0+w1+w2+w3+w4_h0+h1|w0+w1+w2+w3+w4+w5_h0+h1|w0+w1+w2+w3+w4+w5+w6_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|w0+w1+w2+w3+w4_h0+h1+h2|w0+w1+w2+w3+w4+w5_h0+h1+h2|w0+w1+w2+w3+w4+w5+w6_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3|w0+w1+w2+w3+w4_h0+h1+h2+h3|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3|w0+w1+w2+w3+w4+w5+w6_h0+h1+h2+h3|0_h0+h1+h2+h3+h4|w0_h0+h1+h2+h3+h4|w0+w1_h0+h1+h2+h3+h4|w0+w1+w2_h0+h1+h2+h3+h4|w0+w1+w2+w3_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4+w5+w6_h0+h1+h2+h3+h4|0_h0+h1+h2+h3+h4+h5|w0_h0+h1+h2+h3+h4+h5|w0+w1_h0+h1+h2+h3+h4+h5|w0+w1+w2_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3+h4+h5|w0+w1+w2+w3+w4+w5+w6_h0+h1+h2+h3+h4+h5|0_h0+h1+h2+h3+h4+h5+h6|w0_h0+h1+h2+h3+h4+h5+h6|w0+w1_h0+h1+h2+h3+h4+h5+h6|w0+w1+w2_h0+h1+h2+h3+h4+h5+h6|w0+w1+w2+w3_h0+h1+h2+h3+h4+h5+h6|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4+h5+h6|w0+w1+w2+w3+w4+w5_h0+h1+h2+h3+h4+h5+h6|w0+w1+w2+w3+w4+w5+w6_h0+h1+h2+h3+h4+h5+h6",
};

const SCALES = {
  4: "640:360",
  9: "512:288",
  16: "384:216",
  25: "256:144",
  36: "128:72",
  49: "128:72",
  64: "128:72",
};

const makeGrid = async (cut, sourceDir, destinationPath, ajustment) => {
  const sourceFiles = cut.clips;
  const border = cut.border;
  const inputCount = sourceFiles.length;
  const { start, duration } = cut;
  const layout = cut.layout ? cut.layout : LAYOUTS[inputCount];
  const scale = cut.layout ? "qvga" : SCALES[inputCount];
  const rowSize = cut.rowSize ? cut.rowSize : Math.sqrt(inputCount);

  console.log("");
  console.log(
    `Making a grid of ${sourceFiles.length} images from ${start} for ${duration} seconds, saving to ${destinationPath}`
  );

  const files = sourceFiles
    .map((file) => {
      const startSeconds = ajustment[file] ? start + ajustment[file] : start;

      return file
        ? `-ss ${startSeconds} -t ${duration} -i ${path.join(sourceDir, file)}`
        : `-t ${duration} -i ${path.join(__dirname, "../static/black.mov")}`;
    })
    .join(" ");

  const inputMatrix = [];
  for (j = 0; j < sourceFiles.length; j++) {
    inputMatrix.push(j);
  }
  const inputMatrixString = inputMatrix
    .map((x) => {
      const leftborder = (x + 1) % rowSize === 0 ? 0 : border;
      const bottomborder = inputCount - x < rowSize ? 0 : border;
      return `[${x}:v]pad=iw+${leftborder}:ih+${bottomborder}:color=${BORDERCOLOR},setpts=PTS-STARTPTS, scale=${scale} [a${x}];`;
    })
    .join("");
  const inputLabels = inputMatrix.map((x) => `[a${x}]`).join("");
  return await run(
    `ffmpeg -y ${files} -s ${OUTPUTSIZE} -filter_complex "${inputMatrixString}${inputLabels}xstack=inputs=${inputCount}:layout=${layout}[v]" -map "[v]" -an -preset superfast ${destinationPath}`
  );
};

const make = async (args) => {
  const sourceDir = args[0];
  const workingDir = path.join(__dirname, "../", "working");
  const editJson = await loadJSON(args[1]);
  const ajustment = args[2] ? loadJSON(args[2]) : {};
  const tempFiles = [];
  console.time("Total Time");

  // cut
  for (i = 0; i < editJson.cuts.length; i++) {
    const cut = editJson.cuts[i];
    const destinationFile = path.join(workingDir, `${i}.mp4`);
    tempFiles.push(destinationFile);
    await makeGrid(cut, sourceDir, destinationFile, ajustment);
  }

  console.timeEnd("Total Time");
};

var args = process.argv.slice(2);
try {
  if (args.length != 2) {
    console.log(
      "Usage: make <sourcefolder> <jsonfile> <adjustmentfile(optional)>"
    );
  } else {
    make(args);
  }
} catch (error) {
  console.error(error);
}
