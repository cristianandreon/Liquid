/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import static com.liquid.workspace.GLLang;
import static com.liquid.workspace.controlIdSeparator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author Cristitan
 */
public class liquidize {
    
    static boolean bCompactMode = false;
    static String sTabular = "    ";
    
    static ArrayList<String> glJSONPropsList = new ArrayList<String> (  Arrays.asList( 
        "database", "schema", "table", "driver", "connectionURL"
        ,"primaryKey"
        ,"name"
        ,"nRows"
        ,"nCols"
        ,"assets"
        ,"columns"
        ,"foreignTables"
        ,"grids"
        ,"layouts"
        ,"documents"
        ,"charts"
        ,"filters"
        ,"commands"
        ,"events"
        ,"query"
        // inside columns :
        ,"tooltip"
        ,"icon"
        ,"label"
        ,"op"
        ,"foreignTable"
        ,"foreignColumn"
        ,"column"
        ,"options"
    ));

    
    static ArrayList<String> glkeepClosedList = new ArrayList<String> ( Arrays.asList(
            "columns", "events", "commands"
            ,"columns.options.columns"
            ,"grids.columns", 
            "foreignTables.options.columns", "foreignTables.options.grids.columns", "foreignTables.options.commands", "foreignTables.options.events"
            ,"filters.columns", "foreignTables.options.filters.columns"
            ,"grids.assets"
    ));
    
    static ArrayList<String> glRuntimeParentPropsList = new ArrayList<String> ( Arrays.asList(
            "commands"
            ,"foreignTables.options.commands"
    ));
    
    static ArrayList<String> glNativeCommands = new ArrayList<String> ( Arrays.asList(
            "insert", "create", "update", "modify", "delete", "erase", "previous", "next", "copy", "paste"
    ));

    
    static public String liquidizeJSONContent(String content) {
        String out = "";
        try {
            JSONObject json = new JSONObject(content);
            if(json != null) {
                //
                // removing runtime props on events
                //
                if(json.has("events")) {
                    JSONArray events = json.getJSONArray("events");
                    JSONArray refined_events = new JSONArray();
                    for(int il=0; il<events.length(); il++) {
                        JSONObject event = events.getJSONObject(il);
                        if(!event.getBoolean("isSystem")) {
                            refined_events.put(event);
                        }
                    }
                    json.put("events", refined_events);
                }
                
                //
                // removing runtime props on columns
                //
                if(json.has("columns")) {
                    json.put("columns", refineColumns( json.getJSONArray("columns") ));
                }
                if(json.has("commands")) {
                    json.put("commands", refineCommands( json.getJSONArray("commands") ));
                }

                if(json.has("foreignTables")) {
                    JSONArray fts = json.getJSONArray("foreignTables");
                    for(int ift=0; ift<fts.length(); ift++) {
                        JSONObject ft = fts.getJSONObject(ift);
                        if(ft != null) {
                            if(ft.has("options")) {
                                JSONObject opts = ft.getJSONObject("options");
                                if(opts.has("columns")) {                            
                                    opts.put("columns", refineColumns( opts.getJSONArray("columns") ));
                                }
                            }
                            if(ft.has("commands")) {
                                ft.put("commands", refineCommands( ft.getJSONArray("commands") ));
                            }
                        }
                    }
                }

                json.remove("metadataTime");
                if(json.has("loadingMessage")) {
                    if("".equalsIgnoreCase(json.getString("loadingMessage"))) {
                        json.remove("loadingMessage");
                    }
                }

                
                String [] props = { "sourceFileName", "sourceFullFileName", "parentObjId" };
                for(String prop : props) {
                    if(json.has(prop)) {
                        json.remove(prop);
                    }
                }
    
                int cLevel = 1;
                String sep = ",";
                out += "{";
                if(json.has("build_comment")) json.remove("build_comment");
                out += sTabular + "\"build_comment\":\"create by liquid v. "+Info.getVersion()+"\"";
                        
                for(int i=0; i<glJSONPropsList.size(); i++) {
                    out += liquidizeAddProp( json, glJSONPropsList.get(i), null, cLevel, true, sep );
                }
                // rest of properties ...
                JSONArray names = json.names();
                for(int io=0; io<names.length(); io++) {
                    String propName = names.getString(io);
                    if(!"sourceFileName".equalsIgnoreCase(GLLang) && !"sourceFillFileName".equalsIgnoreCase(GLLang))
                    out += liquidizeAddProp( json, propName, null, cLevel, liquidizeHasNewLine(propName), sep );
                }
                out += "\n}";
            }
            return out;
            
        } catch (Throwable ex) {
            Logger.getLogger(workspace.class.getName()).log(Level.SEVERE, null, ex);
        }
        
        return content;
    }

