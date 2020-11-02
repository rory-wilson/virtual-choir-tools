const fsp = require('fs').promises;
const path = require('path');
const { run, isVideo, setup } = require('./utils');

const detectSilence = async (sourcePath, destinationPath) => {
    console.log(`Detecting silence from ${sourcePath} to ${destinationPath}`)
    return await run(`ffmpeg -i '${sourcePath}' -af silencedetect=n=-30dB:d=5,ametadata=print:file='${destinationPath}' -f null -`);
}

const getClipDuration = async (sourcePath) => {
    return await (await run(`ffprobe -i '${sourcePath}' -show_format -v quiet | sed -n 's/duration=//p'`)).stdout.trim()
}

const silenceToJson = async (sourcePath, destinationPath) => {
    console.log(`Parsing silence from ${sourcePath} to ${destinationPath}`)
    const source = await fsp.readFile(sourcePath, 'utf8');
    const startTimeRegex = /lavfi.silence_start=([\d.\d]+)/g;
    const endTimeRegex = /lavfi.silence_end=([\d.\d]+)/g;
    const startFound = source.match(startTimeRegex);
    const endFound = source.match(endTimeRegex);
    if (endFound == null) {
        endFound = getClipDuration(sourcePath)
    }
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

const silences = async (args) => {
    const sourceDir = path.join(__dirname, '../', args[0]);
    const workingDir = path.join(__dirname, '../', 'working');

    let files = await fsp.readdir(sourceDir);
    console.time('Total Time');
    setup();

    const firstSoundLengths = [];

    for (file of files.filter(isVideo)) {
        console.log('\n*********')
        console.time(file);
        const sourcePath = path.join(sourceDir, file);
        const workingPath = path.join(workingDir, file + '.mp3');

        const silenceDetectionFile = workingPath + '_silence.txt';
        const silenceJSONFile = workingPath + '_silence.json';

        await detectSilence(sourcePath, silenceDetectionFile)
        let silence = await silenceToJson(silenceDetectionFile, silenceJSONFile);

        firstSoundLengths.push(`${file}, ${silence.map(s => `${s.start},${s.end}`).join(',')}`)
        console.timeEnd(file);
    }

    await fsp.writeFile(workingDir + '/silences.csv', firstSoundLengths.join('\n'));

    console.timeEnd('Total Time');
}
module.exports = { detectSilence, getClipDuration, silenceToJson };

var args = process.argv.slice(2);
try {
    if (args.length < 1) {
        console.log('Usage: silences <sourcefolder>')

    } else {
        silences(args);
    }
} catch (error) {
    console.error(error);
}

