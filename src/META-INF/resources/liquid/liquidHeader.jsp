<%@ page import="com.liquid.workspace"%>
<%@ page import="com.liquid.connection"%>
<%@ page import="com.liquid.db"%>
<%@ page import="com.liquid.login"%>
<%@ page import="com.liquid.emailer"%>
<%@ page import="com.liquid.utility"%>

<% 
    String path = request.getContextPath(); 
    String jssVersion = "1.16";
%>
<!-- -->
<!-- START of Liquid Framework Include Files .. Your Application root is at : "<%= path %>" -->
<!-- -->
<script>
    var glLiquidRoot = "<%=path%>";
</script>
<script src="<%=path%>/liquid/ag-grid-enterprise.min.js" type="text/javascript"></script>

<!-- load jQuery 1.12.4 -->
<script src="<%=path%>/liquid/jquery-1.12.4.js"></script>
<script src="<%=path%>/liquid/jquery-ui.js"></script>
<script type="text/javascript">var jQ1124 = $.noConflict(true);</script>
<link rel="stylesheet" href="<%=path%>/liquid/jquery-ui.min.css"/>

<script src="<%=path%>/liquid/toastr/toastr.js"></script>
<link href="<%=path%>/liquid/toastr/toastr.css" rel="stylesheet" type="text/css" />

<script type="text/javascript" src="<%=path%>/liquid/jquery.datetimepicker.js?version=<%=jssVersion%>"></script>
<link rel="stylesheet" href="<%=path%>/liquid/jquery.datetimepicker.min.css?version=<%=jssVersion%>" type='text/css' />

<link href="<%=path%>/liquid/suneditor/suneditor.min.css?version=<%=jssVersion%>" rel="stylesheet">
<script src="<%=path%>/liquid/suneditor/common.js?version=<%=jssVersion%>"></script>
<script src="<%=path%>/liquid/suneditor/suneditor.min.js?version=<%=jssVersion%>"></script>

<link rel="stylesheet" href="<%=path%>/liquid/liquid.css?version=<%=jssVersion%>" type='text/css' />
<script type="text/javascript" src="<%=path%>/liquid/liquid.js?version=<%=jssVersion%>"></script>
<!-- -->
<!-- END of Liquid Framework include files -->
<!-- -->