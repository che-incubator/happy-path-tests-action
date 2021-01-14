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

import { CheHelper } from '../src/che-helper';
import { Configuration } from '../src/configuration';
import { Container } from 'inversify';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test CheHelper', () => {
  let container: Container;
  const pluginRegistryImageMock = jest.fn();
  const devfileRegistryImageMock = jest.fn();
  const cheServerImageMock = jest.fn();
  let configuration: any;
  let cheHelper: CheHelper;

  beforeEach(() => {
    container = new Container();
    configuration = {
      pluginRegistryImage: pluginRegistryImageMock,
      devfileRegistryImage: devfileRegistryImageMock,
      cheServerImage: cheServerImageMock,
    };
    container.bind(Configuration).toConstantValue(configuration);

    container.bind(CheHelper).toSelf().inSingletonScope();
    cheHelper = container.get(CheHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('clone no stdout/stderr', async () => {
    (execa as any).mockResolvedValue({ exitCode: 0, stdout: undefined });
    await cheHelper.clone();
    expect(core.info).toBeCalled();

    expect((core.info as any).mock.calls[0][0]).toContain('Cloning eclipse che for happy path tests');

    expect((execa as any).mock.calls[0][0]).toBe('git');
    expect((execa as any).mock.calls[0][1][0]).toBe('clone');
  });

  test('clone with stdout/stderr', async () => {
    const output = { pipe: jest.fn() };
    const err = { pipe: jest.fn() };

    (execa as any).mockReturnValue({ exitCode: 0, stdout: output, stderr: err });
    await cheHelper.clone();

    expect((core.info as any).mock.calls[0][0]).toContain('Cloning eclipse che for happy path tests');

    expect((execa as any).mock.calls[0][0]).toBe('git');
    expect((execa as any).mock.calls[0][1][0]).toBe('clone');
  });
});
