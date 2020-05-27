package com.liquid;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;


// TODO : supporto per oracle e sqlserver

public class assets {

    // N.B.: application_id e domain_id, daysValidity, emailAppName, emailAppURL, emailFrom dipendono dalle sessione
    
        

    // coordinate tabella utenti
    static public String assets_table = "assets";
    static public String roles_table = "roles";
    static public String user_assets_table = "users_assets";
    static public String user_roles_table = "users_roles";
    static public String role_assets_table = "roles_assets";
    static public int daysValidity = 0;
    
    // coordinate tabella log eventi
    static public String schemaLog = null;
    static public String tableLog = null;
    static public boolean setupLogDone = false;
    
    
    static private String itemIdString = "\"";
    static private String tableIdString = "";
    static private boolean debug = true;
    static private String password_seed = "Liquid2020";
    

    static public void setApplicationId(HttpServletRequest request, String applicationId) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidAssetsApplicationId", applicationId);
    }
    static public void setDomainId(HttpServletRequest request, String domain_id) {
        if(request != null)
            request.getSession().setAttribute("GLLiquidAssetsDomainId", domain_id);
    }
    

    
    //
    // Please Note : to define custon connection you need to define driver, database, and schema
    //              user and or password may be null
    //
    static public Connection getConnection() throws ClassNotFoundException, SQLException {
        return login.getConnection();
    }


    static private boolean check_assets_table_exist( Connection conn, String schema, String table ) throws SQLException {
        if(conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[] {"TABLE"});
            while (res.next()) {
                if(res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if(!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
               
                if("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                        +",`asset` VARCHAR(256) NOT NULL"
                        +",`status` VARCHAR(16) NOT NULL"
                        +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",`expire_date` TIMESTAMP"
                        +",`expired` VARCHAR(2)"
                        );
                } else if("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+assets_table+"_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS "+seqName+"");

                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"asset\" VARCHAR(256) NOT NULL"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                } else if("oracle".equalsIgnoreCase(login.driver)) {
                } else if("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if(sql != null) {
                    for(int is=0; is<sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_assets_table_exist() Error:" + e.getLocalizedMessage());
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
        return false;
    }
    

    static private boolean check_roles_table_exist( Connection conn, String schema, String table ) throws SQLException {
        if(conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[] {"TABLE"});
            while (res.next()) {
                if(res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if(!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
               
                if("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                        +",`role` VARCHAR(256) NOT NULL"
                        +",`status` VARCHAR(16) NOT NULL"
                        +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",`expire_date` TIMESTAMP"
                        +",`expired` VARCHAR(2)"
                        );
                } else if("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+assets_table+"_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS "+seqName+"");

                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"role\" VARCHAR(256) NOT NULL"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                } else if("oracle".equalsIgnoreCase(login.driver)) {
                } else if("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if(sql != null) {
                    for(int is=0; is<sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_assets_table_exist() Error:" + e.getLocalizedMessage());
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
        return false;
    }

    static private boolean check_user_asset_table_exist( Connection conn, String schema, String table ) throws SQLException {
        if(conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[] {"TABLE"});
            while (res.next()) {
                if(res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if(!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
               
                if("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                        +",`user_id` INT"
                        +",`aaset_id` INT"
                        +",`status` VARCHAR(16) NOT NULL"
                        +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",`expire_date` TIMESTAMP"
                        +",`expired` VARCHAR(2)"
                        );
                } else if("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+assets_table+"_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS "+seqName+"");

                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"user_id\" INT "
                        +",\"aaset_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                } else if("oracle".equalsIgnoreCase(login.driver)) {
                } else if("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if(sql != null) {
                    for(int is=0; is<sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_assets_table_exist() Error:" + e.getLocalizedMessage());
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
        return false;
    }


    static private boolean check_user_roles_table_exist( Connection conn, String schema, String table ) throws SQLException {
        if(conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[] {"TABLE"});
            while (res.next()) {
                if(res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if(!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
               
                if("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                        +",`user_id` INT"
                        +",`role_id` INT"
                        +",`status` VARCHAR(16) NOT NULL"
                        +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",`expire_date` TIMESTAMP"
                        +",`expired` VARCHAR(2)"
                        );
                } else if("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+assets_table+"_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS "+seqName+"");

                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"user_id\" INT "
                        +",\"role_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                } else if("oracle".equalsIgnoreCase(login.driver)) {
                } else if("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if(sql != null) {
                    for(int is=0; is<sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_assets_table_exist() Error:" + e.getLocalizedMessage());
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
        return false;
    }

    static private boolean check_role_assets_table_exist( Connection conn, String schema, String table ) throws SQLException {
        if(conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[] {"TABLE"});
            while (res.next()) {
                if(res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if(!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
               
                if("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"`id` INT AUTO_INCREMENT PRIMARY KEY"
                        +",`role_id` INT"
                        +",`asset_id` INT"
                        +",`status` VARCHAR(16) NOT NULL"
                        +",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",`expire_date` TIMESTAMP"
                        +",`expired` VARCHAR(2)"
                        );
                } else if("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema+".":"")+assets_table+"_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS "+seqName+"");

                    sql.add("CREATE TABLE IF NOT EXISTS "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"role_id\" INT "
                        +",\"asset_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(tableIdString+schema+tableIdString)+"."+(tableIdString+table+tableIdString)+".\"id\"");

                } else if("oracle".equalsIgnoreCase(login.driver)) {
                } else if("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if(sql != null) {
                    for(int is=0; is<sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_assets_table_exist() Error:" + e.getLocalizedMessage());
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
        return false;
    }
    
    
    static public String is_asset_active ( String asset ) {
        try {            
            ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
            if(threadSession != null) {                
                HttpServletRequest request = threadSession.request;
                ArrayList<Object> user_all_assets_name = (ArrayList<Object> )request.getSession().getAttribute("GLLiquidUsertAssetsName");
                int index = user_all_assets_name.indexOf(asset);
            }            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println("// is_asset_active() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    
    // TODO:
    static public String add_asset ( String asset, String active, int userId ) {
        try {            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println("// add_asset() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }

    

    // Load all roles and asset for userId, typically onLogin
    static public boolean read_user_assets_roles ( HttpServletRequest request, int userId ) {
        boolean retVal = true;
        
        Connection conn = null;
        
        try {
            conn = getConnection();

            if(!check_assets_table_exist( conn, login.schema, assets_table )) {            
            }
            if(!check_roles_table_exist( conn, login.schema, roles_table )) {            
            }
            if(!check_user_asset_table_exist( conn, login.schema, user_assets_table )) {
            }
            if(!check_user_roles_table_exist( conn, login.schema, user_roles_table )) {
            }
            if(!check_role_assets_table_exist( conn, login.schema, role_assets_table )) {
            }
            
            ArrayList<Object> user_all_assets = new ArrayList<Object>();
            ArrayList<Object> user_all_assets_name = new ArrayList<Object>();


            String curDriver = (String)request.getSession().getAttribute("GLLiquidDriver");
            String curConnectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");

            try {
                
                request.getSession().setAttribute("GLLiquidDriver", login.driver);
                request.getSession().setAttribute("GLLiquidConnectionURL", login.connectionURL);

                // assets per user
                ArrayList<Object> user_asset_ids = db.load_beans( (HttpServletRequest)request, login.database+"."+login.schema+"."+user_assets_table, "asset_id", "user_id", String.valueOf(userId), 1000 );
                if(user_asset_ids != null)
                    user_all_assets.addAll(user_asset_ids);

                // assets per roles per user
                ArrayList<Object> user_role_ids = db.load_beans( (HttpServletRequest)request, login.database+"."+login.schema+"."+roles_table, "role_id", "user_id", String.valueOf(userId), 1000 );
                if(user_role_ids != null) {
                    for(Object roleId : user_role_ids) {
                        ArrayList<Object> user_role_asset_ids = db.load_beans( (HttpServletRequest)request, login.database+"."+login.schema+"."+role_assets_table, "asset_id", "role_id", String.valueOf(roleId), 1000 );
                        if(user_role_asset_ids != null)
                            user_all_assets.addAll(user_role_asset_ids);
                    }
                }
                
                // all assets name
                user_all_assets_name = db.load_beans( (HttpServletRequest)request, login.database+"."+login.schema+"."+user_assets_table, "asset", "asset_id", (Object)user_all_assets, 1000 );
                
                request.getSession().setAttribute("GLLiquidUsertAssetsID", user_all_assets);
                request.getSession().setAttribute("GLLiquidUsertAssetsName", user_all_assets_name);
            
            } finally {
                request.getSession().setAttribute("GLLiquidDriver", curDriver);
                request.getSession().setAttribute("GLLiquidConnectionURL", curConnectionURL);
            }
            
        } catch (Throwable e) {
            System.err.println("// read_user_assets_roles() Error:" + e.getLocalizedMessage());
        } finally {
            try {
                conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(assets.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    
    return retVal;
    }
    
}