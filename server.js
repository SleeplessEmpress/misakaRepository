const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/adyenEncrypt', function (req, res) {
  try {
    const data = req.body;
    const version = data.version;
    const card = data.card;
    const encryptionKey = data.encryptionKey;
    const [cardNumber, expiryMonth, expiryYear, cvc] = card.split("|");
    const generationtime = new Date().toISOString();

    const adyenEncrypt = require('node-adyen-encrypt')(version);
    const adyenKey = encryptionKey;

    const options = {};

    const cardData = {
      number: cardNumber,
      generationtime: generationtime
    };

    const cardData1 = {
      expiryMonth: expiryMonth,
      generationtime: generationtime
    };

    const cardData2 = {
      expiryYear: expiryYear,
      generationtime: generationtime
    };

    const cardData3 = {
      cvc: cvc,
      generationtime: generationtime
    };

    const cseInstance = adyenEncrypt.createEncryption(adyenKey, options);

    const encryptedCardNumber = cseInstance.encrypt(cardData);
    const encryptedExpiryMonth = cseInstance.encrypt(cardData1);
    const encryptedExpiryYear = cseInstance.encrypt(cardData2);
    const encryptedSecurityCode = cseInstance.encrypt(cardData3);

    res.json({
      'encryptedCardNumber': encryptedCardNumber,
      'encryptedExpiryMonth': encryptedExpiryMonth,
      'encryptedExpiryYear': encryptedExpiryYear,
      'encryptedSecurityCode': encryptedSecurityCode,
      'Encrypted By': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.post('/adyenSingleEncryption', function (req, res) {
  try {
    const data = req.body;
    const version = data.version;
    const card = data.card;
    const encryptionKey = data.encryptionKey;
    const [number, expiryMonth, expiryYear, cvc] = card.split("|");
    const generationtime = new Date().toISOString();

    function addSpacesToCardNumber(number) {
      const cardNumberWithoutSpaces = number.replace(/\s/g, '');
      const cardNumber = cardNumberWithoutSpaces.replace(/(.{4})/g, '$1 ');
      return cardNumber.trim();
    }

    const cardNumber = addSpacesToCardNumber(number);
    const adyenEncrypt = require('node-adyen-encrypt')(version);
    const adyenKey = encryptionKey;

    const options = {};

    const cardData = {
      number : cardNumber,
      cvc : cvc,
      expiryMonth : expiryMonth,
      expiryYear : expiryYear,
      generationtime : generationtime
    };

    const cseInstance = adyenEncrypt.createEncryption(adyenKey, options);
    const encryptedData = cseInstance.encrypt(cardData);

    res.json({
      'encryptedData': encryptedData,
      'Encrypted By': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.post('/jwtGenerator', function (req, res) {
  try {
    const data = req.body;
    const signingKey = data.signingKey;
    const invoice = data.invoice;

    const jwt = require('jsonwebtoken');

    function genJwt() {

        const header = {
            "alg": "HS256",
            "typ": "JWT"
        };

        const time = Math.floor(Date.now() / 1000);
        
        const payload = {
            'invoice_id': invoice,
            'iat': time,
            'exp': (time + 900)
        };

        const jwtToken = jwt.sign(payload, signingKey, { algorithm: 'HS256', header });

        return jwtToken;
    }

    const jwtToken = genJwt();

    res.json({
      'JWT': jwtToken,
      'Generator by': '@RailgunMisaka',
      'Credits to': '@dhdu283 (Chillz)'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during generation.' });
  }
});

app.post('/recaptchaV2', function (req, res) {
  try {
    const data = req.body;
    const key = data.key;
    const sitekey = data.sitekey;
    const pageurl = data.pageurl;

    const request = require('request');

    let gRecaptchaResponse;
    let retryCount = 0;
    const maxRetries = 100;

    const createTaskOptions = {
      method: 'GET',
      url: 'https://fast-recaptcha-v2-solver.p.rapidapi.com/in.php',
      qs: {
        sitekey: sitekey,
        pageurl: pageurl
      },
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'fast-recaptcha-v2-solver.p.rapidapi.com'
      }
    };

    request(createTaskOptions, function (createTaskError, createTaskResponse, createTaskBody) {

      const taskId = createTaskBody.replace(/^OK\|/, '');

      const getTaskResultOptions = {
        method: 'GET',
        url: 'https://fast-recaptcha-v2-solver.p.rapidapi.com/res.php',
        qs: {
          id: taskId
        },
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'fast-recaptcha-v2-solver.p.rapidapi.com'
        }
      };

      function getTaskResult() {
        request(getTaskResultOptions, function (getTaskResultError, getTaskResultResponse, getTaskResultBody) {
          if (getTaskResultBody.trim() === 'CAPCHA_NOT_READY' && retryCount < maxRetries) {
            retryCount++;
            setTimeout(getTaskResult, 1000);
          } else if (getTaskResultBody.trim() === 'CAPCHA_NOT_READY') {
            res.json({
              'result': 'failure',
              'message': 'Cannot solve reCAPTCHA within the maximum retry limit.',
              'Compiled by': '@RailgunMisaka'
            });
          } else {
            gRecaptchaResponse = getTaskResultBody.replace(/^OK\|/, '');

            res.json({
              'result': 'success',
              'gRecaptchaResponse': gRecaptchaResponse,
              'Compiled by': '@RailgunMisaka'
            });
          }
        });
      }
      getTaskResult();
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during generation.' });
  }
});

app.post('/cloverEncrypt', function (req, res) {
  try {
    const data = req.body;
    const cardNumber = data.cardNumber;

    const NodeRSA = require('node-rsa');

    const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArxHJAejXwDpyWwjsMzL7
    D1WJ/rDCaiqvsiiHZA+8nnVHVD65oWB9HH1O+ONuhhSblWBNKB0YWeA47cS0JisT
    izZAvXHfRNC2Sp9ZnSQvtA67GKPZsTsvOS2AlrExvYHc7ibwVVvLoz/ByJV/N7w5
    lBABmu57aFuIa4GEWPfb677dqnv695D1qlbJwTI+BjPk/OPHXuudYG1bi1uE7goq
    StX/fL6D0joXnzzMzs2ZdUKMAV/zC/kaILlAe5qA1q3aQQfd8h+gkYCskjfOrp38
    abNCe/DFXceq9qQ3R5YkviCxQAZJBZYzD1FjtTsOG7xIV4uoQLJjHzsJaQLkDdrw
    YwIDAQAB
    -----END PUBLIC KEY-----`;

    const key = new NodeRSA();
    key.importKey(rsaPublicKey, 'pkcs8-public-pem');

    const paddedCardNumber = '00000000' + cardNumber;
    const encrypted_pan = key.encrypt(paddedCardNumber, 'base64');

    res.json({
      'encrypted_pan': encrypted_pan,
      'Encrypted by': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
