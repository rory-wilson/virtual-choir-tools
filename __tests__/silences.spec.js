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
      // Check file contents.
      return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
        expect(outputFileContents).toMatch(/lavfi.silence_start=([\d.\d]+)/g)
        expect(outputFileContents).toMatch(/lavfi.silence_end=([\d\.\d]+)/g)      })
    });
  })
  test("it should not include an endtime for videos that are silent at the end", () => {
    let inputFileName = "__tests__/assets/silence_detection_no_end.mp4"

    return silence.detectSilence(inputFileName, outputFileName).then(output => {
      // Check FFmpeg stderr outputs.
      checkFfmpegStderr(output.stderr)
      // Check file contents.
      return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
        expect(outputFileContents).toMatch(/lavfi.silence_start=([\d.\d]+)/g)
        expect(outputFileContents).not.toMatch(/lavfi.silence_end=([\d\.\d]+)/g)      
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

afterEach(() => {
  const source = fsp.unlink(outputFileName);
});