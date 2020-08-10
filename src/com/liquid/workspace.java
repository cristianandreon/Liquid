package com.liquid;

import com.google.gson.Gson;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.JarURLConnection;
import java.net.URL;
import java.net.URLClassLoader;
import java.net.URLDecoder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import static com.liquid.liquidize.liquidizeJSONContent;
import java.io.IOException;
import java.util.Iterator;


// TODO : support for jump database when using connectioURL

public class workspace {

    static public String GLLang = "EN";
    static public String genesisToken = "";
    static public int classMakeIndex = 1;

   
    static public String sourceSpecialToken = login.getSaltString(32);

    static public String pythonPath = null;
    static public String pythonExecutable = null;

    // key persistent on server but hidden on the client
    static String [] serverPriorityKeys = { "connectionURL", "query" };
    static String kDefinedAtServerSide = "[definedAtServerSide]";
    
    // separator used in controId build from file or database/schema/table
    static String controlIdSeparator = ".";

    static String dateSep = "/";
    static String timeSep = ":";
    
    
    
    static void setDatabaseShemaTable(workspace tbl_wrk) {
        if(tbl_wrk != null) {
            String database = null;
            String schema = null;
            String table = null;
            String schemaTable = "";
            String databaseSchemaTable = "";
            
            try { database = tbl_wrk.tableJson.getString("database"); } catch (Exception e) {  }
            try { schema = tbl_wrk.tableJson.getString("schema"); } catch (Exception e) {  }
            try { table = tbl_wrk.tableJson.getString("table"); } catch (Exception e) {  }
            
            String itemIdString = "\"", tableIdString = "\"";
            if( (tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mysql.")) || tbl_wrk.dbProductName.toLowerCase().contains("mysql")
                    || (tbl_wrk.driverClass != null && tbl_wrk.driverClass.toLowerCase().contains("mariadb.")) || tbl_wrk.dbProductName.toLowerCase().contains("mariadb")) {
                itemIdString = "`";
                tableIdString = "";
            }

            if(schema == null || schema.isEmpty()) {
                schema = tbl_wrk.defaultSchema;
            }
            if(database == null || database.isEmpty()) {
                database = tbl_wrk.defaultDatabase;
            }
            
            if(database != null && !database.isEmpty()) {
                databaseSchemaTable += tableIdString+database+tableIdString;
            }
            if(schema != null && !schema.isEmpty()) {
                schemaTable += tableIdString+schema+tableIdString;
                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+tableIdString+schema+tableIdString;
            }
            if(table != null && !table.isEmpty()) {
                schemaTable += (schemaTable.length()>0?".":"")+tableIdString+table+tableIdString;
                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+tableIdString+table+tableIdString;
            }

            tbl_wrk.schemaTable = schemaTable;
            tbl_wrk.databaseSchemaTable = databaseSchemaTable;
        }
    }

    
    public workspace() {
        try {
            } catch (Throwable ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    static public long maxRows = 100000;
    static public long pageSize = 1000;

    public String controlId = null;
    public String schemaTable = null;
    public String databaseSchemaTable = null;    
    public String defaultDatabase = null;
    public String defaultSchema = null;
    public JSONObject tableJson = null;
    public Object owner = null; 
    public boolean bLocked = false;
    public long timeout;
    public String driverClass = "";
    public String dbProductName = "";
    public String token = "";
    
    public int nConnections = 0;
    public ArrayList<ThreadSession> sessions = new ArrayList<ThreadSession>();
    
    
    static public ArrayList<workspace> glTblWorkspaces = new ArrayList<workspace>();
    
    static public workspace get_tbl_manager_workspace(String controlId) {
        workspace tblWorkspace = null;        
        for(int i=0; i<glTblWorkspaces.size(); i++) {
            tblWorkspace = glTblWorkspaces.get(i);
            if(tblWorkspace.controlId.equalsIgnoreCase(controlId)) {
                return tblWorkspace;
            }
        }        
        return null;    
    }

    static public String dump_tbl_manager_workspace() {
        String outString = "";
        for(int i=0; i<glTblWorkspaces.size(); i++) {
            workspace tblWorkspace = glTblWorkspaces.get(i);
            if(tblWorkspace != null) {
                outString += (outString.length() > 0 ? "," : "") + tblWorkspace.controlId;
            }
        }        
        return outString;    
    }

    static public boolean isTokenValid(String token) {
        if(token != null && !token.isEmpty()) {
            if(token.equals(workspace.genesisToken)) return true;
            for(int i=0; i<glTblWorkspaces.size(); i++) {
                if(token.equals(glTblWorkspaces.get(i).token)) {
                    return true;
                }
            }
        }
        return false;
    }

    
    static public String enableProjectMode() {
        return enableProjectMode( null ) ;
        
    }
    
    
    // Abilita la modalità progettazione
    static public String enableProjectMode( JspWriter out ) {
        try {
            genesisToken = login.getSaltString(32);
            // reset metadata cache
            metadata.invalidateMetadata();
            
            if(out != null) {
                out.print("\n<!-- LIQUID : Enabling Project Mode -->\n");
                out.print("<script>");
                out.print("glLiquidGenesisToken = '" + genesisToken +"';");
                out.print("</script>\n");
            }
            
            return genesisToken;
        } catch (IOException ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return genesisToken;
    }


    // Controllo da file json nel server
    // Controllo da file json nel server : wrappers
    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJsonFile the configuration of the control (file in JSON format)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_control(HttpServletRequest request, String controlId, String sTableJsonFile) throws Throwable {
        return get_table_control(request, controlId, workspace.get_file_content(request, sTableJsonFile, true, true), null, null, null);
    }

    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJsonFile the configuration of the control (file in JSON format)
     * @param  replaceApex  escape all apex (boolean)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_control(HttpServletRequest request, String controlId, String sTableJsonFile, boolean replaceApex) throws Throwable {
        return get_table_control(request, controlId, workspace.get_file_content(request, sTableJsonFile, true, replaceApex), null, null, null);
    }
        
    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJsonFile the configuration of the control (file in JSON format)
     * @param  replaceApex  escape all apex (boolean)
     * @param  owner the class owning the control (String as package.class)
     * @param  returnType the or result, can be "json" or empty for html (String)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_control(HttpServletRequest request, String controlId, String sTableJsonFile, boolean replaceApex, Object owner, String returnType ) throws Throwable {
        return get_table_control(request, controlId, workspace.get_file_content(request, sTableJsonFile, true, false), null, owner, returnType);
    }

    
    // Controllo da jsp (il json viene letto dal body della request)
    static public String get_table_control(HttpServletRequest request, JspWriter out) throws Throwable {
        String controlId = null, sTableJson = null;
        try { controlId = (String) request.getParameter("controlId"); } catch (Exception e) { } 
        try {
            sTableJson = (String)get_request_content(request);
            return workspace.get_table_control(request, controlId, sTableJson, null, null, "json");
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return sTableJson;
    }
    
    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJson the configuration of the control (String in JSON format)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_control_from_string(HttpServletRequest request, String controlId, String sTableJson) throws Throwable {
        return get_table_control(request, controlId, sTableJson, null, null, null);
    }
    
    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJson the configuration of the control (String in JSON format)
     * @param  tableKey used to overwrite table definition in sTableJson (String)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_control_from_string(HttpServletRequest request, String controlId, String sTableJson, String tableKey) throws Throwable {
        return get_table_control(request, controlId, sTableJson, tableKey, null, null);
    }
    /**
     * <h3>Register a control in order to use it in the browser</h3>
     * The controlId argument must specify an absolute control id {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  controlId the Id of the control (String)
     * @param  sTableJson the configuration the control (String in JSON format)
     * @param  owner the class owning the control (String as package.class)
     * @param  returnType the or result, can be "json" or empty for html (String)

     * @return      the image at the specified URL
     * @see         workspace
     */
    static public String get_table_control_from_string(HttpServletRequest request, String controlId, String sTableJson, Object owner, String returnType) throws Throwable {
    	return get_table_control(request, controlId, sTableJson, controlId, owner, returnType);
    }


    
    /**
     * <h3>Register all controls in a folder</h3>
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  sFolder the folder name where reads control's json files (String)
     * @param  bLaunch if true append to the list of the controls to render on web page load (boolean)

     * @return      the validated control json
     * @see         workspace
     */
    static public String get_table_controls_in_folder(HttpServletRequest request, String sFolder, boolean bLaunch) throws Throwable {
        String out_string = "";
        try {
            boolean replaceApex = true;
            Object owner = null;
            String returnType = "js";
            ServletContext servletContext = request.getSession().getServletContext();
            String absoluteFilePathRoot = utility.strip_last_slash(servletContext.getRealPath("/"));
            File relativePath = new File(absoluteFilePathRoot+(!sFolder.endsWith(File.separator) ? File.separator:"")+sFolder);
            String absolutePath = relativePath.getCanonicalPath();                
            final File folder = new File(absolutePath);
            List<String> controlIds = new ArrayList<>();
            List<String> result = new ArrayList<>();
            search(".*\\.json", folder, result);
            out_string += "\n<!-- LIQUID : loading "+result.size()+" control(s) in the folder : "+sFolder+" -->\n";
            for(String s : result) {
                Path path = Paths.get(s);
                Path fileName = path.getFileName();         
                String sTableJsonFile = s;
                String controlId = getControlIdFromFile(fileName.toString());
                if(utility.contains(controlIds, controlId)) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "Duplicate control id : "+controlId);
                    out_string += "<!-- ERROR: Duplicate controlId: "+controlId+" File:"+s+" -->\n";
                    out_string += "<script>alert(\"Duplicate controlId:"+controlId+"\\n\\nPlease check files in the folder:"+sFolder+"\")</script>\n";
                } else {
                    String controlScript = get_table_control(request, controlId, sTableJsonFile, replaceApex, owner, returnType);
                    controlIds.add(controlId);                        
                    out_string += "<!-- ControlId: "+controlId+" - [ File:\""+s+"\" ]-->\n";
                    out_string += controlScript;
                    out_string += "\n\n";
                }
            }
            return out_string;
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            return "<script>console.error(\""+ex.getLocalizedMessage()+"\");</script>";
        }
    }
    
    public static void search(final String pattern, final File folder, List<String> result) {
        for (final File f : folder.listFiles()) {
            if (f.isDirectory()) {
                search(pattern, f, result);
            }
            if (f.isFile()) {
                if (f.getName().matches(pattern)) {
                    result.add(f.getAbsolutePath());
                }
            }
        }
    }    



    //
    // Aggiunge e registra un oggetto table_control, raffinando il Json e ritornando il js per il client
    //
    // N.B.:controlId può essere diverso da tableKey, per uso interno (es. la foreignTable dallo stesso controlId accede ad altre tabelle )
    //
    static public String get_table_control(HttpServletRequest request, String controlId, String sTableJson, String tableKey, Object owner, String returnType) throws Throwable {
        workspace tblWorkspace = null;
        JSONObject tableJson = null;
        JSONArray foreignTablesJson = null;
        String foreignKeysJson = null, foreignTables = null, foreignTable = null;        
        String connectionDriver = null, connectionURL = null, database = null, table = null, schema = null, primaryKey = null, query = null;
        int primaryKeyIndex1B = 0;
        boolean bAllColumns = false;
        String result = "json".equalsIgnoreCase(returnType) ? "{\"error\":\""+controlId+"\"}" : "<script> console.error(\""+controlId+" not created in server\");</script>";        
        long metadataTime = 0;
        Connection conn = null, connToDB = null, connToUse = null;
        
        try {

            JSONArray cols = null;

            try { tableJson = sTableJson != null ? new JSONObject(sTableJson) : null; } catch(Exception e) {}
            
            if(tableJson != null) {
                String sourceURL = null;
                if(tableJson.has("@")) {
                    sourceURL = tableJson.getString("@");
                } else if(tableJson.has("url")) {
                    sourceURL = tableJson.getString("url");
                }
                if(sourceURL != null && !sourceURL.isEmpty()) {
                    String fileContent = get_file_content( request, sourceURL, false, true);
                    if(fileContent != null && !fileContent.isEmpty()) {
                        JSONObject fileContentJSON = tableJson;
                        tableJson = new JSONObject(fileContent);
                        if(fileContentJSON != null) {
                            // Union overlaying part of
                            for (Object keyObject : JSONObject.getNames(fileContentJSON)) {
                                String key = (String)keyObject;
                                Object obj = fileContentJSON.get(key);
                                
                                if(obj instanceof JSONArray) {                                
                                    if(     "columns".equalsIgnoreCase(key) 
                                         || "grids".equalsIgnoreCase(key)
                                         || "filters".equalsIgnoreCase(key)
                                         || "preFilters".equalsIgnoreCase(key)                                        
                                         || "layouts".equalsIgnoreCase(key)
                                         || "charts".equalsIgnoreCase(key)
                                         || "documents".equalsIgnoreCase(key)
                                         || "multipanels".equalsIgnoreCase(key)
                                         || "commands".equalsIgnoreCase(key)
                                         || "events".equalsIgnoreCase(key)
                                        ) {
                                        tableJson.remove(key);
                                        tableJson.put(key, fileContentJSON.get(key));
                                    } else {
                                        Logger.getLogger(workspace.class.getName()).log(Level.INFO, null, "Skipped json array:"+key);
                                    }
                                } else {
                                    if(!"sourceFileName".equalsIgnoreCase(key) && !"sourceFullFileName".equalsIgnoreCase(key)) {
                                        tableJson.put(key, fileContentJSON.get(key));
                                    } else {
                                        Logger.getLogger(workspace.class.getName()).log(Level.INFO, null, "Skipped json property:"+key);
                                    }
                                }
                            }
                        }
                    } else {
                        String err = "source json '"+sourceURL+"' not found on control:"+controlId;
                        System.out.println(err);
                        return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+err+"\"}" : "<script> console.error(\""+err+"\");</script>" );
                    }
                }
            }
                                
            try { connectionDriver = tableJson.getString("connectionDriver"); } catch(Exception e) {}
            try { connectionURL = tableJson.getString("connectionURL"); } catch(Exception e) {}
            try { database = tableJson.getString("database"); } catch(Exception e) {}
            try { schema = tableJson.getString("schema"); } catch(Exception e) {}
            try { table = tableJson.getString("table"); } catch(Exception e) {}
            try { query = tableJson.getString("query"); } catch(Exception e) {}

            
            // Connessione al DB
            try {
                conn = connection.getConnection(null, request, connectionDriver, connectionURL, database);
                if(conn==null) {
                    String error = "[null connection]";
                    return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+utility.base64Encode( controlId+" : no DB connection.."+error )+"\"}" : "<script> console.error(\""+controlId+" not created .. no DB connection .."+error+"\");</script>" );
                }
            } catch(Throwable th) {
                String error = th.getLocalizedMessage();                
                return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+utility.base64Encode( controlId+" : no DB connection.."+error )+"\"}" : "<script> console.error(\""+controlId+" not created .. no DB connection .."+error+"\");</script>" );
            }            

            String defaultDatabase = conn.getCatalog();
            String defaultSchema = null;

            String driver = db.getDriver(conn);
            if("mysql".equalsIgnoreCase(driver)) {
            } else if("mariadb".equalsIgnoreCase(driver)) {
            } else if("postgres".equalsIgnoreCase(driver)) {
                defaultSchema = conn.getMetaData().getUserName();
            } else if("oracle".equalsIgnoreCase(driver)) {
                defaultSchema = conn.getMetaData().getUserName();
            } else if("sqlserver".equalsIgnoreCase(driver)) {
            }
            
            // aggiunto per oracle
            if(schema == null || schema.isEmpty()) {
                schema = defaultSchema;
            }
            
            // Controllo definizione database / database richiesto
            if(!check_database_definition(conn, database)) {
                System.out.println("LIQUID WARNING : database defined by driver :"+conn.getCatalog()+" requesting database:"+database);                
                String itemIdString = "\"", tableIdString = "\"";
                if("mysql".equalsIgnoreCase(driver)) {
                    itemIdString = "`";
                    tableIdString = "";
                } else if("mariadb".equalsIgnoreCase(driver)) {
                    itemIdString = "`";
                    tableIdString = "";
                }
                db.set_current_database(conn, database, driver, tableIdString);
            }

            
            // set the connection
            connToUse = conn;
            if(database == null || database.isEmpty()) {
                database = conn.getCatalog();
            } else {
                conn.setCatalog(database);
                String db = conn.getCatalog();
                if(!db.equalsIgnoreCase(database)) {
                    // set catalog not supported : connect to different DB
                    if(connectionURL != null && !connectionURL.isEmpty()) {
                        // TODO : support for jump database in connectioURL
                        // Jump to database not supported if connection defined by connectioURL
                        String err = "Cannot jump to database "+database+" .. the connection is defined by connectionURL on control:"+controlId;
                        System.out.println(err);
                        return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+err+"\"}" : "<script> console.error(\""+err+"\");</script>" );
                    }                    
                    conn.close();
                    conn = null;
                    connToUse = connToDB = connection.getDBConnection(database);
                }
            }
            
            
            if("quotes_extended".equalsIgnoreCase(table)) {
                int lb = 1;
            }
            if("utenti".equalsIgnoreCase(table)) {
                int lb = 1;
            }

            if(query != null && !query.isEmpty()) {
                int lb = 1;
            }
            
            // System calls
            String isSystemLiquid = workspace.isSystemLiquid(tableJson);
            
            if(isSystemLiquid == null) {
                // caso "columns":"*"
                
                if(tableJson == null) {
                    String err = "json empty or not found on control:"+controlId;
                    System.out.println(err);
                    return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+err+"\"}" : "<script> console.error(\""+err+"\");</script>" );
                }
                        
                try {
                    String colsAsName = tableJson.getString("columns");
                    if("*".equalsIgnoreCase(colsAsName) || "all".equalsIgnoreCase(colsAsName))  {
                        bAllColumns = true;
                    }
                } catch(Exception e) {}

                if(sTableJson == null || sTableJson.isEmpty()) {
                    table = tableKey;
                    bAllColumns = true;
                }

                if(sTableJson != null && !sTableJson.isEmpty()) {
                    try { primaryKey = tableJson.getString("primaryKey"); } catch(Exception e) {}
                    try { foreignTables = tableJson.getString("foreignTable"); } catch(Exception e) {}
                    try { foreignTablesJson = tableJson.getJSONArray("foreignTables"); } catch(Exception e) {}
                }
                
                if(table != null && !table.isEmpty()) {
                    boolean createTableIfMissing = false;
                    try { createTableIfMissing = tableJson.getBoolean("createTableIfMissing"); } catch(Exception e) {}
                    // verifica se esiste la tabella
                    if(!metadata.table_exist(connToUse, database, schema, table)) {
                        if(createTableIfMissing) {
                            if(!metadata.create_table(connToUse, database, schema, table, tableJson)) {
                                // Fail
                            }
                        } else {
                            String err = "database:"+database + " schema:"+schema + " table "+table+" not exist";
                            return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+err+"\"}" : "<script> console.error(\""+err+"\");</script>" );
                        }
                    }
                }
                
