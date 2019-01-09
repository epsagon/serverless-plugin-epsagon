# Epsagon Serverless Framework Plugin
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/serverless-plugin-epsagon.svg)](https://badge.fury.io/js/serverless-plugin-epsagon)
[![Build Status](https://travis-ci.com/epsagon/serverless-plugin-epsagon.svg?branch=master)](https://travis-ci.com/epsagon/serverless-plugin-epsagon)

[Epsagon's](https://epsagon.com) plugin for the [Serverless Framework](https://serverless.com).

## Installation
### Install Epsagon's Library
For [Node.js functions](https://www.npmjs.com/package/epsagon):
```
npm install --save epsagon
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
npm install --save-dev serverless-plugin-epsagon
```
When installing with NPM, add the plugin to your `serverless.yml` file:
```yaml
plugins:
  - serverless-plugin-epsagon
```
For the best results, make sure this is the first plugin specified in your
plugins list.

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
* `token` - Epsagon's token to use, get your token from the
[dashboard](https://dashboard.epsagon.com).
* `appName` - Optional application name to use.
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
        
## FAQ
* Does this plugin work with webpack?
    * Yes! you can use webpack or any serverless plugins utilizing webpack with
      this plugin. Just make sure to specify this plugin before any other
      plugin in your `serverless.yml`:
      ```yaml
      plugins:
        - serverless-plugin-epsagon
        - serverless-webpack
        - any-other-plugin
      ```
* Is TypeScript supported?
    * Yes! again, just make sure to specify this plugin first in your `serverless.yml`
* Unable to import module `epsagon_handlers` error:
    * During deployment, the plugin creates `epsagon_handlers/` dir to wrap the function. Please make sure this dir is not excluded somewhere.
* (Node.js) Cannot find module 'epsagon' error:
    * `node_modules` must be included in the function package being deployed, make sure that `node_modules` is not excluded somewhere. An example bellow of how your `serverless.yml` could look like:
    ```
    ...
    package:
    individually: true
    exclude:
        - ./** # Excludes everything
    include: # Include necessary dependencies for your function to work
        - "node_modules/**"
        - "epsagon_handlers/**"
    ...
    functions:
        helloWorld:
            handler: helloWorld.handler
            package:
            include:
                - helloWorld.js # Include only your function
    ...
    ```
