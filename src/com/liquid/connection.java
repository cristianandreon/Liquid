/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;


import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import org.json.JSONObject;

// Connessione supportate : 
//      Specificata nel json del controllo
//      Specificata da stringa lato client
//      Specificata dal progetto

public class connection {

    /**
     * Get connection from class "app.liquid.dbx.connection.getDBConnection" defined in the main project or in sub project
     *
     * @return
     * @throws Throwable
     */
    static public Object [] getDBConnection() throws Throwable {
        Class cls = null;
        Method method = null;        
    	try {
            cls = Class.forName("app.liquid.dbx.connection");
            if(cls != null) {
                method = cls.getDeclaredMethod("getDBConnection");
            }
        } catch(NoSuchMethodException nsm) {
        } catch(ClassNotFoundException cnf) {
            if(jdbcSources.size() == 0) {
                System.err.println(" app.liquid.dbx.connection.getDBConnection() not found. Please add it, or use addLiquidDBConnection(), in order to access to db...");
                throw new Exception("Please add app.liquid.dbx.connection to your application...(Error:"+cnf.getLocalizedMessage()+")");
            }
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getDBConnection() Error:" + th.getLocalizedMessage());
            throw th.getCause();
    	}        
        if(method != null) {
            method.setAccessible(true);
            Object result = method.invoke(null);
            if(result instanceof Object []) {
                return (Object [])result;
            } else {
                return new Object [] { result, null };
            }
        } else {
            // use internal method
            return (Object [])getLiquidDBConnection();
        }
    }

