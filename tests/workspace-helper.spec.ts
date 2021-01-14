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

import * as core from '@actions/core';
import * as execa from 'execa';

import { Configuration } from '../src/configuration';
import { Container } from 'inversify';
import { K8sHelper } from '../src/k8s-helper';
import { WorkspaceHelper } from '../src/workspace-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test WorkspaceHelper', () => {
  let container: Container;
  let configuration: any;
  let workspaceHelper: WorkspaceHelper;
  const configurationDevfileUrlMethdMock = jest.fn();
  let coreApiMock;
  const listNamespacedPodMethodMock = jest.fn();

  beforeEach(() => {
    container = new Container();
    configuration = {
      devfileUrl: configurationDevfileUrlMethdMock,
    };
    coreApiMock = {
      listNamespacedPod: listNamespacedPodMethodMock,
    };
    const getCoreApiMethod = jest.fn();
    const k8sHelper = {
      getCoreApi: getCoreApiMethod,
    } as any;
    getCoreApiMethod.mockReturnValue(coreApiMock);

    container.bind(K8sHelper).toConstantValue(k8sHelper);
    container.bind(Configuration).toConstantValue(configuration);

    container.bind(WorkspaceHelper).toSelf().inSingletonScope();
    workspaceHelper = container.get(WorkspaceHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('start no stdout/stderr', async () => {
    const fakeWorkspaceUrl = 'https://my-workspace.url';

    const stdout = `lorem ipsum ${fakeWorkspaceUrl}\n ipsum\n`;

    (execa as any).mockResolvedValue({ exitCode: 0, stdout });

    // mock workspace start
    const waitWorkspaceStartSpy = jest.spyOn(workspaceHelper, 'waitWorkspaceStart');
    waitWorkspaceStartSpy.mockResolvedValue();

    await workspaceHelper.start();

    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Create and start workspace...');
    expect((core.info as any).mock.calls[1][0]).toContain('DevFile Path selected to');

    expect((execa as any).mock.calls[0][0]).toBe('chectl');
    expect((execa as any).mock.calls[0][1][0]).toBe('workspace:create');

    // check output
    expect(core.setOutput).toBeCalled();
    expect((core.setOutput as any).mock.calls[0][0]).toBe('workspace-url');
    expect((core.setOutput as any).mock.calls[0][1]).toBe(fakeWorkspaceUrl);

    expect((core.info as any).mock.calls[2][0]).toBe(`Detect as workspace URL the value ${fakeWorkspaceUrl}`);

    expect(waitWorkspaceStartSpy).toBeCalled();
  });

  test('start with stdout/stderr', async () => {
    const output = { pipe: jest.fn() };
    const err = { pipe: jest.fn() };
    const fakeWorkspaceUrl = 'https://my-workspace.url';
    const stdOutAfterResolve = `lorem ipsum ${fakeWorkspaceUrl}\n ipsum\n`;

    const promise = new Promise((res: any) => {
      res({ stdout: stdOutAfterResolve });
    });

    (promise as any).exitCode = 0;
    (promise as any).stdout = output;
    (promise as any).stderr = err;

    (execa as any).mockReturnValue(promise);

    // mock workspace start
    const waitWorkspaceStartSpy = jest.spyOn(workspaceHelper, 'waitWorkspaceStart');
    waitWorkspaceStartSpy.mockResolvedValue();

    await workspaceHelper.start();

    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Create and start workspace...');
    expect((core.info as any).mock.calls[1][0]).toContain('DevFile Path selected to');

    expect((execa as any).mock.calls[0][0]).toBe('chectl');
    expect((execa as any).mock.calls[0][1][0]).toBe('workspace:create');

    // check output
    expect(core.setOutput).toBeCalled();
    expect((core.setOutput as any).mock.calls[0][0]).toBe('workspace-url');
    expect((core.setOutput as any).mock.calls[0][1]).toBe(fakeWorkspaceUrl);

    expect((core.info as any).mock.calls[2][0]).toBe(`Detect as workspace URL the value ${fakeWorkspaceUrl}`);

    expect(waitWorkspaceStartSpy).toBeCalled();
  });

  test('start failure workspace-start', async () => {
    const stdout = 'lorem ipsum';

    (execa as any).mockResolvedValue({ exitCode: 0, stdout });

    // mock workspace start
    const waitWorkspaceStartSpy = jest.spyOn(workspaceHelper, 'waitWorkspaceStart');
    waitWorkspaceStartSpy.mockResolvedValue();

    await expect(workspaceHelper.start()).rejects.toThrow(
      `Unable to find workspace URL in stdout of workspace:create process. Found ${stdout}`
    );

    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Create and start workspace...');
    expect((core.info as any).mock.calls[1][0]).toContain('DevFile Path selected to');

    expect((execa as any).mock.calls[0][0]).toBe('chectl');
    expect((execa as any).mock.calls[0][1][0]).toBe('workspace:create');

    // check output
    expect(core.setOutput).toBeCalledTimes(0);
    expect(waitWorkspaceStartSpy).toBeCalledTimes(0);
  });

  test('waitWorkspaceStart (never reach running state)', async () => {
    listNamespacedPodMethodMock.mockResolvedValue({
      body: {
        items: [],
      },
    });

    await expect(workspaceHelper.waitWorkspaceStart(200, 50)).rejects.toThrow(
      'Waiting too long to have workspace running'
    );

    // core.info
    expect(core.info).toBeCalled();
  });

  test('waitWorkspaceStart workspace being running', async () => {
    listNamespacedPodMethodMock.mockResolvedValue({
      body: {
        items: [''],
      },
    });

    await workspaceHelper.waitWorkspaceStart();

    // core.info
    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Found a running workspace, do not wait anymore');
  });
});
