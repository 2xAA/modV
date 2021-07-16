import { windows } from "./windows";

let projectNames = ["default"];
let currentProject = "default";

export function setCurrentProject(name) {
  currentProject = name;
  windows["mainWindow"].webContents.send("set-current-project", name);
}

export function setProjectNames(names = ["default"]) {
  projectNames = names;
}

export { projectNames, currentProject };
