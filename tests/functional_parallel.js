/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { spawn } = require('child_process');
const args = require('yargs').argv;

let STARTING_PORT_RANGE = 22000;
const NUMBER_OF_BROWSERS = args.browsers || 4;
const CMD = 'npm';

let failed = 0;
let processes = [];
process.on('exit', function () {
  processes.forEach((p) => {
    console.log('Killing processes...');
    p.kill();
  });
});

for (let browser = 0; browser < NUMBER_OF_BROWSERS; browser++) {
  const args = [
    'run',
    'test-latest',
    '--',
    `--runnerServerPort=${STARTING_PORT_RANGE++}`,
    `--runnerSocketPort=${STARTING_PORT_RANGE++}`,
    `--runnerSeleniumPort=${STARTING_PORT_RANGE++}`,
    `--parallelBrowsers=${NUMBER_OF_BROWSERS}`,
    `--parallelIndex=${browser}`
  ];
  console.log(`Starting browser via ${CMD} with args: ${args.join(' ')}`);
  const runner = spawn(CMD, args, {
    stdio: 'inherit'
  });
  processes.push(runner);
  runner.on('close', (code, signal) => {
    if (signal !== 0) {
      failed = 1;
    }
  });
}

