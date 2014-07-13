'use strict';

var Client = require('../client')
var Config = require('../config')
var config = new Config()


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


var clientList = generateClientList()

clientList.forEach(function (client) {
  client.register(100000000, 'http://' + config.shuffle_host + ':' + config.shuffle_port)
})


