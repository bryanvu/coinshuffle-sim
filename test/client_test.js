'use strict';

var should = require('chai').should()
var bitcore = require('bitcore')
var Client = require('../client')


describe('Client', function() {
  
  it('should initialize the main object', function() {
    should.exist(Client)
  })

  it('should be able to create instance with given key and address', function() {
    var c = new Client(
      'cPYsZsVe38k4aVk8DVb1rKxrhcRF6gZRW4uZeNEJBDQKXawcxTHu',
      'mfhaGJVjYGTBw81HtoLQMws9gCn5sknrWz')

    should.exist(c)
    should.exist(c.privKey)
    should.exist(c.pubKey)
    c.inputPrivKey.should.equal('cPYsZsVe38k4aVk8DVb1rKxrhcRF6gZRW4uZeNEJBDQKXawcxTHu')
    c.inputAddress.should.equal('mtUhedGBQ2txSYbH5ZTktdyyi8816m2UM3')
    c.outputAddress.should.equal('mfhaGJVjYGTBw81HtoLQMws9gCn5sknrWz')
  })

  it('should be able to create an output with layered encryption', function() {
    var pubKeys = [
      '025854b06c9c8d4d1431b39063cacee7657abd0f4decdd062696f61d8d16eca517',
      '03dcdf052d27666759e7eaaac88c2d2280c4be21757115161df936fbb03ed7940a'
      ]

    var encryptedOutput =
      Client.encryptOutput(pubKeys, 'mwZPzLSjRxHbhWGDiXvoF8BgyEJZXjooki')


    var wk1 = new bitcore.WalletKey({network: bitcore.networks.testnet})
    wk1.fromObj({priv: 'cQD5McWvaUBKat7JMdY6LZmMBA5damsqS6WyNp5kQttzJUCJvRhe'})

    var wk2 = new bitcore.WalletKey({network: bitcore.networks.testnet})
    wk2.fromObj({priv: 'cPYsZsVe38k4aVk8DVb1rKxrhcRF6gZRW4uZeNEJBDQKXawcxTHu'})

    var decrypted1 = bitcore.ECIES.decrypt(wk1.privKey.private, encryptedOutput)
    var decrypted2 = bitcore.ECIES.decrypt(wk2.privKey.private, decrypted1)

    decrypted2.toString().should.equal('mwZPzLSjRxHbhWGDiXvoF8BgyEJZXjooki')
  })
})