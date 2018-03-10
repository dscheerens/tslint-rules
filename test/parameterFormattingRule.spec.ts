import { defineTestCases, source } from './utils';
import { Rule } from '../src/parameterFormattingRule';

defineTestCases(Rule.metadata.ruleName, [

    {
        description: 'succeeds for indents valid indents when configured for an indent size of 2',
        ruleOptions: [2],
        source: source(
            'function(',
            '    @Multi()',
            '    @Optional() foo: string,',
            '    bar: number,',
            '): void { }'
        ),
        failures: []
    }

]);
