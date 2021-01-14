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
import * as path from 'path';

import { Configuration } from './configuration';
import { InversifyBinding } from './inversify-binding';
import { LaunchHappyPath } from './launch-happy-path';

export class Main {
  public static readonly CHE_URL: string = 'che-url';
  public static readonly DEVFILE_URL: string = 'devfile-url';

  async initConfiguration(): Promise<Configuration> {
    const cheUrl = core.getInput(Main.CHE_URL, { required: true });
    if (!cheUrl) {
      throw new Error(`No che-url provided (${Main.CHE_URL})`);
    }

    let devfileUrl = core.getInput(Main.DEVFILE_URL, { required: false });
    if (!devfileUrl) {
      devfileUrl = path.resolve('che', 'tests', 'e2e', 'files', 'happy-path', 'happy-path-workspace.yaml');
    }
    // configuration
    return {
      cheUrl: () => cheUrl,
      devfileUrl: () => devfileUrl,
    };
  }

  protected async doStart(): Promise<void> {
    const configuration = await this.initConfiguration();
    const inversifyBinbding = new InversifyBinding(configuration);
    const container = await inversifyBinbding.initBindings();
    const launchHappyPath = container.get(LaunchHappyPath);
    await launchHappyPath.execute();
  }

  async start(): Promise<boolean> {
    try {
      await this.doStart();
      return true;
    } catch (error) {
      console.error('stack=' + error.stack);
      console.error('Unable to start', error);
      return false;
    }
  }
}
