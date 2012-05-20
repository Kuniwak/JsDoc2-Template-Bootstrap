// This script licensed under the MIT.
// http://orgachem.mit-license.org

/**
 * @fileoverview A script for accordion effects.
 * @author orga.chem.job@gmail.com (Orga Chem)
 */

$(function() {
  var isStorageAvailable = function() { return !!window.localStorage; };
  var isPrivateVisible = function() {
    return isStorageAvailable() ? !!localStorage.getItem('JSDOC::PRIVATE_VISIBLE') : true;
  };
  var setPrivateVisibility = function(visible) {
    if (isStorageAvailable()) localStorage.setItem('JSDOC::PRIVATE_VISIBLE', !!visible);
  };
  var isProtectedVisible = function() {
    return isStorageAvailable() ? !!localStorage.getItem('JSDOC::PROTECTED_VISIBLE') : true;
  };
  var setProtectedVisibility = function(visible) {
    if (isStorageAvailable()) localStorage.setItem('JSDOC::PROTECTED_VISIBLE', !!visible);
  };

  var privateButton = $('#jsdoc-visibility-private');
  var protectedButton = $('#jsdoc-visibility-protected');

  var applyConfigs = function() {
    if (isPrivateVisible()) {
      privateButton.attr('checked', 'checked');
    } else {
      privateButton.removeAttr('checked');
    }
    if (isProtectedVisible()) {
      protectedButton.attr('checked', 'checked');
    } else {
      protectedButton.removeAttr('checked');
    }
  };

  applyConfigs();
  window.addEventListener('storage', applyConfigs);
  privateButton.click(function() {
    setPrivateVisibility($(this).attr('checked'));
  });
  protectedButton.click(function() {
    setProtectedVisibility($(this).attr('checked'));
  });

  $(window).unload(function() {
    buttons = protectedButton = privateButton = null;
  });
});
