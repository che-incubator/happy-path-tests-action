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
import * as fs from 'fs-extra';

import Axios from 'axios';
import { Configuration } from '../src/configuration';
import { Container } from 'inversify';
import { ImagesHelper } from '../src/images-helper';
import { RegexpHelper } from '../src/regexp-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('execa');

describe('Test ImagesHelper', () => {
  let container: Container;
  const devfileUrlMethodMock = jest.fn();
  const originalProcessEnv = process.env;
  const mockedProcessEnv = {};

  let configuration: any;
  let imagesHelper: ImagesHelper;

  beforeEach(() => {
    process.env = mockedProcessEnv;
    container = new Container();
    configuration = {
      devfileUrl: devfileUrlMethodMock,
    };
    container.bind(Configuration).toConstantValue(configuration);

    container.bind(RegexpHelper).toSelf().inSingletonScope();
    container.bind(ImagesHelper).toSelf().inSingletonScope();
    imagesHelper = container.get(ImagesHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    process.env = originalProcessEnv;
  });

  test('findImages (image)', async () => {
    const DEVFILE_IMAGE = 'my-image:foo';

    const response = {
      data: `image: ${DEVFILE_IMAGE}`,
    };
    const axiosGet = jest.spyOn(Axios, 'get') as jest.Mock;
    axiosGet.mockResolvedValueOnce(response);

    const images = await imagesHelper.findImages('https://my-url/devfile.yaml');
    expect(Array.isArray(images)).toBeTruthy();
    expect(images.length).toBe(1);
    expect(images[0]).toBe(DEVFILE_IMAGE);
  });

  test('findImages (id)', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const PLUGIN_ID = 'my-plugin';
    const PLUGIN_IMAGE = 'my-plugin-image:bar';

    const buffer = Buffer.from(`id: ${PLUGIN_ID}`, 'utf8');
    readFileSpy.mockResolvedValueOnce(buffer);

    const response = {
      data: `image: ${PLUGIN_IMAGE}`,
    };
    const axiosGet = jest.spyOn(Axios, 'get') as jest.Mock;
    axiosGet.mockResolvedValueOnce(response);

    const images = await imagesHelper.findImages('/foo/devfile.yaml');
    expect(axiosGet).toBeCalled();
    const axiosCall = axiosGet.mock.calls[0];
    expect(axiosCall[0]).toBe(`https://che-plugin-registry-main.surge.sh/v3/plugins/${PLUGIN_ID}/meta.yaml`);

    expect(Array.isArray(images)).toBeTruthy();
    expect(images.length).toBe(1);
    expect(images[0]).toBe(PLUGIN_IMAGE);
  });

  test('findImages (reference)', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const buffer = Buffer.from('reference: http://my-external-link', 'utf8');
    readFileSpy.mockResolvedValueOnce(buffer);

    const REFERENCE_IMAGE = 'my-image:reference';

    const response = {
      data: `image: ${REFERENCE_IMAGE}`,
    };
    const axiosGet = jest.spyOn(Axios, 'get') as jest.Mock;
    axiosGet.mockResolvedValueOnce(response);

    const images = await imagesHelper.findImages('/foo/devfile.yaml');
    expect(Array.isArray(images)).toBeTruthy();
    expect(images.length).toBe(1);
    expect(images[0]).toBe(REFERENCE_IMAGE);
  });

  test('pullImage no stdout', async () => {
    const IMAGE_TO_PULL = 'my-image-to-pull';
    (execa as any).mockResolvedValue({ exitCode: 0, stdout: undefined });

    await imagesHelper.pullImage(IMAGE_TO_PULL);

    expect((execa as any).mock.calls[0][0]).toBe('docker');
    expect((execa as any).mock.calls[0][1][0]).toBe('pull');
    expect((execa as any).mock.calls[0][1][1]).toBe(IMAGE_TO_PULL);

    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain(`Pulling image ${IMAGE_TO_PULL}...`);
    expect((core.info as any).mock.calls[1][0]).toContain(`Pulling image ${IMAGE_TO_PULL} done`);
  });

  test('pullImage w/ stdout', async () => {
    const IMAGE_TO_PULL = 'my-image-to-pull';
    const output = { pipe: jest.fn() };
    const err = { pipe: jest.fn() };

    (execa as any).mockReturnValue({ exitCode: 0, stdout: output, stderr: err });

    await imagesHelper.pullImage(IMAGE_TO_PULL);

    expect((execa as any).mock.calls[0][0]).toBe('docker');
    expect((execa as any).mock.calls[0][1][0]).toBe('pull');
    expect((execa as any).mock.calls[0][1][1]).toBe(IMAGE_TO_PULL);

    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain(`Pulling image ${IMAGE_TO_PULL}...`);
    expect((core.info as any).mock.calls[1][0]).toContain(`Pulling image ${IMAGE_TO_PULL} done`);
  });

  test('setupEnv', async () => {
    const STDOUT = 'Hello\nexport MYKEY="florent"\nexport MYVALUE="world"\n';
    // minikube docker-env
    (execa as any).mockReturnValueOnce({ exitCode: 0, stdout: STDOUT });
    // no env
    expect(Object.keys(process.env).length).toBe(0);
    await imagesHelper.setupEnv();

    expect((execa as any).mock.calls[0][0]).toBe('minikube');
    expect((execa as any).mock.calls[0][1][0]).toBe('docker-env');

    // env setup
    expect(Object.keys(process.env).length).toBe(2);
    expect(process.env.MYKEY).toBe('florent');
    expect(process.env.MYVALUE).toBe('world');

    expect(core.info).toBeCalled();
    expect((core.info as any).mock.calls[0][0]).toContain('Setup docker-env of minikube');
    expect((core.info as any).mock.calls[1][0]).toContain('Exporting MYKEY to florent');
    expect((core.info as any).mock.calls[2][0]).toContain('Exporting MYVALUE to world');
  });

  test('pull', async () => {
    const setupEnvSpy = jest.spyOn(imagesHelper, 'setupEnv');
    setupEnvSpy.mockResolvedValue();

    const pullImageSpy = jest.spyOn(imagesHelper, 'pullImage');
    pullImageSpy.mockResolvedValue();

    devfileUrlMethodMock.mockReturnValue('http://my-devfile');
    const findImagesSpy = jest.spyOn(imagesHelper, 'findImages');
    const dummyImages = ['local-example', 'image1', 'image2'];
    findImagesSpy.mockResolvedValue(dummyImages);

    // local-** image should be removed
    await imagesHelper.pull();
    expect(pullImageSpy).toBeCalledTimes(2);
    expect(pullImageSpy.mock.calls[0][0]).toBe('image1');
    expect(pullImageSpy.mock.calls[1][0]).toBe('image2');
  });

  test('findImages (id with yaml appender)', async () => {
    const readFileSpy = jest.spyOn(fs, 'readFile');
    const PLUGIN_ID = 'my-plugin';
    const PLUGIN_IMAGE_1 =
      'quay.io/eclipse/che-theia@sha256:ef8720bb0bd891d8beed86684fe6cf5c0be682f7cf19708c4fb1f9cf6536e1a7';
    const PLUGIN_IMAGE_2 =
      'quay.io/eclipse/che-theia-endpoint-runtime-binary@sha256:77bed604b46d12a4d7c0819272ec6dbce88ff18209e21d75d824af833f131ed8';

    const buffer = Buffer.from(`id: ${PLUGIN_ID}`, 'utf8');
    readFileSpy.mockResolvedValueOnce(buffer);

    const response = {
      data: `
      containers:
      - name: theia-ide
        image: 'quay.io/eclipse/che-theia@sha256:ef8720bb0bd891d8beed86684fe6cf5c0be682f7cf19708c4fb1f9cf6536e1a7'
        env:
          - name: THEIA_PLUGINS
            value: 'local-dir:///plugins'
    initContainers:
      - name: remote-runtime-injector
        image: >-
          quay.io/eclipse/che-theia-endpoint-runtime-binary@sha256:77bed604b46d12a4d7c0819272ec6dbce88ff18209e21d75d824af833f131ed8
        env:
          - name: PLUGIN_REMOTE_ENDPOINT_EXECUTABLE
            value: /remote-endpoint/plugin-remote-endpoint
        volumes:
          - name: remote-endpoint
            mountPath: /remote-endpoint
            ephemeral: true`,
    };
    const axiosGet = jest.spyOn(Axios, 'get') as jest.Mock;
    axiosGet.mockResolvedValueOnce(response);

    const images = await imagesHelper.findImages('/foo/devfile.yaml');
    expect(axiosGet).toBeCalled();
    const axiosCall = axiosGet.mock.calls[0];
    expect(axiosCall[0]).toBe(`https://che-plugin-registry-main.surge.sh/v3/plugins/${PLUGIN_ID}/meta.yaml`);

    expect(Array.isArray(images)).toBeTruthy();
    expect(images.length).toBe(2);
    expect(images[0]).toBe(PLUGIN_IMAGE_1);
    expect(images[1]).toBe(PLUGIN_IMAGE_2);
  });
});
