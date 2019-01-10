'use strict';

init();

async function init () {
  const user = await browser.fxa.getSignedInUser();

  let hiddenElement;
  if (user) {
    hiddenElement = document.getElementById('unauthenticated');
    document.getElementById('user-name').innerText = user.email;
  } else {
    hiddenElement = document.getElementById('authenticated');
  }
  hiddenElement.className = `${hiddenElement.className} hidden`;
}
