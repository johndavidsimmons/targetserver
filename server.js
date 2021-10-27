const express = require('express');
const cookieParser = require('cookie-parser');
const TargetClient = require('@adobe/target-nodejs-sdk');
const pug = require('pug');
const dotenv = require('dotenv');
const path = require('path');

// load .env file
dotenv.config();

const CONFIG = {
  propertyToken: process.env.propertyToken,
  client: process.env.client,
  organizationId: process.env.organizationId,
  timeout: 3000,
  // logger: console, // logs target responses to console
};
const targetClient = TargetClient.create(CONFIG);

const app = express();
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

function saveCookie(res, cookie) {
  if (!cookie) {
    return;
  }

  res.cookie(cookie.name, cookie.value, { maxAge: cookie.maxAge * 1000 });
}

const getResponseHeaders = () => ({
  'Content-Type': 'text/html',
  Expires: new Date().toUTCString(),
});

function getAddress(req) {
  return { url: req.headers.host + req.originalUrl };
}

app.get('/', async (req, res) => {
  if (req.query.referrer) {
    const visitorCookie =
      req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
    const targetCookie = req.cookies[TargetClient.TargetCookieName];
    const targetLocationHintCookie =
      req.cookies[TargetClient.TargetLocationHintCookieName];
    const request = {
      execute: {
        mboxes: [
          {
            address: getAddress(req),
            name: 'landerImage',
            profileParameters: {
              country: 'usa',
            },
          },
        ],
      },
    };

    try {
      const response = await targetClient.getOffers({
        request,
        visitorCookie,
        targetCookie,
        targetLocationHintCookie,
      });
      let { visitorState, responseTokens } = response;
      let experienceName = responseTokens[0]['experience.name'];
      let activityName = responseTokens[0]['activity.name'];
      let content = response.response.execute.mboxes[0].options[0].content;
      let src = content.slice(10, -3);

      // save the cookies to stay in the same experience!
      res.set(getResponseHeaders());
      saveCookie(res, response.targetCookie);
      saveCookie(res, response.targetLocationHintCookie);

      res.render('index', {
        title: 'john',
        response: JSON.stringify(response),
        visitorState: JSON.stringify(visitorState),
        content: content,
        experienceName: experienceName,
        activityName: activityName,
        src: src,
      });
    } catch (error) {
      console.error('Target:', error);
    }
  } else {
    res.render('index', {
      title: 'john',
      src: 'rocketlogo.png',
    });
  }
});

app.get('/singlequestionreplacement', async (req, res) => {
  const questions = [
    {
      question: 'What is your favorite Color',
      answers: ['red', 'green', 'blue', 'orange'],
    },
    {
      question: 'FOC do you work for?',
      answers: [
        'rocket homes',
        'rocket loans',
        'rocket mortgage',
        'rocket auto',
      ],
    },
    {
      question: 'What garage do you park in?',
      answers: ['ZLOT', 'OCM', 'Greektown', 'I walk to work'],
    },
  ];

  const visitorCookie =
    req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie =
    req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [
        {
          address: getAddress(req),
          name: 'singleQuestion',
          profileParameters: {
            country: 'usa',
          },
        },
      ],
    },
  };

  const response = await targetClient.getOffers({
    request,
    visitorCookie,
    targetCookie,
    targetLocationHintCookie,
  });
  let { visitorState, responseTokens } = response;
  let experienceName = responseTokens[0]['experience.name'];
  let activityName = responseTokens[0]['activity.name'];

  if (experienceName.toLowerCase().includes('variant')) {
    questions.push(
      response.response.execute.mboxes.find((el) => el.index == 0).options[0]
        .content
    );
  } else {
    questions.push({
      question: 'IS DEFAULT CONTENT REALLY BORING???',
      answers: ['yes', 'probably', 'yep', 'nah'],
    });
  }

  // add an id to these
  questions.forEach((q, idx) => {
    Object.assign(q, {
      id: idx,
    });
  });

  // save the cookies to stay in the same experience!
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);

  res.render('singlequestionreplacement', {
    questions: questions,
    responseOutput: JSON.stringify(response, null, 4),
    visitorState: JSON.stringify(visitorState),
    experienceName: experienceName,
    activityName: activityName,
    debug: false,
  });
});

