import * as tslint from 'tslint'

export function lint(source: string, ruleName: string, ruleOptions?: any[]): LintFailure[] {

    const tsLintConfig = {
        extends: [],
        rulesDirectory: [],
        rules: new Map<string, Partial<tslint.IOptions>>(),
        jsRules: new Map<string, Partial<tslint.IOptions>>()
    }

    tsLintConfig.rules.set(ruleName, { ruleName, ruleArguments: ruleOptions || [] });

    const linterOptions: tslint.ILinterOptions = {
        rulesDirectory: './src',
        fix: false
    };

    const linter = new tslint.Linter(linterOptions, undefined)

    linter.lint('file.ts', source, tsLintConfig);

    return extractFailures(linter.getResult());
}

export interface LintFailure {
    ruleName: string,
    message: string,
    startPosition: number;
    width: number;
}

function extractFailures(lintResult: tslint.LintResult): LintFailure[] {
    return lintResult.failures.map((failure) => ({
        ruleName: failure.getRuleName(),
        message: failure.getFailure(),
        startPosition: failure.getStartPosition().getPosition(),
        width: failure.getEndPosition().getPosition() - failure.getStartPosition().getPosition()
    }));
}

export interface TestCase {
    description: string;
    source: string;
    ruleOptions?: any[];
    failures?: TestCaseFailure[]

}

export interface TestCaseFailure {
    message: string,
    startPosition: number;
    width: number;
}

export function defineTestCases(ruleName: string, testCases: TestCase[]): void {
    describe(ruleName, () => {

        testCases.forEach((testCase) => defineTestCase(testCase, ruleName));

    });
}

function defineTestCase(testCase: TestCase, ruleName: string): void {
    it(testCase.description, () => {
        const failures = lint(testCase.source, ruleName, testCase.ruleOptions);

        const expectedFailures: LintFailure[] = (testCase.failures || []).map((failure) => ({ ruleName, ...failure,  }));

        expect(failures).toEqual(expectedFailures);
    });
}

export function source(...lines: string[]): string {
    return lines.join('\n');
}
