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

import { CheHelper } from './che-helper';
import { Configuration } from './configuration';
import { Container } from 'inversify';
import { HappyPathHelper } from './happy-path-helper';
import { ImagesHelper } from './images-helper';
import { K8sHelper } from './k8s-helper';
import { LaunchHappyPath } from './launch-happy-path';
import { RegexpHelper } from './regexp-helper';
import { WorkspaceHelper } from './workspace-helper';

export class InversifyBinding {
  private container: Container;

  constructor(private configuration: Configuration) {}

  public async initBindings(): Promise<Container> {
    this.container = new Container();

    this.container.bind(CheHelper).toSelf().inSingletonScope();
    this.container.bind(HappyPathHelper).toSelf().inSingletonScope();
    this.container.bind(ImagesHelper).toSelf().inSingletonScope();
    this.container.bind(K8sHelper).toSelf().inSingletonScope();
    this.container.bind(RegexpHelper).toSelf().inSingletonScope();
    this.container.bind(WorkspaceHelper).toSelf().inSingletonScope();

    this.container.bind(Configuration).toConstantValue(this.configuration);
    this.container.bind(LaunchHappyPath).toSelf().inSingletonScope();

    return this.container;
  }
}
