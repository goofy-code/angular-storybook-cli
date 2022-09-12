const fs = require('fs-extra');
const path = require('path');
// const _ = require('lodash');
const startCase = require('lodash/startCase');
const kebabCase = require('lodash/kebabCase');
const upperFirst = require('lodash/upperFirst');
const camelCase = require('lodash/camelCase');
const shell = require('shelljs');

export async function cli(args) {
    if (args.length < 2)
    {
        console.error('Missing arguments');
        return;
    }

    const appPath = process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd();

    const componentNamePath = args[1];
    const storybookNamespace = args[2] || '';
    const wildcardName = args[3] || '';

    const cli = new Cli(appPath, componentNamePath);

    switch (args[0])
    {
        case 'create':
        case 'c':
        {
            cli.createModule();
            cli.createStory(storybookNamespace, wildcardName);
            cli.formatCode();

            process.exit(0);

            break;
        }

        default:
            console.error('Command not found');
            process.exit(1);
    }
}

class Cli {
    templateFolder = '';
    appPath = '';
    componentNamePath = '';
    appPrefix = 'src/app';

    constructor(appPath, componentNamePath) {
        this.appPath = appPath;
        this.componentNamePath = componentNamePath;
        this.setTemplateFolder();
    }

    setTemplateFolder() {
        const pathList = this.getPath(this.appPath, this.componentNamePath);
        let templateFolder = path.join(pathList.appRootPath, '.angular-storybook-cli', 'template');

        if (!fs.existsSync(templateFolder) || !fs.lstatSync(templateFolder).isDirectory())
        {
            templateFolder = path.join(__dirname, 'template');
        }

        this.templateFolder = templateFolder;
    }

    createModule() {
        const pathList = this.getPath(this.appPath, this.componentNamePath);
        const componentPath = path.join(pathList.componentBasePath, this.componentNamePath).replace(pathList.srcPath, '');

        let result = shell.exec('npm run ng g m ' + componentPath);
        if (result.code !== 0)
        {
            process.exit(result.code);
        }
        result = shell.exec('npm run ng g c ' + componentPath + ' -- --skip-tests');
        if (result.code !== 0)
        {
            process.exit(result.code);
        }
    }

    createStory(storybookNamespace, wildcardName) {
        const pathList = this.getPath(this.appPath, this.componentNamePath);
        const replacementNames = this.getNamesFromPath(pathList.componentName);

        const templates = fs.readdirSync(this.templateFolder);
        templates.forEach((file) => {
            let template = fs.readFileSync(path.resolve(this.templateFolder, file), 'utf8');
            const destinationFilename = file.replace('component', replacementNames.kebabCase).replace(/.dist$/, '');
            const destinationPath = path.join(pathList.componentPath);
            template = template.replace(/__PASCAL_CASE_NAME__/g, replacementNames.pascalCase);
            template = template.replace(/__KEBAB_CASE_NAME__/g, replacementNames.kebabCase);
            template = template.replace(/__CAMEL_CASE_NAME__/g, replacementNames.camelCase);
            template = template.replace(/__START_CASE_NAME__/g, replacementNames.startCase);
            template = template.replace(/__WILDCARD_NAME__/g, wildcardName);

            const filename = path.join(destinationPath, destinationFilename);
            try
            {
                fs.writeFileSync(filename, template);
                console.info('CREATE ' + filename);
            } catch (e)
            {
                console.info('ABORT Cannot create ' + filename);
            }
        });
    }

    getPath() {
        const componentName = this.componentNamePath.split('/').reverse()[0];
        const basePathTokens = this.appPath.split(this.appPrefix, 2);
        const appRootPath = basePathTokens[0].replace(this.appPrefix, '');
        const basePath = path.join(basePathTokens[0].replace(this.appPrefix, ''), this.appPrefix);
        const componentBasePath = path.join(basePath, basePathTokens[1] ? basePathTokens[1] : '');
        const componentPath = path.join(componentBasePath, this.componentNamePath);

        return {
            componentName,
            appRootPath,
            srcPath: basePath,
            componentBasePath,
            componentPath,
        }
    }

    getNamesFromPath(componentPath) {
        const nameKebabCase = kebabCase(componentPath.split('/').reverse()[0]);
        const nameStartCase = startCase(nameKebabCase);
        const nameCamelCase = camelCase(nameKebabCase);
        const namePascalCase = upperFirst(nameCamelCase);
        return {
            kebabCase: nameKebabCase,
            startCase: nameStartCase,
            camelCase: nameCamelCase,
            pascalCase: namePascalCase,
        }
    }

    formatCode() {
        shell.exec('npm run prettier -- --loglevel=silent');
    }
}
