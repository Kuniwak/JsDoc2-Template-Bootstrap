// This script licensed under the MIT.
// http://orgachem.mit-license.org

/**
 * @fileoverview A script for Class description page.
 * @author orga.chem.job@gmail.com (Orga Chem)
 */

$(function() {
  var privateMembers = $('.container-jsdoc-private');
  var protectedMembers = $('.container-jsdoc-protected');
  $('.description').click(function() {
    $(this).find('.jsdoc-member-detail').slideToggle();
  });
});
