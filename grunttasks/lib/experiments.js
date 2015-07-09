/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPERIMENTS_FILE = './server/config/production-experiments.json';

module.exports = {
  generateNewConfig: function(branchName) {
    var trainExperiments = 'github:mozilla/fxa-content-experiments#' + branchName;

    var experimentsFile = JSON.parse(fs.readFileSync(EXPERIMENTS_FILE));
    experimentsFile.experiments.git = trainExperiments;

    var newConfig = JSON.stringify(experimentsFile, null, 4);
    console.log('Writing new experiment configuration:', newConfig);
    fs.writeFileSync(EXPERIMENTS_FILE, newConfig)

  },
  bumpExperimentBranch: function(branchName) {
    // TODO: bump version here
  }
};
