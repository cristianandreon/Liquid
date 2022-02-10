package com.liquid;

import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


//
// System and utility command to espose in liquids contreol
//
public class system_command {
    
    //  Import remore records from host/database/user/password
    //  Create record in tbl_wrk for the keys ids and all foreign table
    //  params :
    //      ids = elenco di primaryKey records da importare
    //      driver : oracle/postgres/mysql/sqlserver
    //      host : macchina remota
    //      database : db remoto
    //      schema : schema remoto
    //      user : utente connessione al db
    //      password : password connessione al db
    //
    // TODO : Dialogo lato client per il set dei parametri
    //
    // TODO : test and debug
    //
    static public String importRemoteRows (Object tbl_wrk, Object params, Object clientData, Object requestParam ) throws JSONException, Exception, Throwable {
        String result = "{";
        
                
        result += "\"result\":1";
        result += ",\"timecode\":"+System.currentTimeMillis();
        
        if(tbl_wrk != null) {            
            workspace liquid = (workspace)tbl_wrk;
        
            if(params != null) {
        
                if(clientData != null) {
                }

                String remoteTable = liquid.tableJson.getString("table");
                JSONObject remoteData = event.getJSONObject(params, "remoteData");
                String remoteSchema = remoteData.getString("schema");
                String remoteDatabase = remoteData.getString("database");
                String remoteConnectionDriver = remoteData.getString("driver");
                String remoteConnectionHost = remoteData.getString("host");
                String remoteConnectionUser = remoteData.getString("user");
                String remoteConnectionPassword = remoteData.getString("password");
                String remoteConnectionURL = connection.getConnectionURL( remoteConnectionDriver, remoteConnectionHost, remoteDatabase, remoteConnectionUser, remoteConnectionPassword);
                        
                if(params != null) {
                    if(tbl_wrk != null) {
                        HttpServletRequest request = (HttpServletRequest)requestParam;
                        long maxRows = 0;

                        //
                        // create remote control
                        //
                        String remoteControlId = liquid.controlId+"@remote";
                        String parentControlId = null;
                        String sourceToken = null;
                        String sRequest = "{ \"connectionDriver\":\""+utility.base64Encode(remoteConnectionDriver)+"\", \"connectionURL\":\""+utility.base64Encode(remoteConnectionURL)+"\" }";

                        // clona the control's cfg
                        JSONObject remote_liquid_json = new JSONObject( liquid.tableJson.toString() );

                        // add remote definition
                        utility.mergeJsonObject(remote_liquid_json, new JSONObject(sRequest));

                        // creating remote controi workspace 
                        workspace.get_table_control(request,remoteControlId, remote_liquid_json.toString());

                        // get remote workspace
                        workspace remote_liquid = workspace.get_tbl_manager_workspace(remoteControlId);
                                
                        // get id list from params
                        String ids = workspace.getSelection(liquid.controlId, (String)params);
                        String [] idsList = workspace.split(ids);
                        for(int iid=0; iid<idsList.length; iid++) {
                            String keyColumn = liquid.tableJson.getString("primaryKey");
                            String key = idsList[iid];
                        
                            // load bean from remote control
                            ArrayList<Object> beans = bean.load_beans( request, remoteControlId, remoteDatabase+"."+remoteSchema +"."+remoteTable, "*", keyColumn, key, maxRows );
                        
                            if(beans != null) {
                                for(Object bean : beans) {
                                    try {

                                        // inserting remote row in local control
                                        String insertResult = db.insert( bean, liquid );

                                        // Loading foreign tables 1° livel
                                        Object [] loadBeasnResult = null;

                                        // Array foreign tables di partenza
                                        JSONArray foreignTablesJson = null;
                                        try { foreignTablesJson = liquid.tableJson.getJSONArray("foreignTables"); } catch(Exception e) {}

                                        for (int ift=0; ift<foreignTablesJson.length(); ift++) {
                                            JSONObject foreignTableJson = foreignTablesJson.getJSONObject(ift);
                                            if(foreignTableJson != null) {
                                                String table = foreignTableJson.getString("table");
                                                if(table != null && !table.isEmpty()) {
                                                    
                                                    // load bean of foreign table
                                                    loadBeasnResult = com.liquid.bean.load_bean( bean, table, maxRows, request );

                                                    ArrayList<Object> beans_lev1 = (ArrayList<Object>)loadBeasnResult[0];
                                                    for(Object bean_lev1 : beans_lev1) {

                                                        // ES.: Aggiornamento riga nel DB
                                                        insertResult = db.insert( bean, remote_liquid );

                                                        // Caricamento foreign tables 2° livello per tutte le righe di table
                                                        String table_2lev = null;
                                                        if(table_2lev != null && !table_2lev.isEmpty()) {
                                                            ArrayList<Object> beans_lev2 = (ArrayList<Object>) utility.get(bean, table_2lev);
                                                            if(beans_lev2 != null) {
                                                                for(Object bean_lev2 : beans_lev2) {
                                                                    // loadBeasnResult = bean.load_bean( beanQD, table, maxRows );
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } catch (Throwable ex) {
                                        Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }        
        
        
        // result += ",\"details\":["+updateResults+"]";        
        result += "}";        

        return result;
    }
    
}
