import { app } from "electron";
import { windows } from "./windows";

export function openFile(filePath) {
  app.addRecentDocument(filePath);

  windows["mainWindow"].webContents.send("open-preset", filePath);
}
