const fsp = require('fs').promises;
const path = require('path');
const { run, loadJSON, isAudio } = require('./utils');
const AudioContext = require('web-audio-api').AudioContext

function getbars(val) {
    let bars = ""
    for (var i = 0; i < val * 50 + 2; i++) {
        bars = bars + "|";
    }
    return bars;
}


function findPeaks(pcmdata, samplerate) {
    var interval = 0.05 * 1000; index = 0;
    var step = Math.round(samplerate * (interval / 1000));
    var max = 0;
    var prevmax = 0;
    var prevdiffthreshold = 0.3;

    //loop through song in time with sample rate
    var samplesound = setInterval(function () {
        if (index >= pcmdata.length) {
            clearInterval(samplesound);
            console.log("finished sampling sound")
            return;
        }

        for (var i = index; i < index + step; i++) {
            max = pcmdata[i] > max ? pcmdata[i].toFixed(1) : max;
        }

        // Spot a significant increase? Potential peak
        bars = getbars(max);
        if (max - prevmax >= prevdiffthreshold) {
            bars = bars + " == peak == "
        }

        // Print out mini equalizer on commandline
        console.log(bars, max)
        prevmax = max; max = 0; index += step;
    }, interval, pcmdata);
}


const decodeSoundFile = async (context, soundfile) => {
    console.log("decoding mp3 file ", soundfile, " ..... ")
    const buf = await fsp.readFile(soundfile);
    const audioBuffer = await context.decodeAudioData(buf, audioBuffer => {
        console.log(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate, audioBuffer.duration);
        const pcmdata = (audioBuffer.getChannelData(0));
        const samplerate = audioBuffer.sampleRate;
        findPeaks(pcmdata, samplerate)
    });
}

const analyze = async (args) => {
    const sourceDir = path.join(__dirname, '../', args[0]);
    const workingDir = path.join(__dirname, '../', 'working');
    let files = await fsp.readdir(sourceDir);
    console.time('Total Time');
    const context = new AudioContext();

    for (file of files.filter(isAudio)) {
        console.log('\n*********')
        console.time(file);
        const sourcePath = path.join(sourceDir, file);
        const workingPath = path.join(workingDir, file);

        const data = decodeSoundFile(context, sourcePath);

        // console.log('Number of silences:', silence.length)

        // const gaps = silence.reduce((accumulator, currentValue) => {
        //     accumulator.push();
        // }, [])

        // console.log('Gaps:', silence.length)
    }
}

var args = process.argv.slice(2);
try {
    if (args.length < 1) {
        console.log('Usage: analyze <folder>')

    } else {
        analyze(args);
    }
} catch (error) {
    console.error(error);
}