                if(bAllColumns) {
                    //
                    // tutte le colonne di controlId
                    //
                    if(table != null && !table.isEmpty()) {
                        ArrayList<String> allColumns = metadata.getAllColumnsAsArray(database, schema, table, connToUse);
                        if(allColumns.size()==0) {
                            String err = "LIQUID WARNING : No columns on database:"+database+" schema:"+schema+" table:"+table+" control:"+controlId;
                            System.out.println(err);
                            return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+err+"\"}" : "<script> console.error(\""+err+"\");</script>" );
                        }
                        cols = new JSONArray();
                        int icn = 1;
                        for(String col : allColumns) {
                            JSONObject colJson = new JSONObject("{\"name\":\""+col+"\",\"field\":\""+String.valueOf(icn++)+"\"}");
                            cols.put(colJson);
                        }
                        tableJson.remove("columns");                    
                        tableJson.put("columns", cols);
                        tableJson.put("columnsResolved", true);
                        tableJson.put("columnsResolvedBy", controlId);
                    } else {
                        // tutte le colonne, ma tabella non definita
                        tableJson.put("columns", new JSONArray());
                    }
                    
                } else {
                    
                    if(sTableJson != null && !sTableJson.isEmpty()) {
                        // rename delle colonne table.column : il punto non e' supportato da ag grid
                        try { cols = tableJson.getJSONArray("columns"); } catch(Exception e) {}
                        if(cols != null) {
                            for(int ic=0; ic<cols.length(); ic++) {
                                JSONObject col = cols.getJSONObject(ic);
                                col.put("field", String.valueOf(ic+1));
                                cols.put(ic, col);
                                String colName = "";
                                try { colName = col.getString("name"); } catch(Exception e) {}
                                String [] colParts = colName.split("\\.");
                                if(colParts.length > 1) {
                                    if(table.equalsIgnoreCase(colParts[0]) && colParts[1].equals(primaryKey)) {
                                       primaryKeyIndex1B = ic+1;
                                    }
                                } else {
                                    if(colName.equals(primaryKey)) {
                                       primaryKeyIndex1B = ic+1;
                                    }
                                }
                            }
                            tableJson.put("columns", cols);
                            tableJson.put("columnsResolved", true);
                            tableJson.put("columnsResolvedBy", controlId);
                        }
                    }
                } 
                
                //
                // Adding additional columns
                //
                try { cols = tableJson.getJSONArray("columns"); } catch(Exception e) {}
                JSONArray additionalCols = null;
                int icn = cols != null ? cols.length()+1 : 1;
                try { additionalCols = tableJson.getJSONArray("additionalColumns"); } catch (Exception ex) {}
                if(additionalCols != null) {
                    for(int ic=0; ic<additionalCols.length(); ic++) {
                        JSONObject additionalCol = additionalCols.getJSONObject(ic);
                        additionalCol.put("field", String.valueOf(icn++));
                        cols.put( additionalCol );
                    }
                }                        


                //
                // check duplicate columns, set alias
                //
                try { cols = tableJson.getJSONArray("columns"); } catch(Exception e) {}
                if(cols != null) {
                    for(int ic=0; ic<cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        String colName = col.getString("name");
                        String colLabel = col.has("label") ? col.getString("label") : "";
                        for(int jc=ic+1; jc<cols.length(); jc++) {
                            boolean duplicateFound = false;
                            JSONObject jcol = cols.getJSONObject(jc);
                            String jcolName = jcol.getString("name");
                            String jcolLabel = jcol.has("label") ? jcol.getString("label") : "";
                            if(colName.equalsIgnoreCase(jcolName)) {
                                String aliasName = colName;
                                String jaliasName = jcolName;
                                if(!colLabel.isEmpty() && !jcolLabel.isEmpty() && colLabel.equalsIgnoreCase(jcolLabel)) {
                                    aliasName = colLabel+"_1";
                                    jaliasName = jcolLabel+"_2";
                                } else {
                                    aliasName = colLabel.replaceAll(" ", "_");
                                    jaliasName = jcolLabel.replaceAll(" ", "_");
                                }
                                col.put("runtimeName", aliasName);
                                cols.put(ic, col);
                                jcol.put("runtimeName", jaliasName);
                                cols.put(jc, jcol);
                            }
                        }
                    }
                }


                // foreign columns
                ArrayList<metadata.ForeignKey> foreignKeysOnTable = null;
                if(cols != null) {
                    for(int ic=0; ic<cols.length(); ic++) {
                        JSONObject col = cols.getJSONObject(ic);
                        String [] colParts = col.getString("name").split("\\.");

                        String foreignColumn = null, column = null;

                        try { foreignTable = col.getString("foreignTable"); } catch (Exception e) { foreignTable = null; }
                        try { foreignColumn = col.getString("foreignColumn"); } catch (Exception e) { foreignColumn = null; }
                        try { column = col.getString("column"); } catch (Exception e) { column = null; }

                        if(colParts.length > 1) { // campo esterno ...
                            if(!colParts[0].equalsIgnoreCase(table)) {
                                int foreignIndex = -1;
                                if(foreignTable == null || foreignColumn == null || column == null) {
                                    if(foreignKeysOnTable == null) {
                                        try {
                                            foreignKeysOnTable = metadata.getForeignKeyData(database, schema, table, connToUse);
                                        } catch (Exception ex) {
                                            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                                        }
                                    }                                
                                    if(foreignKeysOnTable != null) {
                                        for(int ifk=0; ifk<foreignKeysOnTable.size(); ifk++) {
                                           metadata.ForeignKey foreignKey = foreignKeysOnTable.get(ifk);
                                           if(foreignKey != null) {
                                               if(foreignKey.foreignTable.equalsIgnoreCase(colParts[0])) {
                                                    if(foreignTable == null) { col.put("foreignTable", foreignKey.foreignTable); foreignTable = foreignKey.foreignTable; }
                                                    if(foreignColumn == null) { col.put("foreignColumn", foreignKey.foreignColumn); foreignColumn = foreignKey.foreignColumn; }
                                                    if(column == null) { col.put("column", foreignKey.column); column = foreignKey.column; }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                if(foreignTable != null && foreignColumn != null && column != null) {
                                    if(foreignKeysOnTable != null) {
                                        if(foreignTable != null && foreignColumn != null && column != null) {
                                            for(int ifk=0; ifk<foreignKeysOnTable.size(); ifk++) {
                                               metadata.ForeignKey foreignKey = foreignKeysOnTable.get(ifk);
                                               if(foreignKey != null) {
                                                   if(foreignKey.foreignTable.equalsIgnoreCase(foreignTable)) {
                                                       if(foreignKey.foreignColumn.equalsIgnoreCase(foreignColumn)) {
                                                           if(foreignKey.column.equalsIgnoreCase(column)) {
                                                               foreignIndex = ifk;
                                                               break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(foreignIndex < 0) {
                                        if (foreignKeysOnTable == null) foreignKeysOnTable = new ArrayList<metadata.ForeignKey>();
                                        foreignIndex = foreignKeysOnTable.size();
                                        foreignKeysOnTable.add(new metadata.ForeignKey(foreignTable, foreignColumn, column, null) );
                                    }
                                }                        
                            }
                        }
                    }
                }

                // foreign tables
                if("*".equalsIgnoreCase(foreignTables) || foreignTablesJson != null) {
                    if(foreignKeysOnTable == null) {
                        try {
                            foreignKeysOnTable = metadata.getForeignKeyData(database, schema, table, connToUse);
                        } catch (Exception ex) {
                            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                        }
                    }
                    if(connToUse != null) {
                        if(foreignKeysOnTable != null) {
                            if(foreignKeysOnTable.size() > 0) {
                                for(metadata.ForeignKey foreignKey : foreignKeysOnTable) {                                    
                                    // Verifica tutte le foreign table tabella se presente *
                                    if("*".equalsIgnoreCase(foreignTables) || "all".equalsIgnoreCase(foreignTables)) {
                                        // verifica la presenza delle colonne necessarie alla foreignTable : velocizza il processo evitando la query inneestata
                                        cols = tableJson.getJSONArray("columns");
                                        int ic = cols.length();                                    
                                        if(get_column(table, cols, null, foreignKey.column) <= 0) {
                                            JSONObject colJson = new JSONObject("{\"name\":\""+table+"."+foreignKey.column+"\",\"label\":\""+table+"."+foreignKey.column+"#AutoAdded\",\"field\":\""+String.valueOf(ic+1)+"\",\"visible\":false}");
                                            cols.put(colJson);
                                            ic++;
                                        }
                                        tableJson.put("columns", cols);
                                        
                                        Gson gson = new Gson();
                                        String sForeignKeysOnTableJson = gson.toJson(foreignKeysOnTable);
                                        if (sForeignKeysOnTableJson != null && !sForeignKeysOnTableJson.isEmpty()) {
                                            // unione cfg utente + foreign key
                                            tableJson.put("foreignTables",  new JSONArray(sForeignKeysOnTableJson));
                                        }
                                        
                                    } else {
                                        if(foreignTablesJson != null) {
                                            int nUpdated = 0;
                                            for (int ift=0; ift<foreignTablesJson.length(); ift++) {
                                                String ft = null, fc = null;
                                                JSONObject foreignableJson = foreignTablesJson.getJSONObject(ift);
                                                if(foreignableJson != null) {
                                                    try { ft = foreignableJson.getString("foreignTable"); } catch (Exception e) {};
                                                    try { fc = foreignableJson.getString("column"); } catch (Exception e) {};
                                                    if(ft != null) {
                                                        if(fc != null) {
                                                            if(foreignKey.foreignTable.equalsIgnoreCase(ft)) {
                                                                // foreignTablesList.add(ft);
                                                                int ic = cols.length();                                    
                                                                if(get_column(table, cols, null, fc) <= 0) {
                                                                    get_column(table, cols, null, fc);
                                                                    JSONObject colJson = new JSONObject("{\"name\":\""+table+"."+fc+"\",\"label\":\""+table+"."+fc+"#AutoAdded\",\"field\":\""+String.valueOf(ic+1)+"\",\"visible\":false}");
                                                                    cols.put(colJson);
                                                                    ic++;
                                                                    nUpdated++;
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            if(nUpdated>0) {
                                                tableJson.put("columns", cols);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Aggiunta primary key
                if(primaryKeyIndex1B<=0) {
                    if(primaryKey != null) {
                        if(table != null && !table.isEmpty()) {
                            if(cols != null) {
                                JSONObject colJson = new JSONObject("{\"name\":\""+table+"."+primaryKey+"\",\"field\":\""+String.valueOf(cols.length()+1)+"\",\"visible\":false}");
                                cols.put(colJson);
                                tableJson.put("columns", cols);
                            }
                        }
                    }
                }
                
                boolean isSystem = false;
                try { isSystem = tableJson.getBoolean("isSystem"); } catch (Exception ex) {}
                

                
                
                

                //
                // Aggiunta Metadati
                //
                try {
                    if(connToUse==null) {
                        return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+controlId+" : no DB connection\"}" : "<script> console.error(\""+controlId+" not created .. no DB connection\");</script>" );
                    }
                } catch (Exception ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
                if(connToUse != null) {
                    long msTrace = System.currentTimeMillis();
                    try { cols = tableJson.getJSONArray("columns"); } catch (Exception ex) {}
                    if(cols != null) {
                        for(int ic=0; ic<cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            String colName = null, colTable = null, colForeignTable = null;
                            try { colName = col.getString("name");  } catch (Exception ex) {}
                            try { colForeignTable = col.getString("foreignTable");  } catch (Exception ex) {}

                            if(colName != null && !colName.isEmpty()) { 
                                String [] colParts = colName.split("\\.");
                                colTable = (colParts.length > 1 ? colParts[0] : ( colForeignTable != null ? colForeignTable : table ) );
                                colName = (colParts.length > 1 ? colParts[1] : colName);
                                if(colName != null && !colName.isEmpty()) {

                                    if(!isSystem) {
                                        metadata.MetaDataCol mdCol = (metadata.MetaDataCol)metadata.readTableMetadata(connToUse, database, schema, colTable, colName);
                                        if(mdCol != null) {
                                            // Handle sensitive case mismath
                                            if(!colName.equals(mdCol.name)) {
                                                if(colParts.length > 1) {
                                                    col.put("name", colParts[0]+"."+mdCol.name);
                                                } else {
                                                    col.put("name", mdCol.name);
                                                }
                                            }
                                            
                                            if(col.has("type")) {
                                                if("DATE".equalsIgnoreCase(col.getString("type"))) {
                                                    col.put("type", "6");
                                                } else if("DATETIME".equalsIgnoreCase(col.getString("type"))) {
                                                    col.put("type", "91");
                                                } else if("STRING".equalsIgnoreCase(col.getString("type"))) {
                                                    col.put("type", "1");
                                                } else {
                                                    col.put("type", mdCol.datatype);
                                                }
                                            } else {
                                                col.put("type", mdCol.datatype);
                                            }
                                            col.put("typeName", mdCol.typeName);
                                            col.put("size", mdCol.size);

                                            if(!col.has("")) {
                                                col.put("digits", mdCol.digits);
                                            }
                                            
                                            col.put("nullable", mdCol.isNullable);
                                            col.put("autoIncString", mdCol.autoIncString);
                                            col.put("remarks", mdCol.remarks);

                                            
                                            boolean bStoreDigits = false;
                                            if(col.has("digits")) {
                                                try {
                                                    Integer idigits = col.getInt("digits");
                                                    if(idigits == null) {
                                                        bStoreDigits = true;
                                                    }
                                                } catch (Exception e) {
                                                    bStoreDigits = true;
                                                }
                                            } else {
                                                bStoreDigits = true;
                                            }
                                            if(bStoreDigits) {
                                                col.put("digits", mdCol.digits);
                                            }

                                            
                                            //
                                            // Save default in the database if not overwrited by json
                                            //
                                            boolean bStoreDefualt = false;
                                            if(col.has("default")) {
                                                String sDefault = col.getString("default");
                                                if(sDefault == null || sDefault.isEmpty()) {
                                                    bStoreDefualt = true;
                                                }
                                            } else {
                                                bStoreDefualt = true;
                                            }
                                            if(bStoreDefualt) {
                                                col.put("default", (mdCol.columnDef != null ? mdCol.columnDef.replace("'", "`") : null));
                                            }
                                            
                                            if(colForeignTable != null && !colForeignTable.isEmpty()) { // campo esterno
                                                // ??? col.put("default", ""); ??? bStoreDefualt
                                                col.put("isReflected", true);
                                            }

                                            if(!mdCol.isNullable) {
                                                if(mdCol.columnDef==null || mdCol.columnDef.isEmpty()) {
                                                    if(!mdCol.autoIncString) {
                                                        if(colForeignTable == null || colForeignTable.isEmpty()) { // NON campo esterno
                                                            col.put("required", true);
                                                            col.put("requiredByDB", true);
                                                        }
                                                    }
                                                }
                                            }

                                            cols.put(ic, col);
                                        }
                                    }
                                }
                            }
                        }
                        metadataTime = System.currentTimeMillis() - msTrace;

                        tableJson.put("columns", cols);
                    }
                }


                // Lookup field : risoluzione campo per il client side
                String lookupField = null;
                try { lookupField = tableJson.getString("lookupField"); } catch(Exception e) {}
                if(lookupField != null) {
                    String resLookupField = "1"; 
                    try { cols = tableJson.getJSONArray("columns"); } catch (Exception ex) {}
                    if(cols != null) {
                        for(int ic=0; ic<cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            String name = col.has("name") ? col.getString("name") : "";
                            String label = col.has("label") ? col.getString("label") : "";
                            if(lookupField.equalsIgnoreCase(name) || lookupField.equalsIgnoreCase(label)) {
                                resLookupField = String.valueOf(ic+1);
                                break;
                            }
                        }
                        tableJson.put("lookupField", resLookupField);
                    }
                }

                // chiave primaria
                if(primaryKey == null || primaryKey.isEmpty()) {
                    primaryKey = metadata.getPrimaryKeyData(database, schema, table, connToUse);                    
                    tableJson.put("primaryKey", primaryKey);
                }               

                // cerca nei campi ...
                if(primaryKey != null && !primaryKey.isEmpty()) {
                    try { cols = tableJson.getJSONArray("columns"); } catch (Exception ex) {}
                    if(cols != null) {
                        for(int ic=0; ic<cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            String colName = null, colTable = null, colForeignTable = null;
                            try { colName = col.getString("name");  } catch (Exception ex) {}
                            String [] colParts = colName.split("\\.");
                            colTable = (colParts.length > 1 ? colParts[0] : ( colForeignTable != null ? colForeignTable : table ) );
                            colName = (colParts.length > 1 ? colParts[1] : colName);
                            if(colName != null && !colName.isEmpty()) {
                                if(primaryKey.equalsIgnoreCase(colName) && colTable.equalsIgnoreCase(table)) {
                                    tableJson.put("primaryKeyField", String.valueOf(ic+1));
                                }
                            }
                        }                
                    }
                }

                //
                // Assetts on the grids : set visible = false or delete ???
                //
                JSONArray grids = null;
                boolean gridChanged = false;
                boolean bDeleteMismatchingAssetGrid = true;
                try { grids = tableJson.getJSONArray("grids"); } catch (Exception ex) {}
                if(grids != null) {
                    for(int ig=0; ig<grids.length(); ig++) {
                        JSONObject grid = grids.getJSONObject(ig);
                        if(grid != null) {
                            JSONArray assets = null;
                            String assetsOp = null, asset = null, mismatching_assets = null;
                            boolean hasActiveAsset = true;
                            try { assetsOp = grid.getString("assetsOp");  } catch (Exception ex) { assetsOp=null; }
                            try { assets = grid.getJSONArray("assets");  } catch (Exception ex) { assets=null; }
                            try { asset = grid.getString("asset");  } catch (Exception ex) { asset=null; }

                            if(asset != null && !asset.isEmpty()) {
                               if(assets == null) assets = new JSONArray();
                               assets.put(asset);
                            }

                            try {
                                Object [] res_asset = com.liquid.assets.is_asset_active ( request, assets, assetsOp );
                                hasActiveAsset = (boolean) res_asset[0];
                                mismatching_assets = (String) res_asset[1];
                            } catch (Exception ex) {
                            }

                            if(hasActiveAsset) {
                            } else {
                                if(bDeleteMismatchingAssetGrid) {
                                    // Iterator keys = grid.keys();
                                    // while(keys.hasNext()) grid.remove((String)keys.next());
                                    grids.put(ig, new JSONObject());
                                    gridChanged = true;
                                } else {
                                    grid.put("visible", false);
                                    grid.put("visible_comment", "mismatching asset:"+mismatching_assets+"");
                                    gridChanged = true;
                                }
                            }
                        }
                    }
                    if(gridChanged) {
                        tableJson.put("grids", grids);
                    }
                }

                //
                // Comandi Predefiniti : risoluzione campi default
                //
                boolean bInsertActive = false;
                boolean bUpdateActive = false;
                boolean bDeleteActive = false;
                boolean bPastedRowActive = false;
                JSONArray commands = null;
                JSONArray new_commands = new JSONArray();
                try { commands = tableJson.getJSONArray("commands"); } catch(Exception e) {}
                if(commands != null) {
                    for(int ic=0; ic<commands.length(); ic++) {
                        JSONObject cmd = commands.getJSONObject(ic);
                        if(cmd != null) {
                            JSONArray labels = null;
                            JSONArray assets = null;
                            int size = 0;
                            String cmdName = null, img = null, text = null, rollback = null, rollbackImg = null, asset = null, assetsOp = null, mismatching_assets = null;
                            boolean bServerDefined = false;
                            boolean hasActiveAsset = true;
                            try { cmdName = cmd.getString("name");  } catch (Exception ex) {}
                            try { img = cmd.getString("img");  } catch (Exception ex) { img=null; }
                            try { rollback = cmd.getString("rollback");  } catch (Exception ex) { rollback=null; }
                            try { rollbackImg = cmd.getString("rollbackImg");  } catch (Exception ex) { rollbackImg=null; }
                            try { text = cmd.getString("text");  } catch (Exception ex) { text=null; }
                            try { labels = cmd.getJSONArray("labels");  } catch (Exception ex) { labels=null; }
                            try { size = cmd.getInt("size");  } catch (Exception ex) { size=0; }
                            try { bServerDefined = cmd.has("server");  } catch (Exception ex) { }
                            try { assetsOp = cmd.getString("assetsOp");  } catch (Exception ex) { assetsOp=null; }
                            try { assets = cmd.getJSONArray("assets");  } catch (Exception ex) { assets=null; }
                            try { asset = cmd.getString("asset");  } catch (Exception ex) { asset=null; }
                            
                            if(asset != null && !asset.isEmpty()) {
                               if(assets == null) assets = new JSONArray();
                               assets.put(asset);
                            }
                            
                            try {
                                Object [] res_asset = com.liquid.assets.is_asset_active ( request, assets, assetsOp );
                                hasActiveAsset = (boolean) res_asset[0];
                                mismatching_assets = (String) res_asset[1];
                            } catch (Exception ex) {
                            }

                            if(hasActiveAsset) {
                                if("insert".equalsIgnoreCase(cmdName) || "create".equalsIgnoreCase(cmdName)) {
                                    if(!bServerDefined) cmd.put("server", "com.liquid.event.insertRow");
                                    cmd.put("name", "insert");
                                    cmd.put("isNative", true);
                                    if(img==null) cmd.put("img", "add.png");
                                    if(size==0) cmd.put("size", 20);
                                    if(text==null) cmd.put("text", "Aggiungi");
                                    if(labels==null) cmd.put("labels", new JSONArray("[\"Salva\"]"));
                                    if(rollback==null || rollback.isEmpty()) cmd.put("rollback", "Annulla");
                                    if(rollbackImg==null || rollbackImg.isEmpty()) cmd.put("rollbackImg", "cancel.png");
                                    bInsertActive = true;
                                } else if("update".equalsIgnoreCase(cmdName) || "modify".equalsIgnoreCase(cmdName)) {
                                    if(!bServerDefined) cmd.put("server", "com.liquid.event.updateRow");
                                    cmd.put("name", "update");
                                    cmd.put("isNative", true);
                                    if(img==null) cmd.put("img", "update.png");
                                    if(size==0) cmd.put("size", 20);
                                    if(text==null) cmd.put("text", "Modifica");
                                    if(labels==null) cmd.put("labels", new JSONArray("[\"Salva\"]"));
                                    if(rollback==null || rollback.isEmpty()) cmd.put("rollback", "Annulla");
                                    if(rollbackImg==null || rollbackImg.isEmpty()) cmd.put("rollbackImg", "cancel.png");
                                    bUpdateActive = true;
                                } else if("delete".equalsIgnoreCase(cmdName) || "erase".equalsIgnoreCase(cmdName)) {
                                    if(!bServerDefined) cmd.put("server", "com.liquid.event.deleteRow");
                                    cmd.put("name", "delete");
                                    cmd.put("isNative", true);
                                    if(img==null) cmd.put("img", "delete.png");
                                    if(size==0) cmd.put("size", 20);
                                    if(text==null) cmd.put("text", "Cancella");
                                    if(labels==null) cmd.put("labels", new JSONArray("[\"Conferma\"]"));
                                    if(rollback==null || rollback.isEmpty()) cmd.put("rollback", "Annulla");
                                    if(rollbackImg==null || rollbackImg.isEmpty()) cmd.put("rollbackImg", "cancel.png");
                                    bDeleteActive = true;
                                } else if("previous".equalsIgnoreCase(cmdName)) {
                                    if(img==null) cmd.put("img", "prev.png");
                                    if(size==0) cmd.put("size", 16);
                                    cmd.put("client", "onPrevRow");
                                    cmd.put("isNative", true);
                                } else if("next".equalsIgnoreCase(cmdName)) {                           
                                    if(img==null) cmd.put("img", "next.png");
                                    if(size==0) cmd.put("size", 16);
                                    cmd.put("client", "onNextRow");
                                    cmd.put("isNative", true);
                                } else if("copy".equalsIgnoreCase(cmdName)) {                           
                                    if(img==null) cmd.put("img", "copy.png");
                                    if(size==0) cmd.put("size", 16);
                                    cmd.put("client", "onCopy");
                                    cmd.put("isNative", true);
                                } else if("paste".equalsIgnoreCase(cmdName)) {                           
                                    if(img==null) cmd.put("img", "paste.png");
                                    if(size==0) cmd.put("size", 16);
                                    cmd.put("client", "onPaste");
                                    cmd.put("isNative", true);
                                    cmd.put("sync", true);
                                    bPastedRowActive = true;
                                }
                                
                                new_commands.put(cmd);
                            } else {
                                // skipped
                                new_commands.put( new JSONObject("{ \"cmd_"+cmdName+"_comment\":\"mismatching asset:"+mismatching_assets+"\"}"));
                            }
                        }
                    }
                    tableJson.put("commands", new_commands);
                }

                
                // Eventi di sistema
                boolean bInsertEventFound = false;
                boolean bUpdateEventFound = false;
                boolean bDeleteEventFound = false;
                boolean bPastedRowFound = false;
                JSONArray events = null;
                String sOwner = null;
                try {
                    try { events = tableJson.getJSONArray("events"); } catch(JSONException e) {}
                    try { sOwner = tableJson.getString("owner"); } catch(JSONException e) {}
                    if(events != null) {
                        for(int ie=0; ie<events.length(); ie++) {
                            try {
                                JSONObject event = events.getJSONObject(ie);
                                if(event != null) {
                                    String eventName = null;
                                    String server = null;
                                    try { eventName = event.getString("name");  } catch (JSONException ex) {}
                                    if(bInsertActive) {
                                        if("onInserting".equalsIgnoreCase(eventName)) {
                                            try { server = event.getString("server");  } catch (JSONException ex) { server = null; }
                                            if("com.liquid.event.onInserting".equalsIgnoreCase(server) || ("com.liquid.event".equalsIgnoreCase(sOwner) && "onInserting".equalsIgnoreCase(server))) {
                                                event.put("isSystem", true);
                                                bInsertEventFound = true;
                                            }
                                        }
                                    }
                                    if(bUpdateActive) {
                                        if("onUpdating".equalsIgnoreCase(eventName)) {
                                            try { server = event.getString("server");  } catch (JSONException ex) { server = null; }
                                            if(!"com.liquid.event.onUpdating".equalsIgnoreCase(server) || ("com.liquid.event".equalsIgnoreCase(sOwner) && "onUpdating".equalsIgnoreCase(server))) {
                                                event.put("isSystem", true);
                                                bUpdateEventFound = true;
                                            }
                                        }
                                    }
                                    if(bDeleteActive) {
                                        if("onDeleting".equalsIgnoreCase(eventName)) {
                                            try { server = event.getString("server");  } catch (JSONException ex) { server = null; }
                                            if(!"com.liquid.event.onDeleting".equalsIgnoreCase(server) || ("com.liquid.event".equalsIgnoreCase(sOwner) && "onDeleting".equalsIgnoreCase(server))) {
                                                event.put("isSystem", true);
                                                bDeleteEventFound = true;
                                            }
                                        }
                                    }
                                    if(bPastedRowActive) {
                                        if("onPastedRow".equalsIgnoreCase(eventName)) {
                                            try { server = event.getString("server");  } catch (JSONException ex) { server = null; }
                                            if(!"com.liquid.event.onPastedRow".equalsIgnoreCase(server) || ("com.liquid.event".equalsIgnoreCase(sOwner) && "onPastedRow".equalsIgnoreCase(server))) {
                                                event.put("isSystem", true);
                                                event.put("sync", true);
                                                bPastedRowFound = true;
                                            }
                                        }
                                    }
                                    // signature
                                    event.put("cypher", login.getSaltString(32));
                                }
                            } catch(JSONException e) {}
                        }
                    }
                    // Add system events
                    JSONArray newEvents = new JSONArray();
                    if(newEvents != null) {
                        if(!bInsertEventFound && bInsertActive) {
                            newEvents.put(new JSONObject( "{ \"name\":\"onInserting\", \"server\":\"com.liquid.event.onInserting\", \"isSystem\":true, \"cypher\":\""+login.getSaltString(32)+"\" }" ) );
                        }
                        if(!bUpdateEventFound && bUpdateActive) {                        
                            newEvents.put(new JSONObject( "{ \"name\":\"onUpdating\", \"server\":\"com.liquid.event.onUpdating\", \"isSystem\":true, \"cypher\":\""+login.getSaltString(32)+"\" }" ) );
                        }
                        if(!bDeleteEventFound && bDeleteActive) {                        
                            newEvents.put(new JSONObject( "{ \"name\":\"onDeleting\", \"server\":\"com.liquid.event.onDeleting\", \"isSystem\":true, \"cypher\":\""+login.getSaltString(32)+"\" }" ) );
                        }
                        if(!bPastedRowFound && bPastedRowActive) {                        
                            newEvents.put(new JSONObject( "{ \"name\":\"onPastedRow\", \"server\":\"com.liquid.event.onPastedRow\", \"isSystem\":true, \"sync\":true, \"cypher\":\""+login.getSaltString(32)+"\" }" ) );
                        }
                        if(events != null) {
                            for(int ie=0; ie<events.length(); ie++) {
                                try {
                                    newEvents.put(events.getJSONObject(ie));
                                } catch(JSONException e) {}
                            }
                        }
                        tableJson.put("events", newEvents);
                    }

                } catch (JSONException ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
            }

            
            // Product name
            String dbProductName = "unknown";
            if(connToUse != null) {
                dbProductName = connToUse.getMetaData().getDatabaseProductName();
            }

            // Instanzia la classe owner
            if(owner == null) {
                String ownerClassName = null;
                try { ownerClassName = tableJson.getString("owner"); } catch(Exception e) {}
                if(ownerClassName != null) {
                    try {
                        Class cls = Class.forName(ownerClassName);
                        owner = (Object) cls.newInstance();
                    } catch(Throwable th) {
                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
                    }
                }
            }
            

            if(!tableJson.has("mode")) {
                tableJson.put("mode", "auto");
            }
            
            if(database == null || database.isEmpty()) {
                database = defaultDatabase;
            }
            tableJson.put("database", database);
            tableJson.put("schema", schema);

            
            String token = login.getSaltString(32);
            

            //
            // In query mode set parentControlId / rootControlId to self (for source validation in the security checker)
            //
            if(query != null && !query.isEmpty()) {
                if(!tableJson.has("parentControlId")) {
                    tableJson.put("parentControlId", controlId);
                }
                if(!tableJson.has("rootControlId")) {
                    tableJson.put("rootControlId", controlId);
                }
            }
            
            tableJson.put("metadataTime", metadataTime);

            
            // build query params to solve at client side
            if(query != null && !query.isEmpty()) {
                JSONArray queryParams = build_query_params(query);
                if(queryParams != null) {
                    tableJson.put("queryParams", queryParams);
                }
            }
            

            boolean bFoundWorkspace = false;
            
            for(int i=0; i<glTblWorkspaces.size(); i++) {
                tblWorkspace = glTblWorkspaces.get(i);
                if(tblWorkspace.controlId.equalsIgnoreCase(controlId)) {
                    
                    if(tblWorkspace.token == null || tblWorkspace.token.isEmpty()) {
                        tblWorkspace.token = token;
                        // set thre token in the json
                        tableJson.put("token", token);
                    } else {
                        tableJson.put("token", tblWorkspace.token);
                    }
                    
                    if(!tblWorkspace.tableJson.equals(tableJson)) {
                        if(tblWorkspace.tableJson != null)
                                System.out.println("WARNING : Overwrited Configuration of control : "+controlId);
                        
                        // Keep server side define (es.: query / connectionURL)
                        recoveryKeyFromServer(tblWorkspace.tableJson, tableJson);
                        
                        tblWorkspace.tableJson = tableJson;
                    }
                    if(    (tblWorkspace.owner == null && owner != null)
                        || (tblWorkspace.owner != null && owner == null)
                        || (tblWorkspace.owner != null && owner != null && !tblWorkspace.owner.getClass().equals(owner.getClass()))
                        ) {
                        System.out.println("WARNING : Overwrited owner of control : "+controlId);
                    }
                    
                    tblWorkspace.owner = owner;
                    
                    tblWorkspace.driverClass = connToUse != null ? connToUse.getClass().getName() : null;
                    tblWorkspace.defaultDatabase = defaultDatabase;
                    tblWorkspace.defaultSchema = defaultSchema;
                    tblWorkspace.dbProductName = dbProductName;
                    workspace.setDatabaseShemaTable(tblWorkspace);
                    System.out.println("/* LIQUID INFO : control : "+controlId + " driverClass:"+tblWorkspace.driverClass + " dbProductName:"+dbProductName+"*/");
                    bFoundWorkspace = true;
                }
            }
            
            if(!bFoundWorkspace) {
                // set thre token in the json
                tableJson.put("token", token);
                
                tblWorkspace = new workspace();
                tblWorkspace.controlId = controlId;
                tblWorkspace.tableJson = tableJson;
                tblWorkspace.owner = owner;
                tblWorkspace.dbProductName = dbProductName;
                tblWorkspace.defaultDatabase = defaultDatabase;
                tblWorkspace.defaultSchema = defaultSchema;
                tblWorkspace.driverClass = connToUse != null ? connToUse.getClass().getName() : null;
                tblWorkspace.token = token;
                workspace.setDatabaseShemaTable(tblWorkspace);
                // tblWorkspace.get_connection assegnato a default_connection
                System.out.println("/* LIQUID INFO : new control : "+controlId + " driverClass:"+tblWorkspace.driverClass + " dbProductName:"+dbProductName+"*/");
                glTblWorkspaces.add(tblWorkspace);
            }
            
            
            
            JSONObject tableJsonForClient = new JSONObject(tableJson.toString());
            
            // ConnectionURL è gestito lato server, può avere l'account di accesso e non va passato al client
            for(String serverPriorityKey : serverPriorityKeys) {
                if(tableJsonForClient.has(serverPriorityKey)) {
                    tableJsonForClient.put(serverPriorityKey, kDefinedAtServerSide);                    
                }
            }
            sTableJson = tableJsonForClient.toString();

            
            // script avvio client side o json 
            if("json".equalsIgnoreCase(returnType)) {
                result = sTableJson;
            } else if("js".equalsIgnoreCase(returnType)) {
                result = "<script>"+getJSVariableFromControlId(controlId)+"={controlId:\""+controlId+"\",json:'"+sTableJson.replace("'", "\\'")+"'};</script>";
            } else {
                result = "<script>glLiquidStartupTables.push({controlId:\""+controlId+"\",json:'"+sTableJson.replace("'", "\\'")+"'});</script>";
            }
            
            return result;


            
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            return ("json".equalsIgnoreCase(returnType) ? "{\"error\":\""+ex.getLocalizedMessage()+"\"}" : "<script> console.error(\""+ex.getLocalizedMessage()+"\");</script>" );

        } finally {
            try {
                if(conn != null)
                    conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, "ERROR on control:"+controlId+" : "+ex);
            }
            if(connToDB != null) 
                try {
                    connToDB.close();
            } catch (SQLException ex) {
                Logger.getLogger(metadata.class.getName()).log(Level.SEVERE, null, ex);
            }            
        }
    }

    static public JSONArray build_query_params(String query) throws JSONException {
        if(query != null && !query.isEmpty()) {
            JSONArray queryParams = new JSONArray();
            int len = query.length();
            for(int i=0; i<len; i++) {
                if(query.charAt(i) == '$' || query.charAt(i) == '@') {
                    i++;
                    if(query.charAt(i) == '{') {
                        int s = i;
                        while(query.charAt(i) != '}' && i < len) {
                            i++;
                        }
                        if(query.charAt(i) == '}') {
                            String paramName = query.substring(s-1, i+1);
                            JSONObject newParam = new JSONObject();
                            newParam.put("name", paramName);
                            newParam.put("value", "");
                            queryParams.put(newParam);
                        }
                    }
                }
            }
            return queryParams;
        }
        return null;
    }
    static public String solve_query_params(String query, JSONArray queryParams) throws JSONException {
        if(query != null && !query.isEmpty()) {
            if(queryParams != null) {
                for(int i=0; i<queryParams.length(); i++) {
                    query = query.replace(queryParams.getJSONObject(i).getString("name"), queryParams.getJSONObject(i).getString("value"));
                }
            }
            return query;
        }
        return null;
    }

    
    static public void recoveryKeyFromServer(JSONObject serverTableJson, JSONObject clientTableJson) {
        if(serverTableJson != null) {
            if(serverTableJson != null) {
                try {
                    for(String serverPriorityKey : serverPriorityKeys) {
                        if(serverTableJson.has(serverPriorityKey)) {
                            if(!serverTableJson.get(serverPriorityKey).equals(kDefinedAtServerSide)) {
                                clientTableJson.put(serverPriorityKey, serverTableJson.get(serverPriorityKey));
                            }
                        }
                    }
                } catch (JSONException ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
    }
                        
    
    //
    // Ottiene il JSON del controllo generato automaticamentte per accedere ad una tabella
    //
    // TODO : Mettere in sicurezza verificando che la richiesta gia autorizzata dal controllo chiamante
    //
    static public String get_default_json(HttpServletRequest request, JspWriter out) throws Throwable {
        String controlId = "", tblWrk = "";
        String table = "", schema = "", database = "", parentControlId = "";
        try {
            try { controlId = (String) request.getParameter("controlId"); } catch (Exception e) { }            
            try { table = (String) request.getParameter("table"); } catch (Exception e) { }            
            try { schema = (String) request.getParameter("schema"); } catch (Exception e) { }            
            try { database = (String) request.getParameter("database"); } catch (Exception e) { }            
            try { tblWrk = (String) request.getParameter("tblWrk"); } catch (Exception e) { } 
            try { parentControlId = (String) request.getParameter("parentControlId"); } catch (Exception e) { }             
            String sRequest = workspace.get_request_content(request);            
            return get_default_json(request, controlId, tblWrk, table, schema, database, parentControlId, null, sRequest, out);
        } catch (Exception e) {
            System.err.println(" get_default_json() ["+controlId+"] Error:" + e.getLocalizedMessage());
        }
        return null;
    }
        
    static public String get_default_json(HttpServletRequest request, String controlId, String tblWrk, String table, String schema, String database, String parentControlId, String sourceToken, String sRequest, JspWriter out) throws Throwable {
        try {
            String result = "";            
            // Verifica della sorgente source : il client non può leggere un controllo in modalità auto se il padre non è autorizzato
            if( (parentControlId != null && !parentControlId.isEmpty()) || (sourceToken != null && !sourceToken.isEmpty()) ) {
                workspace source_tbl_wrk = workspace.get_tbl_manager_workspace(parentControlId);
                if(source_tbl_wrk != null || sourceSpecialToken.equals(sourceToken)) {
                    if(sourceSpecialToken.equals(parentControlId)) parentControlId = null;
                    workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk);
                    if(tbl_wrk == null) {
                        // Nessuna definizione predefinita : costruzione connessione minima
                        String sTableJson = "{\"table\":\""+table+"\",\"columns\":\"*\"}";
                        JSONObject tableJson = new JSONObject(sTableJson);
                        tableJson.put("database", database);
                        tableJson.put("schema", schema);
                        if(sRequest != null && !sRequest.isEmpty()) {
                            //
                            // Unione voci nella request ... es.: commands, filter, etc... deveno essere validate dal server
                            //
                            try {
                                JSONObject requestTableJson = new JSONObject(sRequest);
                                if(requestTableJson != null) {
                                    JSONArray jsonNames = requestTableJson.names();
                                    for (int i=0; i<jsonNames.length(); i++) {
                                        String name = jsonNames.getString(i);
                                        tableJson.put(name, requestTableJson.get(name));
                                    }
                                }
                            } catch (Exception e) { System.err.println(" get_default_json() ["+controlId+"] Error:" + e.getLocalizedMessage());
                            } 
                        }
                        sTableJson = tableJson.toString();                            
                        result = workspace.get_table_control_from_string(request, controlId, sTableJson );
                        tbl_wrk = workspace.get_tbl_manager_workspace(controlId);
                    }
                    if(tbl_wrk != null) {
                        if(tbl_wrk.tableJson!=null) {
                            // Aggiunta sorgente
                            tbl_wrk.tableJson.put("parent", parentControlId);
                            return tbl_wrk.tableJson.toString();
                        }
                    } else {
                        return result;
                    }
                } else {
                    String error = " get_default_json() ["+controlId+"] Connot read table without source exist";
                    System.err.println(error);
                    return "{\"error\":\""+error+"\"}";
                }
            } else {
                String error = " get_default_json() ["+controlId+"] Connot read table without source verification";
                System.err.println(error);
                return "{\"error\":\""+error+"\"}";
            }
        } catch (Exception e) {
            System.err.println(" get_default_json() ["+controlId+"] Error:" + e.getLocalizedMessage());
        }
        return null;
    }


    
    
    /**
     * <h3>Register a button in order to use it in the browser</h3>
     * The name argument must specify an absolute button name {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  name  the http request (HttpServletRequest)
     * @param  style the Id of the control (String)
     * @param  className the configuration the control (String in JSON format)
     * @return      the html definition of the button
     * @see         workspace
     */
    static public String get_button_control(String name, String style, String className) {
        return get_button_control(name, style, className, null, null, false, null );
    }
    /**
     * <h3>Register a button in order to use it in the browser</h3>
     * The name argument must specify an absolute button name {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  name  the http request (HttpServletRequest)
     * @param  style the Id of the control (String)
     * @param  className the configuration the control (String in JSON format)
     * @param  Objects used to overwrite table definition in sTableJson (String)
     * @return      the html definition of the button
     * @see         workspace
     */
    static public String get_button_control(String name, String style, String className, String [] Objects ) {
        return get_button_control(name, style, className, Objects, null, false, null );
    }
    /**
     * <h3>Register a button in order to use it in the browser</h3>
     * The name argument must specify an absolute button name {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  name  the http request (HttpServletRequest)
     * @param  style the Id of the control (String)
     * @param  className the configuration the control (String in JSON format)
     * @param  Objects used to overwrite table definition in sTableJson (String)
     * @param  clientSideCode define the client side code (String)
     * @return      the html definition of the button
     * @see         workspace
     */
    static public String get_button_control(String name, String style, String className, String [] Objects, String clientSideCode ) {
        return get_button_control(name, style, className, Objects, clientSideCode, false, null );
    }
    /**
     * <h3>Register a button in order to use it in the browser</h3>
     * The name argument must specify an absolute button name {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  name  the http request (HttpServletRequest)
     * @param  style the Id of the control (String)
     * @param  className the configuration the control (String in JSON format)
     * @param  Objects used to overwrite table definition in sTableJson (String)
     * @param  clientSideCode define the client side code (String)
     * @param  clientAfter if true execute the client code after the server side code (boolean)
     * @return      the html definition of the button
     * @see         workspace
     */
    static public String get_button_control(String name, String style, String className, String [] Objects, String clientSideCode, boolean clientAfter ) {
        return get_button_control(name, style, className, Objects, clientSideCode, clientAfter, null );
    }
    
    // Aggiunge un oggetto botton_control, raffinando il Json e ritornando l' html per il client
    /**
     * <h3>Register a button in order to use it in the browser</h3>
     * The name argument must specify an absolute button name {@link controlId}.
     * <p>
     * This method returns validate and formattated json for to be rendered in the browser
     *
     * @param  name  the http request (HttpServletRequest)
     * @param  style the Id of the control (String)
     * @param  className the configuration the control (String in JSON format)
     * @param  Objects used as list of controls to pass as parameter to server side (String)
     * @param  clientSideCode define the client side code (String)
     * @param  clientAfter if true execute the client code after the server side code (boolean)
     * @param  additionParams define additional parameter to add to the command (ex.: onUploading, onDownloading ...) (String in JSON format)
     * @return      the html definition of the button
     * @see         workspace
     */
    static public String get_button_control(String name, String style, String className, String [] Objects, String clientSideCode, boolean clientAfter, String additionParams ) {
        try {
            String params = "";
            if(Objects != null) {
                for (String Object : Objects) {
                    params += (params.length()>0?",":"") + "'" + (String)Object + "'";
                }
            }            
            String sCommandJson = "{ "
                    + "name:'"+(name != null ? name : "") + "'"
                    + ",client:'"+(clientSideCode != null ? clientSideCode : "") +"'"
                    + ",server:'"+(className != null ? className : "") + "'"
                    + ",params:["+(params != null ? params : "")+"]"
                    + ",clientAfter:"+clientAfter
                    + "}";            
            JSONObject commandJson = new JSONObject(sCommandJson);
            if(additionParams != null && !additionParams.isEmpty()) {
                JSONObject additionParamsJson = new JSONObject(additionParams);
                utility.mergeJsonObject(additionParamsJson, commandJson);
            }            
            return "<button onclick='Liquid.onButtonFromString(this, \""
                    +(commandJson.toString().replace("\"", "\\\""))
                    +"\");'>"
                    +name
                    +"</button>";            
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return "";
    }

    
    // Servizio login/logout/register/recovery
    /**
     * <h3>Get a button making user login</h3>
     * <p>
     * This method returns html code of a button for login the user
     *
     * @param  name  the name of the button (String)
     * @param  style the css style of the button (String)
     * @param  formName the id oh the form owning the user and password html input (String)
     * @param  callbackCode your javascript callback function (String)

     * @return      the html code of the button
     * @see         workspace
     */
    static public String get_login_button(String name, String style, String formName, String callbackCode ) {
        return get_button_control(name, style, "com.liquid.login.login", new String[] { formName }, callbackCode, true );
    }    
    
    static public String get_login_code(String formName, String callbackCode ) {
        return get_login_general_code("loginCmd", "com.liquid.login.login", formName, callbackCode );
    }    

    /**
     * <h3>Get a button making user logout</h3>
     * <p>
     * This method returns html code of a button for logout the user
     *
     * @param  name  the name of the button (String)
     * @param  style the css style of the button (String)
     * @param  formName the id oh the form owning the user and password html input (String)
     * @param  callbackCode your javascript callback function (String)

     * @return      the html code of the button
     * @see         workspace
     */
    static public String get_logout_button(String name, String style, String formName, String callbackCode ) {
        return get_button_control(name, style, "com.liquid.login.logout", new String[] { formName }, callbackCode, true );
    }    

    static public String get_logout_code(String formName, String callbackCode ) {
        return get_login_general_code("logoutCmd", "com.liquid.login.logout", formName, callbackCode );
    }    

    
    /**
     * <h3>Get a button making registern user</h3>
     * <p>
     * This method returns html code of a button for register new the user (sign into)
     *
     * @param  name  the name of the button (String)
     * @param  style the css style of the button (String)
     * @param  formName the id oh the form owning the user and password html input (String)
     * @param  callbackCode your javascript callback function (String)

     * @return      the html code of the button
     * @see         workspace
     */
    static public String get_register_control(String name, String style, String formName, String callbackCode ) {
        return get_button_control(name, style, "com.liquid.login.register", new String[] { formName }, callbackCode, true );
    }    
    static public String get_register_code(String formName, String callbackCode ) {
        return get_login_general_code("registerCmd", "com.liquid.login.register", formName, callbackCode );
    }    

    /**
     * <h3>Get a button making password recovery</h3>
     * <p>
     * This method returns html code of a button for recovery user's password (password forget)
     *
     * @param  name  the name of the button (String)
     * @param  style the css style of the button (String)
     * @param  formName the id oh the form owning the user and password html input (String)
     * @param  callbackCode your javascript callback function (String)

     * @return      the html code of the button
     * @see         workspace
     */
    static public String get_recovery_control(String name, String style, String formName, String callbackCode ) {
        return get_button_control(name, style, "com.liquid.login.recovery", new String[] { formName }, callbackCode, true );
    }    
    static public String get_recovery_code(String formName, String callbackCode ) {
        return get_login_general_code("recoveryCmd", "com.liquid.login.recovery", formName, callbackCode );
    }    




    static public String get_login_general_code(String name, String server, String formName, String callbackCode ) {
        // Liquid.onButtonFromString(this, "{\"server\":\"com.liquid.login.login\",\"name\":\"loginCmd\",\"client\":\"onLoginResult\",\"clientAfter\":true,\"params\":[\"loginForm\"]}");
        try {
            String params = "";
            params += (params.length()>0?",":"") + "'" + (String)formName + "'";            
            String sCommandJson = "{ "
                    + "name:'"+(name != null ? name : "") + "'"
                    + ",client:'"+(callbackCode != null ? callbackCode : "") +"'"
                    + ",server:'"+(server != null ? server : "") + "'"
                    + ",params:["+(params != null ? params : "")+"]"
                    + ",clientAfter:"+"true"
                    + "}";            
            JSONObject commandJson = new JSONObject(sCommandJson);
            return "onclick='Liquid.onButtonFromString(this, \""
                    +(commandJson.toString().replace("\"", "\\\""))
                    +"\");'";
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return "";
    }    


    
    static public String get_file_content(HttpServletRequest request, String fileName) {
        return get_file_content(request, fileName, false, true);
    }
    static public String get_file_content(HttpServletRequest request, String fileName, boolean trackFileName) {
        return get_file_content(request, fileName, trackFileName, true);
    }
    
    static public String get_file_content(HttpServletRequest request, String fileName, boolean trackFileName, boolean replaceApex) {
        String fileContent = "", lineContent;
        String fullFileName = null;
        try {
            String clsPath = workspace.class.getClassLoader().getResource("").getPath();
            String fullPath = URLDecoder.decode(clsPath, "UTF-8");
            String pathArr[] = fullPath.split("/WEB-INF/classes/");
            fullPath = pathArr[0];
            String path = request != null ? request.getSession().getServletContext().getRealPath("/") : fullPath;
            BufferedReader br = null;
            String localFileName = fileName;
            if(localFileName.charAt(0) == File.separatorChar || localFileName.charAt(0) == '/') 
                localFileName = localFileName.substring(1);

            if(utility.fileExist(fileName)) { // full file name
                fullFileName = fileName;
                File f = new File(fileName);
                fileName = f.getName();
            } else {
                fullFileName = path + (path.charAt(path.length()-1) != File.separatorChar ? File.separatorChar : "" ) + localFileName;
            }
            try { br = new BufferedReader(new FileReader(fullFileName));} catch (FileNotFoundException ex) {}
            
            if(br == null) {
                try { br = new BufferedReader(new FileReader(localFileName));} catch (FileNotFoundException ex) {}
            }
            
            if(br == null) {
                URLClassLoader urlClassLoader = (URLClassLoader) Thread.currentThread().getContextClassLoader();
                for (URL url : urlClassLoader.getURLs() ) {
                    if (url.getPath().contains("Liquid.jar")) {
                        try {
                            fullFileName = "jar:file:" + url.getPath() + "!/META-INF/resources"+fileName;
                            URL inputURL = new URL(fullFileName);
                            if(inputURL != null) {
                                JarURLConnection conn = (JarURLConnection)inputURL.openConnection();
                                if(conn != null) {
                                    InputStream in = conn.getInputStream();
                                    // InputStream in = workspace.class.getClassLoader().getResourceAsStream(inputFile); 
                                    // in = workspace.class.getResourceAsStream(inputFile); 
                                    if(in != null) {
                                        br = new BufferedReader(new InputStreamReader(in));
                                        if(br != null) break;
                                    }
                                }
                            }
                        } catch (Throwable ex) {
                            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                        }
                    }
                }
            }
            if(br != null) {
                while ((lineContent = br.readLine()) != null) {
                    fileContent += lineContent;
                }
                br.close();
            }
        } catch (Throwable ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        if(trackFileName) {
            if(fileContent != null && !fileContent.isEmpty()) {
                if(fileContent.charAt(0) == '{') {
                    try {
                        JSONObject json = new JSONObject(fileContent);
                        if(json != null) {
                            json.put("sourceFileName", utility.base64Encode(fileName));
                            json.put("sourceFullFileName", utility.base64Encode(fullFileName));
                            json.put("token", genesisToken);
                            fileContent = json.toString();
                        }
                    } catch (JSONException ex) {
                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }
        }
        if(replaceApex) {
            fileContent = fileContent.replace("'", "\\'");
        }
        
        return fileContent;
    }

    
    
    static public String set_project_folder(HttpServletRequest request, JspWriter out) {
        try {
            if(request != null) {               
                String liquidJsonsProjectFolder = "", token = "";
                try { liquidJsonsProjectFolder = (String) request.getParameter("liquidJsonsProjectFolder"); } catch (Exception e) { }
                try { token = (String) request.getParameter("token"); } catch (Exception e) { }
                return set_project_folder(request, liquidJsonsProjectFolder, token);
            }
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            return "{\"result\":-1,\"error\":\""+ex.getLocalizedMessage()+"\"}";
        }
        return "{\"result\":0}";
    }
        
    /**
     * <h3>Set the source folder inside your project</h3>
     * <p>
     * This method sat the folder where Liquid save new an changed controls
     *
     * @param  request  the http request (HttpServletRequest)
     * @param  liquidJsonsProjectFolder the folder name where reads control's json files (String)
     * @param  token the genesis token

     * @return      the result of the operation as json string
     * @see         workspace
     */
    static public String set_project_folder(HttpServletRequest request, String liquidJsonsProjectFolder, String token) {
        try {
            if(token != null) {               
                // Verifica tel token : almeno un controllo deve avere il token assegnato (foreign table, lockuo etc hanno il token ereditato
                if(!workspace.isTokenValid(token)) {
                    System.out.println("// LIQUID ERROR : Invalid Token");
                    return "{\"result\":-1,\"error\":\""+utility.base64Encode("Error: invalid token")+"\"}";
                }                
                if(liquidJsonsProjectFolder != null && !liquidJsonsProjectFolder.isEmpty()) {
                    if(!utility.folderExist(liquidJsonsProjectFolder)) {
                        File file = new File(liquidJsonsProjectFolder);
                        if (file.isAbsolute()) {
                        } else {
                            ServletContext servletContext = request.getSession().getServletContext();
                            String absoluteFilePathRoot = utility.strip_last_slash(servletContext.getRealPath("/"));
                            if(liquidJsonsProjectFolder.startsWith("/")) {
                                absoluteFilePathRoot += liquidJsonsProjectFolder;
                            } else {
                                absoluteFilePathRoot += "/" + liquidJsonsProjectFolder;
                            }
                            liquidJsonsProjectFolder = absoluteFilePathRoot;
                        }
                        new File(liquidJsonsProjectFolder).mkdirs();
                    }
                    
                    if(utility.folderExist(liquidJsonsProjectFolder)) {
                        request.getSession().setAttribute("GLLiquidJsonsProjectFolder", liquidJsonsProjectFolder);
                        return "{\"result\":1}";
                    } else {
                        return "{\"result\":1,\"message\":\"folder "+liquidJsonsProjectFolder+" does not exist\"}";
                    }
                } else {
                    return "{\"result\":1,\"message\":\"liquidJsonsProjectFolder resetted\"}";
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            return "{\"result\":-1,\"error\":\""+ex.getLocalizedMessage()+"\"}";
        }
        return "{\"result\":0}";
    }

    
    
    
    /**
     * <h3>Save the json as file in the server</h3>
     * <p>
     * This method create or replace  a json file in the the server and insidce your project
     *
     * @param  request  the request(HttpServletRequest)
     * @param  out the output stream(JspWriter)

     * @return      json result as { "result":1, "message":"" }
     * @see         workspace
     */
    static public String set_file_content(HttpServletRequest request, JspWriter out) {
        try {
            if(request != null) {
                String controlId = "", tblWrk = "";
                String table = "", schema = "", database = "", source = "", token = "";
                try { controlId = (String) request.getParameter("controlId"); } catch (Exception e) { }
                try { token = (String) request.getParameter("token"); } catch (Exception e) { }

                // Verifica tel token : almeno un controllo deve avere il token assegnato (foreign table, lockuo etc hanno il token ereditato
                if(!workspace.isTokenValid(token)) {
                    System.out.println("// LIQUID ERROR : Invalid Token");
                    return "{\"result\":-1,\"error\":\""+utility.base64Encode("Error: invalid token")+"\"}";
                }                
                
                String fileContent = workspace.get_request_content(request);            
                if(fileContent != null && !fileContent.isEmpty()) {
                    if(fileContent.charAt(0) == '{') {
                        JSONObject json = new JSONObject(fileContent);
                        if(json != null) {
                            String fileName = json.has("sourceFileName") ? utility.base64Decode(json.getString("sourceFileName")) : null;
                            String fullFileName = json.has("sourceFullFileName") ? utility.base64Decode(json.getString("sourceFullFileName")) : null;
                            String liquidJsonsProjectFolder = (String)request.getSession().getAttribute("GLLiquidJsonsProjectFolder");
                            
                            if(fileName == null || fileName.isEmpty()) {
                                fileName = controlId + ".json";
                            }
                            fileName = fileName != null ? fileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;
                            fullFileName = fullFileName != null ? fullFileName.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : null;
                            
                            if(fullFileName != null && !fullFileName.isEmpty()) {
                                // salvataggio file nella cartella in produzione
                                try {
                                    Files.write( Paths.get(fullFileName), fileContent.getBytes());
                                } catch (Exception ex) {
                                    return "{\"result\":-1,\"error\":\""+utility.base64Encode(ex.getLocalizedMessage()+" - writing:"+fullFileName)+"\"}";
                                }
                            }
                            if(fileName != null && !fileName.isEmpty()) {
                                if(liquidJsonsProjectFolder != null && !liquidJsonsProjectFolder.isEmpty()) {
                                    // salvataggio file nella cartella del progetto
                                    String insideProjectFileName = liquidJsonsProjectFolder+File.separatorChar+fileName;
                                    if(!insideProjectFileName.equalsIgnoreCase(fullFileName)) {
                                        controlId = getControlIdFromFile(fileName);
                                        String jsVarName = getJSVariableFromControlId(controlId);
                                        boolean bProceed = true;
                                        
                                        // DEBUG : liquidizeJSONContnet(fileContent); return "{\"result\":-1,\"error\":\"\"}";
                                        File f = new File(insideProjectFileName);
                                        if(f == null) {
                                            return "{\"result\":0,\"message\":\""+utility.base64Encode("Invalid file name : "+insideProjectFileName+"")+"\"}";                                            
                                            
                                        } else {                                        
                                            try {
                                                if(utility.fileExist(insideProjectFileName)) {
                                                    bProceed = (Messagebox.show( " File <b>"+insideProjectFileName+"</b> already exist<br/><br/> Do you want to overwrite it ?", "Liquid", Messagebox.YES+Messagebox.NO+Messagebox.WARNING) == Messagebox.YES);
                                                }
                                                if(bProceed) 
                                                    Files.write(Paths.get(insideProjectFileName), liquidizeJSONContent(fileContent).getBytes());
                                                else 
                                                    return "{\"result\":0,\"message\":\"\"}";
                                            } catch (Exception ex) {
                                                return "{\"result\":-1,\"error\":\""+utility.base64Encode(ex.getLocalizedMessage()+" - writing:"+insideProjectFileName)+"\"}";
                                            }
                                            Logger.getLogger(workspace.class.getName()).log(Level.INFO, null, "File in project as <b>"+insideProjectFileName+"</b>");
                                            return "{\"result\":1,\"message\":\""+utility.base64Encode("file in project "+insideProjectFileName+" saved<br/><br/>javascript global var name : <b>"+jsVarName+"</b>")+"\"}";
                                        }

                                    } else {
                                        Logger.getLogger(workspace.class.getName()).log(Level.INFO, null, "file "+insideProjectFileName+" saved by client request");
                                        return "{\"result\":1,\"message\":\""+utility.base64Encode("file "+fullFileName+" saved")+"\"}";
                                    }
                                } else {
                                    return "{\"result\":0,\"message\":\""+utility.base64Encode("liquidJsonsProjectFolder is empty... you should set it by workspace.set_project_folder (and check exists)...")+"\"}";
                                }
                            } else {
                                return "{\"result\":0,\"message\":\""+utility.base64Encode("file name is empty")+"\"}";
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            return "{\"result\":-1,\"error\":\""+utility.base64Encode(ex.getLocalizedMessage())+"\"}";
        }
        return "{\"result\":0}";
    }

    
    static public int get_column( String table, JSONArray cols, String key, String searching ) {
        String [] searchColParts = searching.split("\\.");
        String searchTable = null, searchField = null;
        if(searchColParts.length > 1) {
            searchTable = table;
            if(searchColParts[0] != null && !searchColParts[0].isEmpty())
                searchTable = searchColParts[0];
            else 
                searchTable = table;
            if(searchColParts[1] != null && !searchColParts[1].isEmpty())
                searchField = searchColParts[1];
            else 
                searchField = "";
        } else {
            searchTable = table;
            searchField = searching;
        }
        
        for(int ic=0; ic<cols.length(); ic++) {
            try {
                JSONObject col = cols.getJSONObject(ic);
                String colName = null;
                try { colName = col.getString(key != null ? key : "name");  } catch (Exception ex) {}
                    String [] colParts = colName.split("\\.");
                    String colTable = null, colField = null;
                    if(colParts.length > 1) {
                        if(colParts[0] != null && !colParts[0].isEmpty())
                            colTable = colParts[0];
                        else 
                            colTable = table;
                        if(colParts[1] != null && !colParts[1].isEmpty())
                            colField = colParts[1];
                        else 
                            colField = "";
                    } else {
                        colTable = table;
                        colField = colName;
                    }
                    
                if(searchTable.equalsIgnoreCase(colTable) && searchField.equalsIgnoreCase(colField)) {
                    return ic+1;
                }
                
            } catch (JSONException ex) {
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return 0;
    }
    

    /**
     * <h3>Change the owner of a control</h3>
     * <p>
     * This method update the owner (responsive class) of a control
     *
     * @param  controlId  the control id (String)
     * @param  newOwner the class instance of the new owner (Object)

     * @return      true id none, false, otherwise
     * @see         workspace
     */
    static public boolean changeOwner( String controlId, Object newOwner ) {
        for(int i=0; i<glTblWorkspaces.size(); i++) {
            workspace tblWorkspace = glTblWorkspaces.get(i);
            if(tblWorkspace.controlId.equalsIgnoreCase(controlId)) {
                tblWorkspace.owner = newOwner;
                return true;
            }
        }
        return false;
    }

    public static String arrayToString(Object[] objs, String prefix, String postfix, String separator) {
        StringBuilder listObj = new StringBuilder();
        if (objs != null) {
            for (int ct = 0; ct < objs.length; ct++) {
                if (ct > 0) {
                    listObj.append(separator);
                }
                listObj.append((prefix != null ? prefix : "") + (objs[ct] != null ? objs[ct].toString() : "") + (postfix != null ? postfix : ""));
            }
        }
        return listObj.toString();
    }
    public static String jsonArrayToString(JSONArray objs, String prefix, String postfix, String separator) {
        StringBuilder listObj = new StringBuilder();
        if (objs != null) {
            for (int ct = 0; ct < objs.length(); ct++) {
                try {
                    if (ct > 0) {
                        listObj.append(separator);
                    }
                    Object value = objs.get(ct);
                    listObj.append((prefix != null ? prefix : "") + (value != null ? value.toString() : "") + (postfix != null ? postfix : ""));
                } catch (JSONException ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        return listObj.toString();
    }
    public static ArrayList<String> jsonArrayToArrayList(JSONArray objs, String prefix, String postfix) {
        ArrayList<String> result = new ArrayList<String>();
        if (objs != null) {
            for (int ct = 0; ct < objs.length(); ct++) {
                try {
                    Object value = objs.get(ct);
                    result.add((prefix != null ? prefix : "") + (value != null ? value.toString() : "") + (postfix != null ? postfix : ""));
                } catch (JSONException ex) {
                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        return result;
    }
 
    /**
     * <h3>Get array from string, respecting comma separated strings</h3>
     * <p>
     * This method get an array of string, typically the primary key list
     *
     * @param  ids  the id list to split(String)

     * @return      Array of string (String [])
     * @see         workspace
     */
    public static String [] split( String ids ) {
        if(ids != null) {
            return ids.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
        } else {
            return null;
        }
    }
    
    /**
     * <h3>Get the current seletion of a control</h3>
     * <p>
     * This method get the primary key list selected, as including or excluding list
     * \nEx.: 1,2,3 means the selction is three rows having as primary key "1", "2", "3"
     * \nEx.: !4,5 means the selction is all rows NOT having as primary key "4", "5"
     *
     * @param  controlId  the control id (String)
     * @param  params the class instance of the new owner (Object)

     * @return      comma separated values string, null if no selection defined
     * @see         workspace
     */
    static public String getSelection(String controlId, String params) {
        try {
            JSONArray paramsJson = (JSONArray)(new JSONObject(params)).getJSONArray("params");
            for(int i=0; i<paramsJson.length(); i++) {
                Object ojson= paramsJson.get(i);
                if(ojson instanceof JSONObject) {
                    JSONObject obj = (JSONObject)paramsJson.get(i);
                    String ids = null;
                    if(obj != null) {
                        if(obj.has("name")) {
                            if(obj.getString("name").equalsIgnoreCase(controlId)) {
                                String prefix = "";
                                if(obj.has("ids")) {
                                    // All o lista inclusione
                                    ids = obj.getString("ids");
                                } else if(obj.has("sel")) {
                                    ids = obj.getString("sel");
                                }
                                if(obj.has("unsel")) {
                                    // Lista exclusione
                                    ids = obj.getString("unsel");
                                    prefix = "!";
                                }
                                if(ids != null && ids.length() >= 2) {
                                    ids = ids.substring(1, ids.length()-1);
                                    return prefix+ids;
                                }
                            }
                        }
                    }
                }
            }
        } catch (JSONException ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    static public String getData(String controlId, String params, String column) {
        try {
            JSONArray paramsJson = (JSONArray)(new JSONObject(params)).getJSONArray("params");
            for(int i=0; i<paramsJson.length(); i++) {
                JSONObject obj = (JSONObject)paramsJson.get(i);
                if(obj != null) {
                    if(obj.has("data")) {
                        JSONObject data = obj.getJSONObject("data");
                        boolean bFoundControl = false;
                        if(data.has("name")) {
                            String name = data.getString("name");
                            if(name != null) {
                                if(name.equalsIgnoreCase(controlId)) {
                                    bFoundControl = true;
                                }
                            }
                        } else {
                            bFoundControl = true;                                
                        }
                        if(bFoundControl) {
                            if(data.has(column)) {
                                return data.getString(column);
                            }
                        }
                    }
                }
            }
        } catch (JSONException ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    
    // Wrappers
    static public String getSelection(Object tbl_wrk, String params) {
        return getSelection(((workspace)tbl_wrk).controlId, params);
    }
    static public String getData(Object tbl_wrk, String params, String column) {
        return getData(((workspace)tbl_wrk).controlId, params, column);
    }
    
    static public String get_request_content(HttpServletRequest request) {
        try {
            StringBuilder buffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            int offset = 0, read = 0;
            int size = 8192;
            char [] chunk = new char [size];
            try {
	            while (read >= 0) {
	            	read = reader.read(chunk, 0, size);
	            	if(read > 0) {
	            		buffer.append(chunk, 0, read);
	            		offset += read;
	            	}
	            }
	            return buffer.toString();
            } catch (Throwable t) {
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, t);                
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "Try to increase \"-Xmx\" \"-XX:MaxPermSize\" JVM parameters");
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "Current \"-Xmx\":"+Runtime.getRuntime().maxMemory() /1024/1024+"Mb, totalMemory:"+Runtime.getRuntime().totalMemory() /1024/1024+"Mb");
                 
            }
	            
        } catch (Exception ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
 
    static boolean check_database_definition( Connection conn, String database ) {
        if(database != null && !database.isEmpty()) {
            String driverDatabase = null;
            try {
                if(conn != null) {
                    driverDatabase = conn.getCatalog();
                    if(driverDatabase != null && !driverDatabase.isEmpty()) {
                        if(!driverDatabase.equalsIgnoreCase(database)) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } catch (SQLException ex) {
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return true;
    }

    static String getControlIdFromFile(String fileName) {
        String controlId = "";
        if(fileName != null && !fileName.isEmpty()) {
            fileName = fileName.replaceAll("@", "0");
            if(fileName.endsWith(".json"))
                fileName = fileName.substring(0, fileName.lastIndexOf(".json"));
            return liquidize.liquidizeString(fileName, controlIdSeparator);
        }
        return null;
    }

    
    // iCenter.icenter.user_asset   ->  iCenter|.center.UserAsset
    static String getControlIdFromDatabaseSchemaTable(String databaseSchemaTable) {
        if(databaseSchemaTable != null && !databaseSchemaTable.isEmpty()) {
            databaseSchemaTable = databaseSchemaTable.replaceAll("`", "");
            databaseSchemaTable = databaseSchemaTable.replaceAll("\"", "");
            return liquidize.liquidizeString(databaseSchemaTable, controlIdSeparator);
        }
        return null;
    }
    // iCenter.icenter.user_asset   ->  iCenter|.center.UserAsset
    static String getDatabaseSchemaTable(String database, String schema, String Table) {
        String sDatabaseSchemaTable = "";
        if(database != null && !database.isEmpty()) {
            sDatabaseSchemaTable += database+".";
        }
        if(schema != null && !schema.isEmpty()) {
            sDatabaseSchemaTable += schema+".";
        }
        if(Table != null && !Table.isEmpty()) {
            sDatabaseSchemaTable += Table;
        } else {
            return "";
        }
        return sDatabaseSchemaTable;
    }
    
    // iCenter.icenter.user_asset   ->  UserAsset
    static String getControlIdFromTable(String table) {
        if(table != null && !table.isEmpty()) {
            table = table.replaceAll("`", "");
            table = table.replaceAll("\"", "");
            return liquidize.liquidizeString(table, controlIdSeparator, true);
        }
        return null;
    }
    
    static String getJSVariableFromControlId(String controlId) {
        if(controlId != null && !controlId.isEmpty()) {
            controlId = controlId.replaceAll("\\.", "_");
            String [] sSubParts = controlId.split("_");
            String result = "";
            if(sSubParts.length > 1) {
                for(int ips=0; ips<sSubParts.length; ips++) {
                    result += "gl"+(sSubParts[ips].substring(0,1).toUpperCase()+sSubParts[ips].substring(1).toLowerCase())+"JSON";
                }
            } else {
                result += "gl"+(controlId.substring(0,1).toUpperCase()+controlId.substring(1))+"JSON";
            }
            return result;
        }
        return null;
    }
   
    static String isSystemLiquid( JSONObject tableJson ) {
        boolean isSystemLiquid = false;
        if(tableJson!=null) {
            String selectDatabases = null, selectSchemas = null, selectTables = null, selectViews = null, selectColumns = null, selectForeignKeys = null;
            try { selectDatabases = tableJson.getString("selectDatabases"); } catch(Exception e) {}
            try { selectSchemas = tableJson.getString("selectSchemas"); } catch(Exception e) {}
            try { selectTables = tableJson.getString("selectTables"); } catch(Exception e) {}
            try { selectViews = tableJson.getString("selectViews"); } catch(Exception e) {}
            try { selectColumns = tableJson.getString("selectColumns"); } catch(Exception e) {}
            try { selectForeignKeys = tableJson.getString("selectForeignKeys"); } catch(Exception e) {}
            if(selectDatabases != null && !selectDatabases.isEmpty()) {
                return "selectDatabases";
            } else if (selectSchemas != null && !selectSchemas.isEmpty()) {
                return "selectSchemas";
            } else if (selectTables != null && !selectViews.isEmpty()) {
                return "selectTables";
            } else if (selectViews != null && !selectViews.isEmpty()) {
                return "selectViews";
            } else if (selectColumns != null && !selectColumns.isEmpty()) {
                return "selectColumns";
            } else if (selectForeignKeys != null && !selectForeignKeys.isEmpty()) {
                return "selectForeignKeys";
            }
        }
        return null;
    }
    
    static String getColumnName(Object tbl_wrk, int columnIndex) throws JSONException {
        return ((workspace)tbl_wrk).tableJson.getJSONArray("columns").getJSONObject(columnIndex).getString("name");
    }
    static String getColumnField(Object tbl_wrk, int columnIndex) throws JSONException {
        return ((workspace)tbl_wrk).tableJson.getJSONArray("columns").getJSONObject(columnIndex).getString("field");
    }
    static String getColumnLabel(Object tbl_wrk, int columnIndex) throws JSONException {
        return ((workspace)tbl_wrk).tableJson.getJSONArray("columns").getJSONObject(columnIndex).getString("label");
    }
    static String getColumnType(Object tbl_wrk, int columnIndex) throws JSONException {
        return ((workspace)tbl_wrk).tableJson.getJSONArray("columns").getJSONObject(columnIndex).getString("type");
    }
    static JSONObject getColumn(Object tbl_wrk, int columnIndex) throws JSONException {
        return ((workspace)tbl_wrk).tableJson.getJSONArray("columns").getJSONObject(columnIndex);        
    }
    static JSONObject getColumn(Object tbl_wrk, String columnName) throws JSONException {
        JSONArray cols = ((workspace)tbl_wrk).tableJson.getJSONArray("columns");
        for(int i=0; i<cols.length(); i++) {
            if(cols.getJSONObject(i).getString("nsme").equalsIgnoreCase(columnName)) return cols.getJSONObject(i);
        }
        return null;
    }
    
    
    static ArrayList<String> getPythonPath() {
        ArrayList<String> result = new ArrayList<String>();
        String path1 = System.getenv("PYTHON");
        if(path1 != null && !path1.isEmpty())
            result.add(path1);
        String path2 = System.getenv("PYTHONPATH");
        if(path2 != null && !path2.isEmpty())
            result.add(path2);
        String path3 = System.getenv("PYTHON3");
        if(path3 != null && !path3.isEmpty())
            result.add(path3);
        String pathX = System.getenv("PATH");
        if(pathX != null && !pathX.isEmpty()) {
            String [] paths = pathX.split(";");
            for (String path : paths) {
                if(path.indexOf("python") >= 0 || path.indexOf("Python") >= 0) {
                    result.add(path);
                }
            }
        }        
        return result;        
    }

    static public String getPythonInterpreter() {
        String execFile = null;
        String os = System.getProperty("os.name").toLowerCase();
        ArrayList<String> exes = new ArrayList<String>();
        exes.add(pythonExecutable != null ? pythonExecutable : "python3");
        exes.add(pythonExecutable != null ? pythonExecutable : "python");
        exes.add("py");
        for(String exe : exes) {
            if(pythonPath != null && !pythonPath.isEmpty()) {
                execFile = pythonPath + utility.appendSeparator(pythonPath) + exe + (os.contains("win") ? ".exe" : "");
                if (utility.fileExist(execFile)) {
                    return execFile;
                }
            }
            ArrayList<String> paths = getPythonPath();
            for (String path : paths) {
                execFile = path + utility.appendSeparator(pythonPath) + exe + (os.contains("win") ? ".exe" : "");
                if (utility.fileExist(execFile)) {
                    return execFile;
                }
            }
        }
        return "py";
    }
    
    
    
    /**
     * <h3>Add the item to the black list</h3>
     * <p>
     * This method add the database.schema.table to the black list
     * </p>
     * @param  database  the database of the table to add (String)
     * @param  schema  the schema of the table to add (String)
     * @param  table  the table to add (String)
     * 
     * @return
     *  This method return true if the item was added

     * @see         BlackWhiteList
     */  
    static public boolean addToBlackList(String database, String schema, String table) {
        return BlackWhiteList.addToBlackList(database, schema, table);
    }
    
    
    /**
     * <h3>Add the item to the white list</h3>
     * <p>
     * This method add the database.schema.table to the white list
     * </p>
     * @param  database  the database of the table to add (String)
     * @param  schema  the schema of the table to add (String)
     * @param  table  the table to add (String)
     * 
     * @return
     *  This method return true if the item was added

     * @see         BlackWhiteList
     */    
    static public boolean addToWhiteList(String database, String schema, String table) {
        return BlackWhiteList.addToWhiteList(database, schema, table);
    }

    /**
     * <h3>Remove the item from the black list</h3>
     * <p>
     * This method search and remove the database.schema.table from the black list
     * </p>
     * @param  database  the database of the table to remove (String)
     * @param  schema  the schema of the table to remove (String)
     * @param  table  the table to remove (String)
     * 
     * @return
     *  This method return true if the item was found and removed

     * @see         BlackWhiteList
     */    
    static public boolean removeFromBlackList(String database, String schema, String table) {
        return BlackWhiteList.removeFromBlackList(database, schema, table);
    }
    
    /**
     * <h3>Remove the item from the white list</h3>
     * <p>
     * This method search and remove the database.schema.table from the white list
     * </p>
     * @param  database  the database to of the table to remove (String)
     * @param  schema  the schema of the table to remove (String)
     * @param  table  the table to remove (String)
     * 
     * @return
     *  This method return true if the item was found and removed

     * @see         BlackWhiteList
     */    
    static public boolean removeFromWhiteList(String database, String schema, String table) {
        return BlackWhiteList.removeFromWhiteList(database, schema, table);
    }    
    
    public int addSession( ThreadSession threadSession ) {
        for(int i=0; i<sessions.size(); i++) {
            ThreadSession ts = sessions.get(i);
            if(ts != null) {
                if(ts.threadId == threadSession.threadId) {
                    return 0;
                }
            }
        }
        sessions.add(threadSession);
        return sessions.size();
    }
    
}
