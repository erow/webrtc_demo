#WEBRTC 是什么
它的全称是WEB Real-time communication。一开始我还以为是一种通信技术。这里的communication主要是人与人之间的，所以它解决了在网页视频、音频的播放和获取的问题。它的目标是希望用户之间直接通信，而不是通过服务器来进行交互。简单地说就是在浏览器上实现视频通话，而且最好不需要中央服务器。

大家应该仔细看看这个[教程][1] ，我希望这篇笔记可以更快地帮助大家理解，说明一下比较容易困惑的点，少走一些弯路，而不是取代这篇教程。

## 核心技术
1. [getUserMedia()][2] : 获取视频和音频。
2. [MediaRecorder][3] : 记录视频和音频。
3. [RTCPeerConnection][4] : 建立视频流。
4. [RTCDataChannel][5] : 建立数据流。

## 实际问题
然而在现实中网络是不通畅的，2个浏览器之间无法直接建立连接，甚至都无法发现对方。为此需要额外的技术来完成连接。
1. [ICE][6] 这个框架应该是嵌入浏览器内部的，我们并不需要了解太多的细节。
2. [signaling][7] 就我的理解，这个相当于媒人，来帮助2个浏览器来建立连接。

## 建立连接
[JSEP][8]：
![JavaScript Session Establishment Protocol][9]

1. 首先创建 RTCPeerConnection 对象，仅仅是初始化。
2. 使用 createOffer/createAnswer 来交换[SDP][10]，sdp中包含网络信息，RTCPeerConnection 对象得以建立连接。
3. 激活onicecandidate完成连接。

WEBRTC没有规定createOffer/createAnswer时使用的协议，因此signaling server 只要可以与浏览器交换SDP即可。可以用socket.io/wensocket等通信技术把createOffer/createAnswer中的SDP给送到对方手里就好了。


----------
下面我将用一个简单的例子来说明连接是如何建立的。
为了更好地说明信号服务器的作用，我把它直接给拿掉了。取而代之的是一块公告牌。
在`sendMessage`和`receiveMsg`中，将要发送的信息写在页面的msg下方。没错，人工复制即可。

1. 首先打开2个页面，一个主动方点击call，另一个被动方点击recv
2. 将caller的消息复制到receiver的answer按钮边上的文本框内，再点击answer。
3. 将receiver的消息复制到caller的answer按钮边上的文本框内，再点击answer。
4. 点击send将send左边的文本发送到对方send右侧的文本框内。

[demo code，人工信号服务器][11]

## 概述：
1. 创建对象 。
2. 绑定回调函数。
    ```
    peerConn = new RTCPeerConnection(pcConfig);
    peerConn.onicecandidate = handleIceCandidate;
    
    dataChannel = peerConn.createDataChannel('1');
    channel.onopen = function() {
    console.log('CHANNEL opened!!!');
      };
    
      channel.onmessage = function(event){
      remoteText.innerText = event.data;
    };
    ```
3. 提供服务：createOffer。 
    这期间要发送offer,candidate消息。
    `peerConn.createOffer(onLocalSessionCreated, logError);`
    在`onLocalSessionCreated`中调用`sendMessage`。
    随后会触发`handleIceCandidate`调用`sendMessage`。 
    
4. 创建应答： createAnswer。
    ```
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);
    ```
    注意，这一步是在receiver端进行的。
    跟createOffer类似，createAnswer会发送一个answer消息，随后发送candidate消息。
5. 添加candidate
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));

6. 连接建立

  [1]: https://www.html5rocks.com/en/tutorials/webrtc/basics/
  [2]: https://webrtc.github.io/samples/src/content/getusermedia/gum/
  [3]: https://webrtc.github.io/samples/src/content/getusermedia/record/
  [4]: https://webrtc.github.io/samples/src/content/peerconnection/pc1/
  [5]: https://webrtc.github.io/samples/src/content/datachannel/basic/
  [6]: https://www.html5rocks.com/en/tutorials/webrtc/basics/#ice
  [7]: https://www.html5rocks.com/en/tutorials/webrtc/basics/#toc-signaling
  [8]: http://tools.ietf.org/html/draft-ietf-rtcweb-jsep-00
  [9]: /img/bVEjXH
  [10]: http://en.wikipedia.org/wiki/Session_Description_Protocol
  [11]: https://github.com/erow/webrtc_demo.git