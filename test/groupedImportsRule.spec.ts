import { defineTestCases, source } from './utils';
import { Rule } from '../src/groupedImportsRule';

defineTestCases(Rule.metadata.ruleName, [

    {
        description: 'can check if third party imports are placed before first party imports',
        ruleOptions: [{ firstVsThirdPartyOrder: 'third-party-modules-first' }],
        source: source(
            'import { bla } from "./lorem/ipsum"',
            'import { foo, bar, baz } from "example-module"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: [
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 36,
                width: 46
            }
        ]
    },

    {
        description: 'can check if first party imports are placed after first party imports',
        ruleOptions: [{ firstVsThirdPartyOrder: 'third-party-modules-last' }],
        source: source(
            'import { bla } from "./lorem/ipsum"',
            'import { foo, bar, baz } from "example-module"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: [
            {
                message: Rule.FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 83,
                width: 45
            }
        ]
    },

    {
        description: 'can check if third party imports with the same scope are grouped together (1)',
        ruleOptions: [{ groupByModuleScope: true }],
        source: source(
            'import { bla } from "@lorem/ipsum"',
            'import { foo, bar, baz } from "@example/module"',
            'import { crc32 } from "@lorem/checksum"'
        ),
        failures: [
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE,
                startPosition: 83,
                width: 39
            }
        ]
    },

    {
        description: 'can check if third party imports with the same scope are grouped together (2)',
        ruleOptions: [{ groupByModuleScope: true }],
        source: source(
            'import { bla } from "@lorem/ipsum"',
            'import { foo, bar, baz } from "../../example/module"',
            'import { crc32 } from "@lorem/checksum"'
        ),
        failures: [
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE,
                startPosition: 88,
                width: 39
            }
        ]
    },

    {
        description: 'can check for both options',
        ruleOptions: [{
            groupByModuleScope: true,
            firstVsThirdPartyOrder: 'third-party-modules-first'
        }],
        source: source(
            'import { foo, bar, baz } from "example-module"',
            'import { chef } from "../services/producer"',
            'import { apple, banana, coco } from "@edible/fruits"',
            'import * as vegetables from "@edible/vegetables"',
            'import { fork } from "@utensils/table-stuff"',
            'import "@edible/preservatives/salt"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: [
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 91,
                width: 52
            },
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE,
                startPosition: 238,
                width: 35
            }
        ]
    },

    {
        description: 'does not report any errors works when both options are disabled',
        ruleOptions: [{
            groupByModuleScope: false,
            firstVsThirdPartyOrder: undefined
        }],
        source: source(
            'import { foo, bar, baz } from "example-module"',
            'import { chef } from "../services/producer"',
            'import { apple, banana, coco } from "@edible/fruits"',
            'import * as vegetables from "@edible/vegetables"',
            'import { fork } from "@utensils/table-stuff"',
            'import "@edible/preservatives/salt"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: []
    },

    {
        description: 'by default only requires imports to be grouped by scope',
        source: source(
            'import { foo, bar, baz } from "example-module"',
            'import { chef } from "../services/producer"',
            'import { apple, banana, coco } from "@edible/fruits"',
            'import * as vegetables from "@edible/vegetables"',
            'import { fork } from "@utensils/table-stuff"',
            'import "@edible/preservatives/salt"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: [
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE,
                startPosition: 238,
                width: 35
            }
        ]
    },

    {
        description: 'does not break on grammar errors',
        source: source(
            'import { apple, banana, coco } from "@edible/fruits";',
            'import { bla } from oopsThisIsNotACorrectImportStatement;',
            'import * as vegetables from "@edible/vegetables";',
        ),
        failures: [
        ]
    },

]);
