'use strict';

var bitcore = require('bitcore')
var WalletKey = bitcore.WalletKey
var TransactionBuilder = bitcore.TransactionBuilder
var clientio = require('socket.io-client')
var Config = require('./config')
var config = new Config()
var opts = {network: config.network}

function Client(inputPrivKey, outputAddress, changeAddress) {
  var wk = new WalletKey(opts)
  wk.generate()
  this.wkObj = wk.storeObj()

  var inputWK = new WalletKey(opts)
  inputWK.fromObj({priv: inputPrivKey})
  var inputWKObj = inputWK.storeObj()

  this.privKey = wk.privKey.private
  this.pubKey = this.wkObj.pub
  this.inputPrivKey = inputPrivKey
  this.inputAddress = inputWKObj.addr
  this.outputAddress = outputAddress
  this.changeAddress = changeAddress
}

var disconnect = function(socket) {
  socket.disconnect()
}

Client.prototype.register = function(denomination, serverUrl, callback) {
  var options ={
    transports: ['websocket'],
    'forceNew': true
  };

  var socket = clientio.connect(serverUrl, options)

  var shuffleRequest = {
    pubKey: this.pubKey,
    inputAddress: this.inputAddress,
    changeAddress: this.changeAddress,
    denomination: denomination
  }

  socket.emit('register', shuffleRequest)
  
  socket.on('registration_result', function (result) {
    callback(result)
  })

  var output = this.outputAddress
  socket.on('encrypt_output', function (pubKeys) {
    socket.emit('encrypted_output', Client.encryptOutput(pubKeys, output))
  })

  var privKey = this.privKey
  socket.on('decrypt_and_shuffle_outputs', function (encOutputs) {
    var partiallyDecryptedOutputs = []

    encOutputs.forEach(function (encOutput) {
      try {
        var decryptionResult = bitcore.ECIES.decrypt(privKey, encOutput)

        if (decryptionResult !== '') {
          partiallyDecryptedOutputs.push(decryptionResult)
        }
      } catch (err) {
        //suppress decryption errors resulting frmo all clients trying to decrypt all outputs.
      }
    })

    if (partiallyDecryptedOutputs.length > 0) {
      partiallyDecryptedOutputs = randomizeOrder(partiallyDecryptedOutputs)
      socket.emit('partially_decrypted_outputs', partiallyDecryptedOutputs)
    }
  })

  var signingKey = this.inputPrivKey
  var inputAddress = this.inputAddress
  socket.on('request_transaction_signature', function (signatureRequest) {
    var tx = TransactionBuilder.fromObj(JSON.parse(signatureRequest.transaction))

    if(signatureRequest.inputAddresses[signatureRequest.inputIndex] === inputAddress) {
      tx.sign([signingKey])
      socket.emit('transaction_input_signed', {'transaction': JSON.stringify(tx.toObj()), 'inputIndex': signatureRequest.inputIndex})
    }
  })

  socket.on('shuffle_complete', function() {
    disconnect(socket)
  })
}

Client.encryptOutput = function(pubKeys, output) {
  var encryptedOutput = output

  pubKeys.forEach(function (pubKey) {
    var pub = new Buffer(pubKey, 'hex')

    var encrypted = bitcore.ECIES.encrypt(pub, encryptedOutput)
    encryptedOutput = encrypted
  })

  return encryptedOutput
}

function randomizeOrder(array) {
  var currentIndex = array.length
  var temporaryValue
  var randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


module.exports = Client