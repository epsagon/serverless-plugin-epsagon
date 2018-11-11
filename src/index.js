import fs from 'fs-extra';
import { join } from 'path';
import { promisify } from 'util';
import _ from 'lodash';
import glob from 'glob-promise';
import {
  SUPPORTED_LANGUAGES,
  generateWrapperCode,
  generateWrapperExt
} from './handlers';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const VALIDATE_LIB_BY_LANG = {
  /**
   * Validates the python Epsagon's library
   */
  python() {
    this.log('You have some Python Lambda functions. Please make sure Epsagon\'s Python library' +
      ' is installed.');
  },
  /**
   * Validates the node Epsagon's library
   */
  async node() {
    let pack;
    try {
      pack = await fs.readJson(join(this.prefix, 'package.json'));
    } catch (err) {
      this.log('Could not read package.json. Skipping Epsagon library validation - please make sure you have it installed!');
      return;
    }
    const { dependencies = [] } = pack;
    if (!Object.keys(dependencies).some(dep => dep === 'epsagon')) {
      throw new Error('Epsagon\'s Node library must be installed in order to use this plugin!');
    }
  },
};
VALIDATE_LIB_BY_LANG.tsnode = VALIDATE_LIB_BY_LANG.node;


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
    this.config = this.getConfig();
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
    await this.handleTS();
    await this.validateLib();
    await this.generateHandlers();
    this.assignHandlers();
  }

  /**
   * Checks that all of the required epsagon libraries are installed.
   */
  async validateLib() {
    const languages = _.uniq(this.funcs.map(func => func.language));
    await Promise.all(languages.map(async (lang) => {
      await VALIDATE_LIB_BY_LANG[lang].bind(this)();
    }));
  }

  /**
   * Changes all the typescript functions correctly
   */
  async handleTS() {
    await Promise.all(this.funcs.map(async (func) => {
      const handler = _.isString(func.handler) ? func.handler.split('.') : [];
      const relativePath = handler.slice(0, -1).join('.');
      const matchingFiles = glob.sync(`${relativePath}.*`);
      if (
        matchingFiles.length > 0 &&
           (matchingFiles[0].endsWith('.ts') ||
            matchingFiles[0].endsWith('.tsx'))
      ) {
        // This is a good enough test for now. lets treat it as TS.
        func.language = 'tsnode'; // eslint-disable-line no-param-reassign
      }
    }));
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
        const { disable } = func.epsagon || {};
        const handler = _.isString(func.handler) ? func.handler.split('.') : [];
        const relativePath = handler.slice(0, -1).join('.');

        if (disable) {
          this.log(`Epsagon is disabled for function ${func.key}, skipping.`);
        }

        if (!_.isString(runtime)) {
          return result;
        }

        const language = SUPPORTED_LANGUAGES.find((lang => runtime.match(lang)));
        if (!language) {
          this.log(`Runtime "${runtime}" is not supported yet, skipping function ${key}`);
          return result;
        }

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
  }

  /**
   * Replaces the functions original handlers with Epsagon's handlers.
   */
  assignHandlers() {
    this.funcs.forEach((func) => {
      _.set(
        this.sls.service.functions,
        `${func.key}.handler`,
        `${this.config.handlersDirName.replace('\\', '/')}/${func.epsagonHandler}.${func.method}`
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