    static public String testDBConnection() {
        Class cls = null;
        Method method = null;
        try {
            cls = Class.forName("app.liquid.dbx.connection");
            if(cls != null) {
                method = cls.getDeclaredMethod("getDBConnection");
            }
        } catch(Throwable th) {
            method = null;
        }
        Connection conn = null;
        try {
            if (method != null) {
                method.setAccessible(true);
                Object result = method.invoke(null);
                if (result instanceof Object[]) {
                    conn = (Connection) ((Object[]) result)[0];
                } else {
                    conn = (Connection) result;
                }
                if (conn != null) {
                    String catalog = null, schema = null;
                    try { schema = conn.getSchema(); } catch (Throwable e) { }
                    try { catalog = conn.getCatalog(); } catch (Throwable e) { }
                    return "Connection SUCCEDED\n"
                            + "[Catalog:"+(catalog!=null?catalog:"N/D")+"]\n"
                            + "[Schema:"+(schema!=null?schema:"N/D")+"]\n"
                            + "[AutoCommit:"+conn.getAutoCommit()+"]\n"
                            + "[ProductName:"+conn.getMetaData().getDatabaseProductName()+"]\n"
                            + "[DriverClass:"+conn.getClass().getName()+"]\n"
                            + "[Method:app.liquid.dbx.connection method]\n"
                            ;
                } else {
                    return "Method app.liquid.dbx.connection FAILED by return null";
                }
            } else {
                return "Method app.liquid.dbx.connection NOT defined";
            }
        } catch(Throwable th) {
            return "Method app.liquid.dbx.connection FAILED with error:"+th.getMessage();
        } finally {
            if(conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }


    /**
     * Get connection from class "app.liquid.dbx.connection.getDBConnection" defined in the main project or in sub project
     *
     * @param database
     * @return
     * @throws Throwable
     */
    static public Object [] getDBConnection(String database) throws Throwable {
        Class cls = null;
        Method method = null;
    	try {
            cls = Class.forName("app.liquid.dbx.connection");
            if(cls != null) {
                method = cls.getDeclaredMethod("getDBConnection", String.class);
            }
        } catch(NoSuchMethodException nsm) {
        } catch(ClassNotFoundException cnf) {
            if(jdbcSources.size() == 0) {
                System.err.println(" app.liquid.dbx.connection.getDBConnection() not found. Please add it, or use addLiquidDBConnection(), in order to access to db...");
                throw new Exception("Please add app.liquid.dbx.connection to your application...(Error:"+cnf.getLocalizedMessage()+")");
            }
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getDBConnection() Error:" + th.getLocalizedMessage());
            throw th.getCause();
    	}
        if(method != null) {
            method.setAccessible(true);    
            Object result = method.invoke(null, database);  
            if(result instanceof Object []) {
                return (Object [])result;
            } else {
                return new Object [] { result, null };
            }
            
        } else {
            // use internal method
            return (Object [])getLiquidDBConnection(database);
        }
    }
    
    

    /**
     *
     * Set the connection from parameter in the request ("driver", "connectionURL")
     *
     * @param request
     * @param out
     * @return
     */
    static public String setConnectionString( HttpServletRequest request, JspWriter out ) {
        String result = "", curDriver = null, curConnectionURL = null;
        try {
            String path = request.getContextPath();
            curDriver = (String) request.getParameter("driver");
            curConnectionURL = (String) request.getParameter("connectionURL");
            request.getSession().setAttribute("GLLiquidDriver", utility.base64Decode(curDriver));
            request.getSession().setAttribute("GLLiquidConnectionURL", utility.base64Decode(curConnectionURL));
            result = "{ \"result\":1, \"message\":\"Connection succesfully setted\", \"img\":\"" + (path) + (path.charAt(path.length()-1) != '/' ? "/" : "") + "liquid/images/database.png\" }";
        } catch (Throwable th) {
            System.err.println(" setConnection() Error:" + th.getLocalizedMessage());
	        result = "{ \"result\":0"
	                +",\"error\":\""+utility.base64Encode(th.getLocalizedMessage())+"\" "
	                +"}";
        }
        return result;
    }
    

    /**
     *
     * Reading connection from the request
     *
     * @param request
     * @param out
     * @return
     */
    static public String getConnectionString( HttpServletRequest request, JspWriter out ) {
        String result = "";
        try {
            String driver = utility.base64Decode((String)request.getSession().getAttribute("GLLiquidDriver"));
            String connectionURL = utility.base64Decode((String)request.getSession().getAttribute("GLLiquidConnectionURL"));
            String connectionDesc = "";
            if(connectionURL != null && !connectionURL.isEmpty()) { // Forzata da stringa
                connectionDesc = "[ "+driver+" ]";
            } else {
                 connectionDesc = (String)getConnectionDesc();
            }
            result = "{ \"result\":1"
                    +",\"driver\":\""+utility.base64Encode(driver != null ? driver : "")+"\" "
                    +",\"connectionURL\":\""+utility.base64Encode(connectionURL != null ? connectionURL : "")+"\" "
                    +",\"connectionDesc\":\""+utility.base64Encode(connectionDesc != null ? connectionDesc : "")+"\" "
                    +"}";
        } catch (Throwable th) {
            System.err.println(" setConnection() Error:" + th.getLocalizedMessage());
	        result = "{ \"result\":0"
	                +",\"error\":\""+utility.base64Encode(th.getLocalizedMessage())+"\" "
	                +"}";
	        }
        return result;
    }
    
    
    //
    // Connectin to DB, 1° defined by control's JSON, 2° in the session (request) or 3° by default source of the web app
    //
    static public Object [] getConnection( Method get_connection, HttpServletRequest request, JSONObject tableJson ) throws Throwable  {
        String driver = null, connectionURL = null, database = null;
        try {
            driver = tableJson.has("driver") ? tableJson.getString("driver") : null;
            driver = utility.base64Decode(driver);
        } catch(Exception e) {}
        try {
            connectionURL = tableJson.has("connectionURL") ? tableJson.getString("connectionURL") : null;
            connectionURL = utility.base64Decode(connectionURL);
        } catch(Exception e) {}
        try {
            database = tableJson.has("database") ? tableJson.getString("database") : null;
        } catch(Exception e) {}
        return getConnection(get_connection, request, driver, connectionURL, database );
    }
    


    /**
     // Connectin to DB , defined by control's JSON, in the session (request) or by default source of the web app
     //
     // Test :   jdbc:mysql://localhost:3306/Liquid,liquid,liquid
     //          jdbc:mysql://cnconline:3306/Liquid"
     //          jdbc:postgresql://cnconline:5432/LiquidX?user=liquid&password=liquid
     *
     * @param get_connection
     * @param request
     * @param driver
     * @param connectionURL
     * @param database
     * @return
     * @throws Throwable
     */
    static public Object [] getConnection( Method get_connection, HttpServletRequest request, String driver, String connectionURL, String database ) throws Throwable  {
        return getConnection( get_connection, request, driver, (Object)connectionURL, database );
    }

    /**
     * Connectin to DB , defined by control's JSON, in the session (request) or by default source of the web app
     *
     * @param get_connection
     * @param request
     * @param driver
     * @param connectionURL
     * @param database
     * @return
     * @throws Throwable
     */
    static public Object [] getConnection( Method get_connection, HttpServletRequest request, String driver, Object connectionURL, String database ) throws Throwable  {
        Connection conn = null;
        String errors = "";
        
        try {

            // Connessione specificata su JSON
            if(connectionURL != null) {
                if(connectionURL instanceof ArrayList<?>) {
                    conn = DriverManager.getConnection( ((ArrayList<String>)connectionURL).get(0), ((ArrayList<String>)connectionURL).get(1), ((ArrayList<String>)connectionURL).get(2) );
                } else if(connectionURL instanceof String []) {
                    if(((String [])connectionURL).length == 1) {
                        conn = DriverManager.getConnection( ((String [])connectionURL)[0]);
                    } else if(((String [])connectionURL).length == 2) {
                        conn = DriverManager.getConnection( ((String [])connectionURL)[0], ((String [])connectionURL)[1], null);
                    } else if(((String [])connectionURL).length >= 3) {
                        conn = DriverManager.getConnection( ((String [])connectionURL)[0], ((String [])connectionURL)[1], ((String [])connectionURL)[2]);
                    }
                } else {
                    if ((String)connectionURL != null && !((String)connectionURL).isEmpty() && !"[definedAtServerSide]".equalsIgnoreCase((String)connectionURL)) {
                        try {
                            conn = DriverManager.getConnection((String)connectionURL);
                        } catch (Throwable th) {
                            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
                            throw th;
                        }
                    }
                }
            } else {
                // Connessione specificata su sessione utente
                if(request != null) {
                    if(request.getSession() != null) {
                        String curDriver = utility.base64Decode((String)request.getSession().getAttribute("GLLiquidDriver"));
                        Object curConnectionURL = utility.base64Decode((String)request.getSession().getAttribute("GLLiquidConnectionURL"));
                        if(curDriver != null && !curDriver.isEmpty()) {
                            if(curConnectionURL != null) {
                                try {
                                    if(curConnectionURL instanceof ArrayList<?>) {
                                        conn = DriverManager.getConnection( ((ArrayList<String>)curConnectionURL).get(0), ((ArrayList<String>)curConnectionURL).get(1), ((ArrayList<String>)curConnectionURL).get(2) );
                                    } else if(curConnectionURL instanceof String) {
                                        conn = DriverManager.getConnection((String)curConnectionURL);
                                    }
                                    if(conn == null) {
                                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "// getConnection() error: failed to get connection from url");
                                    }
                                } catch(Throwable th2) {
                                    Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "// getConnection() error: failed to get connection from url : "+th2.getLocalizedMessage());
                                    throw new Throwable(th2);
                                }
                            }
                        }
                    } else {
                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, "// getConnection() FATAL ERROR : unable to get session ... maybe http session listner net active");
                    }
                }
            }
            // Default connection : defined in app with possible jump of database
            if(conn==null) {
                Object [] connResult = null;
                if(get_connection == null) {
                    if(database != null && !database.isEmpty()) {
                        connResult = getDBConnection(database);
                    } else {
                        connResult = getDBConnection();
                    }
                } else {
                    if(database != null && !database.isEmpty()) {
                        connResult = (Object [])get_connection.invoke(null, database);
                    } else {
                        connResult = (Object [])get_connection.invoke(null);
                    }
                }
                conn = (Connection)connResult[0];
                errors = (String)connResult[1];
                if(conn == null) {
                    // ???
                }
            }
    	} catch(Throwable th) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
            throw th;
    	}
        return new Object [] { conn, errors };
    }

    static String classNameFromDriver( String curDriver ) {
        if(curDriver.contains("mysql")) {
            return "com.mysql.jdbc.Driver";
        } else if(curDriver.contains("mariadb")) {
            return "org.mariadb.jdbc.Driver";
        } else if(curDriver.contains("postgres")) {
            return "org.postgresql.Driver";
        } else if(curDriver.contains("oracle")) {
            return "oracle.jdbc.driver.OracleDriver";
        } else if(curDriver.contains("sqlserver")) {
            return "com.microsoft.sqlserver.jdbc.SQLServerDriver";
        }
        return curDriver;
    }
    
    
    //
    // Getting connection description
    //
    static public String getConnectionDesc( HttpServletRequest request, JspWriter out ) {
        String connectionDesc = null;
        String result = "";
        try {
            String driver = (String)request.getSession().getAttribute("GLLiquidDriver");
            Object connectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");
            if(connectionURL != null) {
                // Forzata da stringa
                connectionDesc = "[ "+driver+" ]";
            } else {
                // da package app.liquid.dbx.connection
                connectionDesc = (String)getConnectionDesc();
            }
            result = "{ \"result\":1"
                    +",\"driver\":\""+utility.base64Encode(driver != null ? driver : "")+"\" "
                    +",\"connectionDesc\":\""+utility.base64Encode(connectionDesc != null ? connectionDesc : "")+"\" "
                    +"}";
        } catch (Throwable th) {
            System.err.println(" setConnection() Error:" + th.getLocalizedMessage());
            result = "{ \"result\":0"
                    +",\"error\":\""+utility.base64Encode(th.getLocalizedMessage())+"\" "
                    +"}";
        }
        return result;
    }
    
    static public String getConnectionDesc() {
        Class cls = null;
    	try {
            cls = Class.forName("app.liquid.dbx.connection");
            if(cls != null) {
                Method method = cls.getMethod("getConnectionDesc");
                return (String)method.invoke(null);
            }
        } catch(ClassNotFoundException cnf) {
            System.err.println(" app.liquid.dbx.connection.getConnectionDesc() not found. Please add it in order to access to db...");
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getConnectionDesc() Error:" + th.getLocalizedMessage());
            if(cls != null) {
                Method[] methods = cls.getMethods();
                for(int i=0; i<methods.length; i++) {
                    System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                }
            }
    	}
        return null;
    }
    
    static public String getConnectionURL( String driver, String host, String database, String user, String password) {
        return getConnectionURL( driver, host, database, user, password, null);
    }
    static public String getConnectionURL( String driver, String host, String database, String user, String password, String service) {
    	try {            
            if("oracle".equalsIgnoreCase(driver)) {
                return "jdbc:oracle:thin:@"+host+":1521:"+(service!=null && !service.isEmpty() ? service : "xe")+","+user+","+password;
            } else if("postgres".equalsIgnoreCase(driver)) {
                return "jdbc:postgresql://"+host+":5432/"+database+","+user+","+password;
            } else if("mysql".equalsIgnoreCase(driver)) {
                return "jdbc:mysql://"+host+":3306/"+database+","+user+","+password;
            } else if("mariadb".equalsIgnoreCase(driver)) {
                return "jdbc:mariadb://"+host+":"+"3306"+"/"+database+"?useSSL=false"+","+user+","+password;
            } else if("sqlserver".equalsIgnoreCase(driver)) {
                return "jdbc:sqlserver://"+host+":1433;databaseName="+database+","+user+","+password;
            } else {
                return null;
            }
    	} catch(Throwable th) {
            Logger.getLogger(Connection.class.getName()).log(Level.SEVERE, null, th);
    	}
        return null;
    }
    
    
    
    
    //
    //
    //  Exclicit connection
    //  Ex.: added at runtime by the code
    //
    //
    public static class JDBCSource {
        public String driver = null; // "mariadb", "mysql", "mariadb", "oracle", "sqlserver"
        public String host = null;
        public String port = null;
        public String database = null;
        public String user = null;
        String password = null;
        public String service = null;
        Class driverClass = null;
        boolean pooled;
        connectionPool cp = null;
    }
    
    public static ArrayList<JDBCSource> jdbcSources = new ArrayList<JDBCSource> ();
    
    static public void resetLiquidDBConnection( ) {
        jdbcSources.clear();
    }

    /**
     * Add connection source
     * @param driver
     * @param host
     * @param port
     * @param database
     * @param user
     * @param password
     * @param pooled
     * @return
     * @throws Throwable
     */
    static public boolean addLiquidDBConnection( String driver, String host, String port, String database, String user, String password, boolean pooled ) throws Throwable {
        return addLiquidDBConnection( driver, host, port, database, user, password, null, pooled );
    }

    /**
     * Add connection source
     * @param driver
     * @param host
     * @param port
     * @param database
     * @param user
     * @param password
     * @return
     * @throws Throwable
     */
    static public boolean addLiquidDBConnection( String driver, String host, String port, String database, String user, String password ) throws Throwable {
        return addLiquidDBConnection( driver, host, port, database, user, password, null, true );
    }

    /**
     *
     * @param driver
     * @param host
     * @param port
     * @param database
     * @param user
     * @param password
     * @param service
     * @return
     * @throws Throwable
     */
    static public boolean addLiquidDBConnection( String driver, String host, String port, String database, String user, String password, String service ) throws Throwable {
        return addLiquidDBConnection( driver, host, port, database, user, password, service, true );
    }

    /**
     * Add connection source
     * @param driver
     * @param host
     * @param port
     * @param database
     * @param user
     * @param password
     * @param service   (Oracle service)
     * @param pooled    (use connection pool)
     * @return
     * @throws Throwable
     */
    static public boolean addLiquidDBConnection( String driver, String host, String port, String database, String user, String password, String service, boolean pooled ) throws Throwable {
        for (int ic=0; ic<jdbcSources.size(); ic++) {
            JDBCSource jdbcSource = jdbcSources.get(ic);
            if(driver == null && jdbcSource.driver == null || (driver != null && driver.equalsIgnoreCase(jdbcSource.driver))) {
                if(host == null && jdbcSource.host == null || (host != null && host.equalsIgnoreCase(jdbcSource.host)) || (host == null && "localhost".equalsIgnoreCase(jdbcSource.host))) {
                    if(port == null && jdbcSource.port == null || (port != null && port.equalsIgnoreCase(jdbcSource.port))) {
                        if(database == null && jdbcSource.database == null || (database != null && database.equalsIgnoreCase(jdbcSource.database))) {
                            if(user == null && jdbcSource.user == null || (user != null && user.equalsIgnoreCase(jdbcSource.user))) {
                                if(service == null && jdbcSource.service == null || (service != null && user.equalsIgnoreCase(jdbcSource.service))) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
        JDBCSource jdbcSource = new JDBCSource();
        jdbcSource.driver = driver;
        jdbcSource.host = host;
        jdbcSource.port = port;
        jdbcSource.database = database;
        jdbcSource.user = user;
        jdbcSource.password = password;
        jdbcSource.service = service;
        jdbcSource.pooled = pooled;
        if(pooled) {
            Object [] res = getLiquidDBConnectionURL(jdbcSource, driver, host, port, database, user, password, service);
            if(res[0] != null) {
                jdbcSource.cp = new connectionPool((String) res[0], user, password);
            } else {
                throw new Exception("[LIQUID] Datasource failed : check connection data and missing libraries"
                        +"\ndriver:"+driver
                        +"\nhost:"+host
                        +"\nport:"+port
                        +"\ndatabase:"+database
                        +"\nuser:"+user
                        +"\nservice:"+service
                        +"\nerror:"+res[1]
                );
            }
        }
        jdbcSources.add(jdbcSource);
        
        System.out.println(
                "[LIQUID] added data source .. driver:"+driver
                +" - host:"+(host != null ? host : "[n/d]")
                +" - port:"+(port != null ? port : "[n/d]")
                +" - database:"+(database != null ? database : "[n/d]")
                +" - user:"+(user != null ? user : "[n/d]")
        );
        
        return true;        
    }

    
    //
    // Connection with default database, defined by source previously added
    //
    static public Object [] getLiquidDBConnection() throws Throwable {
        return getLiquidDBConnection(null);
    }

    //
    // Connection to specific database, defined by source previously added
    //
    static public Object [] getLiquidDBConnection(String database) throws Throwable {
        Connection conn = null;
        String errors = null;
        for (int ic=0; ic<jdbcSources.size(); ic++) {
            JDBCSource jdbcSource = jdbcSources.get(ic);
            boolean connect = false;
            try {
                
                if(database != null && !database.isEmpty()) {
                    if(database.equalsIgnoreCase(jdbcSource.database)) {
                        connect = true;
                    }
                } else {
                    database = jdbcSource.database;
                    connect = true;
                }
                if(connect) {
                    Object [] connResult = getLiquidDBConnection(jdbcSource, jdbcSource.driver, jdbcSource.host, jdbcSource.port, database, jdbcSource.user, jdbcSource.password);
                    if(connResult != null) {
                        return new Object [] { connResult[0], connResult[1], jdbcSource.driver, jdbcSource.host, jdbcSource.port, database };
                    }
                }
                
            } catch (Throwable th) {                
                Logger.getLogger(Connection.class.getName()).log(Level.SEVERE, null, th);
                System.err.println("getLiquidDBConnection() : "+th.getMessage());
            }
        }
        return new Object [] { null, errors, null, null, null, null };
    }

    static public Object [] getLiquidDBConnection(JDBCSource jdbcSource, String driver, String host, String port, String database, String user, String password) throws Throwable {
        return getLiquidDBConnection(jdbcSource, driver, host, port, database, user, password, null);
    }
    static public Object [] getLiquidDBConnectionURL(JDBCSource jdbcSource, String driver, String host, String port, String database, String user, String password, String service) throws Throwable {
        String url = null;
        String errors = null;
        try {
            Class driverClass = (jdbcSource != null ? jdbcSource.driverClass : null);
            if(host == null || host.isEmpty()) host = "localhost";
            if("oracle".equalsIgnoreCase(driver)) {
                if(port == null || port.isEmpty()) port = "1521";
                if(driverClass == null) driverClass = Class.forName("oracle.jdbc.driver.OracleDriver");
                if(jdbcSource != null) jdbcSource.driverClass = driverClass;

                String serviceName = (service != null && !service.isEmpty() ? service : "");
                String serviceSeparator = "/";
                if(service.startsWith("/") || service.startsWith(":")) serviceSeparator = "";
                if(host.startsWith("(")) {
                    url = "jdbc:oracle:thin:"+user+"/"+password+"@"+host;
                } else {
                    url = "jdbc:oracle:thin:@"+host+":"+port+((serviceName != null && !serviceName.isEmpty()) ? (serviceSeparator+serviceName) : "");
                }
            } else if("postgres".equalsIgnoreCase(driver)) {
                if(port == null || port.isEmpty()) port = "5432";
                if(driverClass == null) driverClass = Class.forName("org.postgresql.Driver");
                if(jdbcSource != null) jdbcSource.driverClass = driverClass;
                url = "jdbc:postgresql://"+host+":"+port+"/"+database;
            } else if("mysql".equalsIgnoreCase(driver)) {
                if(port == null || port.isEmpty()) port = "3306";
                if(driverClass == null) driverClass = Class.forName("com.mysql.jdbc.Driver");
                if(jdbcSource != null) jdbcSource.driverClass = driverClass;
                Connection conn = null;
                try {
                    url = "jdbc:mysql://"+host+":"+port+"/"+database;
                    conn = DriverManager.getConnection(url,user,password);
                } catch (Throwable th) {
                    url = "jdbc:mysql://"+host+":"+port+"/"+database+"?useUnicode=true&useJDBCCompliantTimezoneShift=true&useLegacyDatetimeCode=false&serverTimezone=UTC";
                    conn = DriverManager.getConnection(url,user,password);
                }
                if(conn != null) conn.close();
            } else if("mariadb".equalsIgnoreCase(driver)) {
                if(port == null || port.isEmpty()) port = "3306";
                if(driverClass == null) driverClass = Class.forName("org.mariadb.jdbc.Driver");
                if(jdbcSource != null) jdbcSource.driverClass = driverClass;
                url = "jdbc:mariadb://"+host+":"+port+"/"+database+"?useSSL=false";

            } else if("sqlserver".equalsIgnoreCase(driver)) {
                if(port == null || port.isEmpty()) port = "1433";
                if(driverClass == null) driverClass = Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                if(jdbcSource != null) jdbcSource.driverClass = driverClass;
                url = "jdbc:sqlserver://"+host+":"+port+";databaseName="+database;
            } else {
                Logger.getLogger(Connection.class.getName()).log(Level.SEVERE, "drive not recognized");
                errors = "drive not recognized";
            }
        } catch (Throwable th) {
            errors = th.getMessage() + " - "+th.toString();
        }
        return new Object [] { url, errors };
    }

    /**
     * Connect to DB using
     * @param jdbcSource
     * @param driver
     * @param host
     * @param port
     * @param database
     * @param user
     * @param password
     * @param service
     * @return
     * @throws Throwable
     */
    static public Object [] getLiquidDBConnection(JDBCSource jdbcSource, String driver, String host, String port, String database, String user, String password, String service) throws Throwable {
        Connection conn = null;
        String errors = null;
        if(jdbcSource != null && jdbcSource.pooled) {
            // User connection pool
            try {
                conn = jdbcSource.cp.getConnection();
            } catch (Throwable th) {
                errors = th.getMessage();
            }
        } else {
            // Use single connection
            Object [] res = getLiquidDBConnectionURL(jdbcSource, driver, host, port, database, user, password, service);
            String url =(String)res[0];
            try {
                conn = DriverManager.getConnection(url, user, password);
            } catch (Throwable th) {
                errors = th.getMessage();
            }
        }
        return new Object [] { conn, errors };
    }
    
    /**
     * Close the connection and invoke the callback
     * @param conn
     * @return 
     */
    static public boolean closeConnection(Connection conn) {
        boolean retVal = false;
        
        try {
            if(conn != null) {
                if(!conn.isClosed()) {
                    Class cls = null;
                    Method method = null;        
                    try {
                        cls = Class.forName("app.liquid.dbx.connection");
                        if(cls != null) {
                            method = cls.getDeclaredMethod("closeConnection", Connection.class);
                        }
                    } catch(NoSuchMethodException nsm) {
                    } catch(ClassNotFoundException cnf) {
                    } catch(Throwable th) {
                    }        
                    if(method != null) {
                        try {
                            method.invoke(null, conn);
                            retVal = (boolean)true;
                        } catch (IllegalAccessException ex) {
                            Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                        } catch (IllegalArgumentException ex) {
                            Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                        } catch (InvocationTargetException ex) {
                            Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                        } catch (Throwable th) {
                            Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, th);
                            retVal = false;
                        }
                    } else {
                        // use internal method            
                        if (conn != null) {
                            conn.close();
                            retVal = true;
                        }
                    }
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return retVal;
    }
    
}


