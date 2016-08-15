/*
 * Copyright © 2016 I.B.M. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* The TooltipDialogs module handles the display and behavior of the dialog boxes
 * that are used to introduce new users to the system.
 */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^TooltipDialogs$" }] */
/* global Common: true, Conversation: true, Api: true */

var TooltipDialogs = (function() {
  'use strict';

  var ids = {
    tooltipDialogList: 'tooltip-dialog-list',
    darkOverlay: 'dark-overlay',
    clearOverlay: 'clear-overlay'
  };

  var classes = {
    betweenOverlays: 'between-overlays',
    hide: 'hide'
  };

  // Simplified data structure that is used for dialog box population
  var dialogBoxes = [{
    // id attribute for the dialog box
    dialogId: 'welcome-tooltip-dialog',
    // text of the dialog box
    text: 'Hi! I’m Watson. This is a sample application to see how I work. \n\n'
      + ' For this app, imagine you’re driving and I’m your co-pilot, here to help however I can.',
    // id of an element to display while this dialog box is active
    showId: null
  }, {
    dialogId: 'type-here-tooltip-dialog',
    text: 'You can ask questions here.',
    showId: 'input-wrapper'
  }, {
    dialogId: 'menu-here-tooltip-dialog',
    text: 'And if you don’t know what to ask, click here to see what I am trained to understand.',
    showId: 'help'
  }];

  // Object to keep track of which dialog box should be displayed
  var dialogIndex = (function() {
    var index = 0;
    return {
      get: function() {
        return index;
      },
      set: function(integer) {
        index = integer;
        adjustDialogBoxDisplay();
      },
      increment: function() {
        index++;
      }
    };
  })();

  // Publicly accessible methods defined
  return {
    init: init,
    close: closeDialogs,
    next: nextDialog
  };

  // Initilialize the TooltipDialogs module
  function init() {
    populateDialogList();
  }

  // Populate the tooltip dialog boxes
  function populateDialogList() {
    var dialogList = document.getElementById(ids.tooltipDialogList);
    for (var i = 0; i < dialogBoxes.length; i++) {
      var dialogBox = dialogBoxes[i];
      var listItemJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': dialogBox.dialogId
        }],
        'classNames': (i !== dialogIndex.get()
          ? ['tooltip-dialog-box', classes.hide]
          : ['tooltip-dialog-box']),
        'children': [{
          'tagName': 'img',
          'text': 'close',
          'classNames': ['close', 'tooltip-dialog-close'],
          'attributes': [{
            'name': 'onclick',
            'value': 'TooltipDialogs.close()'
          }, {
            'name': 'src',
            'value': 'images/close-button.png'
          }]
        }, {
          'tagName': 'div',
          'classNames': ['tooltip-dialog-text'],
          'children': [{
            'tagName': 'p',
            'classNames': ['pre-bar'],
            'text': dialogBox.text
          }]
        }, {
          'tagName': 'div',
          'classNames': ['tooltip-dialog-btn-wrapper'],
          'children': [{
            'tagName': 'button',
            'classNames': ['tooltip-dialog-btn'],
            'attributes': [{
              'name': 'onclick',
              'value': 'TooltipDialogs.next()'
            }],
            'text': ((i <= dialogBoxes.length) ? 'Next' : 'Done')
          }]
        }]
      };
      dialogList.appendChild(Common.buildDomElement(listItemJson));
    }
  }

  // Move to the next dialog box in the sequence
  function nextDialog() {
    var oldShow = document.getElementById(dialogBoxes[dialogIndex.get()].showId);
    if (oldShow) {
      Common.removeClass(oldShow, classes.betweenOverlays);
    }
    dialogIndex.increment();
    adjustDialogBoxDisplay();
    if (dialogIndex.get() >= dialogBoxes.length) {
      closeDialogs();
    } else {
      var newShow = document.getElementById(dialogBoxes[dialogIndex.get()].showId);
      if (newShow) {
        Common.addClass(newShow, classes.betweenOverlays);
      }
    }
  }

  // Close out of the dialog box sequence
  function closeDialogs() {
    dialogIndex.set(-1);
    for (var i = 0; i < dialogBoxes.length; i++) {
      var toReset = document.getElementById(dialogBoxes[i].showId);
      if (toReset) {
        Common.removeClass(toReset, classes.betweenOverlays);
      }
    }
    Api.initConversation(); // Load initial Watson greeting after overlays are gone.
    hideOverlays();
    Conversation.focusInput();
  }

  // Adjust the dialog box that is currently displayed (and hide the others)
  function adjustDialogBoxDisplay() {
    for (var i = 0; i < dialogBoxes.length; i++) {
      var currentDialog = document.getElementById(dialogBoxes[i].dialogId);
      if (i === dialogIndex.get()) {
        Common.removeClass(currentDialog, classes.hide);
      } else {
        Common.addClass(currentDialog, classes.hide);
      }
    }
  }

  // Hide the dark semi-transparent overlays
  function hideOverlays() {
    var darkOverlay = document.getElementById(ids.darkOverlay);
    var clearOverlay = document.getElementById(ids.clearOverlay);
    Common.addClass(darkOverlay, classes.hide);
    Common.addClass(clearOverlay, classes.hide);
  }
}());
