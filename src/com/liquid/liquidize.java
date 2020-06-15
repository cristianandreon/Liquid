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
        ,"options"
    ));

    static ArrayList<String> glkeepClosedList = new ArrayList<String> ( Arrays.asList(
            "columns", "events", "commands"
            ,"columns.options.columns"
            ,"grids.columns", "foreignTables.options.grids.columns", "foreignTables.options.commands", "foreignTables.options.events"
            ,"filters.columns", "foreignTables.options.filters.columns"
    ));

    static public String liquidizeJSONContnet(String content) {
        String out = "";
        try {
            JSONObject json = new JSONObject(content);
            if(json != null) {
                // removing runtime props
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

    public static boolean liquidizeHasNewLine( String prop ) {
        for(int i=0; i<glkeepClosedList.size(); i++) {
            if(glkeepClosedList.get(i).equalsIgnoreCase(prop)) {
                return false;
            }
        }
        return true;
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
            if(bNewLine && jsons.length()>0) {
                cLevel++;
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
            if(bNewLine && jsons.length()>0) {
                cLevel--;
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
            } else {
                int nAdded = 0;
                for(int io=0; io<glJSONPropsList.size(); io++) {
                    String propName = glJSONPropsList.get(io);
                    if(json.has(propName)) {
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
                JSONArray names = json.names();
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
                out += (nAdded==0?"{":"");
                if(bNewLine) {
                    out += "\n";
                    for(int i=0; i<cLevel; i++) out += sTabular;
                    out += "}";
                } else {
                    out += " }";
                    if(!bCompactMode) out += "\n";
                    for(int i=0; i<cLevel; i++) out += sTabular;
                }
            }
            
        } else if(ojson instanceof Boolean || ojson instanceof Float || ojson instanceof Double || ojson instanceof Long || ojson instanceof Integer) {
            out += String.valueOf(ojson);
        } else {
            out += "\"" + String.valueOf(ojson) + "\"";
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
                String part = sSubParts[ips].substring(0, 1).toUpperCase()+sSubParts[ips].substring(1, sSubParts[ips].length()).toLowerCase();
                if(!part.isEmpty()) result += part;
            }
        }
        return result;
    }    
}
