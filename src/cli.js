const fs = require("fs-extra");
const path = require("path");
const yargs = require("yargs");
const startCase = require("lodash/startCase");
const kebabCase = require("lodash/kebabCase");
const upperFirst = require("lodash/upperFirst");
const camelCase = require("lodash/camelCase");
const shell = require("shelljs");

export async function cli(args) {
    const appPath = process.env.INIT_CWD ? process.env.INIT_CWD : process.cwd();

    const argv = yargs
        .command("create", "Create a component", {
            create: {
                description: "Creates an angular component together with an angular storybook story",
                alias: "c",
                type: "string",
            },
        })
        .demandCommand(1, "You need at least one command")
        .option("standalone", {
            alias: "sa",
            description: "Creates a standalone angular component",
            type: "boolean",
            default: true,
        })
        .option("skip-tests", {
            alias: ["st", "skipTests"],
            description: "Creates an angular component without test files",
            type: "boolean",
            default: true,
        })
        .option("story-title", {
            alias: ["t", "storyTitle"],
            description: "Defines the story title",
            type: "string",
            default: "Story",
        })
        .option("path", {
            alias: "p",
            description: "Defines the path in which the component will be created",
            type: "string",
        })
        .demandOption(["path"])
        .help()
        .alias("help", "h").argv;

    const cli = new Cli(appPath, argv);

    switch (args[0]) {
        case "create":
        case "c": {
            cli.createModule();
            cli.createStory();
            cli.formatCode();

            process.exit(0);

            break;
        }

        default:
            console.error("Command not found");
            process.exit(1);
    }
}

class Cli {
    templateFolder = "";
    appPath = "";
    appPrefix = "src/app";
    argv;

    constructor(appPath, argv) {
        this.appPath = appPath;
        this.argv = argv;
        this.setTemplateFolder();
    }

    setTemplateFolder() {
        const pathList = this.getPath(this.appPath, this.argv.path);
        let templateFolder = path.join(pathList.appRootPath, ".angular-storybook-cli", "template");

        if (!fs.existsSync(templateFolder) || !fs.lstatSync(templateFolder).isDirectory()) {
            templateFolder = path.join(__dirname, "template");
        }

        this.templateFolder = templateFolder;
    }

    createModule() {
        const pathList = this.getPath(this.appPath, this.argv.path);
        const componentPath = path.join(pathList.componentBasePath, this.argv.path).replace(pathList.srcPath, "");

        if (!this.argv.standalone) {
            this.createAngularModule(componentPath);
        }

        this.createAngularComponent(componentPath);
    }

    createAngularModule(componentPath) {
        const result = shell.exec(`npm run ng g m ${componentPath}`);
        if (result.code !== 0) {
            process.exit(result.code);
        }
    }

    createAngularComponent(componentPath) {
        const options = ['--', this.argv.standalone ? "--standalone" : "", this.argv.skipTests ? "--skip-tests" : ""]
            .filter((v) => v !== "")
            .join(" ");

        const result = shell.exec(`npm run ng g c ${componentPath} ${options}`);
        if (result.code !== 0) {
            process.exit(result.code);
        }
    }

    createStory(storyTitle) {
        const pathList = this.getPath(this.appPath, this.argv.path);
        const replacementNames = this.getNamesFromPath(pathList.componentName);

        const templates = fs.readdirSync(this.templateFolder);
        templates.forEach((file) => {
            let template = fs.readFileSync(path.resolve(this.templateFolder, file), "utf8");
            const destinationFilename = file.replace("component", replacementNames.kebabCase).replace(/.dist$/, "");
            const destinationPath = path.join(pathList.componentPath);
            template = template.replace(/__PASCAL_CASE_NAME__/g, replacementNames.pascalCase);
            template = template.replace(/__KEBAB_CASE_NAME__/g, replacementNames.kebabCase);
            template = template.replace(/__CAMEL_CASE_NAME__/g, replacementNames.camelCase);
            template = template.replace(/__START_CASE_NAME__/g, replacementNames.startCase);
            template = template.replace(/__STORY_TITLE__/g, this.argv.storyTitle);

            const filename = path.join(destinationPath, destinationFilename);
            try {
                fs.writeFileSync(filename, template);
                console.info("CREATE " + filename);
            } catch (e) {
                console.info("ABORT Cannot create " + filename);
            }
        });
    }

    getPath() {
        const componentName = this.argv.path.split("/").reverse()[0];
        const basePathTokens = this.appPath.split(this.appPrefix, 2);
        const appRootPath = basePathTokens[0].replace(this.appPrefix, "");
        const basePath = path.join(basePathTokens[0].replace(this.appPrefix, ""), this.appPrefix);
        const componentBasePath = path.join(basePath, basePathTokens[1] ? basePathTokens[1] : "");
        const componentPath = path.join(componentBasePath, this.argv.path);

        return {
            componentName,
            appRootPath,
            srcPath: basePath,
            componentBasePath,
            componentPath,
        };
    }

    getNamesFromPath(componentPath) {
        const nameKebabCase = kebabCase(componentPath.split("/").reverse()[0]);
        const nameStartCase = startCase(nameKebabCase);
        const nameCamelCase = camelCase(nameKebabCase);
        const namePascalCase = upperFirst(nameCamelCase);
        return {
            kebabCase: nameKebabCase,
            startCase: nameStartCase,
            camelCase: nameCamelCase,
            pascalCase: namePascalCase,
        };
    }

    formatCode() {
        shell.exec("npm run prettier -- --loglevel=silent");
    }
}
