import { getLineRanges, getTokenAtPosition, isPositionInComment } from 'tsutils';
import * as Lint from 'tslint';
import * as ts from 'typescript';

const OPTION_INDENT_SIZE_2 = 2;
const OPTION_INDENT_SIZE_4 = 4;

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'strict-indent-size',
        type: 'style',
        description: 'Enforce strict indentation sizes.',
        descriptionDetails: Lint.Utils.dedent`
            Checks that all code is indented properly using a fixed indentation size.
            When this rule is enabled the indentation length for each line is checked
            by verifying that it is a multiple of either 2 or 4 spaces.
            The desired indentation size of 2 or 4 spaces can be set through the options of this rule.

            Indentation is not checked for lines that are part of a comment or template strings.

            **NOTE**: This rule assumes that indentation is done using spaces. It will not check for tabs.
        `,
        rationale: 'Using a strict indentation size results in cleaner looking code.',
        options: {
            type: 'array',
            items: [
                {
                    type: 'number',
                    enum: [OPTION_INDENT_SIZE_2, OPTION_INDENT_SIZE_4]
                }
            ],
            minLength: 0,
            maxLength: 1
        },
        optionsDescription: 'An optional argument for the indentation size can be specified, which should be either 2 or 4 (default).',
        optionExamples: [
            [true],
            [true, OPTION_INDENT_SIZE_2],
            [true, OPTION_INDENT_SIZE_4]
        ],
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
        return { size: OPTION_INDENT_SIZE_4 }
    }

    if (typeof size === 'number'&& (size === OPTION_INDENT_SIZE_2 || size === OPTION_INDENT_SIZE_4)) {
        return { size };
    }

    return undefined;
}

interface Options {
    readonly size: typeof OPTION_INDENT_SIZE_2 | typeof OPTION_INDENT_SIZE_4;
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
