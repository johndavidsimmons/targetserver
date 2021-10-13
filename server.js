/***************************************************************************************
 * (c) 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 ****************************************************************************************/

 const fs = require("fs");
 const express = require("express");
 const cookieParser = require("cookie-parser");
 const TargetClient = require("@adobe/target-nodejs-sdk");
 const pug = require('pug');

 const path = require('path');
const exp = require("constants");
 const CONFIG = {
   client: "quickenloans",
   organizationId: "5D60123F5245B13E0A490D45@AdobeOrg",
   timeout: 10000,
   logger: console
 };
 const targetClient = TargetClient.create(CONFIG);
 
 const app = express();
 app.use(cookieParser());
 app.use(express.static(path.join(__dirname, 'public')));
 app.set('views', __dirname + "/views")
 app.set("view engine", 'pug')
 
 function saveCookie(res, cookie) {
   if (!cookie) {
     return;
   }
 
   res.cookie(cookie.name, cookie.value, {maxAge: cookie.maxAge * 1000});
 }
 
 const getResponseHeaders = () => ({
   "Content-Type": "text/html",
   "Expires": new Date().toUTCString()
 });
  
 function getAddress(req) {
   return { url: req.headers.host + req.originalUrl }
 }
  
 app.get("/", async (req,res) => {
  const visitorCookie = req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie = req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [{
        address: getAddress(req),
        name: "lander-ssr-1",
        profileParameters: {
          country: "usa"
        }
      }
      ]
    }}

    try {
      const response = await targetClient.getOffers({ request, visitorCookie, targetCookie, targetLocationHintCookie });
      let {visitorState} = response
      let content;
      try {
         content = response.response.execute.mboxes.find(el => el.index == 0).options[0].content
      } catch (e) {
         content = e
      }

      // save the cookies to stay in the same experience!
      res.set(getResponseHeaders());
      saveCookie(res, response.targetCookie);
      saveCookie(res, response.targetLocationHintCookie);

      res.render('index', {
        title: "john",
        response: JSON.stringify(response),
        visitorState: JSON.stringify(visitorState),
        content: content
    })
    } catch (error) {
      console.error("Target:", error);
      
    }
 })

 app.get("/singlequestionreplacement", async (req,res) => {

  const questions = [
    {
      question: "What is your favorite Color",
      answers: [
        'red', 'green', 'blue', 'orange'
      ]
    },
    {
      question: "FOC do you work for?",
      answers: [
        'rocket homes', 'rocket loans', 'rocket mortgage', 'rocket auto'
      ]
    },
    {
      question: "What garage do you park in?",
      answers: [
        'ZLOT', 'OCM', 'Greektown', 'I walk to work'
      ]
    }
  ];

  const visitorCookie = req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie = req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [{
        address: getAddress(req),
        name: "singleQuestion",
        profileParameters: {
          country: "usa"
        }
      }
      ]
    }}

    const response = await targetClient.getOffers({ request, visitorCookie, targetCookie, targetLocationHintCookie });
    let {visitorState, responseTokens} = response
    let experienceName = responseTokens[0]['experience.name'];

    if (experienceName.toLowerCase().includes('variant')) {
      questions.push(response.response.execute.mboxes.find(el => el.index == 0).options[0].content)
    } else {
      questions.push({
        question: "IS DEFAULT CONTENT REALLY BORING???",
        answers: [
          'yes', 'probably', 'yep', 'nah'
        ]
      })
    }
    
  // add an id to these
  questions.forEach((q, idx) => {
    Object.assign(q, {
      id: idx
    })
  });

  // save the cookies to stay in the same experience!
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);

   res.render("singlequestionreplacement", {
     questions: questions,
     responseOutput: JSON.stringify(response, null, 4),
     visitorState: JSON.stringify(visitorState),
     experienceName: experienceName,
     debug:false
   })
 })
 app.listen(3000, function () {
   console.log("Listening on port 3000 and watching!");
 });


 