jest.setTimeout(10000)
console.log = jest.fn();
console.error = jest.fn();
const silence = require('../src/silences.js');
const fsp = require('fs').promises;
const outputFileName = "output/detected-silence.txt"
const inputFileName = "__tests__/assets/silence_detection.mp4"

describe("Silence detection", () => {
  let inputFileName = "__tests__/assets/silence_detection.mp4"

  test("it should find silence start and end", () => {
    return silence.detectSilence(inputFileName, outputFileName).then(output => {
      checkFfmpegStderr(output.stderr)
      return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
        checkFileContents(outputFileContents)
      })
    });
  })
  test("it should gracefully handle videos that are silent at the end", () => {
    let inputFileName = "__tests__/assets/silence_detection_no_end.mp4"

    return silence.detectSilence(inputFileName, outputFileName).then(output => {
      // Check FFmpeg stderr outputs.
      checkFfmpegStderr(output.stderr)
      // Check file contents.
      return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
        checkFileContents(outputFileContents)
      })
    });
  })
});

// Check FFmpeg stderr outputs.
const checkFfmpegStderr = (stderr) => {
  expect(stderr).toMatch(/silence_start: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_end: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_duration: ([\d.\d]+)/g)
}

// Check file contents.
const checkFileContents = (contents) => {
  expect(contents).toMatch(/lavfi.silence_start=([\d.\d]+)/g)
  expect(contents).toMatch(/lavfi.silence_end=([\d\.\d]+)/g)
}

afterEach(() => {
  const source = fsp.unlink(outputFileName);
});