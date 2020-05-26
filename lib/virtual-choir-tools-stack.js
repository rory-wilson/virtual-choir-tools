const cdk = require('@aws-cdk/core');
const s3 = require('@aws-cdk/aws-s3');
const lambda = require("@aws-cdk/aws-lambda");

class VirtualChoirToolsStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Buckets
    var inputBucket = new s3.Bucket(this, 'VirtualChoirInput', {
      versioned: false
    });

    var audioBucket = new s3.Bucket(this, 'VirtualChoirAudio', {
      versioned: false
    });

    var treatedBucket = new s3.Bucket(this, 'VirtualChoirTreated', {
      versioned: false
    });

    var outputBucket = new s3.Bucket(this, 'VirtualChoirOutput', {
      versioned: false
    });

    // Lambdas
    const preprocessorLambda = new lambda.Function(this, "VirtualChoirPreProcessor", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("src"),
      handler: "preprocess.handler",
      environment: {
        INPUTBUCKET: inputBucket.bucketName,
        AUDIOBUCKET: audioBucket.bucketName,
        OUTPUTBUCKET: treatedBucket.bucketName
      }
    });

    const builderLambda = new lambda.Function(this, "VirtualChoirBuilder", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.asset("src"),
      handler: "make.handler",
      environment: {
        INPUTBUCKET: treatedBucket.bucketName,
        OUTPUTBUCKET: outputBucket.bucketName
      }
    });

    // Permissions
    inputBucket.grantReadWrite(preprocessorLambda);
    audioBucket.grantReadWrite(preprocessorLambda);
    treatedBucket.grantReadWrite(preprocessorLambda);

    treatedBucket.grantReadWrite(builderLambda);
    outputBucket.grantReadWrite(builderLambda);
  }
}

module.exports = { VirtualChoirToolsStack }
