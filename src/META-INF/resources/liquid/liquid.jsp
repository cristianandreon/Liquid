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
    import="com.liquid.ThreadSession"
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


        if (operation != null && operation.equalsIgnoreCase("get")) {
            // lettura dati
            out.print( db.get_table_recordset(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("getJson")) {
            // ritorna il file d i configurazione json nel server
            out.print( workspace.get_file_content(request, request.getParameter("fileURL")) );

        } else if (operation != null && operation.equalsIgnoreCase("setJson")) {
            // ritorna il file d i configurazione json nel server
            out.print( workspace.set_file_content(request, out) );
            
        } else if (operation != null && operation.equalsIgnoreCase("setLiquidJsonProjectFolder")) {
            // Imposta la cartella di salvataggio dei controlli JSON nel progetto
            out.print( workspace.set_project_folder(request, out) );
            
        } else if (operation != null && operation.equalsIgnoreCase("auto")) {
            // configurazione predefinita (crea il wrk "table"."defaul" )
            out.print( workspace.get_default_json(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("registerControl")) {
            // configurazione predefinita (crea il wrk "table"."defaul" )
            out.print( workspace.get_table_control(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("exec")) {
            // callbacks in java
            try { out.print( event.execute(request, out) ); } catch (Exception e) {}
        
        // N.B.: Previsto ma non utilizzato : usanto il comando 'SERVER' exec è possibile lanciare l'interprete python
        //          L'uso del campo 'server' del json evita di duplicare codice in js
        //          E' eventualmente possibile lanciare codice python (risiedente su file nel server) da js con executeClientSide
        } else if (operation != null && operation.equalsIgnoreCase("pythonExec")) {
            // callbacks n python
            try { out.print( event.pythonExecute(request, out) ); } catch (Exception e) {}
            
            
            
        } else if (operation != null && operation.equalsIgnoreCase("setPrefilter")) {
            // Assegnamento e validazione prefiltri
            out.print( db.set_prefilters(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("getColumnsManager")) {
            // Ritorna una WinX Liquid per la gestione delle colonne
            out.print( utility.get_table_column_windowx_json(request, operation, out) );

        } else if (operation != null && operation.equalsIgnoreCase("setColumnsManager")) {
            // Salvataggio dalla gestione delle colonne
            out.print( utility.set_table_column_windowx_json(request, operation, out) );


        } else if (operation != null && operation.equalsIgnoreCase("countOccurences")) {
            // Conteggio occorrenze
            out.print( db.count_occurences_by_column(request, operation, out) );


        } else if (operation != null && operation.equalsIgnoreCase("login")) {
            // Servizio Login : login
            out.print( login.login(request, response, out) );

        } else if (operation != null && operation.equalsIgnoreCase("logout")) {
            // Servizio Login : logout
            out.print( login.logout(request, response, out) );

        } else if (operation != null && operation.equalsIgnoreCase("register")) {
            // Servizio Login : register user
            out.print( login.register(request, response, out) );

        } else if (operation != null && operation.equalsIgnoreCase("recovery")) {
            // Servizio Login : recovery password
            out.print( login.recovery(request, response, out) );
            
        } else if (operation != null && operation.equalsIgnoreCase("validateEmail")) {
            // Servizio Login : validazione password
            response.sendRedirect( login.validate_email(request, response, out) );



        } else if (operation != null && operation.equalsIgnoreCase("search")) {
            // Servizio Ricerca 
            out.print( metadata.searchOnDatabases(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("setConnection")) {
            // Servizio impostazione della connessione
            out.print( connection.setConnectionString(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("getConnection")) {
            // Servizio lettura della connessione
            out.print( connection.getConnectionString(request, out) );

        } else if (operation != null && operation.equalsIgnoreCase("getConnectionDesc")) {
            // Servizio lettura della connessione
            out.print( connection.getConnectionDesc(request, out) );



        } else if (operation != null && operation.equalsIgnoreCase("startWorker")) {
            // Servizio lettura della connessione
            out.print( worker.start_worker(request, operation, out) );

        } else if (operation != null && operation.equalsIgnoreCase("getWorker")) {
            // Servizio lettura della connessione
            out.print( worker.get_worker(request, operation, out) );


        } else if (operation != null && operation.equalsIgnoreCase("setMessageResponse")) {
            // Servizio consegna del messaggio
            if(requestjSON != null) {
                ThreadSession.addIncomingMessage ( requestjSON.getString("response"), requestjSON.getString("cypher") );
            } else {
                out.println( "<br/><center>in <b>setMessageResponse </b> you should set JSON parameter (JSON:"+sJSON+"</center>" );
            }

        } else {
            out.println( "<br/><center>Welcome in Liquid ver. 1.x</center><br/>");
            if(operation != null)
                out.println( "<br/><center>Unknown Command <b>"+( operation.isEmpty() ? "[N/D]" : operation ) +"</b></center>" );
        }
    } catch (Throwable th) {
        out.println( "<br/><center>Error parsing <b>"+(sJSON)+"</b> error:"+th.getMessage()+"</center>" );
        th.printStackTrace();
    } finally {
        ThreadSession.removeThreadSessionInfo ();
    }
    
%>