package com.liquid;

import static com.liquid.connection.getLiquidDBConnection;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Random;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.ServletContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.servlet.jsp.JspWriter;
import org.json.JSONObject;
import org.json.JSONArray;


// TODO : supporto per oracle e sqlserver (creazione tabelle se inesistenti)

public class login {

    // N.B.: application_id e domain_id, daysValidity, emailAppName, emailAppURL, emailFrom dipendono dalle sessione
    
    static public String adminEmail = null;
        
    // Se driver/host/database sono valorizzati la connessione è esplicita, altrimenti
    static public boolean connRead = false;
    static public boolean connDefined = false;
    static public String driver = null;
    static public String host = null;
    static public String port = null;
    static public String database = null;
    static public String user = null;
    static public String password = null;
    static public ArrayList<String> connectionURL = null;

    // coordinate tabella utenti
    static public String schema = null;
    static public String table = null;
    static public int daysValidity = 0;
    
    static public String [] additionalProperties = null;
    static public String additionalPropertiesPrefix = null;
    
    // coordinate tabella log eventi
    static public String schemaLog = null;
    static public String tableLog = null;
    static public boolean setupLogDone = false;
    
    static public int maxWrongPasswordEvent = 3;
    static public int maxWrongPasswordDisable = 0;
    
    static private String itemIdString = "\"";
    static private String tableIdString = "";
    static private boolean debug = true;
    static private String password_seed = "Liquid2020";
    
    static public int minCharsUser = 3;
    static public int minCharsPasswords = 6;
    private static boolean allowDuplicateUserName = false;
    
    
    // Filter on ip address
    static class ipFilter {
        String ip = null;
        int type = 0;
        
        ipFilter(String ip, String typeOf) {
            this.type = ("enabled".equalsIgnoreCase(typeOf) ? 1 : 0 );
            this.ip = ip;
        }
    }
    
    static public ArrayList<ipFilter>FilterIPs = null;

    
            

