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

import { inject, injectable } from 'inversify';

import { CheHelper } from './che-helper';
import { HappyPathHelper } from './happy-path-helper';
import { ImagesHelper } from './images-helper';
import { WorkspaceHelper } from './workspace-helper';

@injectable()
export class LaunchHappyPath {
  @inject(ImagesHelper)
  private imagesHelper: ImagesHelper;

  @inject(CheHelper)
  private cheHelper: CheHelper;

  @inject(WorkspaceHelper)
  private workspaceHelper: WorkspaceHelper;

  @inject(HappyPathHelper)
  private happyPathHelper: HappyPathHelper;

  public async execute(): Promise<void> {
    core.info('Eclipse Che [clone]...');
    await this.cheHelper.clone();

    core.info('Images [pull]...');
    await this.imagesHelper.pull();

    core.info('Workspace [start]...');
    await this.workspaceHelper.start();

    core.info('Happy Path [start]...');
    await this.happyPathHelper.start();
  }
}
