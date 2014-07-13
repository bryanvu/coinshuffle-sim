'use strict';

var bitcore = require('bitcore')
var networks = bitcore.networks

module.exports = function() {
  switch(process.env.NODE_ENV) {
    case 'production':
      return {
        shuffle_host: '127.0.0.1',
        shuffle_port: 80,
        insight_api_host: '127.0.0.1',
        insight_api_port: '3001',
        network: networks.livenet      }
    default:
      return {
        shuffle_host: '127.0.0.1',
        shuffle_port: 3000,
        insight_api_host: '127.0.0.1',
        insight_api_port: '3001',
        network: networks.testnet,
      }
  }
}