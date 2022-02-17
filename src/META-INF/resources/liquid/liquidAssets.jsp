<%@ page 
    language="java"
    import="com.liquid.workspace"
    import="com.liquid.assets"
    import="com.liquid.login"
    import="com.liquid.ThreadSession"
    errorPage="" 
    %>
<%! %>
<!-- -->
<!-- START of Liquid Framework Assets Service Files  -->
<!-- -->
<script>
    
    liquidAssets = '<%=workspace.get_file_content(request, "/liquid/assets/assets.json")%>';
    liquidRoles = '<%=workspace.get_file_content(request, "/liquid/assets/roles.json")%>';
    liquidRolesAssets = '<%=workspace.get_file_content(request, "/liquid/assets/roles_assets.json")%>';
    liquidUsersRoles = '<%=workspace.get_file_content(request, "/liquid/assets/users_roles.json")%>';
    liquidUsersAssets = '<%=workspace.get_file_content(request, "/liquid/assets/users_assets.json")%>';
    liquidLoginUsers = '<%=workspace.get_file_content(request, "/liquid/login/login_users.json")%>';
    
    // Load all roles and asset for userId, typically onLogin
    <%  String loginId = login.getLoggedID(request);
    
    try {
        
        // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
        ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

        boolean res = assets.read_user_assets_roles ( request, loginId );
        out.println( res ? "// Read user assets roles for loginId:"+loginId+" OK" : "// Read user assets roles for loginId:"+loginId+" FAILED" );
        
    } catch (Throwable th) {
        out.println( "<br/><center>Error in Assets Liquid Servlet </b> error:"+th.getMessage()+"</center>" );
        th.printStackTrace();
    } finally {
        ThreadSession.removeThreadSessionInfo ();
    }
    %>
    glLiquidCurrentAsset = [ <%=assets.get_assets(request) %> ];
    
</script>
<!-- -->
<!-- END of Liquid Framework Assets Service Files -->
<!-- -->