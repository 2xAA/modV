import { app, dialog, ipcMain, screen, BrowserWindow } from "electron";

import store from "../media-manager/store";
import { autoUpdater } from "electron-updater";
import { checkMediaPermission } from "./check-media-permission";
import { setProjectNames, setCurrentProject } from "./projects";
import { createWindow } from "./windows";
import { updateMenu } from "./menu-bar";
import { getMediaManager } from "./media-manager";

const isDevelopment = process.env.NODE_ENV !== "production";
let shouldCloseMainWindowAndQuit = false;

const windowPrefs = {
  colorPicker: {
    devPath: "colorPicker",
    prodPath: "colorPicker.html",
    options: {
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      },
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      fullscreenable: false
    },
    unique: true
  },

  mainWindow: {
    devPath: "",
    prodPath: "index.html",
    options: {
      webPreferences: {
        enableRemoteModule: true,
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        nodeIntegrationInWorker: true,
        nativeWindowOpen: true, // window.open return Window object(like in regular browsers), not BrowserWindowProxy
        affinity: "main-window" // main window, and addition windows should work in one process,
      }
    },
    unique: true,

    beforeCreate() {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;

      return {
        options: {
          width,
          height
        }
      };
    },

    async create(window) {
      // Configure child windows to open without a menubar (windows/linux)
      window.webContents.on(
        "new-window",
        (event, url, frameName, disposition, options) => {
          if (frameName === "modal") {
            event.preventDefault();
            event.newGuest = new BrowserWindow(options);

            setTimeout(() => {
              event.newGuest.setMenu(null);
            }, 500);
          }
        }
      );

      const mm = getMediaManager();

      mm.update = message => {
        window.webContents.send("media-manager-update", message);

        setProjectNames(mm.$store.getters["media/projects"]);
        updateMenu();
      };

      mm.pathChanged = message => {
        window.webContents.send("media-manager-path-changed", message);
      };

      ipcMain.on("open-window", (event, message) => {
        createWindow(message, event);
      });

      ipcMain.on("modv-ready", () => {
        mm.start();
      });

      ipcMain.on("modv-destroy", () => {
        mm.reset();
      });

      ipcMain.on("get-media-manager-state", event => {
        event.reply("media-manager-state", store.state.media);
      });

      ipcMain.on("save-file", async (event, message) => {
        try {
          mm.saveFile(message);
        } catch (e) {
          event.reply("save-file", e);
        }

        event.reply("save-file", "saved");
      });

      ipcMain.on("current-project", (event, message) => {
        setCurrentProject(message);
        updateMenu();
      });

      ipcMain.on("input-update", (event, message) => {
        window.webContents.send("input-update", message);
      });

      if (!isDevelopment || process.env.IS_TEST) {
        window.on("close", async e => {
          if (shouldCloseMainWindowAndQuit) {
            app.quit();
            return;
          }

          e.preventDefault();

          const { response } = await dialog.showMessageBox(window, {
            type: "question",
            buttons: ["Yes", "No"],
            message: "modV",
            detail: "Are you sure you want to quit?"
          });

          if (response === 0) {
            shouldCloseMainWindowAndQuit = true;
            window.close();
          }
        });
      }

      // Check for updates
      autoUpdater.checkForUpdatesAndNotify();

      if (process.platform !== "linux") {
        await checkMediaPermission();
      }
    },

    destroy() {
      ipcMain.removeAllListeners("open-window");
      ipcMain.removeAllListeners("modv-ready");
      ipcMain.removeAllListeners("modv-destroy");
      ipcMain.removeAllListeners("get-media-manager-state");
      ipcMain.removeAllListeners("save-file");
      ipcMain.removeAllListeners("current-project");
      ipcMain.removeAllListeners("input-update");
    }
  }
};

export { windowPrefs };
