<p align="center">
  <a href="https://epsagon.com" target="_blank" align="center">
    <img src="https://cdn2.hubspot.net/hubfs/4636301/Positive%20RGB_Logo%20Horizontal%20-01.svg" width="300">
  </a>
  <br />
</p>

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/serverless-plugin-epsagon.svg)](https://badge.fury.io/js/serverless-plugin-epsagon)
[![Build Status](https://travis-ci.com/epsagon/serverless-plugin-epsagon.svg?branch=master)](https://travis-ci.com/epsagon/serverless-plugin-epsagon)

# Epsagon Serverless Framework Plugin

[Epsagon's](https://epsagon.com) plugin for the [Serverless Framework](https://serverless.com), that enables tracing for your functions.

## Contents

- [Installation](#installation)
  - [Install Epsagon's Library](#install-epsagons-library)
  - [Install The Plugin](#install-the-plugin)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Service Level Options](#service-level-options)
  - [Function Level Options](#function-level-options)
- [Troubleshooting](#troubleshooting)
- [Getting Help](#getting-help)
- [Opening Issues](#opening-issues)
- [License](#license)

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
If you are using `serverless-python-requirements` plugin, also add `epsagon` to your `requirements.txt` file.

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

For the best results, make sure this is the **first plugin** specified in your
plugins list.

## Usage

**When using this plugin, make sure to use just this method for tracing.** You don't need to manually copy or import the epsagon library to your code, nor enable the auto-tracing.

To get started with the plugin, open your `serverless.yml`, and add the following snippet in the `custom` section:
```yaml
custom:
  epsagon:
    token: epsagon-token
    appName: app-name-stage
```

You can find your token in the [Epsagon settings page](https://app.epsagon.com/settings).


The plugin will be activated automatically during `sls deploy`,
`sls package` and `sls invoke local` events automatically.

To cleanup any Epsagon-related files run `sls epsagon clean` and it will clean up files after deployment (can happen when you stop in the middle of a deployment)

## Configuration

### Service Level Options
These options are defined at the service level, under the `custom.epsagon` section
of your `serverless.yml` file. Any function level option will **override** options
defined here.

Available options:

|Parameter        |Mandatory/Optional|Default Value     |Description                                                                                                                                   |
|-----------------|------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|`token`          |Mandatory         |`-`               |Epsagon account token. You can find your token in the [Epsagon settings page](https://app.epsagon.com/settings).                        |
|`appName`        |Optional          | ``               |Application name that will be set for traces                                                                                                  |
|`disable`        |Optional          | `false`          | When set to true it disables Epsagon for the entire service. When this option is active wrapping your functions with Epsagon will be skipped.|
|`metadataOnly`   |Optional          |`false`           |Whether to send only the metadata (`true`) or also the payloads (`false`)                                                                     |
|`handlersDirName`|Optional          |`epsagon_handlers`|Customize the name of the directory Epsagon stores its handlers in. Do not use this option unless you know what you are doing.                |
|`packageJsonPath`|Optional          |`./package.json`  |Customize the path of your `package.json`                                                                                                     |
|`collectorURL`   |Optional          |`-`               |The address of the trace collector to send trace to                                                                                           |
|`ignoredKeys`    |Optional          |`-`               |May contain strings (will perform a loose match, so that First Name also matches first_name)                                                  |
|`urlsToIgnore`   |Optional          |`-`               |Ignore HTTP calls to specific domains                                                                                                         |
|`labels`         |Optional          |`[]`              |Global labels applied to all traces. For example "[['key', 'val']]". (Not available for Python)                                                                                |

### Function Level Options
These options are defined at the function level, under the `epsagon` member of your function in the `serverless.yml` file.
Configuring the values at the function level, will override the service level configurations.

For example:
```yaml
functions:
  example-func:
    handler: handler.handle
    epsagon:
      wrapper: lambda_wrapper
      disable: true
```

Available options:

|Parameter|Mandatory/Optional|Default Value                                                                                       |Description                                            |
|---------|------------------|----------------------------------------------------------------------------------------------------|-------------------------------------------------------|
|`disable`|Optional          | `false`                                                                                            | When set to true it disables Epsagon for the function.|
|`appName`|Optional          | ``                                                                                                 |Application name that will be set for traces           |
|`wrapper`|Optional          |`lambda_wrapper/lambdaWrapper` - The wrapper to use to wrap this function. See [wrappers](#wrappers)|                                                       |


#### wrappers
* Python functions:
    * `lambda_wrapper` - regular lambda wrapper
    * `step_lambda_wrapper` - Used to wrap step functions
    * `python_wrapper` - Used to wrap regular Python functions (doesn't have to run on Lambda)
* Node.js functions:
    * `lambdaWrapper` - regular lambda wrapper
    * `stepLambdaWrapper` - Used to wrap step functions
    * `nodeWrapper` - Used to wrap regular Node functions (doesn't have to run on Lambda)
        
## Troubleshooting

### Does this plugin work with webpack?
Yes. you can use webpack or any serverless plugins utilizing webpack with
this plugin. Just make sure to specify this plugin before any other
plugin in your `serverless.yml`:
```yaml
plugins:
- serverless-plugin-epsagon
- serverless-webpack
- any-other-plugin
```
In order to get the full tracing ability of epsagon, please specify any packages
that should be traced (e.g. aws-sdk, pg, mongodb) as external in your webpack
config.

### Is TypeScript supported?
Yes. Just make sure to specify this plugin first in your `serverless.yml`

### Unable to import module `epsagon_handlers` error:
During deployment, the plugin creates `epsagon_handlers/` dir to wrap the function. Please make sure this dir is not excluded in the configuration.

### [Node.js] Cannot find module 'epsagon' error:
`node_modules` must be included in the function package being deployed, make sure that `node_modules` is not excluded somewhere. An example bellow of how your `serverless.yml` could look like:
```yaml
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

### [Node.js] `Epsagon's Node library must be installed in order to use this plugin!` error:
The plugin verifies that `epsagon` module exists on your `./package.json` before deployment.
In some cases, the `package.json` might be in a different path. You can easily update it using `packageJsonPath` parameter, for example:
```yaml
custom:
  epsagon:
    packageJsonPath: `../../dir/package.json`
```
    
### Can I use this plugin together with another methods of tracing using Epsagon?
No. Make sure to choose only a single way to trace your functions.

### In my AWS Lambda I'm accessing a local file. Using the plugin causes an issue.
If you are using a relative path to a local file in your Lambda function, using the plugin might cause some issues.
The reason for that is that the plugin changes the location of your Lambda handler.

## Getting Help

If you have any issue around using the library or the product, please don't hesitate to:

* Use the [documentation](https://docs.epsagon.com).
* Use the help widget inside the product.
* Open an issue in GitHub.


## Opening Issues

If you encounter a bug with the Epsagon library for Node.js, we want to hear about it.

When opening a new issue, please provide as much information about the environment:
* Library version, runtime version, dependencies, etc.
* Snippet of the usage.
* A reproducible example can really help.

The GitHub issues are intended for bug reports and feature requests.
For help and questions about Epsagon, use the help widget inside the product.

## License

Provided under the MIT license. See LICENSE for details.

Copyright 2020, Epsagon
