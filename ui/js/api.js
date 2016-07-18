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

/* The Api module is designed to handle all interactions with the server */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Api$" }] */

var Api = (function() {
  'use strict';
  var userPayload;
  var watsonPayload;
  var context;

  var messageEndpoint = '/api/message';

  // Publicly accessible methods defined
  return {
    initConversation: initConversation,
    postConversationMessage: postConversationMessage,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getUserPayload: function() {
      return userPayload;
    },
    setUserPayload: function(payload) {
      userPayload = payload;
    },
    getWatsonPayload: function() {
      return watsonPayload;
    },
    setWatsonPayload: function(payload) {
      watsonPayload = payload;
    }
  };

  // Function used for initializing the conversation with the first message from Watson
  function initConversation() {
    postConversationMessage('');
  }

  // Send a message request to the server
  function postConversationMessage(text) {
    var data = {'input': {'text': text}};
    if (context) {
      data.context = context;
    }
    Api.setUserPayload(data);
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    http.onload = function() {
      if (http.status === 200 && http.responseText) {
        var response = JSON.parse(http.responseText);
        context = response.context;
        Api.setWatsonPayload(response);
      } else {
        Api.setWatsonPayload({output: {text: [
          'The service may be down at the moment; please check' +
          ' <a href="https://status.ng.bluemix.net/" target="_blank">here</a>' +
          ' for the current status. <br> If the service is OK,' +
          ' the app may not be configured correctly,' +
          ' please check workspace id and credentials for typos. <br>' +
          ' If the service is running and the app is configured correctly,' +
          ' try refreshing the page and/or trying a different request.'
        ]}});
        console.error('Server error when trying to reply!');
      }
    };
    http.onerror = function() {
      console.error('Network error trying to send message!');
    };

    http.send(JSON.stringify(data));
  }
}());
