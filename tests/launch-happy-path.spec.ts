/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/
import 'reflect-metadata';

import { CheHelper } from '../src/che-helper';
import { Configuration } from '../src/configuration';
import { Container } from 'inversify';
import { HappyPathHelper } from '../src/happy-path-helper';
import { ImagesHelper } from '../src/images-helper';
import { LaunchHappyPath } from '../src/launch-happy-path';
import { WorkspaceHelper } from '../src/workspace-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test LaunchHappyPath', () => {
  let container: Container;
  let configuration: Configuration;
  let cheHelper: CheHelper;
  let imagesHelper: ImagesHelper;
  let workspaceHelper: WorkspaceHelper;
  let happyPathHelper: HappyPathHelper;

  beforeEach(() => {
    container = new Container();
    container.bind(LaunchHappyPath).toSelf().inSingletonScope();

    cheHelper = {
      clone: jest.fn(),
    } as any;
    container.bind(CheHelper).toConstantValue(cheHelper);

    imagesHelper = {
      pull: jest.fn(),
    } as any;
    container.bind(ImagesHelper).toConstantValue(imagesHelper);

    workspaceHelper = {
      start: jest.fn(),
    } as any;
    container.bind(WorkspaceHelper).toConstantValue(workspaceHelper);

    happyPathHelper = {
      start: jest.fn(),
    } as any;
    container.bind(HappyPathHelper).toConstantValue(happyPathHelper);

    configuration = {} as any;
    container.bind(Configuration).toConstantValue(configuration);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('basic', async () => {
    const launchHappyPath = container.get(LaunchHappyPath);

    await launchHappyPath.execute();

    expect(cheHelper.clone).toBeCalled();

    expect(imagesHelper.pull).toBeCalled();

    expect(workspaceHelper.start).toBeCalled();

    expect(happyPathHelper.start).toBeCalled();
  });
});
