/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import * as core from '@actions/core';
import * as execa from 'execa';
import * as path from 'path';

import { inject, injectable } from 'inversify';

import { Configuration } from './configuration';

@injectable()
export class HappyPathHelper {
  @inject(Configuration)
  private configuration: Configuration;

  async start(): Promise<void> {
    const cheUrl = this.configuration.cheUrl();
    core.info(`Happy path tests will use Eclipse Che URL: ${cheUrl}`);

    const e2eFolder = path.resolve('che', 'tests', 'e2e');

    const params = [
      'run',
      '--shm-size=1g',
      '--net=host',
      '--ipc=host',
      '-p',
      '5920:5920',
      '-e',
      'VIDEO_RECORDING=false',
      '-e',
      'TS_SELENIUM_HEADLESS=false',
      '-e',
      'TS_SELENIUM_DEFAULT_TIMEOUT=300000',
      '-e',
      'TS_SELENIUM_LOAD_PAGE_TIMEOUT=240000',
      '-e',
      'TS_SELENIUM_WORKSPACE_STATUS_POLLING=20000',
      '-e',
      `TS_SELENIUM_BASE_URL=${cheUrl}`,
      '-e',
      'TS_SELENIUM_LOG_LEVEL=DEBUG',
      '-e',
      'TS_SELENIUM_MULTIUSER=true',
      '-e',
      'TS_SELENIUM_USERNAME=admin',
      '-e',
      'TS_SELENIUM_PASSWORD=admin',
      '-e',
      'NODE_TLS_REJECT_UNAUTHORIZED=0',
      '-v',
      `${e2eFolder}:/tmp/e2e`,
      'quay.io/eclipse/che-e2e:nightly',
    ];

    core.info('Launch docker command' + params);

    // remove DOCKER_HOST or DOCKER_TLS_VERIFY env variables to use local docker
    const env = Object.assign({}, process.env);
    delete env['DOCKER_HOST'];
    delete env['DOCKER_TLS_VERIFY'];

    // run with an empty environment
    const dockerRunProcess = execa('docker', params, { extendEnv: false, env });
    if (dockerRunProcess.stdout) {
      dockerRunProcess.stdout.pipe(process.stdout);
    }
    if (dockerRunProcess.stderr) {
      dockerRunProcess.stderr.pipe(process.stderr);
    }
    core.info('Waiting...');
    await dockerRunProcess;
  }
}
