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

    const UserAgent = require('user-agents');
    const RiskData = require("adyen-riskData");
    const adyenEncrypt = require('node-adyen-encrypt')(version);
    const adyenKey = encryptionKey;

    function generateRandomUserAgent() {
    const randomUserAgent = new UserAgent();
        return randomUserAgent.toString();
    }
    const randomUserAgent = generateRandomUserAgent();

    let riskDataInstance = new RiskData(
        generateRandomUserAgent(),
        "en-US",
        24,
        4,
        8,
        360,
        640,
        360,
        640,
        -300,
        "America/Chicago",
        "MacIntel"
    );

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
      'clientData': riskDataInstance.generate(),
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
    const holderName = data.holderName;
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
      holderName : holderName,
      expiryMonth : expiryMonth,
      expiryYear : expiryYear,
      generationtime : generationtime
    };

    const cseInstance = adyenEncrypt.createEncryption(adyenKey, options);
    const EncryptedCardData = cseInstance.encrypt(cardData);

    res.json({
      'EncryptedCardData': EncryptedCardData,
      'Encrypted By': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.post('/adyenJWTEncrypt', function (req, res) {
  try {
    const data = req.body;
    const card = data.card;
    const secureFieldsUrl = data.secureFieldsUrl;
    const [number, expiryMonth, expiryYear, cvc] = card.split("|");

    const axios = require('axios');
    const encryptCardData = require('adyen-4.5.0');

    axios.get(secureFieldsUrl)
      .then(response => {
        const originMatches = response.data.match(/var origin = "(.*?)"/);
        const originKeyMatches = response.data.match(/var originKey = "(.*?)"/);
        const adyenKeyMatches = response.data.match(/adyen\.key\s*=\s*"([^"]+)"/);

        if (
          originMatches && originMatches.length > 1 &&
          originKeyMatches && originKeyMatches.length > 1 &&
          adyenKeyMatches && adyenKeyMatches.length > 1
        ) {
          const origin = originMatches[1].trim();
          const originKey = originKeyMatches[1].trim();
          const adyenKey = adyenKeyMatches[1].trim();

          const encryptedData = encryptCardData(number, expiryMonth, expiryYear, cvc, adyenKey, originKey, origin);

          res.json({
            'encryptedData': encryptedData,
            'Encrypted By': '@RailgunMisaka'
          });
        } else {
          res.status(500).json({ error: 'Failed to fetch Adyen keys.' });
        }
      })
      .catch(error => {
        console.error('Error fetching secure fields data.');
        res.status(500).json({ error: 'An error occurred during encryption.' });
      });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.post('/cybersourceFlexV2', async function (req, res) {
  try {
    const data = req.body;
    const card = data.card;
    const capture_context = data.capture_context;
    const [number, expiryMonth, expiryYear, cvc] = card.split("|");
    const cardType = card[0];

    const cyber = require('cs2-encryption');

    const cardTypeMap = {
        '3': cyber.CardTypes.AmericanExpress,
        '4': cyber.CardTypes.Visa,
        '5': cyber.CardTypes.MasterCard
    };

    const brand = cardTypeMap[cardType];

    const cardData = {
        number: number,
        securityCode: cvc,
        expirationMonth: expiryMonth,
        expirationYear: expiryYear,
        type: brand,
    };

    const flexToken = await cyber.encrypt(cardData, capture_context);

    res.json({
      'flexToken': flexToken,
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

app.post('/securepayEncrypt', function (req, res) {
  try {
    const data = req.body;
    const cardNumber = data.cardNumber;
    const cardSecurityCode = data.cardSecurityCode;

    const NodeRSA = require('node-rsa');

    const rsaPublicKey = `-----BEGIN PUBLIC KEY-----
    MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA24gKlX5n/yeOKYOyAQ4L
    CiZtzWrhU3SoHfHBVEYufsMvSA/BQ8M985Foj+LWuM3NleRJVTPptfaVS8Oryr5R
    YlNYxOtUcUw5MeVBbkSRr8k56NY4mN7XTAPHwvol2ZeFUWhPJrzEmvN+eiU1TXJF
    1lqe0CDoYILjb5oAcGzjiPyfUsxYokCR7AWytdIrqjmqqN9QoBiB1QdpABCEwmBF
    h5owOhOrm8l/V9KGScd0+hAXYr+uJrGqh12EUhmc5AL5jZPxtYvdTmutVZOwXhfN
    C1ywIjdsGBnsCKPRlcUunf/J+NbRiPKVepsTGFbu7QrurSmXN/+moBZ/unG4WQSp
    k0RDoFazf7L0X2bIyL1vj7HT3x+IB0F6nKCLiKeUBncxFgbgit2TGEf5IbscFMVM
    CscTQBjh4F/zUw1d1u2DKAvXsrylhk2D3X9T4NM6Bypb+zU0mKVXMv+gMaoYEknO
    m/prohDvY1idfkf0cqhlkEkV7Fe6cV4MxHxuR0ig3yvHjEu5BvO1Slhtc/uumZvH
    KfhC/4dR4ZN5gl/Zqrj8M157fSQP4juvBx/iKThDTSc9a6tW9B9AesY+imV2zxLN
    NbFSrA9E6OXqEJweLSOa+ulJi/Tzs9LtYgg5l3WvuiR2FF5dI8c5JQsMEnrsDwp4
    hzBCevkp7JbUU+b25ZhSa6UCAwEAAQ==
    -----END PUBLIC KEY-----`;

    const key = new NodeRSA();
    key.importKey(rsaPublicKey, 'pkcs8-public-pem');

    const instrument = 'EAAQ' + key.encrypt(cardNumber, 'base64');
    const cvv = 'EAAQ' + key.encrypt(cardSecurityCode, 'base64');

    res.json({
      'instrument': instrument,
      'cvv': cvv,
      'Encrypted by': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.post('/encryptData', function (req, res) {
  try {
    const data = req.body;
    const cardNumber = data.cardNumber;
    const cardSecurityCode = data.cardSecurityCode;
    const publicKey = data.publicKey;

    const NodeRSA = require('node-rsa');

    function formatPEM(publicKey) {

      const PEMHeader = "-----BEGIN PUBLIC KEY-----\n";
      const PEMFooter = "\n-----END PUBLIC KEY-----";
      const keyLength = publicKey.length;
      
      let formattedKey = "";

      for (let i = 0; i < keyLength; i += 64) {
        formattedKey += publicKey.substring(i, Math.min(i + 64, keyLength)) + "\n";
      }
      return PEMHeader + formattedKey + PEMFooter;
    }

    if (cardNumber && cardSecurityCode && publicKey) {
      const PEMKey = formatPEM(publicKey);

      const key = new NodeRSA();
      key.importKey(PEMKey, 'pkcs8-public-pem');

      const encryptedCardNumber = key.encrypt(cardNumber, 'base64');
      const encryptedSecurityCode = key.encrypt(cardSecurityCode, 'base64');

      res.json({
        "encryptedCardNumber": encryptedCardNumber,
        "encryptedSecurityCode": encryptedSecurityCode,
        "Encrypted by": "@RailgunMisaka"
      });
    } else if (cardNumber && publicKey) {
      const PEMKey = formatPEM(publicKey);

      const key = new NodeRSA();
      key.importKey(PEMKey, 'pkcs8-public-pem');

      const encryptedCardNumber = key.encrypt(cardNumber, 'base64');

      res.json({
        "encryptedCardNumber": encryptedCardNumber,
        "Encrypted by": "@RailgunMisaka"
      });
    } else if (cardSecurityCode && publicKey) {
      const PEMKey = formatPEM(publicKey);

      const key = new NodeRSA();
      key.importKey(PEMKey, 'pkcs8-public-pem');

      const encryptedSecurityCode = key.encrypt(cardSecurityCode, 'base64');

      res.json({
        "encryptedSecurityCode": encryptedSecurityCode,
        "Encrypted by": "@RailgunMisaka"
      });
    } else if (!cardNumber && !cardSecurityCode){
      res.json({
          "message": "Please fill the required field. Missing Card Number and Card Security Code.",
          "Encrypted by": "@RailgunMisaka"
        });
    } else if (!publicKey) {
      res.json({
          "message": "Please fill the required field. Missing Public Key.",
          "Encrypted by": "@RailgunMisaka"
        });
    } else {
      res.json({
          "message": "Failed durimh encryption.",
          "Encrypted by": "@RailgunMisaka"
        });
    }
  } catch (error) {
    res.status(500).json({ error: 'There was an error while processing your request' });
  }
});

app.post('/ewayEncrypt', function (req, res) {
  try {
    const data = req.body;
    const cardNumber = data.cardNumber;
    const cardSecurityCode = data.cardSecurityCode;
    const ewayKey = data.ewayKey;
    
    const PUBLIC_KEY_E = b64tohex('AQAB');

    function encryptValueApi(val, key) {
      if (typeof val != 'string') {
        val = val.toString();
      } else if (typeof val == 'string') {
        val = val;
      } else {
        return null;
      }

      var keyToUse = null;
      if (key) keyToUse = b64tohex(key);
      if (!keyToUse) keyToUse = PUBLIC_KEY_N;
      if (keyToUse) {
        var rsa = new RSAKey();
        rsa.setPublic(keyToUse, PUBLIC_KEY_E);
        return rsa.encrypt(val);
      } else
      return null;
    }

    var dbits;

    function BigInteger(a, b, c) {
      if (a != null)
        if ("number" == typeof a) this.fromNumber(a, b, c);
      else if (b == null && "string" != typeof a) this.fromString(a, 256);
      else this.fromString(a, b);
    }

    function nbi() { 
      return new BigInteger(null); 
    }

    function am3(i, x, w, j, c, n) {
      var xl = x & 0x3fff, xh = x >> 14;
      while (--n >= 0) {
        var l = this[i] & 0x3fff;
        var h = this[i++] >> 14;
        var m = xh * l + h * xl;
        l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
        c = (l >> 28) + (m >> 14) + xh * h;
        w[j++] = l & 0xfffffff;
      }

      return c;
    }

    BigInteger.prototype.am = am3;

    dbits = 28;

    BigInteger.prototype.DB = dbits;
    BigInteger.prototype.DM = ((1 << dbits) - 1);
    BigInteger.prototype.DV = (1 << dbits);

    var BI_FP = 52;

    BigInteger.prototype.FV = Math.pow(2, BI_FP);
    BigInteger.prototype.F1 = BI_FP - dbits;
    BigInteger.prototype.F2 = 2 * dbits - BI_FP;

    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
    var BI_RC = new Array();
    var rr, vv;

    rr = "0".charCodeAt(0);
    for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
    rr = "a".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
    rr = "A".charCodeAt(0);
    for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

    function int2char(n) { 
      var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
      return BI_RM.charAt(n); 
    }

    function intAt(s, i) {
      var c = BI_RC[s.charCodeAt(i)];
      return (c == null) ? -1 : c;
    }

    function bnpCopyTo(r) {
      for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
      r.t = this.t;
      r.s = this.s;
    }

    function bnpFromInt(x) {
      this.t = 1;
      this.s = (x < 0) ? -1 : 0;
      if (x > 0) this[0] = x;
      else if (x < -1) this[0] = x + this.DV;
      else this.t = 0;
    }

    function nbv(i) { 
      var r = nbi(); r.fromInt(i);
      return r; 
    }

    function bnpFromString(s, b) {
      var k;
      if (b == 16) k = 4;
      else if (b == 8) k = 3;
      else if (b == 256) k = 8;
      else if (b == 2) k = 1;
      else if (b == 32) k = 5;
      else if (b == 4) k = 2;
      else { this.fromRadix(s, b); return; }
      this.t = 0;
      this.s = 0;
      var i = s.length, mi = false, sh = 0;
      while (--i >= 0) {
        var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
        if (x < 0) {
          if (s.charAt(i) == "-") mi = true;
          continue;
        }
        mi = false;
        if (sh == 0)
          this[this.t++] = x;
        else if (sh + k > this.DB) {
          this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
          this[this.t++] = (x >> (this.DB - sh));
        }
        else
          this[this.t - 1] |= x << sh;
        sh += k;
        if (sh >= this.DB) sh -= this.DB;
      }

      if (k == 8 && (s[0] & 0x80) != 0) {
        this.s = -1;
        if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
      }
      this.clamp();
      if (mi) BigInteger.ZERO.subTo(this, this);
    }

    function bnpClamp() {
      var c = this.s & this.DM;
      while (this.t > 0 && this[this.t - 1] == c) --this.t;
    }

    function bnToString(b) {
      if (this.s < 0) return "-" + this.negate().toString(b);
      var k;
      if (b == 16) k = 4;
      else if (b == 8) k = 3;
      else if (b == 2) k = 1;
      else if (b == 32) k = 5;
      else if (b == 4) k = 2;
      else return this.toRadix(b);
      var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
      var p = this.DB - (i * this.DB) % k;
      if (i-- > 0) {
        if (p < this.DB && (d = this[i] >> p) > 0) { m = true; r = int2char(d); }
        while (i >= 0) {
          if (p < k) {
            d = (this[i] & ((1 << p) - 1)) << (k - p);
            d |= this[--i] >> (p += this.DB - k);
          }
          else {
            d = (this[i] >> (p -= k)) & km;
            if (p <= 0) { p += this.DB; --i; }
          }
          if (d > 0) m = true;
          if (m) r += int2char(d);
        }
      }

      return m ? r : "0";
    }

    function bnNegate() {
      var r = nbi();
      BigInteger.ZERO.subTo(this, r);
      return r;
    }

    function bnAbs() {
      return (this.s < 0) ? this.negate() : this;
    }

    function bnCompareTo(a) {
      var r = this.s - a.s;
      if (r != 0) return r;
      var i = this.t;
      r = i - a.t;
      if (r != 0) return (this.s < 0) ? -r : r;
      while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
      return 0;
    }

    function nbits(x) {
      var r = 1, t;
      if ((t = x >>> 16) != 0) { x = t; r += 16; }
      if ((t = x >> 8) != 0) { x = t; r += 8; }
      if ((t = x >> 4) != 0) { x = t; r += 4; }
      if ((t = x >> 2) != 0) { x = t; r += 2; }
      if ((t = x >> 1) != 0) { x = t; r += 1; }
      return r;
    }

    function bnBitLength() {
      if (this.t <= 0) return 0;
      return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
    }

    function bnpDLShiftTo(n, r) {
      var i;
      for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
      for (i = n - 1; i >= 0; --i) r[i] = 0;
      r.t = this.t + n;
      r.s = this.s;
    }

    function bnpDRShiftTo(n, r) {
      for (var i = n; i < this.t; ++i) r[i - n] = this[i];
      r.t = Math.max(this.t - n, 0);
      r.s = this.s;
    }

    function bnpLShiftTo(n, r) {
      var bs = n % this.DB;
                var cbs = this.DB - bs;
      var bm = (1 << cbs) - 1;
      var ds = Math.floor(n / this.DB), c = (this.s << bs) & this.DM, i;
      for (i = this.t - 1; i >= 0; --i) {
        r[i + ds + 1] = (this[i] >> cbs) | c;
        c = (this[i] & bm) << bs;
      }
      for (i = ds - 1; i >= 0; --i) r[i] = 0;
      r[ds] = c;
      r.t = this.t + ds + 1;
      r.s = this.s;
      r.clamp();
    }

    function bnpRShiftTo(n, r) {
      r.s = this.s;
      var ds = Math.floor(n / this.DB);
      if (ds >= this.t) { r.t = 0; return; }
      var bs = n % this.DB;
      var cbs = this.DB - bs;
      var bm = (1 << bs) - 1;
      r[0] = this[ds] >> bs;
      for (var i = ds + 1; i < this.t; ++i) {
        r[i - ds - 1] |= (this[i] & bm) << cbs;
        r[i - ds] = this[i] >> bs;
      }
      if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
      r.t = this.t - ds;
      r.clamp();
    }

    function bnpSubTo(a, r) {
      var i = 0, c = 0, m = Math.min(a.t, this.t);
      while (i < m) {
      c += this[i] - a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    if (a.t < this.t) {
      c -= a.s;
      while (i < this.t) {
        c += this[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while (i < a.t) {
        c -= a[i];
        r[i++] = c & this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
      r.s = (c < 0) ? -1 : 0;
      if (c < -1) r[i++] = this.DV + c;
      else if (c > 0) r[i++] = c;
      r.t = i;
      r.clamp();
    }

    function bnpMultiplyTo(a, r) {
      var x = this.abs(), y = a.abs();
      var i = x.t;
      r.t = i + y.t;
      while (--i >= 0) r[i] = 0;
      for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
      r.s = 0;
      r.clamp();
      if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
    }

    function bnpSquareTo(r) {
      var x = this.abs();
      var i = r.t = 2 * x.t;
      while (--i >= 0) r[i] = 0;
      for (i = 0; i < x.t - 1; ++i) {
        var c = x.am(i, x[i], r, 2 * i, 0, 1);
        if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
          r[i + x.t] -= x.DV;
          r[i + x.t + 1] = 1;
        }
      }
      if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
      r.s = 0;
      r.clamp();
    }

    function bnpDivRemTo(m, q, r) {
      var pm = m.abs();
      if (pm.t <= 0) return;
      var pt = this.abs();
      if (pt.t < pm.t) {
        if (q != null) q.fromInt(0);
        if (r != null) this.copyTo(r);
        return;
      }
      if (r == null) r = nbi();
      var y = nbi(), ts = this.s, ms = m.s;
      var nsh = this.DB - nbits(pm[pm.t - 1]);
      if (nsh > 0) {
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r); 
      }
      else {
        pm.copyTo(y);
        pt.copyTo(r);
      }
      var ys = y.t;
      var y0 = y[ys - 1];
      if (y0 == 0) return;
      var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
      var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
      var i = r.t, j = i - ys, t = (q == null) ? nbi() : q;
      y.dlShiftTo(j, t);
      if (r.compareTo(t) >= 0) {
        r[r.t++] = 1;
        r.subTo(t, r);
      }
      BigInteger.ONE.dlShiftTo(ys, t);
      t.subTo(y, y);
      while (y.t < ys) y[y.t++] = 0;
      while (--j >= 0) {
        var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
        if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
          y.dlShiftTo(j, t);
          r.subTo(t, r);
          while (r[i] < --qd) r.subTo(t, r);
        }
      }
      if (q != null) {
        r.drShiftTo(ys, q);
        if (ts != ms) BigInteger.ZERO.subTo(q, q);
      }
        r.t = ys;
        r.clamp();
        if (nsh > 0) r.rShiftTo(nsh, r);
        if (ts < 0) BigInteger.ZERO.subTo(r, r);
    }

    function bnMod(a) {
      var r = nbi();
      this.abs().divRemTo(a, null, r);
      if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
      return r;
    }

    function Classic(m) {
      this.m = m;
    }

    function cConvert(x) {
      if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
      else return x;
    }

    function cRevert(x) {
      return x;
    }

    function cReduce(x) {
      x.divRemTo(this.m, null, x);
    }

    function cMulTo(x, y, r) {
      x.multiplyTo(y, r); this.reduce(r);
    }

    function cSqrTo(x, r) {
      x.squareTo(r); this.reduce(r);
    }

    Classic.prototype.convert = cConvert;
    Classic.prototype.revert = cRevert;
    Classic.prototype.reduce = cReduce;
    Classic.prototype.mulTo = cMulTo;
    Classic.prototype.sqrTo = cSqrTo;

    function bnpInvDigit() {
      if (this.t < 1) return 0;
      var x = this[0];
      if ((x & 1) == 0) return 0;
      var y = x & 3;
      y = (y * (2 - (x & 0xf) * y)) & 0xf;
      y = (y * (2 - (x & 0xff) * y)) & 0xff;
      y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff;
      y = (y * (2 - x * y % this.DV)) % this.DV;
      return (y > 0) ? this.DV - y : -y;
    }

    function Montgomery(m) {
      this.m = m;
      this.mp = m.invDigit();
      this.mpl = this.mp & 0x7fff;
      this.mph = this.mp >> 15;
      this.um = (1 << (m.DB - 15)) - 1;
      this.mt2 = 2 * m.t;
    }

    function montConvert(x) {
      var r = nbi();
      x.abs().dlShiftTo(this.m.t, r);
      r.divRemTo(this.m, null, r);
      if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
      return r;
    }

    function montRevert(x) {
      var r = nbi();
      x.copyTo(r);
      this.reduce(r);
      return r;
    }

    function montReduce(x) {
      while (x.t <= this.mt2)
        x[x.t++] = 0;
      for (var i = 0; i < this.m.t; ++i) {
        var j = x[i] & 0x7fff;
        var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
        j = i + this.m.t;
        x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
        while (x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
      }
      x.clamp();
      x.drShiftTo(this.m.t, x);
      if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
    }

    function montSqrTo(x, r) {
      x.squareTo(r);
      this.reduce(r);
    }

    function montMulTo(x, y, r) {
      x.multiplyTo(y, r); this.reduce(r);
    }

    Montgomery.prototype.convert = montConvert;
    Montgomery.prototype.revert = montRevert;
    Montgomery.prototype.reduce = montReduce;
    Montgomery.prototype.mulTo = montMulTo;
    Montgomery.prototype.sqrTo = montSqrTo;

    function bnpIsEven() {
      return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
    }

    function bnpExp(e, z) {
      if (e > 0xffffffff || e < 1) return BigInteger.ONE;
      var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
      g.copyTo(r);
      while (--i >= 0) {
        z.sqrTo(r, r2);
        if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
        else {
          var t = r; r = r2; r2 = t;
        }
      }
      return z.revert(r);
    }

    function bnModPowInt(e, m) {
      var z;
      if (e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
      return this.exp(e, z);
    }

    BigInteger.prototype.copyTo = bnpCopyTo;
    BigInteger.prototype.fromInt = bnpFromInt;
    BigInteger.prototype.fromString = bnpFromString;
    BigInteger.prototype.clamp = bnpClamp;
    BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
    BigInteger.prototype.drShiftTo = bnpDRShiftTo;
    BigInteger.prototype.lShiftTo = bnpLShiftTo;
    BigInteger.prototype.rShiftTo = bnpRShiftTo;
    BigInteger.prototype.subTo = bnpSubTo;
    BigInteger.prototype.multiplyTo = bnpMultiplyTo;
    BigInteger.prototype.squareTo = bnpSquareTo;
    BigInteger.prototype.divRemTo = bnpDivRemTo;
    BigInteger.prototype.invDigit = bnpInvDigit;
    BigInteger.prototype.isEven = bnpIsEven;
    BigInteger.prototype.exp = bnpExp;
    BigInteger.prototype.toString = bnToString;
    BigInteger.prototype.negate = bnNegate;
    BigInteger.prototype.abs = bnAbs;
    BigInteger.prototype.compareTo = bnCompareTo;
    BigInteger.prototype.bitLength = bnBitLength;
    BigInteger.prototype.mod = bnMod;
    BigInteger.prototype.modPowInt = bnModPowInt;
    BigInteger.ZERO = nbv(0);
    BigInteger.ONE = nbv(1);

    function Arcfour() {
      this.i = 0;
      this.j = 0;
      this.S = new Array();
    }

    function ARC4init(key) {
      var i, j, t;
      for (i = 0; i < 256; ++i)
        this.S[i] = i;
      j = 0;
      for (i = 0; i < 256; ++i) {
        j = (j + this.S[i] + key[i % key.length]) & 255;
        t = this.S[i];
        this.S[i] = this.S[j];
        this.S[j] = t;
      }
      this.i = 0;
      this.j = 0;
    }

    function ARC4next() {
      var t;
      this.i = (this.i + 1) & 255;
      this.j = (this.j + this.S[this.i]) & 255;
      t = this.S[this.i];
      this.S[this.i] = this.S[this.j];
      this.S[this.j] = t;
      return this.S[(t + this.S[this.i]) & 255];
    }

    Arcfour.prototype.init = ARC4init;
    Arcfour.prototype.next = ARC4next;

    function prng_newstate() {
      return new Arcfour();
    }

    var rng_psize = 256;
    var rng_state;
    var rng_pool;
    var rng_pptr;

    function rng_seed_int(x) {
      rng_pool[rng_pptr++] ^= x & 255;
      rng_pool[rng_pptr++] ^= (x >> 8) & 255;
      rng_pool[rng_pptr++] ^= (x >> 16) & 255;
      rng_pool[rng_pptr++] ^= (x >> 24) & 255;
      if (rng_pptr >= rng_psize) rng_pptr -= rng_psize;
    }

    function rng_seed_time() {
      rng_seed_int(new Date().getTime());
    }

    if (rng_pool == null) {
      rng_pool = new Array();
      rng_pptr = 0;
      rng_pptr = 0;
      rng_seed_time();
    }

    function rng_get_byte() {
      if (rng_state == null) {
        rng_seed_time();
        rng_state = prng_newstate();
        rng_state.init(rng_pool);
        for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
          rng_pool[rng_pptr] = 0;
        rng_pptr = 0;
      }
      return rng_state.next();
    }

    function rng_get_bytes(ba) {
      var i;
      for (i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
    }

    function SecureRandom() { }

    SecureRandom.prototype.nextBytes = rng_get_bytes;

    function parseBigInt(str, r) {
      return new BigInteger(str, r);
    }

    function pkcs1pad2(s, n) {
      if (n < s.length + 11) {
        return null;
    }

    var ba = new Array();
    var i = s.length - 1;
    while (i >= 0 && n > 0) {
      var c = s.charCodeAt(i--);
      if (c < 128) {
        ba[--n] = c;
      }
      else if ((c > 127) && (c < 2048)) {
        ba[--n] = (c & 63) | 128;
        ba[--n] = (c >> 6) | 192;
      }
      else {
        ba[--n] = (c & 63) | 128;
        ba[--n] = ((c >> 6) & 63) | 128;
        ba[--n] = (c >> 12) | 224;
      }
    }
    ba[--n] = 0;
    var rng = new SecureRandom();
    var x = new Array();
    while (n > 2) {
      x[0] = 0;
      while (x[0] == 0) rng.nextBytes(x);
      ba[--n] = x[0];
    }
    ba[--n] = 2;
    ba[--n] = 0;
    return new BigInteger(ba);
  }

    function RSAKey() {
      this.n = null;
      this.e = 0;
      this.d = null;
      this.p = null;
      this.q = null;
      this.dmp1 = null;
      this.dmq1 = null;
      this.coeff = null;
    }

    function RSASetPublic(N, E) {
      if (N != null && E != null && N.length > 0 && E.length > 0) {
                      this.n = parseBigInt(N, 16);
                      this.e = parseInt(E, 16);
      }
      else return null;
    }

    function RSADoPublic(x) {
      return x.modPowInt(this.e, this.n);
    }

    function RSAEncrypt(text) {
      var m = pkcs1pad2(text, (this.n.bitLength() + 7) >> 3);
      if (m == null) return null;
      var c = this.doPublic(m);
      if (c == null) return null;
      var h = c.toString(16);
      if ((h.length & 1) == 0) return hex2b64(h); else return hex2b64("0" + h);
    }

    RSAKey.prototype.doPublic = RSADoPublic;
    RSAKey.prototype.setPublic = RSASetPublic;
    RSAKey.prototype.encrypt = RSAEncrypt;


    var b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var b64padchar = "=";

    function hex2b64(h) {
      var i;
      var c;
      var ret = "";
      for (i = 0; i + 3 <= h.length; i += 3) {
        c = parseInt(h.substring(i, i + 3), 16);
        ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
      }
      if (i + 1 == h.length) {
        c = parseInt(h.substring(i, i + 1), 16);
        ret += b64map.charAt(c << 2);
      }
      else if (i + 2 == h.length) {
        c = parseInt(h.substring(i, i + 2), 16);
        ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
      }
      while ((ret.length & 3) > 0) ret += b64padchar;
      return ret;
    }

    function b64tohex(s) {
      var ret = ""
      var i;
      var k = 0;
      var slop;
      for (i = 0; i < s.length; ++i) {
        var b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        if (s.charAt(i) == b64padchar) break;
        v = b64map.indexOf(s.charAt(i));
        if (v < 0) continue;
        if (k == 0) {
          ret += int2char(v >> 2);
          slop = v & 3;
          k = 1;
        }
        else if (k == 1) {
          ret += int2char((slop << 2) | (v >> 4));
          slop = v & 0xf;
          k = 2;
        }
        else if (k == 2) {
          ret += int2char(slop);
          ret += int2char(v >> 2);
          slop = v & 3;
          k = 3;
        }
        else {
                          ret += int2char((slop << 2) | (v >> 4));
                          ret += int2char(v & 0xf);
                          k = 0;
        }
      }
      if (k == 1)
        ret += int2char(slop << 2);
      return ret;
    }
    

    const encryptedCardNumber = "eCrypted:" + encryptValueApi(cardNumber, ewayKey);
    const encryptedCardSecurityCode = "eCrypted:" + encryptValueApi(cardSecurityCode, ewayKey);

    res.json({
      'encryptedCardNumber': encryptedCardNumber,
      'encryptedCardSecurityCode': encryptedCardSecurityCode,
      'Encrypted by': '@RailgunMisaka'
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during encryption.' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});