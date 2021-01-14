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

import { injectable } from 'inversify';

@injectable()
export class CheHelper {
  async clone(): Promise<void> {
    // Clone Eclipse che
    core.info('Cloning eclipse che for happy path tests');
    const gitCloneProcess = execa('git', ['clone', '--depth', '1', 'https://github.com/eclipse/che']);
    if (gitCloneProcess.stdout) {
      gitCloneProcess.stdout.pipe(process.stdout);
    }
    await gitCloneProcess;
  }
}
