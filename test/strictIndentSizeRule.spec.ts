import { defineTestCases, source } from './utils';
import { Rule } from '../src/strictIndentSizeRule';

defineTestCases(Rule.metadata.ruleName, [

    {
        description: 'succeeds for indents valid indents when configured for an indent size of 2',
        ruleOptions: [2],
        source: '  const x = "okidoki";',
        failures: []
    },

    {
        description: 'fails for indents invalid indents when configured for an indent size of 2',
        ruleOptions: [2],
        source: ' const x = "failure" // Boom!',
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(2),
                startPosition: 0,
                width: 1
            }
        ]
    },

    {
        description: 'succeeds for indents valid indents when configured for an indent size of 4',
        ruleOptions: [4],
        source: '        function hi() { }',
        failures: []
    },

    {
        description: 'fails for indents invalid indents when configured for an indent size of 4',
        ruleOptions: [4],
        source: '     function bye() { /* oops */ }',
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 0,
                width: 5
            }
        ]
    },

    {
        description: 'has a default configuration for an indent size of 4',
        source: 'const foo = 1;\n const bar = 2;',
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 15,
                width: 1
            }
        ]
    },

    {
        description: 'supports more than one violation per source',
        source: ' const foo = 1;\n  const bar = 2;',
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 0,
                width: 1
            },
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 16,
                width: 2
            }
        ]
    },

    {
        description: 'ignores indentation of lines within a comment',
        source: source(
            'const foo = 4;',
            '/**',
            ' * This should not give a lint failure',
            ' */',
            'function bar() { }',
            '   const baz = "oops!"; <-- this should!'
        ),
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 81,
                width: 3
            }
        ]
    },

    {
        description: 'ignores indentation of lines within a template literal string (1)',
        source: source(
            'const foo = `1 + 2 = ${',
            ' 1 + 2',
            '}`;',
            'function bar() { }',
            '   const baz = "oops!"; <-- this should!'
        ),
        failures: [
            {
                message: Rule.FAILURE_MESSAGE(4),
                startPosition: 54,
                width: 3
            }
        ]
    },

    {
        description: 'ignores indentation of lines within a template literal string (2)',
        source: source(
            'const optionsDescription = `',
            '  Bla bla bla',
            '`;'
        ),
        failures: []
    }

]);
