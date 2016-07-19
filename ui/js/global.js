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

/* The Global module is used to initialize the other modules */

/* global TooltipDialogs: true, Conversation: true, ConversationResponse: true, Sidebar: true, Animations: true, Common: true */

(function() {
  TooltipDialogs.init();
  Conversation.init();
  ConversationResponse.init();
  Sidebar.init();
  Animations.init();
  // Used as a cloak to delay displaying the app until it's likely done rendering
  Common.wait(Animations.isInitialized, function() {
    document.body.style.visibility = 'visible';
  }, 50);
}());
