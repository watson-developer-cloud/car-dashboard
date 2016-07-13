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

var  ConversationResponse = (function() {
  'use strict';

  var intents = {
    lights_on: 'lights-on',
    wipers_on: 'wipers-on',
    lights_off: 'lights-off',
    wipers_off: 'wipers-off',
    turn_up: 'turn_up',
    turn_down: 'turn_down',
    turn_off: 'turn_off',
    turn_on: 'turn_on',
    greetings: 'greetings',
    locate_amenity: 'locate_amenity',
    capabilities: 'capabilities',
    goodbyes: 'goodbyes',
    off_topic: 'off_topic',
    out_of_scope: 'out_of_scope',
    weather: 'weather',
    traffic_update: 'traffic_update'
  };

  var entities = {
    amenity: {
      name: 'amenity',
      values: {
        gas_station: 'gas station',
        restaurant: 'restaurant',
        restroom: 'restroom'
      }
    },
    appliance: {
      name: 'appliance',
      values: {
        light: 'light',
        air_conditioner: 'ac',
        heater: 'heater',
        music: 'music',
        wiper: 'wiper'
      }
    },
    cuisine: {
      name: 'cuisine',
      values: {
        italian: 'italian',
        mexican: 'mexican',
        thai: 'thai'
      }
    },
    genre: {
      name: 'genre',
      values: {
        jazz: 'jazz',
        pop: 'pop',
        rock: 'rock'
      }
    },
    phone: {
      name: 'phone',
      values: {
        call: 'call',
        text: 'text'
      }
    },
    values: {
      volume: 'volume'
    }
  };

  return {
    intents: intents,
    entities: entities
  };
}());
