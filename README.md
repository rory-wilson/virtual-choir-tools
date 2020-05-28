# Virtual Choir Tools

Some Node scripts for batch processing video to create better assets for virtual choir projects using ffmpeg!

## Overview

Execute the pre-process script to:
* extract the mp3 audio
* run noise cancelling on the mp3 audio
* detect the first noise (which should be a clap)
* parse the silence output file into Json, to then use that to 
* create a clip starting at the first noise, deinterlaced

Execute the make script using the pre-processed video to:
* create an output video with a series of cuts, with different files in a grid (using the xstack plugin)

## Prerequisits

You will need to have [nodeJS](https://nodejs.org/en/) and [ffmpeg](https://ffmpeg.org/) installed

## Installing

`npm install`

## Running

### Preprocess script:

`npm run preprocess <sourcefolder>`

This will trim your video and output an mp3 and video into the output folder.

### Make script:

`npm run make <sourcefolder> <jsonfile>`

This will create a video 'final.mp4' in the output folder based on the edit json file.

The json file uses the following format:

    {
    "cuts": [
        {
            "clips": [
                "sop1.mov",
                "sop2.mov",
                "bass2.mov",
                "bass1.mov",
            ],
            "start": 4,
            "duration": 30,
            "layout": ""
        }
    ]
    }

Where an array of `cuts` is defined as an array of `clips`, and a `start` and `duration` (in seconds). The array of clips will tile those clips in the order specified. Supported numbers of clips are 4, 9, 16, 25, 36. 

An empty string `""` for a clip will render a black box in that space, which can be used for layout padding.

If the `layout` property is specified then this will be used to layout the clips instead of the default grids. See https://ffmpeg.org/ffmpeg-filters.html#xstack for more details of layouts.