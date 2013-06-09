//constants
var timeUnit = 70, //milliseconds
    initialDelay = 5000,
    maxMessageLength = 300,
    baixoLongo = "____________",  // 12 x _
    altoLongo  = "————————————",  // 12 x —
    baixoCurto = "___",           // 03 x _
    altoCurto  = "———",           // 03 x —
    startBlock = baixoLongo+altoCurto+baixoLongo+altoCurto+baixoLongo,
    translation = {
               'A' : baixoCurto+altoCurto+baixoCurto,
               'B' : baixoLongo+altoCurto+baixoCurto
            };

//globals
var encodedMessage,
    sendBeginTime,
    receiveBeginTime,
    receivedMessage,
    lastDeviceLight,
    lastLightVariation,
    repeatedSignalCount,
    signalsReceived,
    statusLabelElement,
    statusLabelElement2;

//elements
var sendButton,
    receiveButton,
    senderMessageInput,
    receiverMessageInput;

// shim layer with setTimeout fallback
// from http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function lightsOff(){
  document.body.className = "off";
}

function lightsOn(){
  document.body.className = "on";
}

function encodeMessage(msg){
  var result = [];
  for (var i =0; i < msg.length; i++){
    result += (altoLongo + translation[msg[i]]);
  }
  return startBlock + result + altoLongo + startBlock;
}

function startTransmission(){
  var currTime = new Date().getTime();
  var position = parseInt( ( currTime - sendBeginTime ) / timeUnit );
  if(position < encodedMessage.length ){
    requestAnimationFrame(startTransmission);
  }else{
    cancelAnimationFrame(startTransmission);
    statusLabelElement.textContent = "Aaaaaaaaaahhh";
    statusLabelElement2.textContent = "usaram proteção?";
  }
  if (encodedMessage[position] == '_'){
    lightsOff();
  }else{
    lightsOn();
  }
}

function sendMessage(){
  statusLabelElement.textContent = "Mãos à obra!";
  statusLabelElement2.textContent = "oh, yes!";
  var msg = senderMessageInput.value;
  console.log('sendMessage '+msg);
  encodedMessage = encodeMessage(msg);
  console.log('encodedMessage '+encodedMessage);
  setTimeout(function(){
      sendBeginTime = new Date().getTime();
      startTransmission();
  },initialDelay);
}

function computeSignalEnd(){
  var prefix = (receivedMessage[receivedMessage.length-2] == "_") ? "B" : "A";
  var sufix  = (repeatedSignalCount > 6) ? "L" : "C";
  signalsReceived.push(prefix+sufix);
  console.log(signalsReceived);
}

function processReceivedMessage(){
  var stream = signalsReceived.join(',');

  var dataLoadStartIndex =     stream.indexOf('BL,AC,BL,AC,BL') + 'BL,AC,BL,AC,BL'.length;
  var dataLoadEndIndex   = stream.lastIndexOf('BL,AC,BL,AC,BL');

  // console.log(stream);
  // console.log(dataLoadStartIndex);
  // console.log(dataLoadEndIndex);

  if (dataLoadEndIndex > dataLoadStartIndex){
    var datastream = stream.substring(dataLoadStartIndex, dataLoadEndIndex);
    console.log(stream.substring(dataLoadStartIndex, dataLoadEndIndex));
    var pieces = datastream.split(',AL,');
    console.log(pieces);
    receiverMessageInput.value = "";
    for (var i=1; i< pieces.length-1; i++){
      var nexChar = (pieces[i] == "BC,AC,BC") ? 'A' : ((pieces[i] == "BL,AC,BC") ? 'B' : '?')
      receiverMessageInput.value += nexChar;
    }
    statusLabelElement.textContent = "Cópula foi bem sucedida!";
    statusLabelElement2.textContent = "Parabéns pela fertilização.";
  }else{
    console.log("Transfêrencia falhou.");
    statusLabelElement.textContent = "Seu parceiro falhou…";
    statusLabelElement2.textContent = "(isso nunca me aconteceu antes)";
  }


}

function parseLoop(){
  var currTime = new Date().getTime();
  var position = parseInt( ( currTime - receiveBeginTime ) / timeUnit );
  if (receivedMessage.length < position){
    receivedMessage += lastLightVariation;
    console.log(receivedMessage);
    if (receivedMessage[receivedMessage.length-1] == receivedMessage[receivedMessage.length-2]){
      repeatedSignalCount++;
    }else{
      computeSignalEnd();
      repeatedSignalCount = 1;
    }
  }
  if (position > maxMessageLength){
    cancelAnimationFrame(parseLoop);
    processReceivedMessage();
  }else{
    requestAnimationFrame(parseLoop);
  }
}

function receiveMessage(){
  statusLabelElement.textContent = "Eu e vc vc e eu…";
  statusLabelElement2.textContent = "juntinhos!";
  setTimeout(function(){
    receiveBeginTime = new Date().getTime();
    lastDeviceLight = 100;
    signalsReceived = [];
    lastLightVariation = '—';
    console.log('ready to receive');
    receivedMessage = "";
    parseLoop();
  },initialDelay/2);
}

function onDeviceLight(event){
  var delta = event.value - lastDeviceLight;
  lastDeviceLight = event.value;
  lastLightVariation = (delta < -4) ? '_' : ((delta > 4) ? '—' : lastLightVariation);
}

function onDomReady() {
  sendButton = document.getElementById('send_button'),
  receiveButton = document.getElementById('receive_button'),
  senderMessageInput = document.getElementById('dna_sender'),
  receiverMessageInput = document.getElementById('dna_receiver'),
  statusLabelElement = document.getElementById('status_msg'),
  statusLabelElement2 = document.getElementById('secondary_status_msg');

  window.addEventListener("devicelight", onDeviceLight);
  sendButton.addEventListener("click", sendMessage);
  receiveButton.addEventListener("click", receiveMessage);

}

document.addEventListener('readystatechange', function() {
  if (document.readyState == 'interactive') {
    onDomReady();
  }
}, false);
