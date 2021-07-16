import { BrowserWindow } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import { APP_SCHEME } from "./background-constants";
import { updateMenu } from "./menu-bar";
import { windowPrefs } from "./window-prefs";

const windows = {};

function createWindow(windowName, event) {
  updateMenu();

  if (windowPrefs[windowName].unique && windows[windowName]) {
    windows[windowName].focus();

    if (event) {
      event.reply("window-ready", {
        id: windows[windowName].webContents.id,
        window: windowName
      });
    }

    return;
  }

  let windowOptions = windowPrefs[windowName].options;

  if (typeof windowPrefs[windowName].beforeCreate === "function") {
    const { options } = windowPrefs[windowName].beforeCreate();
    windowOptions = { ...windowOptions, ...options };
  }

  // Create the browser window.
  windows[windowName] = new BrowserWindow({
    ...windowOptions
  });

  if (typeof windowPrefs[windowName].create === "function") {
    windowPrefs[windowName].create(windows[windowName]);
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    windows[windowName].loadURL(
      process.env.WEBPACK_DEV_SERVER_URL + windowPrefs[windowName].devPath
    );
    if (!process.env.IS_TEST) {
      windows[windowName].webContents.openDevTools();
    }
  } else {
    createProtocol(APP_SCHEME);
    // Load the index.html when not in development
    windows[windowName].loadURL(
      `${APP_SCHEME}://./${windowPrefs[windowName].prodPath}`
    );
  }

  windows[windowName].on("closed", () => {
    if (typeof windowPrefs[windowName].destroy === "function") {
      windowPrefs[windowName].destroy();
    }

    windows[windowName] = null;
  });

  if (event) {
    windows[windowName].webContents.once("dom-ready", () => {
      event.reply("window-ready", {
        id: windows[windowName].webContents.id,
        window: windowName
      });
    });
  }
}

export { windows, createWindow };
