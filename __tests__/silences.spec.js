console.log = jest.fn();
console.error = jest.fn();
const silence = require('../src/silences.js');
const fsp = require('fs').promises;
const outputFileName = "output/detected-silence.txt"

describe("Silence detection", () => {
  test("it should find silence start and end", () => {
    return silence.detectSilence('__tests__/assets/silence_detection.mp4', outputFileName).then(output => {
      // Check FFmpeg stderr outputs.
      expect(output.stderr).toMatch(new RegExp('silence_start: 0.725208'))
      expect(output.stderr).toMatch(new RegExp('silence_end: 16.4535'))
      expect(output.stderr).toMatch(new RegExp('silence_duration: 15.7282'))
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