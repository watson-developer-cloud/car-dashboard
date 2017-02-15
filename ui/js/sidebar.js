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

/* The Sidebar module handles the display and behavior of the "What can I ask?" sidebar */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Sidebar$" }] */
/* global Common: true */

var Sidebar = (function() {
  'use strict';

  var ids = {
    sidebar: 'sidebar',
    suggestionList: 'suggestion-list'
  };

  var suggestions = [
    'Turn on the headlights',
    'Shut off my lights',
    'Play some music',
    'What’s my ETA?',
    'Show me what’s nearby',
    'Find a gas station',
    'Turn my radio up'
  ];


  // Publicly accessible methods defined
  return {
    init: init,
    toggle: toggle
  };

  // Initialize the Sidebar module
  function init() {
    populateSuggestions();
  }

  // Populate the suggested user messages in the sidebar
  function populateSuggestions() {
    var suggestionList = document.getElementById(ids.suggestionList);
    for (var i = 0; i < suggestions.length; i++) {
      var listItemJson = {
        'tagName': 'li',
        'children': [{
          'tagName': 'button',
          'text': suggestions[i],
          'classNames': ['suggestion-btn'],
          'attributes': [{
            'name': 'onclick',
            'value': 'Sidebar.toggle(); Conversation.sendMessage("' + suggestions[i] + '")'
          }]
        }]
      };
      suggestionList.appendChild(Common.buildDomElement(listItemJson));
    }
  }

  // Toggle whether the sidebar is displayed
  function toggle() {
    Common.toggleClass(document.getElementById(ids.sidebar), 'is-active');
  }
}());
