package com.liquid;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.Base64;
import javax.servlet.ServletContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import javax.xml.bind.DatatypeConverter;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import static org.apache.commons.codec.binary.Base64.decodeBase64;
import static org.apache.commons.codec.binary.Base64.encodeBase64;



public class utility {
    
    static public String base64Encode(String data) {
        try {
            return base64Encode(data.getBytes());
        } catch(Throwable th) {
            System.err.println("Error:"+th.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
        }
        return null;
    }
    static public String base64Encode(byte [] data) {
        try {
            return DatatypeConverter.printBase64Binary(data);
        } catch(Throwable th) {
            try {
                return new String(Base64.getEncoder().encode(data));
                // throw new Throwable();  // x java 7
            } catch(Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.encodeBase64(data));
                } catch(Throwable th3) {
                    System.err.println("Error:"+th3.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
                }
            }
        }
        return null;
    }
    static public String base64Decode(String data) {
        try {
            return base64Decode(data.getBytes());
        } catch(Throwable th) {
            System.err.println("Error:"+th.getLocalizedMessage()+"Please try adding apache commons-codes.jar to your project");
        }
        return null;
    }
    static public String base64Decode(byte [] data) {
        try {
            return new String(DatatypeConverter.parseBase64Binary(new String(data)));
        } catch(Throwable th) {            
            try {
                return new String(Base64.getDecoder().decode(data));
                // throw new Throwable(); // x java 7
            } catch(Throwable th2) {
                try {
                    return new String(org.apache.commons.codec.binary.Base64.decodeBase64(data));
                } catch(Throwable th3) {
                    System.err.println("Error:"+th3.getLocalizedMessage());
                }
            }
        }
        return null;
    }

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
                    boolean visible = true, readonly = false, autocomplete = false, foreignEdit = false;
                    String field = "", name = "", label = "", type = "", foreignTable = "", foreignColumn = "", column = "", lookup = "", options = "", editor = "";
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
                    