app.get('/removequestion', async (req, res) => {
  const visitorCookie =
    req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie =
    req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [
        {
          address: getAddress(req),
          name: 'removeQuestion',
          profileParameters: {
            country: 'usa',
          },
        },
      ],
    },
  };

  const response = await targetClient.getOffers({
    request,
    visitorCookie,
    targetCookie,
    targetLocationHintCookie,
  });
  let { visitorState, responseTokens } = response;
  let experienceName = responseTokens[0]['experience.name'];
  let activityName = responseTokens[0]['activity.name'];

  const questions =
    response.response.execute.mboxes[0].options[0].content.questions;
  // add an id to these
  questions.forEach((q, idx) => {
    Object.assign(q, {
      id: idx + 1,
    });
  });

  // save the cookies to stay in the same experience!
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);

  res.render('removequestion', {
    questions: response.response.execute.mboxes[0].options[0].content.questions,
    visitorState: JSON.stringify(visitorState),
    experienceName: experienceName,
    activityName: activityName,
    debug: false,
  });
});

app.get('/addquestion', async (req, res) => {
  const visitorCookie =
    req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie =
    req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [
        {
          address: getAddress(req),
          name: 'addQuestion',
          profileParameters: {
            country: 'usa',
          },
        },
      ],
    },
  };

  const response = await targetClient.getOffers({
    request,
    visitorCookie,
    targetCookie,
    targetLocationHintCookie,
  });
  // console.log(response);
  let { visitorState, responseTokens } = response;
  let experienceName = responseTokens[0]['experience.name'];
  let activityName = responseTokens[0]['activity.name'];

  const questions =
    response.response.execute.mboxes[0].options[0].content.questions;
  // add an id to these
  questions.forEach((q, idx) => {
    Object.assign(q, {
      id: idx + 1,
    });
  });

  // save the cookies to stay in the same experience!
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);

  res.render('addquestion', {
    questions: questions,
    visitorState: JSON.stringify(visitorState),
    experienceName: experienceName,
    activityName: activityName,
    debug: false,
  });
});

app.get('/magictest', async (req, res) => {
  let defaultQuestions = [
    {
      question: 'What is your favorite Color',
      answers: ['red', 'green', 'blue', 'orange'],
    },
    {
      question: 'FOC do you work for?',
      answers: [
        'rocket homes',
        'rocket loans',
        'rocket mortgage',
        'rocket auto',
      ],
    },
    {
      question: 'What garage do you park in?',
      answers: ['ZLOT', 'OCM', 'Greektown', 'I walk to work'],
    },
  ];
  const visitorCookie =
    req.cookies[TargetClient.getVisitorCookieName(CONFIG.organizationId)];
  const targetCookie = req.cookies[TargetClient.TargetCookieName];
  const targetLocationHintCookie =
    req.cookies[TargetClient.TargetLocationHintCookieName];
  const request = {
    execute: {
      mboxes: [
        {
          address: getAddress(req),
          name: 'question1',
          profileParameters: {
            country: 'usa',
          },
        },
        {
          address: getAddress(req),
          name: 'question2',
          profileParameters: {
            country: 'usa',
          },
        },
        {
          address: getAddress(req),
          name: 'question3',
          profileParameters: {
            country: 'usa',
          },
        },
      ],
    },
  };

  const response = await targetClient.getOffers({
    request,
    visitorCookie,
    targetCookie,
    targetLocationHintCookie,
  });

  // console.log(response.response.execute.mboxes);
  let { visitorState, responseTokens } = response;
  let experienceName = responseTokens[0]['experience.name'];
  let activityName = responseTokens[0]['activity.name'];
  const mboxes = response.response.execute.mboxes;
  let testQuestions = mboxes.filter(
    (box) => box.options[0].content != undefined
  );

  let toColor = [];
  if (testQuestions) {
    testQuestions.forEach((question) => {
      switch (question.name) {
        case 'question1':
          defaultQuestions[0] = question.options[0].content.questions[0];
          toColor.push(question.name);
          break;

        case 'question2':
          defaultQuestions[1] = question.options[0].content.questions[0];
          toColor.push(question.name);
          break;

        case 'question3':
          defaultQuestions[2] = question.options[0].content.questions[0];
          toColor.push(question.name);
          break;
      }
    });
  }

  defaultQuestions.forEach((q, idx) => {
    Object.assign(q, {
      id: idx + 1,
    });
  });

  // save the cookies to stay in the same experience!
  res.set(getResponseHeaders());
  saveCookie(res, response.targetCookie);
  saveCookie(res, response.targetLocationHintCookie);

  res.render('magictest', {
    questions: defaultQuestions,
    toColor: toColor,
    visitorState: JSON.stringify(visitorState),
    experienceName: experienceName,
    activityName: activityName,
    debug: false,
  });
});

app.listen(process.env.PORT, function () {
  console.log(
    'Listening on port ' + process.env.PORT.toString() + ' and watching!'
  );
});

// change/swap question
// - pure ab?
// remove question
// -xt controls the hide show/ a/b to redirect
// add question
// -xt controls the addition show/ a/b to redirect
// image
// - by query param
// questions by box
