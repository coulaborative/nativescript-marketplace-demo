import * as firebase from "nativescript-plugin-firebase";
import * as application from "application";
import * as utils from "utils/utils";
import * as dialogs from "ui/dialogs";
import {isAndroid, isIOS} from "platform";
import * as settings from "application-settings";

const enabled = false;

let lastHandledData = null;
let firstIntro = settings.getBoolean("first-intro", true);

export function onAppInit() {
    if (!enabled) {
        return;
    }
    if (isAndroid) {
        init();
    } else if (isIOS) {
        if (firstIntro) {
            console.log("First intro, wait for the intro to be played before asking for push notifications...");
        } else {
            console.log("Ask for push notifications on launch!");
            initOnLaunch();
        }
    }
}

export function onAfterIntro() {
    if (!enabled) {
        return;
    }
    if (firstIntro) {
        console.log("Intro played, persist that the app allready ran once and aske for push notifications...");
        settings.setBoolean("first-intro", false);
        init();
    }
}

function initOnLaunch() {
    application.on("launch", init);
}

function init() {
    firebase.init({
        onMessageReceivedCallback: function(message) {
            console.log("Got push notification: " + JSON.stringify(message));
            let url = (<any>message).url;
            if (url) {
                if (message.foreground) {
                    dialogs.confirm({
                        title: (<any>message).inAppTitle,
                        message: (<any>message).inAppBody,
                        okButtonText: "Open",
                        cancelButtonText: "Close"
                    }).then(result => {
                        if (result) {
                            utils.openUrl(url);
                        }
                    });
                } else {
                    if (lastHandledData != url) {
                        utils.openUrl(url);
                        lastHandledData = url;
                    }
                }
            }
        },
        onPushTokenReceivedCallback: function(token) {
            console.log("Got push token: " + token);
        }
    }).then(i => {
        console.log("Firebase init done! " + i);
    }).catch(e => {
        console.log("Firebase init failed: " + e)
    });
}
