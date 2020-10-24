<%@ page 
    language="java" 
    import="com.liquid.assets"
    import="com.liquid.login"
    import="com.liquid.ThreadSession"
    import="com.liquid.StreamerServer"
    errorPage="" 
    %><%!
    %>
<!-- -->
<!-- START of Liquid Framework Streamer Service (WebSocket) -->
<!-- -->
<script>
    
    //
    // Start the sreamer for logged user
    //
    <%  String streamerLoginId = login.getLoggedID(request);
    
        streamerLoginId = "1";
    
        try {

            // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
            ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

            if(streamerLoginId != null && !streamerLoginId.isEmpty()) {
                
                // start server if not running
                StreamerServer.start(request);

    %>
                var glLiquidWebSocket = null;
                var glLiquidAppPort = <%=StreamerServer.port%>;

                function openLiquidStreamer() {
                    var streamerEnabled = false;

                    if(idDef(liquidAssets)) {
                        // check the assests
                    } else {
                        streamerEnabled = false;
                    }

                    if(streamerEnabled) {
                        if(glLiquidWebSocket !== undefined && glLiquidWebSocket.readyState !== WebSocket.CLOSED){
                            return;
                        }

                        LiquidWebSocket = new WebSocket("ws://"+glLiquidRoot+":"+glLiquidAppPort+"/liquidStreamer");


                        LiquidWebSocket.onopen = function(event){
                            send("xxx");
                        };

                        LiquidWebSocket.onmessage = function(event){
                            console.warn("[LIQUID Streamer] : data:"+event.data);
                        };

                        LiquidWebSocket.onclose = function(event){
                            console.warn("[LIQUID Streamer] : Closed");
                        };
                    }
                }

                function send(data){
                    LiquidWebSocket.send(ata);
                }

                function closeSocket(){
                    LiquidWebSocket.close();
                    LiquidWebSocket = null;
                }


            openLiquidStreamer();
            console.warn("LIQUID: Streamer is activated");

        <% } else { %>
            console.warn("LIQUID: Streamer is activater only for logged user");
        <% }
        
    } catch (Throwable th) {
        out.println( "console.error(\"Error in Liquid Streamer Servlet error:"+th.getMessage()+"\");" );
        th.printStackTrace();
    } finally {
        ThreadSession.removeThreadSessionInfo ();
    }
    %>
   
</script>
<!-- -->
<!-- END of Liquid Framework Streamer Service (WebSocket) -->
<!-- -->