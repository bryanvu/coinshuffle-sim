'use strict';

var bitcore = require('bitcore')
var TransactionBuilder = bitcore.TransactionBuilder
var Peer = bitcore.Peer
var PeerManager = bitcore.PeerManager
var Util = require('../util')
var resetData = require('./reset_data')
var Config = require('../config')
var config = new Config()


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

    var tx = (new TransactionBuilder(opts))
      .setUnspent(unspent)
      .setOutputs(outs)
      .sign(keys)
      .build()

    callback(tx)
  })
}


createReassignTransaction(resetData.poolAddressInfo.address, resetData.clientInfoList,
  function (transaction) {

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




