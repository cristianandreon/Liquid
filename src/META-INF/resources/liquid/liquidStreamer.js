/*
 * Copyright (c) 2021-present, Cristian Andreon. All rights reserved.
 *
 * https://cristianandreon.eu   https://liquid-framework.net
 *
 * You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
 * copy, modify, and distribute this software in source code or binary form for use
 * in connection with the web services and APIs provided by Cristian Andreon.
 *
 * As with any software that integrates with the Cristian Andreon platform, your use of
 * this software is subject to the Cristian Andreon Platform Policy
 * This copyright notice shall be
 * included in all copies or substantial portions of the software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

//  First update 20-10-2020 - Last update  03-04-2021
//  TODO : see trello.com
//
//

var glLiquidWSQueue = [];

var LiquidStreamer = {

    wsQueueBusy:false,
    webSocket:null,
    webSocketRunning:false,
    webSocketConnected:false,

    waitForWebSocketTimeoutMS:5000,
    sessionId:"",
    webSocketName:null,
    webSocketHost:null,
    port:null,

    openLiquidStreamer:function() {
        var streamerEnabled = false;

        // debug
        if(typeof glLiquidCurrentAsset === 'undefined') {
            glLiquidCurrentAsset = [];
        }
        glLiquidCurrentAsset.push("StreamerServer");

        if(isDef(glLiquidCurrentAsset)) {
            // TODO: check the assests
            if(glLiquidCurrentAsset.contains("StreamerServer") || glLiquidCurrentAsset.contains("WebSocket")) {
                streamerEnabled = true;
            }
        } else {
            streamerEnabled = true;
        }

        if(streamerEnabled) {

            if(isDef(LiquidStreamer.webSocket)) {
                if (LiquidStreamer.webSocket.readyState !== WebSocket.CLOSED) {
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

                        if(!isDef(LiquidStreamer.port)) 
                            LiquidStreamer.port = 7373;
                            
                        if(!isDef(LiquidStreamer.webSocketHost)) 
                            LiquidStreamer.webSocketName = "ws://"+location.hostname+":"+LiquidStreamer.port+"";
                        else 
                            LiquidStreamer.webSocketName = "ws://"+LiquidStreamer.webSocketHost+":"+LiquidStreamer.port+"";

                        // LiquidWebSocket = new WebSocket("ws://"+location.hostname+"/"+glLiquidRoot+":"+LiquidStreamer.port+"");
                        LiquidStreamer.webSocket = new WebSocket(LiquidStreamer.webSocketName);

                        LiquidStreamer.webSocket.binaryType = "arraybuffer";

                        LiquidStreamer.webSocket.onopen = function(event){
                            LiquidStreamer.webSocketConnected = true;
                            console.info("[LIQUID Streamer] : Server connected ["+LiquidStreamer.webSocket.readyState+"]");
                        };

                        LiquidStreamer.webSocket.onmessage = function(event){
                            // console.info("[LIQUID Streamer] : < "+event.data.length+"bytes");
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

                        LiquidStreamer.webSocket.onclose = function(event) {
                            if(event.code === 1006) {
                                console.error("[LIQUID Streamer] : Abnormally closed");
                            } else {
                                console.warn("[LIQUID Streamer] : Closed");
                            }
                            LiquidStreamer.webSocketConnected = false;
                        };
                        
                        LiquidStreamer.webSocket.onerror = function(event) {
                            console.error("LIQUID: Streamer is NOT activated");
                            console.error("[LIQUID Streamer] : Error :"+event.code);
                            LiquidStreamer.queueProcessLiquidStreamer(null, null, event);
                            LiquidStreamer.webSocketRunning = false;
                            LiquidStreamer.webSocket = null;
                        };

                        LiquidStreamer.webSocketRunning = true;
                        console.warn("LIQUID: Streamer is activated");

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
        if(LiquidStreamer.webSocket) {
            if(LiquidStreamer.webSocket.readyState === 0) {
                var dtime = (getCurrentTimetick() - queue.tick) / 1000;
                if(dtime < LiquidStreamer.waitForWebSocketTimeoutMS) {                
                    setTimeout( function() {
                        LiquidStreamer.sendLiquidStreamer(data, length, queue, async);
                    }, 3000 );
                    return 0;
                } else {
                    console.error("sendLiquidStreamer() timeout ... maybe StreamerServer not running or invalid url ("+(LiquidStreamer.webSocket ? LiquidStreamer.webSocket.url : "")+")");
                    queue.pending = false;
                    queue.timeout = true;
                    return -1;
                }
            }
            if(LiquidStreamer.webSocket.readyState > 0) {
                return LiquidStreamer.webSocket.send(data, length);
            } else {
                console.error("sendLiquidStreamer() error ... maybe StreamerServer not running");
                return -1;
            }
        }
    },
    closeLiquidStreamer:function() {
        if(LiquidStreamer.webSocket)
            LiquidStreamer.webSocket.close();
        LiquidStreamer.webSocket = null;
    },
    queueAppendLiquidStreamer:function( token, reason, callback, onUploadingProgress, onDownloadingProgress, onCompleted, onFailed, onCancelled, param, async ) {
        if(!LiquidStreamer.wsQueueBusy) {
            LiquidStreamer.wsQueueBusy = true;
            for(var i=0; i<glLiquidWSQueue.length; i++) {
                if(glLiquidWSQueue[i].pending === false) {
                    glLiquidWSQueue.splice(i, 1);
                    i--;
                }
            }
            LiquidStreamer.wsQueueBusy = false;
        }
        var queueItem = { 
            token:token,
            reason:reason,
            callback:callback, 
            onUploadingProgress:onUploadingProgress, onDownloadingProgress:onDownloadingProgress, onCompleted:onCompleted, onFailed:onFailed, onCancelled:onCancelled, 
            param:param,
            async:async,
            pending:true,
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
        LiquidStreamer.wsQueueBusy = true;
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
                                    try {
                                        if(!isDef(liquid.xhr))
                                            liquid.xhr = { readyState:null, status:null, responseText: null, params:{}, event:{}, ws:null };
                                        liquid.xhr.readyState = 4;
                                        liquid.xhr.status = 200;
                                        liquid.xhr.responseText = response;
                                        liquid.xhr.ws = true;

                                        queueItem.callback( liquid, liquid ? liquid.xhr : null, { param:queueItem.param, token:queueItem.token, data:event.data } );
                                    } catch(e) {
                                        console.error("queueProcessLiquidStreamer() error:"+e);
                                    }
 
                                } else {
                                    queueItem.callback( liquid, null, { param:queueItem.param, token:queueItem.token, data:event.data } );
                                }                                 
                            }
                        }
                    }

                    // Connessione continua
                    if(queueItem.async) {
                        bCloseQueue = false;
                    }

                    // Chiusura coda recezione
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
        LiquidStreamer.wsQueueBusy = false;
        
        if(!queueItemFound) {
            console.error("[LIQUID Error] queueLiquidStreamerProcess() : queue item not found .. please use asyn flag to keep reciving queue running");
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
