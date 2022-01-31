<%@ page 
    language="java" 
    contentType="text/html; charset=iso-8859-1" 
    import="org.json.JSONObject"
    import="org.json.JSONArray"
    import="com.liquid.db"    
    import="com.liquid.connection"
    import="com.liquid.workspace"
    import="com.liquid.worker"
    import="com.liquid.event"
    import="com.liquid.metadata"
    import="com.liquid.utility"
    import="com.liquid.login"
    import="com.liquid.emailer"
    import="com.liquid.ThreadSession"
    import="com.liquid.ColumnsManager"
    errorPage="" 
    %><%!
    %><%

    String operation = request.getParameter("operation");
    String path = request.getContextPath();
    String sJSON = null;

    try {

        // N.B.: Possibile riduzione del carico sul server salvando la sessione solo sui rami necessari (es.: exec)
        ThreadSession.saveThreadSessionInfo ( "Liquid", request, response, out );

        try {
            request.setAttribute("response", response);
        } catch (Exception e) {}

        JSONObject requestjSON = null;
        try {
            sJSON = request.getParameter("jSON");
            if(sJSON == null) 
                sJSON = request.getParameter("JSON");
            if(sJSON != null && !sJSON.isEmpty()) {
                requestjSON = new JSONObject(sJSON);
            }
        } catch (Exception e) {
            out.println( "<br/><center>Error parsing <b>"+(sJSON)+"</b> error:"+e.getMessage()+"</center>" );
        }


        if ("get".equalsIgnoreCase(operation)) {
            // get processed json configuration from the server
            out.print( db.get_table_recordset(request, out) );

        } else if ("getJson".equalsIgnoreCase(operation)) {
            // get the json configuration from the server
            out.print( workspace.get_file_content(request, request.getParameter("fileURL")) );

        } else if ("setJson".equalsIgnoreCase(operation)) {
            // write json configuration to the server
            out.print( workspace.set_file_content(request, out) );

        } else if ("saveToZK".equalsIgnoreCase(operation)) {
            // write .xml to the server
            out.print( workspace.set_zk_content(request, out) );

        } else if ("setLiquidJsonProjectFolder".equalsIgnoreCase(operation)) {
            // Set the working folder of the project (where to save new json configurations)
            out.print( workspace.set_project_folder(request, out) );
            
        } else if ("auto".equalsIgnoreCase(operation)) {
            // get the default json configuration of a control
            out.print( workspace.get_default_json(request, out) );

        } else if ("registerControl".equalsIgnoreCase(operation)) {
            // register a json configuraqtion
            out.print( workspace.get_table_control(request, out) );

        } else if ("exec".equalsIgnoreCase(operation)) {
            // execution of commands, events ...
            try { out.print( event.execute(request, out) ); } catch (Exception e) {}
        
            
            
        // N.B.: Previsto ma non utilizzato : usanto il comando 'SERVER' exec è possibile lanciare l'interprete python
        //          L'uso del campo 'server' del json evita di duplicare codice in js
        //          E' eventualmente possibile lanciare codice python (risiedente su file nel server) da js con executeClientSide
        } else if ("pythonExec".equalsIgnoreCase(operation)) {
            // callbacks n python
            try { out.print( event.pythonExecute(request, out) ); } catch (Exception e) {}
            
            
            
        } else if ("setPrefilter".equalsIgnoreCase(operation)) {
            // validate and set the prefilter (hidden to user)
            out.print( db.set_prefilters(request, out) );

        } else if ("getColumnsManager".equalsIgnoreCase(operation)) {
            // Get the WinX of the columns manager
            out.print( ColumnsManager.get_table_column_windowx_json(request, operation, out) );

        } else if ("setColumnsManager".equalsIgnoreCase(operation)) {
            // Save the columns manager modifications
            out.print( ColumnsManager.set_table_column_windowx_json(request, operation, out) );

        } else if ("countOccurences".equalsIgnoreCase(operation)) {
            // Count the occurences
            out.print( db.count_occurences_by_column(request, operation, out) );


            
        } else if ("login".equalsIgnoreCase(operation)) {
            // Login Service : login
            out.print( login.login(request, response, out) );

        } else if ("logout".equalsIgnoreCase(operation)) {
            // Login Service : logout
            out.print( login.logout(request, response, out) );

        } else if ("register".equalsIgnoreCase(operation)) {
            // Login Service : register user
            out.print( login.register(request, response, out) );

        } else if ("recovery".equalsIgnoreCase(operation)) {
            // Login Service : recovery password
            out.print( login.recovery(request, response, out) );
            
        } else if ("validateEmail".equalsIgnoreCase(operation)) {
            // Login Service : validazione email
            response.sendRedirect( login.validate_email(request, response, out) );

        } else if ("email".equalsIgnoreCase(operation)) {
            // Emailer Service : sending
            out.print( emailer.send(request, response, out) );

            

        } else if ("search".equalsIgnoreCase(operation)) {
            // Search service 
            out.print( metadata.searchOnDatabases(request, out) );

        } else if ("setConnection".equalsIgnoreCase(operation)) {
            // Set a connection to DB
            out.print( connection.setConnectionString(request, out) );

        } else if ("getConnection".equalsIgnoreCase(operation)) {
            // Read a connection to DB
            out.print( connection.getConnectionString(request, out) );

        } else if ("getConnectionDesc".equalsIgnoreCase(operation)) {
            // Get the description of the connection to DB
            out.print( connection.getConnectionDesc(request, out) );



        } else if ("startWorker".equalsIgnoreCase(operation)) {
            // Servizio lettura della connessione
            out.print( worker.start_worker(request, operation, out) );

        } else if ("getWorker".equalsIgnoreCase(operation)) {
            // Get a worker data
            out.print( worker.get_worker(request, operation, out) );

            

        } else if ("setMessageResponse".equalsIgnoreCase(operation)) {
            // Dispatch message service
            if(requestjSON != null) {
                ThreadSession.addIncomingMessage ( requestjSON.getString("response"), requestjSON.getString("cypher") );
            } else {
                out.println( "<br/><center>in <b>setMessageResponse </b> you should set JSON parameter (JSON:"+sJSON+"</center>" );
            }

        } else if ("getSessionId".equalsIgnoreCase(operation)) {
            // Get the session ID
            // Cookie cookie = request.getCookies().get("JSESSIONID");
            String value = request.getRequestedSessionId();
            out.print(value);

        } else if ("setLanguage".equalsIgnoreCase(operation)) {
            // Set the language in the session
            workspace.setLanguage(session, out, request.getParameter("language"));

            
        } else {
            out.println( "<br/><h1><center>Welcome in Liquid ver. "+workspace.version_string+"</center><br/></h1>");
            if(operation != null) {
                out.println("<br/><center>Unknown Command <b>" + (operation.isEmpty() ? "[N/D]" : operation) + "</b></center>");
            }
            out.println( "<br/></br>");
            out.println( "<br/><center><div id=\"WinXContainer\" class=\"liquidWinXContainer\" style=\"width:1024px; height:90px\"></div></center><br/></h1>");
        }
        
    } catch (Throwable th) {
        out.println( "<br/><center>Error in Main Liquid Servlet </b> error:"+th.getMessage()+"</center>" );
        th.printStackTrace();
    } finally {
        ThreadSession.removeThreadSessionInfo ();
    }
    
%>