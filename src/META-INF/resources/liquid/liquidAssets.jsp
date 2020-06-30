<%@ page import="com.liquid.assets"%>
<%@ page import="com.liquid.login"%>
<!-- -->
<!-- START of Liquid Framework Assets Service Files ..  -->
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
        boolean res = assets.read_user_assets_roles ( request, loginId );
        out.println( res ? "// Read user assets roles for loginId:"+loginId+" OK" : "// Read user assets roles for loginId:"+loginId+" FAILED" );
    %>
    glCurrentAsset = [ <%=assets.get_assets(request) %> ];
    
</script>
<!-- -->
<!-- END of Liquid Framework Assets Service Files -->
<!-- -->