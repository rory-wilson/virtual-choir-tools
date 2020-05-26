const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const VirtualChoirTools = require('../lib/virtual-choir-tools-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new VirtualChoirTools.VirtualChoirToolsStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
