const fsp = require('fs').promises;
const path = require('path');
const { run, isVideo, isAudio } = require('./utils');

const extractAudio = async (sourcePath, destinationPath) => {
    console.log(`Extracting audio from ${sourcePath} to ${destinationPath}.mp3`)
    return await run(`ffmpeg -i '${sourcePath}' -y -map 0:a -c libmp3lame -q:a 2 '${destinationPath}'`);
}

const detectSilence = async (sourcePath, destinationPath) => {
    console.log(`Detecting silence from ${sourcePath} to ${destinationPath}`)
    return await run(`ffmpeg -i '${sourcePath}' -af silencedetect=n=-30dB:d=5,ametadata=print:file='${destinationPath}' -f null -`);
}

const noiseReduction = async (sourcePath, silenceJSON, silenceSample, silenceProfile, destinationPath) => {
    console.log(`Reducing noise from ${sourcePath} to ${destinationPath}`)
    // get silence sample
    await run(`ffmpeg -y -ss 0 -i '${sourcePath}' -t 2  -y -map 0:a -c libmp3lame -q:a 2 '${silenceSample}'`);

    // build profile
    await run(`sox '${silenceSample}' -n noiseprof '${silenceProfile}'`)

    // apply cancellation
    return await run(`sox '${sourcePath}' '${destinationPath}' noisered '${silenceProfile}' 0.21`);
}

const silenceToJson = async (sourcePath, destinationPath) => {
    console.log(`Parsing silence from ${sourcePath} to ${destinationPath}`)
    const source = await fsp.readFile(sourcePath, 'utf8');
    const startTimeRegex = /lavfi.silence_start=([\d.\d]+)/g;
    const endTimeRegex = /lavfi.silence_end=([\d.\d]+)/g;
    const startFound = source.match(startTimeRegex);
    const endFound = source.match(endTimeRegex);
    const output = [];
    if (startFound) {
        for (i = 0; i < startFound.length; i++) {
            output.push({
                start: startFound[i].replace('lavfi.silence_start=', ''),
                end: endFound && endFound.length > i ? endFound[i].replace('lavfi.silence_end=', '') : null
            });
        }
    }

    await fsp.writeFile(destinationPath, JSON.stringify(output));

    return output;
}

const trim = async (sourcePath, destinationPath, start) => {
    console.log(`Trimming audio from ${sourcePath} to ${destinationPath} at ${start}`);
    return await run(`ffmpeg -y -ss ${start} -i '${sourcePath}' -c copy '${destinationPath}'`);
}

const getStart = (silences) => {
    const meaningfulNoiseLength = 10;

    const meaningfulNoiseStart = (i) => {
        const noise = silences[i].start - silences[i-1].end;
        return (noise > meaningfulNoiseLength) ? silences[i-1].end - 1 : null;
    }

    if (silences.length === 0)
        return 0;

    if (silences.length === 1)
        return silences[0].end - 1;

    const firstNoise = silences[1].start - silences[0].end;
    if (meaningfulNoiseStart(1))
        return meaningfulNoiseStart(1);

    if (silences.length === 2)
        return silences[1].end - 1;

    if (meaningfulNoiseStart(2))
        return meaningfulNoiseStart(2);

    if (silences.length === 3)
        return silences[2].end - 1;

    if (meaningfulNoiseStart(3))
        return meaningfulNoiseStart(3);

    if (silences.length === 4)
        return silences[3].end - 1;

    if (meaningfulNoiseStart(4))
        return meaningfulNoiseStart(4);

    if (meaningfulNoiseStart(5))
        return meaningfulNoiseStart(5);

}

const proprocess = async (args) => {
    const sourceDir = args[0];
    const workingDir = path.join(__dirname, '../', 'working');
    const outputDir = path.join(__dirname, '../', 'output');
    let files = await fsp.readdir(sourceDir);
    console.time('Total Time');

    const firstSoundLengths = [];

    for (file of files.filter(isVideo || isAudio)) {
        console.log('\n*********')
        console.time(file);
        const sourcePath = path.join(sourceDir, file);
        const workingPath = path.join(workingDir, file + '.mp3');
        const outputPath = path.join(outputDir, file);
        const outputAudioPath = path.join(outputDir, file + '.mp3');

        const silenceDetectionFile = workingPath + '_silence.txt';
        const silenceJSONFile = workingPath + '_silence.json';
        const silenceSampleFile = workingPath + '_silence.mp3';
        const silenceProfileFile = workingPath + '_silence.prof';
        const noiseReducedFile = workingPath + '_reduced.mp3';

        await extractAudio(sourcePath, workingPath)
        await detectSilence(workingPath, silenceDetectionFile)
        let silence = await silenceToJson(silenceDetectionFile, silenceJSONFile);
       // await noiseReduction(workingPath, silence, silenceSampleFile, silenceProfileFile, noiseReducedFile);

        const start = getStart(silence);
        await trim(sourcePath, outputPath, start);
        await trim(workingPath, outputAudioPath, start);

        // cleanup
        await run(`rm working/*.*`)
        firstSoundLengths.push(`${file}, ${start}`)
        console.timeEnd(file);
    }

    await fsp.writeFile(workingDir + '/silences.csv', firstSoundLengths.join('\n'));

    console.timeEnd('Total Time');
}

var args = process.argv.slice(2);
try {
    if (args.length < 1) {
        console.log('Usage: processvideo <sourcefolder>')

    } else {
        proprocess(args);
    }
} catch (error) {
    console.error(error);
}
