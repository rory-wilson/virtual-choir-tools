console.log = jest.fn();
console.error = jest.fn();
const silence = require('../src/silences.js');
const fsp = require('fs').promises;
const outputFileName = "output/detected-silence.txt"
const inputFileName = "__tests__/assets/silence_detection.mp4"

describe("Silence detection", () => {
  jest.setTimeout(10000)
  test("it should find silence start and end", () => {
    return silence.detectSilence(inputFileName, outputFileName).then(output => {
      // Check FFmpeg stderr outputs.
      expect(output.stderr).toMatch(/silence_start: ([\d.\d]+)/g)
      expect(output.stderr).toMatch(/silence_end: ([\d.\d]+)/g)
      expect(output.stderr).toMatch(/silence_duration: ([\d.\d]+)/g)
      // Check file contents.
      return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
        expect(outputFileContents).toMatch(/lavfi.silence_start=([\d.\d]+)/g)
        expect(outputFileContents).toMatch(/lavfi.silence_end=([\d\.\d]+)/g)
      })
    });
  })
});

afterAll(() => {
  const source = fsp.unlink(outputFileName);
});