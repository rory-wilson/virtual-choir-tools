const AWS = require('aws-sdk');
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path,
    childProcessPromise = require('./child-process-promise'),
    os = require('os'),
    path = require('path'),
    s3 = require('./s3');

exports.handler = async function (event) {
    const inputBucket = process.env.INPUTBUCKET;
    const audioOutputBucket = process.env.AUDIOBUCKET;

    const key = event.file;
    const workdir = os.tmpdir(),
        inputFile = path.join(workdir, key),
        outputFile = path.join(workdir, key + '.mp3');

    console.log('converting', inputBucket, key);

    try {
        return s3.downloadFileFromS3(inputBucket, key, inputFile)
            .then(() => childProcessPromise.spawn(
                path.join(ffmpegPath, '../darwin-x64/ffmpeg'),
                ['-i', inputFile, '-map', '0:a', '-c', 'libmp3lame', '-q:a', 2, outputFile],
                { env: process.env, cwd: workdir }
            ))
            .then(() => s3.uploadFileToS3(audioOutputBucket, key, outputFile, 'audio/mpeg'));

    } catch (error) {
        console.error("Error: ", error);
    }

}