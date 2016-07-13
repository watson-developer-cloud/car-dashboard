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

/* The Animations module handles all animated parts of the app (in the SVG) */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Animations$" }] */
/* global Api: true, Common: true, Snap: true, mina: true, Panel: true, ConversationResponse:true, Promise: true*/

var Animations = (function() {
  'use strict';

  var snapSvgCanvas;
  var state;

  var classes = {
    drop: 'drop',

    rain: 'rain',
    reduceRain: 'reduce_rain',

    darkGrayCloud: 'darkGrayCloud',
    lightGrayCloud: 'lightGrayCloud',
    lightCloud: 'lightCloud',
    darkCloud: 'darkCloud',

    darkSky: 'darkSky'
  };
  var ids = {
    dottedLine: 'dotted_line',
    stripes1: 'stripes1',
    stripes2: 'stripes2',
    sun: 'sun',
    skyHue: 'skyHue',
    upperDrops: 'upperDrops',
    lowerDrops: 'lowerDrops'
  };
  var idSelectors = {
    svgCanvas: '#svg_canvas',
    speedometer: '#speedometer',
    revmeter: '#revmeter',
    rightNeedle: '#right_needle',
    leftNeedle: '#left_needle',
    tree1: '#tree1',
    tree2: '#tree2',
    rightWiper: '#right_wiper',
    leftWiper: '#left_wiper',
    headlights: '#headlights',
    upperDrops: '#upperDrops',
    lowerDrops: '#lowerDrops',

    cloud1: '#cloud1',
    cloud2: '#cloud2',
    cloud3: '#cloud3',
    cloud4: '#cloud4',
    cloud5: '#cloud5',
    cloud6: '#cloud6'
  };

  // Publicly accessible methods defined
  return {
    init: init,
    toggleRain: toggleRain,
    lightsOn: lightsOn,
    lightsOff: lightsOff,
    wipersOn: wipersOn,
    wipersOff: wipersOff,
    animate_trees: animateTrees,
    initiate_raining: initiateRaining,
    animate_needles: animateNeedles,
    animate_road: animateRoad
  };

  // Initialize the animations
  function init() {
    initiateIntentHandling();

    state = {
      svg_width: 1154,
      svg_height: 704,
      wiping: false,
      num_drops: 200,
      raining: false
    };

    // eslint-disable-next-line new-cap
    snapSvgCanvas = Snap(idSelectors.svgCanvas);

    // Loads sky, then background, then dashboard, using callbacks
    return new Promise(function(resolve) {
      loadSky().then(resolve);
    });
  }

  // Create a callback when a new Watson response is received to handle the determined intent
  function initiateIntentHandling() {
    var currentResponsePayloadSetter = Api.setWatsonPayload;
    Api.setWatsonPayload = function(payload) {
      currentResponsePayloadSetter.call(Api, payload);
      intentHandler(payload);
    };
  }

  // Load the dashboard and wipers
  function loadDashboard() {
    var dash = snapSvgCanvas.group();
    return new Promise(function(resolve) {
      Snap.load('./images/dashboard.svg', function(svgFragment) {
        svgFragment.select('title').remove();   // Remove the tooltip from the svg
        dash.append(svgFragment);

        animateNeedles();
        var rightWiper = Snap.select(idSelectors.rightWiper);
        var leftWiper = Snap.select(idSelectors.leftWiper);

        rightWiper.bbox = rightWiper.getBBox();
        leftWiper.bbox = leftWiper.getBBox();

        state.wipers = {
          right: rightWiper,
          left: leftWiper
        };

        Panel.init();
        resolve();
      });
    });
  }

  // Load the background and set the rain to start in 1 minute, lasting for 30 seconds
  function loadBackground() {
    var background = snapSvgCanvas.group();
    return new Promise(function(resolve) {
      Snap.load('./images/background.svg', function(svgFragment) {
        svgFragment.select('title').remove();   // Remove the tooltip from the svg
        background.append(svgFragment);
        animateRoad();
        animateTrees();
        animateClouds();

        initiateRaining();

        // Setup a loop to call toggle rain every 30s
        (function rainLoop() {
          setTimeout(function() {
            toggleRain();
            setTimeout(function() {
              toggleRain();
              rainLoop();
            }, 60000);
          }, 30000);
        })();

        loadDashboard().then(resolve);
      });
    });
  }

  // Loads the sky
  function loadSky() {
    var sky = snapSvgCanvas.group();
    return new Promise(function(resolve) {
      Snap.load('./images/sky.svg', function(svgFragment) {
        svgFragment.select('title').remove();   // Remove the tooltip from the svg
        sky.append(svgFragment);
        loadBackground().then(resolve);
      });
    });
  }

  // Animates the movement of the road
  function animateRoad() {
    Common.hide(document.getElementById(ids.dottedLine));
    Common.hide(document.getElementById(ids.stripes1));
    setInterval(function() {
      Common.toggle(document.getElementById(ids.stripes1));
      Common.toggle(document.getElementById(ids.stripes2));
    },
    120);
  }

  // Animate movement of clouds by dx
  function moveCloud(cloud, duration, dx) {
    cloud.attr({opacity: 0, transform: 't' + [0, 0]});

    // In 1 tenth of the duration bring opacity to 1 then in the rest move the cloud
    cloud.animate({opacity: 1}, 0.1 * duration, mina.linear, function() {
      cloud.animate({opacity: 0.5, transform: 't' + [dx, 0]}, 0.9 * duration, mina.linear, function() {
        moveCloud(cloud, duration, dx);
      });
    });
  }

  // Start the clouds animations
  function animateClouds() {
    moveCloud(Snap.select('#cloud1'), 50000, -4500);
    moveCloud(Snap.select('#cloud2'), 90000, -4500);
    moveCloud(Snap.select('#cloud3'), 23000, 2000);
    moveCloud(Snap.select('#cloud4'), 90000, -4500);
    moveCloud(Snap.select('#cloud5'), 21000, 2000);
    moveCloud(Snap.select('#cloud6'), 20000, 2000);
  }


  // Animates the trees to pass by on the right and left
  function animateTrees() {
    // randomly move trees to left or right side of road
    var trees = [idSelectors.tree1, idSelectors.tree2];

    // select a random tree to work with
    var t = Snap.select(trees[Math.floor(Math.random() * trees.length)]);
    t.transform('t0,0');
    t.attr( {display: ''});

    var translate = [-130, 10];

    // Toss a coin to decide direction
    if (Math.random() > 0.5 ) {
      translate = [120, 10];
    }

    // Start transforming the trees slowly then faster as the car get closer
    mina.easeInExpo = function(n) {
      return ( n === 0 ) ? 0 : Math.pow( 2, 10 * ( n - 1 ) );
    };

    // Final transform should be scaled 20x and translated
    var endScene = 's20,20,' + 't' + translate;

    t.animate({transform: endScene}, 4500, mina.easeInExpo, function() {
      t.attr( {display: 'none'});
      animateTrees();
    });
  }

  // Create rain objects and then hide the objects (waiting for rain to be toggled on)
  function initiateRaining() {
    makeRain();
    Common.listForEach(document.getElementsByClassName(classes.drop), Common.hide);
  }

  // Create the raindrop objects
  function makeRain() {
    // Create 2 groups of rain drops. One for the top half and one for the bottom.
    // Each animated slight differently to create illusion of continiuty
    var upperDrops = snapSvgCanvas.group();
    var lowerDrops = snapSvgCanvas.group();
    addDropsToGroup(state.num_drops / 2, upperDrops);
    addDropsToGroup(state.num_drops / 2, lowerDrops);

    upperDrops.node.id = ids.upperDrops;
    lowerDrops.node.id = ids.lowerDrops;
  }

  // Draw randomly positioned drops and add them to the svg group
  function addDropsToGroup(count, group) {
    for (var i =  0; i < count; i++) {
      var x = Math.random() * state.svg_width;
      var y = Math.random() * state.svg_height;
      group.append(newDropline(x, y, classes.drop));
    }
  }

  // Function to help in the creation of raindrop objects
  function newDropline(x, y, cls) {
    // randomize sizes of drops
    var scale = 0.1 + 0.3 * Math.random();

    // create the svg path string for drawing the drops
    var dropPath =
      'm,' + [x, y] +
      ',l,' + [0, 0] +
      ' ,c,' + [-3.4105934 * scale, -3.41062 * scale, -3.013645 * scale, -9.00921 * scale, 3.810723 * scale, -14.7348 * scale] +
      ',l,' + [68.031 * scale, -57.107 * scale] +
      ',l,' + [-57.107 * scale, 68.034 * scale] +
      ',c,' + [-5.725604 * scale, 6.8212 * scale, -11.324178 * scale, 7.22133 * scale, -14.734769 * scale, 3.80759 * scale] +
      ',z';

    var rel = Snap.path.toRelative(dropPath);
    var drop = snapSvgCanvas.path(rel);
    drop.attr({
      class: cls,
      fill: '#ceeaf4'   // give drops the blue color
    });
    return drop;
  }

  // Make the rain start or stop
  function toggleRain() {
    // darken the sky
    toggleDarkenSky();

    var topTransform = [0, -700];
    var fallDistance = 1000;
    var upperDrops = Snap.select(idSelectors.upperDrops);
    var lowerDrops = Snap.select(idSelectors.lowerDrops);

    // Move drops to top of the screen
    upperDrops.transform('t' + topTransform);
    lowerDrops.transform('t' + topTransform);

    // Move the group of upper drops downwards
    function animateUpper() {
        // Reset to top of screen
      upperDrops.transform('t' + topTransform);

        // Animate falling movement to bottom of screen
      upperDrops.animate({ transform: 't' + [Math.random() * 50, topTransform[1] + fallDistance] }, 5000, mina.linear);
    }

    // Begin moving the lower drops downwards then move the upper drops
    function animateDrops() {
        // Reset to top of screen
      lowerDrops.transform('t' + topTransform);

      // Animate falling of lower drops
      lowerDrops.animate({ transform: 't' + [Math.random() * 50, topTransform[1] + fallDistance / 2.0] }, 2500, mina.linear, function() {
        // begin animation of upper drops half way through the animation
        animateUpper();
        lowerDrops.animate({ transform: 't' + [Math.random() * 50, topTransform[1] + fallDistance] }, 2500, mina.linear, animateDrops);
      });
    }

    var drop = document.getElementsByClassName(classes.drop);
    if (!state.raining) {
      // start animating the drops
      animateDrops();
      Common.listForEach(drop, Common.show);
    } else {
      Common.listForEach(drop, Common.hide);
      upperDrops.stop();
      lowerDrops.stop();
    }
    state.raining = !state.raining;
  }

  // Darken the sky to correspond with the rain
  function toggleDarkenSky() {
    // hide the sun and make the clouds darker
    Common.listForEach(document.getElementsByClassName(classes.darkCloud), function(currentElement) {
      Common.toggleClass(currentElement, classes.lightGrayCloud);
    });
    Common.listForEach(document.getElementsByClassName(classes.lightCloud), function(currentElement) {
      Common.toggleClass(currentElement, classes.darkGrayCloud);
    });
    Common.fadeToggle(document.getElementById(ids.sun));
    Common.toggleClass(document.getElementById(ids.skyHue), classes.darkSky);
  }

  // Set up animations for the speedometer and tachometer
  function animateNeedles() {
    var speedometer = Snap.select(idSelectors.speedometer);
    var revmeter = Snap.select(idSelectors.revmeter);
    var rightNeedle = Snap.select(idSelectors.rightNeedle);
    var leftNeedle = Snap.select(idSelectors.leftNeedle);
    rightNeedle.animate({transform: 'r' + ((100 * Math.random()) + 10) +  ', ' + speedometer.getBBox().cx + ',' + speedometer.getBBox().cy}, 9000 * Math.random(), mina.linear, animateNeedles);
    leftNeedle.animate({transform: 'r' + ((100 * Math.random()) + 10) + ',' + revmeter.getBBox().cx + ',' + revmeter.getBBox().cy}, 9000, mina.linear);
  }

  // Turn headlights on
  function lightsOn() {
    Snap.select(idSelectors.headlights).attr({display: '', opacity: 0});
    Snap.select(idSelectors.headlights).animate({opacity: 1}, 300, mina.linear);
  }

  // Turn headlights off
  function lightsOff() {
    Snap.select(idSelectors.headlights).animate({opacity: 0}, 500, mina.linear, function() {
      Snap.select(idSelectors.headlights).attr({display: 'none'});
    });
  }

  // Turn wipers on
  function wipersOn() {
    if (!state.wiping) {
      state.wiping = true;  // Signal to enter the wiping state
    }

    if (state.wipingAnim) { // If animation is already going on return
      return;
    }
    moveWipers();
  }

  // Turn wipers off
  function wipersOff() {
    if (!state.wiping) {
      return;
    }
    state.wiping = false;
  }

  // Rotate the wipers in degrees from, to
  function rotateWipers( from, to, next) {
    var rWiper = state.wipers.right;
    var lWiper = state.wipers.left;
    state.wipingAnim = Snap.animate(from, to, function(val) {
      rWiper.transform('r' + [val, rWiper.bbox.x + rWiper.bbox.w, rWiper.bbox.y + rWiper.bbox.h]);
      lWiper.transform('r' + [val, lWiper.bbox.x + lWiper.bbox.w, lWiper.bbox.y + lWiper.bbox.h]);
    }, 2000, mina.linear, next);
  }

  // Function to set up the wiper movement
  function moveWipers() {
    // check if the user has called wipers off
    if (!state.wiping) {
      state.wipingAnim = false; // signal that the animations is over
      return;
    }
    // rotate the wipers 170 degrees back then restart the moveWipers function
    function back() {
      rotateWipers(170, 0, moveWipers);
    }
    // rotate  the wipers 170 degrees forward then call the back function
    function forward() {
      rotateWipers(0, 170, back);
    }

    forward();
  }

  // Called when a Watson response is received, manages the behavior of the app based on the user intent that was determined by Watson
  function intentHandler(data) {
    if (data && data.intents && data.entities) {
      var primaryIntent = data.intents[0];
      var primaryEntity = data.entities[0];

      // TODO: handle multiple entities and check state

      if (primaryIntent && primaryEntity && !data.output.error) {
        switch (primaryEntity.entity) {
        case ConversationResponse.entities.genre.name:
          Panel.playMusic(primaryEntity.value);
          break;

        case ConversationResponse.entities.appliance.name:
          switch (primaryEntity.value) {
          case ConversationResponse.entities.appliance.values.air_conditioner:
            if (primaryIntent.intent === ConversationResponse.intents.turn_on) {
              Panel.ac('lo');
            } else {
              Panel.ac('hi');
            }
            break;

          case ConversationResponse.entities.appliance.values.heater:
            if (primaryIntent.intent === ConversationResponse.intents.turn_on) {
              Panel.heat('lo');
            } else {
              Panel.heat('hi');
            }
            break;

          case ConversationResponse.entities.appliance.values.light:
            if (primaryIntent.intent === ConversationResponse.intents.turn_on) {
              Animations.lightsOn();
            } else if (primaryIntent.intent === ConversationResponse.intents.turn_off) {
              Animations.lightsOff();
            }
            break;

          case ConversationResponse.entities.appliance.values.wiper:
            if (primaryIntent.intent === ConversationResponse.intents.turn_on) {
              Animations.wipersOn();
            } else if (primaryIntent.intent === ConversationResponse.intents.turn_off) {
              Animations.wipersOff();
            }
            break;

          case ConversationResponse.entities.appliance.values.music:
            if (primaryIntent.intent === ConversationResponse.intents.turn_up) {
              Panel.playMusic('general');
            }
            break;

          default:
            break;
          }
          break;

        case ConversationResponse.entities.amenity.name:
          switch (primaryEntity.value) {
          case  ConversationResponse.entities.amenity.values.gas_station:
            Panel.mapGas();
            break;
          case ConversationResponse.entities.amenity.values.restaurant:
            if (primaryIntent.intent === ConversationResponse.intents.locate_amenity) {
              Panel.mapFoodCuisine();
            } else {
              Panel.mapFoodNumbers();
            }
            break;
          default:
            break;
          }
          break;

        case ConversationResponse.entities.cuisine.name:
          Panel.mapFoodNumbers();
          break;

        case ConversationResponse.entities.phone.name:
          switch (primaryEntity.value) {
          case ConversationResponse.entities.phone.values.call:
            Panel.mapGas();
            break;
          case ConversationResponse.entities.phone.values.text:
            Panel.text();
            break;
          default:
            break;
          }
          break;

        default:
          break;
        }
      } else if (primaryIntent && !data.output.error && !primaryEntity) {
        // handle case if there in an intent but no entity
        switch (primaryIntent.intent) {
        case ConversationResponse.intents.locate_amenity:
          Panel.mapGeneral();
          break;

        default:
          break;
        }
      }
    }
  }
}());
