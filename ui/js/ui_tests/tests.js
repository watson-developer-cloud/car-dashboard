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
/* global Conversation: true, Animations: true, Panel: true*/
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^tests$" }] */

var tests = (function() {
  var time = 0;

  return {
    run: runTests,
    testPanel: testPanel,
    testDash: testDash,
    testConversation: testConversation
  };

  function runTests() {
    testPanel();
    testDash();
    testConversation();
  }

  function doTest(func, duration, label) {
    var durationMs = duration * 1000;

    setTimeout(function() {
      // TODO remove console logging
      console.log('test: ' + label);
      func();
    }, time);
    time += durationMs + 1000;
  }

  function testPanel() {
    doTest(function() {Panel.playMusic('jazz');}, 5, 'play jazz');
    doTest(function() {Panel.playMusic('pop');}, 5, 'play pop');
    doTest(function() {Panel.playMusic('rock');}, 5, 'play rock');
    doTest(function() {Panel.playMusic('general');}, 5, 'play general');
    doTest(function() {Panel.ac('hi');}, 5, 'ac hi');
    doTest(function() {Panel.ac('lo');}, 5, 'ac lo');
    doTest(function() {Panel.heat('hi');}, 5, 'heat hi');
    doTest(function() {Panel.heat('lo');}, 5, 'heat lo');
    doTest(function() {Panel.mapFoodCuisine();}, 5, 'map food cuisine');
    doTest(function() {Panel.mapGas();}, 5, 'map gas');
    doTest(function() {Panel.mapFoodNumbers();}, 5, 'map food numbers');
  }

  function testDash() {
  // run a series of on/offs on the wipers/lights area
    doTest(function() { Animations.lightsOff();}, 2, 'light off');
    doTest(function() { Animations.lightsOn();}, 2, 'light on');
    doTest(function() { Animations.lightsOff();}, 2, 'light off');
    doTest(function() { Animations.lightsOn();}, 2, 'light on');
    doTest(function() { Animations.wipersOff();}, 3, 'wipers off');
    doTest(function() { Animations.wipersOn('lo');}, 4, 'wipers on lo');
    doTest(function() { Animations.wipersOff();}, 4, 'wipers off');
    doTest(function() { Animations.wipersOn('hi');}, 4, 'wipers on hi');
    doTest(function() { Animations.wipersOff();}, 4, 'wipers off');
    doTest(function() { Animations.toggleRain();}, 2, 'toggle rain');
    doTest(function() { Animations.wipersOn('lo');}, 2, 'wipers on lo');
    doTest(function() { Animations.toggleRain();}, 1, 'toggle rain');
    doTest(function() { Animations.wipersOff();}, 2, 'wipers off');
    doTest(function() { Animations.lightsOff();}, 2, 'lights off');
  }

  function testConversation() {
    var suggestions = [
      'Turn on the headlights',
      'Play some music',
      'jazz',
      'Turn on the AC',
      'When will the rain end?',
      'What’s my ETA?',
      'Find a gas station',
      'Make a phone call',
      'Send a text',
      '1',
      'Turn on the hazard lights',
      'Turn on the radio',
      'pop',
      'turn on the wipers',
      'turn off the wipers'
    ];

    var sendSuggestion = function(index) {
      return function() {
        // TODO remove console logging
        console.log('using suggestion: ' + suggestions[index]);
        Conversation.sendMessage(suggestions[index]);
      };
    };

    for (var i = 0; i < suggestions.length; i++) {
      doTest( sendSuggestion(i), 10, suggestions[i]);
    }
  }
})();
