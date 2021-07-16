import {
  app,
  dialog,
  ipcMain,
  protocol,
  screen,
  shell,
  BrowserWindow,
  Menu,
  systemPreferences
} from "electron";

import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import { autoUpdater } from "electron-updater";

import fs from "fs";
import MediaManager from "./media-manager";
import store from "./media-manager/store";

const isDevelopment = process.env.NODE_ENV !== "production";

async function checkMediaPermission() {
  const { platform } = process;

  let macOSMediaDialogsAccepted = false;
  let hasMediaPermission = false;

  const microphoneAccessStatus = systemPreferences.getMediaAccessStatus(
    "microphone"
  );
  const cameraAccessStatus = systemPreferences.getMediaAccessStatus("camera");

  hasMediaPermission =
    microphoneAccessStatus === "granted" && cameraAccessStatus === "granted";

  if (platform === "darwin" && !hasMediaPermission) {
    macOSMediaDialogsAccepted = await getMediaPermission();
  } else if (platform === "darwin" && hasMediaPermission) {
    macOSMediaDialogsAccepted = true;
  }

  if (
    (platform === "win32" && !hasMediaPermission) ||
    (platform === "darwin" && !macOSMediaDialogsAccepted)
  ) {
    dialog.showMessageBox({
      type: "warning",
      message: "modV does not have access to camera or microphone",
      detail:
        "While modV can still be used without these permissions, some functionality will be limited or broken. Please close modV, update your Security permissions and start modV again."
    });
  }
}

// Asks macOS permission to access media devices
async function getMediaPermission() {
  let accessGrantedMicrophone = false;
  let accessGrantedCamera = false;

  accessGrantedMicrophone = await systemPreferences.askForMediaAccess(
    "microphone"
  );
  accessGrantedCamera = await systemPreferences.askForMediaAccess("camera");

  return accessGrantedMicrophone && accessGrantedCamera;
}

// Keep a global reference of the window objects, if you don't, the windows will
// be closed automatically when the JavaScript objects are garbage collected.
const windows = {};

let mm;

let projectNames = ["default"];
let currentProject = "default";
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

  splashScreen: {
    devPath: "splashScreen",
    prodPath: "splashScreen.html",
    options: {
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      },
      transparent: true,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      fullscreenable: false,
      center: true,
      movable: false,
      backgroundColor: "#00000000",
      hasShadow: false,
      width: 600,
      height: 600
    },
    unique: true,

    async create(window) {
      ipcMain.on("modv-ready", () => {
        window.close();
        windows["mainWindow"].show();
      });
    }
  },

  mainWindow: {
    devPath: "",
    prodPath: "index.html",
    options: {
      show: false,
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
      if (!mm) {
        mm = new MediaManager({
          update(message) {
            window.webContents.send("media-manager-update", message);

            projectNames = mm.$store.getters["media/projects"];
            updateMenu();
          },

          pathChanged(message) {
            window.webContents.send("media-manager-path-changed", message);
          }
        });
      } else {
        mm.update = message => {
          window.webContents.send("media-manager-update", message);

          projectNames = mm.$store.getters["media/projects"];
          updateMenu();
        };

        mm.pathChanged = message => {
          window.webContents.send("media-manager-path-changed", message);
        };
      }

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
        currentProject = message;
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

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      secure: true,
      standard: true
    }
  }
]);

function openFile(filePath) {
  app.addRecentDocument(filePath);

  windows["mainWindow"].webContents.send("open-preset", filePath);
}

app.on("open-file", (event, filePath) => {
  event.preventDefault();

  openFile(filePath);
});

const isMac = process.platform === "darwin";

function setCurrentProject(name) {
  windows["mainWindow"].webContents.send("set-current-project", name);
}

function generateMenuTemplate() {
  return [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" }
            ]
          }
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [
        {
          label: "Open Preset",
          accelerator: "CmdOrCtrl+O",
          async click() {
            const result = await dialog.showOpenDialog(windows["mainWindow"], {
              filters: [{ name: "Presets", extensions: ["json"] }],
              properties: ["openFile"],
              multiSelections: false
            });

            if (!result.canceled) {
              const filePath = result.filePaths[0];
              openFile(filePath);
            }
          }
        },
        ...(isMac
          ? [
              {
                label: "Open Recent",
                role: "recentdocuments",
                submenu: [
                  {
                    label: "Clear Recent",
                    role: "clearrecentdocuments"
                  }
                ]
              }
            ]
          : []),
        { type: "separator" },
        {
          label: "Save Preset",
          accelerator: "CmdOrCtrl+Shift+S",
          async click() {
            const result = await dialog.showSaveDialog(windows["mainWindow"], {
              filters: [{ name: "Presets", extensions: ["json"] }]
            });

            if (result.canceled) {
              return;
            }

            ipcMain.once("preset-data", async (event, presetData) => {
              try {
                await fs.promises.writeFile(result.filePath, presetData);
              } catch (e) {
                dialog.showMessageBox(windows["mainWindow"], {
                  type: "error",
                  message: "Could not save preset to file",
                  detail: e.toString()
                });
              }
            });

            try {
              windows["mainWindow"].webContents.send("generate-preset");
            } catch (e) {
              dialog.showMessageBox(windows["mainWindow"], {
                type: "error",
                message: "Could not generate preset",
                detail: e.toString()
              });
            }
          }
        },

        { type: "separator" },
        {
          label: "Open Media folder",
          async click() {
            if (mm.mediaDirectoryPath) {
              const failed = await shell.openPath(mm.mediaDirectoryPath);

              if (failed) {
                console.error(failed);
              }
            }
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
              }
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }])
      ]
    },
    // { role: 'projectMenu' }
    {
      label: "Project",
      submenu: [
        ...projectNames.map(name => ({
          label: name,
          type: "checkbox",
          checked: currentProject === name,
          click: () => setCurrentProject(name)
        }))
      ]
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        {
          label: "New Output Window",
          click: () => {
            windows["mainWindow"].webContents.send("create-output-window");
          }
        },
        { type: "separator" },
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        {
          label: "Reset layout",
          async click() {
            const { response } = await dialog.showMessageBox(
              windows["mainWindow"],
              {
                type: "question",
                buttons: ["Yes", "No"],
                message: "modV",
                detail: "Are you sure you want to reset the current layout?"
              }
            );

            if (response === 0) {
              windows["mainWindow"].webContents.send("reset-layout");
            }
          }
        }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" }
            ]
          : [{ role: "close" }])
      ]
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://modv.js.org");
          }
        }
      ]
    }
  ];
}

function updateMenu() {
  const menu = Menu.buildFromTemplate(generateMenuTemplate());
  Menu.setApplicationMenu(menu);
}

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
    createProtocol("app");
    // Load the index.html when not in development
    windows[windowName].loadURL(`app://./${windowPrefs[windowName].prodPath}`);
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

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  createWindow("mainWindow");
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  app.commandLine.appendSwitch(
    "disable-backgrounding-occluded-windows",
    "true"
  );

  createWindow("mainWindow");
  createWindow("splashScreen");
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
