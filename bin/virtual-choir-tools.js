#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { VirtualChoirToolsStack } = require('../lib/virtual-choir-tools-stack');

const app = new cdk.App();
new VirtualChoirToolsStack(app, 'VirtualChoirToolsStack');
