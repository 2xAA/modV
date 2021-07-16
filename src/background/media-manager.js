import MediaManager from "../media-manager";
import { updateMenu } from "./menu-bar";
import { setProjectNames } from "./projects";

let mediaManager;

export function getMediaManager() {
  if (!mediaManager) {
    mediaManager = new MediaManager({
      update(message) {
        window.webContents.send("media-manager-update", message);

        setProjectNames(mediaManager.$store.getters["media/projects"]);
        updateMenu();
      },

      pathChanged(message) {
        window.webContents.send("media-manager-path-changed", message);
      }
    });
  }

  return mediaManager;
}