    public static JSONArray refineColumns( JSONArray columns ) throws JSONException {
        if(columns != null) {
            JSONArray refined_columns = new JSONArray();
            for(int il=0; il<columns.length(); il++) {
                JSONObject column = columns.getJSONObject(il);
                if(column.has("label")) {
                    if(column.getString("name").equalsIgnoreCase(column.getString("label"))) {
                        column.remove("label");
                    }
                }
                if(column.has("requiredByDB")) {
                    column.remove("requiredByDB");
                }
                if(column.has("width")) {
                    if("!auto".equals(column.getString("width"))) {
                        column.remove("width");
                    }
                }
                refined_columns.put(column);
            }
            return refined_columns;
        }
        return null;
    }
        
    public static JSONArray refineCommands( JSONArray commands ) throws JSONException {
        if(commands != null) {
            JSONArray refined_commands = new JSONArray();
            for(int il=0; il<commands.length(); il++) {
                JSONObject command = commands.getJSONObject(il);
                if(command.has("isNative")) {
                    if(command.getBoolean("isNative")) {
                        refined_commands.put( new JSONObject( "{\"name\":\""+command.getString("name")+"\"}" ) );
                    } else {
                        refined_commands.put(command);
                    }
                } else {
                    refined_commands.put(command);
                }
            }
            return refined_commands;
        }
        return null;
    }
        
    public static boolean liquidizeHasNewLine( String prop ) {
        for(int i=0; i<glkeepClosedList.size(); i++) {
            if(glkeepClosedList.get(i).equalsIgnoreCase(prop)) {
                return false;
            }
        }
        return true;
    }
    
    public static String liquidizeIsNativeCommand( String fullPathProp, String prop ) {
        for(int i=0; i<glRuntimeParentPropsList.size(); i++) {
            if(glRuntimeParentPropsList.get(i).equalsIgnoreCase(fullPathProp)) {
                for(int j=0; j<glNativeCommands.size(); j++) {
                    if(glNativeCommands.get(j).equalsIgnoreCase(prop)) {
                        return glNativeCommands.get(j);
                    }
                }
            }
        }
        return null;
    }
    
