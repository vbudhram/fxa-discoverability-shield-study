"use strict";

/* global ExtensionAPI */

ChromeUtils.import("resource://gre/modules/Console.jsm");
ChromeUtils.import("resource://gre/modules/Services.jsm");
ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");
ChromeUtils.import("resource://gre/modules/FxAccountsCommon.js");
ChromeUtils.defineModuleGetter(this, "fxAccounts", "resource://gre/modules/FxAccounts.jsm");
ChromeUtils.defineModuleGetter(this, "EnsureFxAccountsWebChannel", "resource://gre/modules/FxAccountsWebChannel.jsm");
ChromeUtils.defineModuleGetter(this, "BrowserWindowTracker", "resource:///modules/BrowserWindowTracker.jsm");

/* eslint-disable no-undef */
const { EventManager } = ExtensionCommon;
const EventEmitter = ExtensionCommon.EventEmitter || ExtensionUtils.EventEmitter;

this.fxa = class extends ExtensionAPI {
  /**
   * Extension Shutdown
   * APIs that allocate any resources (e.g., adding elements to the browser’s user interface,
   * setting up internal event listeners, etc.) must free these resources when the extension
   * for which they are allocated is shut down.
   */
  onShutdown(shutdownReason) {
    console.log("onShutdown", shutdownReason);
    // TODO: remove any active ui
  }

  getAPI(context) {
    const fxaEventEmitter = new EventEmitter();
    return {
      fxa: {
        async getSignedInUser() {
          const data = await fxAccounts.getSignedInUser();
          console.log("api::getSignedInUser", data);
          return data;
        },

        async openSyncPreferences() {
          const win = BrowserWindowTracker.getTopWindow();
          win.openPreferences("paneSync", {entryPoint: "fxa_discoverability"});
        },

        onUpdate: new EventManager(context, "FxAEventEmitter.onUpdate",
          fire => {
            console.log("api::onUpdate");
            const listener = (value) => {
              fire.async(value);
            };
            fxaEventEmitter.on("onUpdate", listener);
            return () => {
              fxaEventEmitter.off("onUpdate", listener);
            };
          },
        ).api(),

        listen() {
          console.log("api::listen");

          EnsureFxAccountsWebChannel();

          const broker = {
            observe(subject, topic, data) {
              console.log("broker::observe:", subject, topic, data);
              switch (topic) {
                case ONLOGIN_NOTIFICATION:
                case ONLOGOUT_NOTIFICATION:
                case ON_PROFILE_CHANGE_NOTIFICATION:
                  console.log("api::onUpdate::emit", topic);
                  return fxaEventEmitter.emit("onUpdate", data);
              }
            },
          };

          Services.obs.addObserver(broker, ONLOGIN_NOTIFICATION);
          Services.obs.addObserver(broker, ONLOGOUT_NOTIFICATION);
          Services.obs.addObserver(broker, ON_PROFILE_CHANGE_NOTIFICATION);
        },
      },
    };
  }
};
