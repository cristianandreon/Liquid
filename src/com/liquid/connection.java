package com.liquid;


import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.DriverManager;
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

    static public Connection getDBConnection() {
        Class cls = null;
    	try {
            cls = Class.forName("app.liquid.dbx.connection");
            Method method = cls.getMethod("getDBConnection");
            return (Connection)method.invoke(null);
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getDBConnection() Error:" + th.getLocalizedMessage());
            Method[] methods = cls.getMethods();
            for(int i=0; i<methods.length; i++) {
                System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
            }
    	}
        return null;    
    }
    static public Connection getDBConnection(String database) {
        Class cls = null;
    	try {
            cls = Class.forName("app.liquid.dbx.connection");
            Method method = cls.getMethod("getDBConnection", String.class);
            return (Connection)method.invoke(null, database);
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getDBConnection() Error:" + th.getLocalizedMessage());
            Method[] methods = cls.getMethods();
            for(int i=0; i<methods.length; i++) {
                System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
            }
    	}
        return null;    
    }
    
    
        // Servizio impostazione della connessione
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
    
        // Servizio lettura della connessione
    static public String getConnectionString( HttpServletRequest request, JspWriter out ) {
        String result = "";
        try {
            String driver = (String)request.getSession().getAttribute("GLLiquidDriver");
            String connectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");
            String connectionDesc = "";
            if(connectionURL != null && !connectionURL.isEmpty()) { // Forzata da stringa
                connectionDesc = "[ *** driver:"+driver+" "+"{SERVER SIDE DEFINED}" + " *** ]";
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
    
    // Connessione specificata su JSON o sulla sessione
    static public Connection getConnection( Method get_connection, HttpServletRequest request, JSONObject tableJson )  {
        String driver = null, connectionURL = null;
        try { driver = tableJson.getString("driver"); } catch(Exception e) {}
        try { connectionURL = tableJson.getString("connectionURL"); } catch(Exception e) {}        
        return getConnection( get_connection, request, driver, connectionURL );
    }
    
    
    // Connessione specificata su JSON o sulla sessione
    //
    // Test :   jdbc:mysql://localhost:3306/Liquid,liquid,liquid
    //          jdbc:mysql://cnconline:3306/Liquid"
    //          jdbc:postgresql://cnconline:5432/LiquidX?user=liquid&password=liquid
    //
    static public Connection getConnection( Method get_connection, HttpServletRequest request, String driver, String connectionURL )  {
        Connection conn = null;
        try {
            
            if(workspace.default_connection == null) 
                workspace.default_connection = (Method)com.liquid.connection.class.getMethod("getDBConnection");
            
            get_connection = workspace.default_connection;

            // Connessione specificata su JSON
            if(connectionURL != null) {
                if(driver != null) { Class driverClass = Class.forName(driver); }
                if(connectionURL != null && !connectionURL.isEmpty() && !"[definedAtServerSide]".equalsIgnoreCase(connectionURL)) {
                    try {
                        conn = DriverManager.getConnection(connectionURL);
                    } catch(Throwable th) {
                        Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
                    }
                }
            } else {
                // Connessione specificata su sessione utente
                if(request != null) {
                    String curDriver = (String)request.getSession().getAttribute("GLLiquidDriver");
                    String curConnectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");
                    if(curDriver != null && !curDriver.isEmpty()) {
                        if(curConnectionURL != null && !curConnectionURL.isEmpty()) {
                            Class driverClass = null;
                            try {
                                driverClass = Class.forName(curDriver);
                            } catch (Throwable th) {
                                if(curDriver.contains("mysql")) {
                                    try {
                                        driverClass = Class.forName("com.mysql.jdbc.Driver");
                                    } catch (Throwable th1) {
                                        try {
                                            driverClass = Class.forName("com.mysql.cj.jdbc.Driver");
                                        } catch (Throwable th2) {
                                        }
                                    }
                                } else if(curDriver.contains("postgres")) {
                                    try {
                                        driverClass = Class.forName("org.postgresql.Driver");
                                    } catch (Throwable th1) {
                                    }
                                } else if(curDriver.contains("oracle")) {
                                    try {
                                        driverClass = Class.forName("oracle.jdbc.driver.OracleDriver");
                                    } catch (Throwable th1) {
                                    }
                                } else if(curDriver.contains("sqlserver")) {
                                    try {
                                        driverClass = Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                                    } catch (Throwable th1) {
                                    }
                                }
                            }
                            conn = DriverManager.getConnection(curConnectionURL);
                        }
                    }
                }
            }            
            try {
                if(conn==null) {
                    conn = (Connection)(get_connection != null ? get_connection.invoke(null) : null);
                }
            } catch (Exception ex) {
                Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
            }
    	} catch(Throwable th) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, th);
    	}
        return conn;
    }
    
    
    // Servizio lettura della descrizione della connessione
	static public String getConnectionDesc( HttpServletRequest request, JspWriter out ) {
            String connectionDesc = null;
	    String result = "";
	    try {
                String driver = (String)request.getSession().getAttribute("GLLiquidDriver");
                String connectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");
                if(connectionURL != null && !connectionURL.isEmpty()) {
                    // Forzata da stringa
                    connectionDesc = "[ *** driver:"+driver+" "+"{SERVER SIDE DEFINED}" + " *** ]";
                } else {
                    // da package app.liquid.dbx.connection
                    connectionDesc = (String)getConnectionDesc();
                }
	        result = "{ \"result\":1"
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
            Method method = cls.getMethod("getConnectionDesc");
            return (String)method.invoke(null);
    	} catch(Throwable th) {
            System.err.println(" app.liquid.dbx.connection.getConnectionDesc() Error:" + th.getLocalizedMessage());
            Method[] methods = cls.getMethods();
            for(int i=0; i<methods.length; i++) {
                System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
            }
    	}
        return null;
    }    

}


