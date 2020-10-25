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
<%  String streamerLoginId = login.getLoggedID(request);
    
    // debug
    streamerLoginId = "1";

    try {

        // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
        ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

        if(streamerLoginId != null && !streamerLoginId.isEmpty()) {

            // start server if not running
            StreamerServer.start(request);

            if(StreamerServer.run) {

        %>

                <script src="<%=path%>/liquid/StreamerServer.js?version=<%=jssVersion%>"></script>

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