    public static String liquidizeAddProp(Object ojson, String prop, String fullPathProp, int cLevel, boolean bNewLine, String sep) throws JSONException {
        String out = "";

        if(ojson instanceof JSONArray) {
            if("foreignTables".equalsIgnoreCase(fullPathProp) || "foreignTables".equalsIgnoreCase(prop)) {
                int lb = 1;
            }
            
            JSONArray jsons = (JSONArray)ojson;
            out += sep + "[";
            
            boolean childNewLine = liquidizeHasNewLine(fullPathProp);
            cLevel++;
            if(bNewLine && jsons.length()>0) {
                if(!childNewLine) { // the child'll do it
                    out += "\n";
                    for(int i=0; i<cLevel; i++) out += sTabular;
                }
            }                    
            for(int il=0; il<jsons.length(); il++) {
                Object propVal = jsons.get(il);
                if(propVal instanceof Boolean || propVal instanceof Float || propVal instanceof Double || propVal instanceof Long || propVal instanceof Integer) {
                    out += (il>0?",":"") + String.valueOf(propVal);
                } else if(propVal instanceof JSONObject || propVal instanceof JSONArray) {
                    out += (il>0?",":"")+liquidizeAddProp( propVal, null, fullPathProp+(prop != null ? "."+prop:""), cLevel, bNewLine & childNewLine, "" );
                } else {
                    out += (il>0?",":"") + "\"" + String.valueOf(propVal) + "\"";
                }
            }
            cLevel--;
            if(bNewLine && jsons.length()>0) {
                if(childNewLine) { // the child did it
                    out+= "\n";
                    for(int i=0; i<cLevel; i++) out += sTabular;
                }
            }
            out+= "]";

            
        } else if(ojson instanceof JSONObject) {
            JSONObject json = (JSONObject)ojson;
            if(prop != null) {
                if(json.has(prop)) {                    
                    boolean bProcessProperty = true;
                            
                    if(bProcessProperty) {
                        Object propVal = json.get(prop);
                        if(bNewLine) {
                            out+= "\n";
                            for(int i=0; i<cLevel; i++) out += sTabular;
                            if(propVal instanceof JSONObject || propVal instanceof JSONArray) {
                            } else {
                            }
                        }
                        int aLevel = (bNewLine && propVal instanceof JSONObject ? 1 : 0);
                        out += sep + "\"" + prop + "\":";
                        out += liquidizeAddProp( propVal, null, (prop), cLevel+aLevel, bNewLine & liquidizeHasNewLine(fullPathProp), "" );
                        json.remove(prop);
                    }
                }
            } else {
                int nAdded = 0;
                for(int io=0; io<glJSONPropsList.size(); io++) {
                    String propName = glJSONPropsList.get(io);
                    if(json.has(propName)) {
                        boolean bProcessProperty = true;

                        // Only name for native command
                        String nativeCommand = liquidizeIsNativeCommand(fullPathProp, propName);
                        if(nativeCommand != null) {
                            if(!"name".equalsIgnoreCase(propName)) {
                                bProcessProperty = false;
                            }
                        }

                        if(fullPathProp.contains("columns")) {
                            if("requiredByDB".equalsIgnoreCase(propName)) {
                                bProcessProperty = false;
                            }
                        }
                        
                        if(bProcessProperty) {
                            Object propVal = json.get(propName);
                            if(bNewLine) {
                                out+= "\n";
                                for(int i=0; i<cLevel; i++) out += sTabular;
                                if(propVal instanceof JSONObject || propVal instanceof JSONArray) {
                                } else {
                                }
                            }
                            if(nAdded==0) out += "{ ";
                            out += (nAdded>0?",":"")+"\"" + propName + "\":";
                            int aLevel = (bNewLine && propVal instanceof JSONObject ? 1 : 0);
                            out += liquidizeAddProp( propVal, null, fullPathProp+(propName != null ? "."+propName:""), cLevel+aLevel, bNewLine & liquidizeHasNewLine(fullPathProp), "" );
                            json.remove(propName);
                            nAdded++;
                        }
                    }
                }
                JSONArray names = json.names();
                if(names != null) {
                    for(int io=0; io<names.length(); io++) {
                        String propName = names.getString(io);
                        Object propVal = json.get(propName);
                        if(bNewLine) {
                            out += "\n";
                            for(int i=0; i<cLevel; i++) out += sTabular;
                            if(propVal instanceof JSONObject || propVal instanceof JSONArray) {
                            } else {
                            }
                        }
                        if(nAdded==0) out += "{ ";
                        out += (nAdded>0?",":"")+"\"" + propName + "\":";
                        int aLevel = (bNewLine && propVal instanceof JSONObject ? 1 : 0);
                        out += liquidizeAddProp( propVal, null, fullPathProp+(propName != null ? "."+propName:""), cLevel+aLevel, bNewLine & liquidizeHasNewLine(fullPathProp), "" );
                        nAdded++;
                    }
                }
                out += (nAdded==0?"{":"");
                if(bNewLine) {
                    out += "\n";
                    for(int i=0; i<cLevel; i++) out += sTabular;
                    out += "}";
                } else {
                    out += " }";
                    if(!bCompactMode) {
                        out += "\n";
                        for(int i=0; i<cLevel; i++) out += sTabular;
                    }
                }
            }
            
        } else if(ojson instanceof Boolean || ojson instanceof Float || ojson instanceof Double || ojson instanceof Long || ojson instanceof Integer) {
            out += String.valueOf(ojson);
        } else {
            String str = String.valueOf(ojson);
            str = str != null ? str.replace("\\", "\\\\").replace("\"", "\\\"") : "";
            out += "\"" + str + "\"";
        }
        
        return out;
    }    

    static String liquidizeString( String baseName, String controlIdSeparator ) {
        return liquidizeString( baseName, controlIdSeparator, false );
    }
    static String liquidizeString( String baseName, String controlIdSeparator, boolean bLastPart ) {
        String result = "";
        String [] sParts = baseName.toString().split("\\.");
        for(int ip=(bLastPart ? sParts.length-1 : 0); ip<sParts.length; ip++) {
            String [] sSubParts =  sParts[ip].split("_");
            result += (result.length()>0 ? (controlIdSeparator != null ? controlIdSeparator : "") : "");
            for(int ips=0; ips<sSubParts.length; ips++) {
                // String part = sSubParts[ips].substring(0, 1).toUpperCase()+sSubParts[ips].substring(1, sSubParts[ips].length()).toLowerCase();
                String part = sSubParts[ips].substring(0, 1).toUpperCase()+sSubParts[ips].substring(1, sSubParts[ips].length());
                if(!part.isEmpty()) result += part;
            }
        }
        return result;
    }    
}
