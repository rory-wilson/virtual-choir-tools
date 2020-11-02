console.log = jest.fn();
console.error = jest.fn();
const silence = require('../src/silences.js');

describe("Silence detection", () => {
  test("it should find silence start and end", () => {
    return silence.detectSilence('__tests__/assets/silence_detection.mp4', "output/detected-silence.txt").then(output => {
      expect(output.stderr).toMatch(new RegExp('silence_start: 0.725208'))
      expect(output.stderr).toMatch(new RegExp('silence_end: 16.4535'))
      expect(output.stderr).toMatch(new RegExp('silence_duration: 15.7282'))
    });
  })
});