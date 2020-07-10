package com.liquid;

import com.liquid.db.beansCondition;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import org.json.JSONArray;
import org.json.JSONException;


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
                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
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

                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"asset\" VARCHAR(256) NOT NULL"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+".\"id\"");

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
                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
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

                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"role\" VARCHAR(256) NOT NULL"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+".\"id\"");

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
                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
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

                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"user_id\" INT "
                        +",\"aaset_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+".\"id\"");

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
                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
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

                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"user_id\" INT "
                        +",\"role_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+".\"id\"");

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
                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
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

                    sql.add("CREATE TABLE IF NOT EXISTS "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+" ("
                        +"\"id\" INT PRIMARY KEY DEFAULT nextval('"+seqName+"')"
                        +",\"role_id\" INT "
                        +",\"asset_id\" INT"
                        +",\"status\" VARCHAR(16) NOT NULL"
                        +",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                        +",\"expire_date\" TIMESTAMP"
                        +",\"expired\" VARCHAR(2)"
                        +")");

                    sql.add("ALTER SEQUENCE "+seqName+" OWNED BY "+(schema != null && !schema.isEmpty() ? (tableIdString+schema+tableIdString+"."):"")+(tableIdString+table+tableIdString)+".\"id\"");

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
    
    
    static public Object [] is_asset_active ( HttpServletRequest request, JSONArray assets, String assetsOp ) throws JSONException {
        boolean hasActiveAsset = true;
        String invalid_assets = null;
       
        // Administrator  ?
        int GLLiquidAdmin = (int)request.getSession().getAttribute("GLLiquidAdmin");
        if(GLLiquidAdmin > 0) {
            // ... can do everythings
            return new Object [] { true, null };
        }
        if(assets != null && assets.length() > 0) {
            hasActiveAsset = false;
            if(assetsOp == null || assetsOp.isEmpty()) assetsOp = "or";
            ArrayList<String>assetsArray = (ArrayList<String>)request.getSession().getAttribute("GLLiquidUserAssetsName");
            for(int ia=0; ia<assets.length(); ia++) {
                if(assetsArray.contains( assets.getString(ia) )) {
                    if("or".equalsIgnoreCase(assetsOp)) {
                        hasActiveAsset = true;
                        invalid_assets += assets.getString(ia);
                        break;
                    }
                } else {
                    if("and".equalsIgnoreCase(assetsOp)) {
                        hasActiveAsset = false;
                        invalid_assets += assets.getString(ia);
                        break;
                    }
                }
            }
        }
        return new Object [] { hasActiveAsset, invalid_assets };
    }
    
    static public String is_asset_active ( String asset ) {
        try {            
            ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
            if(threadSession != null) {                
                HttpServletRequest request = threadSession.request;
                ArrayList<Object> user_all_assets_name = (ArrayList<Object> )request.getSession().getAttribute("GLLiquidUserAssetsName");
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

    // TODO:
    static public String get_assets ( ) {
        try {            
            ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
            if(threadSession != null) {                
                return get_assets ( threadSession.request );
            }
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println("// get_assets() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    
    // For usage from jsp
    static public String get_assets ( HttpServletRequest request ) {
        try {            
            if(request != null) {                
                ArrayList<Object> user_all_assets_name = (ArrayList<Object> )request.getSession().getAttribute("GLLiquidUserAssetsName");
                return user_all_assets_name != null ? workspace.arrayToString(user_all_assets_name.toArray(), "\"", "\"", ",") : "";
            }
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println("// get_assets() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }

    
    static public boolean is_valid_asset_or_role ( Object bean ) {
        if(bean != null) {
            String status = (String)utility.get(bean, "status");
            if(!"D".equalsIgnoreCase(status) && !"S".equalsIgnoreCase(status)) {
                java.sql.Timestamp expireDate = (java.sql.Timestamp)utility.get(bean, "expire_date");
                if(expireDate != null) {
                    java.sql.Timestamp currentDate = new java.sql.Timestamp(System.currentTimeMillis());
                    if(currentDate.before(expireDate)) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Load all roles and asset for userId, typically onLogin
    static public boolean read_user_assets_roles ( HttpServletRequest request, int userId ) {
        return read_user_assets_roles(request, (String)String.valueOf(userId));
    }
    static public boolean read_user_assets_roles ( HttpServletRequest request, String userId ) {
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
            
            ArrayList<Object> user_all_assets_id = new ArrayList<Object>();
            ArrayList<Object> user_all_assets_name = new ArrayList<Object>();
            ArrayList<Object> user_all_inactive_assets_id = new ArrayList<Object>();
            ArrayList<Object> user_all_inactive_assets_name = new ArrayList<Object>();


            String curDriver = (String)request.getSession().getAttribute("GLLiquidDriver");
            String curConnectionURL = (String)request.getSession().getAttribute("GLLiquidConnectionURL");

            try {
                
                // Reset in session
                request.getSession().setAttribute("GLLiquidUserAssetsID", user_all_assets_id);
                request.getSession().setAttribute("GLLiquidUserAssetsName", user_all_assets_name);
                
                request.getSession().setAttribute("GLLiquidDriver", login.driver);
                request.getSession().setAttribute("GLLiquidConnectionURL", login.connectionURL);

                // assets for user
                ArrayList<Object> user_asset_beans = db.load_beans( (HttpServletRequest)request, workspace.getDatabaseSchemaTable(login.database, login.schema, user_assets_table), "*", "user_id", (Object)userId, 1000 );
                if(user_asset_beans != null) {
                    // put asset_id of all beans in ArryList
                    Object [] res = db.beansToArray(user_asset_beans, "asset_id", user_all_assets_id, true, (beansCondition)assets::is_valid_asset_or_role);
                    user_all_inactive_assets_id.addAll((ArrayList<Object>)res[1]);
                }

                // assets per roles for user
                ArrayList<Object> user_role_beans = db.load_beans( (HttpServletRequest)request, workspace.getDatabaseSchemaTable(login.database, login.schema, user_roles_table), "*", "user_id", (Object)userId, 1000 );
                if(user_role_beans != null) {
                    for(Object role_bean : user_role_beans) {
                        Object roleId = utility.get(role_bean, "role_id");
                        String status = (String)utility.get(role_bean, "status");
                        boolean bProcessRole = false;
                        if(!"D".equalsIgnoreCase(status) && !"S".equalsIgnoreCase(status)) {
                            java.sql.Timestamp expireDate = (java.sql.Timestamp)utility.get(role_bean, "expire_date");
                            if(expireDate != null) {
                                java.sql.Timestamp currentDate = new java.sql.Timestamp(System.currentTimeMillis());
                                if(currentDate.before(expireDate)) {
                                    bProcessRole = true;
                                }
                            } else {
                                bProcessRole = true;
                            }
                        }
                        ArrayList<Object> user_role_asset_beans = db.load_beans( (HttpServletRequest)request, workspace.getDatabaseSchemaTable(login.database, login.schema, role_assets_table), "*", "role_id", (Object)roleId, 1000 );
                        if(user_role_asset_beans != null) {
                            if(bProcessRole) {
                                // put asset_id of all beans in ArryList
                                Object [] res = db.beansToArray(user_role_asset_beans, "asset_id", user_all_assets_id, true, (beansCondition)assets::is_valid_asset_or_role);
                                user_all_inactive_assets_id.addAll((ArrayList<Object>)res[1]);
                            } else {
                                // all assets inactive due to role inactive
                                db.beansToArray(user_role_asset_beans, "asset_id", user_all_inactive_assets_id, true, null);
                            }
                        }
                    }
                }
                
                // all assets of the userId by name in ArrayList
                ArrayList<Object> user_all_assets_beans = db.load_beans((HttpServletRequest)request, workspace.getDatabaseSchemaTable(login.database, login.schema, assets_table), "*", "id", (Object)user_all_assets_id, 1000 );
                if(user_all_assets_beans != null) {
                    // put asset of all beans in ArryList
                    db.beansToArray(user_all_assets_beans, "asset", user_all_assets_name, true);
                }

                // all expired assets of the userId by name in ArrayList
                ArrayList<Object> user_all_inactive_assets_beans = db.load_beans((HttpServletRequest)request, workspace.getDatabaseSchemaTable(login.database, login.schema, assets_table), "*", "id", (Object)user_all_inactive_assets_id, 1000 );
                if(user_all_inactive_assets_beans != null) {
                    // put inactive asset of all beans in ArryList
                    db.beansToArray(user_all_inactive_assets_beans, "asset", user_all_inactive_assets_name, true);
                }
                
                // Save in session
                request.getSession().setAttribute("GLLiquidUserAssetsID", user_all_assets_id);
                request.getSession().setAttribute("GLLiquidUserAssetsName", user_all_assets_name);
                request.getSession().setAttribute("GLLiquidUserInactiveAssetsName", user_all_inactive_assets_name);
            
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