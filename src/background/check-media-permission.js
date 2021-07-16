import { dialog, systemPreferences } from "electron";

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

export async function checkMediaPermission() {
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
