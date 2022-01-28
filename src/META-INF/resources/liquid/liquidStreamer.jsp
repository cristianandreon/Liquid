<%@ page 
    language="java" 
    import="com.liquid.assets"
    import="com.liquid.login"
    import="com.liquid.ThreadSession"
    import="com.liquid.wsStreamerServer"
    errorPage="" 
    %><%!
    %>    
<!-- -->
<!-- START of Liquid Framework Streamer Service (WebSocket) -->
<!-- -->
<%  String streamerLoginId = login.getLoggedID(request);
    
    try {

        // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
        ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

        if(streamerLoginId != null && !streamerLoginId.isEmpty() || wsStreamerServer.applyForAllUsers) {

            // start server if not running
            wsStreamerServer.start(request);

            if(wsStreamerServer.run) {

        %>

                <script src="<%=path%>/liquid/liquidStreamer.js?version=<%=jssVersion%>"></script>
                
                <!-- setup global var -->
                <script>
                    <%
                        try {
                            if(wsStreamerServer.webSocketHost != null) 
                                out.println("LiquidStreamer.webSocketHost = \""+wsStreamerServer.webSocketHost+"\";;");
                            if(wsStreamerServer.port > 0) 
                                out.println("LiquidStreamer.port = "+wsStreamerServer.port+";");
                        } catch(Exception e) {
                            out.println("console.error(\"SERVER ERROR:"+e.getMessage()+"\");");
                        }
                    %>
                </script>
                
                <!-- start the streamer -->
                <script>
                    LiquidStreamer.openLiquidStreamer();

                    if(LiquidStreamer.glLiquidWebSocketRunning) {
                        console.warn("LIQUID: Streamer is activated");
                    }
                </script>
                

        <% } else { %>
                <script>console.warn("LIQUID: Streamer is not running...Please see server log");</script>
        <% }

        } else { %>
            <script>console.warn("LIQUID: Streamer is activater only for logged user");</script>
    <% }

} catch (Throwable th) {
    out.println( "console.error(\"Error in Liquid Streamer Servlet error:"+th.getMessage()+"\");" );
    th.printStackTrace();
} finally {
    ThreadSession.removeThreadSessionInfo ();
}
%>   

<!-- -->
<!-- END of Liquid Framework Streamer Service (WebSocket) -->
<!-- -->