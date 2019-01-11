/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/

/**  Example Feature module for a Shield Study.
 *
 *  UI:
 *  - during INSTALL only, show a notification bar with 2 buttons:
 *    - "Thanks".  Accepts the study (optional)
 *    - "I don't want this".  Uninstalls the study.
 *
 *  Firefox code:
 *  - Implements the 'introduction' to the 'button choice' study, via notification bar.
 *
 *  Demonstrates `studyUtils` API:
 *
 *  - `telemetry` to instrument "shown", "accept", and "leave-study" events.
 *  - `endStudy` to send a custom study ending.
 *
 **/
class Feature {
  constructor() {}
  /** A Demonstration feature.
   *
   *  - variation: study info about particular client study variation
   *  - reason: string of background.js install/startup/shutdown reason
   *
   */
  configure(studyInfo) {
    const feature = this;
    const { variation, isFirstRun } = studyInfo;

    // Initiate our browser action
    new FxABrowserFeature(variation);

    // perform something only during first run
    if (isFirstRun) {
      // TODO: What should we do on first run
    }
  }

  /* good practice to have the literal 'sending' be wrapped up */
  sendTelemetry(stringStringMap) {
    browser.study.sendTelemetry(stringStringMap);
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   */
  async cleanup() {}
}

class FxABrowserFeature {
  /**
   * - set image, text, click handler (telemetry)
   */
  constructor(variation) {
    console.log(
      "Initializing FxABrowserFeature:",
      variation.name,
    );

    browser.browserAction.setTitle({ title: variation.name });
    this.updateState();

    browser.fxa.listen({
      login: this.updateState.bind(this),
      logout: this.updateState.bind(this),
      profileChange: this.updateState.bind(this),
    });
  }

  async updateState () {
    const user = await browser.fxa.getSignedInUser();

    if (! user) {
      this._isAuthenticated = false;
      this._noAvatar();
      return;
    }

    this._isAuthenticated = true;

    if (! user.profileCache || ! user.profileCache.profile.avatar) {
      this._defaultAvatar(user.email);
      return;
    }

    this._userAvatar(user.profileCache.profile.avatar);
  }

  _noAvatar () {
    if (this._avatar) {
      this._avatar = null;
      browser.browserAction.setIcon({ path: "icons/avatar.png" });
    }
  }

  _defaultAvatar (email) {
    if (this._avatar) {
      this._avatar = null;
      // TODO: Render first character of email instead
      browser.browserAction.setIcon({ path: "icons/avatar.png" });
    }
  }

  _userAvatar (avatar) {
    if (this._avatar === avatar) {
      return;
    }

    this._avatar = avatar;

    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);

      browser.browserAction.setIcon({ imageData: avatar });
    };
    img.src = url;
  }
}

window.feature = new Feature();
