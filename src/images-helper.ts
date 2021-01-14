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
import * as fs from 'fs-extra';

import { inject, injectable } from 'inversify';

import AxiosInstance from 'axios';
import { Configuration } from './configuration';

@injectable()
export class ImagesHelper {
  @inject(Configuration)
  private configuration: Configuration;

  async pullImage(image: string): Promise<void> {
    core.info(`Pulling image ${image}...`);
    const imagePullProcess = execa('docker', ['pull', image]);
    if (imagePullProcess.stdout) {
      imagePullProcess.stdout.pipe(process.stdout);
    }
    await imagePullProcess;
    core.info(`Pulling image ${image} done`);
  }

  matchGroup(regexpArray: RegExpExecArray, groupName: string): string {
    if (regexpArray.groups && regexpArray.groups[groupName]) {
      return regexpArray.groups[groupName];
    } else {
      return '';
    }
  }

  async findImages(path: string): Promise<string[]> {
    const images = new Set<string>();

    // starts by http, use axios else use file
    let devfileContent;
    if (path.startsWith('http')) {
      const response = await AxiosInstance.get(path);
      devfileContent = response.data;
    } else {
      devfileContent = await fs.readFile(path, 'utf-8');
    }

    // search the images referenced by the devfile
    const regexpImage = /image: (?<imagename>.*)/gm;
    let mImage;
    // eslint-disable-next-line no-null/no-null
    while ((mImage = regexpImage.exec(devfileContent)) !== null) {
      const imageName = this.matchGroup(mImage, 'imagename');
      core.info(`Found ${imageName} in happy path ${path}`);
      images.add(imageName);
    }

    const regexpId = /id: (?<componentid>.*)/gm;
    let mId;
    // eslint-disable-next-line no-null/no-null
    while ((mId = regexpId.exec(devfileContent)) !== null) {
      // need to grab plugin's id
      const componentId = this.matchGroup(mId, 'componentid');
      core.info(`Searching in id ${componentId}`);
      const response = await AxiosInstance.get(
        `https://che-plugin-registry-main.surge.sh/v3/plugins/${componentId}/meta.yaml`
      );
      const pluginIdContent = response.data;
      const pluginRegexpImage = /image: (?<imagename>.*)/gm;
      let mPluginImage;
      // eslint-disable-next-line no-null/no-null
      while ((mPluginImage = pluginRegexpImage.exec(pluginIdContent)) !== null) {
        const imageName = this.matchGroup(mPluginImage, 'imagename');
        core.info(`Found ${imageName} in component id ${componentId}`);
        images.add(imageName);
      }
    }

    const regexpReference = /reference: (?<referencedEntry>.*)/gm;
    let mReference;
    // eslint-disable-next-line no-null/no-null
    while ((mReference = regexpReference.exec(devfileContent)) !== null) {
      const reference = this.matchGroup(mReference, 'referencedEntry');
      core.info(`Searching in reference ${reference}`);
      const referencedImages = await this.findImages(reference);
      core.info(`Found images ${referencedImages} in reference ${reference}`);
      referencedImages.forEach(image => images.add(image));
    }

    return Array.from(images)
      .map(imageParam => imageParam.replace(/'/g, '').replace(/"/g, ''))
      .filter(image => image !== '');
  }

  async setupEnv(): Promise<void> {
    // setup docker-env of minikube
    core.info('Setup docker-env of minikube');
    // grab list of exported commands
    const { stdout } = await execa('minikube', ['docker-env']);

    // parse export commands
    const regexp = /export (?<key>.*)="(?<value>.*)"/gm;
    let m;
    // eslint-disable-next-line no-null/no-null
    while ((m = regexp.exec(stdout)) !== null) {
      const key = this.matchGroup(m, 'key');
      const value = this.matchGroup(m, 'value');
      core.info(`Exporting ${key} to ${value}`);
      process.env[key] = value;
    }
  }

  async pull(): Promise<void[]> {
    await this.setupEnv();

    // get happy path and analyze reference from the devfile
    const devfileUrl = this.configuration.devfileUrl();

    // find images from devfilePath
    const foundImages = await this.findImages(devfileUrl);

    // skip images that are prefixed with 'local-'
    const images = foundImages.filter(image => !image.startsWith('local-'));

    return Promise.all(images.map(async image => this.pullImage(image)));
  }
}
