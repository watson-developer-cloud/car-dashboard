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
/* global Common: true, Snap: true, mina: true, Panel: true */

var Animations = (function() {
  'use strict';

  var snapSvgCanvas;
  var state;
  var initialized = false;
  var wiperSpeed;

  // Redraw after every 5 frames.
  var frameSkipRate = 3;

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
    tree: '#tree',
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
  var svgUrls = {
    background: './images/background.svg',
    dashboard: './images/dashboard.svg',
    sky: './images/sky.svg'
  };

  // Publicly accessible methods defined
  return {
    init: init,
    isInitialized: isInitialized,
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
    state = {
      svg_width: 1154,
      svg_height: 335,
      wiping: false,
      num_drops: 100,
      raining: false
    };

    // eslint-disable-next-line new-cap
    snapSvgCanvas = Snap(idSelectors.svgCanvas);

    // Loads sky, then background, then dashboard, using callbacks
    loadSky();
  }


  // Returns true if the Animations module is fully initialized (including full SVG loading)
  function isInitialized() {
    return initialized;
  }

  // Load the dashboard and wipers
  function loadDashboard() {
    // Create SVG group to hold the SVG loaded from file
    var dash = snapSvgCanvas.group();
    Snap.load(svgUrls.dashboard, function(svgFragment) {
      svgFragment.select('title').remove();   // Remove the tooltip from the SVG
      // Append the loaded fragment from file to the SVG group
      dash.append(svgFragment);

      animateNeedles();
      var rightWiper = Snap.select(idSelectors.rightWiper);
      var leftWiper = Snap.select(idSelectors.leftWiper);

      // Remember the initial positioning of wipers
      rightWiper.bbox = rightWiper.getBBox();
      leftWiper.bbox = leftWiper.getBBox();

      state.wipers = {
        right: rightWiper,
        left: leftWiper
      };

      // Draw the Watson log on the panel and set up for animations
      Panel.init();

      initialized = true;
    });
  }

  // Load the background and set the rain to start in 1 minute, lasting for 30 seconds
  function loadBackground() {
    // Create SVG group to hold the SVG loaded from file
    var background = snapSvgCanvas.group();
    Snap.load(svgUrls.background, function(svgFragment) {
      svgFragment.select('title').remove();   // Remove the tooltip from the SVG
      // Append the loaded fragment from file to the SVG group
      background.append(svgFragment);

      // Begin animating the elements
      animateRoad();
      animateTrees();
      animateClouds();

      // Create the rain drops without displaying them
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

      // Begin loading the dashboard SVGs
      loadDashboard();
    });
  }

  // Loads the sky
  function loadSky() {
    // Create SVG group to hold the SVG loaded from file
    var sky = snapSvgCanvas.group();
    Snap.load(svgUrls.sky, function(svgFragment) {
      svgFragment.select('title').remove();   // Remove the tooltip from the SVG

      // Append the loaded fragment from file to the SVG group
      sky.append(svgFragment);

      // Load the background
      loadBackground();
    });
  }

  // Animates the movement of the road
  function animateRoad() {
    Common.hide(document.getElementById(ids.dottedLine));
    Common.hide(document.getElementById(ids.stripes1));

    // Ever 120ms alternate the positioning of the dotted line
    // To create illusion of a moving road by alternating visibility
    // of sections
    setInterval(function() {
      Common.toggle(document.getElementById(ids.stripes1));
      Common.toggle(document.getElementById(ids.stripes2));
    }, 120);
  }

  // Repeatedly animate movement of cloud by dx over a specified duration
  function moveCloud(cloud, duration, dx) {
    // move cloud to starting position
    cloud.attr({opacity: 0, transform: 't' + [0, 0]});

    // In 1 tenth of the duration bring opacity to 1 then in the rest move the cloud
    cloud.animate({opacity: 1}, 0.1 * duration, mina.linear, function() {
      cloud.animate({opacity: 0.5, transform: 't' + [dx, 0]}, 0.9 * duration, mina.linear,
        function() {
          // Repeat the animation from the top
          cloud.stop();
          moveCloud(cloud, duration, dx);
        }, frameSkipRate);
    }, frameSkipRate);
  }

  // Start the clouds animations
  function animateClouds() {
    moveCloud(Snap.select(idSelectors.cloud1), 50000, -4500);
    moveCloud(Snap.select(idSelectors.cloud2), 90000, -4500);
    moveCloud(Snap.select(idSelectors.cloud3), 23000, 2000);
    moveCloud(Snap.select(idSelectors.cloud4), 90000, -4500);
    moveCloud(Snap.select(idSelectors.cloud5), 21000, 2000);
    moveCloud(Snap.select(idSelectors.cloud6), 20000, 2000);
  }

  // Repeatedly animates the trees to pass by on the right and left
  function animateTrees() {
    var t = Snap.select(idSelectors.tree);

    // Move to original position and make tree visible
    t.transform('t0,0');
    t.stop();
    t.attr( {display: ''});

    // Randomly chose to move tree on left or right side of the road
    var leftXtransform = [-130, 10];
    var rightXtransform = [120, 10];
    var translate = (Math.random() > 0.5 ? leftXtransform : rightXtransform);

    // Start transforming the trees slowly then faster as the car gets closer
    var easeInExpo = function(n) {
      return ( n === 0 ) ? 0 : Math.pow( 2, 10 * ( n - 1 ) );
    };

    // Final transform should be scaled 20x and translated
    var endScene = 's20,20,' + 't' + translate;

    // Animate tree to the end scene in 4.5s
    t.animate({transform: endScene}, 4500, easeInExpo, function() {
      // Hide tree once the animation is complete
      t.attr( {display: 'none'});
      t.stop();

      // Repeat animation
      animateTrees();
    }, frameSkipRate);
  }

  // Create rain objects and then hide the objects (waiting for rain to be toggled on)
  function initiateRaining() {
    makeRain();
    Common.hide(document.getElementById(ids.lowerDrops));
    Common.hide(document.getElementById(ids.upperDrops));
  }

  // Create the raindrop objects
  function makeRain() {
    // Create 2 groups of rain drops. One for the top half and one for the bottom.
    // Each animated slight differently to create illusion of continuity
    var upperDrops = snapSvgCanvas.group();
    var lowerDrops = snapSvgCanvas.group();
    addDropsToGroup(state.num_drops / 2, upperDrops);
    addDropsToGroup(state.num_drops / 2, lowerDrops);

    // Set the IDs for the groups so we can easily identify them in other functions
    upperDrops.node.id = ids.upperDrops;
    lowerDrops.node.id = ids.lowerDrops;
  }

  // Draw count randomly positioned drops and add them to the SVG group
  function addDropsToGroup(count, group) {
    for (var i =  0; i < count; i++) {
      var x = Math.random() * state.svg_width;
      var y = Math.random() * state.svg_height;
      group.append(newDropline(x, y));
    }
  }

  // Function to help in the creation of raindrop objects
  function newDropline(x, y) {
    // randomize sizes of drops
    var scale = 0.1 + 0.3 * Math.random();

    // create the svg path string for drawing the drops
    var dropPath =
      'm,' + [x, y] +
      ',l,' + [0, 0] +
      ' ,c,' + [-3.4105934 * scale, -3.41062 * scale, -3.013645 * scale,
        -9.00921 * scale, 3.810723 * scale, -14.7348 * scale] +
      ',l,' + [68.031 * scale, -57.107 * scale] +
      ',l,' + [-57.107 * scale, 68.034 * scale] +
      ',c,' + [-5.725604 * scale, 6.8212 * scale, -11.324178 * scale,
        7.22133 * scale, -14.734769 * scale, 3.80759 * scale] +
      ',z';

    // Make sure the path dims are relative
    var rel = Snap.path.toRelative(dropPath);
    var drop = snapSvgCanvas.path(rel);

    drop.addClass(classes.drop);
    drop.attr({
      fill: '#ceeaf4'   // give drops the blue color
    });
    return drop;
  }

  // Make the rain start or stop
  function toggleRain() {
    // darken the sky
    toggleDarkenSky();

    var topTransform = [-20, -300];
    var fallDistance = 650;
    var upperDrops = Snap.select(idSelectors.upperDrops);
    var lowerDrops = Snap.select(idSelectors.lowerDrops);

    // Move drops to top of the screen
    upperDrops.transform('t' + topTransform);
    lowerDrops.transform('t' + topTransform);

    // Move the group of upper drops downwards
    function animateUpper() {
      // Reset to top of screen
      upperDrops.transform('t' + topTransform);
      upperDrops.stop();
      Common.show(upperDrops.node);

      // Animate falling movement to bottom of screen
      upperDrops.animate({ transform: 't' + [Math.random() * 50,
        topTransform[1] + fallDistance] }, 5000, mina.linear, function() {
          Common.hide(upperDrops.node);
        }, frameSkipRate);
    }

    // Begin moving the lower drops downwards then move the upper drops
    function animateDrops() {
      // Reset to top of screen
      lowerDrops.transform('t' + topTransform);
      lowerDrops.stop();
      Common.show(lowerDrops.node);

      // Animate falling of lower drops
      lowerDrops.animate({
        transform: 't' + [Math.random() * 50,
          topTransform[1] + fallDistance / 2.0]
      }, 2500, mina.linear, function() {
        // begin animation of upper drops half way through the animation
        if (state.raining) {
          animateUpper();
        }
        lowerDrops.animate({
          transform: 't' + [Math.random() * 50,
            topTransform[1] + fallDistance]
        }, 2500, mina.linear, function() {
          if (state.raining) {
            animateDrops();
          } else {
            Common.hide(lowerDrops.node);
          }
        }, frameSkipRate);
      }, frameSkipRate);
    }

    if (!state.raining) {
      // start animating the drops
      animateDrops();
    } else {
      // stop the raining
      upperDrops.stop();
      Common.hide(upperDrops.node);
      lowerDrops.stop();
      Common.hide(lowerDrops.node);
    }
    state.raining = !state.raining;
  }

  // Darken the sky to correspond with the rain
  function toggleDarkenSky() {
    // hide the sun and make the clouds darker
    Common.listForEach(document.getElementsByClassName(classes.darkCloud),
      function(currentElement) {
        Common.toggleClass(currentElement, classes.lightGrayCloud);
      });
    Common.listForEach(document.getElementsByClassName(classes.lightCloud),
      function(currentElement) {
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

    // Stop any running animations
    rightNeedle.stop();
    leftNeedle.stop();

    // Animate the needles around the center of the dials in a range
    // of 10-110 randomly
    leftNeedle.animate({transform: 'r' + ((30 * Math.random()) - 30) + ','
    + revmeter.getBBox().cx + ',' + revmeter.getBBox().cy}, 9000, mina.easeinout, function() {}, frameSkipRate);
    rightNeedle.animate({transform: 'r' + ((45 * Math.random()) - 30) +  ', '
    + speedometer.getBBox().cx + ',' + speedometer.getBBox().cy},
      9000 * Math.random(), mina.easeinout, function() {
        // Repeat the animation
        animateNeedles();
      }, frameSkipRate);
  }

  // Turn headlights on
  function lightsOn() {
    // Set the light to visible and fade in over 300ms
    Snap.select(idSelectors.headlights).attr({display: '', opacity: 0});
    Snap.select(idSelectors.headlights).animate({opacity: 1}, 300, mina.linear);
  }

  // Turn headlights off
  function lightsOff() {
    // Fade out the light over 500s
    Snap.select(idSelectors.headlights).animate({opacity: 0}, 500, mina.linear, function() {
      // After fading, hide the light from the DOM
      Snap.select(idSelectors.headlights).attr({display: 'none'});
    });
  }

  // Turn wipers on
  function wipersOn(speed) {
    if (!state.wiping) {
      state.wiping = true;  // Signal to enter the wiping state
    }
    setWiperSpeed(speed);

    if (state.wipingAnim) { // If animation is already going on return
      return;
    }
    moveWipers();
  }

  function setWiperSpeed(speed) {
    wiperSpeed = speed;
  }

  // Turn wipers off
  function wipersOff() {
    if (!state.wiping) {
      return;
    }
    state.wiping = false;
  }

  // Rotate the wipers in degrees from -> to, then execute the next callback
  function rotateWipers( from, to, next) {
    var rWiper = state.wipers.right;
    var lWiper = state.wipers.left;
    var speeds = {
      hi: 2,
      lo: 1
    };

    // Stop any running animation first
    if (state.wipingAnim) {
      state.wipingAnim.stop();
    }

    // Begin the wiping animation
    state.wipingAnim = Snap.animate(from, to, function(val) {
      rWiper.transform('r' + [val, rWiper.bbox.x + rWiper.bbox.w, rWiper.bbox.y + rWiper.bbox.h]);
      lWiper.transform('r' + [val, lWiper.bbox.x + lWiper.bbox.w, lWiper.bbox.y + lWiper.bbox.h]);
    }, 2000 / Math.max(speeds[wiperSpeed], speeds.lo), mina.linear, next, frameSkipRate);
  }

  // Repeatedly animates movement of the wipers back and fourth
  function moveWipers() {
    // check if the user has called wipers off
    if (!state.wiping) {
      state.wipingAnim = false; // signal that the animations is over
      return;
    }
    // rotate the wipers 170 degrees back then restart moveWipers
    function back() {
      rotateWipers(170, 0, moveWipers);
    }
    // rotate  the wipers 170 degrees forward then call the back function
    function forward() {
      rotateWipers(0, 170, back);
    }

    // Kick off the animation with a forward animation
    forward();
  }
}());
