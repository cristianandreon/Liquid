//////////////////////////////////////////////////////////////////////////
//
// Liquid Streamer ver.1.01   Copyright 2020 Cristian Andreon - cristianandreon.eu
//  First update 20-10-2020 - Last update  27-10-2020
//  TODO : see trello.com
//
//
var glLiquidWSQueueBusy = false;
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
        if(!isDef(glCurrentAsset)) {
            glCurrentAsset = [];
        }
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
                                    responseToProcess = gunzip.decompress();
                                } else {
                                    responseBin = event.data[0];
                                    for(var i=0; i<32; i++) {
                                        responseToken += event.data[i+1];
                                    }            
                                    for(var i=0; i<event.data.length-1-32; i++) {
                                        responseToProcess += event.data[i+1+32];
                                    }
                                }
                                LiquidStreamer.queueProcessLiquidStreamer(responseToken, responseToProcess, event);
                                
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
                            LiquidStreamer.queueProcessLiquidStreamer(null, null, event);
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
            if(glLiquidWebSocket.readyState === 0) {
                var dtime = (getCurrentTimetick() - queue.tick) / 1000;
                if(dtime < LiquidStreamer.waitForWebSocketTimeoutMS) {                
                    setTimeout( function() {
                        LiquidStreamer.sendLiquidStreamer(data, length, async);
                    }, 3000 );
                    return 0;
                } else {
                    console.error("sendLiquidStreamer() timeout ... maybe StreamerServer not running");
                    queue.pending = false;
                    queue.timeout = true;
                    return -1;
                }
            }
            if(glLiquidWebSocket.readyState > 0) {
                return glLiquidWebSocket.send(data, length);
            } else {
                console.error("sendLiquidStreamer() error ... maybe StreamerServer not running");
                return -1;
            }
        }
    },
    closeLiquidStreamer:function() {
        if(glLiquidWebSocket)
            glLiquidWebSocket.close();
        glLiquidWebSocket = null;
    },
    queueAppendLiquidStreamer:function( token, reason, callback, onUploadingProgress, onDownloadingProgress, onCompleted, onFailed, onCancelled, param, async ) {
        if(!glLiquidWSQueueBusy) {
            glLiquidWSQueueBusy = true;
            for(var i=0; i<glLiquidWSQueue.length; i++) {
                if(glLiquidWSQueue[i].pending === false) {
                    glLiquidWSQueue.splice(i, 1);
                    i--;
                }
            }
            glLiquidWSQueueBusy = false;
        }
        var queueItem = { 
            token:token,
            reason:reason,
            callback:callback, 
            onUploadingProgress:onUploadingProgress, onDownloadingProgress:onDownloadingProgress, onCompleted:onCompleted, onFailed:onFailed, onCancelled:onCancelled, 
            param:param,
            async:async, pending:true, 
            tick:getCurrentTimetick(), 
            timeout:false 
        };
        // add to the queue
        glLiquidWSQueue.push( queueItem );
        // fire onUploadingProgress
        if(isDef(queueItem.onUploadingProgress)) {
            setTimeout(function() {
                var event = { currentTarget:{ response:""}, loaded:false, total:0, timeStamp:0, eventPhase:0 };
                queueItem.onUploadingProgress(queueItem.param, event);
            }, 50);
        }
        return queueItem;
    }
    ,queueProcessLiquidStreamer:function( token, response, event ){
        var res = false;
        var queueItemFound = false;
        glLiquidWSQueueBusy = true;
        for(var i=0; i<glLiquidWSQueue.length; i++) {
            if(glLiquidWSQueue[i].token === token) {
                var queueItem = glLiquidWSQueue[i];
                queueItemFound = true;
                
                try {                    
                    var bCloseQueue = true;
                    if(event.type === 'message') {
                        // onMessage
                        if(event.data[0] == ' ' || event.data[0] == 'B') {
                            // last response
                            bCloseQueue = true;
                            if(isDef(queueItem.onCompleted)) {
                                var jsEvent = { currentTarget:{ response:response }, loaded:true, total:response.length, timeStamp:0, eventPhase:0 };
                                queueItem.onCompleted(queueItem.param, jsEvent);
                            }
                        } else if(event.data[0] == 'P') {
                            // partial response
                            bCloseQueue = false;
                            if(isDef(queueItem.onDownloadingProgress)) {
                                var jsEvent = { currentTarget:{ response:response }, loaded:true, total:response.length, timeStamp:0, eventPhase:0 };
                                queueItem.onDownloadingProgress(queueItem.param, jsEvent);
                            }
                        } else {
                            console.error("queueProcessLiquidStreamer() unknown rensonse type: '"+event.data[0]+"'");
                        }
                        
                        if(event.data[0] == ' ' || event.data[0] == 'B') {
                            // last response
                            if(isDef(queueItem.callback)) {
                                if(queueItem.param instanceof LiquidCtrl) {
                                    //
                                    // swap xhr to work like ajax (cannot write to readyState ... )
                                    //
                                    var liquid = queueItem.param;
                                    var prevXhr = liquid.xhr;
                                    try {
                                        liquid.xhr = { readyState:null, status:null, responseText: null, ws:null };
                                        liquid.xhr.readyState = 4;
                                        liquid.xhr.status = 200;
                                        liquid.xhr.responseText = response;
                                        liquid.xhr.ws = true;

                                        queueItem.callback(queueItem.param);
                                    } catch(e) {
                                        console.error("queueProcessLiquidStreamer() error:"+e);
                                    }
                                    liquid.xhr = prevXhr;
                                } else {
                                    queueItem.callback(queueItem.param);
                                }                                 
                            }
                        }
                    }
                    if(bCloseQueue) {
                        queueItem.pending = false;
                        queueItem.token = null;
                    }
                    res = true;
                } catch(e) {
                    console.error("[LIQUID Error] queueLiquidStreamerProcess() : "+e);
                }
            }
        }
        glLiquidWSQueueBusy = false;
        
        if(!queueItemFound) {
            console.error("[LIQUID Error] queueLiquidStreamerProcess() : queue item not found");
        }
        
        return res;
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
};

LiquidStreamer.openLiquidStreamer();

if(LiquidStreamer.glLiquidWebSocketRunning) {
    console.warn("LIQUID: Streamer is activated");
}
