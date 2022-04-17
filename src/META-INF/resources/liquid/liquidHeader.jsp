<%@ page import="com.liquid.workspace"%>
<%@ page import="com.liquid.connection"%>
<%@ page import="com.liquid.db"%>
<%@ page import="com.liquid.login"%>
<%@ page import="com.liquid.emailer"%>
<%@ page import="com.liquid.utility"%>
<%@ page import="com.liquid.wsStreamerServer"%>
<%@ page import="java.util.Enumeration" %>
<%@ page import="java.util.Locale" %>
<%@ page import="java.net.InetAddress" %>

<% 
    String path = request.getContextPath(); 
    String jssVersion = workspace.version_string;
    if(workspace.path == null) {
        workspace.path = path;
    }
    String jspath = path;
    // debug ?
    if("CNCONLINE-M".equalsIgnoreCase(InetAddress.getLocalHost().getHostName())) {
        // Non funziona
        // jspath = "/WEB-INF/classes/META-INF/resources";
    }
%>
<!-- -->
<!-- START of Liquid Framework Include Files .. Your Application root is at : "<%= path %>" -->
<!-- -->
<script>
    var glLiquidRoot = "<%=path%>";
</script>
<script src="<%=jspath%>/liquid/ag-grid-enterprise.min.js" type="text/javascript"></script>

<!-- load jQuery 1.12.4 -->
<script src="<%=jspath%>/liquid/jquery-1.12.4.js"></script>
<script src="<%=jspath%>/liquid/jquery-ui.js"></script>
<script type="text/javascript">var jQ1124 = $.noConflict(true);</script>
<link rel="stylesheet" href="<%=jspath%>/liquid/jquery-ui.min.css"/>

<script src="<%=jspath%>/liquid/toastr/toastr.js"></script>
<link href="<%=jspath%>/liquid/toastr/toastr.css" rel="stylesheet" type="text/css" />

<script type="text/javascript" src="<%=jspath%>/liquid/jquery.datetimepicker.js?version=<%=jssVersion%>"></script>
<link rel="stylesheet" href="<%=jspath%>/liquid/jquery.datetimepicker.min.css?version=<%=jssVersion%>" type='text/css' />

<link href="<%=jspath%>/liquid/suneditor/suneditor.min.css?version=<%=jssVersion%>" rel="stylesheet">
<script src="<%=jspath%>/liquid/suneditor/common.js?version=<%=jssVersion%>"></script>
<script src="<%=jspath%>/liquid/suneditor/suneditor.min.js?version=<%=jssVersion%>"></script>

<!-- gunzip -->
<script src="<%=jspath%>/liquid/gunzip.min.js"></script>
<script src="<%=jspath%>/liquid/gzip.min.js"></script>

<!-- date.js -->
<script src="<%=jspath%>/liquid/datejs/date.js"></script>
<!-- Set the CultureInfo to -->
<%
    Enumeration locales = request.getLocales();
    while (locales.hasMoreElements()) {
        Locale locale = (Locale) locales.nextElement();
        if(locale != null) {
            String country = locale.getCountry();
            String variant = locale.getVariant();
            String lang = locale.getLanguage();
            String lang_code = (country != null && !country.isEmpty() ? country : lang ) +"-"+ lang.toUpperCase();
            out.println("<script src=\""+path+"/liquid/datejs/date-"+(lang_code)+".js\"></script>");
            break;
        }
    }
%>


<!-- Popup -->
<link href="<%=jspath%>/liquid/popup/popup.css?version=<%=jssVersion%>" rel="stylesheet">
<script src="<%=jspath%>/liquid/popup/popup.js?version=<%=jssVersion%>"></script>


<link rel="stylesheet" href="<%=jspath%>/liquid/liquid.css?version=<%=jssVersion%>" type='text/css' />
<script type="text/javascript" src="<%=jspath%>/liquid/liquid.js?version=<%=jssVersion%>"></script>


<!-- -->
<!-- END of Liquid Framework include files -->
<!-- -->