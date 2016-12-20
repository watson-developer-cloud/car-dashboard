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

const assert = require('assert');
const request = require('supertest');
const path = require('path');

// load default variables for testing
require('dotenv').config({ silent: true, path: path.join(__dirname, '../.env') });

if (!process.env.CONVERSATION_USERNAME) {
  // eslint-disable-next-line
  console.log('Skipping integration tests because CONVERSATION_USERNAME is null');
  return;
}

const app = require('../app');

describe('Basic API tests', function () {
  this.timeout(5000);

  it('Should load the home page', () =>
    request(app).get('/').expect(200)
  );

  it('Should generate an Speech to Text token', function () {
    if (process.env.SPEECH_TO_TEXT_USERNAME) {
      return request(app)
      .get('/api/speech-to-text/token')
      .expect(200)
      .then((result) => {
        assert.ok(result.text && result.text.length > 0 );
      });
    } else {
      return this.skip('No credentials');
    }
  });

  it('Should generate a Text to Speech token', function () {
    if (process.env.TEXT_TO_SPEECH_USERNAME) {
      return request(app)
      .get('/api/text-to-speech/token')
      .expect(200)
      .then((result) => {
        assert.ok(result.text && result.text.length > 0 );
      });
    } else {
      return this.skip('No credentials');
    }
  });

  it('Should respond to messages using Conversation', function () {
    if (process.env.CONVERSATION_USERNAME && process.env.WORKSPACE_ID) {
      return request(app)
      .post('/api/message')
      .expect(200)
      .then((result) => {
        assert.ok(result.body && result.body.output.text);
      });
    } else {
      return this.skip('No credentials');
    }
  });

});
