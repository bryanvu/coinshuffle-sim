#!/usr/bin/env node
'use strict';

var http = require('http')
var async = require('async')
var bitcore = require('bitcore')
var TransactionBuilder = bitcore.TransactionBuilder
var Peer = bitcore.Peer
var PeerManager = bitcore.PeerManager

var Client = require('./client')
var Util = require('./util')
var resetData = require('./integration/reset_data')

var Config = require('./config')
var config = new Config()

var app = require('./app')
app.set('port', process.env.PORT || 4000)

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
})

var clients = generateClientList()
var io = require('socket.io')(server)
var simSocket = io.of('/sim')

simSocket.on('connection', function (socket) {

  socket.emit('client_list', clients)

  socket.on('request_shuffle', function (dataset) {
    var client = getClientByAddress(clients, dataset.address)
    var shuffleServerUrl = 'http://' + config.shuffle_host + ':' + config.shuffle_port
    client.register(parseInt(dataset.denomination), shuffleServerUrl, function (registrationResult) {
      if (registrationResult.status === 'successful') {
        socket.emit('registration_result', 
          { status: 'successful',
            outputAddress: client.outputAddress 
          })
      } else if (registrationResult.status === 'duplicate') {
        socket.emit('registration_result', 
        {
          status: 'unsuccessful',
          outputAddress: client.outputAddress,
          message: 'Registration unsuccessful: Duplicate registration' 
        })
      }
    })
  })

  socket.on('pool_funds', function() {
    var addressInfoList = resetData.outputInfoList
      .concat(resetData.clientInfoList)
      .concat(resetData.changeOutputList)

    var addresses = []
    var keys = []

    addressInfoList.forEach( function (outputInfo) {
      addresses.push(outputInfo.address)
      keys.push(outputInfo.privKey)
    })

    createPoolingTransaction(addresses, keys, function (err, transaction) {
      if (err) {
        console.log(err)
        socket.emit('pool_funds_error', 'Insufficient funds available for pooling. Please wait for shuffle transaction to propagate.')
      } else {
        var peerman = new PeerManager({
          network: 'testnet'
        })

        peerman.addPeer(new Peer(config.bitcoind_host, config.bitcoind_port))

        peerman.on('connect', function() {
          var conn = peerman.getActiveConnection()
          if (conn) {
            var txid = transaction.getHash().toString('hex')
            console.log('Created transaction with txid ' + txid)
            var raw_tx = transaction.serialize().toString('hex')
            console.log('Transaction raw hex dump:')
            console.log(raw_tx)
            conn.sendTx(transaction)
            setTimeout(function() {
              peerman.stop()
            }, 2000)
          }
        })
        peerman.start()
      }
    })
  })

  socket.on('reset_funds', function() {
    createReassignTransaction(resetData.poolAddressInfo.address, resetData.clientInfoList, function (err, transaction) {
      if (err) {
        socket.emit('reset_funds_error', 'Insufficient funds in pool. Please pool funds and try again.')
      } else {
        var peerman = new PeerManager({
          network: 'testnet'
        })

        peerman.addPeer(new Peer(config.bitcoind_host, config.bitcoind_port))

        peerman.on('connect', function() {
          var conn = peerman.getActiveConnection()
          if (conn) {

            var txid = transaction.getHash().toString('hex')
            console.log('Created transaction with txid ' + txid)
            var raw_tx = transaction.serialize().toString('hex')
            console.log('Transaction raw hex dump:')
            console.log(raw_tx)
            conn.sendTx(transaction)
            setTimeout(function() {
              peerman.stop()
            }, 2000)
          }
        })

        peerman.start()
      }
    })
  })
})

function getClientByAddress(clients, address) {
  var result = null

  clients.forEach( function (client) {
    if (client.inputAddress === address) {
      result = client
    }
  })
  return result
}

