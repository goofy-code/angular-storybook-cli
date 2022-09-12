# Angular Storybook CLI
This cli is a helper for creating an angular component and a storybook story based on templates.

## Config
- Create a folder named `.angular-storybook-cli/template` in you project.
- Add at least one file as template following this rule:
  - filename starts with `component.`
  - filename ends with `.dist`
  - i.e. component.stories.ts.dist

If this folder is not created the default templates from this package (`src/template`) will be used:
- `component.stories.ts.dist`
- `component.stories-mock-data.ts.dist`
- `component.types.ts.dist`

## Usage
Run `angular-storybook-cli create [:path]:componentName :wildcardName`

`:componentName` is the name of the component in angular style (kebab-case). You can also prefix a path (`[:path]`) the same way the angular cli allows.

`:storybookNamespace` is a namespace used to generate the title of the storybook story.

## Replacements

Caution: please be aware that all files will be created relative to `__dirname` and the directory the command is called.

The following replacements will be done on all template files:

- `__PASCAL_CASE_NAME__` will be replaced by the component name (as pascal case)
- `__KEBAB_CASE_NAME__` will be replaced by the component name (as kebab case)
- `__CAMEL_CASE_NAME__` will be replaced by the component name (as camel case)
- `__START_CASE_NAME__` will be replaced by the component name (as start case)
- `__WILDCARD_NAME__` will be replaced by the wildcard name (without modification)

Examples:
- `angular-storybook-cli create my-component 'Modules/My Component'`
- `angular-storybook-cli create shared/my-component 'Modules/My Component'`
- `angular-storybook-cli create shared/my-component 'Modules/Shared/My Component'`
