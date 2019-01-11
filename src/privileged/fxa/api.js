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
    return {
      fxa: {
        getSignedInUser() {
          console.log("api::getSignedInUser");
          return fxAccounts.getSignedInUser()
            .then((data) => {
              console.log(data);
              return data;
            });
        },

        listen (listener) {
          console.log("api::listen", listener);

          EnsureFxAccountsWebChannel();

          const broker = {
            observe (subject, topic, data) {
              console.log("broker::observe:", subject, topic, data);
              switch (topic) {
                case ONLOGIN_NOTIFICATION:
                  return listener.login(data);

                case ONLOGOUT_NOTIFICATION:
                  return listener.logout(data);

                case ON_PROFILE_CHANGE_NOTIFICATION:
                  return listener.profileChange(data);
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