                    rowData += (nRecs>0?",":"")+"{";
                    rowData +=  "\""+(1)+"\":\""+field+"\"";
                    rowData += ",\""+(2)+"\":\""+name+"\"";
                    rowData += ",\""+(3)+"\":\""+type+"\"";
                    rowData += ",\""+(4)+"\":\""+label+"\"";
                    rowData += ",\""+(5)+"\":"+width;
                    rowData += ",\""+(6)+"\":"+visible;
                    rowData += ",\""+(7)+"\":"+readonly;
                    rowData += ",\""+(8)+"\":\""+foreignTable+"\"";
                    rowData += ",\""+(9)+"\":\""+foreignColumn+"\"";
                    rowData += ",\""+(10)+"\":\""+column+"\"";
                    rowData += ",\""+(11)+"\":\""+foreignEdit+"\"";
                    rowData += ",\""+(12)+"\":"+autocomplete+"";
                    rowData += ",\""+(13)+"\":\""+(lookupJson != null ? lookupJson.toString() : lookup)+"\"";
                    rowData += ",\""+(14)+"\":\""+(optionsJson != null ? optionsJson.toString() : options)+"\"";
                    rowData += ",\""+(15)+"\":\""+(editorJson != null ? editorJson.toString() : editor)+"\"";
                    rowData += "}";
                    nRecs++;
                }                
                rowData+="]";
                
                if("getColumnsManager".equalsIgnoreCase(operation)) {
                    out_string += "{"
                    +" \"schema\":\""+schema+"\""
                    + ",\"table\":\""+table+"\""
                    +",\"primaryKey\":\"NAME\""
                    +",\"columns\":["
                    +" { \"name\":\"FIELD\", \"label\":\"Field\", \"field\":\"1\", \"width\":\"50\", \"readonly\":true, \"pinned\":\"left\", \"lockPinned\":true }"
                    +",{ \"name\":\"NAME\", \"label\":\"Name\", \"field\":\"2\", \"width\":\"150\", \"readonly\":false, \"pinned\":\"left\", \"lockPinned\":true, \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.table\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"TYPE\", \"label\":\"Type\", \"field\":\"3\", \"width\":\"50\", \"readonly\":true }"
                    +",{ \"name\":\"LABEL\", \"label\":\"Label\", \"field\":\"4\", \"width\":\"100\" }"
                    +",{ \"name\":\"WIDTH\", \"label\":\"Width\", \"field\":\"5\", \"width\":\"50\" }"
                    +",{ \"name\":\"VISIBLE\", \"label\":\"Visible\", \"field\":\"6\", \"width\":\"50\", \"editor\":{ \"type\":\"values\", \"values\":[\"true\",\"false\"] } }"
                    +",{ \"name\":\"READONLY\", \"label\":\"Readonly\", \"field\":\"7\", \"width\":\"50\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"FOREIGN_TABLE\", \"label\":\"Foreign table\", \"field\":\"8\", \"width\":\"100\", \"editor\":{\"type\":\"allTables\",\"table\":\"*\",\"column\":\"TABLE\", \"cache\":false } }"
                    +",{ \"name\":\"FOREIGN_COLUMN\", \"label\":\"Foreign column\", \"field\":\"9\", \"width\":\"100\", \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.selection.FOREIGN_TABLE\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"COLUMN\", \"label\":\"Column\", \"field\":\"10\", \"width\":\"100\", \"editor\":{\"type\":\"allColumns\",\"table\":\"@this.table\",\"column\":\"COLUMN\", \"cache\":false } }"
                    +",{ \"name\":\"FOREIGN_EDIT\", \"label\":\"Foreign Edit\", \"field\":\"11\", \"width\":\"100\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"AUTO_COMPLETE\", \"label\":\"Autocomplete\", \"field\":\"12\", \"width\":\"50\", \"editor\":\"values\", \"editorValues\":[\"true\",\"false\"] }"
                    +",{ \"name\":\"LOOKUP\", \"label\":\"Lookup\", \"field\":\"13\", \"width\":\"100\", \"editor\":\"systemLookup\" }"
                    +",{ \"name\":\"OPTIONS\", \"label\":\"Options\", \"field\":\"14\", \"width\":\"200\", \"editor\":\"systemOptions\" }"
                    +",{ \"name\":\"EDITOR\", \"label\":\"Editor\", \"field\":\"15\", \"width\":\"200\", \"editor\":\"systemEditors\" }"
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
            String nameValue = fieldSet.getString("2");
            if(update_table_json_column_field(col, "name", nameValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            String labelValue = fieldSet.getString("4");
            if(update_table_json_column_field(col, "label", labelValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            int widthValue = fieldSet.getInt("5");
            if(update_table_json_column_field(col, "width", widthValue, newColumn, 0, infos)) {
                bColumnChanged = true;
            }
            boolean visibleValue = fieldSet.getBoolean("6");
            if(update_table_json_column_field(col, "visible", visibleValue, newColumn, true, infos)) {
                bColumnChanged = true;
            }
            boolean readonlyValue = fieldSet.getBoolean("7");
            if(update_table_json_column_field(col, "readonly", readonlyValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            String foreignTableValue = fieldSet.getString("8");
            if(update_table_json_column_field(col, "foreignTable", foreignTableValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            String foreignColumnValue = fieldSet.getString("9");
            if(update_table_json_column_field(col, "foreignColumn", foreignColumnValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            String columnValue = fieldSet.getString("10");
            if(update_table_json_column_field(col, "column", columnValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            boolean foreignEditValue = fieldSet.getBoolean("11");
            if(update_table_json_column_field(col, "foreignEdit", foreignEditValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            boolean autocompleteValue = fieldSet.getBoolean("12");
            if(update_table_json_column_field(col, "autocomplete", autocompleteValue, newColumn, false, infos)) {
                bColumnChanged = true;
            }
            String lookupValue = fieldSet.getString("13");
            if(update_table_json_column_field(col, "lookup", lookupValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            String sOptionsValue = fieldSet.getString("14");
            JSONObject jOptionsValue = new JSONObject(sOptionsValue != null && !sOptionsValue.isEmpty());
            if(update_table_json_column_field(col, "options", jOptionsValue, newColumn, "", infos)) {
                bColumnChanged = true;
            }
            String sEditorValue = fieldSet.getString("15");
            JSONObject jEditorValue = new JSONObject(sEditorValue != null && !sOptionsValue.isEmpty());
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
                            if(defaultValue != null)
                                if(((JSONArray)newValue).equals(new JSONObject(defaultValue)))
                                    return false;
                        } else if(newValue instanceof JSONArray) {
                            if(defaultValue != null)
                                if(((JSONArray)newValue).equals(new JSONArray(defaultValue)))
                                    return false;
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
    
    static public ArrayList<String> get_dms_keys ( workspace tblWrk, String params ) {
        ArrayList<String> keyList = null;
        try {
            if(tblWrk != null) {
                JSONObject paramsJson = new JSONObject((String)params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                if(paramJson != null) {
                    JSONArray ids = paramJson.getJSONArray("ids");
                    String database = null, schema = null, table = null, name = null;
                    try { database = paramJson.getString("database"); } catch(Exception e) {}
                    try { schema = paramJson.getString("schema"); } catch(Exception e) {}
                    try { table = paramJson.getString("table"); } catch(Exception e) {}
                    try { name = paramJson.getString("name"); } catch(Exception e) {}
                    // { database:liquid.tableJson.database, schema:liquid.tableJson.schema, table:liquid.tableJson.table, ids:nodeKeys };
                    if(database==null || database.isEmpty()) try { database = tblWrk.tableJson.getString("database");  } catch(Exception e) {}
                    if(schema==null || schema.isEmpty()) try { schema = tblWrk.tableJson.getString("schema");  } catch(Exception e) {}
                    if(table==null || table.isEmpty()) try { table = tblWrk.tableJson.getString("table");  } catch(Exception e) {}

                    if(database==null || database.isEmpty()) database = tblWrk.defaultDatabase;
                    if(schema==null || schema.isEmpty()) schema = "";
                    if(table==null || table.isEmpty()) table = "";
                    if(name==null || name.isEmpty()) try { name = "default"; } catch(Exception e) {}

                    keyList = new ArrayList<String>();
                    String id;
                    for(int i=0; i<ids.length(); i++) {
                        id = ids.getString(i);
                        keyList.add(database+"."+schema+"."+table+"."+name+"."+id);
                    }
                }
            }
        } catch (JSONException ex) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
        }
        return keyList;
    }
 



    /**
     * <h3>Search for the property in the bean</h3>
     * <p>
     * This method return a Field of the property from a bean
     *
     * @param  bean  the bean (Object)
     * @param  property the Field of the property to get (Field)
     * @param  exaclyMatch if false strip by $ and check only the parts defined in the param property (boolean)
     *                      ex.: searching for 'foreigntTable' the property named 'foreigntTable$foreignColumn$column' is returned as found
     * @see         utility
     */
    static public Field searchProperty( Object bean, String property, boolean exaclyMatch, boolean onlyObject ) {
        if(bean != null) {
            String clasName = bean.getClass().getName();
            if(clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?>list = (List<?>)bean;
                if(list.size()>0) bean = (Object)list.get(0);
            }
            String [] searchParts = property.split("\\$");
            Field[] fields = bean.getClass().getDeclaredFields();
            Field fieldFound = null;
            int propLen = property.length();
            for(int istp=0; istp<2; istp++) {
                int bestMatch = 999999999;
                for(Field f : fields) {
                    String fieldName = f.getName();
                    if(!exaclyMatch) {
                        String [] colParts = fieldName.split("\\$");
                        if(colParts.length > 1) {
                            fieldName = "";
                            for(int ip=0; ip<searchParts.length && ip<colParts.length; ip++) {
                                fieldName += (fieldName.length()>0?"$":"") + colParts[ip];
                            }
                        }
                    }
                    if( istp==0 ? fieldName.equals(property) : fieldName.toUpperCase().equalsIgnoreCase(property.toUpperCase()) ) {
                        if(!exaclyMatch) {                        
                            int dSize = f.getName().length() - propLen;
                            if(dSize <= bestMatch) {
                                if(onlyObject) {
                                    if(f.getType().equals(Object.class)) {
                                        bestMatch = dSize;
                                        fieldFound = f;                                    
                                    }
                                } else {
                                    bestMatch = dSize;
                                    fieldFound = f;
                                }
                            }
                        } else {
                            if(onlyObject) {
                                if(f.getType().equals(Object.class))
                                    return f;
                            } else {
                                return f;
                            }
                        }
                    }
                }
                if(fieldFound != null)
                    return fieldFound;
            }
        }
        return null;
    }
            

    
    // JAVA MERDA : se la libreria non è presente ANCHE sul progetto principale si solleva la throwable
    
    /*
    APACHE MERDA : devo tirarmi dentro un pianete per usare un solo metodo ...
    static public boolean set(Object bean, String propName, Object propValue) throws IllegalAccessException, InvocationTargetException {
        try {
            BeanUtils.setProperty(bean, propName, propValue);
            return true;
        } catch (Throwable e) {
            System.err.println("ERROR : com.liquid.utility.set() " + e.getLocalizedMessage()+" .. make sure to include commons-beanutils-1.9.4.jar and commons-logging-1.2.jar in your project");
        }
        return false;
    }
    static public Object get(Object bean, String propName) throws IllegalAccessException, InvocationTargetException, NoSuchMethodException {
        try {
            return (Object)BeanUtils.getProperty(bean, propName);
        } catch (Throwable e) {
            System.err.println("ERROR: com.liquid.utility.get() " + e.getLocalizedMessage()+" .. make sure to include commons-beanutils-1.9.4.jar and commons-logging-1.2.jar in your project");
        }
        return null;
    }
    */
    
    /**
     * <h3>Set the property of a bean</h3>
     * <p>
     * This method set a property from a bean
     *
     * @param  bean  the bean (Object)
     * @param  property the name of the property to get (String)

     * @see         utility
     */
    static public void set(Object bean, String property, Object value) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {        
        Field field = bean.getClass().getDeclaredField(property);
        if(field==null) {
            // Ricerca nei beans per similitudine
            field = searchProperty(bean, property, false, false);
        }
        // debug
        if("bool".equalsIgnoreCase(property)) {
            int lb = 1;
        }
        if(field != null) {
            field.setAccessible(true);
            Class<?> propType = field.getType();
            try {
                if(propType.equals(Boolean.class) || propType.equals(boolean.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty() 
                                || "0".equalsIgnoreCase((String)value) || "false".equalsIgnoreCase((String)value) 
                                || "N".equalsIgnoreCase((String)value) || "no".equalsIgnoreCase((String)value) 
                                || "zero".equalsIgnoreCase((String)value)|| "empty".equalsIgnoreCase((String)value))
                            if(propType.equals(Boolean.class)) {
                                field.set(bean, new Boolean(false));
                            } else {
                                field.set(bean, false);
                            }
                        else
                            if(propType.equals(Boolean.class)) {
                                field.set(bean, new Boolean(true));
                            } else {
                                field.set(bean, true);
                            }
                    } else if(value instanceof Object) {
                        field.set(bean, (Boolean)value);
                    }
                } else if(propType.equals(Integer.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Integer(0));
                        else
                            field.set(bean, Integer.parseInt((String) value));
                    } else if(value instanceof Object) {
                        field.set(bean, (Integer)value);
                    }
                } else if(propType.equals(Long.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Long(0));
                        else
                            field.set(bean, Long.parseLong((String) value));
                    } else if(value instanceof Object) {
                        field.set(bean, (Long)value);
                    }
                } else if(propType.equals(Float.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Float(0.0f));
                        else
                            field.set(bean, Float.valueOf(((String) value).replaceAll(",", ".")));
                    } else if(value instanceof Object) {
                        field.set(bean, (Float)value);
                    }
                } else if(propType.equals(java.lang.Double.class)) {
                    if(value instanceof String) {
                        if(value == null || ((String) value).isEmpty())
                            field.set(bean, new Double(0.0));
                        else
                            field.set(bean, Double.valueOf(((String)value).replaceAll(",", ".")));
                    } else if(value instanceof Object) {
                        field.set(bean, (Double)value);
                    }
                } else if(propType.equals(java.lang.String.class)) {
                    if(value instanceof String) {
                        field.set(bean, (String)value);
                    } else if(value instanceof Object) {
                        field.set(bean, String.valueOf(value));
                    }
                } else if(propType.equals(java.util.Date.class)) {
                    field.set(bean, DateUtil.toDate(value));
                } else if(propType.equals(java.sql.Date.class)) {
                    field.set(bean, DateUtil.toDate(value));
                } else if(propType.equals(java.sql.Timestamp.class)) {
                    field.set(bean, DateUtil.toTimestamp(value));
                } else if(propType.equals(java.sql.Time.class)) {
                    field.set(bean, DateUtil.toTime(value));
                } else {
                    field.set(bean, value);
                }
                
                // set changed, avoiding mirrored events
                if("&Parent".equals(property)) {
                } else if(property.indexOf("$Read") > 0) {
                } else if(property.indexOf("$Changed") > 0) {
                } else if(property.indexOf("$controlId") > 0) {
                } else if(property.indexOf("$className") > 0) {
                } else {
                    try {
                        // Ricerca nel bean corrispondenza esatta
                        field = searchProperty(bean, property+"$Changed", true, false);
                        if(field != null)
                            field.setAccessible(true);
                            field.set(bean, true);
                    } catch (Throwable th2) {
                        try {
                            bean.getClass().getMethod("setChanged", String.class, Boolean.class).invoke(bean, property, true);
                        } catch (Throwable th) {
                            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th2);
                            Method[] methods = bean.getClass().getMethods();
                            for(int i=0; i<methods.length; i++) {
                                System.err.println("{"+bean.getClass()+"}.Method #"+(i+1)+":" + methods[i].toString());
                            }
                        }
                    }
                    /*
                    OBSOLETO
                    try {
                        bean.getClass().getMethod("setChanged", String.class, boolean.class).invoke(bean, property, true);
                    } catch (Throwable th) {
                        Method[] methods = bean.getClass().getMethods();
                        for(int i=0; i<methods.length; i++) {
                            if(methods[i].getName().equalsIgnoreCase(property)) {
                                System.err.println("{"+bean.getClass()+"}.Method #"+(i+1)+":" + methods[i].toString());
                            }
                        }
                        try {
                            // Ricerca nel bean corrispondenza esatta
                            field = searchProperty(bean, property+"$Changed", true, false);
                            if(field != null)
                                field.set(bean, value);
                        } catch (Throwable th2) {
                            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th2);
                        }
                    }
                    */
                }
                
            } catch (ParseException ex) {
                Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return;
    }
    
    
    /**
     * <h3>Get the property of a bean</h3>
     * <p>
     * This method get a property from a bean
     *
     * @param  bean  the bean (Object)
     * @param  property the name of the property to get (String)

     * @return      property value (Object)
     * @see         utility
     */
    static public Object get(Object bean, String property) {
        try {
            String clasName = bean.getClass().getName();
            if(clasName.equalsIgnoreCase("java.util.ArrayList") || clasName.equalsIgnoreCase("java.util.List")) {
                // wrap to bean
                List<?>list = (List<?>)bean;
                if(list.size()>0) bean = (Object)list.get(0);
            }
            String searchingProperty = property.replaceAll("\\.", "\\$");
            if(bean != null) {
                Field field = null;
                try {
                    field = bean.getClass().getDeclaredField(searchingProperty);
                    if(field!=null) {
                        field.setAccessible(true);
                        return field.get(bean);
                    }
                } catch (Throwable th) { }
                
                // Ricerca nel bean per similitudine
                field = searchProperty(bean, searchingProperty, false, false);
                if(field != null) {
                    field.setAccessible(true);
                    return field.get(bean);
                }
                // Codice Obsoleto
                PropertyDescriptor propertyDescriptor = getPropertyDescriptor(bean.getClass(), searchingProperty);
                if (propertyDescriptor == null) {
                    throw new IllegalArgumentException("No such property " + searchingProperty + " for " + bean + " exists");
                }
                Method readMethod = propertyDescriptor.getReadMethod();
                if (readMethod == null) {
                    throw new IllegalStateException("No getter available for property "+ property + " on " + bean);
                }
                return readMethod.invoke(bean);
            }
        } catch (Throwable th) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th);
        }
        return null;
    }
    
    
    static public boolean isChanged(Object bean, String property) throws IntrospectionException, IllegalArgumentException, IllegalAccessException, InvocationTargetException, NoSuchFieldException {
        if(bean != null) {
            Field field = bean.getClass().getDeclaredField(property+"$Changed");
            if(field!=null) {
                field.setAccessible(true);
                return (boolean)field.get(bean);
            }
            // Ricerca nei beans
            field = searchProperty(bean, property, false, false);
            if(field != null) {
                return (boolean)field.get(bean);
            }
        }
        return false;
    }

    
    static private PropertyDescriptor getPropertyDescriptor(Class<?> bean, String propertyname) throws IntrospectionException {
        BeanInfo beanInfo = Introspector.getBeanInfo(bean);
        PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
        PropertyDescriptor propertyDescriptor = null;
        for (int i=0; i<propertyDescriptors.length; i++) {
            PropertyDescriptor currentPropertyDescriptor = propertyDescriptors[i];
            if (currentPropertyDescriptor.getName().equals(propertyname)) {
                propertyDescriptor = currentPropertyDescriptor;
            }
        }
        return propertyDescriptor;
    }    
    
    static Object removeCommas( Object key ) {
        return removeString( key, "\"" );        
    }
    static Object removeString( Object key, String removing ) {
        if(key != null) {
            String skey = (String)key;
            int index = skey.indexOf(removing);
            if(index >= 0) skey = skey.substring(index+removing.length());
            int lastIndex = skey.lastIndexOf(removing);
            if(lastIndex >= 0) skey = skey.substring(0, lastIndex);
            return skey;
        } else {
            return null;
        }
    }

    static public boolean folderExist( String folder ) {
        if(folder != null && !folder.isEmpty()) {
            File file = new File(folder); 
            return file.isDirectory();
        } else {
            return false;
        }
    }
    static public boolean fileExist( String folder ) {
        if(folder != null && !folder.isEmpty()) {
            File file = new File(folder); 
            return file.isFile();
        } else {
            return false;
        }
    }

    static public String strip_last_slash(String str) {
        if (str != null && str.length() > 0 && (str.charAt(str.length() - 1) == '/' || str.charAt(str.length() - 1) == '\\')) {
            str = str.substring(0, str.length() - 1);
        }
        return str;
    }
    
    static public String strip_last_char(String str, char char_to_strip) {
        if(str==null) return "";
        if(str.isEmpty()) return "";
        if (str.charAt(str.length()-1)==char_to_strip){
            str = str.replace(str.substring(str.length()-1), "");
            return str;
        } else{
            return str;
        }
    }    

    public static void close_process( Process process ) {
        try {
            process.wait(3000); // let the process run for 3 seconds
        } catch (Throwable th) {}
        process.destroy();        
        try {
            process.wait(5000); // give it a chance to stop
        } catch (Throwable th) {}
        process.destroy();
        try {
            process.waitFor(); // the process is now dead
        } catch (Throwable th) {}
    }


    public static void execute_process(String script) {

        try {

            Process p = Runtime.getRuntime().exec(script);

            Thread.sleep(1000);

            BufferedReader input = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line = null;

            while ((line = input.readLine()) != null) {
                System.out.println(line);
            }

            int exitVal = p.waitFor();
            System.out.println("Exited with error code " + exitVal);
            // log.debug(("Exited with error code "+exitVal));

        } catch (Exception e) {
            System.out.println(e.toString());
            e.printStackTrace();
            // log.error(e.getMessage());
        }
    }
    
    static public String appendSeparator(String path) {
         if(path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length()-1);
            if(c != File.separatorChar && !c.equals("\\")) {
                return ""+File.separatorChar;
            }
        }
        return "";
    }
    static public String appendURLSeparator(String path) {
         if(path != null && !path.isEmpty()) {
            Character c = path.charAt(path.length()-1);
            if(c != '/' && !c.equals("/")) {
                return "/";
            }
        }
        return "";
    }
 
   static public String get_parent_path(String fullFileName) throws IOException {
        File relativePath = new File(fullFileName).getParentFile();
        return relativePath.getCanonicalPath();
    }       
    static public String get_absolute_path(HttpServletRequest request, String fileName) throws IOException {
        String fullFileName = "";
        ServletContext servletContext = request.getSession().getServletContext();
        String absoluteFilePathRoot = strip_last_slash(servletContext.getRealPath("/"));
        File relativePath = new File(absoluteFilePathRoot);
        String absolutePath = relativePath.getCanonicalPath();        
        File pyFilePath = new File(absolutePath + utility.appendSeparator(absolutePath) + fileName);
        fullFileName = pyFilePath.getCanonicalPath();
        if(!utility.fileExist(fullFileName)) {
            throw new IOException("ERROR : file "+fullFileName+" not found");
        }
        return fullFileName;
    }   
    
    // checks if two given strings match. The first string  may contain wildcard characters 
    static boolean match(String first, String second) {

        // If we reach at the end of both strings,  // we are done 
        if (first.length() == 0 && second.length() == 0) {
            return true;
        }

        // Make sure that the characters after '*'  
        // are present in second string.  
        // This function assumes that the first 
        // string will not contain two consecutive '*' 
        if (first.length() > 1 && first.charAt(0) == '*' && second.length() == 0) {
            return false;
        }

        // If the first string contains '?',  
        // or current characters of both strings match 
        if ((first.length() > 1 && first.charAt(0) == '?')
                || (first.length() != 0 && second.length() != 0
                && first.charAt(0) == second.charAt(0))) {
            return match(first.substring(1),
                    second.substring(1));
        }

        // If there is *, then there are two possibilities 
        // a) We consider current character of second string 
        // b) We ignore current character of second string. 
        if (first.length() > 0 && first.charAt(0) == '*') {
            return match(first.substring(1), second)
                    || match(first, second.substring(1));
        }
        return false;
    }
    
    public static String getDomainName(String url) throws URISyntaxException {
        URI uri = new URI(url);
        String domain = uri.getHost();
        return domain.startsWith("www.") ? domain.substring(4) : domain;
    }    
    
    
    public static Object [] downloadFile( HttpServletRequest request, HttpServletResponse response, String fileToDownload ) throws FileNotFoundException, IOException {
        response.setHeader("Content-Disposition", "attachment; filename=\""+fileToDownload+"\"");
        
        ServletContext context = request.getSession().getServletContext();
        String relativePath = context.getRealPath("");
        String filePath = relativePath + "LiquidX/download/"+fileToDownload;
        File downloadFile = new File(filePath);
        FileInputStream inStream = new FileInputStream(downloadFile);
         
        // gets MIME type of the file
        String mimeType = context.getMimeType(filePath);
        if (mimeType == null) {        
            mimeType = "application/octet-stream";
        }
         
        response.setContentType(mimeType);
        response.setContentLength((int) downloadFile.length());
         
        // obtains response's output stream
        OutputStream outStream = response.getOutputStream();
         
        byte[] buffer = new byte[4096];
        int bytesRead = -1;         
        while ((bytesRead = inStream.read(buffer)) != -1) {
            outStream.write(buffer, 0, bytesRead);
        }
         
        inStream.close();
        outStream.close();
        
        return new Object [] { true };
    }    
}