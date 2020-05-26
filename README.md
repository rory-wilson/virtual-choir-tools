# Virtual Choir Tools

Some AWS lambdas for batch processing video to create better assets for virtual choir projects using ffmpeg!

## Deploying

 * `cdk bootstrap`          setup the cdk in your AWS account
 * `cdk deploy`             deploy the stack

## Running

Execute the pre-process lambda to:
* extract the mp3 audio
* run noise cancelling on the mp3 audio
* detect the first noise (which should be a clap)
* parse the silence output file into Json, to then use that to 
* create a clip starting at the first noise, deinterlaced

Execute the make lambda using the pre-processed video to:
* create an output video with a series of cuts, with different files in a grid (using the xstack plugin)

The input format for this lambda is a json file
