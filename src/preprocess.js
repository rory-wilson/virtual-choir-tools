const fsp = require('fs').promises;
const path = require('path');
const util = require('util');
const moment = require('moment');
const exec = util.promisify(require('child_process').exec);

const extractAudio = async (sourcePath, destinationPath) => {
    console.log(`Extracting audio from ${sourcePath} to ${destinationPath}.mp3`)
    return await exec(`ffmpeg -i ${sourcePath} -y -map 0:a -c libmp3lame -q:a 2 ${destinationPath}`);
}

const detectSilence = async (sourcePath, destinationPath) => {
    console.log(`Detecting silence from ${sourcePath} to ${destinationPath}`)
    return await exec(`ffmpeg -i ${sourcePath} -af silencedetect=n=50dB:d=0.5,ametadata=print:file=${destinationPath} -f null -`);
}

const silenceToJson = async (sourcePath, destinationPath) => {
    console.log(`Parsing silence from ${sourcePath} to ${destinationPath}`)
    const source = await fsp.readFile(sourcePath, 'utf8');
    const startTimeRegex = /lavfi.silence_start=([\d.\d]+)/g;
    const endTimeRegex = /lavfi.silence_end=([\d.\d]+)/g;
    const startFound = source.match(startTimeRegex);
    const endFound = source.match(endTimeRegex);
    const output = [];
    for (i = 0; i < startFound.length; i++) {
        output.push({
            start: startFound[i].replace('lavfi.silence_start=', ''),
            end: endFound.length > i ? endFound[i].replace('lavfi.silence_end=', '') : null
        });
    }
    await fsp.writeFile(destinationPath, JSON.stringify(output));
    return output;
}

const trimVideo = async (sourcePath, destinationPath, silenceJSON) => {
    console.log(`Trimming video from ${sourcePath} to ${destinationPath}`);
    const start = silenceJSON[0].end;
    const end = silenceJSON[silenceJSON.length - 1].start;

    const startString = moment().startOf('day').seconds(start).format('HH:mm:ss');

    console.log(`Trimming from ${startString}`);

    return await exec(`ffmpeg -ss ${startString} -i ${sourcePath} -c copy ${destinationPath}`);
}


const proprocess = async (args) => {
    const sourceDir = path.join(__dirname, '../', args[0]);
    const workingDir = path.join(__dirname, '../', 'working');
    const outputDir = path.join(__dirname, '../', 'output');
    let files = await fsp.readdir(sourceDir);

    for (file of files.filter(f => f.indexOf('.mov') > 1 || f.indexOf('.mp4') > 1)) {
        console.log(`working with ${file}`);
        const sourcePath = path.join(sourceDir, file);
        const workingPath = path.join(workingDir, file);
        const outputPath = path.join(outputDir, file);

        const workingAudioFilePath = workingPath + '.mp3';
        const outputAudioFilePath = outputPath + '.mp3';
        const silenceDetectionFile = workingPath + '_silence.txt';
        const silenceJSONFile = workingPath + '_silence.json';

        // get audio as its faster to work with
        await extractAudio(sourcePath, workingAudioFilePath);
        await detectSilence(workingAudioFilePath, silenceDetectionFile)
        const silence = await silenceToJson(silenceDetectionFile, silenceJSONFile);

        await trimVideo(sourcePath, outputPath, silence);
        await extractAudio(outputPath, outputAudioFilePath);
    }
}

var args = process.argv.slice(2);
try {
    proprocess(args);
} catch (error) {
    console.error(error);
}