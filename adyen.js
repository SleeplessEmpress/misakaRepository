const crypto = require('crypto');

const rsaPublicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArxHJAejXwDpyWwjsMzL7
D1WJ/rDCaiqvsiiHZA+8nnVHVD65oWB9HH1O+ONuhhSblWBNKB0YWeA47cS0JisT
izZAvXHfRNC2Sp9ZnSQvtA67GKPZsTsvOS2AlrExvYHc7ibwVVvLoz/ByJV/N7w5
lBABmu57aFuIa4GEWPfb677dqnv695D1qlbJwTI+BjPk/OPHXuudYG1bi1uE7goq
StX/fL6D0joXnzzMzs2ZdUKMAV/zC/kaILlAe5qA1q3aQQfd8h+gkYCskjfOrp38
abNCe/DFXceq9qQ3R5YkviCxQAZJBZYzD1FjtTsOG7xIV4uoQLJjHzsJaQLkDdrw
YwIDAQAB
-----END PUBLIC KEY-----
`;

const cardNumber = "4334770039928822";

const paddedCardNumber = '00000000' + cardNumber;

const encryptedData = crypto.publicEncrypt({
  key: rsaPublicKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
}, Buffer.from(paddedCardNumber, 'utf-8'));

const encrypted_pan = encryptedData.toString('base64');

console.log(encrypted_pan);