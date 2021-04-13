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
import * as path from 'path';

import { Container } from 'inversify';
import { InversifyBinding } from '../src/inversify-binding';
import { Main } from '../src/main';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test Main with stubs', () => {
  const originalConsoleError = console.error;
  const mockedConsoleError = jest.fn();
  const launchHappyPathTestsExecuteMethod = jest.fn();
  const launchHappyPathMock = {
    execute: launchHappyPathTestsExecuteMethod as any,
  };
  let container: Container;

  beforeEach(() => {
    container = {
      get: jest.fn().mockReturnValue(launchHappyPathMock),
    } as any;
    const spyInitBindings = jest.spyOn(InversifyBinding.prototype, 'initBindings');
    spyInitBindings.mockImplementation(() => Promise.resolve(container));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  beforeEach(() => (console.error = mockedConsoleError));
  afterEach(() => (console.error = originalConsoleError));

  test('basic', async () => {
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toBeCalledTimes(2);
    expect(returnCode).toBeFalsy();
    expect(launchHappyPathTestsExecuteMethod).toBeCalledTimes(0);
  });

  test('default configuration', async () => {
    const CHE_URL = 'https://foo.bar';
    (core as any).__setInput(Main.CHE_URL, CHE_URL);

    const resolveSpy = jest.spyOn(path, 'resolve');

    const defaultLink = '/default-devfile-url';
    resolveSpy.mockReturnValue(defaultLink);

    const main = new Main();
    const configuration = await main.initConfiguration();
    expect(configuration.cheUrl()).toBe(CHE_URL);
    expect(configuration.devfileUrl()).toBe(defaultLink);
    expect(configuration.e2eVersion()).toBe('nightly');
  });

  test('configuration with custom parameters', async () => {
    const CHE_URL = 'https://foo.bar';
    (core as any).__setInput(Main.CHE_URL, CHE_URL);

    const DEVFILE_URL = 'https://foo.baz';
    (core as any).__setInput(Main.DEVFILE_URL, DEVFILE_URL);

    const E2E_VERSION = '1.2.3.4';
    (core as any).__setInput(Main.E2E_VERSION, E2E_VERSION);

    const main = new Main();
    const configuration = await main.initConfiguration();
    expect(configuration.cheUrl()).toBe(CHE_URL);
    expect(configuration.devfileUrl()).toBe(DEVFILE_URL);
    expect(configuration.e2eVersion()).toBe(E2E_VERSION);
  });

  test('success if required parameter is provided', async () => {
    const CHE_URL = 'https://foo.bar';
    (core as any).__setInput(Main.CHE_URL, CHE_URL);

    const main = new Main();
    const returnCode = await main.start();

    expect(returnCode).toBeTruthy();
    expect(launchHappyPathTestsExecuteMethod).toBeCalled();
    expect(mockedConsoleError).toBeCalledTimes(0);
  });

  test('error', async () => {
    jest.spyOn(InversifyBinding.prototype, 'initBindings').mockImplementation(() => {
      throw new Error('Dummy error');
    });
    const main = new Main();
    const returnCode = await main.start();
    expect(mockedConsoleError).toBeCalled();
    expect(returnCode).toBeFalsy();
    expect(launchHappyPathTestsExecuteMethod).toBeCalledTimes(0);
  });

  test('configuration with stable e2e verson', async () => {
    const CHE_URL = 'https://foo.bar';
    (core as any).__setInput(Main.CHE_URL, CHE_URL);

    const E2E_VERSION = 'stable';
    (core as any).__setInput(Main.E2E_VERSION, E2E_VERSION);

    const main = new Main();
    const configuration = await main.initConfiguration();
    expect(configuration.e2eVersion()).toBe('latest');
  });
});
