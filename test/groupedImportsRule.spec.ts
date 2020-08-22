import { defineTestCases, source } from './utils';
import { Rule } from '../src/groupedImportsRule';

defineTestCases(Rule.metadata, [

    {
        description: 'can check if third party imports are placed before first party imports',
        ruleOptions: [{ firstVsThirdPartyOrder: 'third-party-modules-first' }],
        source: source(
            'import { bla } from "./lorem/ipsum"',
            'import { foo, bar, baz } from "example-module"',
            'import * as something from "@scoped/module"',
            'import { consumer } from "../models/consumer"'
        ),
        failures: [
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 36,
                width: 46
            },
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 83,
                width: 43
            }
        ]
    },

    {
        description: 'can check if first party imports are placed after first party imports',
        ruleOptions: [{ firstVsThirdPartyOrder: 'third-party-modules-last' }],
        source: source(
            'import { bla } from "./lorem/ipsum"',
            'import { foo, bar, baz } from "example-module"',
            'import { consumer } from "../models/consumer"',
            'import { producer } from "../models/producer"'
        ),
        failures: [
            {
                message: Rule.FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 83,
                width: 45
            },
            {
                message: Rule.FIRST_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 129,
                width: 45
            }
        ]
    },

    {
        description: 'can check if third party imports are grouped by module root',
        ruleOptions: [{ groupThirdPartyModules: true }],
        source: source(
            'import { Component } from "@angular/core"',
            'import { Observable } from "rxjs/Observable"',
            'import { async } from "@angular/core/testing"',
            'import "rxjs/add/operator/map"',
            'import { HttpClient } from "@angular/common/http"',
            'import { foo } from "example"',
            'import { bar } from "example"',
            'import { banana } from "../../examples/fruits"',
            'import { baz } from "example"'
        ),
        failures: [
            {
                message: Rule.GROUP_MODULE_ROOT_FAILURE_MESSAGE('@angular/core'),
                startPosition: 87,
                width: 45
            },
            {
                message: Rule.GROUP_MODULE_ROOT_FAILURE_MESSAGE('rxjs'),
                startPosition: 133,
                width: 30
            },
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE('@angular'),
                startPosition: 164,
                width: 49
            },
            {
                message: Rule.GROUP_MODULE_ROOT_FAILURE_MESSAGE('example'),
                startPosition: 321,
                width: 29
            }
        ]
    },

    {
        description: 'does not report false positives when checking if third party imports are grouped by module root',
        ruleOptions: [{ groupThirdPartyModules: true }],
        source: source(
            'import { Component } from "@angular/core"',
            'import { async } from "@angular/core/testing"',
            'import { HttpClient } from "@angular/common/http"',
            'import { Observable } from "rxjs/Observable"',
            'import "rxjs/add/operator/map"',
            'import { foo } from "example"',
            'import { bar } from "example"',
            'import { baz } from "example"',
            'import { banana } from "../../examples/fruits"'
        ),
        failures: [
        ]
    },

    {
        description: 'can check for both options',
        ruleOptions: [{
            groupThirdPartyModules: true,
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
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 144,
                width: 48
            },
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 193,
                width: 44
            },
            {
                message: Rule.THIRD_PARTY_IMPORT_FIRST_FAILURE_MESSAGE,
                startPosition: 238,
                width: 35
            },
            {
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE('@edible'),
                startPosition: 238,
                width: 35
            }
        ]
    },

    {
        description: 'does not report any errors works when both options are disabled',
        ruleOptions: [{
            groupThirdPartyModules: false,
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
        description: 'by default only requires imports to be grouped by module root',
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
                message: Rule.GROUP_SCOPED_MODULE_FAILURE_MESSAGE('@edible'),
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
