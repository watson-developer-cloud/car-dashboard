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
/* global WatsonSpeech: true, Api: true Common: true, STTModule: true */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^TTSModule$" }] */

var TTSModule = (function() {
  'use strict';
  var audio = null; // Initialize audio to null
  var button = document.getElementById('output-audio');
  button.value = 'ON'; // TTS is default - not mute
  Common.hide(button); // In case user is using invalid browsers

  return {
    init: init,
    toggle: toggle
  };

  function init() {
    textToSpeech();
    checkBrowsers();
  }

  // Create a callback when a new Watson response is received to start speech
  function textToSpeech() {
    var currentResponsePayloadSetter = Api.setWatsonPayload;
    Api.setWatsonPayload = function(payload) {
      currentResponsePayloadSetter.call(Api, payload);
      playCurrentAudio(payload.output); // Plays audio using output text
    };
  }

  // TTS only works in Chrome and Firefox
  function checkBrowsers() {
    if ((navigator.getUserMedia || navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia || navigator.msGetUserMedia)) {
      Common.show(button); // Show button only if in valid browsers
    }
  }

  // Toggle TTS/Mute button
  function toggle() {
    if (button.value === 'OFF') {
      button.value = 'ON';
      button.setAttribute('class', 'audio-on');
    } else {
      audio.pause(); // Pause the current audio if the toggle is turned OFF
      button.value = 'OFF';
      button.setAttribute('class', 'audio-off');
    }
  }

  // Stops the audio for an older message and plays audio for current message
  function playCurrentAudio(payload) {
    fetch('/api/text-to-speech/token') // Retrieve TTS token
      .then(function(response) {
        return response.text();
      }).then(function(token) {
        if (button.value === 'ON') {
          // Takes text, voice, and token and returns speech
          if (payload.text) { // If payload.text is defined
            // Pauses the audio for older message if there is a more current message
            if (audio !== null && !audio.ended) {
              audio.pause();
            }
            audio = WatsonSpeech.TextToSpeech.synthesize({
              text: payload.text, // Output text/response
              voice: 'en-US_MichaelVoice', // Default Watson voice
              autoPlay: true, // Automatically plays audio
              token: token
            });
            // When the audio stops playing
            audio.onended = function() {
              allowSTT(payload); // Check if user wants to use STT
            };
          } else {
            // Pauses the audio for older message if there is a more current message
            if (audio !== null && !audio.ended) {
              audio.pause();
            }
            // When payload.text is undefined
            allowSTT(payload); // Check if user wants to use STT
          }
        } else { // When TTS is muted
          allowSTT(payload); // Check if user wants to use STT
        }
      });
  }

  // Check ref for 'STT' and allow user to use STT
  function allowSTT(payload) {
    if (payload.ref === 'STT') {
      STTModule.speechToText();
    }
  }
})();
TTSModule.init(); // Runs Text to Speech Module
