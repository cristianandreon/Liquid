<%@ page 
    language="java" 
    import="com.liquid.ThreadSession"
    import="com.liquid.login"
    import="com.liquid.wsStreamerServer"
    errorPage=""
    %><%!

%>
<!-- -->
<!-- START of Liquid Framework Streamer Service (WebSocket) -->
<!-- -->
<%  String streamerLoginId = login.getLoggedID(request);

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

    try {

        // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
        ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

        if(streamerLoginId != null && !streamerLoginId.isEmpty() || wsStreamerServer.applyForAllUsers) {

            // start server if not running
            wsStreamerServer.start(request);

            if(wsStreamerServer.run) {

        %>

                <script src="<%=workspace.path%>/liquid/liquidStreamer.js?version=<%=workspace.version_string%>"></script>
                
                <!-- setup global var -->
                <script>
                    <%
                        try {
                            if(wsStreamerServer.webSocketHost != null) {
                                out.println("console.info(\"LiquidStreamer.webSocketHost = '"+wsStreamerServer.webSocketHost+"'\");");
                            } else {
                                out.println("console.info(\"LiquidStreamer.webSocketHost = 'localhost'\");");
                            }
                            if(wsStreamerServer.port > 0)
                                out.println("console.info(\"LiquidStreamer.port = "+wsStreamerServer.port+"\");");
                        } catch(Exception e) {
                            out.println("console.error(\"SERVER ERROR:"+e.getMessage()+"\");");
                        }
                    %>
                </script>
                
                <!-- start the streamer -->
                <script>
                    LiquidStreamer.openLiquidStreamer();
                </script>


                <script>
                    /**
                     * Debug function to tail file in the server to console
                     * @param fileName
                     */
                    function startServerFileTail(fileName) {
                        if(LiquidStreamer.webSocketRunning) {
                            LiquidStreamer.lineNumber = 1;
                            if(fileName) {
                                var liquid = null;
                                var paramsObject = { operation:"start_tail", fileName:fileName };
                                var method = null;
                                var url = "liquid.jsp";
                                var async = true;
                                var data = null;
                                var onReadyStateChange = function(param, jsEvent) {
                                };
                                var onUploadingProgress = function(param, jsEvent) {
                                };
                                var onDownloadingProgress = function(param, jsEvent) {
                                };
                                var onCompleted = function(param, jsEvent) {
                                    // console.info("LIQUID SERVER TAIL: onCompleted():"+data);
                                    var data = jsEvent ? jsEvent.currentTarget.response : null;
                                    var p = document.createElement("p");
                                    p.innerText = "["+(LiquidStreamer.lineNumber++)+"] " + data;
                                    if(data.indexOf(" ERROR")>=0) {
                                        p.style.color='darkred';
                                    } else if(data.indexOf(" WARN")>=0) {
                                        p.style.color='darkorange';
                                    } else if(data.indexOf(" INFO")>=0) {
                                        p.style.color='black';
                                    } else if(data.indexOf(" DEBUG")>=0) {
                                        p.style.color='darkgray';
                                    } else {
                                    }
                                    document.getElementById("msgContainer").appendChild(p);
                                };
                                var onFailed = function(param, jsEvent) {
                                    var err = "LIQUID SERVER TAIL: onFailed():"+data;
                                    console.info(err);
                                    return err;
                                };
                                var onCancelled = function(param, jsEvent) {
                                    var err = "LIQUID SERVER TAIL: onCancelled():"+data
                                    console.info(err);
                                    return err;
                                };
                                var reason = "Liquid Server tail start";
                                Liquid.sendRequest(liquid,
                                    paramsObject,
                                    method,
                                    url,
                                    async,
                                    data,
                                    onReadyStateChange,
                                    reason,
                                    onUploadingProgress,
                                    onDownloadingProgress,
                                    onCompleted,
                                    onFailed,
                                    onCancelled
                                );

                            } else {
                                var err = "LIQUID: startServerFileTail(): Invalid file name";
                                console.error(err);
                                return err;
                            }
                        } else {
                            var err = "LIQUID: Streamer is NOT activated";
                            console.error(err);
                            return err;
                        }
                        return "";
                    }
                    function stopServerFileTail() {
                        if(LiquidStreamer.webSocketRunning) {
                            {
                                var liquid = null;
                                var paramsObject = { operation:"stop_tail" };
                                var method = null;
                                var url = "liquid.jsp";
                                var async = false;
                                var data = null;
                                var reason = "Liquid Server tail stop";

                                Liquid.sendRequest(liquid,
                                    paramsObject,
                                    method,
                                    url,
                                    async,
                                    data,
                                    null,
                                    reason,
                                    null,
                                    null,
                                    null,
                                    null,
                                    null
                                );
                            }
                        } else {
                            console.error("LIQUID: Streamer is NOT activated");
                        }
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