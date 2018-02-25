import { getLineRanges, getTokenAtPosition, isPositionInComment } from 'tsutils';
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

    public static FAILURE_MESSAGE(indentSize: number): string {
        return `Indentation should be a multiple of ${indentSize} spaces`;
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
        .map(({ pos: position, contentLength }) => {
            const line = sourceFile.text.substr(position, contentLength);

            const [indentation] = line.match(/^( )*/)!;

            const indentationSize = indentation.length;

            const token = getTokenAtPosition(sourceFile, position)!;//

            return { position, indentationSize, token }
        })
        .filter(({ position, indentationSize, token }) =>
            !isPositionInComment(sourceFile, position, token) &&
            !isWithinKind(token, ts.SyntaxKind.TemplateExpression) &&
            indentationSize % options.size > 0
        )
        .forEach(({ position, indentationSize }) => {
            ctx.addFailureAt(position, indentationSize, Rule.FAILURE_MESSAGE(options.size));
        });
}

function isWithinKind(token: ts.Node, kind: ts.SyntaxKind): boolean {
    let tokenToCheck: ts.Node | undefined = token;

    while (tokenToCheck !== undefined) {
        if (tokenToCheck.kind === kind) {
            return true;
        }

        tokenToCheck = tokenToCheck.parent;
    }

    return false;
}
