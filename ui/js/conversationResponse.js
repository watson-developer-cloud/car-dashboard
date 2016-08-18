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

/* The Intents module contains a list of the possible intents that might be returned by the API */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^ConversationResponse$" }] */
/* global Animations: true, Api: true, Panel: true */

var ConversationResponse = (function() {
  'use strict';
  var responseFunctions;

  return {
    init: init,
    responseHandler: responseHandler
  };

  function init() {
    setupResponseFunctions();
    setupResponseHandling();
  }

  function setupResponseFunctions() {
    responseFunctions = {
      turn_on: {
        appliance: {
          AC: function() { Panel.ac('lo'); },
          fan: function() { Panel.ac('lo'); },
          heater: function() { Panel.heat('lo'); },
          lights: function() { Animations.lightsOn(); },
          wipers: function() { Animations.wipersOn('lo'); }
        },
        genre: function(value) { Panel.playMusic(value); }
      },
      turn_off: {
        appliance: {
          lights: function() { Animations.lightsOff(); },
          wipers: function() { Animations.wipersOff(); }
        }
      },
      turn_up: {
        appliance: {
          AC: function() { Panel.ac('hi'); },
          fan: function() { Panel.ac('hi'); },
          heater: function() { Panel.heat('hi'); },
          music: function() { Panel.playMusic('general'); },
          wipers: function() { Animations.wipersOn('hi'); }
        },
        genre: function(value) { Panel.playMusic(value); }
      },
      turn_down: {
        appliance: {
          AC: function() { Panel.ac('lo'); },
          fan: function() { Panel.ac('lo'); },
          heater: function() { Panel.heat('lo'); },
          music: function() { Panel.playMusic('general'); },
          wipers: function() { Animations.wipersOn('lo'); }
        },
        genre: function(value) { Panel.playMusic(value); }
      },
      locate_amenity: {
        amenity: {
          gas: function() { Panel.mapGas(); },
          restaurant: function() { Panel.mapFoodCuisine(); },
          restroom: function() { Panel.mapRestrooms(); }
        },
        option: function(choice) { Panel.mapNavigation(choice); },
        cuisine: function() { Panel.mapFoodNumbers(); },
        func: function() { Panel.mapGeneral(); }
      },
      off_topic: {
        amenity: {
          gas: function() { Panel.mapGas(); },
          restaurant: function() { Panel.mapFoodCuisine(); },
          restroom: function() { Panel.mapRestrooms(); }
        },
        cuisine: function() { Panel.mapFoodNumbers(); },
        genre: function(value) { Panel.playMusic(value); }
      }
    };
  }

  // Create a callback when a new Watson response is received to handle Watson's response
  function setupResponseHandling() {
    var currentResponsePayloadSetter = Api.setWatsonPayload;
    Api.setWatsonPayload = function(payload) {
      currentResponsePayloadSetter.call(Api, payload);
      responseHandler(payload);
    };
  }

  // Called when a Watson response is received, manages the behavior of the app based
  // on the user intent that was determined by Watson
  function responseHandler(data) {
    if (data && data.intents && data.entities && !data.output.error) {
      // Check if message is handled by retrieve and rank and there is no message set
      if (data.context.callRetrieveAndRank && !data.output.text) {
        // TODO add EIR link
        data.output.text = ['I am not able to answer that. You can try asking the'
          + ' <a href="https://conversation-enhanced.mybluemix.net/" target="_blank">Enhanced Information Retrieval App</a>'];
        Api.setWatsonPayload(data);
        return;
      }

      var primaryIntent = data.intents[0];
      if (primaryIntent) {
        handleBasicCase(primaryIntent, data.entities);
      }
    }
  }

  // Handles the case where there is valid intent and entities
  function handleBasicCase(primaryIntent, entities) {
    var genreFound = null;
    // If multiple entities appear (with the exception of music),
    // do not perform any actions
    if (entities.length > 1) {
      var invalidMultipleEntities = true;
      switch (primaryIntent.intent) {
      case 'turn_on':
      case 'turn_off':
      case 'turn_up':
      case 'turn_down':
        entities.forEach(function(currentEntity) {
          var entityType = currentEntity.entity;
          if (entityType === 'genre') {
            invalidMultipleEntities = false;
            genreFound = currentEntity;
          }
        });
        break;
      default:
        invalidMultipleEntities = false;
        break;
      }
    }

    // Otherwise, just take the first one (or the genre if one was found) and
    // look for the correct function to run
    if  (!invalidMultipleEntities) {
      var primaryEntity = (genreFound || entities[0]);
      callResponseFunction(primaryIntent, primaryEntity);
    }
  }

  // Calls the appropriate response function based on the given intent and entity returned by Watson
  function callResponseFunction(primaryIntent, primaryEntity) {
    var intent = responseFunctions[primaryIntent.intent];
    if (typeof intent === 'function') {
      intent(primaryEntity.entity, primaryEntity.value);
    } else if (intent) {
      if (primaryEntity) {
        var entityType = intent[primaryEntity.entity];
        if (typeof entityType === 'function') {
          entityType(primaryEntity.value);
        } else if (entityType) {
          var entityValue = entityType[primaryEntity.value];
          if (typeof entityValue === 'function') {
            entityValue();
          } else if (entityValue && typeof entityValue.func === 'function') {
            entityValue.func();
          } else if (typeof entityType.func === 'function') {
            entityType.func();
          }
        }
      } else if (typeof intent.func === 'function') {
        intent.func();
      }
    }
  }
}());
