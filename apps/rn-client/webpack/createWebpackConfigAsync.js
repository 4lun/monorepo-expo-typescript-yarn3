/*
	The MIT License (MIT)

	Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	Source: https://github.com/expo/expo/blob/58fb4e57efacf53da35bad50390ce0faa7d2945d/packages/expo-yarn-workspaces/webpack.js

	Modifications:
	- added static workspace path, rather than requiring `find-yarn-workspace-root`
	- included `get-symlinked-modules.js` locally and updated require path
*/
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const debug = require('debug')('workspaces');
const globModule = require('glob');
const path = require('path');
const util = require('util');

const glob = util.promisify(globModule);
const getSymlinkedNodeModulesForDirectory = require('./get-symlinked-modules');

/**
 * Returns a webpack configuration object that:
 *
 *    * transpiles symlinked workspace packages
 *    * watches for file changes in symlinked packages
 *    * allows for additional custom packages to be transpiled via env.babel argument
 */
exports.createWebpackConfigAsync = async function createWebpackConfigAsync(env, argv) {
  const workspacePackagesToTranspile = [];
	const workspaceRootPath = path.resolve(__dirname, '../../..');

  if (workspaceRootPath) {
    debug(`Found Yarn workspace root at %s`, workspaceRootPath);

    const symlinkedModules = getSymlinkedNodeModulesForDirectory(workspaceRootPath);
    const symlinkedModulePaths = Object.values(symlinkedModules);
    const workspacePackage = require(path.resolve(workspaceRootPath, 'package.json'));

    // discover workspace package directories via glob - source yarn:
    // https://github.com/yarnpkg/yarn/blob/a4708b29ac74df97bac45365cba4f1d62537ceb7/src/config.js#L812-L826
    const patterns = workspacePackage.workspaces?.packages ?? workspacePackage.workspaces ?? [];
    const registryFilenames = 'package.json';
    const trailingPattern = `/+(${registryFilenames})`;

    const files = await Promise.all(
      patterns.map((pattern) =>
        glob(pattern.replace(/\/?$/, trailingPattern), {
          cwd: workspaceRootPath,
          ignore: `/node_modules/**/+(${registryFilenames})`,
        })
      )
    );

    for (const file of new Set(files.flat())) {
      const packageDirectory = path.join(workspaceRootPath, path.dirname(file));
      if (symlinkedModulePaths.includes(packageDirectory)) {
        workspacePackagesToTranspile.push(packageDirectory);
      }
    }
  } else {
    debug(`Could not find Yarn workspace root`);
  }

  env.babel = env.babel ?? {};

  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          ...workspacePackagesToTranspile,
          ...(env.babel.dangerouslyAddModulePathsToTranspile ?? []),
        ],
      },
    },
    argv
  );

  // use symlink resolution so that webpack watches file changes
  config.resolve.symlinks = true;

  return config;
};