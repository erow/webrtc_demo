'use strict';
var isClient = true;
var sendBtn = document.getElementById('send');
var localText = document.querySelector('#localText');
var remoteText = document.querySelector('#remoteText');
var msg=document.querySelector('#msg');
sendBtn.addEventListener('click', function(e){
  try{
  dataChannel.send(localText.value);
  }catch (e) {
    console.log('Failed to send , exception: ' + e.message);
    alert('Failed to send');
    return;
  }
});
var sdp=document.querySelector('#sdp');
document.querySelector('#answer').addEventListener('click',receiveMsg);
// var pcConfig =null;
var pcConfig = {
  'iceServers': [{
    'url': 'stun:stunserver.org'
  }]
};

function sendMessage(message) {
  console.log('Client sending message: ', message);
  if(message.type)
    {
      msg.innerHTML+='<hr><div>'+JSON.stringify(message)+'</div>';
    }
}

function receiveMsg(e)
{
  var message=JSON.parse(sdp.value);
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));
  }
}
// This client receives a message

////////////////////////////////////////////////////


var peerConn;
var dataChannel;
/////////////////////////////////////////////////////////

function createPeerConnection(isInitiator) {
  try {
    peerConn = new RTCPeerConnection(pcConfig);
    peerConn.onicecandidate = handleIceCandidate;
    console.log('Created RTCPeerConnnection');
    isClient=isInitiator;
    if (isInitiator) {
      console.log('Creating Data Channel');
      dataChannel = peerConn.createDataChannel('1');
      onDataChannelCreated(dataChannel);
    
      console.log('Creating an offer');
      peerConn.createOffer(onLocalSessionCreated, logError);
    } else {
      peerConn.ondatachannel = function(event) {
        console.log('ondatachannel:', event.channel);
        dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      };
    }
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
  
}

function onLocalSessionCreated(desc) {
  console.log('local session created:', desc);
  peerConn.setLocalDescription(desc, function() {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  }, logError);
}

function onDataChannelCreated(channel) {
  console.log('onDataChannelCreated:', channel);
  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
  };

  channel.onmessage = function(event){
      remoteText.innerText = event.data;
    };
}


function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}


function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


///////////////////////////////////////////
function logError(err) {
  console.log(err.toString(), err);
}
