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
/* global mina: true, Snap: true */

var Panel = (function() {
  var selectors = {
    defaultScreen: 'defaultScreen'
  };
  var idSelectors = {
    svgCanvas: '#svg_canvas',
    panel: '#panel',
    fan: '#fan',
    seek: '#seek'
  };
  var snapSvgCanvas = Snap.select(idSelectors.svgCanvas);

  // Publicly accessible methods defined
  return {
    playMusic: playMusic,
    ac: ac,
    heat: heat,
    mapFoodNumbers: mapFoodNumbers,
    mapFoodCuisine: mapFoodCuisine,
    mapGas: mapGas,
    mapGeneral: mapGeneral,
    text: text,
    init: defaultScreen
  };

  // clear everything on the panel until only the watson logo is left
  function clearToDefault(panel) {
    Array.from(panel.node.childNodes).forEach(function(element) {
      if (element.id !== selectors.defaultScreen) {
        element.remove();
      }
    });
  }

  // Auxiliary function for loading an SVG into the panel
  function loadSvg(filename, next) {
    var p = Snap.select(idSelectors.panel);
    clearToDefault(p);
    var svgGroup = snapSvgCanvas.group();
    Snap.load('./images/' + filename + '.svg', function(svgFragment) {
      svgFragment.select('title').remove();   // Remove the tooltip from the svg
      svgGroup.attr({opacity: 0});
      svgGroup.append(svgFragment);
      svgGroup.transform('T' + [180, 137] + 's0.29,0.29');
      p.append(svgGroup);
      svgGroup.animate({opacity: 1}, 700, mina.linear);

      if (next) {
        next(svgFragment, svgGroup);
      }
    });
    return svgGroup;
  }

  function animateFan(level, next) {
    var fan = Snap.select(idSelectors.fan);
    var bbox = fan.getBBox();

    var doneNext = false;
    Snap.animate(0, 100, function(val) {
      var speed = ((level === 'hi') ? 10 : 5);
      if (val > 60) {
        // at 60% of the animation apply the callback once
        if (!doneNext) {
          next();
          doneNext = true;
        }
      }
      // rotate the fan around its center
      var localMat = fan.transform().localMatrix;
      fan.transform( localMat.rotate(speed, bbox.cx, bbox.cy) );
    }, 8000, mina.linear);
  }

  // Set up fan to animate and then fade out
  function animateFanThenFade(level, svgGroup) {
    function next() {
      svgGroup.animate({opacity: 0}, 500, mina.linear, function() {
        svgGroup.remove();
      });
    }
    animateFan(level, next);
  }

  // Show that music of the given genre is playing
  function playMusic(genre) {
    function next(svgFragment, svgGroup) {
      var seek = Snap.select('#seek');
      var localMat = seek.transform().localMatrix;
      seek.animate({transform: localMat.translate(950, 0)}, 4000, mina.linear, function() {
        svgGroup.animate({opacity: 0}, 500, mina.linear, function() {
          svgGroup.remove();
        });
      });
    }
    loadSvg('music ' + genre, next);
  }

  // Turn on A/C
  function ac(level) {
    loadSvg('ac ' + level, function(svgFragment, svgGroup) {
      animateFanThenFade(level, svgGroup);
    });
  }

  // Turn on heat
  function heat(level) {
    loadSvg('heat ' + level, function(svgFragment, svgGroup) {
      animateFanThenFade(level, svgGroup);
    });
  }

  // load svg element then fade it ouy after 4.5s
  function loadSvgThenFade(filename) {
    loadSvg(filename, function(svgFragment, svgGroup) {
      setTimeout( function() {
        svgGroup.animate({opacity: 0}, 500, mina.linear, function() {
          svgGroup.remove();
        });
      }, 4500);
    });
  }

  // show watson logo on panel
  function defaultScreen() {
    loadSvg('default screen', function(svgFragment, svgGroup) {
      svgGroup.node.id = selectors.defaultScreen;
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
    loadSvgThenFade('map gas');
  }

  // Show the map of the surrounding area
  function mapGeneral() {
    loadSvgThenFade('map general');
  }

  // Show screen showing message sent
  function text() {
    loadSvgThenFade('text');
  }
})();
