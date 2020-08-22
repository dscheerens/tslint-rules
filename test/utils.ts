import * as tslint from 'tslint'
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const SOURCE_FILE_NAME = 'file.ts';

export function lint(source: string, ruleMetadata: tslint.IRuleMetadata, ruleOptions?: any[]): LintFailure[] {

    const tsLintConfig = {
        extends: [],
        rulesDirectory: [],
        rules: new Map<string, Partial<tslint.IOptions>>(),
        jsRules: new Map<string, Partial<tslint.IOptions>>()
    }

    tsLintConfig.rules.set(ruleMetadata.ruleName, { ruleName: ruleMetadata.ruleName, ruleArguments: ruleOptions || [] });

    const linterOptions: tslint.ILinterOptions = {
        rulesDirectory: './src',
        fix: false
    };


    let program: ts.Program | undefined;

    if (ruleMetadata.requiresTypeInfo) {
        const compilerOptions: ts.CompilerOptions = {
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            target: ts.ScriptTarget.ES2016
        };
        const compilerHost = createTestCaseCompilerHost(source, compilerOptions);
        program = ts.createProgram([SOURCE_FILE_NAME], compilerOptions, compilerHost);

        const diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length > 0) {
            fail([
                'Program has the following compile errors:',
                ...diagnostics.map((diagnostic) => ` - ${diagnosticMessage(diagnostic, program!)}`)
            ].join('\n'));
        }
    }

    const linter = new tslint.Linter(linterOptions, program)

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

export function defineTestCases(ruleMetadata: tslint.IRuleMetadata, testCases: TestCase[]): void {
    describe(ruleMetadata.ruleName, () => {

        testCases.forEach((testCase) => defineTestCase(testCase, ruleMetadata));

    });
}

function defineTestCase(testCase: TestCase, ruleMetadata: tslint.IRuleMetadata): void {
    it(testCase.description, () => {
        const failures = lint(testCase.source, ruleMetadata, testCase.ruleOptions);

        const expectedFailures: LintFailure[] = (testCase.failures || []).map((failure) => ({
            ruleName: ruleMetadata.ruleName,
            ...failure
        }));

        expect(failures).toEqual(expectedFailures);
    });
}

export function source(...lines: string[]): string {
    return lines.join('\n');
}

function createTestCaseCompilerHost(source: string, compilerOptions: ts.CompilerOptions): ts.CompilerHost {
    return {
        fileExists: (file) => file === SOURCE_FILE_NAME || fs.existsSync(file),
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => process.cwd(),
        getDefaultLibFileName: () => ts.getDefaultLibFileName(compilerOptions),
        getDirectories: (dir) => fs.readdirSync(dir),
        getNewLine: () => "\n",
        getSourceFile(filenameToGet, target) {
            if (tslint.Utils.denormalizeWinPath(filenameToGet) === SOURCE_FILE_NAME) {
                return ts.createSourceFile(filenameToGet, source, target, true);
            }
            if (path.basename(filenameToGet) === filenameToGet) {
                // resolve path of lib.xxx.d.ts
                filenameToGet = path.join(path.dirname(ts.getDefaultLibFilePath(compilerOptions)), filenameToGet);
            }
            const text = fs.readFileSync(filenameToGet, "utf8");
            return ts.createSourceFile(filenameToGet, text, target, true);
        },
        readFile: (x) => x,
        useCaseSensitiveFileNames: () => true,
        writeFile: () => null,
    };
}

function diagnosticMessage({ file, start, category, messageText }: ts.Diagnostic, program: ts.Program): string {
    let message = ts.DiagnosticCategory[category];
    if (file !== undefined && start !== undefined) {
        const {line, character} = file.getLineAndCharacterOfPosition(start);
        const filePath = path.relative(program.getCurrentDirectory(), file.fileName);
        message += ` at ${filePath}:${line + 1}:${character + 1}:`;
    }
    return `${message} ${ts.flattenDiagnosticMessageText(messageText, '\n')}`;
}
