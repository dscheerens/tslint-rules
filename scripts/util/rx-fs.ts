import { MakeDirectoryOptions, PathLike, mkdir, readdir, writeFile } from 'fs';
import { Observable, Subscriber } from 'rxjs';

export function readDir$(path: PathLike): Observable<string[]> {
    return new Observable((subscriber: Subscriber<string[]>) => {
        let canceled = false;

        readdir(path, (error, data) => {
            if (canceled) {
                return;
            }
            if (error) {
                subscriber.error(error);
            } else {
                subscriber.next(data);
                subscriber.complete();
            }
        });

        return () => canceled = true;
    });
}

export function mkdir$(path: PathLike, options?: number | string | MakeDirectoryOptions | null): Observable<void> {
    return new Observable((subscriber: Subscriber<void>) => {
        let canceled = false;

        mkdir(path, options, (error) => {
            if (canceled) {
                return;
            }
            if (error) {
                subscriber.error(error);
            } else {
                subscriber.next(undefined);
                subscriber.complete();
            }
        });

        return () => canceled = true;
    });
}

export function writeFile$(path: PathLike | number, content: string, encoding?: string): Observable<void>;
export function writeFile$(path: PathLike | number, content: Buffer): Observable<void>;
export function writeFile$(path: PathLike | number, content: string | Buffer, encoding?: string): Observable<void> {
    const contentEncoding = content instanceof Buffer ? null : encoding || 'UTF8';

    return new Observable((subscriber: Subscriber<void>) => {
        let canceled = false;

        writeFile(path, content, { encoding: contentEncoding }, (error) => {
            if (canceled) {
                return;
            }
            if (error) {
                subscriber.error(error);
            } else {
                subscriber.next(undefined);
                subscriber.complete();
            }
        });

        return () => canceled = true;
    });
}
