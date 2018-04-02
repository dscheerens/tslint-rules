# `grouped-imports`

**Description:**

Checks whether imports are logically grouped.

**Details:**

When this rule is enabled it will check if import statements are grouped together with respect to the module scope
(e.g. `@angular`).

The rule can also be configured to check that all third party (libraries) are placed before or after first party (your own code)
imports.

**Rationale:**

Grouping imports makes it easier to find related imports.

**Options:**

An optional argument can be specified to control the value of the following settings:

* `groupByModuleScope` - Checks whether imports from the same module scope are grouped together. _Defaults to `true`._
* `firstVsThirdPartyOrder` - Checks whether third party modules are placed before or after first party modules.
  Valid options are either `third-party-modules-first` or `third-party-modules-last`. _Disabled by default._

**Option examples:**

```json
{
    "grouped-imports": [
        true
    ]
}
```

```json
{
    "grouped-imports": [
        true,
        {
            "firstVsThirdPartyOrder": "third-party-modules-first"
        }
    ]
}
```

```json
{
    "grouped-imports": [
        true,
        {
            "groupByModuleScope": false,
            "firstVsThirdPartyOrder": "third-party-modules-last"
        }
    ]
}
```

**Options schema:**

```json
{
    "type": "object",
    "properties": {
        "groupByModuleScope": {
            "type": "boolean"
        },
        "firstVsThirdPartyOrder": {
            "type": "string",
            "enum": [
                "third-party-modules-first",
                "third-party-modules-last"
            ]
        }
    },
    "additionalProperties": false
}
```

# `parameter-formatting`

**Description:**

Checks whether parameters are each placed on their own line.

**Details:**

When this rule is enabled, TSLint will check that all parameter declarations are all separated by a new line.
By default this rule also allows all parameters to be placed on the same line.
However, this can be disabled through the rule options.

The `parameter-formatting` rule works for every type of language construct that has a parameter declaration, like:
functions, arrow functions, value accessors, shorthand method definitions in object literals, class constructors, etc...

**Rationale:**

Placing each parameter declaration on a separate line makes it easier to see the definition of individual parameters.
This improves the readability of your code.

**Options:**

Optionally an object can be provided to control the following settings:

* `allowSingleLine` - Allow all parameters to be placed on a single line. _Defaults to `true`._
* `startOnNewLine` - Checks whether the first parameter starts on a new line. _Defaults to `false`._
* `endWithNewLine` - Checks whether the last parameter ends with a new line. _Defaults to `false`._

**NOTE**: The `startOnNewLine` and `endWithNewLine` options are ignored when all parameters are placed on the same line and
the `allowSingleLine` option is enabled.

**Option examples:**

```json
{
    "parameter-formatting": [
        true
    ]
}
```

```json
{
    "parameter-formatting": [
        true,
        {
            "allowSingleLine": false
        }
    ]
}
```

```json
{
    "parameter-formatting": [
        true,
        {
            "startOnNewLine": true,
            "endWithNewLine": true
        }
    ]
}
```

**Options schema:**

```json
{
    "type": "object",
    "properties": {
        "allowSingleLine": {
            "type": "boolean"
        },
        "startOnNewLine": {
            "type": "boolean"
        },
        "endWithNewLine": {
            "type": "boolean"
        }
    },
    "additionalProperties": false
}
```

# `strict-indent-size`

**Description:**

Enforce strict indentation sizes.

**Details:**

Checks that all code is indented properly using a fixed indentation size.
When this rule is enabled the indentation length for each line is checked
by verifying that it is a multiple of either 2 or 4 spaces.
The desired indentation size of 2 or 4 spaces can be set through the options of this rule.

Indentation is not checked for lines that are part of a comment or template strings.

**NOTE**: This rule assumes that indentation is done using spaces. It will not check for tabs.

**Rationale:**

Using a strict indentation size results in cleaner looking code.

**Options:**

An optional argument for the indentation size can be specified, which should be either 2 or 4 (default).

**Option examples:**

```json
{
    "strict-indent-size": [
        true
    ]
}
```

```json
{
    "strict-indent-size": [
        true,
        2
    ]
}
```

```json
{
    "strict-indent-size": [
        true,
        4
    ]
}
```

**Options schema:**

```json
{
    "type": "array",
    "items": [
        {
            "type": "number",
            "enum": [
                2,
                4
            ]
        }
    ],
    "minLength": 0,
    "maxLength": 1
}
```
