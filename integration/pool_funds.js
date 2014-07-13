'use strict';

var bitcore = require('bitcore')
var TransactionBuilder = bitcore.TransactionBuilder
var Peer = bitcore.Peer
var PeerManager = bitcore.PeerManager
var Util = require('../util')
var resetData = require('./reset_data')
var Config = require('../config')
var config = new Config()


var addressInfoList = resetData.outputInfoList
  .concat(resetData.clientInfoList)
  .concat(resetData.changeOutputList)

var addresses = []
var keys = []

addressInfoList.forEach( function (outputInfo) {
  addresses.push(outputInfo.address)
  keys.push(outputInfo.privKey)
})

function createPoolingTransaction(addresses, callback) {
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

    if (totalAmount === 0) {
      throw 'All unspent inputs have zero balances'
    }

    var tx = (new TransactionBuilder(opts))
      .setUnspent(unspent)
      .setOutputs(outs)
      .sign(keys)
      .build()

    callback(tx)
  })
}


createPoolingTransaction(addresses, function (transaction) {
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
})


