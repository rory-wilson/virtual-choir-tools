jest.setTimeout(10000)
console.log = jest.fn()
console.error = jest.fn()
console.time = jest.fn()
const silence = require('../src/silences.js');
const fsp = require('fs').promises;
const outputFileName = "output/detected-silence.txt"
const outputFixtureFileName = "__tests__/assets/detected-silence.txt"
const outputFixtureNoEndFileName = "__tests__/assets/detected-silence-no-end.txt"
const silenceJSONFile = "output/silence.json"
const temporarySourceDir = "tmp_sources/"

const inputFileNameNormal = "__tests__/assets/silence_detection.mp4"
const inputFileNameNoEnd = "__tests__/assets/silence_detection_no_end.mp4"

describe("Silence detection", () => {
  test("it should find silence start and end", () => {
    return silence.detectSilence(inputFileNameNormal, outputFileName).then(output => {
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
    return silence.detectSilence(inputFileNameNoEnd, outputFileName).then(output => {
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

describe("End-to-end silence run", () => {
  test("It should handle multiple files without fatal error", () => {
    return prepTemporarySourceDir().then(() => {
      return silence.silences([temporarySourceDir]).then(() => {
        return fsp.readFile("working/silences.csv", 'utf8').then((csv) => {
          expect(true).toBe(true)
          expect(csv).toMatch("silence_detection.mp4, 0.725208,16.4535")
          expect(csv).toMatch("silence_detection_no_end.mp4, 2.22271,8.853000")
        })
      })
    })
  })
})

const prepTemporarySourceDir = async () => {
  await fsp.mkdir(temporarySourceDir)
  await fsp.copyFile(inputFileNameNoEnd, temporarySourceDir + "silence_detection_no_end.mp4")
  await fsp.copyFile(inputFileNameNormal, temporarySourceDir + "silence_detection.mp4")
}

// Check FFmpeg stderr outputs.
const checkFfmpegStderr = (stderr) => {
  expect(stderr).toMatch(/silence_start: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_end: ([\d.\d]+)/g)
  expect(stderr).toMatch(/silence_duration: ([\d.\d]+)/g)
}

afterAll(() => {
  fsp.unlink(outputFileName);
  fsp.unlink(silenceJSONFile);
  fsp.rmdir(temporarySourceDir, {recursive:true})
});