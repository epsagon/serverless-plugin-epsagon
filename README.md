# Epsagon Serverless Framework Plugin
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/epsagon.svg)](https://badge.fury.io/js/epsagon)
[![Build Status](https://travis-ci.com/epsagon/serverless-plugin-epsagon.svg?branch=master)](https://travis-ci.com/epsagon/serverless-plugin-epsagon)

[Epsagon's](https://epsagon.com) plugin for the [Serverless Framework](https://serverless.com).

## Installation
### Install Epsagon's Library
For [Node.js functions](https://www.npmjs.com/package/epsagon):
```
npm install epsagon
```

For [Python functions](https://pypi.org/project/epsagon):
```
pip install epsagon
```
### Install The Plugin
Using the Serverless Framework:
```
sls plugin install --name serverless-plugin-epsagon
```

Or using NPM:
```
npm install --save-dev serverless-plugin-epsgon
```
When installing with NPM, add the plugin to your `serverless.yml` file:
```yaml
plugins:
  - serveless-plugin-epsagon
```

### Configure The Plugin
To get started with the plugin, all you have to do is configure your
serverless.yml with Epsagon's token, and an optional application name:
```yaml
custom:
  epsagon:
    token: your-token-here
    appName: optional-application-name

```
And you are good to go! The plugin will be activated during `sls deploy`,
`sls package` and `sls invoke local` events automatically.

## Additional Commands
* `sls epsagon clean` will clean up remaining Epsagon files in case some were
left after deployment (when you break in the middle of a deployment for example)

## Options
### Service Level Options
These options are defined at the service level, under the `custom.epsagon` member
of your `serverless.yml` file. Any function level option will override options
defined here. Available options:
* `disable` - When set to true, disables Epsagon for the entire service. When
this option is active wrapping your functions with Epsagon will be skipped.
* `metadataOnly` - When set to true, will cause Epsagon to report only the
metadata of the operations to Epsagon's infrastracture instead of the
operation's full data.
* `handlersDirName` - Customize the name of the directory epsagon stores its
handlers in. Do not use this option unless you know what you are doing :)

### Function Level Options
These options are defined at the function level, under the `epsagon` member
of your function in the `serverless.yml` file. Available options:
* `disable` - When set to true, disables Epsagon for this specific function.
* `wrapper` - The wrapper to use to wrap this function. If not specified
defaults to Epsagon's regular lambda wrapper. available wrappers:
    * for Python:
        * `lambda_wrapper` - regular lambda wrapper
        * `step_lambda_wrapper` - Used to wrap step functions
        * `python_wrapper` - Used to wrap regular
        Python functions (doesn't have to run on Lambda)
    * for Node.js:
        * `lambdaWrapper` - regular lambda wrapper
        * `stepLambdaWrapper` - Used to wrap step functions
        * `nodeWrapper` - Used to wrap regular
        Node functions (doesn't have to run on Lambda)
