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
import * as path from 'path';

import { Configuration } from '../src/configuration';
import { Container } from 'inversify';
import { HappyPathHelper } from '../src/happy-path-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test HappyPathHelper', () => {
  let container: Container;
  const cheUrlMethodMock = jest.fn();
  const e2eVersionMock = jest.fn();

  let configuration: any;
  let happyPathHelper: HappyPathHelper;

  beforeEach(() => {
    container = new Container();
    configuration = {
      cheUrl: cheUrlMethodMock,
      e2eVersion: e2eVersionMock,
    };
    container.bind(Configuration).toConstantValue(configuration);

    container.bind(HappyPathHelper).toSelf().inSingletonScope();
    happyPathHelper = container.get(HappyPathHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('start no stdout/stderr', async () => {
    const fakeVersion = '1.2.3';
    e2eVersionMock.mockReturnValue(fakeVersion);

    const resolveSpy = jest.spyOn(path, 'resolve');
    const E2E_FOLDER = '/foo/e2e-folder';
    const CHE_URL = 'http://my-che';
    resolveSpy.mockReturnValue(E2E_FOLDER);
    cheUrlMethodMock.mockReturnValue(CHE_URL);

    (execa as any).mockResolvedValue({ exitCode: 0, stdout: undefined });
    await happyPathHelper.start();
    expect(core.info).toBeCalled();

    expect((core.info as any).mock.calls[0][0]).toContain(`Happy path tests will use Eclipse Che URL: ${CHE_URL}`);

    expect((execa as any).mock.calls[0][0]).toBe('docker');
    expect((execa as any).mock.calls[0][1][0]).toBe('run');
    // last parameter is docker image with version
    expect((execa as any).mock.calls[0][1][30]).toBe(`quay.io/eclipse/che-e2e:${fakeVersion}`);
    expect((core.info as any).mock.calls[1][0]).toContain('Launch docker command');

    expect((core.info as any).mock.calls[2][0]).toBe('Waiting...');
  });

  test('clone with stdout/stderr', async () => {
    e2eVersionMock.mockReturnValue('nightly');

    const output = { pipe: jest.fn() };
    const err = { pipe: jest.fn() };
    const resolveSpy = jest.spyOn(path, 'resolve');
    const E2E_FOLDER = '/foo/e2e-folder';
    const CHE_URL = 'http://my-che';
    resolveSpy.mockReturnValue(E2E_FOLDER);
    cheUrlMethodMock.mockReturnValue(CHE_URL);

    (execa as any).mockReturnValue({ exitCode: 0, stdout: output, stderr: err });
    await happyPathHelper.start();
    expect(core.info).toBeCalled();

    expect((core.info as any).mock.calls[0][0]).toContain(`Happy path tests will use Eclipse Che URL: ${CHE_URL}`);

    expect((execa as any).mock.calls[0][0]).toBe('docker');
    expect((execa as any).mock.calls[0][1][0]).toBe('run');
    expect((core.info as any).mock.calls[1][0]).toContain('Launch docker command');

    expect((core.info as any).mock.calls[2][0]).toBe('Waiting...');
  });
});
