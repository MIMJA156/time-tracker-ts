import * as vscode from "vscode";
import { normalize, resolve } from "path";
import { existsSync, fstat, PathLike, readFile, readFileSync, writeFileSync } from "fs";
import { file } from "./../config.json";
import settingsJsonModel from "../models/settings.model.json";

var USER_PATH: PathLike = "";
var EXTENSION_PATH: PathLike = "";

var settingsFileName = `settings.${file.suffix}.json`;
var timeFileName = `local-time.${file.suffix}.json`;

export function getLocalStoredTime(): object {
    if (!existsSync(`${USER_PATH}${timeFileName}`)) { writeFileSync(`${USER_PATH}${timeFileName}`, "{}"); }
    return JSON.parse(readFileSync(`${USER_PATH}${timeFileName}`, "utf-8"));
}

export function setLocalStoredTime(newJson: string) {
    writeFileSync(`${USER_PATH}${timeFileName}`, newJson, "utf-8");
}

export function getLocalStoredSettings() {
    if (!existsSync(`${USER_PATH}${settingsFileName}`)) { writeFileSync(`${USER_PATH}${settingsFileName}`, JSON.stringify(settingsJsonModel)); }
    return JSON.parse(readFileSync(`${USER_PATH}${settingsFileName}`, "utf-8"));
}

export function setLocalStoredSettings(newJson: string) {
    writeFileSync(`${USER_PATH}${settingsFileName}`, newJson, "utf-8");
}

export function getUserPath() {
    return USER_PATH;
}

export function getExtensionPath() {
    return EXTENSION_PATH;
}

export function runModelMatching() {
    const files = [`${USER_PATH}${settingsFileName}`];

    files.forEach(file => {
        let fileName = file.replace(USER_PATH.toString(), "").replace(".mimja.json", "");
        let acquiredData = JSON.parse(readFileSync(file, "utf-8"));
        let settingsModel = JSON.parse(readFileSync(resolve(__dirname, `./../models/${fileName}.model.json`), "utf-8"));

        let hasDifference = false;

        let a = (model: { [x: string]: any; }, old: { [x: string]: any; }) => {
            Object.keys(model).forEach(key => {
                if (old[key]) {
                    old[key] = a(model[key], old[key]);
                } else {
                    hasDifference = true;
                    switch (key) {
                        default:
                            old[key] = "";
                            break;
                    }
                }
            });

            return old;
        };

        writeFileSync(file, JSON.stringify(a(settingsModel, acquiredData)));
    });
}

export function setStoragePaths(context: vscode.ExtensionContext) {
    context.globalState.update("_", undefined);
    let isPortable = !!process.env.VSCODE_PORTABLE;

    if (!isPortable) {
        let PATH = resolve(context.globalStorageUri.fsPath, "../../..").concat(normalize("/"));
        let USER_FOLDER = resolve(PATH, "User").concat(normalize("/"));
        let EXTENSION_FOLDER = resolve(vscode.extensions.all.filter(extension => !extension.packageJSON.isBuiltin)[0].extensionPath, "..").concat(normalize("/"));

        USER_PATH = USER_FOLDER;
        EXTENSION_PATH = EXTENSION_FOLDER;
    } else {
        let PATH = process.env.VSCODE_PORTABLE || "";
        let USER_FOLDER = resolve(PATH, "user-data/User").concat(normalize("/"));
        let EXTENSION_FOLDER = resolve(PATH, "extensions").concat(normalize("/"));

        USER_PATH = USER_FOLDER;
        EXTENSION_PATH = EXTENSION_FOLDER;
    }
}