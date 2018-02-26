import * as fs from 'fs';

import { Observable } from 'rxjs/Observable'
import { bindNodeCallback } from 'rxjs/observable/bindNodeCallback';

export const readdir = bindNodeCallback(fs.readdir);

export const mkdir
    : (path: fs.PathLike) => Observable<void>
    = bindNodeCallback(fs.mkdir) as any;

export type WriteFileOptions = { encoding?: string | null; mode?: number; flag?: string } | string | null;

export const writeFile
    : (path: fs.PathLike | number, data: string | Buffer | Uint8Array, options?: WriteFileOptions) => Observable<void>
    = bindNodeCallback(fs.writeFile) as any;
