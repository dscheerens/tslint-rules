import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'parameter-formatting',
        type: 'style',
        description: 'Checks the formatting of function parameters.',
        optionsDescription: '',
        options: '',
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
    // TODO implement this.
    return {
        allowSingleLine: true,
        startOnNewLine: true,
        endWithNewLine: true
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

        const parameters = (<ts.SignatureDeclarationBase> node).parameters.map((parameter) => {
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

        const firstParameterStartLine = parameters[0] && parameters[0].startLine
        const allParametersOnSameLine = parameters.every(({ startLine, endLine }) =>
            startLine === firstParameterStartLine && endLine === firstParameterStartLine);

        const firstParameterStartsOnNewLine = false; // TODO implement.
        const lastParameterEndsWithNewLine = false; // TODO implement.

        if (this.options.startOnNewLine && !firstParameterStartsOnNewLine) {
            // TODO except when all parameters start on the same line and this option is enabled.
            this.addFailureAtNode(parameters[0].node, Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE)
        }

        if (!allParametersOnSameLine || !this.options.allowSingleLine) {
            parametersNotStartingOnNewLine.forEach((parameter) => {
                this.addFailureAtNode(parameter.node, Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE);
            });
        }

        if (this.options.endWithNewLine && lastParameterEndsWithNewLine && parameters.length > 0) {
            this.addFailureAtNode(parameters[parameters.length - 1].node, Rule.END_PARAMETER_WITH_NEW_LINE_FAILURE_MESSAGE);
        }

        console.log('parameterDeclaration.pos    =', parameterDeclaration.pos);
        console.log('parameters[0].startPosition = ', parameters[0].startPosition);
        console.log('parameters[0].startPosition = ', parameters[0].startPosition);

    }
}
