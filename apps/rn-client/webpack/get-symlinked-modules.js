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
	
	Source: https://github.com/expo/expo/blob/58fb4e57efacf53da35bad50390ce0faa7d2945d/packages/expo-yarn-workspaces/common/get-symlinked-modules.js
*/

const fs = require('fs');
const path = require('path');

/**
 * Returns a mapping from the names of symlinked packages to the physical paths of each package.
 */
module.exports = function getSymlinkedNodeModulesForDirectory(packagePath) {
  const nodeModulesPath = path.join(packagePath, 'node_modules');
  const directories = listDirectoryContents(nodeModulesPath);

  const modules = {};
  for (const directory of directories) {
    // The directory is either a scope or a package
    if (directory.startsWith('@')) {
      const scopePath = path.join(nodeModulesPath, directory);
      const scopedPackageDirectories = fs.readdirSync(scopePath);
      for (const subdirectory of scopedPackageDirectories) {
        const dependencyName = `${directory}/${subdirectory}`;
        const dependencyPath = path.join(scopePath, subdirectory);
        if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
          modules[dependencyName] = fs.realpathSync(dependencyPath);
        }
      }
    } else {
      const dependencyName = directory;
      const dependencyPath = path.join(nodeModulesPath, directory);
      if (fs.lstatSync(dependencyPath).isSymbolicLink()) {
        modules[dependencyName] = fs.realpathSync(dependencyPath);
      }
    }
  }
  return modules;
};

function listDirectoryContents(directory) {
  try {
    return fs.readdirSync(directory);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return [];
    }
    throw e;
  }
}