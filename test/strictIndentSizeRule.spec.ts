import { defineTestCases } from './utils';
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
                endPosition: 1
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
                endPosition: 5
            }
        ]
    }

]);
