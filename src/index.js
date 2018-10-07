import fs from 'fs-extra';
import { join } from 'path';
import { promisify } from 'util';
import _ from 'lodash';
import code, { generateWrapperCode, generateWrapperExt } from './handlers';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

/**
 * Epsagon's serverless plugin.
 */
export default class ServerlessEpsagonPlugin {
  /**
   * The constructor for the plugin.
   * @param {Object} sls The serverless framework object.
   * @param {Object} opts options.
   */
  constructor(sls = {}, opts) {
    this.sls = sls;
    this.prefix =
      opts.prefix ||
      this.sls.config.servicePath ||
      process.env.npm_config_prefix;
    this.funcs = [];
    this.originalServicePath = this.sls.config.servicePath;
    this.commands = {
      epsagon: {
        usage:
          'Automatically wraps your function handlers with Epsagon.',
        lifecycleEvents: ['run', 'clean'],
        commands: {
          clean: {
            usage: 'Cleans up extra Epsagon files if necessary',
            lifecycleEvents: ['init'],
          },
        },
      },
    };

    this.config = this.getConfig();
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.run.bind(this),
      'before:deploy:function:packageFunction': this.run.bind(this),
      'before:invoke:local:invoke': this.run.bind(this),
      'before:offline:start:init': this.run.bind(this),
      'before:step-functions-offline:start': this.run.bind(this),
      'after:package:createDeploymentArtifacts': this.cleanup.bind(this),
      'after:invoke:local:invoke': this.cleanup.bind(this),
      'epsagon:clean:init': this.cleanup.bind(this),
    };
  }

  /**
   * logs a message to the sls console.
   * @param {string} format The format of the message.
   * @param {Array} args Additional arguments.
   */
  log(format, ...args) {
    this.sls.cli.log(`[serverless-plugin-epsagon] ${format}`, ...args);
  }

  /**
   * Wraps function handlers with Epsagon
   */
  async run() {
    if (this.config.disable) {
      this.log('Epsagon disabled - not wrapping functions');
      return;
    }
    if (!this.config.token) {
      this.log('No epsagon token was supplied - not wrapping functions');
      return;
    }
    this.log('Wrapping your functions with Epsagon...');
    this.funcs = this.findFuncs();
    await this.generateHandlers();
    this.assignHandlers();
  }

  /**
   * Finds all the functions the plugin should wrap with Epsagon.
   * @return {Array} The functions to wrap.
   */
  findFuncs() {
    return Object.entries(this.sls.service.functions)
      .reduce((result, pair) => {
        const [key, func] = pair;
        const runtime = func.runtime || this.sls.service.provider.runtime;

        if (!_.isString(runtime)) {
          return result;
        }

        const language = Object.keys(code).find((lang => runtime.match(lang)));
        if (!language) {
          this.log(`runtime "${runtime}" is not supported yet, skipping function ${key}`);
          return result;
        }

        const handler = _.isString(func.handler) ? func.handler.split('.') : [];
        const relativePath = handler.slice(0, -1).join('.');
        result.push(Object.assign(func, {
          method: _.last(handler),
          key,
          relativePath,
          language,
          epsagonHandler: `${key}-epsagon`,
        }));
        return result;
      }, []);
  }

  /**
   * Generates the Epsagon handlers and writes them to the FS.
   */
  async generateHandlers() {
    const handlersFullDirPath = join(
      this.originalServicePath,
      this.config.handlersDirName
    );
    try {
      await mkdir(handlersFullDirPath);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    await Promise.all(this.funcs.map(async (func) => {
      const handlerCode = generateWrapperCode(func, this.config);
      await writeFile(
        join(
          handlersFullDirPath,
          generateWrapperExt(func)
        ),
        handlerCode
      );
    }));
    // TODO: add python __init__.py file
  }

  /**
   * Replaces the functions original handlers with Epsagon's handlers.
   */
  assignHandlers() {
    this.funcs.forEach((func) => {
      _.set(
        this.sls.service.functions,
        `${func.key}.handler`,
        join(this.config.handlersDirName, `${func.epsagonHandler}.${func.method}`)
      );
    });
  }

  /**
   * Gets the plugin config.
   * @returns {Object} The config object
   */
  getConfig() {
    return Object.assign({
      metadataOnly: 'false',
      handlersDirName: 'epsagon_handlers',
    }, (this.sls.service.custom || {}).epsagon || {});
  }

  /**
   * Cleaning Epsagon's handlers
   */
  cleanup() {
    this.log('Cleaning up Epsagon\'s handlers');
    fs.removeSync(join(this.originalServicePath, this.config.handlersDirName));
  }
}
