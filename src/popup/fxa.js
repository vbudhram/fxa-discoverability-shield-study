"use strict";

const ENTRYPOINT = "fxa_discoverability";
const SIGN_IN_LINK = `https://accounts.firefox.com/signin?action=email&service=sync&context=fx_desktop_v3&entrypoint=${ENTRYPOINT}`;
const CONNECT_ANOTHER_DEVICE = `https://accounts.firefox.com/connect_another_device?service=sync&context=fx_desktop_v3&entrypoint=${ENTRYPOINT}`;
const MANAGE_ACCOUNT = `https://accounts.firefox.com/settings?service=sync&context=fx_desktop_v3&entrypoint=${ENTRYPOINT}`;
const CHANGE_AVATAR = `https://accounts.firefox.com/settings/avatar/change?service=sync&context=fx_desktop_v3&entrypoint=${ENTRYPOINT}`;
const DEVICES_AND_APPS = `https://accounts.firefox.com/settings/clients?service=sync&context=fx_desktop_v3&entrypoint=${ENTRYPOINT}`;

init();

async function init() {
  const user = await browser.fxa.getSignedInUser();

  if (user && user.verified) {
    setupAccountMenu(user);
  }
}

function setupAccountMenu(user) {
  if (user) {
    if (document.getElementById("email")) {
      document.getElementById("email").innerText = user.email;

      if (user.profileCache.profile.avatar) {
        document.getElementById("avatar").style.backgroundImage = `url('${user.profileCache.profile.avatar}')`;
      } else {
        document.getElementById("avatar").style.backgroundImage = `url('../icons/avatar.svg')`;
      }

      if (user.profileCache.profile.displayName) {
        document.getElementById("display-name").innerText = user.profileCache.profile.displayName;
      } else {
        document.getElementById("display-name").innerText = "Syncing to...";
      }
    }
  }
}

function createNewTab(url) {
  // TODO Log some metrics
  browser.tabs.create({ url });
  window.close();
}

function openSyncPreferences() {
  browser.fxa.openSyncPreferences();
}

if (document.getElementById("sign-in-button")) {
  document.getElementById("sign-in-button").addEventListener("click", () => {
    createNewTab(SIGN_IN_LINK);
  });
}

if (document.getElementById("manage-account-button")) {
  document.getElementById("manage-account-button").addEventListener("click", () => {
    createNewTab(MANAGE_ACCOUNT);
  });
}

if (document.getElementById("sync-preferences-button")) {
  document.getElementById("sync-preferences-button").addEventListener("click", () => {
    openSyncPreferences();
  });
}

if (document.getElementById("connect-another-device-button")) {
  document.getElementById("connect-another-device-button").addEventListener("click", () => {
    createNewTab(CONNECT_ANOTHER_DEVICE);
  });
}

if (document.getElementById("avatar")) {
  document.getElementById("avatar").addEventListener("click", () => {
    createNewTab(CHANGE_AVATAR);
  });
}

if (document.getElementById("devices-apps-button")) {
  document.getElementById("devices-apps-button").addEventListener("click", () => {
    createNewTab(DEVICES_AND_APPS);
  });
}

if (document.getElementById("unverified-button")) {
  document.getElementById("unverified-button").addEventListener("click", () => {
    openSyncPreferences();
  });
}
