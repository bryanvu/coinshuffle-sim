/*jshint jquery:true */
/*jshint quotmark:false */
/*global io */
'use strict';


var socket = io('/sim')

socket.on('client_list', function (clients) {
  var addressDetailUrl = 'http://test-insight.bitpay.com/address/'

  $.each(clients, function (index, client) {
    var div = document.createElement("div")
    $(div).addClass("client")
    $(div).attr("id", client.outputAddress)
    $('#main').append(div)

    $(div).append("<span class='wallet_label'>Wallet " + (index + 1) + "</span><br>")
    $(div).append("<span class='address_label'>Input address: </span>")
    $(div).append("<a class='address' target='_blank' href='" + addressDetailUrl + client.inputAddress + "'>" + client.inputAddress + "</span>")
    $(div).append("<br>")
    $(div).append("<span class='address_label'>Change address: </span>")
    $(div).append("<a class='address' target='_blank' href='" + addressDetailUrl + client.changeAddress + "'>" + client.changeAddress + "</span>")
    $(div).append("<br>")
    $(div).append("<span class='address_label'>Output address: </span>")
    $(div).append("<a class='address' target='_blank' href='" + addressDetailUrl + client.outputAddress + "'>" + client.outputAddress + "</span>")
    $(div).append("<br><br>")

    var button1 = $("<button/>", {
      "class": "btn shuffle",
      html: "Request 1 BTC Shuffle",
    })
    button1.attr("data-denomination", 100000000)
    button1.attr("data-address", client.inputAddress)
    $(div).append(button1)

    var button2 = $("<button/>", {
      "class": "btn shuffle",
      html: "Request 0.1 BTC Shuffle",
    })

    $(div).append('&nbsp;&nbsp;&nbsp;')

    button2.attr("data-denomination", 10000000)
    button2.attr("data-address", client.inputAddress)
    $(div).append(button2)
    $(div).append("<br>")
  })

  $( '.shuffle').click( function() {
    socket.emit('request_shuffle', this.dataset)
  })
})

socket.on('registration_result', function (registrationResult) {
  if (registrationResult.status === 'successful') {
    $('#' + registrationResult.outputAddress).addClass("successful")
  } else if (registrationResult.status === 'unsuccessful') {
    $('#' + registrationResult.outputAddress).addClass("unsuccessful")
    alert(registrationResult.message)
  }
})

socket.on('pool_funds_error', function (message) {
  alert(message)
})

socket.on('reset_funds_error', function (message) {
  alert(message)
})

$('#pool_funds').click( function() {
  alert('Pooling funds. May take approximately 30 seconds for unconfirmed transaction to propagate.')
  socket.emit('pool_funds')
})

$('#reset_funds').click( function() {
  alert('Resettings funds. May take approximately 30 seconds for unconfirmed transaction to propagate.')  
  socket.emit('reset_funds')
})
