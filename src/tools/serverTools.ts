import { Server } from "http";
import { server as serverConfig, git } from "./../config.json";
import { getLocalStoredSettings, setLocalStoredSettings } from "./storageTools";
import express from "express";
import fetch from "cross-fetch";
import randomStringGenerator from "randomstring";
import open from "open";
import path from "path";

let randomString = randomStringGenerator.generate({
    length: 8,
    charset: 'alphabetic'
});

const url = `https://github.com/login/oauth/authorize?client_id=${git.CLIENT_ID}&scope=gist&state=${randomString}`;

const app = express();
var server: Server;

app.use("/gui", express.static(path.join(__dirname, './../../public/')));

app.get("/git/callback/", (req, res) => {
    if (req.query.state !== randomString) { res.destroy(); return; }
    req.query.state = "";
    fetch(`https://github.com/login/oauth/access_token?client_id=${git.CLIENT_ID}&client_secret=${git.CLIENT_SECRET}&code=${req.query.code}`,
        {
            method: 'post',
            headers: { accept: "application/json" }
        }).then(gitRes => {
            if (gitRes.status >= 400) { res.status(400); }
            return gitRes.json();
        }).then(async json => {
            let settings = getLocalStoredSettings();
            let user = await getUser(json.access_token);

            settings.gist.access_token = json.access_token;
            settings.gist.username = user;

            setLocalStoredSettings(settings);
            res.sendFile(path.join(__dirname, "./../../public/git.html"));
        });
});

export async function getUser(token: string) {
    let promise = fetch("https://api.github.com/user", {
        method: "GET",
        headers: { authorization: `token ${token}`, accept: "application/json" }
    });

    const res = await promise;
    const json = await res.json();
    return json.login;
}

export function startServer() {
    server = app.listen(serverConfig.port);
}

export function stopServer() {
    server.close();
}

export function openInTab() {
    open(url);
}