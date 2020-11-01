# Virtual Choir Tools

Some Node scripts for batch processing video to create better assets for virtual choir projects using ffmpeg!

## Overview

Execute the silences script to:

- output a .csv file with a list of the silences in all files in a folder

Execute the process script to:

- extract the mp3 audio
- detect the first noise (which should be a clap)
- parse the silence output file into Json, to then use that to
- create a clip starting at the first noise, deinterlaced

Execute the make script using the pre-processed video to:

- create an output video with a series of cuts, with different files in a grid (using the xstack plugin)

## Prerequisits

You will need to have [nodeJS](https://nodejs.org/en/) and [ffmpeg](https://ffmpeg.org/) installed

## Installing

`npm install`

## Running

### Process script:

`npm run silences <sourcefolder>`

This analyze all files in the souce folder and produce a .csv file of silences (and noises!)

`npm run process <sourcefolder>`

This will trim your video to start at the first noise and output an mp3 and video into the output folder.

### Make script:

`npm run make <jsonfile> <adjustmentgile(optional)>`

This will create a series of videos in the output folder based on the input json file.

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
            "start": 4, // start position of all clips in seconds
            "duration": 30, // length of the clip in seconds
            "layout": "", // optional, to override defaults based on clip numbers
            "border": 10, // optional, default is 0
            "filename": 'foo' // optional, otherwise will be index
        }
    ]
    }

Where an array of `cuts` is defined as an array of `clips`, and a `start` and `duration` (in seconds). The array of clips will tile those clips in the order specified. Supported numbers of clips are 4, 9, 16, 25, 36, 49 and 64.

An empty string `""` for a clip will render an empty rectangle in that space, which can be used for layout padding. This color of the space will be the same as the border colour (by default this is white).

If the `layout` property is specified then this will be used to layout the clips instead of the default grids. See https://ffmpeg.org/ffmpeg-filters.html#xstack for more details of layouts.

You can specify an optional adjustment file for any tweaks to the start time of any videos (if they're not completely in sync!. This takes the format:

    {
        "sop1.mov": 0.5 // seconds
    }