    static public void setApplicationId(HttpServletRequest request, String applicationId) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginApplicationId", applicationId);
    }
    static public void setDomainId(HttpServletRequest request, String domain_id) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginDomainId", domain_id);
    }
    static public String getApplicationId(HttpServletRequest request) {
        if(request != null)
            return (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
        return null;
    }
    static public String getDomainId(HttpServletRequest request) {
        if(request != null)
            return (String)request.getSession().getAttribute("GLLiquidLoginDomainId");
        return null;
    }
    static public void setDaysValidity(HttpServletRequest request, int daysValidity) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginDaysValidity", daysValidity);
    }
    
    static public void  setEmailAppName(HttpServletRequest request, String emailAppName) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginEmailAppName", emailAppName);
    }
    static public void  setEmailAppURL(HttpServletRequest request, String emailAppURL) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginEmailAppURL", emailAppURL);
    }
    static public void  setEmailAppImage(HttpServletRequest request, String emailAppImage) {
        if(request != null) {
            ServletContext servletContext = request.getSession().getServletContext();
            request.getSession().setAttribute("GLLiquidLoginEmailAppImage", servletContext.getRealPath(emailAppImage));
        }
    }    
    static public void  setEmailFrom(HttpServletRequest request, String emailFrom) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidLoginEmailFrom", emailFrom);
    }

    
    //
    // Please Note : to define custon connection you need to define driver, database, and schema
    //              user and or password may be null
    //
    static public Object [] getConnection() throws ClassNotFoundException, SQLException, Throwable {
        Connection conn = null;
        Object[] connResult = null;

        if(connRead) {
            if(connDefined) {
                // defined by driver/database/user
                connResult = getLiquidDBConnection(null, driver, host, port, database, user, password);
            } else {
                // host/driver/database NOT defined : use app.liquid.dbx or JDBCsources
                connResult = connection.getDBConnection();
            }
        } else if(!connRead) {
            connRead = true;
            if( driver != null && database != null && schema != null && !driver.isEmpty() && !database.isEmpty() && !schema.isEmpty() ) {
                // defined by driver/database/user
                connDefined = true;
                connResult = getLiquidDBConnection(null, driver, host, port, database, user, password);
            } else {
                // host/driver/database NOT defined : use app.liquid.dbx or JDBCsources
                connDefined = false;
                connResult = connection.getDBConnection();
            }
            if(table == null || table.isEmpty())
                table = "users";

            driver = db.getDriver(conn);

            itemIdString = "\"";
            tableIdString = "\"";
            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                itemIdString = "`";
                tableIdString = "";
            } else if("postgres".equalsIgnoreCase(driver)) {
                itemIdString = "\"";
            } else if("oracle".equalsIgnoreCase(driver)) {
                itemIdString = "\"";
            } else if("sqlserver".equalsIgnoreCase(driver)) {
                itemIdString = "\"";
            }
        }
        
        return connResult;
    }

    static boolean prepare_database(Connection conn) {
        try {
            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
            } else if("postgres".equalsIgnoreCase(driver)) {
                try {
                    PreparedStatement psdoLogin = conn.prepareStatement("CREATE EXTENSION pgcrypto");
                    if(psdoLogin != null) {
                        ResultSet rsdoLogin = psdoLogin.executeQuery();
                        if (rsdoLogin != null) {
                            String error = "";
                            while(rsdoLogin.next()) {
                                error += "\n" + rsdoLogin.getString(1);
                            }
                            rsdoLogin.close();
                        }
                        psdoLogin.close();
                    }
                } catch (Exception e) { 
                    // Logger.getLogger(login.class.getName()).log(Level.SEVERE, null, e);
                }

                try {
                    Statement sqlSTMTUpdate = conn.createStatement();
                    if (sqlSTMTUpdate.executeUpdate("SET SESSION old_passwords=FALSE;") <= 0) {
                    }
                } catch (Exception e) { }
            } else if("oracle".equalsIgnoreCase(driver)) {
            } else if("sqlserver".equalsIgnoreCase(driver)) {
            }
        } catch (Throwable e) {
            Logger.getLogger("prepare_database() error : "+e.getLocalizedMessage());
        }
        return true;
    }

    static private boolean check_login_table_exist( Connection conn, String schema, String table ) throws SQLException {
        try {
            if(conn != null && conn.isValid(30)) {
                boolean tableExist = false;
                DatabaseMetaData meta = conn.getMetaData();
                ResultSet res = meta.getTables(database, schema, table, new String[] {"TABLE"});
                while (res.next()) {
                    if(res.getString("TABLE_NAME") != null) {
                        tableExist = true;
                    }
                }
                res.close();
                if(!tableExist) {
                    ArrayList<String> sql = new ArrayList<String>();

                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                        // CREATE users ADD id, user VARCHAR(256), email VARCHAR(256), password VARCHAR(256), status VARCHAR(16), domain_id VARCHAR(256), application_id VARCHAR(64), token VARCHAR(32), expire TIMESTAMP, naccess INT, nfails INT)
                        sql.add("SET sql_mode='';");
                        sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                            +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                            +",`user` VARCHAR(256) NOT NULL"
                            +",`email` VARCHAR(256) NOT NULL"
                            +",`password` VARCHAR(256) NOT NULL"
                            +",`status` VARCHAR(16) NOT NULL"
                            +",`admin` INT DEFAULT 0"
                            +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                            +",`domain_id` VARCHAR(256) NOT NULL"
                            +",`application_id` VARCHAR(64) NOT NULL"
                            +",`token` VARCHAR(256) NOT NULL"
                            +",`expire` VARCHAR(256) NOT NULL"
                            +",`naccess` INT DEFAULT 0"
                            +",`nfails` INT DEFAULT 0"
                            +",`emailValidated` INT DEFAULT 0"
                            +",`emailToken` VARCHAR(32) NOT NULL"
                            +")"
                        );
                    } else if("postgres".equalsIgnoreCase(driver)) {
                        String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+table+"_id_seq";
                        sql.add("CREATE SEQUENCE "+seqName+"");
                        sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                            +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                            +",\"user\" VARCHAR(256) NOT NULL"
                            +",\"email\" VARCHAR(256) NOT NULL"
                            +",\"password\" VARCHAR(256) NOT NULL"
                            +",\"status\" VARCHAR(16) NOT NULL"
                            +",\"admin\" INT DEFAULT 0"
                            +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                            +",\"domain_id\" VARCHAR(256) NOT NULL"
                            +",\"application_id\" VARCHAR(64) NOT NULL"
                            +",\"token\" VARCHAR(256) NOT NULL"
                            +",\"expire\" VARCHAR(256) NOT NULL"
                            +",\"naccess\" INT DEFAULT 0"
                            +",\"nfails\" INT DEFAULT 0"
                            +",\"emailValidated\" INT DEFAULT 0"
                            +",\"emailToken\" VARCHAR(32) NOT NULL"
                            +")"
                        );

                        sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                    } else if("oracle".equalsIgnoreCase(driver)) {
                    } else if("sqlserver".equalsIgnoreCase(driver)) {
                    }
                    if(sql != null) {
                        for(int is=0; is<sql.size(); is++) {
                            PreparedStatement psdoLogin = null;
                            PreparedStatement psdoSetup = null;
                            try {
                                psdoLogin = conn.prepareStatement(sql.get(is));
                                psdoLogin.executeUpdate();
                            } catch (Throwable e) {
                                Logger.getLogger("// check_login_table_exist() Error:" + e.getLocalizedMessage());
                            }
                            psdoLogin.close();
                            psdoLogin = null;
                        }
                        tableExist = true;
                    } else {
                        // message = "unbale to create table, unsupported driver :"+driver;
                        // return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";
                    }                
                }
                return tableExist;
            }
        } catch (Throwable e) {
            Logger.getLogger("check_login_table_exist() error : "+e.getLocalizedMessage());
        }
        return false;
    }
    
    static public String login (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        try {            
            if(params != null) {
                JSONObject rootJson = new JSONObject((String)params);
                if(rootJson != null) {
                    JSONArray paramsJson  = rootJson.getJSONArray("params");
                    for(int i=0; i<paramsJson.length(); i++) {
                        JSONObject paramJson = (JSONObject)paramsJson.get(i);
                        if(paramJson.has("form")) {
                            if(paramJson.has("data")) {
                                JSONObject dataJson = paramJson.getJSONObject("data");
                                if(dataJson != null) {
                                    String application_id = dataJson.has("application_id") ? dataJson.getString("application_id") : "";
                                    String domain_id = dataJson.has("domain_id") ? dataJson.getString("domain_id") : "";
                                    String sUserID = dataJson.has("user") ? dataJson.getString("user") : "";
                                    String sEMail = dataJson.has("email") ? dataJson.getString("email") : "";
                                    String sPassword = dataJson.has("password") ? dataJson.getString("password") : "";
                                    String sRedirect = dataJson.has("redirect") ? dataJson.getString("redirect") : "";
                                    HttpServletRequest request = (HttpServletRequest)freeParam;
                                    return login( application_id, domain_id, sUserID, sEMail, sPassword, sRedirect, request);
                                }
                            }
                        }
                    }
                }
            }            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println("// login() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    static public String logout (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        try {            
            if(params != null) {
                HttpServletRequest request = (HttpServletRequest)freeParam;
                JSONObject rootJson = new JSONObject((String)params);
                if(rootJson != null) {
                    JSONArray paramsJson  = rootJson.getJSONArray("params");
                    for(int i=0; i<paramsJson.length(); i++) {
                        JSONObject paramJson = (JSONObject)paramsJson.get(i);
                        if(paramJson.has("form")) {
                            if(paramJson.has("data")) {
                                JSONObject dataJson = paramJson.getJSONObject("data");
                                if(dataJson != null) {
                                    String sRedirect = dataJson.has("redirect") ? dataJson.getString("redirect") : "";
                                    return logout( sRedirect, request );
                                }
                            }
                        }
                    }
                }
                // No params .. still to logout ...
                return logout( null, request );
            }            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                Logger.getLogger("// login() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    static public String register( Object tbl_wrk, Object params, Object clientData, Object freeParam ) throws IOException {
        try {            
            if(params != null) {
                JSONObject rootJson = new JSONObject((String)params);
                if(rootJson != null) {
                    JSONArray paramsJson  = rootJson.getJSONArray("params");
                    for(int i=0; i<paramsJson.length(); i++) {
                        JSONObject paramJson = (JSONObject)paramsJson.get(i);
                        if(paramJson.has("form")) {
                            if(paramJson.has("data")) {
                                JSONObject dataJson = paramJson.getJSONObject("data");
                                if(dataJson != null) {
                                    String application_id = dataJson.has("application_id") ? dataJson.getString("application_id") : "";
                                    String domain_id = dataJson.has("domain_id") ? dataJson.getString("domain_id") : "";
                                    String sUserID = dataJson.has("user") ? dataJson.getString("user") : "";
                                    String sEMail = dataJson.has("email") ? dataJson.getString("email") : "";
                                    String sRegisterUserID = dataJson.has("registerUser") ? dataJson.getString("registerUser") : "";
                                    String sRegisterEMail = dataJson.has("registerEmail") ? dataJson.getString("registerEmail") : "";
                                    String sRegisterPassword = dataJson.has("registerPassword") ? dataJson.getString("registerPassword") : "";
                                    String sStatus = dataJson.has("status") ? dataJson.getString("status") : "";
                                    String sAdmin = dataJson.has("admin") ? dataJson.getString("admin") : "";
                                    String sRegisterRedirect = dataJson.has("registerRedirect") ? dataJson.getString("registerRedirect") : "";
                                    HttpServletRequest request = (HttpServletRequest)freeParam;
                                    return register( application_id, domain_id, (sRegisterUserID != null && !sRegisterUserID.isEmpty() ? sRegisterUserID : sUserID), (sRegisterEMail != null && !sRegisterEMail.isEmpty() ? sRegisterEMail : sEMail), sRegisterPassword, sStatus, sAdmin, sRegisterRedirect, request );                                    
                                }
                            }
                        }
                    }
                }
            }            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                Logger.getLogger("// register() Error:" + e.getLocalizedMessage());
                if(debug) {
                    HttpServletRequest request = (HttpServletRequest)freeParam;
                    HttpServletResponse response = (HttpServletResponse)request.getAttribute("response");
                    e.printStackTrace(new java.io.PrintStream(response.getOutputStream()));
                }
            } else {
                Logger.getLogger("// register() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    static public String recovery (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        try {            
            if(params != null) {
                JSONObject rootJson = new JSONObject((String)params);
                if(rootJson != null) {
                    JSONArray paramsJson  = rootJson.getJSONArray("params");
                    for(int i=0; i<paramsJson.length(); i++) {
                        JSONObject paramJson = (JSONObject)paramsJson.get(i);
                        if(paramJson.has("form")) {
                            if(paramJson.has("data")) {
                                JSONObject dataJson = paramJson.getJSONObject("data");
                                if(dataJson != null) {
                                    String application_id = dataJson.has("application_id") ? dataJson.getString("application_id") : "";
                                    String domain_id = dataJson.has("domain_id") ? dataJson.getString("domain_id") : "";
                                    String sUserID = dataJson.has("user") ? dataJson.getString("user") : "";
                                    String sEMail = dataJson.has("email") ? dataJson.getString("email") : "";
                                    String sPassword = dataJson.has("password") ? dataJson.getString("password") : "";
                                    String sStatus = dataJson.has("status") ? dataJson.getString("status") : "";
                                    String sAdmin = dataJson.has("admin") ? dataJson.getString("admin") : "";
                                    String sRedirect = dataJson.has("redirect") ? dataJson.getString("redirect") : "";
                                    HttpServletRequest request = (HttpServletRequest)freeParam;
                                    return recovery(application_id, domain_id, sUserID, sEMail, sPassword, sRedirect, request);
                                }
                            }
                        }
                    }
                }
            }            
        } catch (Throwable e) {
            Logger.getLogger("// recovery() Error:" + e.getLocalizedMessage());
        }        
        return null;
    }

    
    static public String login(HttpServletRequest request, HttpServletResponse response, JspWriter out) {
        JSONObject requestJson = null;
        
        try {
        
            String RemoteIP = request.getRemoteAddr();
            String sUserID = null, sRegisterUserID = null;
            String sEMail = null, sRegisterEMail = null;
            String sPassword = null;
            String application_id = null;
            String domain_id = "";

            String sRedirect = null;

            application_id = request.getParameter("application_id");
            domain_id = request.getParameter("domain_id");
            sUserID = request.getParameter("user");
            sEMail = request.getParameter("email");
            sPassword = request.getParameter("password");

            sRedirect = request.getParameter("redirect");
            
            String sRequest = workspace.get_request_content(request);
            try {
                if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
            } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }
        
            return login( application_id, domain_id, sUserID, sEMail, sPassword, sRedirect, request );
            
        } catch (Exception e) { 
            Logger.getLogger("// login() Error:" + e.getLocalizedMessage());
            return "{ \"result\":-60, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
    }
    
    
    static public String login( String application_id, String domain_id, String sUserID, String sEMail, String sPassword, String sRedirect, HttpServletRequest request) {
        HttpSession session = request.getSession();
        ResultSet rsdoLogin = null;
        PreparedStatement psdoLogin = null;
        PreparedStatement psdoSetup = null;
        ResultSet rsdoSetup = null;
        boolean doAutentication = true;
        String cLang = "it";
        String sUserImpersonatingID = null;

        String Debug = null;
        String message = null;
        String sqlSTMT = null;
        String encPassword = "";
        String schemaTable = "";
        String databaseSchemaTable = "";

        String out_string = "", error = "";
        Connection conn = null;
        
        if(application_id == null || application_id.isEmpty())
            application_id = (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
        if(domain_id == null || domain_id.isEmpty())
            domain_id = (String)request.getSession().getAttribute("GLLiquidLoginDomainId");                                        

        
        sUserID = utility.base64Decode(sUserID);
        sEMail = utility.base64Decode(sEMail);
        sPassword = utility.base64Decode(sPassword);
        sRedirect = utility.base64Decode(sRedirect);
                
        try {

            Object [] connResult = getConnection();
            conn = (Connection)connResult[0];
            String connError = (String)connResult[1];

            if(conn != null && conn.isValid(30)) {

                try {

                    schemaTable = "";
                    databaseSchemaTable = "";
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

                } catch (Exception e) {
                    error += "Error:" + e.getLocalizedMessage();
                }

                String defaultDatabase = conn.getCatalog();
                
                boolean databaseExist = false;
                boolean schemaExist = false;
                boolean tableExist = false;

                DatabaseMetaData meta = conn.getMetaData();
                ResultSet res = meta.getCatalogs();
                while (res.next()) {
                    String db = res.getString("TABLE_CAT");
                    if(db == null || db.isEmpty()) db = defaultDatabase;
                    if(db.equalsIgnoreCase(database) || database == null || database.isEmpty()) {
                        if(database == null || database.isEmpty())
                            database = res.getString("TABLE_CAT");
                        databaseExist = true;
                        break;
                    }
                }
                res.close();
                if(!databaseExist) {
                    db.create_database(conn, database);
                }
                
                
                db.set_current_database(conn, database, driver, tableIdString);
                    
                    
                    

                meta = conn.getMetaData();
                res = meta.getSchemas();
                while (res.next()) {
                    if(res.getString("TABLE_SCHEM").equalsIgnoreCase(schema)) {
                        schemaExist = true;
                        break;
                    }
                }
                res.close();
                if(!schemaExist) {
                    if(schema != null && !schema.isEmpty()) {
                    	db.create_schema(conn, schema);
                    }
                }

                if(!check_login_table_exist(conn, schema, table)) {
                    message = "login table error";
                    return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";
                }


                /////////////////////////////////////////////
                // Autenticazione
                //
                if (doAutentication) {
                    message = "";

                    if (sPassword == null || sPassword == "") {
                        sPassword = "";
                    }

                    if ((sUserID == null || sUserID == "")) {
                        message = "Utente non valido";
                        return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";

                    } else {
                        
                        
                        if(sUserID.indexOf("=") != -1) {
                            String [] userIDS = sUserID.split("=");
                            sUserID = userIDS[0].trim();
                            if(userIDS.length >= 2) {
                                sUserImpersonatingID = userIDS[1].trim();
                            }
                        }

                        if(!(sEMail != null && !sEMail.isEmpty())) {
                            sEMail = sUserID;
                        }
                        
                        prepare_database(conn);
                        
                        try {

                            // MYSQL
                            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (`user`="+ "?" +" OR `email`="+ "?" +") AND (`password`=MD5(AES_ENCRYPT('"+sPassword+"','"+password_seed+"')) OR `password`='') AND `status`<>'A' AND `status`<>'D' AND `emailValidated`>0 AND `domain_id`=" + "?" +" AND `application_id`=" + "?" + "";

                            // POSTGRES
                            } else if("postgres".equalsIgnoreCase(driver)) {
                                sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (\"user\"="+ "?" +" OR \"email\"="+ "?" +") AND (\"password\"=crypt(CAST('"+sPassword+"' AS text),CAST('"+password_seed+"' AS text))  OR \"password\"='') AND \"status\"<>'A' AND \"status\"<>'D' AND \"emailValidated\">0  AND \"domain_id\"=" + "?" + " AND \"application_id\"=" + "?" + "";

                            // ORACLE
                            } else if("oracle".equalsIgnoreCase(driver)) {

                            // SQL SERVER
                            } else if("sqlserver".equalsIgnoreCase(driver)) {
                            }

                            psdoLogin = conn.prepareStatement(sqlSTMT);
                            psdoLogin.setString(1, sUserID.toLowerCase());
                            psdoLogin.setString(2, sUserID.toLowerCase());
                            psdoLogin.setString(3, (domain_id != null ? domain_id : ""));
                            psdoLogin.setString(4, (application_id != null ? application_id : ""));
                            rsdoLogin = psdoLogin.executeQuery();


                            boolean isLoginPassed = false;
                            String strPassword = null;
                            String sUserDesc = null;
                            String token = "";
                            int iUserId = 0;
                            int iIsAddmin = 0;

                            ///////////////////////////////////////////////////////////////////////////////////////
                            ////
                            ///  N,B.: la funzione crypt del postgres ignora i caratteri sucessivi all'ottavo
                            //

                            if (rsdoLogin != null) {
                                // Ok legge dal recordset
                                if (rsdoLogin.next()) {
                                    iIsAddmin = rsdoLogin.getInt("admin");
                                    iUserId = rsdoLogin.getInt("id");
                                    token = getSaltString(32);
                                    isLoginPassed = true;
                                } else {
                                    // no record : wrong password or user not defined
                                }
                            } else {
                                return "{ \"result\":-30, \"error\":\""+utility.base64Encode("Unexpected null recorset")+"\"}";
                            }

                            // Verifica filtro IP                            
                            if (isLoginPassed) {
                                try {
                                    String RemoteIP = request.getRemoteAddr();
                                    if(hasIpAccess( RemoteIP )) {
                                    } else {
                                        isLoginPassed = false;
                                    }
                                } catch (Exception e) {
                                    return "{ \"result\":-30, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
                                }
                            }
                            
                            if (isLoginPassed) {
                                
                                if(sUserImpersonatingID != null && !sUserImpersonatingID.isEmpty()) {
                                    //
                                    // load impersonating user's data
                                    //
                                    try {

                                        // MYSQL
                                        if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                            sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (`user`="+"?"+" OR `email`="+"?"+") AND `status`<>'A' AND `status`<>'D' AND `emailValidated`>=0 AND `domain_id`=" + "?" +" AND `application_id`=" + "?" + "";

                                        // POSTGRES
                                        } else if("postgres".equalsIgnoreCase(driver)) {
                                            sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (\"user\"="+"?"+" OR \"email\"="+"?"+") AND \"status\"<>'A' AND \"status\"<>'D' AND \"emailValidated\">=0  AND \"domain_id\"=" + "?" + " AND \"application_id\"=" + "?" + "";

                                        // ORACLE
                                        } else if("oracle".equalsIgnoreCase(driver)) {

                                        // SQL SERVER
                                        } else if("sqlserver".equalsIgnoreCase(driver)) {
                                        }
                                        
                                        psdoLogin.close();
                                        psdoLogin = null;
                                        rsdoLogin.close();
                                        rsdoLogin = null;

                                        psdoLogin = conn.prepareStatement(sqlSTMT);
                                        psdoLogin.setString(1, sUserImpersonatingID.toLowerCase());
                                        psdoLogin.setString(2, sUserImpersonatingID.toLowerCase());
                                        psdoLogin.setString(3, (domain_id != null ? domain_id : ""));
                                        psdoLogin.setString(4, (application_id != null ? application_id : ""));
                                        rsdoLogin = psdoLogin.executeQuery();

                                        if (rsdoLogin != null) {
                                            if (rsdoLogin.next()) {
                                                iIsAddmin = rsdoLogin.getInt("admin");
                                                iUserId = rsdoLogin.getInt("id");
                                            } else {
                                                // no record : wrong password or user not defined
                                                isLoginPassed = false;
                                                if (cLang.equalsIgnoreCase("IT")) {
                                                    message = "Utente \""+sUserImpersonatingID+"\" non trovato";
                                                } else {
                                                    message = "User \""+sUserImpersonatingID+"\" not found";
                                                }
                                                return "{ \"result\":-30, \"error\":\""+utility.base64Encode(message)+"\"}";                                                
                                            }
                                        } else {
                                            return "{ \"result\":-30, \"error\":\""+utility.base64Encode("Unexpected null recorset")+"\"}";
                                        }
                                    } catch (Exception e) {
                                        message = "Error reading impersonating user's data:"+e.getMessage();
                                        System.err.println("// login() "+message);
                                        return "{ \"result\":-21, \"error\":\""+utility.base64Encode(message)+"\"}";
                                    }
                                }
                            }
                             
                            if (isLoginPassed) {
                                String assets_id = "", assets_name = "", assets_inactive_name = "";
                                String sAdditionalProperties = "{";
                            
                                if (session != null) {
                                    session.setAttribute("GLLiquidUserID", iUserId);
                                    session.setAttribute("GLLiquidAdmin", iIsAddmin);
                                    session.setAttribute("GLLiquidUserToken", token);
                                }
                                
                                
                                //
                                // set additional properties
                                //
                                String sAdditionalPropertiesError = null;
                                
                                if(additionalProperties != null) {
                                    try {
                                        Object bean = db.load_bean(request, databaseSchemaTable, "*", "id", String.valueOf(iUserId));

                                        for(int i=0; i<additionalProperties.length; i++) {
                                            String prop = additionalProperties[i];
                                            String propValue = (String)(bean != null ? utility.get(bean, prop) : "");

                                            if(prop != null) {
                                                String sessionProp = ((additionalPropertiesPrefix != null && !additionalPropertiesPrefix.isEmpty()) ? additionalPropertiesPrefix : "") + prop;
                                                session.setAttribute(sessionProp, propValue);
                                                sAdditionalProperties += (i>0 ? "," : "") + "\"" + prop + "\":\""+propValue+"\"";
                                            }
                                        }
                                    } catch (Exception e) {
                                        sAdditionalPropertiesError = e.getLocalizedMessage();
                                    }
                                }
                                
                                sAdditionalProperties += "}";

                                try {
                                    
                                    if(assets.read_user_assets_roles ( request, iUserId )) {
                                        ArrayList<Object> GLLiquidUserAssetsID = (ArrayList<Object>)request.getSession().getAttribute("GLLiquidUserAssetsID");
                                        ArrayList<Object> GLLiquidUserAssetsName = (ArrayList<Object>)request.getSession().getAttribute("GLLiquidUserAssetsName");
                                        ArrayList<Object> GLLiquidUserInactiveAssetsName = (ArrayList<Object>)request.getSession().getAttribute("GLLiquidUserInactiveAssetsName");
                                        assets_id = GLLiquidUserAssetsID != null ? utility.arrayToString( GLLiquidUserAssetsID.toArray(), null, null, ",") : null;
                                        assets_name = GLLiquidUserAssetsName != null ? utility.arrayToString( GLLiquidUserAssetsName.toArray(), null, null, ",") : null;
                                        assets_inactive_name = GLLiquidUserInactiveAssetsName != null ? utility.arrayToString( GLLiquidUserInactiveAssetsName.toArray(), null, null, ",") : null;
                                    }
                                    
                                } catch (Exception e) {
                                    System.err.println("// login() Error reading assets :" + e.getLocalizedMessage());
                                    return "{ \"result\":-31, \"error\":\""+utility.base64Encode(error)+"\"}";
                                }
                                
                                add_event(conn, request, sUserID + "@" + domain_id + ":LOGIN", 0);

                                return "{ \"result\":1, \"token\":\""+token+"\""
                                        +",\"addmin\":"+iIsAddmin+""
                                        +",\"message\":\""+utility.base64Encode("LoggedIn")+"\""
                                        +",\"assets_id\":\""+utility.base64Encode(assets_id)+"\""
                                        +",\"assets_name\":\""+utility.base64Encode(assets_name)+"\""
                                        +",\"assets_inactive_name\":\""+utility.base64Encode(assets_inactive_name)+"\""
                                        +",\"additionalProperties\":"+(sAdditionalProperties)+""
                                        + (sAdditionalPropertiesError != null ? ",\"additionalPropertiesError\":\""+(sAdditionalPropertiesError)+"\"" : "")
                                        +"}";
                            }
                            
                            //
                            // login fallito
                            //
                            if (!isLoginPassed) {
                                int iwrongPass = 0;

                                try {
                                    if (session != null) {
                                        iwrongPass = (int) session.getAttribute("GLLoquidWrongPassword");
                                    }
                                } catch (Exception e) {
                                    iwrongPass = 0;
                                }

                                if (iwrongPass+1 >= maxWrongPasswordEvent && maxWrongPasswordEvent > 0) {
                                    message = sUserID + "@" + domain_id + " : Utente o password errati" + (Debug != null && Debug.equalsIgnoreCase("1") ? "[" + psdoLogin + "]" + "</br>" + "encPassword:" + encPassword : "");
                                    add_event(conn, request, message, -1);
                                }
                                if (iwrongPass+1 >= maxWrongPasswordDisable && maxWrongPasswordDisable > 0) {
                                    message = sUserID + "@" + domain_id + " : Utente o password errati. ["+iwrongPass+1+"] Utente disabilitato" + (Debug != null && Debug.equalsIgnoreCase("1") ? "[" + psdoLogin + "]" + "</br>" + "encPassword:" + encPassword : "");
                                    add_event(conn, request, message, -1);
                                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "UPDATE "+schemaTable+" SET status='D' WHERE id="+iUserId;

                                    } else if("postgres".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "UPDATE "+schemaTable+" SET \"status\"='D' WHERE id="+iUserId;
                                    }
                                }
 
                                if (cLang.equalsIgnoreCase("IT")) {
                                    message = "Utente o password errati";
                                } else {
                                    message = "Wrong user or password";
                                }

                                try {
                                    iwrongPass++;
                                    if (session != null) {
                                        session.setAttribute("GLCNCOnlineWrongPassword", iwrongPass);
                                    }
                                } catch (Exception e) {
                                }

                                return "{ \"result\":-30, \"error\":\""+utility.base64Encode(message)+"\", \"wrongPassCounter\":"+iwrongPass+"}";
                            }


                            

                        } catch (Throwable e) {
                            String err = e.getLocalizedMessage();
                            error += "Error:" + err;
                            if(err.indexOf("crypt(") >= 0) {
                                try {
                                    if (psdoLogin != null) psdoLogin.close();
                                    if (rsdoLogin != null) rsdoLogin.close();                                    
                                    error += "\nMaybe you need to \"CREATE EXTENSION pgcrypto\" manually";
                                    error += "\nDatabase:\n";
                                    psdoLogin = conn.prepareStatement("SELECT current_database();");
                                    rsdoLogin = psdoLogin.executeQuery();
                                    if (rsdoLogin != null) {
                                        while(rsdoLogin.next()) {
                                            error += "\n" + rsdoLogin.getString(1);
                                        }
                                        rsdoLogin.close();
                                        rsdoLogin = null;
                                    }
                                    psdoLogin.close();
                                    psdoLogin = null;
                                    error += "\nExtensions:\n";
                                    psdoLogin = conn.prepareStatement("select * from pg_available_extensions;");
                                    rsdoLogin = psdoLogin.executeQuery();
                                    if (rsdoLogin != null) {
                                        while(rsdoLogin.next()) {
                                            error += "\n" + rsdoLogin.getString(1);
                                        }
                                        rsdoLogin.close();
                                        rsdoLogin = null;
                                    }
                                    psdoLogin.close();
                                    psdoLogin = null;
                                    
                                } catch (SQLException ex) {
                                    Logger.getLogger(login.class.getName()).log(Level.SEVERE, null, ex);
                                }
                            }
                            Logger.getLogger("// login() Error:" + err);
                            return "{ \"result\":-40, \"error\":\""+utility.base64Encode(error)+"\"}";
                        }
                    }
                }
            } else {
                // no connection
                error += " connection to db failed";
                return "{ \"result\":-50, \"error\":\""+error+"\"}";
            }
                    
        } catch (Throwable e) {
            String err = e.getLocalizedMessage();
            error += "Error:" + err;
            Logger.getLogger("// login() Error:" + err);
            return "{ \"result\":-60, \"error\":\""+utility.base64Encode(error)+"\"}";

        } finally {
            try {
                if (psdoLogin != null) {
                     psdoLogin.close();
                }
                if (rsdoLogin != null) {
                     rsdoLogin.close();
                }
            } catch (Throwable e2) {}

            try {
                if(conn != null)
                    conn.close();
                } catch (Throwable e2) {}
            conn = null;
        }
            
        Logger.getLogger("// login() Error:" + "undetected case");
        return "{ \"result\":-666, \"error\":\"undetected case\"}";
    }



    static public String logout(HttpServletRequest request, HttpServletResponse response, JspWriter out) {
        try {        
            String RemoteIP = request.getRemoteAddr();
            String sRedirect = null;
            sRedirect = request.getParameter("redirect");
            return logout( sRedirect, request );            
        } catch (Exception e) { 
            Logger.getLogger("// logout() Error:" + e.getLocalizedMessage());
            return "{ \"result\":-60, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
    }
    
    
    static public String logout( String sRedirect, HttpServletRequest request) {
        HttpSession session = request.getSession();
        String cLang = "it";
        String error = "";
        try {
            if (session != null) {
                Object loggedUseId = session.getAttribute("GLLiquidUserID");
                String result  = null;
                if(loggedUseId != null) {
                    result = "{ \"result\":1, \"message\":\"" +utility.base64Encode("User "+ String.valueOf(loggedUseId != null ? loggedUseId : "")+" logged out") + "\"}";
                } else {
                    result = "{ \"result\":0, \"message\":\"" +utility.base64Encode("Not yet logged") + "\"}";
                }
                session.setAttribute("GLLiquidUserID", null);
                session.setAttribute("GLLiquidAdmin", null);
                session.setAttribute("GLLiquidToken", null);
                return result;
            } else {
                return "{ \"result\":-666, \"error\":\"" + utility.base64Encode("undetected case : no session") + "\"}";
            }
        } catch (Throwable e) {
            Logger.getLogger("// logout() Error:" + utility.base64Encode(e.getLocalizedMessage()));
            return "{ \"result\":-60, \"error\":\"" + utility.base64Encode(e.getLocalizedMessage()) + "\"}";
        }            
    }
    
    static public boolean isLogged( HttpServletRequest request) {
        if(request != null) {
            HttpSession session = request.getSession();
            try {
                if (session != null) {
                    if(session.getAttribute("GLLiquidUserID") != null && session.getAttribute("GLLiquidToken") != null) {
                        return true;
                    }
                }                    
            } catch (Throwable e) {
                Logger.getLogger("// isLogged() error:" + e.getLocalizedMessage());
                return false;
            }
        }
        return false;
    }
    static public String getLoggedID( HttpServletRequest request) {
        HttpSession session = request.getSession();
        try {
            if (session != null) {
                Object GLLiquidUserID = session.getAttribute("GLLiquidUserID");
                if(GLLiquidUserID != null)
                    return String.valueOf(GLLiquidUserID);
            }                    
        } catch (Throwable e) {
            Logger.getLogger("// getLoggedID() error:" + e.getLocalizedMessage());
            return null;
        }            
        return null;
    }
    static public int getLoggedIntID( HttpServletRequest request) {
        HttpSession session = request.getSession();
        try {
            if (session != null) {
                Object GLLiquidUserID = session.getAttribute("GLLiquidUserID");
                if(GLLiquidUserID != null)
                    return (int)Integer.parseInt((String)GLLiquidUserID);
            }                    
        } catch (Throwable e) {
            Logger.getLogger("// getLoggedIntID() error:" + e.getLocalizedMessage());
            return 0;
        }            
        return 0;
    }
    static public String getLoggedToken( HttpServletRequest request) {
        HttpSession session = request.getSession();
        try {
            if (session != null) {
                return (String)session.getAttribute("GLLiquidToken");
            }                    
        } catch (Throwable e) {
            Logger.getLogger("// getLoggedToken() error:" + e.getLocalizedMessage());
            return null;
        }            
        return null;
    }

    
    static public int setup_event(Connection conn) throws SQLException {
        // coordinate tabella log eventi
        if(schemaLog != null && !schemaLog.isEmpty()) {
            if(tableLog != null && !tableLog.isEmpty()) {
                if(conn != null && conn.isValid(30)) {
                    String schemaTable = (schemaLog != null && !schemaLog.isEmpty() ? schemaLog+".":"")+tableLog+"";
                    boolean tableExist = false;
                    DatabaseMetaData meta = conn.getMetaData();
                    PreparedStatement psdoLogin = null;
                    PreparedStatement psdoSetup = null;
                    ResultSet res = meta.getTables(database, schemaLog, tableLog, new String[] {"TABLE"});
                    while (res.next()) {
                        if(res.getString("TABLE_NAME") != null) {
                            tableExist = true;
                        }
                    }
                    res.close();
                    if(!tableExist) {
                        ArrayList<String> sql = new ArrayList<String>();
                        if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                            // CREATE users ADD id, user VARCHAR(256), email VARCHAR(256), password VARCHAR(256), status VARCHAR(16), domain_id VARCHAR(256), application_id VARCHAR(64), token VARCHAR(32), expire TIMESTAMP, naccess INT, nfails INT)
                            sql.add("SET sql_mode='';");
                            sql.add("CREATE TABLE IF NOT EXISTS "+tableLog+" ("
                                +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                                +",`user_id` INT DEFAULT 0"
                                +",`event` VARCHAR(256) NOT NULL"
                                +",`ip` VARCHAR(16) NOT NULL"
                                +",`type` VARCHAR(6) NOT NULL"
                                +",`datetime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                                +")"
                            );
                        } else if("postgres".equalsIgnoreCase(driver)) {
                            String seqName = (schemaLog != null && !schemaLog.isEmpty() ? schemaLog+".":"")+tableLog+"_id_seq";
                            sql.add("CREATE SEQUENCE "+seqName+"");

                            sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schemaLog+tableIdString)+"."+(tableIdString+tableLog+tableIdString)+" ("
                                +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                                +",\"user_id\" INT DEFAULT 0"
                                +",\"event\" VARCHAR(256) NOT NULL"
                                +",\"ip\" VARCHAR(16) NOT NULL"
                                +",\"type\" VARCHAR(6) NOT NULL"
                                +",\"datetime\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                                +")"
                            );

                            sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+schemaTable+".\"id\"");

                        } else if("oracle".equalsIgnoreCase(driver)) {
                        } else if("sqlserver".equalsIgnoreCase(driver)) {
                        }
                        if(sql != null) {
                            for(int is=0; is<sql.size(); is++) {
                                try {
                                    psdoLogin = conn.prepareStatement(sql.get(is));
                                    psdoLogin.executeUpdate();
                                } catch (Throwable e) {
                                    System.err.println("// setup_event() Error:" + e.getLocalizedMessage());
                                }
                                psdoLogin.close();
                            }
                        }
                    }
                }
            }
        }
        return 1;
    }
    static public int add_event(Connection conn, HttpServletRequest request, String msg, int type) throws SQLException {
        // coordinate tabella log eventi
        try {
            if(schemaLog != null && !schemaLog.isEmpty()) {
                if(tableLog != null && !tableLog.isEmpty()) {
                    if(conn != null && conn.isValid(30)) {
                        if(msg != null) {
                            if(!setupLogDone) {
                                setupLogDone = true;
                                setup_event(conn);
                            }

                            String ip = request.getHeader("X-FORWARDED-FOR");  
                            if (ip == null) {
                                ip = request.getRemoteAddr();  
                            }
                            Object loggedUseId = request.getSession().getAttribute("GLLiquidUserID");
                            int user_id = 0;
                            if(loggedUseId instanceof Integer) {
                                user_id = (int)(loggedUseId != null ? loggedUseId : 0) ;
                            } else if(loggedUseId instanceof String) {
                                user_id = (int)Integer.parseInt((String)(loggedUseId != null ? loggedUseId : "0") );                               
                            }
                            
                            String schemaTable = (schemaLog != null && !schemaLog.isEmpty() ? schemaLog+".":"")+tableLog+"";
                            String sqlSTMT = null;
                            PreparedStatement psdoLogin = null;

                            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                sqlSTMT = "INSERT INTO "+schemaTable+" (`user_id`,`event`,`ip`,`type`) VALUES (" 
                                        + ""+(user_id) 
                                        + ",'" + msg + "'"
                                        + ",'" + ip + "'"
                                        + ",'" + type + "'"
                                        + ")";
                            } else if("postgres".equalsIgnoreCase(driver)) {
                                sqlSTMT = "INSERT INTO "+schemaTable+" (\"user_id\",\"event\",\"ip\",\"type\") VALUES (" 
                                        + (user_id) 
                                        + ",'" + msg + "'"
                                        + ",'" + ip + "'"
                                        + ",'" + type + "'"
                                        + ")";
                            } else if("oracle".equalsIgnoreCase(driver)) {
                            } else if("sqlserver".equalsIgnoreCase(driver)) {
                            }
                            psdoLogin = conn.prepareStatement(sqlSTMT);
                            psdoLogin.executeUpdate();
                            psdoLogin.close();
                        }
                    }                    
                }
            }
            return 1;
            
        } catch (Throwable e) {
            Logger.getLogger("// setup_event() Error:" + e.getLocalizedMessage());
        }
        return -1;
    }

    static public String getSaltString(int nChars) {
        String SALTCHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        StringBuilder salt = new StringBuilder();
        Random rnd = new Random();
        while (salt.length() < nChars) {
            int index = (int) (rnd.nextFloat() * SALTCHARS.length());
            salt.append(SALTCHARS.charAt(index));
        }
        String saltStr = salt.toString();
        return saltStr;
    }


    static public class EmailValidator {

      private Pattern pattern;
      private Matcher matcher;

      private String EMAIL_PATTERN = "^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$";

      public EmailValidator(){
          pattern = Pattern.compile(EMAIL_PATTERN);
      }

      public boolean validate(final String hex){
          matcher = pattern.matcher(hex);
          return matcher.matches();
        }
    }



    static public java.util.Date addDays(java.util.Date d, int g) {
        int cWeekDay = 0;	 
        Calendar c = Calendar.getInstance();
        c.setTime(d);
        c.add(Calendar.DATE, g);
        return c.getTime();	
    }

    static public String get_redirect_string(String sRedirect, String sRedirectParam, String error, String message) {
        try {
            if (sRedirect != null && !sRedirect.isEmpty()) {
                if (sRedirect.contains("http://") || sRedirect.contains("https://")) {
                    // URL assoluto
                    String sRedirectURI = sRedirect;
                    return sRedirectURI;
                } else {
                    String sRedirectURI = "";

                    if (sRedirect.charAt(0) != '/') {
                        sRedirectURI = "../" + sRedirect;
                    } else {
                        sRedirectURI = sRedirect;
                    }

                    if (sRedirectParam != null && !sRedirectParam.isEmpty()) {
                        sRedirectURI += "?" + java.net.URLDecoder.decode(sRedirectParam, "UTF-8");
                    } else {
                    }
                    return sRedirectURI;
                }
            } else {
                return "/" + (error != null ? "?error=" + error : "") + (message != null ? "?message=" + message : "");
            }
        } catch (Exception e) {
            Logger.getLogger("// get_redirect_string() Error:" + e.getLocalizedMessage());
        }

        return "./";
    }

    String get_login_response( int code, String message, String token ) {
        return "{" 
                + "\"result\":" + code
                + ","+"\"error\":\""+utility.base64Encode(message)+"\""
                + ","+"\"token\":\""+token+"\""
                + "}";
    }

    String get_login_token( int version ) {
        if(version == 0)
            return getSaltString(12)+"-"+getSaltString(12)+"-"+getSaltString(12);
        else
            return getSaltString(12)+"-"+getSaltString(12)+"-"+getSaltString(12)+"-"+getSaltString(12);
    }



    static public String register(HttpServletRequest request, HttpServletResponse response, JspWriter out) throws Throwable {
        JSONObject requestJson = null;
        String application_id = request.getParameter("application_id");
        String domain_id = request.getParameter("domain_id");
        String sUserID = request.getParameter("user");
        String sEMail = request.getParameter("email");
        String sRegisterUserID = request.getParameter("registerUser");
        String sRegisterEMail = request.getParameter("registerEmail");
        String sPassword = request.getParameter("password");

        String sStatus = request.getParameter("status");
        String sAdmin = request.getParameter("admin");

        String sRedirect = request.getParameter("redirect");

        String sRequest = workspace.get_request_content(request);
        try {
            if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
        } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }

        return register( application_id, domain_id, (sRegisterUserID != null && !sRegisterUserID.isEmpty() ? sRegisterUserID : sUserID), (sRegisterEMail != null && !sRegisterEMail.isEmpty() ? sRegisterEMail : sEMail), sPassword, sStatus, sAdmin, sRedirect, request );
    }

    
    static public String register(String application_id, String domain_id, String sUserID, String sEMail, String sPassword, String sStatus, String sAdmin, String sRedirect, HttpServletRequest request) throws SQLException, Throwable {
        String out_string = "", error = "";
        Connection conn = null;

        ResultSet rsdoLogin = null;
        PreparedStatement psdoLogin = null;
        PreparedStatement psdoSetup = null;
        ResultSet rsdoSetup = null;
        boolean doAutentication = true;
        String cLang = "it";
        String sApplicationURL = null;
                
        HttpSession session = request.getSession();
        
        try {
        
            String RemoteIP = request.getRemoteAddr();

            String Debug = null;
            String message = null;
            String sqlSTMT = null;
            String encPassword = "";
            int iDaysValidity = 0;


            if(application_id == null || application_id.isEmpty())
                application_id = (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
            if(domain_id == null || domain_id.isEmpty())
                domain_id = (String)request.getSession().getAttribute("GLLiquidLoginDomainId");                                        
            if(daysValidity<=0)
                iDaysValidity = (int)request.getSession().getAttribute("GLLiquidLoginDaysValidity");
            else
                iDaysValidity = daysValidity;

            
            sApplicationURL = "http://" + utility.getDomainName(request.getRequestURL().toString()) + ":" + request.getLocalPort() + request.getContextPath();
            sApplicationURL += utility.appendURLSeparator(sApplicationURL);
            sApplicationURL += "liquid/liquid.jsp";

            if(sRedirect == null || sRedirect.isEmpty() || "./".equalsIgnoreCase(sRedirect)) {
                sRedirect = request.getRequestURL().toString();
            }

            
            sEMail = utility.base64Decode(sEMail);
            sUserID = utility.base64Decode(sUserID);

                
            /////////////////////////////////////////////
            // Registrazione
            //
            if(sEMail == null || sEMail.length() < 3) {
                if (cLang.equalsIgnoreCase("IT")) {
                    message = "Indirizzo email non valido";
                } else {
                    message = "Email is not valid";
                }
                return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";

            } else {

                EmailValidator validator = new EmailValidator();
                if(!validator.validate(sEMail)) {
                    if (cLang.equalsIgnoreCase("IT")) {
                        message = "Eamil non valida";
                    } else {
                        message = "Invalid email";
                    }
                    return "{ \"result\":-2, \"error\":\""+utility.base64Encode(message)+"\"}";
                

                } else {
                    boolean isValidUserId = true;
                    if(sUserID != null && sUserID.length() < minCharsUser && minCharsUser>0) isValidUserId = false;

                    if(!isValidUserId) {
                        if (cLang.equalsIgnoreCase("IT")) {
                            message = "sUserID non valida .. min 3 caratteri";
                        } else {
                            message = "Invalid sUserID .. min. 3 chars";
                        }
                        return "{ \"result\":-3, \"error\":\""+utility.base64Encode(message)+"\"}";

                    } else {

                        boolean isEmailDuplicate = false;
                        boolean isUserIdDuplicate = false;
                        message = "";

                        Object [] connResult = getConnection();
                        conn = (Connection)connResult[0];
                        String connError = (String)connResult[1];

                        if(conn != null && conn.isValid(30)) {
                        
                            String schemaTable = "";
                            String databaseSchemaTable = "";

                            schemaTable = "";
                            databaseSchemaTable = "";
                            if(database != null && !database.isEmpty()) {
                                databaseSchemaTable += itemIdString+database+itemIdString;
                            }
                            if(schema != null && !schema.isEmpty()) {
                                schemaTable += itemIdString+schema+itemIdString;
                                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+schema+itemIdString;
                            }
                            if(table != null && !table.isEmpty()) {
                                schemaTable += (schemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                            }

                            
                            if(!check_login_table_exist(conn, schema, table)) {
                                message = "login table error";
                                return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";
                            }
                            
                            
                            try {
        
                                db.set_current_database(conn, database, driver, tableIdString);

                                prepare_database(conn);
                                
                                // Controllo campo email
                                if(sEMail != null && !sEMail.isEmpty()) {
                                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (email='"+sEMail.toLowerCase()+"' AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") +"' AND application_id='" + (application_id != null ? application_id : "")+"')";
                                    } else if("postgres".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (email='"+sEMail.toLowerCase()+"' AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "")+"' AND application_id='" + (application_id != null ? application_id : "")+"')";
                                    } else if("oracle".equalsIgnoreCase(driver)) {
                                    } else if("sqlserver".equalsIgnoreCase(driver)) {
                                    }
                                    isEmailDuplicate = check_login_field(conn, sqlSTMT);
                                }

                            } catch (Exception e) {
                                message = "[Fatal Error #0] " + sqlSTMT;
                                return "{ \"result\":-4, \"error\":\""+utility.base64Encode(message)+"\"}";
                            }

                            if (isEmailDuplicate) {
                                if (cLang.equalsIgnoreCase("IT")) {
                                    message = "Indirizzo email gia' registrato";
                                } else {
                                    message = "Email already address in use";
                                }
                                return "{ \"result\":-5, \"error\":\""+utility.base64Encode(message)+"\"}";

                            } else {

                                // Controllo campo userId
                                if(!allowDuplicateUserName) {
                                    if(sUserID != null && !sUserID.isEmpty()) {
                                        if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                            sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (user='"+sUserID.toLowerCase()+"' AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") +"' AND application_id='" + (application_id != null ? application_id : "")+"')";
                                        } else if("postgres".equalsIgnoreCase(driver)) {
                                            sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE (user='"+sUserID.toLowerCase()+"' AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "")+"' AND application_id='" + (application_id != null ? application_id : "")+"')";
                                        } else if("oracle".equalsIgnoreCase(driver)) {
                                        } else if("sqlserver".equalsIgnoreCase(driver)) {
                                        }
                                        isUserIdDuplicate = check_login_field(conn, sqlSTMT);
                                    }
                                }

                                if (isUserIdDuplicate) {
                                    if (cLang.equalsIgnoreCase("IT")) {
                                        message = "UserID gia' registrato";
                                    } else {
                                        message = "UserID already in use";
                                    }
                                    return "{ \"result\":-6, \"error\":\""+utility.base64Encode(message)+"\"}";

                                } else {

                                    /////////////////////////////////////////////
                                    // UserId e Email OK : Nuovo indirizzo
                                    //
                                    String sEmailValidated = "0";
                                    String sEmailToken = getSaltString(32);
                                    String newPassword = null;
                                    if(sPassword != null && !sPassword.isEmpty()) {
                                        if(sPassword.length() < minCharsPasswords) {
                                            if (cLang.equalsIgnoreCase("IT")) {
                                                message = "Password tropppo breve; minimo "+minCharsPasswords+" caratteri";
                                            } else {
                                                message = "Pasword too short; min "+minCharsPasswords+" chars";
                                            }
                                            return "{ \"result\":-6, \"error\":\""+utility.base64Encode(message)+"\"}";
                                        }
                                        newPassword = sPassword;
                                    } else {
                                        sEmailValidated = "1";
                                        sEmailToken = getSaltString(32);
                                        newPassword = getSaltString(minCharsPasswords);
                                    }

                                    String[] params = { newPassword, sEMail, application_id, domain_id, sApplicationURL, sEmailToken, sRedirect, database, schema, table };

                                    try {

                                        if (application_id != null && !application_id.isEmpty()) {
                                            if (domain_id != null && !domain_id.isEmpty()) {
                                                boolean isEmailOk = true;
                                                boolean useEmailer = false;

                                                if(emailer.Host != null && emailer.Port != null) {
                                                    if(!emailer.Host.isEmpty()&& !emailer.Port.isEmpty()) {
                                                        useEmailer = true;
                                                    }
                                                }
                                                
                                                if(useEmailer) {
                                                    emailer emailerInstance = new emailer();
                                                    emailerInstance.AppName = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppName");
                                                    emailerInstance.AppURL = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppURL");
                                                    emailerInstance.AppImage = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppImage");
                                                    emailerInstance.From = (String)request.getSession().getAttribute("GLLiquidLoginEmailFrom");
                                                    

                                                    if(adminEmail != null && !adminEmail.isEmpty()) {
                                                        try {
                                                            if (emailerInstance.send(adminEmail, null, application_id+" - User registration notify", emailerInstance.get_standard_message("RegisterUserNotify", params))) {
                                                            } else {
                                                                message += "[Notify err:" + emailerInstance.LastError + "]";
                                                            }
                                                        } catch (Exception e) {
                                                            message += "[Notify err:" + e.getMessage() + "]";
                                                        }
                                                    }

                                                    try {                        
                                                        if (emailerInstance.send(sEMail, null, application_id+" - User registration", emailerInstance.get_standard_message("RegisterUser", params))) {
                                                            if (cLang.equalsIgnoreCase("IT")) {
                                                                message = "Password inviata a <b>" + sEMail + "</b>";
                                                            } else {
                                                                message = "Password sent to <b>" + sEMail + "</b>";
                                                            }
                                                            message += emailerInstance.DebugMessage;

                                                        } else {
                                                            isEmailOk = false;
                                                            if (cLang.equalsIgnoreCase("IT")) {
                                                                message += "Invio Password Fallito : " + emailerInstance.LastError + "";
                                                            } else {
                                                                message += "Password sent failed : " + emailerInstance.LastError + "";
                                                            }

                                                            add_event(conn, request, "Resitrazione utente failita:" + sEMail, 2);

                                                            return "{ \"result\":-7, \"error\":\""+utility.base64Encode(message)+"\"}";
                                                        }

                                                    } catch (Exception e) {
                                                        message += "[Notify err:" + e.getMessage() + "]";
                                                        return "{ \"result\":-8, \"error\":\""+utility.base64Encode(message)+"\"}";
                                                    }
                                                }

                                                if (isEmailOk) {

                                                    add_event(conn, request, "Resitrazione utente:" + sEMail, 2);

                                                    String[] emailParts = sEMail.split("[@]");
                                                    String sUserName = sEMail;
                                                    if (emailParts.length >= 1) {
                                                        sUserName = emailParts[0];
                                                        if (emailParts.length >= 2) {
                                                            String[] emailExts = emailParts[1].split("[.]");
                                                            sUserName += ".";
                                                            sUserName += emailExts[0];
                                                        }
                                                    }

                                                    String sExpireDate = "";
                                                    DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
                                                    java.util.Date cDate = new java.util.Date();
                                                    java.util.Date expireDate = addDays(cDate, login.daysValidity);
                                                    if(login.daysValidity > 0) {
                                                        sExpireDate = dateFormat.format(expireDate);
                                                    }

                                                    try {

                                                        if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                                            sqlSTMT = "INSERT INTO "+schemaTable+" (`application_id`,`domain_id`,`user`,`email`,`password`,`date`,`status`,`admin`,`token`,`expire`,`emailValidated`,`emailToken`) VALUES (" 
                                                                    + "'" + (application_id != null ? application_id : "") + "'"
                                                                    + ",'" + (domain_id != null ? domain_id : "") + "'"
                                                                    + ",'" + (sUserID != null && !sUserID.isEmpty() ? sUserID : sUserName).toLowerCase() + "'"
                                                                    + ",'" + sEMail.toLowerCase() + "'"
                                                                    + ",MD5(AES_ENCRYPT('"+newPassword+"','"+password_seed+"'))" /* + ",PASSWORD('"+newPassword+"')"  */
                                                                    + ",'"+dateFormat.format(cDate)+"'"
                                                                    + ",'" + sStatus + "'"
                                                                    + "," + (sAdmin != null && !sAdmin.isEmpty() ? sAdmin : "0") + ""
                                                                    + ",'" + "" + "'"
                                                                    + ",'"+sExpireDate+"'"
                                                                    + ",'"+sEmailValidated+"'"
                                                                    + ",'"+sEmailToken+"'"
                                                                    + ")";
                                                        } else if("postgres".equalsIgnoreCase(driver)) {
                                                            sqlSTMT = "INSERT INTO "+schemaTable+" (\"application_id\",\"domain_id\",\"user\",\"email\",\"password\",\"date\",\"status\",\"admin\",\"token\",\"expire\",\"emailValidated\",\"emailToken\") VALUES (" 
                                                                    + "'" +(application_id != null ? application_id : "") + "'"
                                                                    + ",'" +(domain_id != null ? domain_id : "") + "'"
                                                                    + ",'" + (sUserID != null && !sUserID.isEmpty() ? sUserID : sUserName).toLowerCase() + "'"
                                                                    + ",'" + sEMail.toLowerCase() + "'"
                                                                    + ",crypt(CAST('"+newPassword+"' AS text),CAST('"+password_seed+"' AS text))"
                                                                    + ",'"+dateFormat.format(cDate)+"'"
                                                                    + ",'" + sStatus + "'"
                                                                    + "," + (sAdmin != null && !sAdmin.isEmpty() ? sAdmin : "0") + ""
                                                                    + ",'" + "" + "'"
                                                                    + ",'"+sExpireDate+"'"
                                                                    + ",'"+sEmailValidated+"'"
                                                                    + ",'"+sEmailToken+"'"
                                                                    + ")";
                                                            
                                                            
                                                        } else if("oracle".equalsIgnoreCase(driver)) {
                                                        } else if("sqlserver".equalsIgnoreCase(driver)) {
                                                        }

                                                        psdoLogin = conn.prepareStatement(sqlSTMT);
                                                        psdoLogin.executeUpdate();
                                                        
                                                        message = "Registered";
                                                        
                                                        return "{ \"result\":1, \"message\":\""+utility.base64Encode(message)+"\"}";

                                                    } catch (Exception e) {
                                                        return "{ \"result\":-9, \"error\":\""+utility.base64Encode((e.getLocalizedMessage() + " on : ["+sqlSTMT+"]"))+"\"}";
                                                    }
                                                }
                                            } else {
                                                return "{ \"result\":-10, \"error\":\""+utility.base64Encode("domain_id is empty")+"\"}";
                                            }
                                        } else {
                                            return "{ \"result\":-10, \"error\":\""+utility.base64Encode("application_id is empty")+"\"}";
                                        }
                                    } catch (Exception e) {
                                        return "{ \"result\":-11, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
                                    }
                                }
                            }
                        } else {
                            return "{ \"result\":-50, \"error\":\""+utility.base64Encode("No connection to db")+"\"}";
                        }
                    }
                }
            }
        } catch (Exception e) {
            return "{ \"result\":-12, \"error\":\""+utility.base64Encode("Exception:"+e.getLocalizedMessage())+"\"}";
        }
        return "{ \"result\":666, \"error\":\"undetected case\"}";
    }
    
    static public String recovery(HttpServletRequest request, HttpServletResponse response, JspWriter out) throws Throwable {
        JSONObject requestJson = null;
        String RemoteIP = request.getRemoteAddr();
        String sUserID = null;
        String sEMail = null;
        String sPassword = null;
        String application_id = null;
        String domain_id = "";
        String sRedirect = null;

        application_id = request.getParameter("application_id");
        domain_id = request.getParameter("domain_id");
        sUserID = request.getParameter("user");
        sEMail = request.getParameter("email");
        sPassword = request.getParameter("password");
        sRedirect = request.getParameter("redirect");

        String sRequest = workspace.get_request_content(request);
        try {
            if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
        } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }

        return recovery( application_id, domain_id, sUserID, sEMail, sPassword, sRedirect, request );
   }

    static public String recovery( String application_id, String domain_id, String sUserID, String sEMail, String sPassword, String sRedirect, HttpServletRequest request) throws Throwable {
        String out_string = "", error = "";
        JSONObject requestJson = null;
        Connection conn = null;

        ResultSet rsdoLogin = null;
        PreparedStatement psdoLogin = null;
        PreparedStatement psdoSetup = null;
        ResultSet rsdoSetup = null;
        boolean doAutentication = true;
        String cLang = "it";
        
        HttpSession session = request.getSession();
        
        try {
        
            String RemoteIP = request.getRemoteAddr();

            String Debug = null;
            String message = null;
            String sqlSTMT = null;
            int iDaysValidity = 0;


            Debug = request.getParameter("debug");

            if(application_id == null || application_id.isEmpty())
                application_id = (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
            if(domain_id == null || domain_id.isEmpty())
                domain_id = (String)request.getSession().getAttribute("GLLiquidLoginDomainId");                                        
            if(daysValidity<=0)
                iDaysValidity = (int)request.getSession().getAttribute("GLLiquidLoginDaysValidity");
            else
                iDaysValidity = daysValidity;
            
            /////////////////////////////////////////////
            // Recupero passord
            //

            Object [] connResult = getConnection();
            conn = (Connection)connResult[0];
            String connError = (String)connResult[1];

            if(conn != null && conn.isValid(30)) {
                
                String schemaTable = "";
                String databaseSchemaTable = "";

                schemaTable = "";
                databaseSchemaTable = "";
                if(database != null && !database.isEmpty()) {
                    databaseSchemaTable += itemIdString+database+itemIdString;
                }
                if(schema != null && !schema.isEmpty()) {
                    schemaTable += itemIdString+schema+itemIdString;
                    databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+schema+itemIdString;
                }
                if(table != null && !table.isEmpty()) {
                    schemaTable += (schemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                    databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                }

                try {

                    db.set_current_database(conn, database, driver, tableIdString);

                    message = "";

                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE email=? AND status<>'A' AND emailValidated>0 AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") + "' AND application_id='" + (application_id != null ? application_id : "")+"'";
                    } else if("postgres".equalsIgnoreCase(driver)) {
                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE email=? AND status<>'A' AND \"emailValidated\">0 AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") + "' AND application_id='" + (application_id != null ? application_id : "")+"'";
                    } else if("oracle".equalsIgnoreCase(driver)) {
                    } else if("sqlserver".equalsIgnoreCase(driver)) {
                    }

                    psdoLogin = conn.prepareStatement(sqlSTMT);
                    psdoLogin.setString(1, sEMail.toLowerCase());

                    rsdoLogin = psdoLogin.executeQuery();

                } catch (Exception e) {
                    return "{ \"result\":-1, \"error\":"+utility.base64Encode(e.getLocalizedMessage())+"}";
                }

                if (rsdoLogin == null) {
                    message = "Indirizzo email non registrato";
                    return "{ \"result\":-2, \"error\":"+utility.base64Encode(message)+"}";

                } else {

                    if (rsdoLogin.next()) {
                        String sLink = "http://app.com/?DomainId="+domain_id + "&ApplicationId="+application_id;
                        String sLinkHTML = "<a href='"+sLink+"'>Login here <b>"+domain_id.toUpperCase()+"</b></a>";
                        String newPassword = getSaltString(6);
                        String[] params = {newPassword, rsdoLogin.getString("id"), rsdoLogin.getString("user"), sLinkHTML };

                        try {

                            prepare_database(conn);

                            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                sqlSTMT = "UPDATE "+schemaTable+" SET `password`=MD5(AES_ENCRYPT(?,'"+password_seed+"')) WHERE `id`="+params[1]+"";
                            } else if("postgres".equalsIgnoreCase(driver)) {
                                sqlSTMT = "UPDATE "+schemaTable+" SET \"password\"=crypt(CAST(? AS text),CAST('"+password_seed+"' AS text)) WHERE \"id\"="+params[1]+"";
                            } else if("oracle".equalsIgnoreCase(driver)) {
                            } else if("sqlserver".equalsIgnoreCase(driver)) {
                            }
                            psdoLogin = conn.prepareStatement(sqlSTMT);
                            psdoLogin.setString(1, params[0]);
                            psdoLogin.executeUpdate();

                            emailer emailerInstance = new emailer();
                            emailerInstance.AppName = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppName");
                            emailerInstance.AppURL = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppURL");
                            emailerInstance.AppImage = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppImage");
                            emailerInstance.From = (String)request.getSession().getAttribute("GLLiquidLoginEmailFrom");
                            
                            if (emailerInstance.send(sEMail, null, application_id+" - Recupero password", emailerInstance.get_standard_message("RecoveryPassword", params))) {
                                message = "Password inviata a <b>" + sEMail + "</b>";
                                message += emailerInstance.DebugMessage;
                                return "{ \"result\":1, \"message\":\""+utility.base64Encode(message)+"\"}";
                            } else {
                                message = "Invio Password Fallito : " + emailerInstance.LastError + "";
                                return "{ \"result\":-3, \"error\":\""+utility.base64Encode(message)+"\"}";
                            }
                        } catch (Exception e) {
                            return "{ \"result\":-4, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
                        }
                    } else {
                        message = "Indirizzo email non registrato";
                        return "{ \"result\":-5, \"error\":\""+utility.base64Encode(message)+"\"}";
                    }
                }
            } else {
                return "{ \"result\":-50, \"error\":\""+utility.base64Encode("No connection to db")+"\"}";                
            }
        } catch (Exception e) {
            return "{ \"result\":-6, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
    }
    

    static public String setPassword(String application_id, String domain_id, String sUserID, String sPassword, HttpServletRequest request) throws SQLException, Throwable {
        String out_string = "", error = "";
        Connection conn = null;

        ResultSet rsdoLogin = null;
        PreparedStatement psdoLogin = null;
        PreparedStatement psdoSetup = null;
        ResultSet rsdoSetup = null;
        boolean doAutentication = true;
        String cLang = "it";
                
        HttpSession session = request.getSession();
        
        try {
        
            String RemoteIP = request.getRemoteAddr();

            String Debug = null;
            String message = null;
            String sqlSTMT = null;
            String encPassword = "";
            int iDaysValidity = 0;


            if(application_id == null || application_id.isEmpty()) {
                if(request != null) {
                    application_id = (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
                }
            }
            if(domain_id == null || domain_id.isEmpty()) {
                if(request != null) {
                    domain_id = (String)request.getSession().getAttribute("GLLiquidLoginDomainId");
                }
            }
            if(daysValidity<=0) {
                if(request != null) {
                    iDaysValidity = (int)request.getSession().getAttribute("GLLiquidLoginDaysValidity");
                }
            } else
                iDaysValidity = daysValidity;

            

    
            ////////////////////////////////
            // Aggiornamwento password
            //
            { 
                {
                    boolean isValidUserId = true;
                    if(sUserID != null && sUserID.length() < 3) isValidUserId = false;

                    if(!isValidUserId) {
                        if (cLang.equalsIgnoreCase("IT")) {
                            message = "sUserID non valida .. min 3 caratteri";
                        } else {
                            message = "Invalid sUserID .. min. 3 chars";
                        }
                        return "{ \"result\":-3, \"error\":\""+utility.base64Encode(message)+"\"}";

                    } else {

                        boolean isEmailDuplicate = false;
                        boolean isUserIdDuplicate = false;
                        message = "";

                        Object [] connResult = getConnection();
                        conn = (Connection)connResult[0];
                        String connError = (String)connResult[1];

                        if(conn != null && conn.isValid(30)) {
                        
                            String schemaTable = "";
                            String databaseSchemaTable = "";

                            schemaTable = "";
                            databaseSchemaTable = "";
                            if(database != null && !database.isEmpty()) {
                                databaseSchemaTable += itemIdString+database+itemIdString;
                            }
                            if(schema != null && !schema.isEmpty()) {
                                schemaTable += itemIdString+schema+itemIdString;
                                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+schema+itemIdString;
                            }
                            if(table != null && !table.isEmpty()) {
                                schemaTable += (schemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                                databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+table+itemIdString;
                            }

                            
                            if(!check_login_table_exist(conn, schema, table)) {
                                message = "login table error";
                                return "{ \"result\":-1, \"error\":\""+utility.base64Encode(message)+"\"}";
                            }
                            
                            
                            try {
        
                                db.set_current_database(conn, database, driver, tableIdString);

                                prepare_database(conn);
                                
                                if (application_id != null && !application_id.isEmpty()) {
                                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "UPDATE "+schemaTable+" SET `password`=MD5(AES_ENCRYPT('"+sPassword+"','"+password_seed+"')) WHERE ( "
                                                + "`application_id` = '" + (application_id != null ? application_id : "") + "'"
                                                + " AND `domain_id` = '" + (domain_id != null ? domain_id : "") + "'"
                                                + " AND `user` = '" + (sUserID != null && !sUserID.isEmpty() ? sUserID : "") + "'"
                                                + ")";
                                    } else if("postgres".equalsIgnoreCase(driver)) {
                                        sqlSTMT = "UPDATE "+schemaTable+" \"password\"=crypt(CAST('"+sPassword+"' AS text),CAST('"+password_seed+"' AS text)) WHERE (" 
                                                + "\"application_id\" = '" + (application_id != null ? application_id : "") + "'"
                                                + " AND \"domain_id\" = '" + (domain_id != null ? domain_id : "") + "'"
                                                + " AND \"user\" = '" + (sUserID != null && !sUserID.isEmpty() ? sUserID : "") + "'"
                                                + ")";

                                    } else if("oracle".equalsIgnoreCase(driver)) {
                                    } else if("sqlserver".equalsIgnoreCase(driver)) {
                                    }

                                    psdoLogin = conn.prepareStatement(sqlSTMT);
                                    // psdoLogin.setString(1, sPassword);
                                    psdoLogin.executeUpdate();

                                    message = "Password updated";

                                    return "{ \"result\":1, \"message\":\""+utility.base64Encode(message)+"\"}";
                                }
                                
                            } catch (Exception e) {
                                return "{ \"result\":-9, \"error\":\""+utility.base64Encode((e.getLocalizedMessage() + " on : ["+sqlSTMT+"]"))+"\"}";
                            }
                        } else {
                            return "{ \"result\":-50, \"error\":\""+utility.base64Encode("No connection to db")+"\"}";
                        }
                    }
                }
            }
        } catch (Exception e) {
            return "{ \"result\":-12, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
        return "{ \"result\":666, \"error\":\"undetected case\"}";
    }


    
    static public String validate_email(HttpServletRequest request, HttpServletResponse response, JspWriter out) throws Throwable {
        JSONObject requestJson = null;
        String RemoteIP = request.getRemoteAddr();
        String sUserID = null;
        String sEMail = null;
        String sEmailToken = null;
        String application_id = null;
        String domain_id = "";
        String sRedirect = null;
        String sDatabase = null;
        String sSchema = null;
        String sTable = null;

        application_id = request.getParameter("application_id");
        domain_id = request.getParameter("domain_id");
        sEMail = request.getParameter("email");
        sEmailToken = request.getParameter("emailToken");
        sRedirect = request.getParameter("redirect");
        sDatabase = request.getParameter("database");
        sSchema = request.getParameter("schema");
        sTable = request.getParameter("table");

        String sRequest = workspace.get_request_content(request);
        try {
            if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
        } catch (Exception e) { 
            Logger.getLogger("// validate_email() Error:" + e.getLocalizedMessage());
        }

        return validate_email( application_id, domain_id, sUserID, sEMail, sEmailToken, sRedirect, sDatabase, sSchema, sTable, request );
   }

    
    // TEST URL :
    // http://localhost:8080/LiquidX/liquid/liquid.jsp?operation=validateEmail&emailToken=MMCW1VO04SM1T8TGCS8RNF0BKSAXE2R5&redirect=&domain_id=LiquidX&application_id=LiquidX&email=cristianandreon@gmail.com    
    
    static public String validate_email( String application_id, String domain_id, String sUserID, String sEMail, String sEmailToken, String sRedirect, String sDatabase, String sSchema, String sTable, HttpServletRequest request ) throws Throwable {
        String out_string = "", error = "";
        JSONObject requestJson = null;
        Connection conn = null;

        ResultSet rsdoLogin = null;
        PreparedStatement psdoLogin = null;
        PreparedStatement psdoSetup = null;
        ResultSet rsdoSetup = null;
        boolean doAutentication = true;
        String cLang = "it";
        String sApplicationURL = null;
            
        
        HttpSession session = request.getSession();
        
        try {
        
            String RemoteIP = request.getRemoteAddr();

            String Debug = null;
            String message = null;
            String sqlSTMT = null;
            int iDaysValidity = 0;


            Debug = request.getParameter("debug");

            if(application_id == null || application_id.isEmpty())
                application_id = (String)request.getSession().getAttribute("GLLiquidLoginApplicationId");
            if(domain_id == null || domain_id.isEmpty())
                domain_id = (String)request.getSession().getAttribute("GLLiquidLoginDomainId");                                        


            sApplicationURL = "http://" + utility.getDomainName(request.getRequestURL().toString()) + ":" + request.getLocalPort() + request.getContextPath();
            sApplicationURL += utility.appendURLSeparator(sApplicationURL);
            // sApplicationURL += "liquid/liquid.jsp";

            
            /////////////////////////////////////////////
            // Recupero passord
            //

            Object [] connResult = getConnection();
            conn = (Connection)connResult[0];
            String connError = (String)connResult[1];

            if(conn != null && conn.isValid(30)) {
                
                String schemaTable = "";
                String databaseSchemaTable = "";

                schemaTable = "";
                databaseSchemaTable = "";
                if(sDatabase != null && !sDatabase.isEmpty()) {
                    databaseSchemaTable += itemIdString+sDatabase+itemIdString;
                }
                if(sSchema != null && !sSchema.isEmpty()) {
                    schemaTable += itemIdString+sSchema+itemIdString;
                    databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+sSchema+itemIdString;
                }
                if(sTable != null && !sTable.isEmpty()) {
                    schemaTable += (schemaTable.length()>0?".":"")+itemIdString+sTable+itemIdString;
                    databaseSchemaTable += (databaseSchemaTable.length()>0?".":"")+itemIdString+sTable+itemIdString;
                }

                try {

                    db.set_current_database(conn, sDatabase, driver, tableIdString);

                    message = "";

                    if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE email=? AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") + "' AND application_id='" + (application_id != null ? application_id : "")+"'";
                    } else if("postgres".equalsIgnoreCase(driver)) {
                        sqlSTMT = "SELECT * FROM "+schemaTable+" WHERE email=? AND status<>'A' AND status<>'D' AND domain_id='" + (domain_id != null ? domain_id : "") + "' AND application_id='" + (application_id != null ? application_id : "")+"'";
                    } else if("oracle".equalsIgnoreCase(driver)) {
                    } else if("sqlserver".equalsIgnoreCase(driver)) {
                    }

                    psdoLogin = conn.prepareStatement(sqlSTMT);
                    psdoLogin.setString(1, sEMail.toLowerCase());

                    rsdoLogin = psdoLogin.executeQuery();

                } catch (Exception e) {
                    return "{ \"result\":-1, \"error\":"+utility.base64Encode(e.getLocalizedMessage())+"}";
                }

                if (rsdoLogin == null) {
                    message = "Indirizzo email non registrato";
                    return "{ \"result\":-2, \"error\":"+utility.base64Encode(message)+"}";

                } else {

                    if (rsdoLogin.next()) {
                        String sLink = "http://"+sApplicationURL+"?DomainId="+domain_id + "&ApplicationId="+application_id;
                        String sLinkHTML = "<a href='"+sLink+"'>Login here into <b>"+domain_id+"</b></a>";
                        String[] params = { sApplicationURL, rsdoLogin.getString("id"), rsdoLogin.getString("user"), sLinkHTML };

                        try {

                            prepare_database(conn);

                            if("mysql".equalsIgnoreCase(driver) || "mariadb".equalsIgnoreCase(driver)) {
                                sqlSTMT = "UPDATE "+schemaTable+" SET emailValidated=1 WHERE id="+params[1]+"";
                            } else if("postgres".equalsIgnoreCase(driver)) {
                                sqlSTMT = "UPDATE "+schemaTable+" SET \"emailValidated\"=1 WHERE id="+params[1]+"";
                            } else if("oracle".equalsIgnoreCase(driver)) {
                            } else if("sqlserver".equalsIgnoreCase(driver)) {
                            }
                            psdoLogin = conn.prepareStatement(sqlSTMT);
                            psdoLogin.executeUpdate();

                            /*
                            emailer emailerInstance = new emailer();
                            emailerInstance.AppName = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppName");
                            emailerInstance.AppURL = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppURL");
                            emailerInstance.AppImage = (String)request.getSession().getAttribute("GLLiquidLoginEmailAppImage");
                            emailerInstance.From = (String)request.getSession().getAttribute("GLLiquidLoginEmailFrom");
                            
                            if (emailerInstance.send(sEMail, null, application_id+" - Validazione email", emailerInstance.get_standard_message("EmailValidated", params))) {
                                message = "Password inviata a <b>" + sEMail + "</b>";
                                message += emailerInstance.DebugMessage;
                                return "{ \"result\":1, \"message\":\""+utility.base64Encode(message)+"\"}";
                            } else {
                                message = "Invio Password Fallito : " + emailerInstance.LastError + "";
                                return "{ \"result\":-3, \"error\":\""+utility.base64Encode(message)+"\"}";
                            }
                            */
                        } catch (Exception e) {
                            error = "recovery() Error:" + e.getLocalizedMessage();
                            System.err.println(error);
                            // "{ \"result\":-4, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
                        }
                    } else {
                        error = "Indirizzo email non registrato";
                        System.err.println("recovery() Error:" + error);
                        // return "{ \"result\":-5, \"error\":\""+utility.base64Encode(message)+"\"}";
                    }
                }
            } else {
                error = "No connection to db";
                System.err.println("recovery() Error:" + error);
                // return "{ \"result\":-50, \"error\":\""+utility.base64Encode("No connection to db")+"\"}";
            }
        } catch (Exception e) {
            error = "recovery() Error:" + e.getLocalizedMessage();
            Logger.getLogger(error);
            // return "{ \"result\":-6, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
        
        return get_redirect_string(sRedirect, null, error, null);
    }
    

    
    static boolean check_login_field( Connection conn, String sqlSTMT ) throws Exception {
        PreparedStatement psdoLogin = null;
        ResultSet rsdoLogin = null;
        boolean bRetVal = true;

        try {
            psdoLogin = conn.prepareStatement(sqlSTMT);
            rsdoLogin = psdoLogin.executeQuery();
            if (rsdoLogin == null) {
            } else {
                if (rsdoLogin.next()) {
                    bRetVal = true;
                } else {
                    bRetVal = false;
                }
            }
        } catch (Exception e) {
            throw new Exception(e);
            
        } finally {
            try {
                if (psdoLogin != null) {
                    psdoLogin.close();
                }
                if (rsdoLogin != null) {
                    rsdoLogin.close();
                }
            } catch (Throwable thn) {
            }
        }
        return bRetVal;
    }    
    
    
    static public String getIP( HttpServletRequest request ) throws Exception {
        String RemoteIP = request.getRemoteAddr();
        if(RemoteIP.startsWith("0.0.0.0")) {
            URL whatismyip = new URL("http://checkip.amazonaws.com");
            BufferedReader in = new BufferedReader(new InputStreamReader(
                    whatismyip.openStream()));
            return in.readLine();
        } else {            
            return RemoteIP;
        }
    }
    
    static public boolean addFilterIP( String IP ) throws Exception {
            return addFilterIP( IP, "enabled" );
    }
    
    static public boolean addFilterIP( String IP, String typeOf ) throws Exception {
        boolean bRetVal = true;

        try {
            
            if(IP != null) {
                if(FilterIPs == null) {
                    FilterIPs = new ArrayList<ipFilter>();
                }

                FilterIPs.add( new ipFilter(IP, typeOf) );
            }
            
        } catch (Exception e) {
            throw new Exception(e);            
        }
        return bRetVal;
    }    
    
    static public boolean removeFilterIP( String IP ) throws Exception {
        boolean bRetVal = true;

        try {
            
            if(IP != null) {
            }
                    
        } catch (Exception e) {
            throw new Exception(e);            
        }
        return bRetVal;
    }
    
    
    static public boolean hasIpAccess( String IP ) throws Exception {

        try {
            
            if(FilterIPs == null) {
                return true;
            } else {
                
                for(int i=0; i<FilterIPs.size(); i++) {
                    String filterIp = FilterIPs.get(i).ip;
                    boolean match = compareIp(filterIp, IP);
                    if(FilterIPs.get(i).type == 0) {
                        // enabled (white list)
                        if(match) return true;
                    } else {
                        // disable  (black list)
                        if(match) return false;
                    }
                }
            }
        
        } catch (Exception e) {
            throw new Exception(e);            
        }
        return false;
    }        

    static public boolean compareIp( String IP1, String IP2 ) throws Exception {
        String [] ip1Parts = IP1.split(".");
        String [] ip2Parts = IP2.split(".");
        
        for(int i=0; i<4; i++) {
            if(ip1Parts.length >= i+1) {
                if(ip2Parts.length >= i+1) {
                    if("*".equalsIgnoreCase( ip1Parts[i] )) {
                    } else {
                        String [] subParts = ip1Parts[i].split("-");
                        if(subParts.length >= 2) {
                            int max = Math.max(Integer.parseInt(subParts[0]), Integer.parseInt(subParts[1]));
                            int min = Math.min(Integer.parseInt(subParts[0]), Integer.parseInt(subParts[1]));
                            int ip = Integer.parseInt(ip2Parts[i]);
                            if(ip <= max && ip <= min) {                            
                            } else {
                                return false;
                            }
                        } else {
                            if(ip1Parts[i] == ip2Parts[i]) {
                            } else {
                                return false;
                            }
                        }                        
                    }
                }
            }
        }
        return true;
    }    
}