import { getLineRanges } from 'tsutils';
import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'strict-indent-size',
        type: 'style',
        description: 'Enforce strict indentation sizes.',
        descriptionDetails: 'bla',
        options: {
            type: 'array',
            items: [
                {
                    type: 'number',
                    enum: [2, 4]
                }
            ]
        },
        optionsDescription: '',
        typescriptOnly: false
    }

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const options = parseOptions(this.ruleArguments);
        return options === undefined ? [] : this.applyWithFunction(sourceFile, walk, options);
    }

}

function parseOptions(ruleArguments: any[]): Options | undefined {
    const size = ruleArguments[0];

    if (size === undefined) {
        return { size: 4 }
    }

    if (typeof size === 'number'&& (size === 2 || size === 4)) {
        return { size };
    }

    return undefined;
}

interface Options {
    readonly size: 2 | 4;
}

function walk(ctx: Lint.WalkContext<Options>): void {

    const { sourceFile, options } = ctx;

    getLineRanges(sourceFile)
        .filter(({ contentLength }) => contentLength > 0)
        .forEach((lineRange) => {

            const line = sourceFile.text.substr(lineRange.pos, lineRange.contentLength);

            const [indentation] = line.match(/^( )*/)!;

            const indentationSize = indentation.length;

            // TODO: Check for exceptions:
            // - string templates
            // - jsdoc

            if (indentationSize % options.size > 0) {
                ctx.addFailureAt(lineRange.pos, indentationSize, `Indentation should be a multiple of ${options.size} spaces`);
            }

        });
}
