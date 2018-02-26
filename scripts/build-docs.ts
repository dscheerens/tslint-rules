import { mkdir, readdir, writeFile } from './util/rx-fs';

import { IRuleMetadata, RuleConstructor } from 'tslint';

import { map, mergeMap, zip } from 'rxjs/operators'

const SOURCE_DIRECTORY = './src';
const DOCUMENTATION_DIRECTORY = './docs';
const RULES_DOCUMENTATION_FILE = 'rules.md';

const RULE_FILE_NAME_PATTERN = /Rule.ts$/;

const rules$ = readdir(SOURCE_DIRECTORY).pipe(
    map((fileNames) => fileNames
        .filter((fileName) => RULE_FILE_NAME_PATTERN.test(fileName))
        .map((fileName) => require.resolve('../' + SOURCE_DIRECTORY + '/' + fileName))
        .map((filePath) => require(filePath).Rule as RuleConstructor)
        .map((rule) => rule.metadata)
    )
);

const ruleDocumentation$ = rules$.pipe(
    map((rules) => rules
        .map((ruleMetadata) => convertRuleMetataToRuleDocumentation(ruleMetadata)).join('\n\n') + '\n'
    )
);

const rulesDocumentationFilePath = DOCUMENTATION_DIRECTORY + '/' + RULES_DOCUMENTATION_FILE;

const createDocsDirectory$ = mkdir(DOCUMENTATION_DIRECTORY);

ruleDocumentation$
    .pipe(
        zip(createDocsDirectory$),
        mergeMap(([ruleDocumentation]) => writeFile(rulesDocumentationFilePath, ruleDocumentation))
    )
    .subscribe({
        next: () => console.log(`Documentation has been succesfully written to ${rulesDocumentationFilePath}`),
        error: console.error
    });

function convertRuleMetataToRuleDocumentation(ruleMetadata: IRuleMetadata): string {

    interface DocumentationSection {
        title: string,
        body?: string;
    }

    function formatOptionExample(example: any): string {
        return '```json\n' + JSON.stringify({ [ruleMetadata.ruleName]: example }, undefined, 4) + '\n```' ;
    }

    const optionExamples: any[] | undefined = ruleMetadata.optionExamples;

    const sections: (string | DocumentationSection)[] = [
        `# \`${ruleMetadata.ruleName}\``,
        { title: 'Description', body: ruleMetadata.description },
        { title: 'Details', body: ruleMetadata.descriptionDetails },
        { title: 'Rationale', body: ruleMetadata.rationale },
        { title: 'Options', body: ruleMetadata.optionsDescription },
        { title: 'Option examples', body: optionExamples && optionExamples.map(formatOptionExample).join('\n\n') },
        { title: 'Options schema', body: '```json\n' + JSON.stringify(ruleMetadata.options, undefined, 4) + '\n```' }
    ];

    return sections
        .filter((section) => typeof section === 'string' || section.body !== undefined)
        .map((section) => typeof section === 'string' ? section : `**${section.title}:**\n\n${section.body!.trim()}`)
        .join('\n\n');
}
