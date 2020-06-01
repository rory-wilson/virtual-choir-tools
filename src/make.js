const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsp = require('fs').promises;
const moment = require('moment');
const path = require('path');

const OUTPUTSIZE = '1280x720';

const LAYOUTS = {
    4: '0_0|0_h0|w0_0|w0_h0',
    9: '0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1',
    16: '0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2',
    25: '0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3',
    36: '0_0|w0_0|w0+w1_0|w0+w1+w2_0|w0+w1+w2+w3_0|w0+w1+w2+w3+w4_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|w0+w1+w2+w3_h0|w0+w1+w2+w3+w4_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1|w0+w1+w2+w3_h0+h1|w0+w1+w2+w3+w4_h0+h1|0_h0+h1+h2|w0_h0+h1+h2|w0+w1_h0+h1+h2|w0+w1+w2_h0+h1+h2|w0+w1+w2+w3_h0+h1+h2|w0+w1+w2+w3+w4_h0+h1+h2|0_h0+h1+h2+h3|w0_h0+h1+h2+h3|w0+w1_h0+h1+h2+h3|w0+w1+w2_h0+h1+h2+h3|w0+w1+w2+w3_h0+h1+h2+h3|w0+w1+w2+w3+w4_h0+h1+h2+h3|0_h0+h1+h2+h3+h4|w0_h0+h1+h2+h3+h4|w0+w1_h0+h1+h2+h3+h4|w0+w1+w2_h0+h1+h2+h3+h4|w0+w1+w2+w3_h0+h1+h2+h3+h4|w0+w1+w2+w3+w4_h0+h1+h2+h3+h4'
}

const SCALES = {
    4: 'vga',
    9: 'qvga',
    16: 'qvga',
    25: 'qqvga',
    36: 'qqvga'
}

const loadJSON = async (filepath) => {
    const source = await fsp.readFile(filepath, 'utf8');
    return JSON.parse(source);
}
const run = async (cmd) => {
    console.log(cmd);
    return exec(cmd);
}

const makeGrid = async (cut, sourceDir, destinationPath, ajustment) => {
    const sourceFiles = cut.clips;
    const inputCount = sourceFiles.length;
    const { start, duration } = cut;
    const layout = cut.layout ? cut.layout : LAYOUTS[inputCount];
    const scale = cut.layout ? 'qvga' : SCALES[inputCount];

    console.log('')
    console.log(`Making a grid of ${sourceFiles.length} images from ${start} for ${duration} seconds, saving to ${destinationPath}`);

    const files = sourceFiles.map(file => {
        const startSeconds = ajustment[file] ? start + ajustment[file] : start;

        return file ? `-ss ${startSeconds} -t ${duration} -i ${path.join(sourceDir, file)}` :
            `-i ${path.join(sourceDir, '../static/black.png')}`
    }).join(' ');

    const inputMatrix = [];
    for (j = 0; j < sourceFiles.length; j++) {
        inputMatrix.push(j);
    }
    const inputMatrixString = inputMatrix.map(x => `[${x}:v] setpts=PTS-STARTPTS, scale=${scale} [a${x}];`).join('');
    const inputLabels = inputMatrix.map(x => `[a${x}]`).join('');
    return await run(`ffmpeg -y ${files} -s ${OUTPUTSIZE} -filter_complex "${inputMatrixString}${inputLabels}xstack=inputs=${inputCount}:layout=${layout}[v]" -map "[v]" ${destinationPath}`);
}

const concat = async (sourceFiles, workingDir, destinationPath) => {
    console.log('')
    console.log(`Concatenating ${sourceFiles.length} saving to ${destinationPath}`);
    const fileListPath = path.join(workingDir, 'filelist.txt');
    await fsp.writeFile(fileListPath, sourceFiles.map(file => `file '${file}'`).join('\n'));

    return await run(`ffmpeg -y -f concat -safe 0 -i ${fileListPath} ${destinationPath}`);
}

const make = async (args) => {
    const sourceDir = path.join(__dirname, '../', args[0]);

    const workingDir = path.join(__dirname, '../', 'working');
    const outputDir = path.join(__dirname, '../', 'output');

    const editJson = await loadJSON(args[1]);
    const ajustment = args[2] ? loadJSON(args[2]) : {};
    const tempFiles = [];

    // cut
    for (i = 0; i < editJson.cuts.length; i++) {
        const cut = editJson.cuts[i];
        const destinationFile = path.join(workingDir, `${i}.mp4`);
        tempFiles.push(destinationFile);
        await makeGrid(cut, sourceDir, destinationFile, ajustment);
    }

    // join
    const destinationFile = path.join(outputDir, `final.mp4`);
    await concat(tempFiles, workingDir, destinationFile)
}

var args = process.argv.slice(2);
try {
    if (args.length != 2) {
        console.log('Usage: make <sourcefolder> <jsonfile> <adjustmentfile(optional)>')
    } else {
        make(args);
    }
} catch (error) {
    console.error(error);
}