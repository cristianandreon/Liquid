<%@ page 
    language="java" 
    contentType="text/html; charset=UTF-8"
    import="javax.servlet.*"
    import="javax.servlet.http.*"
    import="javax.servlet.jsp.*"
    errorPage=""
    %>
<%@ page import="com.liquid.*" %>
<%@ page import="static com.liquid.utility.glDataListCache" %>
<%@ page import="static com.liquid.metadata.metaDataTable" %>
<%!

    %><%

        Info.message = "";

        String act = request.getParameter("act");
        if("resetTableMetadata".equalsIgnoreCase(act)) {
            com.liquid.metadata.invalidateMetadata();
            Info.message += "["+metaDataTable.size()  + " Table metadata cache resetted]";
        }
        if("resetDatalist".equalsIgnoreCase(act)) {
            utility.resetDatalistCache();
            Info.message += "["+glDataListCache.size() + " Datalist resetted]";
        }

    %>
<html>
    <head>
        <title>Liquid Framework Info - developing version - 1.x engine test</title>

        <!-- Start Liquid Engine -->
        <%@ include file="/liquid/liquidXHeader.jsp" %>
        <%@ include file="/liquid/liquidSelector.jsp" %>

        <script>
        </script>
        
        <!-- End Liquid Engine -->

        <style>
            html { overflow-y:hidden;height:100%; }
            body { overflow-y:auto;height:100%; margin:0; padding:0; font-family: Open Sans,Roboto,calibri,sans-serif;
                   /* -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; */
            }
            body::-webkit-scrollbar { width: 8px; height: 8px; }
            body::-webkit-scrollbar-track { border-radius: 8px; }
            body::-webkit-scrollbar-thumb { border-radius: 5px; background: #eeeeee; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }

            #bg { position:absolute; top:0; left:0; width:100%; height:100%; z-index:-1; }

            a { color:#4E90D1; text-decoration:none; font-weight: bold; }
            a:hover { color:#4EBFDD; text-decoration:none; font-weight: bold; }
        </style>
        
    </head>


    <body>
        <center>
        <table border=0 cellspacing=0 cellpadding=10 style="font-size:9pt; table-layout:fixed; ">
             <tr><td colspan="2" style="width: 100%; display:inline-block">
                <div style="display: inline-flex">
                    <%= Info.getInfo(request, response) %>
                </div>
             </td></tr>
             <tr><td colspan="2" style="width: 100%; height:40px;">
                <div style="display: inline-flex">
                    <center><h2><a href="javascript:history.back()">go back</a></center></h2>
                </div>
             </td></tr>
        </table>
        </center>
    </body>
</html>