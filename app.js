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

'use strict';

require ( 'dotenv' ).config ( {silent: true} );
var express = require ( 'express' );
var compression = require ( 'compression' );
var bodyParser = require ( 'body-parser' );  // parser for post requests
var watson = require ( 'watson-developer-cloud' );
//The following requires are needed for logging purposes
var uuid = require ( 'uuid' );
var csv = require ( 'express-csv' );
var vcapServices = require ( 'vcap_services' );
var basicAuth = require ( 'basic-auth-connect' );

//The app owner may optionally configure a cloudand db to track user input.
//This cloudand db is not required, the app will operate without it.
//If logging is enabled the app must also enable basic auth to secure logging
//endpoints
var cloudantCredentials = vcapServices.getCredentials ( 'cloudantNoSQLDB' );
var cloudantUrl = null;
if ( cloudantCredentials ) {
  cloudantUrl = cloudantCredentials.url;
}
cloudantUrl = cloudantUrl || process.env.CLOUDANT_URL; // || '<cloudant_url>';

//The conversation workspace id
var workspace_id = process.env.WORKSPACE_ID || '<workspace_id>';
var logs = null;

var app = express ();

app.use ( compression () );
app.use ( bodyParser.json () );
//static folder containing UI
app.use ( express.static ( __dirname + "/dist" ) );

// Create the service wrapper
var conversation = watson.conversation ( {
  username: process.env.CONVERSATION_USERNAME || '<username>',
  password: process.env.CONVERSATION_PASSWORD || '<password>',
  version_date: '2016-07-11',
  version: 'v1'
} );


// Endpoint to be call from the client side
app.post ( '/api/message', function (req, res) {
  if ( !workspace_id || workspace_id === '<workspace-id>' ) {
    //If the workspace id is not specified notify the user
    return res.json ( {
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
        '<a href="https://github.com/watson-developer-cloud/car-dashboard">README</a> documentation on how to set this variable. <br>' +
        'Once a workspace has been defined the intents may be imported from ' +
        '<a href="https://github.com/watson-developer-cloud/car-dashboard/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    } );
  }
  var payload = {
    workspace_id: workspace_id,
    context: {}
  };
  if ( req.body ) {
    if ( req.body.input ) {
      payload.input = req.body.input;
    }
    if ( req.body.context ) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }
  // Send the input to the conversation service
  conversation.message ( payload, function (err, data) {
    if ( err ) {
      console.error ( JSON.stringify ( err ) );
      return res.status ( err.code || 500 ).json ( err );
    }
    if ( logs ) {
      //If the logs db is set, then we want to record all input and responses
      var id = uuid.v4 ();
      logs.insert ( {'_id': id, 'request': payload, 'response': data, 'time': new Date ()}, function (err, data) {

      } );
    }
    return res.json ( data );
  } );
} );


if ( cloudantUrl ) {
  //If logging has been enabled (as signalled by the presence of the cloudantUrl) then the
  //app developer must also specify a LOG_USER and LOG_PASS env vars.
  if ( !process.env.LOG_USER || !process.env.LOG_PASS ) {
    throw new Error ( "LOG_USER OR LOG_PASS not defined, both required to enable logging!" );
  }
  //add basic auth to the endpoints to retrieve the logs!
  var auth = basicAuth ( process.env.LOG_USER, process.env.LOG_PASS );
  //If the cloudantUrl has been configured then we will want to set up a nano client
  var nano = require ( 'nano' ) ( cloudantUrl );
  //add a new API which allows us to retrieve the logs (note this is not secure)
  nano.db.get ( 'car_logs', function (err, body) {
    if ( err ) {
      nano.db.create ( 'car_logs', function (err, body) {
        logs = nano.db.use ( 'car_logs' );
      } );
    } else {
      logs = nano.db.use ( 'car_logs' );
    }
  } );

  //Endpoint which allows deletion of db
  app.post ( '/clearDb', auth, function (req, res) {
    nano.db.destroy ( 'car_logs', function () {
      nano.db.create ( 'car_logs', function () {
        logs = nano.db.use ( 'car_logs' );
      } );
    } );
    return res.json ( {"message": "Clearing db"} );
  } );

  //Endpoint which allows conversation logs to be fetched
  app.get ( '/chats', auth, function (req, res) {
    logs.view ( 'chats_view', 'chats_view', function (err, body) {
      if(err){
        console.error(err);
        return res;
      }
      //download as CSV
      var csv = [];
      csv.push ( ['Question', 'Intent', 'Confidence', 'Entity', 'Output', 'Time'] );
      body.rows.sort ( function (a, b) {
        if ( a && b && a.value && b.value ) {
          var date1 = new Date ( a.value[5] );
          var date2 = new Date ( b.value[5] );
          var aGreaterThanB = date1.getTime () > date2.getTime ();
          return aGreaterThanB ? 1 : ((date1.getTime () === date2.getTime ()) ? 0 : -1);
        }
      } );
      body.rows.forEach ( function (row) {
        var question = '';
        var intent = '';
        var confidence = 0;
        var time = '';
        var entity = '';
        var outputText = '';
        if ( row.value ) {
          var doc = row.value;
          if ( doc ) {
            question = doc[0];

            intent = '<no intent>';
            if ( doc[1] ) {
              intent = doc[1];
              confidence = doc[2];
            }
            entity = '<no entity>';
            if ( doc[3] ) {
              entity = doc[3];
            }
            outputText = '<no dialog>';
            if ( doc[4] ) {
              outputText = doc[4];
            }
          }
          time = new Date ( doc[5] ).toLocaleString ();
        }
        csv.push ( [question, intent, confidence, entity, outputText, time] );

      } );
      res.csv ( csv );
    } );
  } );
}

app.use ( '/api/speech-to-text/', require ( './speech/stt-token.js' ) );
app.use ( '/api/text-to-speech/', require ( './speech/tts-token.js' ) );

module.exports = app;
