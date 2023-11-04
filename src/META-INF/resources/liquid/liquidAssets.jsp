<%@ page 
    language="java"
    import="com.liquid.workspace"
    import="com.liquid.assets"
    import="com.liquid.login"
    import="com.liquid.ThreadSession"
    errorPage="" 
    %>
<%!

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

%>
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


        boolean res = assets.read_user_assets_roles_preferences ( request, loginId );
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