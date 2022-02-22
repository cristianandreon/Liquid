/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author root
 */
public class ColumnsManager {
    
    static public String get_table_column_windowx_json(HttpServletRequest request, String operation, JspWriter out) {
        String out_string = "", out_values_string = "", out_codes_string = "", error = "";
        long cRow = 0, nRows = 0, addedRow = 0;
        JSONObject requestJson = null;
        String controlId = null, tblWrk = null, columnsResolved = null;            

        try {

            try {
                controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }            
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }  
            try {
                columnsResolved = request.getParameter("columnsResolved");
            } catch (Exception e) {
            }            

            String sRequest = workspace.get_request_content(request);
            try {
                if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
            } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }

            
            
            String table = "";
            String view = "";
            String database = "";
            String schema = "";
            String primaryKey = "id";
            String dbPrimaryKey = "id";
            workspace tbl_wrk = workspace.get_tbl_manager_workspace( tblWrk != null ? tblWrk : controlId );
            String tblWrkDesc = (tblWrk!=null?tblWrk+".":"")+(controlId!=null?controlId:"");
            boolean isOracle = false;
            boolean isMySQL = false;
            boolean isPostgres = false;
            
            if(tbl_wrk != null && tbl_wrk.tableJson!=null) {
                
                try { database = tbl_wrk.tableJson.getString("database"); } catch (Exception e) {  }
                try { schema = tbl_wrk.tableJson.getString("schema"); } catch (Exception e) {  }
                try { table = tbl_wrk.tableJson.getString("table"); } catch (Exception e) {  }
                try { view = tbl_wrk.tableJson.getString("view"); } catch (Exception e) {  }
                JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                try { primaryKey = tbl_wrk.tableJson.getString("primaryKey"); } catch (Exception e) {  }

                if(requestJson != null) {
                    if(requestJson.has("columns")) {
                        try { cols = requestJson.getJSONArray("columns"); } catch (Exception e) {  };
                    }
                }
                        
                String rowData = "[";
                long nRecs = 0;
                for(int ic=0; ic<cols.length(); ic++) {
                    boolean visible = true, readonly = false, link = false, autocomplete = false, foreignEdit = false, required = false;
                    String field = "", name = "", label = "", type = "", foreignTable = "", foreignColumn = "", column = "", lookup = "", options = "", editor = "", asType="";
                    int width = 0;
                    JSONObject col = null, optionsJson = null, editorJson = null, lookupJson = null;
                    try { col = cols.getJSONObject(ic); } catch (Exception e) {  }
                    try { field = col.getString("field"); } catch (Exception e) {  }
                    try { name = col.getString("name"); } catch (Exception e) {  }
                    try { label= col.getString("label"); } catch (Exception e) {  }
                    try { type = col.getString("type"); } catch (Exception e) {  }
                    try { width = col.getInt("width"); } catch (Exception e) {  }
                    try { visible = col.getBoolean("visible"); } catch (Exception e) {  }
                    try { readonly = col.getBoolean("readonly"); } catch (Exception e) {  }
                    try { required = col.getBoolean("required"); } catch (Exception e) {  }
                    try { link = col.getBoolean("link"); } catch (Exception e) {  }
                    try { foreignTable = col.getString("foreignTable"); } catch (Exception e) {  }
                    try { foreignColumn = col.getString("foreignColumn"); } catch (Exception e) {  }
                    try { column = col.getString("column"); } catch (Exception e) {  }
                    try { foreignEdit = col.getBoolean("foreignEdit"); } catch (Exception e) {  }
                    try { autocomplete = col.getBoolean("autocomplete"); } catch (Exception e) {  }
                    try { lookup = col.getString("lookup"); } catch (Exception e) {  }
                    try { lookupJson = col.getJSONObject("lookup"); } catch (Exception e) {  }
                    try { optionsJson = col.getJSONObject("options"); } catch (Exception e) {  }
                    try { options  = col.getString("options"); } catch (Exception e) {  }
                    try { editorJson = col.getJSONObject("editor"); } catch (Exception e) {  }
                    try { editor = col.getString("editor"); } catch (Exception e) {  }
                    try { asType = col.getString("asType"); } catch (Exception e) {  }

                    int cField = 1;
                    rowData += (nRecs>0?",":"")+"{";
                    rowData +=  "\""+(cField++)+"\":\""+field+"\"";
                    rowData += ",\""+(cField++)+"\":\""+name+"\"";
                    rowData += ",\""+(cField++)+"\":\""+type+"\"";
                    rowData += ",\""+(cField++)+"\":\""+label+"\"";
                    rowData += ",\""+(cField++)+"\":"+width;
                    rowData += ",\""+(cField++)+"\":"+visible;
                    rowData += ",\""+(cField++)+"\":"+readonly;
                    rowData += ",\""+(cField++)+"\":"+link;
                    rowData += ",\""+(cField++)+"\":\""+foreignTable+"\"";
                    rowData += ",\""+(cField++)+"\":\""+foreignColumn+"\"";
                    rowData += ",\""+(cField++)+"\":\""+column+"\"";
                    rowData += ",\""+(cField++)+"\":\""+foreignEdit+"\"";
                    rowData += ",\""+(cField++)+"\":"+autocomplete+"";
                    rowData += ",\""+(cField++)+"\":\""+(lookupJson != null ? lookupJson.toString().replace("\"", "\\\"") : lookup != null ? lookup.replace("\"", "\\\"") : "" )+"\"";
                    rowData += ",\""+(cField++)+"\":\""+(optionsJson != null ? optionsJson.toString().replace("\"", "\\\"") : options != null ? options.replace("\"", "\\\"") : "" )+"\"";
                    rowData += ",\""+(cField++)+"\":\""+(editorJson != null ? editorJson.toString().replace("\"", "\\\"") : editor != null ? editor.replace("\"", "\\\"") : "" )+"\"";
                    rowData += ",\""+(cField++)+"\":"+required;
                    rowData += ",\""+(cField++)+"\":\""+asType+"\"";
                    rowData += "}";
                    nRecs++;
                }                
                rowData+="]";
                
                if("getColumnsManager".equalsIgnoreCase(operation)) {
                    int cField = 1;
                    out_string += "{"
                    +" \"schema\":\""+schema+"\""
                    + ",\"table\":\""+table+"\""
                    +",\"primaryKey\":\"NAME\""
                    +",\"columns\":["
                    +" { \"name\":\"FIELD\", \"label\":\"Field\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"readonly\":true, \"pinned\":\"left\", \"lockPinned\":true }"
                    +",{ \"name\":\"NAME\", \"label\":\"Name\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"150\", \"readonly\":false, \"pinned\":\"left\", \"lockPinned\":true, \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.table\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"TYPE\", \"label\":\"Type\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"readonly\":true }"
                    +",{ \"name\":\"LABEL\", \"label\":\"Label\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\" }"
                    +",{ \"name\":\"WIDTH\", \"label\":\"Width\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\" }"
                    +",{ \"name\":\"VISIBLE\", \"label\":\"Visible\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"editor\":{ \"type\":\"values\", \"values\":[\"true\",\"false\"] } }"
                    +",{ \"name\":\"READONLY\", \"label\":\"Readonly\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"LINK\", \"label\":\"Link\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"readonly\":true, \"tooltip\":\"true if linked to a file (in xForm control)\", \"editor\":{ \"type\":\"values\", \"values\":[\"true\",\"false\"] } }"
                    +",{ \"name\":\"FOREIGN_TABLE\", \"label\":\"Foreign table\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":{\"type\":\"allTables\",\"table\":\"*\",\"column\":\"TABLE\", \"cache\":false } }"
                    +",{ \"name\":\"FOREIGN_COLUMN\", \"label\":\"Foreign column\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.selection.FOREIGN_TABLE\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"COLUMN\", \"label\":\"Column\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.table\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"FOREIGN_EDIT\", \"label\":\"Foreign Edit\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"AUTO_COMPLETE\", \"label\":\"Autocomplete\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"LOOKUP\", \"label\":\"Lookup\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":\"systemLookup\" }"
                    +",{ \"name\":\"OPTIONS\", \"label\":\"Options\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"200\", \"editor\":\"systemOptions\" }"
                    +",{ \"name\":\"EDITOR\", \"label\":\"Editor\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"200\", \"editor\":\"systemEditors\" }"
                    +",{ \"name\":\"REQUIRED\", \"label\":\"Required\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"70\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"ASTYPE\", \"label\":\"As type\", \"field\":\""+String.valueOf(cField++)+"\", \"width\":\"100\", \"editor\":\"values\", \"editorValues\":[\"string\",\"date\",\"datetime\"] }"
                    +"]"
                    +",\"mode\":\"popup\""
                    +",\"modless\":true"
                    +",\"editable\":true"
                    +",\"isSystem\":true"
                    +",\"cache\":false"
                    +",\"resize\":\"both\""
                    +",\"left\":\"center\""
                    +",\"top\":\"center\""
                    +",\"autoSizeColumns\":false"
                    +",\"autoLoad\":true"
                    +",\"width\":\"700\""
                    +",\"height\":\"500\""
                    +",\"caption\":\"Columns manager\""
                    +",\"owner\":\"com.liquid.event\""
                    +",\"navVisible\":false"
                    +",\"rowSelection\":\"single\""
                    +",\"headerCheckboxSelection\":false"
                    +",\"rowMultiSelectWithClick\":false"
                    +",\"resetSelectionOnRowChange\":false"
                    +",\"commands\":[ "
                    + " {\"name\":\"insert\", \"img\":\"add.png\", \"size\":20, \"text\":\"Aggiungi\", \"labels\":[\"Salva\"], \"server\":\"\", \"rollback\":\"Annulla\", \"rollbackImg\":\"cancel.png\" }"
                    + ",{\"name\":\"delete\", \"img\":\"delete.png\", \"size\":20, \"text\":\"Cancella\", \"labels\":[\"Conferma\"], \"server\":\"\", \"rollback\":\"Annulla\", \"rollbackImg\":\"cancel.png\" }"
                    + "]"                            
                    +",\"actions\":["
                    +"{\"name\":\"cancel\", \"img\":\"cancel.png\", \"size\":20, \"text\":\"Annulla\", \"client\":\"Liquid.close\"  }"
                    +",{\"name\":\"ok\", \"img\":\"add.png\", \"size\":20, \"text\":\"OK\", \"client\":\"Liquid.close\"  }"
                    +"]"
                    +",\"rowData\":"
                    +rowData
                    +"}"
                    ;
                    return out_string;
                } else if("xxx".equalsIgnoreCase(operation)) {
                    return "";
                }                    
                return null;
            }
                
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("get_table_column_windowx_json() ["+controlId+"] Error:" + e.getLocalizedMessage());

        } finally {
        }
            
