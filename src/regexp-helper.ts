/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import { injectable } from 'inversify';

/**
 * Allow to find some named expression
 */
@injectable()
export class RegexpHelper {
  matchGroup(regexpArray: RegExpExecArray, groupName: string): string {
    if (regexpArray.groups && regexpArray.groups[groupName]) {
      return regexpArray.groups[groupName];
    } else {
      return '';
    }
  }
}
