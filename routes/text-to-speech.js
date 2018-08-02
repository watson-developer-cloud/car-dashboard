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


const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');
const IamTokenManagerV1 = require('watson-developer-cloud/iam-token-manager/v1');

// Create the token manager
let tokenManager;
const serviceUrl = process.env.TEXT_TO_SPEECH_URL || 'https://stream.watsonplatform.net/text-to-speech/api';

if (process.env.TEXT_TO_SPEECH_IAM_APIKEY && process.env.TEXT_TO_SPEECH_IAM_APIKEY !== '') {
  tokenManager = new IamTokenManagerV1.IamTokenManagerV1({
    iamApikey: process.env.TEXT_TO_SPEECH_IAM_APIKEY || '<iam_apikey>',
    iamUrl: process.env.TEXT_TO_SPEECH_IAM_URL || 'https://iam.bluemix.net/identity/token',
  });
} else {
  tokenManager = new AuthorizationV1({
    username: process.env.TEXT_TO_SPEECH_USERNAME || '<username>',
    password: process.env.TEXT_TO_SPEECH_PASSWORD || '<password>',
    url: serviceUrl,
  });
}
// Inform user that TTS is not configured properly or at all
if (!process.env.TEXT_TO_SPEECH_USERNAME && !process.env.TEXT_TO_SPEECH_IAM_APIKEY) {
  // eslint-disable-next-line
  console.warn('WARNING: The app has not been configured with a TEXT_TO_SPEECH_USERNAME and/or ' +
    'a TEXT_TO_SPEECH_IAM_APIKEY environment variable. If you wish to have text to speech ' +
    'in your working application, please refer to the https://github.com/watson-developer-cloud/car-dashboard ' +
    'README documentation on how to set these variables.');
}


module.exports = function initTextToSpeech(app) {
  app.get('/api/text-to-speech/token', (req, res) =>
    tokenManager.getToken(function (err, token) {
      if (err) {
        console.log('error:', err);
        console.log('Please refer to the https://github.com/watson-developer-cloud/car-dashboard\n' +
          'README documentation on how to set username and password variables.');
      } else {
        res.send(token);
      }
    })
  );
};
