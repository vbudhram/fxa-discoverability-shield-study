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
    console.log("Initializing FxABrowserFeature:", variation.name);

    browser.browserAction.setTitle({ title: variation.name });

    browser.fxa.listen();

    this.updateState();

    browser.fxa.onUpdate.addListener(() => {
      this.updateState();
    });
  }

  async updateState() {

    // The stored sessionToken will always be the source of truth when checking
    // account state.
    const user = await browser.fxa.getSignedInUser();
    if (!user) {
      this._noUser();
    }

    if (user && !user.verified) {
      this._unverifiedUser();
    }

    if (user && user.verified) {
      this._verifiedUser(user);
    }
  }

  _noUser() {
    this._defaultAvatar();
    browser.browserAction.setIcon({ path: "icons/avatar.svg" });
    browser.browserAction.setPopup({
      popup: "popup/sign_in/sign_in.html",
    });
  }

  _unverifiedUser() {
    this._defaultAvatar();
    browser.browserAction.setIcon({ path: "icons/avatar_confirm.svg" });
    browser.browserAction.setPopup({
      popup: "popup/unverified/unverified.html",
    });
  }

  _verifiedUser(user) {
    if (!user.profileCache || !user.profileCache.profile.avatar) {
      this._defaultAvatar(user.email);
    } else {
      this._userAvatar(user.profileCache.profile.avatar);
    }

    browser.browserAction.setPopup({
      popup: "popup/menu/menu.html",
    });
  }

  _defaultAvatar() {
    if (this._avatar) {
      this._avatar = null;
      // TODO: Render first character of email instead
      browser.browserAction.setIcon({ path: "icons/avatar.svg" });
    }
  }

  _userAvatar(url) {
    console.log("FxABrowserFeature::_userAvatar");
    if (this._avatar && this._avatarUrl === url) {
      return;
    }

    this._avatarUrl = url;

    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = function() {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;

      const ctx = canvas.getContext("2d");

      // Create a circular avatar
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, 2 * Math.PI);
      ctx.clip();

      ctx.drawImage(this, 0, 0);

      this._avatar = ctx.getImageData(0, 0, 200, 200);

      browser.browserAction.setIcon({ imageData: this._avatar });
    }
    img.src = url;
  }
}

window.feature = new Feature();
