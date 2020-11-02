jest.setTimeout(10000)
console.log = jest.fn();
console.error = jest.fn();
const silence = require('../src/silences.js');
const fsp = require('fs').promises;
const outputFileName = "output/detected-silence.txt"
const outputFixtureFileName = "__tests__/assets/detected-silence.txt"
const outputFixtureNoEndFileName = "__tests__/assets/detected-silence-no-end.txt"
const silenceJSONFile = "output/silence.json"

describe("Silence detection", () => {
  let inputFileName = "__tests__/assets/silence_detection.mp4"
  test("it should find silence start and end", () => {
    return silence.detectSilence(inputFileName, outputFileName).then(output => {
      checkFfmpegStderr(output.stderr)
    });
  })
  test("it should record the silence start and end times in the output file", () => {
    return fsp.readFile(outputFileName, 'utf8').then(outputFileContents => {
      expect(outputFileContents).toMatch(/lavfi.silence_start=([\d.\d]+)/g)
      expect(outputFileContents).toMatch(/lavfi.silence_end=([\d\.\d]+)/g)
    })
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
    })
  })
})

describe("Get clip duration as a fallback measure", () => {
  test("it should be able to get clip duration", () => {
    let inputFileName = "__tests__/assets/silence_detection_no_end.mp4"
    return silence.getClipDuration(inputFileName).then(duration => {
      expect(duration).toBe("8.853000")
    })
  })
})

describe("Convert silence text file to JSON", () => {
  test("it should record the start/end times in valid JSON", () => {
    return silence.silenceToJson(outputFixtureFileName, silenceJSONFile).then(() => {
      return fsp.readFile(silenceJSONFile, 'utf8').then(jsonFileContentString => {
        let jsonFileContent = JSON.parse(jsonFileContentString)
          expect(jsonFileContent[0].start).toBe("0.725208")
          expect(jsonFileContent[0].end).toBe("16.4535")
      })
    })
  })
  test("it should gracefully handle a missing end time", () => {
    return silence.silenceToJson(outputFixtureNoEndFileName, silenceJSONFile).then(() => {
      return fsp.readFile(silenceJSONFile, 'utf8').then(jsonFileContentString => {
        let jsonFileContent = JSON.parse(jsonFileContentString)
          expect(jsonFileContent[0].start).toBe("0.725208")
          expect(jsonFileContent[0].end).toBe("8.853000")
      })
    })
  })

})


// Check FFmpeg stderr outputs.
const checkFfmpegStderr = (stderr) => {
  expect(stderr).toMatch(/silence_start: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_end: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_duration: ([\d.\d]+)/g)
}

afterAll(() => {
  fsp.unlink(outputFileName);
  fsp.unlink(silenceJSONFile);
});