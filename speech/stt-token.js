'use strict';

var sttUsername = process.env.SPEECH_TO_TEXT_USERNAME || '<username>';
var sttPassword = process.env.SPEECH_TO_TEXT_PASSWORD || '<password>';

var sttInform = 0; // Only inform user once

var express = require('express'),
  router = express.Router(), // eslint-disable-line new-cap
  vcapServices = require('vcap_services'),
  extend = require('util')._extend,
  watson = require('watson-developer-cloud');

// set up an endpoint to serve speech-to-text auth tokens

// For local development, replace username and password or set env properties
var sttConfig = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: sttUsername,
  password: sttPassword
}, vcapServices.getCredentials('speech_to_text'));

var sttAuthService = watson.authorization(sttConfig);

// Inform user that STT is not configured properly or at all
if ( !sttUsername || sttUsername === '<username>' || !sttPassword || sttPassword === '<password>' ) {
  if (sttInform === 0){
    console.log('WARNING: The app has not been configured with a SPEECH_TO_TEXT_USERNAME and/or a SPEECH_TO_TEXT_PASSWORD environment variable. If you wish to have speech to text in your working application, please refer to the https://github.com/watson-developer-cloud/car-dashboard README documentation on how to set these variables.');
    sttInform ++;
  }
}

router.get('/token', function(req, res) {
  sttAuthService.getToken({url: sttConfig.url}, function(err, token) {
    if ( !sttUsername || sttUsername === '<username>' || !sttPassword || sttPassword === '<password>' ) {
      // If User isn't using STT - limit errors in console and development tools
    }
    else if (err) {
      console.log('Error retrieving token: ', err);
      res.status(500).send('Error retrieving token');
      return;
    }
    res.send(token);
  });
});

module.exports = router;
