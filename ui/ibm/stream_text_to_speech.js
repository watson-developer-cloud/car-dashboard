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
/* global TooltipDialogs: true, Api: true, WatsonSpeech: true */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^TTSModule$" }] */

var  TTSModule = (function() {
  'use strict';
  var audio = null; // Initialize audio to null

  return {
    init: init
  };

  function init() {
    setupTTS();
  }

  // Create a callback when a dialogs are closed to set up speech
  function setupTTS() {
    var oldCloseFunc = TooltipDialogs.close;
    TooltipDialogs.close = function() {
      oldCloseFunc.call(TooltipDialogs);
      textToSpeech();
    };
  }

  // Create a callback when a new Watson response is received to start speech
  function textToSpeech() {
    var currentResponsePayloadSetter = Api.setWatsonPayload;
    Api.setWatsonPayload = function(payload) {
      currentResponsePayloadSetter.call(Api, payload);
      playCurrentAudio(payload.output.text); // Plays audio using output text
    };
  }

  // Stops the audio for an older message and plays audio for current message
  function playCurrentAudio(payloadText) {
    fetch('/api/text-to-speech/token') // Retrieve TTS token
      .then(function(response) {
        return response.text();
      }).then(function(token) {
        // Pauses the audio for older message if there is a more current message
        if (audio !== null && !audio.ended) {
          audio.pause();
        }
        // Takes text, voice, and token and returns speech
        audio = WatsonSpeech.TextToSpeech.synthesize({
          text: payloadText, // Output text/ response
          voice: 'en-US_MichaelVoice', // Default Watson voice
          // voice: 'en-US_AllisonVoice',
          // voice: 'en-US_LisaVoice',
          autoPlay: true, // Automatically plays audio
          token: token
        });
      });
  }
})();

TTSModule.init(); // Runs Text to Speech Module
