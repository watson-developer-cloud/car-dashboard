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


// security.js
const secure = require('express-secure-only');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = function (app) {
  app.use(secure());
  app.use(helmet({
    frameguard: false,
    noCache: false
  }));

  const limiter = rateLimit({
    windowMs: 60 * 1000, // seconds
    delayMs: 0,
    max: 10,
    message: JSON.stringify({
      error: 'Too many requests, please try again in 30 seconds.',
      code: 429
    })
  });
  app.use('/api/', limiter);
};
