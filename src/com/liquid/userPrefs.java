package com.liquid;

import com.liquid.bean.beansCondition;
import org.json.JSONArray;
import org.json.JSONException;

import javax.servlet.http.HttpServletRequest;
import java.sql.*;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

import static com.liquid.bean.beansToArray;
import static com.liquid.bean.load_beans;


// TODO : supporto per oracle e sqlserver

public class userPrefs {

    // N.B.: application_id e domain_id, daysValidity, emailAppName, emailAppURL, emailFrom dipendono dalle sessione


    // coordinate tabella utenti
    static public String user_preferences_table = "user_preferences";


    static private String itemIdString = "\"";
    static private String tableIdString = "";
    static private boolean debug = true;
    static private String password_seed = "Liquid2020";


    //
    // Please Note : to define custon connection you need to define driver, database, and schema
    //              user and or password may be null
    //
    static public Object[] getConnection() throws ClassNotFoundException, SQLException, Throwable {
        return login.getConnection();
    }


    static public boolean check_user_preferences_table_exist(Connection conn, String schema, String table) throws SQLException {
        if (conn != null) {
            boolean tableExist = false;
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet res = meta.getTables(login.database, schema, table, new String[]{"TABLE"});
            while (res.next()) {
                if (res.getString("TABLE_NAME") != null) {
                    tableExist = true;
                }
            }
            res.close();
            if (!tableExist) {
                ArrayList<String> sql = new ArrayList<String>();
                String schemaTable = (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "") + (tableIdString + table + tableIdString);
                if ("mysql".equalsIgnoreCase(login.driver)) {
                    sql.add("SET sql_mode='';");
                    sql.add("CREATE TABLE IF NOT EXISTS " + schemaTable + " ("
                            + "`id` INT AUTO_INCREMENT PRIMARY KEY"
                            + ",`userId` VARCHAR(256) NOT NULL"
                            + ",`controlId` VARCHAR(256) NOT NULL"
                            + ",`status` VARCHAR(16)"
                            + ",`date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                            + ",`data` TEXT"
                            + ")"
                    );
                    sql.add("alter table user_preferences add constraint user_preferences_pk unique (`userId`,`controlId`);");
                } else if ("postgres".equalsIgnoreCase(login.driver)) {
                    String seqName = (schema != null && !schema.isEmpty() ? schema + "." : "") + table + "_id_seq";
                    sql.add("CREATE SEQUENCE IF NOT EXISTS " + seqName + "");
                    sql.add("CREATE TABLE IF NOT EXISTS " + (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "") + (tableIdString + table + tableIdString) + " ("
                            + "\"id\" INT PRIMARY KEY DEFAULT nextval('" + seqName + "')"
                            + ",\"userId\" VARCHAR(256) NOT NULL"
                            + ",\"controlId\" VARCHAR(256) NOT NULL"
                            + ",\"status\" VARCHAR(16)"
                            + ",\"date\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                            + ",\"data\" TEXT"
                            + ")"
                    );
                    sql.add("alter table user_preferences add constraint user_preferences_pk unique (\"userId\", \"controlId\");");
                    sql.add("ALTER SEQUENCE " + seqName + " OWNED BY " + (schema != null && !schema.isEmpty() ? (tableIdString + schema + tableIdString + ".") : "") + (tableIdString + table + tableIdString) + ".\"id\"");

                } else if ("oracle".equalsIgnoreCase(login.driver)) {
                } else if ("sqlserver".equalsIgnoreCase(login.driver)) {
                }
                if (sql != null) {
                    for (int is = 0; is < sql.size(); is++) {
                        PreparedStatement psdoLogin = null;
                        PreparedStatement psdoSetup = null;
                        try {
                            psdoLogin = conn.prepareStatement(sql.get(is));
                            psdoLogin.executeUpdate();
                        } catch (Throwable e) {
                            System.err.println("// check_user_preferences_table_exist() Error:" + e.toString());
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

    /**
     *
     * @param controlId
     * @param requestContent
     * @param request
     * @return
     * @throws Throwable
     */
    public static String saveUIParams(String controlId, String requestContent, HttpServletRequest request) throws Throwable {
        String retVal = "{\"result\":false, \"error\":\"unexpected\"}";
        try {
            if (login.isLogged(request)) {
                String userId = login.getLoggedID(request);
                String schemaTable = (login.schema != null && !login.schema.isEmpty() ? (tableIdString + login.schema + tableIdString + ".") : "") + (tableIdString + user_preferences_table + tableIdString);
                if (userId != null && !userId.isEmpty()) {
                    Object[] res = db.insert_update_row(
                            schemaTable,
                            new String[]{"userId", "controlId", "data"},
                            new Object[]{userId, controlId, requestContent},
                            new Object[]{"userId", "controlId"},
                            request
                    );
                    if (res != null && (boolean) res[0]) {
                        retVal = "{\"result\":true, \"msg\":\"OK\"}";
                    }
                }
            }
        } catch (Exception e) {
            retVal = "{\"result\":false, \"error\":\""+e+"\"}";
        }
        return retVal;
    }

    /**
     *
     * @param controlId
     * @param request
     * @return
     * @throws Throwable
     */
    public static String loadUIParams(String controlId, HttpServletRequest request) throws Throwable {
        String retVal = "";
        try {
            if(login.isLogged(request)) {
                String userId = login.getLoggedID(request);
                String schemaTable = (login.schema != null && !login.schema.isEmpty() ? (tableIdString + login.schema + tableIdString + ".") : "") + (tableIdString + user_preferences_table + tableIdString);
                if(userId != null && !userId.isEmpty()) {
                    Object up = bean.load_bean(schemaTable, "*", "\"userId\"='"+userId+"' and \"controlId\"='"+controlId+"'");
                    if(up != null) {
                        return utility.getString(up, "data");
                    }
                }
            }
        } catch (Exception e) {
            retVal = "{\"result\":false, \"error\":\""+utility.base64Encode(e.toString())+"\"}";
        }
        return retVal;
    }

}