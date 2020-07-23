const DEFAULT_WRAPPERS = {
  python: 'lambda_wrapper',
  node: 'lambdaWrapper',
  tsnode: 'lambdaWrapper',
};

const WRAPPER_CODE = ({
  relativePath,
  method,
  wrapper,
  token,
  appName,
  collectorUrl,
  metadataOnly,
  urlsToIgnore,
  ignoredKeys,
  labels,
}) => {
  const commonNode = `

${urlsToIgnore ? `process.env.EPSAGON_URLS_TO_IGNORE = process.env.EPSAGON_URLS_TO_IGNORE || '${urlsToIgnore}';` : ''} 
${ignoredKeys ? `process.env.EPSAGON_IGNORED_KEYS = process.env.EPSAGON_IGNORED_KEYS || '${ignoredKeys}';` : ''} 

epsagon.init({
    token: '${token}',
    appName: '${appName}',
    traceCollectorURL: ${collectorUrl},
    metadataOnly: Boolean(${metadataOnly}),
    labels: ${labels.length ? JSON.stringify(labels) : labels}
});`;

  return ({
    python: `
from ${relativePath} import ${method} as ${method}_internal
${method} = ${method}_internal
try:
    import epsagon
    import os
        
    ${urlsToIgnore ? `os.environ['EPSAGON_URLS_TO_IGNORE'] = '${urlsToIgnore}' if 'EPSAGON_URLS_TO_IGNORE' not in os.environ else os.environ['EPSAGON_URLS_TO_IGNORE']` : ''}
    ${ignoredKeys ? `os.environ['EPSAGON_IGNORED_KEYS'] = '${ignoredKeys}' if 'EPSAGON_IGNORED_KEYS' not in os.environ else os.environ['EPSAGON_IGNORED_KEYS']` : ''}
    
    null = None  # used to ignore arguments
    undefined = None  # used to ignore arguments
    epsagon.init(
        token='${token}',
        app_name='${appName}',
        collector_url=${collectorUrl},
        metadata_only=bool(${metadataOnly})
    )

    ${method} = epsagon.${wrapper}(${method}_internal)
except:
    print('Warning: Epsagon package not found. The function will not be monitored')
`,
    node: `
const epsagon = require('epsagon');
const epsagonHandler = require('../${relativePath}.js');

${commonNode}

exports.${method} = epsagon.${wrapper}(epsagonHandler.${method});
`,
    tsnode: `
import * as epsagon from 'epsagon';
import * as epsagonHandler from '../${relativePath}';

${commonNode}

export const ${method} = epsagon.${wrapper}(epsagonHandler.${method});
`,
  });
};

const FILE_NAME_BY_LANG_GENERATORS = {
  python: (name => `${name}.py`),
  node: (name => `${name}.js`),
  tsnode: (name => `${name}.ts`),
};

export const SUPPORTED_LANGUAGES = ['python', 'node'];

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
  const {
    collectorURL, token, appName, metadataOnly, urlsToIgnore, ignoredKeys, labels,
  } = epsagonConf;
  const { wrapper = DEFAULT_WRAPPERS[func.language] } = (func.epsagon || {});

  const relativePath = (
    func.language === 'python' ?
      func.relativePath.replace(/\//g, '.').replace(/\\/g, '.') :
      func.relativePath
  );
  return WRAPPER_CODE({
    relativePath,
    method: func.method,
    wrapper,
    token,
    appName,
    collectorUrl: collectorURL ? `'${collectorURL}'` : undefined,
    metadataOnly: metadataOnly === true ? '1' : '0',
    urlsToIgnore,
    ignoredKeys,
    labels: labels || [],
  })[func.language];
}

/**
 * Generates a full name for a wrapper.
 * @param {Object} func The function to wrap.
 * @return {String} The generated name.
 */
export function generateWrapperExt(func) {
  return FILE_NAME_BY_LANG_GENERATORS[func.language](func.epsagonHandler);
}
