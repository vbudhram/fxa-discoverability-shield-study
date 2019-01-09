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
    new BrowserActionButtonChoiceFeature(variation);

    // perform something only during first run
    if (isFirstRun) {
      browser.introductionNotificationBar.onIntroductionShown.addListener(
        () => {
          console.log("onIntroductionShown");

          feature.sendTelemetry({
            event: "onIntroductionShown",
          });
        },
      );

      browser.introductionNotificationBar.onIntroductionAccept.addListener(
        () => {
          console.log("onIntroductionAccept");
          feature.sendTelemetry({
            event: "onIntroductionAccept",
          });
        },
      );

      browser.introductionNotificationBar.onIntroductionLeaveStudy.addListener(
        () => {
          console.log("onIntroductionLeaveStudy");
          feature.sendTelemetry({
            event: "onIntroductionLeaveStudy",
          });
          browser.study.endStudy("introduction-leave-study");
        },
      );

      browser.introductionNotificationBar.show(variation.name);
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

  /**
   * Example of a utility function
   *
   * @param variation
   * @returns {string}
   */
  static iconPath(variation) {
    return `icons/${variation.name}.svg`;
  }
}

class BrowserActionButtonChoiceFeature {
  /**
   * - set image, text, click handler (telemetry)
   */
  constructor(variation) {
    console.log(
      "Initializing BrowserActionButtonChoiceFeature:",
      variation.name,
    );
    this.timesClickedInSession = 0;

    // modify BrowserAction (button) ui for this particular {variation}
    console.log("path:", `icons/${variation.name}.svg`);
    // TODO: Running into an error "values is undefined" here
    browser.browserAction.setIcon({ path: "icons/avatar.png" });
    browser.browserAction.setTitle({ title: variation.name });
    browser.browserAction.onClicked.addListener(() => this.handleButtonClick());
    console.log("initialized");

    browser.introductionNotificationBar.getSignedInUser().then((data) => {
      console.log("USER DATA --- " + JSON.stringify(data.profileCache));
    });
  }

  /** handleButtonClick
   *
   * - instrument browserAction button clicks
   * - change label
   */
  handleButtonClick() {
    console.log("handleButtonClick");

    function getBase64FromImageUrl(url) {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");

      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);

        browser.browserAction.setIcon({ imageData: ctx.getImageData(0, 0, 200, 200)});
      };

      img.src = url;
    }

    browser.introductionNotificationBar.getSignedInUser().then((data) => {
      if (data && data.profileCache && data.profileCache.profile.avatar) {
        console.log("avatar: " + data.profileCache.profile.avatar)
        const avatar = data.profileCache.profile.avatar;
        getBase64FromImageUrl(avatar);
      }
      // console.log("USER DATA --- " + JSON.stringify(data));
    });
  }
}

// make an instance of the feature class available to background.js
// construct only. will be configured after setup
window.feature = new Feature();
