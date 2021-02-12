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

import { inject, injectable } from 'inversify';

import { Configuration } from './configuration';
import { K8sHelper } from './k8s-helper';

@injectable()
export class WorkspaceHelper {
  @inject(Configuration)
  private configuration: Configuration;

  @inject(K8sHelper)
  private k8sHelper: K8sHelper;

  async waitWorkspaceStart(timeoutMS = 240000, intervalMS = 5000): Promise<void> {
    const iterations = timeoutMS / intervalMS;
    for (let index = 0; index < iterations; index++) {
      const response = await this.k8sHelper
        .getCoreApi()
        .listNamespacedPod('admin-che', undefined, undefined, undefined, 'status.phase=Running', 'che.workspace_id');
      if (response.body && response.body.items.length > 0) {
        core.info('Found a running workspace, do not wait anymore');
        return;
      }
      core.info('Waiting workspace running...');
      await new Promise(resolve => setTimeout(resolve, intervalMS));
    }
    throw new Error('Waiting too long to have workspace running');
  }

  async start(): Promise<void> {
    // First create the workspace
    core.info('Create and start workspace...');
    const devfileUrl = this.configuration.devfileUrl();
    core.info(`DevFile Path selected to ${devfileUrl}`);

    const createAndStartWorkspaceProcess = execa('chectl', ['workspace:create', '--start', `--devfile=${devfileUrl}`]);
    if (createAndStartWorkspaceProcess.stdout) {
      createAndStartWorkspaceProcess.stdout.pipe(process.stdout);
    }
    const workspaceStartEndProcess = await createAndStartWorkspaceProcess;
    const workspaceUrlExec = /.*(?<url>https:\/\/.*).*/gm.exec(workspaceStartEndProcess.stdout);
    // eslint-disable-next-line no-null/no-null
    if (workspaceUrlExec === null || !workspaceUrlExec.groups) {
      throw new Error(
        `Unable to find workspace URL in stdout of workspace:create process. Found ${workspaceStartEndProcess.stdout}`
      );
    }
    const workspaceUrl = workspaceUrlExec.groups.url;

    core.setOutput('workspace-url', workspaceUrl);
    core.info(`Detect as workspace URL the value ${workspaceUrl}`);

    await this.waitWorkspaceStart();
  }
}
