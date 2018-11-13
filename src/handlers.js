const DEFAULT_WRAPPERS = {
  python: 'lambda_wrapper',
  node: 'lambdaWrapper',
  tsnode: 'lambdaWrapper',
};

const WRAPPER_CODE = {
  python: `
import epsagon
from RELATIVE_PATH import METHOD as METHOD_internal

null = None  # used to ignore arguments
undefined = None  # used to igone arguments
epsagon.init(
    token='TOKEN',
    app_name='APP_NAME',
    collector_url=COLLECTOR_URL,
    metadata_only=bool(METADATA_ONLY)
)

METHOD = epsagon.WRAPPER_TYPE(METHOD_internal)
`,
  node: `
const epsagon = require('epsagon');
const handler = require('../RELATIVE_PATH.js');

epsagon.init({
    token: 'TOKEN',
    appName: 'APP_NAME',
    collectorURL: COLLECTOR_URL,
    metadataOnly: Boolean(METADATA_ONLY)
});

module.exports.METHOD = epsagon.WRAPPER_TYPE(handler.METHOD);
`,
  tsnode: `
const epsagon = require('epsagon');
const handler = require('../RELATIVE_PATH.ts');

epsagon.init({
    token: 'TOKEN',
    appName: 'APP_NAME',
    collectorURL: COLLECTOR_URL,
    metadataOnly: Boolean(METADATA_ONLY)
});

module.exports.METHOD = epsagon.WRAPPER_TYPE(handler.METHOD);
`,
};

const FILE_NAME_BY_LANG_GENERATORS = {
  python: (name => `${name}.py`),
  node: (name => `${name}.js`),
  tsnode: (name => `${name}.ts`),
};

export const SUPPORTED_LANGUAGES = Object.keys(WRAPPER_CODE);

/**
 * generates an epsagon wrapper for a function.
 * @param {Object} func The function to wrap.
 * @param {Object} epsagonConf The Epsagon's config object.
 * @return {String} The wrapper code.
 */
export function generateWrapperCode(
  func,
  epsagonConf
) {
  let { wrapper } = (func.epsagon || {});
  if (!wrapper) {
    wrapper = DEFAULT_WRAPPERS[func.language];
  }

  return WRAPPER_CODE[func.language]
    .replace(/RELATIVE_PATH/g, func.relativePath)
    .replace(/METHOD/g, func.method)
    .replace(/WRAPPER_TYPE/g, wrapper)
    .replace(/TOKEN/g, epsagonConf.token)
    .replace(/APP_NAME/g, epsagonConf.appName)
    .replace(/COLLECTOR_URL/g, epsagonConf.collectorURL ?
      `'${epsagonConf.collectorURL}'` : undefined)
    .replace(/METADATA_ONLY/g, epsagonConf.metadataOnly === true ? '1' : '0');
}

/**
 * Generates a full name for a wrapper.
 * @param {Object} func The function to wrap.
 * @return {String} The generated name.
 */
export function generateWrapperExt(func) {
  return FILE_NAME_BY_LANG_GENERATORS[func.language](func.epsagonHandler);
}
