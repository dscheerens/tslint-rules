import * as Lint from 'tslint';
import * as ts from 'typescript';
import { isStringLiteral } from 'tsutils';

export class Rule extends Lint.Rules.AbstractRule {

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'grouped-imports',
        type: 'style',
        description: 'Checks whether imports are logically grouped.',
        descriptionDetails: Lint.Utils.dedent`
            When this rule is enabled it will check if import statements are grouped together with respect to the module scope
            (e.g. \`@angular\`).

            The rule can also be configured to check that all third party (libraries) are placed before or after first party (your own code)
            imports.
        `,
        rationale: 'Grouping imports makes it easier to find related imports.',
        optionsDescription: Lint.Utils.dedent`
            An optional argument can be specified to control the value of the following settings:

            * \`groupByModuleScope\` - Checks whether imports from the same module scope are grouped together. _Defaults to \`true\`._
            * \`firstVsThirdPartyOrder\` - Checks whether third party modules are placed before or after first party modules.
              Valid options are either \`third-party-modules-first\` or \`third-party-modules-last\`. _Disabled by default._
        `,
        options: {
            type: 'object',
            properties: {
                groupByModuleScope: {
                    type: 'boolean'
                },
                firstVsThirdPartyOrder: {
                    type: 'string',
                    enum: ['third-party-modules-first', 'third-party-modules-last']
                }
            },
            additionalProperties: false
        },
        optionExamples: [
            [true],
            [true, { firstVsThirdPartyOrder: 'third-party-modules-first' }],
            [true, { groupByModuleScope: false, firstVsThirdPartyOrder: 'third-party-modules-last' }]
        ],
        typescriptOnly: false
    }

    public static FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE = 'First party imports should be placed before third party imports';
    public static THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE = 'Third party imports should be placed before first party imports';
    public static GROUP_SCOPED_MODULE_FAILURE_MESSAGE = 'Module imports for the same scope should be grouped';

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const options = parseOptions(this.ruleArguments);
        return options === undefined ? [] : this.applyWithFunction(sourceFile, walk, options);
    }

}

enum FirstVsThirdPartyOrder {
    THIRD_PARTY_MODULES_FIRST = 'third-party-modules-first',
    THIRD_PARTY_MODULES_LAST = 'third-party-modules-last'
}

interface Options {
    readonly groupByModuleScope: boolean;
    readonly firstVsThirdPartyOrder?: FirstVsThirdPartyOrder;
}

function parseOptions(ruleArguments: any[]): Options | undefined {

    if (!Array.isArray(ruleArguments) || ruleArguments.length > 0 && typeof ruleArguments[0] !== 'object') {
        return undefined;
    }

    const options = ruleArguments[0] || {};

    const groupByModuleScope = (
        typeof options.groupByModuleScope === 'boolean'
        ? options.groupByModuleScope
        : true
    );

    const firstVsThirdPartyOrder = (
        typeof options.firstVsThirdPartyOrder === 'string' && (
            options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_FIRST ||
            options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_LAST
        )
        ? options.firstVsThirdPartyOrder as FirstVsThirdPartyOrder
        : undefined
    );

    return {
        groupByModuleScope,
        firstVsThirdPartyOrder
    };
}

enum ModuleType {
    FIRST_PARTY = 'FIRST_PARTY',
    THIRD_PARTY = 'THIRD_PARTY'
}

function walk(ctx: Lint.WalkContext<Options>): void {

    const imports = ctx.sourceFile.statements
        .filter((statement) => statement.kind === ts.SyntaxKind.ImportDeclaration)
        .map((importDeclaration: ts.ImportDeclaration) => importDeclaration)
        .filter((importDeclaration) => isStringLiteral(importDeclaration.moduleSpecifier))

    let expectedModuleType: ModuleType | undefined;
    let lastUsedModuleScope: string | undefined;
    const moduleScopesUsed = new Set<string>();

    imports.forEach((importDeclaration, index) => {
        const moduleSpecifier = (importDeclaration.moduleSpecifier as ts.StringLiteral).text;

        const moduleType = moduleSpecifier.startsWith('.') ? ModuleType.FIRST_PARTY : ModuleType.THIRD_PARTY;
        const moduleScope = getModuleSpecifierScope(moduleSpecifier);

        const moduleTypeSectionSwitched = expectedModuleType !== moduleType && (
            ctx.options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_FIRST &&
                moduleType === ModuleType.FIRST_PARTY ||
            ctx.options.firstVsThirdPartyOrder === FirstVsThirdPartyOrder.THIRD_PARTY_MODULES_LAST &&
                moduleType === ModuleType.THIRD_PARTY
        );

        if (expectedModuleType === undefined || moduleTypeSectionSwitched) {
            expectedModuleType = moduleType;
        }

        if (ctx.options.firstVsThirdPartyOrder !== undefined && expectedModuleType !== moduleType) {
            ctx.addFailureAtNode(
                importDeclaration,
                moduleType === ModuleType.FIRST_PARTY
                ? Rule.FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE
                : Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE
            );
        }

        if (index > 0 && ctx.options.groupByModuleScope && moduleScope !== undefined &&
            lastUsedModuleScope !== moduleScope && moduleScopesUsed.has(moduleScope)) {
            ctx.addFailureAtNode(importDeclaration, Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE);
        }

        lastUsedModuleScope = moduleScope;

        if (moduleScope !== undefined) {
            moduleScopesUsed.add(moduleScope);
        }
    });
}

function getModuleSpecifierScope(moduleSpecifier: string): string | undefined {
    const scopeMatch = moduleSpecifier.match(/^(@\w+)\//);

    if (scopeMatch === null) {
        return undefined;
    }

    return scopeMatch[1];
}
