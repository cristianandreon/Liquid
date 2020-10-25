var glLiquidWebSocket = null;
var glLiquidWebSocketRunning = false;

if(!isDef(glLiquidAppPort))
    var glLiquidAppPort = null;
    
function openLiquidStreamer() {
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

        // ws://liquidx:7373/liquidStreamer'
        // LiquidWebSocket = new WebSocket("ws://"+location.hostname+"/"+glLiquidRoot+":"+glLiquidAppPort+"");
        glLiquidWebSocket = new WebSocket("ws://"+location.hostname+":"+glLiquidAppPort+"");


        glLiquidWebSocket.onopen = function(event){
            console.info("[LIQUID Streamer] : Open");
            sendLiquidStreamer("xxx");
        };

        glLiquidWebSocket.onmessage = function(event){
            console.info("[LIQUID Streamer] : data:"+event.data);
        };

        glLiquidWebSocket.onclose = function(event){
            console.info("[LIQUID Streamer] : Closed");
        };

        glLiquidWebSocketRunning = true;

    } else {
        console.warn("LIQUID: Streamer is disabled by the user's assets");
    }
}

function sendLiquidStreamer(data){
    if(glLiquidWebSocket)
        glLiquidWebSocket.send(data);
}

function closeLiquidStreamer(){
    if(glLiquidWebSocket)
        glLiquidWebSocket.close();
    glLiquidWebSocket = null;
}


openLiquidStreamer();

if(glLiquidWebSocketRunning) {
    console.warn("LIQUID: Streamer is activated");
}
