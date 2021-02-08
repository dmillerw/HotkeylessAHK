import express = require("express");

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

import {RequestHandler} from "express";
import * as path from "path";

const fs = require('fs');

export class HotkeylessAHKServer {

    // Setup server
    private app = express();
    private router = express.Router();

    private configVersion = 0;
    private pendingCommands: Array<string> = [];

    private getTemplates() {
        if (fs.existsSync('templates.json')) {
            const config = fs.readFileSync('templates.json');
            return JSON.parse(config);
        } else {
            return {};
        }
    }

    private getTemplatesFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();
        const keys = Object.keys(config);

        let result = [];
        for (let id in keys) {
            let key = keys[id];
            if (!key.startsWith("_")) {
                result.push(key);
            }
        }

        if (!result.includes("default"))
            result.push("default");

        res.contentType("application/json");
        res.send(JSON.stringify(result));
    }

    private getTemplateFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();
        const name = req.params['name'];

        let template = [];
        if (Object.keys(config).includes(name))
            template = config[name]

        res.contentType("application/json");

        res.send(template);
    }

    private saveTemplateFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();
        const name = req.params['name'];

        config[name] = req.body;

        fs.writeFileSync('templates.json', JSON.stringify(config, null, 2))
        res.send("ok");

        this.configVersion++;
    }

    private deleteTemplateFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();
        const name = req.params['name'];

        delete config[name];

        fs.writeFileSync('templates.json', JSON.stringify(config, null, 2))
        res.send("ok");

        this.configVersion++;
    }

    private getDefaultTemplateFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();

        let name = "default";
        if (Object.keys(config).includes("_default"))
            name = config['_default'];

        res.contentType("application/json");

        res.send(name);
    }

    private setDefaultTemplateFunction: RequestHandler = (req, res) => {
        const config = this.getTemplates();
        config["_default"] = req.body.template;

        fs.writeFileSync('templates.json', JSON.stringify(config, null, 2))
        res.send("ok");

        this.configVersion++;
    }

    private configVersionFunction: RequestHandler = (req, res) => {
        res.send(""+this.configVersion);
    }

    private pollCommandFunction: RequestHandler = (req, res) => {
        const command = this.pendingCommands.join("\\");
        if (command !== "") {
            console.log("Polled: sent " + command);
        }

        res.send(command);
        this.pendingCommands = [];
    }

    private sendFunction: RequestHandler = (req, res) => {
        const command = req.params.command;
        const args = req.params.args;
        const body = command + ((args != undefined) ? ("|" + args) : "");
        this.pendingCommands.push(body)
        res.send("success");
        console.log(`Send command: ${body}`);
    };

    private killFunction: RequestHandler = (req, res) => {
        console.log("Shutting down server...");
        process.exit(0);
    };

    constructor(private serverPort: number) {
    }

    setup() {
        console.log("Starting server...");

        this.router.get("/version", this.configVersionFunction);

        this.router.get("/template", this.getDefaultTemplateFunction);
        this.router.post("/template", jsonParser, this.setDefaultTemplateFunction);

        this.router.get("/templates", this.getTemplatesFunction);

        this.router.get("/template/:name", this.getTemplateFunction);
        this.router.post("/template/:name", jsonParser, this.saveTemplateFunction);
        this.router.delete("/template/:name", this.deleteTemplateFunction);


        this.router.get("/poll/command", this.pollCommandFunction);
        this.router.get("/send/:command", this.sendFunction);
        this.router.get("/send/:command/:args", this.sendFunction);

        this.router.get("/kill", this.killFunction);

        console.log(path.join(__dirname, 'ui'));
        this.app.use('/ui', express.static(path.join(__dirname, '../ui')))

        // Start server
        this.app.use('/', this.router);

        this.app.use((req, res, next) => {
            res.set('Cache-Control', 'no-store')
            next()
        })

        this.app.set('etag', false)

        this.app.listen(this.serverPort);
        console.log(`Server running on port ${this.serverPort}.`);
    }
}
