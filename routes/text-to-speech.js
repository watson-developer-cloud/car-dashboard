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


const watson = require('watson-developer-cloud');
const vcapServices = require('vcap_services');

const credentials = Object.assign({
  username: process.env.TEXT_TO_SPEECH_USERNAME || '<username>',
  password: process.env.TEXT_TO_SPEECH_PASSWORD || '<username>',
  url: process.env.TEXT_TO_SPEECH_URL || 'https://stream.watsonplatform.net/text-to-speech/api',
  version: 'v1'
}, vcapServices.getCredentials('text_to_speech'));

const authorizationService = watson.authorization(credentials);


// Inform user that TTS is not configured properly or at all
if (!credentials || !credentials.username || credentials.username === '<username>') {
  // eslint-disable-next-line
  console.warn('WARNING: The app has not been configured with a TEXT_TO_SPEECH_USERNAME and/or ' +
    'a TEXT_TO_SPEECH_PASSWORD environment variable. If you wish to have text to speech ' +
    'in your working application, please refer to the https://github.com/watson-developer-cloud/car-dashboard ' +
    'README documentation on how to set these variables.');
}


module.exports = function initSpeechToText(app) {
  app.get('/api/text-to-speech/token', (req, res, next) =>
    authorizationService.getToken({ url: credentials.url }, (error, token) => {
      if (error) {
        if (error.code !== 401)
          return next(error);
      } else {
        res.send(token);
      }
    })
  );
};