        return "";
    }
    
    
    // valida e ritorna le colonne con i dati da aggiornare a carico del client che ri-registra il controllo nel server
    static public String set_table_column_windowx_json(HttpServletRequest request, String operation, JspWriter out) {
        String error = "";
        long nRows = 0;
        JSONObject requestJson = null;
        JSONArray addedColumnsJson = new JSONArray();
        JSONArray updatedColumnsJson = new JSONArray();
        JSONArray deletedColumnsJson = new JSONArray();
        String controlId = null, tblWrk = null;
        ArrayList<String> infos = new ArrayList<String>();
            

        try {

            try {
                controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {}            
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {}  

            String sRequest = workspace.get_request_content(request);
            try { 
                if(sRequest != null && !sRequest.isEmpty()) requestJson = new JSONObject(sRequest); 
            } catch (Exception e) { System.err.println(e.getLocalizedMessage()); }

            
            
            String table = "";
            String view = "";
            String database = "";
            String schema = "";
            String primaryKey = "id";
            String dbPrimaryKey = "id";
            workspace tbl_wrk = workspace.get_tbl_manager_workspace( tblWrk != null ? tblWrk : controlId );
            String tblWrkDesc = (tblWrk!=null?tblWrk+".":"")+(controlId!=null?controlId:"");
            boolean isOracle = false;
            boolean isMySQL = false;
            boolean isPostgres = false;
            
            if(tbl_wrk != null && tbl_wrk.tableJson!=null) {
                
                try { database = tbl_wrk.tableJson.getString("database"); } catch (Exception e) {  }
                try { schema = tbl_wrk.tableJson.getString("schema"); } catch (Exception e) {  }
                try { table = tbl_wrk.tableJson.getString("table"); } catch (Exception e) {  }
                try { view = tbl_wrk.tableJson.getString("view"); } catch (Exception e) {  }
                JSONArray cols = tbl_wrk.tableJson.getJSONArray("columns");
                try { primaryKey = tbl_wrk.tableJson.getString("primaryKey"); } catch (Exception e) {  }

                for(int ic=0; ic<cols.length(); ic++) {
                    cols.getJSONObject(ic).put("runtimeDeleted", true);
                }
                
                JSONArray dataSet = requestJson.getJSONArray("dataSet");
                for(int i=0; i<dataSet.length(); i++) {
                    JSONObject fieldSet = dataSet.getJSONObject(i);
                    String fieldValue = fieldSet.getString("1");
                    String nameValue = fieldSet.getString("2");
                    if(nameValue != null && !nameValue.isEmpty()) {
                        boolean bColumnFound = false;
                        for(int ic=0; ic<cols.length(); ic++) {
                            JSONObject col = cols.getJSONObject(ic);
                            JSONObject newColumn = new JSONObject();
                            if(nameValue.equalsIgnoreCase(col.getString("name"))) {
                                col.put("runtimeDeleted", false);
                                bColumnFound = true;
                                if(compare_column_properties(controlId, fieldSet, col, newColumn, infos, error)) {
                                    newColumn.put("name", nameValue);
                                    updatedColumnsJson.put(newColumn);
                                }
                                break;
                            }
                        }
                        if(!bColumnFound) { // nuova colonna
                            JSONObject col = new JSONObject();
                            JSONObject newColumn = new JSONObject();
                            if(compare_column_properties(controlId, fieldSet, col, newColumn, infos, error)) {
                                newColumn.put("name", nameValue);
                            }
                            addedColumnsJson.put(newColumn);
                        }
                    }
                }
                for(int ic=0; ic<cols.length(); ic++) {
                    JSONObject col = cols.getJSONObject(ic);
                    if(col.getBoolean("runtimeDeleted")) {
                        deletedColumnsJson.put(col);
                    }
                }
            }
            return ""
                    + "{\"addedColumns\":"+addedColumnsJson.toString() 
                    + ",\"updatedColumns\":"+updatedColumnsJson.toString() 
                    + ",\"deletedColumns\":"+deletedColumnsJson.toString() 
                    + ",\"log\":["
                    + workspace.arrayToString(infos.toArray(), "\"", "\"", ",") 
                    + "]}";
                        
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("set_table_column_windowx_json() ["+controlId+"] Error:" + e.getLocalizedMessage());

        } finally {
        }            
        return "";
    }

    static private boolean compare_column_properties ( String controlId, JSONObject fieldSet, JSONObject col, JSONObject newColumn, ArrayList<String>infos, String error ) {
        boolean bColumnChanged = false;
        try {
            int cField = 2;
            String nameValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "name", nameValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField = 4;
            String labelValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "label", labelValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            int widthValue = fieldSet.getInt(String.valueOf(cField));
            if(update_table_json_column_field(col, "width", widthValue, newColumn, 0, infos)) {
                bColumnChanged = true;
            }
            cField++;
            boolean visibleValue = fieldSet.getBoolean(String.valueOf(cField));
            if(update_table_json_column_field(col, "visible", visibleValue, newColumn, true, infos)) {
                bColumnChanged = true;
            }
            cField++;
            boolean readonlyValue = fieldSet.getBoolean(String.valueOf(cField));
            if(update_table_json_column_field(col, "readonly", readonlyValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            cField++;
            readonlyValue = fieldSet.getBoolean(String.valueOf(cField));
            if(update_table_json_column_field(col, "link", readonlyValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            cField++;
            String foreignTableValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "foreignTable", foreignTableValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            String foreignColumnValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "foreignColumn", foreignColumnValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            String columnValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "column", columnValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            boolean foreignEditValue = fieldSet.getBoolean(String.valueOf(cField));
            if(update_table_json_column_field(col, "foreignEdit", foreignEditValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            cField++;
            boolean autocompleteValue = fieldSet.getBoolean(String.valueOf(cField));
            if(update_table_json_column_field(col, "autocomplete", autocompleteValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            cField++;
            String lookupValue = fieldSet.getString(String.valueOf(cField));
            if(update_table_json_column_field(col, "lookup", lookupValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            String sOptionsValue = fieldSet.getString(String.valueOf(cField));
            JSONObject jOptionsValue = new JSONObject(sOptionsValue != null && !sOptionsValue.isEmpty());
            if(update_table_json_column_field(col, "options", jOptionsValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            cField++;
            String sEditorValue = fieldSet.getString(String.valueOf(cField));
            JSONObject jEditorValue = new JSONObject(sEditorValue != null && !sEditorValue.isEmpty());
            if(update_table_json_column_field(col, "editor", jEditorValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println("set_table_column_windowx_json() ["+controlId+"] Error:" + e.getLocalizedMessage());
        }
        
        return bColumnChanged;
    }
    
    
    static private boolean update_table_json_column_field ( JSONObject col, String key, Object newValue, JSONObject outColumn, Object defaultValue, ArrayList<String>infos ) {
        boolean retVal = false;
        if(col != null) {
            try {
                if(!col.has(key)) {
                    // aggiunta proprietà se diversa dal default
                    if(newValue != null) {
                        if(newValue instanceof String) {
                            if(defaultValue != null)
                                if(((String)newValue).equals(defaultValue))
                                    return false;
                        } else if(newValue instanceof Float || newValue instanceof Double) {
                            if(defaultValue != null)
                                if(((Float)newValue).equals(defaultValue))
                                    return false;
                        } else if(newValue instanceof Integer) {
                            if(defaultValue != null)
                                if(((Integer)newValue).equals(defaultValue))
                                    return false;
                        } else if(newValue instanceof Boolean) {
                            if(defaultValue != null)
                                if(((Boolean)newValue).equals(defaultValue))
                                    return false;
                        } else if(newValue instanceof JSONObject) {
                            if(defaultValue != null) {
                                String sDefaultValue = (String)defaultValue;
                                sDefaultValue = sDefaultValue != null && !sDefaultValue.isEmpty() ? sDefaultValue : "{}";
                                if(((JSONObject)newValue).toString().equals(sDefaultValue))
                                    return false;
                            }
                        } else if(newValue instanceof JSONArray) {
                            if(defaultValue != null) {
                                String sDefaultValue = (String)defaultValue;
                                sDefaultValue = sDefaultValue != null && !sDefaultValue.isEmpty() ? sDefaultValue : "[]";
                                if(((JSONArray)newValue).toString().equals(sDefaultValue))
                                    return false;
                            }
                        }
                        if(outColumn != null) outColumn.put(key, newValue);
                        retVal = true;
                    }
                } else {
                    if(newValue instanceof String) {
                        if(!newValue.equals(col.getString(key))) {
                            if(outColumn != null) outColumn.put(key, newValue);
                            infos.add(col.getString("name")+":"+key+" updated");
                            retVal = true;
                        }
                    } else if(newValue instanceof Float || newValue instanceof Double) {
                        if( Math.abs((double)newValue - col.getDouble(key))>0.001f) {
                            if(outColumn != null) outColumn.put(key, (double)newValue);
                            infos.add(col.getString("name")+":"+key+" updated");
                            retVal = true;
                        }
                    } else if(newValue instanceof Integer) {
                        if((int)newValue != (col.getInt(key))) {
                            if(outColumn != null) outColumn.put(key, (int)newValue);
                            infos.add(col.getString("name")+":"+key+" updated");
                            retVal = true;
                        }
                    } else if(newValue instanceof Boolean) {
                        if((boolean)newValue != (col.getBoolean(key))) {
                            if(outColumn != null) outColumn.put(key, (boolean)newValue);
                            infos.add(col.getString("name")+":"+key+" updated");
                            retVal = true;
                        }
                    } else if(newValue instanceof JSONObject) {
                        if(!((JSONObject)newValue).equals(col.getJSONObject(key))) {
                            if(outColumn != null) outColumn.put(key, (JSONObject)newValue);
                            infos.add(col.getString("name")+":"+key+" updated");
                            retVal = true;
                        }
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return retVal;
    }
    
}
