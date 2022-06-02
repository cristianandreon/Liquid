<%@ page 
    language="java" 
    contentType="text/html; charset=UTF-8"
    import="com.liquid.ThreadSession"
    errorPage=""
    %><%!
    %><%

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

        out.println( "<head>");

        %>

<!-- Start Liquid Engine -->
<%@ include file="../liquid/liquidHeader.jsp" %>

<!-- Strumenti di selezione -->
<%@ include file="/liquid/liquidSelector.jsp" %>

<!-- Servizio websocket -->
<%@ include file="/liquid/liquidStreamer.jsp" %>


<% workspace.enableProjectMode(out); %>

<script>

    /**
     * Render row callback sample
     * @param liquid
     * @param params
     * @returns {*|null}
     */
    function onMyRowRender( liquid, params ) {
        if(params.rowData) {
            var defaultStyle = null; // { backgroundColor: 'lightBlue', color:'black', fontWeight:'bold' };
            return params.rowData["style"] ? params.rowData["style"] : defaultStyle ;
        }
    }
    function statup() {

    }

    function statTail() {
        var tailFile = document.getElementById("tailFile").value;
        if(!tailFile) {
            tailFile = "/opt/jboss-4.0.5.GA/server/default/log/server.log";
        }
        var stopObj = document.getElementById("tailFile.stop");
        stopObj.disabled = false;
        var starObj = document.getElementById("tailFile.start");
        starObj.disabled = true;
        var error = startServerFileTail(tailFile);
        if(error) {
            Liquid.messageBox(null, "Server File Tail", error, function(){}, null)
        }
    }
    function stopTail() {
        stopServerFileTail(tailFile);
        var stopObj = document.getElementById("tailFile.stop");
        stopObj.disabled = true;
        var starObj = document.getElementById("tailFile.start");
        starObj.disabled = false;
    }
    function resetTail() {
        document.getElementById("msgContainer").innerHTML = "";
    }


</script>


<%


        out.println( "</head>");

        out.println( "<body onload=\"statup()\">");


        out.println( "<br/><h1><center>Welcome in Liquid ver. 1.x</center><br/></h1>");
        out.println( "<br/></br>");
        out.println( "<br/><center><div id=\"WinXContainer\" class=\"liquidWinXContainer\" style=\"width:1024px; height:700px; border:1px solid lightgray;\"></div></center><br/></h1>");
        out.println( "<br/>");
        out.println( "<br/>");
        out.println( "<br/>");
        out.println( "<br/><h2><center>Server File Tail</center><br/></h2>");
        out.println( "<br/><center><form id=\"serverFileTail.form\" style=\"width:1024px; height:100px; border:1px solid lightgray;\">");
        out.println( "File to tail: <input id=\"tailFile\" type=\"text\" style=\"width:400px; height:27px;\" placeholder=\"/opt/jboss-4.0.5.GA/server/default/log/server.log\" list=\"serverFileList\"/>");
        out.println( "<datalist id=\"serverFileList\">");
        out.println( "<option value=\"/opt/jboss-4.0.5.GA/server/default/log/server.log\">"+"local"+"</option>");
        out.println( "<option value=\"/opt/applicativi/jboss-4.0.5.GA/server/all_co-1/log/server.log\">"+"site"+"</option>");
        out.println( "</datalist>");
        out.println( "<button id=\"tailFile.start\" type=\"button\" onclick=\"statTail();\">Start tail to console</button>");
        out.println( "<button id=\"tailFile.reset\" type=\"button\" onclick=\"resetTail();\">Reset tail</button>");
        out.println( "<button id=\"tailFile.stop\" disabled type=\"button\" onclick=\"stopTail();\">Stop tail</button>");
        out.println( "</form></center><br/></h1>");
        out.println( "<br/>");
        out.println( "<br/>");
        out.println( "<br/><center><div id=\"msgContainer\" style=\"text-align:left; width:99%; border:1px solid lightgray;\">");



        out.println( "</body>");

    } catch (Throwable th) {
        out.println( "<br/><center></b>Error:"+th.getMessage()+"</center>" );
        th.printStackTrace();
    } finally {
        ThreadSession.removeThreadSessionInfo ();
    }
    
%>