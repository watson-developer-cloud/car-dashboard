/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// Module dependencies
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');


module.exports = function (app) {
  app.enable('trust proxy');
  app.use(require('express-status-monitor')());

  // Only loaded when running in Bluemix
  if (process.env.VCAP_APPLICATION) {
    require('./security')(app);
  }

  app.use(compression());
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(express.static(path.join(__dirname, '..', 'dist')));
};