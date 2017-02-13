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

/* The Panel module involves the display and behavior of the dashboard panel within the SVG */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Panel$" }] */
/* global mina: true, Snap: true, Common: true */

var Panel = (function() {
  var ids = {
    defaultScreen: 'defaultScreen',
    panelGenreText: 'panel-genre-text'
  };
  var idSelectors = {
    svgCanvas: '#svg_canvas',
    panel: '#panel',
    fan: '#fan',
    seek: '#seek'
  };
  var genres = ['general', 'classical', 'jazz', 'rock', 'pop'];
  var snapSvgCanvas = Snap.select(idSelectors.svgCanvas);

  var frameSkipRate = 5;  // redraw after 5 frames
  var currentAnimations = [];

  // Publicly accessible methods defined
  return {
    playMusic: playMusic,
    ac: ac,
    heat: heat,
    mapFoodNumbers: mapFoodNumbers,
    mapFoodCuisine: mapFoodCuisine,
    mapGas: mapGas,
    mapRestrooms: mapRestrooms,
    mapGeneral: mapGeneral,
    mapNavigation: mapNavigation,
    init: defaultScreen,
    setWatsonPanelToDefault: setWatsonPanelToDefault
  };

  // clear everything on the panel until only the Watson logo is left
  function clearToDefault(panel) {
    // Stop all animations first
    Common.listForEach(currentAnimations, function(element) {
      element.stop();
    });
    currentAnimations = [];

    // Clear to default Watson logo
    Common.listForEach(panel.node.childNodes, function(element) {
      if (element.id !== ids.defaultScreen) {
        panel.node.removeChild(element);
      }
    });
  }

  function setWatsonPanelToDefault() {
    var p = Snap.select(idSelectors.panel);
    clearToDefault(p);
  }

  // Auxiliary function for loading an SVG into the panel
  function loadSvg(filename, next) {
    // Clear the panel console display and leave on the Watson logo
    var p = Snap.select(idSelectors.panel);
    clearToDefault(p);

    // Create a new SVG group to hold the loaded SVG
    var svgGroup = snapSvgCanvas.group();

    Snap.load('./images/' + filename + '.svg', function(svgFragment) {
      svgFragment.select('title').remove();   // Remove the tooltip from the svg

      // Position the SVG group on the panel console
      svgGroup.append(svgFragment);
      svgGroup.transform('T' + [180, 137] + 's0.29,0.29');
      p.append(svgGroup);

      // Place a rectangular mask around the panel console area to clip off any bits
      // of the SVG group That are not within the panel console area
      var panelMask = svgGroup.rect(60, 15, 910, 680, 20, 20).attr({ 'strokeWidth': 0, fill: 'white' });
      svgGroup.attr({mask: panelMask});

      // Fade in the SVG group
      svgGroup.attr({opacity: 0});
      var fadeAnimation = svgGroup.animate({opacity: 1}, 700, mina.linear, function() {}, frameSkipRate);
      currentAnimations.push(fadeAnimation);
      // Execute callback if provided
      if (next) {
        next(svgFragment, svgGroup);
      }
    });
    return svgGroup;
  }

  // Rotate the fan in the svgGroup at the speed specified by level
  function animateFan(level, svgGroup) {
    // Find the fan in the DOM and get its initial coordinates
    var fan = Snap.select(idSelectors.fan);
    var bbox = fan.getBBox();

    // TODO Speeds seem to be much faster in Chrome than FF
    var speed = {
      hi: 20,
      lo: 10
    }[level];

    var doneFade = false;
    var rotateAnim = Snap.animate(0, 100, function(val) {
      // At 90% of the animation apply the fade animation once to
      // Begin fading out the SVG group from the panel display
      if (val > 90) {
        if (!doneFade) {
          var fadeAnim = svgGroup.animate({opacity: 0}, 500, mina.linear, function() {
            svgGroup.remove();
          }, frameSkipRate);
          doneFade = true;
          currentAnimations.push(fadeAnim);
        }
      }
      // Rotate the fan around its center (bbox.cx, bbox.cy) at the speed given
      var localMat = fan.transform().localMatrix;
      fan.transform( localMat.rotate(speed, bbox.cx, bbox.cy) );
    }, 30000, mina.linear, function() {}, frameSkipRate);
    currentAnimations.push(rotateAnim);
  }

  // Show that music of the given genre is playing
  function playMusic(genre) {
    // Define a callback for the loading function
    function next(svgFragment, svgGroup) {
      var genreText = document.getElementById(ids.panelGenreText);
      if (genreText) {
        genreText.textContent = genre.toUpperCase();
      }

      var seek = Snap.select(idSelectors.seek);
      var localMat = seek.transform().localMatrix;

      // Animate moving the seek position
      var seekAnimation = seek.animate({transform: localMat.translate(1050, 0)}, 30000, mina.linear, function () {
        // After the seek position has reached the end fade out the SVG group
        var fadeAnimation = svgGroup.animate({opacity: 0}, 500, mina.linear, function () {
          svgGroup.remove();
        }, frameSkipRate);
        currentAnimations.push(fadeAnimation);
      }, frameSkipRate);
      currentAnimations.push(seekAnimation);
    }

    var genreStr = genre;
    if (genres.indexOf(genreStr) < 0) {
      genreStr = 'genre';
    }

    // Load the SVG then execute the next callback
    loadSvg('music ' + genreStr, next);
  }

  // Turn on A/C
  function ac(level) {
    loadSvg('ac ' + level, function(svgFragment, svgGroup) {
      animateFan(level, svgGroup);
    });
  }

  // Turn on heat
  function heat(level) {
    loadSvg('heat ' + level, function(svgFragment, svgGroup) {
      animateFan(level, svgGroup);
    });
  }

  // Show Watson logo on panel
  function defaultScreen() {
    loadSvg('default screen', function(svgFragment, svgGroup) {
      svgGroup.node.id = ids.defaultScreen;
    });
  }

  // Show the map of food locations numbered
  function mapFoodNumbers() {
    loadSvg('map food numbers');
  }

  // Show the map of food locations by kind
  function mapFoodCuisine() {
    loadSvg('map food cuisine');
  }

  // Show the map of gas stations
  function mapGas() {
    loadSvg('map gas');
  }

  // Show the map of restrooms
  function mapRestrooms() {
    loadSvg('map restrooms');
  }

  // Show the map of the surrounding area
  function mapGeneral() {
    loadSvg('map general');
  }

  // Set a given choice (e.g first, second e.t.c) as the current goal on the
  // Map
  function mapNavigation(choice) {
    Snap.selectAll('.nav_active').forEach(function(e) {
      e.removeClass('nav_active');
    });

    var goal = Snap.select('#' + choice);

    if (goal) {
      goal.addClass('nav_active');
    }
  }
})();
