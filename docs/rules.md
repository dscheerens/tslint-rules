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

An optional argument for the indentation size can be specified, which should be either 2 or 4.

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
