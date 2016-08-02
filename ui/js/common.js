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

/* The Common module is designed as an auxiliary module
 * to hold functions that are used in multiple other modules
 * and functions that do not fit into the scopes of other modules
 */

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^Common$" }] */

var Common = (function() {
  var classes = {
    hide: 'hide',
    fade: 'fade',
    fadeOut: 'fade-out'
  };

  // Publicly accessible methods defined
  return {
    buildDomElement: buildDomElementFromJson,
    wait: wait,
    fireEvent: fireEvent,
    listForEach: listForEach,
    partial: partial,
    hide: hide,
    show: show,
    toggle: toggle,
    fadeOut: fadeOut,
    fadeIn: fadeIn,
    fadeToggle: fadeToggle,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass
  };

  // Take in JSON object and build a DOM element out of it
  // (Limited in scope, cannot necessarily create arbitrary DOM elements)
  // JSON Example:
  //  {
  //    "tagName": "div",
  //    "text": "Hello World!",
  //    "html": "Hello <br> World!", (text preempts html attribute)
  //    "classNames": ["aClass", "bClass"],
  //    "attributes": [{
  //      "name": "onclick",
  //      "value": "alert('Hi there!')"
  //    }],
  //    "children: [{other similarly structured JSON objects...}, {...}]
  //  }
  //
  // Resulting DOM:
  // <div class="aClass bClass" onclick="alert('Hi there!')">
  //   Hello World!
  //   --- children nodes, etc. ---
  // <div>
  function buildDomElementFromJson(domJson) {
    // Create a DOM element with the given tag name
    var element = document.createElement(domJson.tagName);

    // Fill the "content" of the element
    if (domJson.text) {
      element.textContent = domJson.text;
    } else if (domJson.html) {
      element.insertAdjacentHTML('beforeend', domJson.html);
    }

    // Add classes to the element
    if (domJson.classNames) {
      for (var i = 0; i < domJson.classNames.length; i++) {
        Common.addClass(element, domJson.classNames[i]);
      }
    }
    // Add attributes to the element
    if (domJson.attributes) {
      for (var j = 0; j < domJson.attributes.length; j++) {
        var currentAttribute = domJson.attributes[j];
        element.setAttribute(currentAttribute.name, currentAttribute.value);
      }
    }
    // Add children elements to the element
    if (domJson.children) {
      for (var k = 0; k < domJson.children.length; k++) {
        var currentChild = domJson.children[k];
        element.appendChild(buildDomElementFromJson(currentChild));
      }
    }
    return element;
  }

  // Wait until a condition is true until running a function
  // (poll based on interval in ms)
  function wait(conditionFunction, execFunction, interval) {
    if (!conditionFunction()) {
      setTimeout(function() {
        wait(conditionFunction, execFunction, interval);
      }, interval);
    } else {
      execFunction();
    }
  }

  // Triggers an event of the given type on the given object
  function fireEvent(element, event) {
    var evt;
    if (document.createEventObject) {
      // dispatch for IE
      evt = document.createEventObject();
      return element.fireEvent('on' + event, evt);
    }
    // otherwise, dispatch for Firefox, Chrome + others
    evt = document.createEvent('HTMLEvents');
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
  }

  // A function that runs a for each loop on a List, running the callback function for each one
  function listForEach(list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback.call(null, list[i]);
    }
  }

  function partial(func /* , any number of bound args...*/) {
    var sliceFunc = Array.prototype.slice;
    var args = sliceFunc.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(sliceFunc.call(arguments, 0)));
    };
  }

  // Adds the 'hide' class to a given element, giving it a CSS display value of 'none'
  function hide(element) {
    addClass(element, classes.hide);
  }

  // Removes the 'hide' class from a given element, removing its CSS display value of 'none'
  function show(element) {
    removeClass(element, classes.hide);
  }

  // Toggles the 'hide' class on a given element, toggling a CSS display value of 'none'
  function toggle(element) {
    toggleClass(element, classes.hide);
  }

  // Causes an element to fade out by adding the 'fade' and 'fade-out' classes
  function fadeOut(element) {
    addClass(element, classes.fade);
    addClass(element, classes.fadeOut);
  }

  // Causes an element to fade back in by adding the 'fade' class and removing the 'fade-out' class
  function fadeIn(element) {
    addClass(element, classes.fade);
    removeClass(element, classes.fadeOut);
  }

  // Causes an element to toggle fading out or back in
  // by adding the 'fade' class and toggling the 'fade-out' class
  function fadeToggle(element) {
    addClass(element, classes.fade);
    toggleClass(element, classes.fadeOut);
  }

  // Auxiliary function for adding a class to an element
  // (to help mitigate IE's lack of support for svg.classList)
  function addClass(element, clazz) {
    if (element.classList) {
      element.classList.add(clazz);
    } else {
      ieSvgAddClass(element, clazz);
    }
  }

  // Auxiliary function for removing a class from an element
  // (to help mitigate IE's lack of support for svg.classList)
  function removeClass(element, clazz) {
    if (element.classList) {
      element.classList.remove(clazz);
    } else {
      ieSvgRemoveClass(element, clazz);
    }
  }

  // Auxiliary function for toggling a class on an element
  // (to help mitigate IE's lack of support for svg.classList)
  function toggleClass(element, clazz) {
    if (element.classList) {
      element.classList.toggle(clazz);
    } else {
      ieSvgToggleClass(element, clazz);
    }
  }

  // Auxiliary function for checking whether an element contains a class
  // (to help mitigate IE's lack of support for svg.classList)
  function ieSvgContainsClass(element, clazz) {
    return (element.className.baseVal.indexOf(clazz) > -1);
  }

  // Auxiliary function for adding a class to an element without using the classList property
  // (to help mitigate IE's lack of support for svg.classList)
  function ieSvgAddClass(element, clazz, bypassCheck) {
    if (bypassCheck || !ieSvgContainsClass(element, clazz)) {
      var classNameValue = element.className.baseVal;
      classNameValue += (' ' + clazz);
      element.className.baseVal = classNameValue;
    }
  }

  // Auxiliary function for removing a class from an element without using the classList property
  // (to help mitigate IE's lack of support for svg.classList)
  function ieSvgRemoveClass(element, clazz) {
    var classNameValue = element.className.baseVal;
    classNameValue = classNameValue.replace(clazz, '');
    element.className.baseVal = classNameValue;
  }

  // Auxiliary function for toggling a class on an element without using the classList property
  // (to help mitigate IE's lack of support for svg.classList)
  function ieSvgToggleClass(element, clazz) {
    if (ieSvgContainsClass(element, clazz)) {
      ieSvgRemoveClass(element, clazz);
    } else {
      ieSvgAddClass(element, clazz, true);
    }
  }
}());
