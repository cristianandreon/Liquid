<%@ page 
    language="java" 
    contentType="text/html; charset=UTF-8"
    import="org.json.JSONObject"
    import="org.json.JSONArray"
    errorPage=""
    %><%@ page import="com.liquid.*" %><%!
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
            if(!liquid.is_session_expired (request, response, out))
                out.print( db.get_table_recordset(request, out) );

        } else if ("getJson".equalsIgnoreCase(operation)) {
            // get the json configuration from the server
            if(!liquid.is_session_expired (request, response, out))
                out.print( workspace.get_file_content(request, request.getParameter("fileURL")) );

        } else if ("setJson".equalsIgnoreCase(operation)) {
            // write json configuration to the server
            if(!liquid.is_session_expired (request, response, out))
                out.print( workspace.set_file_content(request, out) );

        } else if ("setProjectFolder".equalsIgnoreCase(operation)) {
            // Set the working folder of the project (where to save new json configurations)
            if(!liquid.is_session_expired (request, response, out))
                out.print( workspace.set_project_folder(request, out) );
            
        } else if ("auto".equalsIgnoreCase(operation)) {
            // get the default json configuration of a control
            if(!liquid.is_session_expired (request, response, out))
                out.print( workspace.get_default_json(request, out) );

        } else if ("registerControl".equalsIgnoreCase(operation)) {
            // register a json configuraqtion
            if(!liquid.is_session_expired (request, response, out))
                out.print( workspace.get_table_control(request, out) );

        } else if ("exec".equalsIgnoreCase(operation)) {
            // execution of commands, events ...
            if(!liquid.is_session_expired (request, response, out)) {
                try {
                    out.print(event.execute(request, out));
                } catch (Exception e) {
                }
            }
        
            
            
        // N.B.: Previsto ma non utilizzato : usanto il comando 'SERVER' exec è possibile lanciare l'interprete python
        //          L'uso del campo 'server' del json evita di duplicare codice in js
        //          E' eventualmente possibile lanciare codice python (risiedente su file nel server) da js con executeClientSide
        } else if ("pythonExec".equalsIgnoreCase(operation)) {
            // callbacks n python
            if(!liquid.is_session_expired (request, response, out)) {
                try {
                    out.print(event.pythonExecute(request, out));
                } catch (Exception e) {
                }
            }
            
            
            
        } else if ("setPrefilter".equalsIgnoreCase(operation)) {
            // validate and set the prefilter (hidden to user)
            if(!liquid.is_session_expired (request, response, out))
                out.print( db.set_prefilters(request, out) );

        } else if ("getColumnsManager".equalsIgnoreCase(operation)) {
            // Get the WinX of the columns manager
            if(!liquid.is_session_expired (request, response, out))
                out.print( ColumnsManager.get_table_column_windowx_json(request, operation, out) );

        } else if ("setColumnsManager".equalsIgnoreCase(operation)) {
            // Save the columns manager modifications
            if(!liquid.is_session_expired (request, response, out))
                out.print( ColumnsManager.set_table_column_windowx_json(request, operation, out) );

        } else if ("countOccurences".equalsIgnoreCase(operation)) {
            // Count the occurences
            if(!liquid.is_session_expired (request, response, out))
                out.print( db.count_occurences_by_column(request, operation, out) );


            
        } else if ("login".equalsIgnoreCase(operation)) {
            // Login Service : login
            out.print( login.doLogin(request, response, out) );

        } else if ("logout".equalsIgnoreCase(operation)) {
            // Login Service : logout
            out.print( login.logout(request, response, out) );

        } else if ("register".equalsIgnoreCase(operation)) {
            // Login Service : register user
            if(!liquid.is_session_expired (request, response, out))
                out.print( login.register(request, response, out) );

        } else if ("recovery".equalsIgnoreCase(operation)) {
            // Login Service : recovery password
            if(!liquid.is_session_expired (request, response, out))
                out.print( login.recovery(request, response, out) );
            
        } else if ("validateEmail".equalsIgnoreCase(operation)) {
            // Login Service : validazione email
            if(!liquid.is_session_expired (request, response, out))
                response.sendRedirect( login.validate_email(request, response, out) );

        } else if ("checkEmail".equalsIgnoreCase(operation)) {
            // Login Service : controlla il campo email
            if(!liquid.is_session_expired (request, response, out))
                out.print( login.check_email(request, response, out) );
        } else if ("checkUser".equalsIgnoreCase(operation)) {
            // Login Service : controlla il campo user
            if(!liquid.is_session_expired (request, response, out))
                out.print( login.check_user(request, response, out) );

        } else if ("email".equalsIgnoreCase(operation)) {
            // Emailer Service : sending
            if(!liquid.is_session_expired (request, response, out))
                out.print(emailer.send(request, response, out));

            

        } else if ("search".equalsIgnoreCase(operation)) {
            // Search service 
            if(!liquid.is_session_expired (request, response, out))
                out.print( metadata.searchOnDatabases(request, out) );

        } else if ("setConnection".equalsIgnoreCase(operation)) {
            // Set a connection to DB
            if(!liquid.is_session_expired (request, response, out))
                out.print( connection.setConnectionString(request, out) );

        } else if ("getConnection".equalsIgnoreCase(operation)) {
            // Read a connection to DB
            if(!liquid.is_session_expired (request, response, out))
                out.print( connection.getConnectionString(request, out) );

        } else if ("getConnectionDesc".equalsIgnoreCase(operation)) {
            // Get the description of the connection to DB
            if(!liquid.is_session_expired (request, response, out))
                out.print( connection.getConnectionDesc(request, out) );



        } else if ("startWorker".equalsIgnoreCase(operation)) {
            // Servizio lettura della connessione
            if(!liquid.is_session_expired (request, response, out))
                out.print( worker.start_worker(request, operation, out) );

        } else if ("getWorker".equalsIgnoreCase(operation)) {
            // Get a worker data
            if(!liquid.is_session_expired (request, response, out))
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
            if(!liquid.is_session_expired (request, response, out))
                workspace.setLanguage(session, out, request.getParameter("language"));


            // Servlet DMS : download document content
        } else if ("downloadDocument".equalsIgnoreCase(operation)) {
            if(!liquid.is_session_expired (request, response, out)) {
                String clientData = "content";
                String params = "{\"params\":{\"link\":\"" + (request.getParameter("link") != null ? request.getParameter("link") : "") + "\",\"id\":\"" + (request.getParameter("id") != null ? request.getParameter("id") : "") + "\"}}";
                event.downloadDocument((Object) null, (Object) params, (Object) clientData, (Object) request);
            }

            // Scaricamento immagine da URL
        } else if ("downloadImage".equalsIgnoreCase(operation)) {
            if(!liquid.is_session_expired (request, response, out)) {
                String clientData = "contentBase64";
                String params = "{\"params\":{\"link\":\"" + (request.getParameter("link") != null ? request.getParameter("link") : "") + "\",\"id\":\"" + (request.getParameter("id") != null ? request.getParameter("id") : "") + "\"}}";
                event.downloadDocumentFromURL((Object) null, (Object) params, (Object) clientData, (Object) request);
            }

            // Datalist
        } else if ("getDatalist".equalsIgnoreCase(operation)) {
            out.print(
                    utility.get_datalist_from_table(
                            request.getParameter("inputId"), request.getParameter("databaseSchemaTable"),
                            request.getParameter("codeColumn"), request.getParameter("descColumn"), request.getParameter("tooltipColumn"), request.getParameter("svgColumn"),
                            request.getParameter("where"), request.getParameter("order"),
                            request.getParameter("emptyRow"),
                            request.getParameter("currentValue"),
                            false,
                            false
                    )
            );

        } else if ("saveUIParams".equalsIgnoreCase(operation)) {
            out.print(
                    userPrefs.saveUIParams( request.getParameter("controlId"), workspace.get_request_content(request), request)
                    );

        } else if ("loadUIParams".equalsIgnoreCase(operation)) {
            out.print(
                    userPrefs.loadUIParams( request.getParameter("controlId"), workspace.get_request_content(request), request)
            );

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