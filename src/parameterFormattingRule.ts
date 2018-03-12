import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'parameter-formatting',
        type: 'style',
        description: 'Checks whether parameters are each placed on their own line.',
        descriptionDetails: Lint.Utils.dedent`
            When this rule is enabled, TSLint will check that all parameter declarations are all separated by a new line.
            By default this rule also allows all parameters to be placed on the same line.
            However, this can be disabled through the rule options.

            The \`parameter-formatting\` rule works for every type of language construct that has a parameter declaration, like:
            functions, arrow functions, value accessors, shorthand method definitions in object literals, class constructors, etc...
        `,
        optionsDescription: Lint.Utils.dedent`
            Optionally an object can be provided to control the following settings:

            * \`allowSingleLine\` - Allow all parameters to be placed on a single line. _Defaults to \`true\`._
            * \`startOnNewLine\` - Checks whether the first parameter starts on a new line. _Defaults to \`false\`._
            * \`endWithNewLine\` - Checks whether the last parameter ends with a new line. _Defaults to \`false\`._

            **NOTE**: The \`startOnNewLine\` and \`endWithNewLine\` options are ignored when all parameters are placed on the same line and
            the \`allowSingleLine\` option is enabled.
        `,
        rationale: Lint.Utils.dedent`
            Placing each parameter declaration on a separate line makes it easier to see the definition of individual parameters.
            This improves the readability of your code.
        `,
        options: {
            type: 'object',
            properties: {
                allowSingleLine: { type: 'boolean' },
                startOnNewLine: { type: 'boolean' },
                endWithNewLine: { type: 'boolean' }
            },
            additionalProperties: false
        },
        optionExamples: [
            [true],
            [true, { allowSingleLine: false }],
            [true, { startOnNewLine: true, endWithNewLine: true }]
        ],
        typescriptOnly: false
    }

    public static START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE = 'Parameter declaration should start on a new line';
    public static END_PARAMETER_WITH_NEW_LINE_FAILURE_MESSAGE = 'Parameter declaration should end with a new line';

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const options = parseOptions(this.ruleArguments);
        return options === undefined ? [] : this.applyWithWalker(
            new CheckParameterFormattingWalker(sourceFile, this.ruleName, options),
        );
    }

}

function parseOptions(ruleArguments: any[]): Options | undefined {

    if (!Array.isArray(ruleArguments) || ruleArguments.length > 0 && typeof ruleArguments[0] !== 'object') {
        return undefined;
    }

    const options = ruleArguments[0] || {};

    return {
        allowSingleLine: typeof options.allowSingleLine === 'boolean' ? options.allowSingleLine : true,
        startOnNewLine: typeof options.startOnNewLine === 'boolean' ? options.startOnNewLine : false,
        endWithNewLine: typeof options.endWithNewLine === 'boolean' ? options.endWithNewLine : false
    };
}

interface Options {
    allowSingleLine: boolean;
    startOnNewLine: boolean;
    endWithNewLine: boolean;
}

class CheckParameterFormattingWalker extends Lint.AbstractWalker<Options> {

    public walk(sourceFile: ts.SourceFile): void {
        ts.forEachChild(sourceFile, (node) => this.walkNode(sourceFile, node));
    }

    private walkNode(sourceFile: ts.SourceFile, node: ts.Node): void {

        if (!node.hasOwnProperty('parameters')) {
            ts.forEachChild(node, (childNode) => this.walkNode(sourceFile, childNode))
            return;
        }

        const parameterDeclaration = (<ts.SignatureDeclarationBase> node).parameters;

        if (parameterDeclaration.length === 0) {
            return;
        }

        const parameters = parameterDeclaration.map((parameter) => {
            const startPosition = parameter.getStart();
            const endPosition = parameter.getEnd();
            const startLine = ts.getLineAndCharacterOfPosition(sourceFile, startPosition).line;
            const endLine = ts.getLineAndCharacterOfPosition(sourceFile, endPosition).line;

            return {
                startPosition,
                endPosition,
                startLine,
                endLine,
                node: parameter
            }
        });

        const parametersNotStartingOnNewLine = parameters.filter((parameter, index) => {
            if (index === 0) {
                return false;
            }

            const previousLine = parameters[index - 1].endLine;

            return previousLine >= parameter.startLine;
        });

        const firstParameter = parameters[0];
        const lastParameter = parameters[parameters.length - 1];
        const allParametersOnSameLine = parameters.every(({ startLine, endLine }) =>
            startLine === firstParameter.startLine && endLine === firstParameter.startLine);
        const allParametersOnSameLineAndAllowed = this.options.allowSingleLine && allParametersOnSameLine;

        const leadingWhiteSpace = sourceFile.text.substring(parameterDeclaration.pos, firstParameter.startPosition);
        const trailingWhiteSpace = sourceFile.text.substring(
            lastParameter.endPosition,
            findIndexOfFirstNonMatchingCharacter(sourceFile.text, lastParameter.endPosition, (c) => /\s/.test(c) || c === ',')
        );
        const firstParameterStartsOnNewLine = containsNewLine(leadingWhiteSpace);
        const lastParameterEndsWithNewLine = containsNewLine(trailingWhiteSpace);

        if (this.options.startOnNewLine && !firstParameterStartsOnNewLine && !allParametersOnSameLineAndAllowed) {
            this.addFailureAtNode(firstParameter.node, Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE)
        }

        if (!allParametersOnSameLineAndAllowed) {
            parametersNotStartingOnNewLine.forEach((parameter) => {
                this.addFailureAtNode(parameter.node, Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE);
            });
        }

        if (this.options.endWithNewLine && !lastParameterEndsWithNewLine && parameters.length > 0 && !allParametersOnSameLineAndAllowed) {
            this.addFailureAtNode(lastParameter.node, Rule.END_PARAMETER_WITH_NEW_LINE_FAILURE_MESSAGE);
        }
    }
}

function findIndexOfFirstNonMatchingCharacter(source: string, start: number, matches: (character: string) => boolean): number {
    let index = start;

    while (index < source.length && matches(source.charAt(index))) {
        index++;
    }

    return index;
}

function containsNewLine(source: string): boolean {
    return source.includes('\n') || source.includes('\r');
}
