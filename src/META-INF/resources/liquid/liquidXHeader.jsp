<%@ page import="com.liquid.workspace"%>
<%@ page import="com.liquid.connection"%>
<%@ page import="com.liquid.db"%>
<%@ page import="com.liquid.login"%>
<%@ page import="com.liquid.emailer"%>
<%@ page import="com.liquid.utility"%>

<% String path = request.getContextPath(); %>
<!-- -->
<!-- START of Liquid Framework - Developing version - Include Files .. Your Application root is at : "<%= path %>" -->
<!-- -->
<script>
    var glLiquidRoot = "<%=path%>";
</script>
<script src="<%=path%>/liquid/ag-grid-enterprise.min.js" type="text/javascript"></script>

<script src="<%=path%>/liquid/jquery-1.12.4.js"></script>
<script src="<%=path%>/liquid/jquery-ui.js"></script>
<link rel="stylesheet" href="<%=path%>/liquid/jquery-ui.min.css"/>

<script src="<%=path%>/liquid/toastr/toastr.js"></script>
<link href="<%=path%>/liquid/toastr/toastr.less" rel="stylesheet" type="text/css" />
<link href="<%=path%>/liquid/toastr/toastr.scss" rel="stylesheet" type="text/css" />

<script type="text/javascript" src="<%=path%>/liquid/jquery.datetimepicker.js?version=1.09"></script>
<link rel="stylesheet" href="<%=path%>/liquid/jquery.datetimepicker.min.css?version=1.09" type='text/css' />

<link href="<%=path%>/liquid/suneditor/suneditor.min.css?version=1.09" rel="stylesheet">
<script src="<%=path%>/liquid/suneditor/common.js?version=1.09"></script>
<script src="<%=path%>/liquid/suneditor/suneditor.js?version=1.09"></script>

<!-- -->
<!-- Client side files -->
<!-- -->
<!-- Please NOTE : keeping as runtime liquid.css and liquid.js from developing Project LiquidX , not from your project path : <%=path%> -->
<!-- -->
<script type="text/javascript" >console.log("LIQUID : Please NOTE : keeping as runtime liquid.css and liquid.js from developing Project LiquidX , not from your project path : <%=path%> ");</script>
<link rel="stylesheet" href="/LiquidX/liquid.css?version=1.09" type='text/css' />
<script type="text/javascript" src="/LiquidX/liquid.js?version=1.09"></script>
<!-- -->
<!-- END of Liquid Framework Developing Include Files -->
<!-- -->