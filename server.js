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

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});