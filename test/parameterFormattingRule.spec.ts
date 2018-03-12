import { defineTestCases, source } from './utils';
import { Rule } from '../src/parameterFormattingRule';

defineTestCases(Rule.metadata.ruleName, [

    {
        description: 'allows single line parameter declarations by default',
        source: 'function thisIsOk(@Multi() @Optional() foo: string, bar: number): void { }',
        failures: []
    },

    {
        description: 'it requires all parameters to be on their own line when there is at least one that starts on a different line',
        source: source(
            'function thisIsNotOk(',
            '    @Multi() @Optional() foo: string,',
            '    bar: number, baz: boolean',
            '): void { }',
            'function thisIsOk(',
            '    @Multi() @Optional() foo: string,',
            '    bar: number,',
            '    baz: boolean',
            '): void { }'
        ),
        failures: [
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 77,
                width: 12
            }
        ]
    },

    {
        description: 'works for all nodes that have a parameter signature declaration',
        source: source(
            'const badArrowFunction = (a: string, b: string,\n c: string) => a + b + c;',
            'const goodArrowFunction = (a: string, b: string, c: string) => a + b + c;',
            'const badObjectLiteral = { f(x,\ny, z) { return x * y; } };',
            'const goodObjectLiteral = { f(x,\ny,\nz) { return x * y; } };',
            'class ClassWithBadConstructor { constructor(@Foo() a: string, @Bar() b: number,\nc: any) { } }',
            'class ClassWithGoodConstructor { constructor(@Foo() a: string,\n@Bar() b: number,\nc: any) { } }',
            'class ClassWithBadFunction { doIt(@Foo() a: string,\n@Bar() b: number, c: any): void { } }',
            'class ClassWithGoodFunction { doIt(@Foo() a: string, @Bar() b: number, c: any): void { } }'
        ),
        failures: [
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 37,
                width: 9
            },
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 183,
                width: 1
            },
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 329,
                width: 16
            },
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 526,
                width: 6
            }
        ]
    },

    {
        description: 'does not require a leading newline for the first parameter by default',
        source: source(
            'function thisIsOk(@Alpha() foo: string,',
            '                  @Beta() bar: number,',
            '                  @Gamma() bar: boolean): void { }'
        ),
        failures: []
    },

    {
        description: 'checks whether there is a leading newline for the first parameter when the startOnNewLine option is enabled',
        ruleOptions: [{ startOnNewLine: true }],
        source: source(
            'function thisIsNotOk(@Alpha() foo: string,',
            '                     @Beta() bar: number,',
            '                     @Gamma() bar: boolean): void { }'
        ),
        failures: [
            {
                message: Rule.START_PARAMETER_ON_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 21,
                width: 20
            }
        ]
    },

    {
        description: 'does not require a trailing newline for the last parameter by default',
        source: source(
            'function thisIsOk(@Alpha() foo: string,',
            '                  @Beta() bar: number,',
            '                  @Gamma() baz: boolean): void { }'
        ),
        failures: []
    },

    {
        description: 'checks whether there is a trailing newline for the last parameter when the endWithNewLine option is enabled',
        ruleOptions: [{ endWithNewLine: true }],
        source: source(
            'function thisIsNotOk(@Alpha() foo: string,',
            '                     @Beta() bar: number,',
            '                     @Gamma() baz: boolean): void { }'
        ),
        failures: [
            {
                message: Rule.END_PARAMETER_WITH_NEW_LINE_FAILURE_MESSAGE,
                startPosition: 106,
                width: 21
            }
        ]
    },

    {
        description: 'does not check for a leading and trailing newline when all parameters are on the same line',
        ruleOptions: [{ startOnNewLine: true, endWithNewLine: true }],
        source: 'function thisIsOk(@Alpha() foo: string, @Beta() bar: number, @Gamma() baz: boolean): void { }',
        failures: []
    },

    {
        description: 'supports a trailing comma when checking for a trailing newline',
        ruleOptions: [{ startOnNewLine: true, endWithNewLine: true }],
        source: source(
            'function thisIsOk(',
            '    @Multi() @Optional() foo: string,',
            '    bar: number,',
            '    baz: boolean    ,   ',
            '): void { }'
        ),
        failures: []
    }

]);
