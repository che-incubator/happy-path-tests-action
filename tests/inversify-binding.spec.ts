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
import { InversifyBinding } from '../src/inversify-binding';
import { K8sHelper } from '../src/k8s-helper';
import { LaunchHappyPath } from '../src/launch-happy-path';
import { RegexpHelper } from '../src/regexp-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test InversifyBinding', () => {
  test('bindings', async () => {
    const cheUrl = 'https://foo.bar';

    const predefinedConfiguration = {
      cheUrl: () => cheUrl,
    } as any;
    const inversifyBinding = new InversifyBinding(predefinedConfiguration);
    const container: Container = await inversifyBinding.initBindings();

    expect(container.isBound(CheHelper)).toBeTruthy();
    expect(container.isBound(HappyPathHelper)).toBeTruthy();
    expect(container.isBound(ImagesHelper)).toBeTruthy();
    expect(container.isBound(K8sHelper)).toBeTruthy();
    expect(container.isBound(RegexpHelper)).toBeTruthy();

    // config
    const configuration: Configuration = container.get(Configuration);
    expect(configuration).toBeDefined();
    expect(configuration.cheUrl()).toEqual(cheUrl);

    expect(container.isBound(LaunchHappyPath)).toBeTruthy();
  });
});
