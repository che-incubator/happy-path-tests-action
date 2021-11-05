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

import { Container } from 'inversify';
import { RegexpHelper } from '../src/regexp-helper';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Test RegexpHelper', () => {
  let container: Container;
  let regexpHelper: RegexpHelper;

  beforeEach(() => {
    container = new Container();
    container.bind(RegexpHelper).toSelf().inSingletonScope();
    regexpHelper = container.get(RegexpHelper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('match', async () => {
    const regexp1: RegExpExecArray = {
      groups: {
        name: 'hello',
      },
    } as any;
    const result1 = regexpHelper.matchGroup(regexp1, 'name');
    expect(result1).toBe('hello');

    const regexp2: RegExpExecArray = {} as any;
    const result2 = regexpHelper.matchGroup(regexp2, 'foo');
    expect(result2).toBe('');
  });
});
