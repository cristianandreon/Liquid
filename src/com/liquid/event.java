package com.liquid;

import com.liquid.python.python;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class event {
    

    public interface eventCallback<T extends Object> {
        /**
         * <h3>Get the bean by primary keys</h3>
         * <p>
         * This method get bean from the primary key list, creating it at runtime
         *
         * @param  p1  the control workspace (Object)
         * @param  p2  the parameters of the call, in json format (String)
         * @param  p3  the client data (command, event, validator, etc), in json format (String)
         * @param  p4  the Http request (HttpServletRequest)
         * @param  p5  the instance class of the callback to call before return (Object)

         * @return      less than 0 for fail, 0 for none, greater than 0 for success
         * @see         db
         */
        public int callback(Object p1, Object p2, Object p3, Object p4, Object p5);
    }
         
    static public String execute (HttpServletRequest request, JspWriter out) {
        String errorJson = "", error = "", retVal = "";
        String className = "";
        String params = "";
        String clientData = "";
        String controlId = "";
        String owner = "";
        String tblWrk = "";
        
        
        try {
            
            try {
                className = (String) request.getParameter("className");
            } catch (Exception e) {
            }
            try {
                clientData = (String) request.getParameter("clientData");
            } catch (Exception e) {
            }
            try {
            	controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }            
            try {
                owner = (String) request.getParameter("owner");
            } catch (Exception e) {
            }  
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }  
            workspace tbl_wrk = workspace.get_tbl_manager_workspace( tblWrk != null && !tblWrk.isEmpty() ? tblWrk : controlId );
            if(tbl_wrk == null) {
                // nessuna definizione del controllo
            }
                       
            /* NO : la ricevente toglie il carattere finale all'occorrenza
            if(params.endsWith("\n"))
                params = params.substring(0, params.length()-1);
            */
            params = workspace.get_request_content(request);
            
            
            try {

                // get instance and method
                Object [] result = get_method_by_class_name(className, tbl_wrk, owner);
                Object classInstance = result[0];
                Method method = (Method)result[1];
                
                if(method != null && classInstance != null) {
                    retVal = (String)method.invoke(classInstance, tbl_wrk, params, clientData, (Object)request);

                    // executing events as syncronous chain
                    try {
                        return process_next_event(retVal, tbl_wrk, params, clientData, (Object)request);
                    } catch (Exception e) {
                    }

                    return retVal;
                }

            } catch (InvocationTargetException ite) {
    	        final Throwable cause = ite.getTargetException();
    	        error = ite.getCause().getLocalizedMessage();
    	        System.err.println("nested exception - " + cause + " "+ite.getCause() );		
    		                
            } catch (Throwable th) {
                error = "Error in class.method:"+className+" ("+th.getLocalizedMessage()+")";
                System.err.println(" execute() ["+controlId+"] Error:" + th.getLocalizedMessage());
            }
            
            if(error != null) {
            	errorJson = "{ \"error\":\"" + utility.base64Encode(error.getBytes())+"\"}";
            }
            
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" execute() ["+controlId+"] Error:" + e.getLocalizedMessage());
            errorJson = "{ \"error\":\"" + utility.base64Encode(error.getBytes())+"\"}";
        }
        return errorJson;
    }
    
    static public Object [] get_method_by_class_name(String className, workspace tbl_wrk, String owner) throws ClassNotFoundException, InstantiationException, IllegalAccessException, NoSuchMethodException {
        if(className != null && !className.isEmpty()) {
            String objectClassName = className;
            String sMethod = "";
            String [] classParts = className.replace(" ", ".").split("\\.");
            Object classInstance = null;
            Class cls = null;

            if(tbl_wrk != null) {
                if(tbl_wrk.owner!=null) {
                    classInstance = tbl_wrk.owner; 
                    sMethod = className;
                    cls = classInstance.getClass();
                }
            } else if(owner != null && !owner.isEmpty()) {
                cls = Class.forName(owner);
                classInstance = (Object) cls.newInstance(); 
                sMethod = className;
            }
            if(classInstance == null || classParts.length > 1) {
                if(classParts.length > 1) {
                    objectClassName = "";
                    sMethod = classParts[classParts.length-1].replace("()", "");
                    for(int i=0; i<classParts.length-1; i++) {
                        objectClassName += (objectClassName.length()>0?".":"")+classParts[i];
                    }
                }                    
                cls = Class.forName(objectClassName);
                if(classInstance == null)
                    classInstance = (Object) cls.newInstance();
            }
            if(classInstance != null) {
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            }
        }
        return null;
    }
    
    static public Object [] get_method_by_class_name(String className, Object classOrInstance) throws ClassNotFoundException, InstantiationException, IllegalAccessException, NoSuchMethodException {
        if(className != null && !className.isEmpty()) {
            String objectClassName = className;
            String sMethod = "";
            String [] classParts = className.replace(" ", ".").split("\\.");
            Class cls = null;
            Object classInstance = null;

            sMethod = className;
            if(classOrInstance instanceof Class) {
            	cls = (Class) classOrInstance;
            	classInstance = (Object)((Class) classOrInstance).newInstance();
            } else {
            	classInstance = classOrInstance;
            }

            if(classInstance == null || classParts.length > 1) {
                if(classParts.length > 1) {
                    objectClassName = "";
                    sMethod = classParts[classParts.length-1].replace("()", "");
                    for(int i=0; i<classParts.length-1; i++) {
                        objectClassName += (objectClassName.length()>0?".":"")+classParts[i];
                    }
                }                    
                if(classInstance == null) {
                    cls = Class.forName(objectClassName);
                    classInstance = (Object) cls.newInstance();
                }
            }
            if(classInstance != null) {
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod, Object.class);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            	try {
            		Method method = cls.getMethod(sMethod);
            		return new Object [] { classInstance, method };
            	} catch(Throwable th) { }
            }
        }
        return null;
    }

    static public String process_next_event (String currentRetVal, Object tbl_wrk, Object params, Object clientData, Object requestParam ) throws Exception {
        String retVal = currentRetVal, errors = "";
        if(tbl_wrk != null) {
            workspace liquid = (workspace)tbl_wrk;
            JSONObject eventJson = new JSONObject((String)clientData);
            Object client = null;
            if(eventJson != null) {
                if(eventJson.has("cypher")) {
                    if(eventJson.has("name")) {
                        String cypher = eventJson.getString("cypher");
                        String name = eventJson.getString("name");
                        if(cypher != null && !cypher.isEmpty()) {
                            if(name != null && !name.isEmpty()) {
                                // client may be array or string
                                client = eventJson.has("client") ? eventJson.get("client") : null;
                                JSONArray events = liquid.tableJson.getJSONArray("events");
                                if(events != null) {
                                    for(int ievt=0; ievt<events.length(); ievt++) {
                                        JSONObject event = events.getJSONObject(ievt);
                                        if(event != null) {
                                            String uname = event.has("name") ? event.getString("name") : "";
                                            String ucypher = event.has("cypher") ? event.getString("cypher") : "";
                                            String uServer = event.has("server") ? event.getString("server") : "";
                                            Object uClient = event.has("client") ? event.get("client") : null;
                                            if(uname.equalsIgnoreCase(name)) {
                                                if(!ucypher.equalsIgnoreCase(cypher)) {
                                                    // event to execute
                                                    String uClientData = event.toString();
                                                    String uRetVal = null;
                                                    if(uServer != null && !uServer.isEmpty()) {
                                                        // get instance and method
                                                        Object [] result = get_method_by_class_name(uServer, liquid, null);
                                                        Object classInstance = result[0];
                                                        Method method = (Method)result[1];
                                                        
                                                        if(classInstance != null && method != null) {
                                                            // encapsulate previous result in current params .. depending of event type ???
                                                            params = transfer_result_to_params(retVal, (String)params);
                                                                    
                                                            uRetVal = (String)method.invoke(classInstance, (Object)liquid, (Object)params, (Object)uClientData, (Object)requestParam);
                                                            if(uRetVal != null && !uRetVal.isEmpty()) {
                                                                // set new result
                                                                retVal = transfer_result_to_results(uRetVal, retVal);
                                                            }
                                                        } else {
                                                            errors += "[Error processing next event:"+uname+"on control:"+liquid.controlId+" server:"+uServer+ "]";
                                                        }
                                                    }
                                                    // client code from json
                                                    if(uClient != null) {
                                                        // encapsulate client data
                                                        if(client == null) client = new JSONArray();
                                                        JSONArray clientJSON = (JSONArray)client;
                                                        if(clientJSON != null) {
                                                            if(uClient instanceof JSONArray) {
                                                                JSONArray uClientJSON = (JSONArray)uClient;
                                                                clientJSON.put(uClientJSON);
                                                            } else if(uClient instanceof String) {
                                                                String uClientString = (String)uClient;
                                                                if(!uClientString.isEmpty()) {
                                                                    clientJSON.put(uClientString);
                                                                    client = (Object)clientJSON;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // Add client code to result
            if(client != null) {
                transfer_client_to_result(client, retVal);
            }
        }
        return retVal;        
    }
    
    
    //
    // Transfer client param to parameter for next event process
    // 
    static private String transfer_client_to_result( Object clientToTransfer, String result) throws JSONException {
        JSONObject retValJSON = new JSONObject(result);
        if(clientToTransfer != null) {
            if(retValJSON.has("client")) {
                Object retValClient = retValJSON.get("client");
                JSONArray newRetValClient = null;
                if(retValClient instanceof String) {
                    if(clientToTransfer instanceof String) {
                        newRetValClient = new JSONArray();
                        newRetValClient.put(retValClient);
                        newRetValClient.put(clientToTransfer);
                    } else if(clientToTransfer instanceof JSONArray) {
                        newRetValClient = new JSONArray();
                        newRetValClient.put(retValClient);
                        for(int i=0; i<((JSONArray)clientToTransfer).length(); i++) {
                            newRetValClient.put(((JSONArray) clientToTransfer).get(i));
                        }
                    }
                    if(newRetValClient != null) {
                        retValJSON.put("client", newRetValClient);
                    }

                } else if(retValClient instanceof JSONArray) {
                    if(clientToTransfer instanceof String) {
                        ((JSONArray)retValClient).put(clientToTransfer);
                    } else if(clientToTransfer instanceof JSONArray) {
                        for(int  i=0; i<((JSONArray)clientToTransfer).length(); i++) {
                            ((JSONArray)retValClient).put(((JSONArray) clientToTransfer).get(i));
                        }
                    }
                    retValJSON.put("client", retValClient);
                }
            }
        }
        return retValJSON.toString();
    }

    //
    // Transfer result to parameter of next event process
    //  ex.: 
    //      {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
    //          to 
    //      {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
    //
    static private String transfer_result_to_params( String retValToTransfer, String params) throws JSONException {
        String retVal = params;
        JSONObject retValJSON = new JSONObject((String)retValToTransfer);
        JSONObject rootJSON = new JSONObject((String)params);
        JSONArray paramsJSON = rootJSON.getJSONArray("params");

        if(retValJSON.has("resultSet")) {
            JSONArray resultsSetJSON = retValJSON.getJSONArray("resultSet");
            for (int ir=0; ir<resultsSetJSON.length(); ir++) {
                JSONObject resultSetJSON = (JSONObject)resultsSetJSON.getJSONObject(ir);
                for (int ip=0; ip<paramsJSON.length(); ip++) {
                    JSONObject paramJSON = (JSONObject)paramsJSON.get(ip);
                    if(paramJSON.has("data")) {
                        JSONObject dataJSON = paramJSON.getJSONObject("data");
                        for (Object keyObject : JSONObject.getNames(resultSetJSON)) {
                            String key = (String)keyObject;
                            Object obj = resultSetJSON.get(key);
                            dataJSON.put(key, obj);
                        }
                    }
                }
                retVal = rootJSON.toString();
            }
        }
        for(String key : new String [] { "error", "warning", "message" } ) {
            if(retValJSON.has(key)) {
                rootJSON.put(key, retValJSON.getString(key));
                retVal = rootJSON.toString();
            }
        }
        return retVal;
    }
    
    //
    // Transfer current result to result for next event process
    //  ex.: 
    //      {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
    //          to 
    //      {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
    //   
    static private String transfer_result_to_results( String retValToTransfer, String retValTarget) throws JSONException {
        String retVal = retValTarget;
        JSONObject retValToTransferJSON = new JSONObject((String)retValToTransfer);
        JSONObject retValTargetJSON = new JSONObject((String)retValTarget);

        if(retValToTransferJSON.has("resultSet")) {
            Object resultSetToTranfserJSON = retValToTransferJSON.get("resultSet");
            retValTargetJSON.put("resultSet", resultSetToTranfserJSON);
            retVal = retValTargetJSON.toString();
        }
        for(String key : new String [] { "error", "warning", "message", "client" } ) {
            if(retValToTransferJSON.has(key)) {
                retValTargetJSON.put(key, retValToTransferJSON.getString(key));
                retVal = retValTargetJSON.toString();            
            }
        }
        return retVal;
    }

    

    //
    // Per eseguire un file python nel server da js
    //
    static public String pythonExecute (HttpServletRequest request, JspWriter out) {
        String errorJson = "", error = "";
        String pythonFileToProcess = "";
        String params = "";
        String clientData = "";
        String controlId = "";
        String tblWrk = "";
        
        
        try {
            
            try {
                pythonFileToProcess = (String) request.getParameter("file");
            } catch (Exception e) {
            }
            try {
                clientData = (String) request.getParameter("clientData");
            } catch (Exception e) {
            }
            try {
            	controlId = (String) request.getParameter("controlId");
            } catch (Exception e) {
            }            
            try {
                tblWrk = (String) request.getParameter("tblWrk");
            } catch (Exception e) {
            }  
            workspace tbl_wrk = workspace.get_tbl_manager_workspace( tblWrk != null && !tblWrk.isEmpty() ? tblWrk : controlId );
            if(tbl_wrk == null) {
                // nessuna definizione del controllo
            }
                       
            //
            // NO : la ricevente toglie il carattere finale all'occorrenza
            //
            /*
            if(params.endsWith("\n"))
                params = params.substring(0, params.length()-1);
            */
            params = workspace.get_request_content(request);
            
            
            try {    
                return python.exec(request, "Liquid", pythonFileToProcess, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)null);
            } catch (Throwable th) {
                error = "Error in pythonExecute():"+pythonFileToProcess+" ("+th.getLocalizedMessage()+")\"}";
                System.err.println(" pythonExecute() ["+controlId+"] Error:" + th.getLocalizedMessage());
            }
            
            errorJson = "{ \"error\":\"" + utility.base64Encode(error)+"\"}";
            
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" pythonExecute() ["+controlId+"] Error:" + e.getLocalizedMessage());
        }
        return errorJson;
    }


    
    
    
    
    
    //
    // Callback varie di test
    //
    
    static public String echo (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return testEvent (tbl_wrk, params, clientData, freeParam );
    }

    
    // ES.: Funzione di collaudo generica della callback
    static boolean glEnable = true;
    
    static public String testEvent (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"result\":1";
        result += ",\"timecode\":"+System.currentTimeMillis();
        result += ",\"message\":\"testEvent(): ";
        
        if(tbl_wrk != null)
            result += " tableKey:"+((workspace)tbl_wrk).controlId;
        else
            result += " tableKey:N/D";
        
        if(params != null)
            result += " params:"+((String)params).replaceAll("\"", "'")+"";
        else
            result += " params:N/D";
        
        if(clientData != null)
            result += " clientData:"+((Object)clientData).toString().length()+"";
        else
            result += " clientData:N/D";
        
        if(clientData != null)
            result += " freeParam:"+((Object)freeParam)+"";
        else
            result += " freeParam:N/D";
        
        
        String updateResults = "";
        if(params != null) {
            if(tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest)freeParam;
                String ids = db.getSelection(tbl_wrk, params);
            }
        }
        result += "\"";
        result += "}";        

        return result;
    }


    static public String testBean (Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        String result = "{ \"result\":1";
        result += ",\"timecode\":"+System.currentTimeMillis();
        result += ",\"message\":\"testBean(): ";
        
        if(tbl_wrk != null)
            result += " tableKey:"+((workspace)tbl_wrk).controlId;
        else
            result += " tableKey:N/D";
        
        if(params != null)
            result += " params:"+((String)params).replaceAll("\"", "'")+"";
        else
            result += " params:N/D";
        
        if(clientData != null)
            result += " clientData:"+((Object)clientData).toString().length()+"";
        else
            result += " clientData:N/D";
        
        if(clientData != null)
            result += " freeParam:"+((Object)requestParam)+"";
        else
            result += " freeParam:N/D";
        
        
        String updateResults = "";
        String beanMessage = "";
        if(params != null) {
            if(tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest)requestParam;
                String ids = db.getSelection(tbl_wrk, params);
                long maxRows = 0;

                // ES.: Elenco selezione come JSONArray
                JSONArray jsonIds = (JSONArray)db.get_bean(request, (String)ids, "jsonarray", maxRows);       
                result += " json-ids:"+(jsonIds!= null ? workspace.jsonArrayToString(jsonIds, "'", "'", ","):"N/D")+"";

                // ES.: Elenco selezione come ArrayList<String>
                ArrayList<String> idsList = (ArrayList<String>)db.get_bean(request, (String)ids, "array", maxRows);
                result += " ids:"+(ids != null ? workspace.arrayToString(idsList != null ? idsList.toArray() : null, "'", "'", ","):"N/D")+"";

                //
                // ES.: Elenco selezione come bean (all field, all foreign tables)
                //
                ArrayList<Object> beans = (ArrayList<Object>)db.get_bean(request, (String)ids, "bean", "all", "all", maxRows);
                if(beans != null) {
                    int i = 1;
                    int n = beans.size();
                    for(Object bean : beans) {
                        try {                            
                            
                            // ES.: Caricamento foreign tables 1° livello
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object [] loadBeasnResult = null;
                            
                            loadBeasnResult = db.load_bean( bean, "UTENTI", maxRows );
                            loadBeasnResult = db.load_bean( bean, "DOMAINS", maxRows );
                            loadBeasnResult = db.load_bean( bean, "QUOTES_DETAIL", maxRows );
                            
                            // ES.: Caricamento foreign tables 2° livello per tutte le righe di QUOTES_DETAIL
                            ArrayList<Object> beansQD = (ArrayList<Object>) utility.get(bean, "QUOTES_DETAIL");
                            if(beansQD != null) {
                                for(Object beanQD : beansQD) {
                                    loadBeasnResult = db.load_bean( beanQD, "MATERIALS", maxRows );
                                }
                            }
                            
                            // ES.: Stampa risultati
                            beanMessage += ""
                                    +" <br/>bean: <b>#"+String.valueOf(i)+"/"+String.valueOf(n)+"</b>"
                                    + " <br/>Id: <b>" + utility.get(bean, "id")+"</b>"
                                    + " <br/>Date: <b>" + utility.get(bean, "date")+"</b>"
                                    + " <br/>col #1: <b>" + utility.get(bean, workspace.getColumn(tbl_wrk, 0).getString("name"))+"</b>"
                                    + " <br/>col #2: <b>" + utility.get(bean, workspace.getColumn(tbl_wrk, 1).getString("name"))+"</b>"
                                    + " <br/>col #3: <b>" + utility.get(bean, workspace.getColumn(tbl_wrk, 2).getString("name"))+"</b>"
                                    + " <br/>col #4: <b>" + utility.get(bean, workspace.getColumn(tbl_wrk, 3).getString("name"))+"</b>"
                                    + " <br/>ft utenti: <b>" + utility.get(bean, "utenti$id")+"</b>"
                                    + " <br/>ft quotes_detail: <b>" + utility.get(bean, "QUOTES_DETAIL")+"</b>"
                                    + " <br/>ft quotes_detail.materials: <b>" + utility.get( utility.get(bean, "QUOTES_DETAIL"), "MATERIALS")+"</b>"
                                    ;
                            i++;

                            // ES.: Modifica di un campo
                            int tipo = (int)utility.get(bean, "tipo");
                            utility.set(bean, "tipo", tipo+1);

                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }


                        // ES.: Aggiornamento riga nel DB
                        String updateResult = db.update ( bean, tbl_wrk );
                        
                        // ES.: Passa al risultato l'elenco degli id modificati, per il refresh nel client
                        updateResults += (updateResults.length()>0?",":"") + (updateResult != null ? updateResult : "");

                        
                        // ES.: Esegue un file python
                        String pyResult = "";
                        try {    
                            pyResult = python.exec(request, "Liquid.event.testBean", "/testPython/echo.py", (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)bean);
                        } catch (Throwable th) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, th);
                        }
                        
                        result += "<br/>";
                        result += "Python response:"+utility.base64Encode(pyResult); // .replace("\"", "\\\"");
                        result += "<br/>";
                    }
                } else {
                    beanMessage += "<br/>";
                    beanMessage += "No selections .. <br/>select one or more rows for read the beans";
                    beanMessage += "<br/>";
                }
                
                if(Messagebox.show( " Test ERROR message ", "Liquid", Messagebox.OK+Messagebox.CANCEL+Messagebox.ERROR) == Messagebox.OK) {
                    beanMessage += " <br/> ERROR message: <b>OK</b>";
                    if(Messagebox.show( " Test WARNING ... continue ?", "Liquid", Messagebox.YES+Messagebox.NO+Messagebox.WARNING) == Messagebox.YES) {
                        beanMessage += " <br/> WARNING message: <b>YES</b>";
                        while(Messagebox.show( " Test QUESTION message ", "Liquid", Messagebox.IGNORE+Messagebox.ABORT+Messagebox.RETRY+Messagebox.QUESTION) == Messagebox.RETRY) {
                            beanMessage += " <br/> QUESTION message: <b>RETRY</b>";
                        };
                        if(Messagebox.show( " Test INFO message ", "Liquid", Messagebox.OK+Messagebox.INFO) == Messagebox.OK) {
                            beanMessage += " <br/> INFO message: <b>OK</b>";
                            Messagebox.show( " Test DEBUG message ", "Liquid", +Messagebox.OK+Messagebox.CANCEL+Messagebox.DEBUG);
                        }
                    }
                } else {
                    beanMessage += " <br/> INFO message: <b>CANCEL</b>";
                }
            }
        }
        result += beanMessage;
        result += "\"";

        

        
        // ES.: Abilita disabilita un comando
        result += ",\"client\":[";
        if(glEnable) {
            result += "\"Liquid.disableCommand('"+((workspace)tbl_wrk).controlId+"','insert')\"";
        } else {
            result += "\"Liquid.enableCommand('"+((workspace)tbl_wrk).controlId+"','insert')\"";
        }
        result += ",\"Liquid.showToast('LIQUID','"+utility.base64Encode(beanMessage)+"','success')\"";
        result += "]";
        
        glEnable = !glEnable;
        
        result += ",\"details\":["+updateResults+"]";        
        result += "}";        

        return result;
    }
    
    
    static public String testParentBean (Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        String result = "{ \"result\":1";
        String updateResults = "";
        
        result += ",\"message\":\"testParentBean(): ";
        
        if(tbl_wrk != null) {
            if(params != null) {
                // Selezione sul pannello chiamante
                String ids = db.getSelection(tbl_wrk, params);
                //
                // ES.: Legge il bean completo, tutti i campi, tutte le foreign tables
                //
                long maxRows = 0;
                ArrayList<Object> beans = (ArrayList<Object>)db.get_bean(requestParam, (String)ids, "bean", "all", "all", maxRows);
                if(beans != null) {
                    int i = 1, n = beans.size();
                    for(Object bean : beans) {
                        try {                            
                            // ES.: Caricamento foreign tables parent
                            // N.B.: La selezione corrente del client risiede in params (String as getJSONArray)
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object parentLevel1Bean = db.load_parent_bean( bean, params, maxRows );
                            
                            Object parentLevel2Bean = db.load_parent_bean( parentLevel1Bean, params, maxRows );                            

                            Object parentLevel3Bean = db.load_parent_bean( parentLevel2Bean, params, maxRows );                            
                            
                                    
                            // ES.: Stampa risultati
                            result += " bean #"+String.valueOf(i++)+"/"+String.valueOf(n)
                                    + " Id:" + utility.get(bean, "id")
                                    + " Level 1 parent bean :" + parentLevel1Bean
                                    + " Level 2 parent bean :" + parentLevel2Bean
                                    + " Level 3 parent bean :" + parentLevel3Bean
                                    ;
                        
                            // ES.: Modifica campo priority
                            int priority = (int)utility.get(bean, "priority");
                            utility.set(bean, "priority", priority+1);

                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        // Richiesta conferma dal client (Messaggio con timeout)
                        if(Messagebox.show( "Updating table (set priority += 1) ... continue operation ?", "Liquid", Messagebox.OK+Messagebox.CANCEL+Messagebox.QUESTION, 30, Messagebox.CANCEL ) == Messagebox.OK) {

                            // ES.: Aggiornamento riga nel DB
                            String updateResult = db.update ( bean, tbl_wrk );

                            // ES.: Passa al risultato l'elenco degli id modificati, per il refresh nel client
                            updateResults += (updateResults.length()>0?",":"") + updateResult;
                        }
                    }
                }
            }
        }
        result += "\"";
        result += ",\"details\":["+updateResults+"]";        
        result += "}";
        return result;
    }

    static public String testScript (Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        String resultJson = "{ \"result\":1,\"message\":\"";
        String updateResults = "";
        
        String result = "testScript(): ";
        
        if(tbl_wrk != null) {
            if(params != null) {
                // Selezione sul pannello chiamante
                String ids = db.getSelection(tbl_wrk, params);
                //
                // ES.: Legge il bean completo, tutti i campi, tutte le foreign tables
                //
                long maxRows = 0;
                ArrayList<Object> beans = (ArrayList<Object>)db.get_bean(requestParam, (String)ids, "bean", "all", "all", maxRows);
                if(beans != null) {
                    int i = 1, n = beans.size();
                    for(Object bean : beans) {
                        try {                            
                            // ES.: Caricamento foreign tables parent
                            // N.B.: La selezione corrente del client risiede in params (String as getJSONArray)
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object [] loadBeasnResult = db.load_bean( bean, "$Parent", params, maxRows );
                            
                            // ES.: Stampa risultati
                            result += " bean #"+String.valueOf(i++)+"/"+String.valueOf(n)
                                    + " Id:" + utility.get(bean, "id")
                                    + " parent bean :" + utility.get(bean, "$Parent");


                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        // Richiesta conferma dal client (Messaggio con timeout)
                        String scriptResult = JSScript.script( "prompt('JS script from server test : type yout response','...');" );
                        result += "scriptResult(b64):" + utility.base64Encode(scriptResult);
                    }
                }
            }
        }
        resultJson += utility.base64Encode(result);
        resultJson += "\"";
        resultJson += ",\"details\":["+updateResults+"]";        
        resultJson += "}";
        return resultJson;
    }

    
    static public String testEventX (Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        if(params != null) {
            if(tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest)requestParam;
                String ids = workspace.getSelection(((workspace)tbl_wrk).controlId, (String)params);                
                long maxRows = 0, i = 1;
                ArrayList<Object> beans = (ArrayList<Object>)db.get_bean(request, (String)ids, "bean", "all", "all", maxRows);
                for(Object bean : beans) {
                    try {
                        System.out.print(" bean #"+String.valueOf(i)+"/"+String.valueOf(beans.size())
                                        +" Id:" + com.liquid.utility.get(bean, "id")
                                        +" Date:" + com.liquid.utility.get(bean, "date")
                                        );
                        i++;
                    } catch (Throwable ex) {
                        Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }
        }
        return null;
    }

    static public String testValidateLess11 (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"timestamp\":"+System.currentTimeMillis();
        String title = "", error = "", warning = "", message = "";
        boolean fail = false;
        if(params != null) {
            if(tbl_wrk != null) {
                try {
                    HttpServletRequest request = (HttpServletRequest)freeParam;
                    JSONObject rootJSON = new JSONObject((String)params);
                    JSONArray paramsJSON = rootJSON.getJSONArray("params");
                    for(int ip=0; ip<paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if(paramJSON.has("value")) {
                            String value = paramJSON.getString("value");
                            if(value != null) {
                                value = utility.base64Decode(value);
                            }
                            if(Integer.parseInt(value) <= 10) {
                                result += ",\"result\":\""+utility.base64Encode(value)+"\"";
                            } else {
                                fail = true;
                                warning = "Should be <= 10";
                            }
                        }
                    }
                } catch (JSONException ex) {
                    fail = true;
                    Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                    error = "[SERVER] ERROR: "+ex.getLocalizedMessage();
                }
            }
        }
        result += ",\"fail\":"+fail+"";
        result += ",\"title\":\""+title+"\"";
        result += ",\"error\":\""+utility.base64Encode(error)+"\"";
        result += ",\"warning\":\""+utility.base64Encode(warning)+"\"";
        result += ",\"message\":\""+utility.base64Encode(message)+"\"";
        result += "}";
        return result;
    }
    //
    // Fine callback di test
    //


    

    static public String insertRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"result\":1", error = "";
        try {

            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("beforeInsertRow", tbl_wrk, params, clientData, freeParam);
                        if(retVal != null) {
                            if(retVal.getClass() == boolean.class) if ((boolean)retVal == false) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                            if(retVal.getClass() == Integer.class) if ((int)retVal == 0) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" insertRow() Error:" + e.getLocalizedMessage());
            }

            String resAdd = db.insertFields(tbl_wrk, params, clientData, freeParam, (event.eventCallback)null);

            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("afterInsertRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }
            
            result += ",\"details\":["+(resAdd != null && !resAdd.isEmpty() ? resAdd: "\"\"")+"]";
            result += "}";
            return result;
        
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" insertRow() Error:" + e.getLocalizedMessage());
        }
        
        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error)+"\"}";
    }
    
    
    static public String setFieldAsDefault( Connection conn, JSONObject col, int colTypes, int colPrecs, String defaultVlaue, HttpServletRequest request ) throws Exception {
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String colDefault = defaultVlaue, out_string = "";
        boolean autoIncString = false;

        if(colDefault == null || defaultVlaue.isEmpty()) {
            try { colDefault = col.getString("default"); } catch(Exception e) {}            
        }
        if(colDefault != null && !colDefault.isEmpty()) {
            String fieldName = null, fieldValue = null;
            NumberFormat nf = NumberFormat.getInstance();
            
            try { autoIncString = col.getBoolean("autoIncString"); } catch (JSONException e) {}
            
            String bkColDefault = colDefault;
            colDefault = "";
            for(int i=0; i<bkColDefault.length(); i++) {
                if (bkColDefault.charAt(i) == '$' && bkColDefault.charAt(i+1) == '{') {
                    i+= 2;
                    int s = i;
                    while(bkColDefault.charAt(i) != '}' && i<bkColDefault.length()) {
                        i++;
                    }
                    String cVar = bkColDefault.substring(s, i);
                    if(!cVar.isEmpty()) {
                        Object oVar = request.getSession().getAttribute(cVar);
                        String cVarValue = (String)String.valueOf(oVar);
                        colDefault += (cVarValue != null ? cVarValue : "");
                    }
                } else {
                    colDefault += bkColDefault.charAt(i);
                }
            }

            if (!colDefault.startsWith("\"")) {
                boolean isNumeric = false;

                try { isNumeric = StringUtils.isNumeric(colDefault); } catch(Throwable e) {}

                if(autoIncString) {
                    // spetta al db la risoluzione
                    return colDefault;
                    
                } else if(" ".equals(colDefault) || isNumeric) { // casi noti...
                    return colDefault;

                } else {

                    String executingQuery = "SELECT "+colDefault.replace("`", "'") + ";";

                    try {

                        psdo = conn.prepareStatement(executingQuery);
                        rsdo = psdo.executeQuery();


                        if(rsdo != null) {
                            while (rsdo.next()) {
                                if(colTypes == 8) {
                                    double dFieldValue = rsdo.getDouble(1);
                                    if(colPrecs < 0) {
                                        fieldValue = String.format(Locale.US, "%.2f", dFieldValue);
                                    } else {
                                        nf.setMaximumFractionDigits(colPrecs);
                                        fieldValue = nf.format(dFieldValue);
                                    }
                                } else {
                                    fieldValue = rsdo.getString(1);
                                }

                                fieldValue = fieldValue != null ? fieldValue.replace("\"", "\\\"") : "";                                                    
                                return fieldValue;
                            }
                        }
                    } catch (SQLException e) {
                        // maybe user forget sql sintax ...
                        return colDefault;
                        
                    } finally {
                        if(rsdo != null) rsdo.close(); rsdo = null;
                        if(psdo != null) psdo.close(); psdo = null;
                    }
                }
            }
        }
        return "";
    }

    //
    // Evento di SISTEMA onInserting : creazione iniziale del record senza scrittura nel DB
    // 
    static public String onInserting (Object tbl_wrk, Object params, Object clientData, Object requetParam ) {
        String retVal = "", out_string = "", error = "";
        Connection conn = null;
        try {
            if(tbl_wrk != null) {
                // System.out.println(" onInserting() Raised");
                JSONObject rootJSON = null;
                JSONArray paramsJSON = null;
                JSONObject rowData = null;
                workspace liquid = (workspace)tbl_wrk;
                HttpServletRequest request = (HttpServletRequest)requetParam;
                String schema = null;
                String table = null;
                try { schema = liquid.tableJson.getString("schema"); } catch (Exception e) {}
                try { table = liquid.tableJson.getString("table"); } catch (Exception e) {}
                try { rootJSON = new JSONObject((String)params); } catch (Exception e) {}
                try { paramsJSON = (rootJSON != null ? rootJSON.getJSONArray("params") : null); } catch (Exception e) {}

                if(paramsJSON != null) {
                    for(int ip=0; ip<paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if(paramJSON.has("data")) {
                            rowData = (JSONObject)paramJSON.getJSONObject("data");                    
                        }
                    }                    
                }
                
                conn = connection.getConnection(null, request, ((workspace)tbl_wrk).tableJson);
                if(conn!=null) {                
                    long cRow = 0;
                    long lStartTime = 0;
                    long lQueryTime = 0;
                    long lRetrieveTime = 0;
                    
                    try {
                    
                        if(conn != null) {
                            JSONArray cols = liquid.tableJson.getJSONArray("columns");
                            ArrayList<String> defaultVlaues = new ArrayList<String>();
                            int [] colTypes = new int[cols.length()];
                            int [] colPrecs = new int[cols.length()];
                            for(int ic=0; ic<cols.length(); ic++) {
                                try { colTypes[ic] = Integer.parseInt( cols.getJSONObject(ic).getString("type") ); } catch (Exception e) {}
                                try { colPrecs[ic] = Integer.parseInt( cols.getJSONObject(ic).getString("precision") ); } catch (Exception e) { colPrecs[ic] = -1; }
                                if(rowData != null) {
                                    defaultVlaues.add(rowData.getString(cols.getJSONObject(ic).getString("field")));
                                } else {
                                    defaultVlaues.add("");
                                }
                            }
                            
                            out_string += "{";
                            
                            for(int ic=0; ic<cols.length(); ic++) {
                                
                                lStartTime = System.currentTimeMillis();
                                
                                try {

                                    String fieldName = null;
                                    JSONObject col = cols.getJSONObject(ic);
                                    
                                    // N.B.: defaultVlaues, ovvero il dato elaborato e passato dal client, prevale sulla definizione di default del DB
                                    String colDefault = defaultVlaues != null ? defaultVlaues.get(ic) : null;
                                    colDefault = setFieldAsDefault(conn, col, colTypes[ic], colPrecs[ic], colDefault, request);

                                    try { fieldName = col.getString("field"); } catch(Exception e) {}
                                    if(fieldName == null || fieldName.isEmpty()) {
                                        try { fieldName = col.getString("name"); } catch(Exception e) {}
                                    }

                                    if(cRow>0) out_string += ",";                                                    
                                    out_string += "\""+fieldName+"\":\"" + (colDefault != null ? colDefault.replace("\\", "\\\\").replace("\"", "\\\"") : "") + "\"";
                                    cRow++;
                  
                                    if(out_string.charAt(out_string.length()-1) == ',') {
                                        System.err.println("Error at cRow:"+cRow+" invalid char");
                                    }
                                    
                                } catch(Exception e) {
                                    // N.B.: Segnala l'errore ma conrinua l'esecuzione
                                    // TODO : Gestire la possibilita di fermare la procedura
                                    error += "[ Retrieve Error:" + e.getLocalizedMessage()+" ]";
                                    System.err.println("Retrieve Error at cRow:"+cRow+":" + e.getLocalizedMessage() );
                                }

                                lRetrieveTime += System.currentTimeMillis() - lStartTime;
                            }
                            out_string += "}";
                        }
                    } catch(Exception e) {
                        error += " ["+(liquid.controlId)+"] Query Error:"+e.getLocalizedMessage();
                        System.err.println("Error:" + e.getLocalizedMessage());
                    }
                    
                    retVal = "{" 
                            + "\"resultSet\":["
                            + out_string
                            + "]"
                            + ",\"error\":\"" + utility.base64Encode((error != null ? error : "")) + "\""
                            + "}";
                    
                    return retVal;
                }
            }
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            retVal = "{\"error\":\""+utility.base64Encode("Fatal error:"+th.getLocalizedMessage())+"\"}";
            
        } finally {
            try {
                if(conn != null)
                    conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }        
        return retVal;
    }
    static public String onInserted (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    
    //
    // Callback per test overlay evento di sistema
    // Per Test : "events":[ "name":"onInserting" : "com.liquid.event.onInsertingRow" ...]
    //
    static public String onInsertingRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        System.out.println(" TEST : onInsertingRow() Raised");
        return null;
    }
    // Per Test con "events":[ ... "com.liquid.event.onInsertingRow" ...]
    static public String onInsertedRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        System.out.println(" TEST : onInsertedRow() Raised");
        return null;
    }

    
    // Evento di SISTEMA Risoluzione dei campi rimasti al default e inserimento del record nel DB
    // Per Test con "owner":"com.liquid.event"
    static public String onPastedRow (Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        String retVal = "", out_string = "", error = "";
        Connection conn = null;
        try {
            if(tbl_wrk != null) {
                // System.out.println(" onPasted() Raised");
                HttpServletRequest request = (HttpServletRequest)requestParam;
                workspace liquid = (workspace)tbl_wrk;
                String schema = null;
                String table = null;
                try { schema = liquid.tableJson.getString("schema");  } catch (Exception e) {}
                try { table = liquid.tableJson.getString("table");  } catch (Exception e) {}

                conn = connection.getConnection(null, request, ((workspace)tbl_wrk).tableJson);
                if(conn!=null) {
                    long cRow = 0;
                    long lStartTime = 0;
                    long lQueryTime = 0;
                    long lRetrieveTime = 0;
                    
                    // NO : clientData è sull' URL e quindi limitato
                    // JSONObject rowData = new JSONObject( ((String)clientData).replaceAll("\n", "\\n") );
                    
                    JSONObject rootJSON = new JSONObject((String)params);
                    JSONArray paramsJSON = rootJSON.getJSONArray("params");
                    for(int ip=0; ip<paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if(paramJSON.has("data")) {
                            JSONObject rowData = (JSONObject)paramJSON.getJSONObject("data");                    


                            // Risoluzione campi di default (tipicamente chiave primaria)
                            JSONArray cols = liquid.tableJson.getJSONArray("columns");
                            int [] colTypes = new int[cols.length()];
                            int [] colPrecs = new int[cols.length()];
                            for(int ic=0; ic<cols.length(); ic++) {
                                try { colTypes[ic] = Integer.parseInt( cols.getJSONObject(ic).getString("type") ); } catch (Exception e) {}
                                try { colPrecs[ic] = Integer.parseInt( cols.getJSONObject(ic).getString("precision") ); } catch (Exception e) { colPrecs[ic] = -1; }
                            }

                            for(int ic=0; ic<cols.length(); ic++) {

                                try {

                                    String fieldData = rowData.getString( cols.getJSONObject(ic).getString("field") );
                                    String fieldName = null;
                                    JSONObject col = cols.getJSONObject(ic);

                                    if(col.has("default")) {
                                        if(fieldData.equalsIgnoreCase(col.getString("default"))) {
                                            boolean autoIncString = false;
                                            try { autoIncString = col.getBoolean("autoIncString"); } catch (JSONException e) {}
                                            if(!autoIncString) {
                                                fieldData = setFieldAsDefault(conn, col, colTypes[ic], colPrecs[ic], null, request);
                                                rowData.put( String.valueOf(ic+1), fieldData );
                                            }
                                        }
                                    }

                                } catch(Exception e) {
                                    // N.B.: Segnala l'errore ma conrinua l'esecuzione
                                    // TODO : Gestire la possibilita di fermare la procedura
                                    error += "[ Retrieve Error:" + e.getLocalizedMessage()+" ]";
                                    System.err.println("Retrieve Error at cRow:"+cRow+":" + e.getLocalizedMessage() );
                                }

                            lRetrieveTime += System.currentTimeMillis() - lStartTime;
                            }

                            // Inserimento record
                            String sModifications = "";
                            String sFields = "";
                            JSONArray fieldsJSON = new JSONArray();
                            for(int ic=0; ic<cols.length(); ic++) {
                                String fieldData = rowData.getString( String.valueOf(ic+1) );
                                JSONObject fieldJSON = new JSONObject();
                                fieldJSON.put("field", cols.getJSONObject(ic).getString("field") );
                                fieldJSON.put("value", fieldData );
                                fieldsJSON.put(fieldJSON);
                            }
                            // sFields = (sFields.length()>0?",":"")+"{\"field\":\""+cols.getJSONObject(ic).getString("field")+"\",\"value\":\""+(fieldData != null ? fieldData : "")+"\"}";
                            sFields = fieldsJSON.toString();
                            sModifications += "{\"rowId\":\"\",\"fields\":"+sFields+"}";


                            String insertingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                            // JSONObject insertingParamsJson = new JSONObject( insertingParams );

                            return db.insertFields(tbl_wrk, insertingParams, clientData, requestParam, null);
                        }
                    }
                }
            } else {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, "No workspace defined");
                retVal = "{\"error\":\""+utility.base64Encode("No workspace defined")+"\"}";
            }
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            retVal = "{\"error\":\""+utility.base64Encode("Fatal error:"+th.getLocalizedMessage())+"\"}";
            
        } finally {
            try {
                if(conn != null)
                    conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }        
        return retVal;
    }
    
    
    // Evento di Systema aggiornamento riga da GUI
    static public String updateRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"result\":1", error = "";
        try {
            
            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("onUpdatingRow", tbl_wrk, params, clientData, freeParam);
                        if(retVal != null) {
                            if(retVal.getClass() == boolean.class) if ((boolean)retVal == false) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                            if(retVal.getClass() == Integer.class) if ((int)retVal == 0) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }

            String resUpd = db.updateFields(tbl_wrk, params, clientData, freeParam, (event.eventCallback)null);

            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("onUpdatedRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }
            
            result += ",\"details\":["+(resUpd != null && !resUpd.isEmpty() ? resUpd: "\"\"")+"]";
            result += "}";
            return result;
        
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
        }
        
        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error)+"\"}";
    }
    // Evento di SISTEMA onUpdating : aggiornamento iniziale del record senza scrittura nel DB
    // Per Test con "owner":"com.liquid.event"
    static public String onUpdating (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    static public String onUpdated (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    // Per Test con "events":[ ... "com.liquid.event.onUpdatingRow" ...]
    static public String onUpdatingRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    



    // Evento di Systema cancellazione riga
    static public String deleteRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"result\":1", error = "";
        
        try {

            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("onDeletingRow", tbl_wrk, params, clientData, freeParam);
                        if(retVal != null) {
                            if(retVal.getClass() == boolean.class) if ((boolean)retVal == false) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                            if(retVal.getClass() == Integer.class) if ((int)retVal == 0) return "{ \"result\":0\", \"msg\":\"stopped\"}";
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
            }

            String resDel = db.deleteRow(tbl_wrk, params, clientData, freeParam, (event.eventCallback)null);

            try {
                if(tbl_wrk != null) {
                    workspace tblWrk = (workspace)tbl_wrk;
                    if(tblWrk.owner != null) {
                        Object retVal = forwardEvent("onDeletedRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
            }
            
            result += ",\"details\":["+(resDel != null && !resDel.isEmpty() ? resDel: "\"\"")+"]";
            result += "}";
            return result;
        
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
        }
        
        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error)+"\"}";
    }
    // Evento di SISTEMA onDeleting : cancellazione iniziale del record senza scrittura nel DB
    // Per Test con "owner":"com.liquid.event"
    static public String onDeleting (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    static public String onDeleted (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    // Per Test con "events":[ ... "com.liquid.event.onDeletingRow" ...]
    static public String onDeletingRow (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        return null;
    }
    
    
    // Per Test con "events":[ ... "com.liquid.event.onRetrieveRows" ...]
    static public String onRetrieveRows (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        // System.out.println(" onRetrieveRows() Raised");
        return null;
    }
    

    ///////////////////
    // Servizi DMS
    //
    static public String getDocuments (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                Class cls = null;
                try {
                    // collecting keys for the link
                    ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (String)params);
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("getDocuments", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String)method.invoke(classInstance, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)keyList);            
                } catch(Throwable th) {
                    System.err.println(" app.liquid.dms.connection.getDocuments() Error:" + th.getLocalizedMessage());
                    Method[] methods = cls.getMethods();
                    for(int i=0; i<methods.length; i++) {
                        System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" getDocuments() error:" + e.getLocalizedMessage());
        }
        return result;
    }

    static public String uploadDocument (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                Class cls = null;
                try {
                    // TODO : controllo della dimensione del file
                    HttpServletRequest request = (HttpServletRequest)freeParam;
                    if(request != null) {
                        // data:*/*;base64,
                        if(tblWrk != null) {
                            if(clientData != null) {
                                String docName = (String)clientData;
                                if(docName != null) {
                                    JSONArray documents = tblWrk.tableJson.getJSONArray("documents");
                                    for(int i=0; i<documents.length(); i++) {
                                        JSONObject document = (JSONObject)documents.get(i);
                                        if(document != null) {
                                            if(docName.equalsIgnoreCase(document.getString("name"))) {
                                                if(document.has("maxSize")) {
                                                    
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        JSONObject paramsJson = new JSONObject((String)params);
                        JSONObject paramJson = paramsJson.getJSONObject("params");
                        String file = paramJson.getString("file");
                        
                        Path path = new File(file).toPath();
                        if(path != null) {
                            // fileContent = Files.readAllBytes( path ) ;
                            paramJson.put("nimeType", Files.probeContentType(path));
                            params = paramsJson.toString();
                        }

                        // collecting keys for the link
                        ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (String)params);
                        
                        cls = Class.forName("app.liquid.dms.connection");
                        Object classInstance = (Object) cls.newInstance();
                        Method method = cls.getMethod("uploadDocument", Object.class, Object.class, Object.class, Object.class);
                        return (String)method.invoke(classInstance, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)keyList);
                    }
                } catch(Throwable th) {
                    System.err.println(" app.liquid.dms.connection.uploadDocument() Error:" + th.getLocalizedMessage());
                    Method[] methods = cls.getMethods();
                    for(int i=0; i<methods.length; i++) {
                        System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" uloadDocuments() error:" + e.getLocalizedMessage());
        }
        return result;
    }

    static public String downloadDocument (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String error = "", resultSet = "";
        Object [] result = null;
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                Class cls = null;
                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("downloadDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    result = (Object [])method.invoke(classInstance, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)freeParam);

                    try {
                        HttpServletRequest request = (HttpServletRequest)freeParam;
                        HttpServletResponse response = (HttpServletResponse)request.getAttribute("response");
    
                        String fileName = (String)result[0];
                        String fileMimeType = (String)result[1];
                        byte[] fileContent = (byte[])result[2];
                        response.setContentType(fileMimeType);
                        response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
                    } catch (Exception e) {}
                    
                } catch(Throwable th) {
                    System.err.println(" app.liquid.dms.connection.downloadDocument() Error:" + th.getLocalizedMessage());
                    Method[] methods = cls.getMethods();
                    for(int i=0; i<methods.length; i++) {
                        System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" downloadDocument() error:" + e.getLocalizedMessage());
        }
        return null;
    }

    static public String deleteDocument (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                Class cls = null;
                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("deleteDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String)method.invoke(classInstance, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)freeParam);
                } catch(Throwable th) {
                    System.err.println(" app.liquid.dms.connection.deleteDocument() Error:" + th.getLocalizedMessage());
                    Method[] methods = cls.getMethods();
                    for(int i=0; i<methods.length; i++) {
                        System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" deleteDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }

    static public String updateDocument(Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                Class cls = null;
                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("updateDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String)method.invoke(classInstance, (Object)tbl_wrk, (Object)params, (Object)clientData, (Object)freeParam);
                } catch(Throwable th) {
                    System.err.println(" app.liquid.dms.connection.updateDocument() Error:" + th.getLocalizedMessage());
                    Method[] methods = cls.getMethods();
                    for(int i=0; i<methods.length; i++) {
                        System.err.println(" Method #"+(i+1)+":" + methods[i].toString());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" updateDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }
    
    
        
    
    static public String init (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        String result = "{ \"result\":1", error = "";
        try {            
            result += "}";
            return result;        
        } catch (Exception e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" init() Error:" + e.getLocalizedMessage());
        }
        
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                if(tblWrk.owner != null) {
                    forwardEvent("onInit", tbl_wrk, params, clientData, freeParam);
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" init() Error:" + e.getLocalizedMessage());
        }
        
        return "{ \"error\":\"" + utility.base64Encode(error)+"\"}";
    }
    
    static public Object close (Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        Object result = null;
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                if(tblWrk.owner != null) {
                    result = forwardEvent("onclose", tbl_wrk, params, clientData, freeParam);
                }
            }
        } catch (Throwable e) {
            System.err.println(" close() Error:" + e.getLocalizedMessage());
        }
        return "{ \"result\":\"" + (result != null?utility.base64Encode(result.toString()):"") + "\"}";
    }

    static public Object forwardEvent (String eventName, Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        try {
            if(tbl_wrk != null) {
                workspace tblWrk = (workspace)tbl_wrk;
                if(tblWrk.owner != null) {
                    return forwardEvent( eventName, tbl_wrk, tblWrk.owner, params, clientData, freeParam );    
                }
            }
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    static public Object forwardEvent (String eventName, Object tbl_wrk, Object owner, Object params, Object clientData, Object freeParam ) {
        try {
            if(owner != null) {
                String className = null;
                Class<?> enclosingClass = owner.getClass().getEnclosingClass();
                if (enclosingClass != null) {
                    className = enclosingClass.getName();
                } else {
                    className = owner.getClass().getName();
                }
                Class cls = Class.forName(className);
                Method method = cls.getMethod(eventName, Object.class, Object.class, Object.class, Object.class);
                return (Object)method.invoke(owner, tbl_wrk, params, clientData, freeParam);
            }
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    
    
    static public Object forwardEvent (String eventName, Object tbl_wrk, String ownerClassName, Object params, Object clientData, Object freeParam ) {
        try {
            if(ownerClassName != null && !ownerClassName.isEmpty()) {
                String sMethod = "";
                String [] classParts = ownerClassName.replace(" ", ".").split("\\.");
                String objectClassName = "";
                Object classInstance = null;
                Class cls = null;

                if(classParts.length > 1) {
                    if(classParts.length > 1) {
                        sMethod = classParts[classParts.length-1].replace("()", "");
                        for(int i=0; i<classParts.length-1; i++) {
                            objectClassName += (objectClassName.length()>0?".":"")+classParts[i];
                        }
                    }
                    cls = Class.forName(objectClassName);
                    if(classInstance == null)
                        classInstance = (Object) cls.newInstance();
                    if(classInstance != null) {
                        Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
                        return (Object)method.invoke(classInstance, tbl_wrk, params, clientData, freeParam);
                    }
                } else {
                    System.err.println(" forwardEvent() on event "+eventName+" invalid ownerClassName :" + ownerClassName + " (should be package.class.method)");
                }
                
            }
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    
    //
    // event for tests    
    //
    static public Object longTimeTaskTest (Object owner, Object params, Object clientData, Object freeParam ) {
        try {
            Thread.sleep(30000);
            return "{ \"client\":\"\", \"message\":\""+utility.base64Encode("longTimeTaskTest Done")+"\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    static public Object longTimeTaskMessageTest (Object owner, Object params, Object clientData, Object freeParam ) {
        try {
            Thread.sleep(1000);
            String selectedAction = "";
            int revVal = Messagebox.show( " Test QUESTION message .. select an action : ", "Liquid", Messagebox.IGNORE+Messagebox.ABORT+Messagebox.RETRY+Messagebox.QUESTION);
            if(revVal == Messagebox.RETRY) {
                selectedAction = "RETRY";
            } else if(revVal == Messagebox.IGNORE) {
                selectedAction = "IGNORE";
            } else if(revVal == Messagebox.ABORT) {
                selectedAction = "ABORT";
            } else {
                selectedAction = "TIMEOUT";
            }
            return "{ \"client\":\"\", \"message\":\""+utility.base64Encode("longTimeTaskMessageTest Done. Selected action:"+selectedAction)+"\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    
    static public Object longTimeTaskJavascriptTest (Object owner, Object params, Object clientData, Object freeParam ) {
        try {
            Thread.sleep(1000);
            String revVal = JSScript.script("prompt('Type any data','')", JSScript.SYNC);
            JSScript.script("alert('You typed:"+revVal+"')", JSScript.ASYNC);
            Thread.sleep(3000);            
            return "{ \"client\":\"\", \"message\":\""+utility.base64Encode("longTimeTaskJavascriptTest Done. result:"+revVal)+"\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }
    
    static public Object longTimeTaskCallbackTest (Object owner, Object params, Object clientData, Object freeParam ) throws InterruptedException {
        int n = 10;
        for (int i=0; i<n; i++) {
            Thread.sleep(1000);
            Callback.send("Phase "+(i+1)+"/"+n+" done... [ time tick: "+System.currentTimeMillis()+"]");
        }
        return "{ \"client\":\"\", \"message\":\""+utility.base64Encode("longTimeTaskCallbackTest Done")+"\" }";
    }
            
    
    static public JSONArray getJSONArray (Object params, String paramName ) {
        if(params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String)params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                for(int ip=0; ip<paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if(paramJSON.has(paramName)) {
                        return paramJSON.getJSONArray(paramName);
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }
    
    static public JSONObject getJSONObject (Object params, String paramName ) {
        if(params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String)params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                for(int ip=0; ip<paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if(paramJSON.has(paramName)) {
                        return paramJSON.getJSONObject(paramName);
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }
    static public Object getObject (Object params, String paramName ) {
        if(params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String)params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                for(int ip=0; ip<paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if(paramJSON.has(paramName)) {
                        return paramJSON.get(paramName);
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }    
    
}
