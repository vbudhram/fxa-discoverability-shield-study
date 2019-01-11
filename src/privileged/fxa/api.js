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

/* eslint-disable no-undef */
const { EventManager } = ExtensionCommon;
const EventEmitter =
  ExtensionCommon.EventEmitter || ExtensionUtils.EventEmitter;

class FxAEventEmitter extends EventEmitter {}

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
    const fxaEventEmitter = new FxAEventEmitter();

    return {
      fxa: {
        getSignedInUser() {
          console.log("getSignedInUser");
          return fxAccounts.getSignedInUser()
            .then((data) => {
              return data;
            });
        },

        ensureWebChannel () {
          console.log("ensureWebChannel")
          EnsureFxAccountsWebChannel();
        },

        onLogin: new EventManager(context, "FxAEventEmitter.onLogin",
          fire => {
            console.log("FxAEventEmitter.onLogin");
            const listener = (value) => {
              fire.async(value);
            };
            fxaEventEmitter.on("onLogin", listener,);
            return () => {
              fxaEventEmitter.off("onLogin", listener,);
            };
          },
        ).api(),

        listen () {
          console.log("listen");
          const broker = {
            observe (subject, topic, data) {
              switch (topic) {
                case ONLOGIN_NOTIFICATION:
                case ONLOGOUT_NOTIFICATION:
                case ON_PROFILE_CHANGE_NOTIFICATION:
                  console.log("observe - " + topic);
                  fxaEventEmitter.emit("onLogin", data);
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

function assertFunction (fn) {
  const type = typeof fn;
  if (type !== 'function') {
    const error = new TypeError(`Expected function, found ${type}`);
    console.error(error);
    throw error;
  }
}
