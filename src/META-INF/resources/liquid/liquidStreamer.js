var glLiquidWebSocket = null;
var glLiquidWebSocketRunning = false;

if(!isDef(glLiquidAppPort))
    var glLiquidAppPort = null;

var glLiquidWSQueue = [];


var LiquidStreamer = {

    waitForWebSocketTimeoutMS:5000,
    sessionId:"",

    openLiquidStreamer:function() {
        var streamerEnabled = false;


        // debug
        glCurrentAsset.push("StreamerServer");

        if(isDef(glCurrentAsset)) {
            // TODO: check the assests
            if(glCurrentAsset.contains("StreamerServer") || glCurrentAsset.contains("WebSocket")) {
                streamerEnabled = true;
            }
        } else {
            streamerEnabled = true;
        }

        if(streamerEnabled) {

            if(isDef(glLiquidWebSocket)) {
                if (glLiquidWebSocket.readyState !== WebSocket.CLOSED) {
                    return;
                }
            }

            var xhr = new XMLHttpRequest();
            xhr.open('POST', glLiquidServlet + '?operation=getSessionId', false);
            xhr.send();
            if(xhr.status === 200) {
                try {
                    
                    if(xhr.responseText) {
                        
                        // Store the sessionId
                        LiquidStreamer.sessionId = xhr.responseText;                        

                        // LiquidWebSocket = new WebSocket("ws://"+location.hostname+"/"+glLiquidRoot+":"+glLiquidAppPort+"");
                        glLiquidWebSocket = new WebSocket("ws://"+location.hostname+":"+glLiquidAppPort+"");

                        glLiquidWebSocket.binaryType = "arraybuffer";

                        glLiquidWebSocket.onopen = function(event){
                            console.info("[LIQUID Streamer] : Server connected ["+glLiquidWebSocket.readyState+"]");
                        };

                        glLiquidWebSocket.onmessage = function(event){
                            console.info("[LIQUID Streamer] : < "+event.data.length+"bytes");

                            try {
                                
                                var dv = null;
                                var responseBin = "";
                                var responseToken = "";
                                var responseToProcess = "";
                                if ( event.data instanceof ArrayBuffer ) {
                                    dv = new DataView(event.data);
                                    for(var i=0; i<32; i++) {
                                        responseToken.setUint8(i, event.data[i+1]);
                                    }            
                                    for(var i=0; i<event.data.length-1-32; i++) {
                                        responseToProcess.setUint8(i, event.data[i+1+32]);
                                    }
                                    var gunzip = new Zlib.Gunzip(responseToProcess);
                                    LiquidStreamer.queueProcessLiquidStreamer(responseToken, gunzip.decompress());
                                } else {
                                    responseBin = event.data[0];
                                    for(var i=0; i<32; i++) {
                                        responseToken += event.data[i+1];
                                    }            
                                    for(var i=0; i<event.data.length-1-32; i++) {
                                        responseToProcess += event.data[i+1+32];
                                    }
                                    LiquidStreamer.queueProcessLiquidStreamer(responseToken, responseToProcess);
                                }
                                
                            } catch(e) {
                                console.error("[LIQUID Error] : onmessage() : "+e);
                            }
                        };

                        glLiquidWebSocket.onclose = function(event) {
                            if(event.code === 1006) {
                                console.error("[LIQUID Streamer] : Abnormally closed");
                            } else {
                                console.warn("[LIQUID Streamer] : Closed");
                            }
                        };
                        
                        glLiquidWebSocket.onerror = function(event) {
                            console.error("[LIQUID Streamer] : Error :"+event.code);
                        };

                        glLiquidWebSocketRunning = true;
                        
                    } else {
                        console.error("[LIQUID Error] : LiquidStreamer got wrong data getting the sessionId");
                    }
                    
                } catch(e) {
                    console.error("[LIQUID Error] : LiquidStreamer got error : "+e);
                }
            } else {
                console.error("[LIQUID Error] : LiquidStreamer got wrong response getting the sessionId");
            }

        } else {
            console.warn("LIQUID: Streamer is disabled by the user's assets");
        }
    },
    sendLiquidStreamer:function(data, length, queue, async) {
        if(glLiquidWebSocket) {
            if(glLiquidWebSocket.readyState == 0) {
                var dtime = (getCurrentTimetick() - queue.tick) / 1000;
                if(dtime < LiquidStreamer.waitForWebSocketTimeoutMS) {                
                    setTimeout( function() {
                        LiquidStreamer.sendLiquidStreamer(data, length, async);
                    }, 3000 );
                    return 0;
                } else {
                    queue.pending = false;
                    queue.timeout = true;
                    return -1;
                }
            }
            if(glLiquidWebSocket.readyState > 0) {
                return glLiquidWebSocket.send(data, length);
            } else {
                return -1;
            }
        }
    },
    closeLiquidStreamer:function() {
        if(glLiquidWebSocket)
            glLiquidWebSocket.close();
        glLiquidWebSocket = null;
    },
    queueAppendLiquidStreamer:function( token, callback, param, async ) {
        for(var i=0; i<glLiquidWSQueue.length; i++) {
            if(glLiquidWSQueue[i].pending === false) {
                glLiquidWSQueue.splice(glLiquidWSQueue[i]);
                i--;
            }
        }
        var queue = { token:token, callback:callback, param:param, async:async, pending:true, tick:getCurrentTimetick(), timeout:false };
        glLiquidWSQueue.push( queue );
        return queue;
    }
    ,queueProcessLiquidStreamer:function( token, response ){
        for(var i=0; i<glLiquidWSQueue.length; i++) {
            if(glLiquidWSQueue[i].token === token) {
                try {
                    if(isDef(glLiquidWSQueue[i].callback)) {
                        if(glLiquidWSQueue[i].param instanceof LiquidCtrl) {
                            var liquid = glLiquidWSQueue[i].param;
                            if(!isDef(liquid.xhr)) liquid.xhr = { readyState:null, status:null, responseText: null, ws:null };
                            liquid.xhr.readyState = 4;
                            liquid.xhr.status = 200;
                            liquid.xhr.responseText = response;
                            liquid.xhr.ws = true;
                        }                                    
                        glLiquidWSQueue[i].callback(glLiquidWSQueue[i].param);
                    }                
                    glLiquidWSQueue[i].pending = false;
                    return true;
                } catch(e) {
                    console.error("[LIQUID Error] queueLiquidStreamerProcess() : "+e);
                }
            }
        }
        return false;
    },
    generate_token:function(length){
        var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        var b = [];  
        for (var i=0; i<length; i++) {
            var j = (Math.random() * (a.length-1)).toFixed(0);
            b[i] = a[j];
        }
        return b.join("");
    }
}

LiquidStreamer.openLiquidStreamer();

if(LiquidStreamer.glLiquidWebSocketRunning) {
    console.warn("LIQUID: Streamer is activated");
}