function initializeClientsData() {

  var clientPrivKeys = [
    'cPYsZsVe38k4aVk8DVb1rKxrhcRF6gZRW4uZeNEJBDQKXawcxTHu',
    'cQD5McWvaUBKat7JMdY6LZmMBA5damsqS6WyNp5kQttzJUCJvRhe',
    'cNc9Sbn9mowYR4m7U4cxpiPXKpcAMHU94gzxENcxwMHMKKR2u5Xs',
    'cPU1YhimBwKzf6eC6m9wPqn5gbjo2CMF4DtN4s1tXR8zX4TxK1xA',
    'cV3hJizp8sFdfd4tA61nLuusALb5hHBzCZtNpcU5nso2AEPPncg2',
    'cViWZjMyhDe3Az6YFaNVQmgrsTwSbuyx8hyraP5X66B23Endy9f6',
    'cUYZPH7q5GNhNrqXDeqpRvXCDr9tUCcmCDaGBbN7bKpcceDN4rpk',
    'cSW1smqep3zLNRnMg6Um55uC5Ds3DhuQ7nL73dMhVDRaKvt4kwNw',
    'cV8a91QJxBhWCgCsHDECc3uGwoNiQXp4ojD1MKyW9bnV7NrDxEfu',
    'cPLJezqix1W4HnHhKDVPDAg8RvsrqbSAEhAwyNjqZ67CvJtkX4W5'
    ]

  var outputAddresses = [
    'mfhaGJVjYGTBw81HtoLQMws9gCn5sknrWz',
    'mqjCTNuKUcJYBzCQ8hHMiPPmK2dmV1vWjH',
    'msDtXzyP8eAGWSMbyTT35yByodUNf1Zpg4',
    'mvZXkjFD556r5fNUuwFFsPXjKwSe8JVBGd',
    'mjSAtRMtMnMAsz81t4Ra8nmbktEkn95iLK',
    'mzHXgphR655SMgio8oPDkQNJuLq7W1KnZH',
    'muQk3uAak7d3FLKSVL7yoGDzV1YtQg2oqS',
    'mh2nsd6qeZqCimtcDjX5TihGSHPA7s8AwW',
    'n1Te8fxTxyZtWi7Y8QeCCHEHLjPFpriZPn',
    'mwZPzLSjRxHbhWGDiXvoF8BgyEJZXjooki'
    ]

  var changeAddresses = [
    'mx88pbGvfSVwGJUiax7jwjobmrdT48VZ7n',
    'mgqPTUzfKPbS4HzZCbGadphRhN3KtATPmY',
    'mxL1tLNf9EtJakoDkVThveTjQa3Kr3TNHH',
    'n2RTBztTGww6skrTBAsxMj51WWfeu4MDR7',
    'mvHyGRLooD4BovvEKZD6SsaWk5f3B4TWQA',
    'mwhYwJKYMakvfDMA6MxKSypiEtDwBs2Bq3',
    'mh6PBAsgxbyXbnppZ23wT4zCWWSLouVMHV',
    'muZ383LAK4FuGQosYyuGFTMfDcP5XeZGNv',
    'mwLb53ztz8b4VRLs1T8eRt11bjZzc6N6H2',
    'mqDYLYzUSBjKvw2brqEpS3GHsMDrtc7kuX',
  ]

  var clientsData = []

  for(var i=0; i < clientPrivKeys.length; i++) {
    var clientData = {}
    clientData.inputPrivKey = clientPrivKeys[i]
    clientData.outputAddress = outputAddresses[i]
    clientData.changeAddress = changeAddresses[i]
    
    clientsData.push(clientData)
  }

  return clientsData
}

function generateClientList() {
  var clientList = []

  var clientsData = initializeClientsData()
  clientsData.forEach(function (clientData) {
    clientList.push(new Client(clientData.inputPrivKey, clientData.outputAddress, clientData.changeAddress))
  })

  return clientList
}

function createPoolingTransaction(addresses, keys, callback) {
  Util.getInputs(addresses, function (inputList) {
    var totalAmount = 0

    var unspent = []
    inputList.forEach(function (inputs) {
      inputs.forEach(function (input) {
        var amountInBtc = input.amount/100000000

        unspent.push({
          txid: input.txid,
          address: input.address,
          vout: input.index,
          amount: amountInBtc,
          scriptPubKey: input.scriptPubKey,
          confirmations: input.confirmations
        })
        totalAmount += amountInBtc
      })
    })

    var outputAmount = totalAmount - 0.0001
    var outs = [{
      address: resetData.poolAddressInfo.address,
      amount: outputAmount
    }]

    var opts = {
      remainderOut: {
        address: resetData.poolAddressInfo.addresses
      },
      fee: 0.0001,
      spendUnconfirmed: true
    }

    try {
      var tx = (new TransactionBuilder(opts))
        .setUnspent(unspent)
        .setOutputs(outs)
        .sign(keys)
        .build()

        callback(null, tx)
    } catch (err) {
      callback(err)
    }
  })
}

function createReassignTransaction(poolAddress, inputInfoList, callback) {
  var unspent = []
  Util.lookupInputs(poolAddress, function (inputs) {
    inputs.forEach(function (input) {
      unspent.push({
        txid: input.txid,
        address: input.address,
        vout: input.index,
        amount: input.amount/100000000,
        scriptPubKey: input.scriptPubKey,
        confirmations: input.confirmations
      })
    })

    var outs = []

    inputInfoList.forEach( function(outputInfo) {
      outs.push({address: outputInfo.address, amount: outputInfo.amount})
    })

    var opts = {
      remainderOut: { address: resetData.poolAddressInfo.address },
      fee: 0.0001,
      spendUnconfirmed: true
    }

    var keys = [resetData.poolAddressInfo.privKey]

    try {
      var tx = (new TransactionBuilder(opts))
        .setUnspent(unspent)
        .setOutputs(outs)
        .sign(keys)
        .build()

        callback(null, tx)
    } catch (err) {
      callback(err)
    }
  })
}

