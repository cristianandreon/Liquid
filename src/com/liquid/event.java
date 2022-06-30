/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

package com.liquid;

import com.liquid.python.python;
import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.ServletContext;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidParameterException;
import java.sql.*;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

public class event {

    public interface eventCallback<T extends Object> {

        /**
         * <h3>Get the bean by primary keys</h3>
         * <p>
         * This method get bean from the primary key list, creating it at
         * runtime
         *
         * @param p1 the control workspace (Object)
         * @param p2 the parameters of the call, in json format (String)
         * @param p3 the client data (command, event, validator, etc), in json
         * format (String)
         * @param p4 the Http request (HttpServletRequest)
         * @param p5 the instance class of the callback to call before return
         * (Object)
         *
         * @return less than 0 for fail, 0 for none, greater than 0 for success
         * @see db
         */
        String callback(Object p1, Object p2, Object p3, Object p4, Object p5);
    }

    static public String execute(HttpServletRequest request, JspWriter out) {
        String errorJson = "", error = "", retVal = "";
        String sClassName = null;
        String params = "";
        String clientData = "";
        String controlId = "";
        String owner = "";
        String tblWrk = "";

        try {

            try {
                sClassName = request.getParameter("className");
            } catch (Exception ignored) {
            }
            try {
                clientData = request.getParameter("clientData");
            } catch (Exception e) {
            }
            try {
                controlId = request.getParameter("controlId");
            } catch (Exception e) {
            }
            try {
                owner = request.getParameter("owner");
            } catch (Exception e) {
            }
            try {
                tblWrk = request.getParameter("tblWrk");
            } catch (Exception e) {
            }
            workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk != null && !tblWrk.isEmpty() ? tblWrk : controlId);
            if (tbl_wrk == null) {
                // nessuna definizione del controllo
            }

            /* NO : la ricevente toglie il carattere finale all'occorrenza
            if(params.endsWith("\n"))
                params = params.substring(0, params.length()-1);
             */
            params = workspace.get_request_content(request);

            try {

                String [] classNames = sClassName.split(",");


                for (String className:classNames) {

                    // get instance and method
                    Object[] result = get_method_by_class_name(className, tbl_wrk, owner);
                    if (result != null) {
                        Object classInstance = result[0];
                        Method method = (Method) result[1];

                        if (method != null && classInstance != null) {
                            String subRetVal = (String)method.invoke(classInstance, tbl_wrk, params, clientData, (Object) request);
                            retVal = utility.mergeJsonObject(retVal, subRetVal);
                        }
                    } else {
                        System.err.println("class not found : " + className);
                    }
                    // executing events as syncronous chain
                    try {
                        String subRetVal = process_next_event(retVal, tbl_wrk, params, clientData, (Object) request);
                        retVal = utility.mergeJsonObject(retVal, subRetVal);
                    } catch (Exception e) {
                        System.err.println(e);
                    }
                }

            } catch (InvocationTargetException ite) {
                final Throwable cause = ite.getTargetException();
                error = ite.getCause().getLocalizedMessage();
                System.err.println("nested exception - " + cause + " " + ite.getCause());

            } catch (Throwable th) {
                error = "Error in class.method:" + sClassName + " (" + th.getLocalizedMessage() + ")";
                System.err.println(" execute() [" + controlId + "] Error:" + th.getLocalizedMessage());
            }

            if (error != null && !error.isEmpty()) {
                errorJson = "{ \"error\":\"" + utility.base64Encode(error.getBytes()) + "\"}";
            }

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" execute() [" + controlId + "] Error:" + e.getLocalizedMessage());
            errorJson = "{ \"error\":\"" + utility.base64Encode(error.getBytes()) + "\"}";
        }

        return errorJson != null && !errorJson.isEmpty() ? errorJson : retVal;
    }


    /**
     *
     * @param className
     * @param tbl_wrk
     * @param owner
     * @return
     * @throws ClassNotFoundException
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws NoSuchMethodException
     * @throws Exception
     */
    static public Object[] get_method_by_class_name(String className, workspace tbl_wrk, String owner) throws ClassNotFoundException, InstantiationException, IllegalAccessException, NoSuchMethodException, Exception {
        if (className != null && !className.isEmpty()) {
            String objectClassName = className;
            String sMethod = "";
            String[] classParts = className.replace(" ", ".").split("\\.");
            Object classInstance = null, wrkOwner = null;
            Class cls = null;

            if (tbl_wrk != null) {
                wrkOwner = tbl_wrk.getOwner();
            }
            
            if (wrkOwner != null) {
                classInstance = wrkOwner;
                sMethod = className;
                cls = classInstance.getClass();

            } else if (owner != null && !owner.isEmpty()) {
                try {
                    cls = Class.forName(owner);
                    classInstance = cls.newInstance();
                    sMethod = className;
                } catch (Throwable th) {
                    // happens when tomcat redeploy at developing time
                }
            }
            if (classInstance == null || classParts.length > 1) {
                if (classParts.length > 1) {
                    objectClassName = "";
                    sMethod = classParts[classParts.length - 1].replace("()", "");
                    for (int i = 0; i < classParts.length - 1; i++) {
                        objectClassName += (objectClassName.length() > 0 ? "." : "") + classParts[i];
                    }
                }
                cls = Class.forName(objectClassName);
                if (classInstance == null) {
                    classInstance = (Object) cls.newInstance();
                }
            }
            if (classInstance != null) {
                try {
                    Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
                    return new Object[]{classInstance, method};
                } catch (Throwable th1) {
                    try {
                        Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class);
                        return new Object[]{classInstance, method};
                    } catch (Throwable th2) {
                        try {
                            Method method = cls.getMethod(sMethod, Object.class, Object.class);
                            return new Object[]{classInstance, method};
                        } catch (Throwable th3) {
                            try {
                                Method method = cls.getMethod(sMethod, Object.class);
                                return new Object[]{classInstance, method};
                            } catch (Throwable th4) {
                                try {
                                    Method method = cls.getMethod(sMethod);
                                    return new Object[]{classInstance, method};
                                } catch (Throwable th5) {
                                    Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, th5);
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }


    /**
     *
     * @param className
     * @param classOrInstance
     * @return
     * @throws ClassNotFoundException
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws NoSuchMethodException
     */
    static public Object[] get_method_by_class_name(String className, Object classOrInstance) throws ClassNotFoundException, InstantiationException, IllegalAccessException, NoSuchMethodException {
        if (className != null && !className.isEmpty()) {
            String objectClassName = className;
            String sMethod = "";
            String[] classParts = className.replace(" ", ".").split("\\.");
            Class cls = null;
            Object classInstance = null;

            sMethod = className;
            if (classOrInstance instanceof Class) {
                cls = (Class) classOrInstance;
                classInstance = (Object) ((Class) classOrInstance).newInstance();
            } else {
                classInstance = classOrInstance;
            }

            if (classInstance == null || classParts.length > 1) {
                if (classParts.length > 1) {
                    objectClassName = "";
                    sMethod = classParts[classParts.length - 1].replace("()", "");
                    for (int i = 0; i < classParts.length - 1; i++) {
                        objectClassName += (objectClassName.length() > 0 ? "." : "") + classParts[i];
                    }
                }
                if (classInstance == null) {
                    cls = Class.forName(objectClassName);
                    classInstance = (Object) cls.newInstance();
                }
            }
            if (classInstance != null) {
                try {
                    Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
                    return new Object[]{classInstance, method};
                } catch (Throwable th) {
                }
                try {
                    Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class);
                    return new Object[]{classInstance, method};
                } catch (Throwable th) {
                }
                try {
                    Method method = cls.getMethod(sMethod, Object.class, Object.class);
                    return new Object[]{classInstance, method};
                } catch (Throwable th) {
                }
                try {
                    Method method = cls.getMethod(sMethod, Object.class);
                    return new Object[]{classInstance, method};
                } catch (Throwable th) {
                }
                try {
                    Method method = cls.getMethod(sMethod);
                    return new Object[]{classInstance, method};
                } catch (Throwable th) {
                }
            }
        }
        return null;
    }

    /**
     *
     * @param clsInstance
     * @param methodName
     * @param params
     * @return
     * @throws ClassNotFoundException
     * @throws NoSuchMethodException
     * @throws InvocationTargetException
     * @throws IllegalAccessException
     */
    public static Object invoke (Object clsInstance, String methodName, Object [] params) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Class cls = Class.forName(clsInstance.getClass().getName());
        Method method = null;
        if (cls != null) {
            method = cls.getMethod(methodName);
        }
        if (method != null && clsInstance != null) {
            if(params == null) {
                return method.invoke(clsInstance);
            } else {
                // TODO : PASSAGGIO ARGOMENTI
                return method.invoke(clsInstance, params);
            }
        }
        return null;
    }


    /**
     *
     * @param currentRetVal
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     * @throws Exception
     */
    static public String process_next_event(String currentRetVal, Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Exception {
        String retVal = currentRetVal, errors = "";
        if (tbl_wrk != null) {
            workspace liquid = (workspace) tbl_wrk;
            JSONObject eventJson = clientData != null ? new JSONObject((String) clientData) : null;
            Object client = null;
            if (eventJson != null) {
                if (eventJson.has("cypher")) {
                    if (eventJson.has("name")) {
                        String cypher = eventJson.getString("cypher");
                        String name = eventJson.getString("name");
                        if (cypher != null && !cypher.isEmpty()) {
                            if (name != null && !name.isEmpty()) {
                                // client may be array or string
                                client = eventJson.has("client") ? eventJson.get("client") : null;
                                JSONArray events = liquid.tableJson.getJSONArray("events");
                                if (events != null) {
                                    for (int ievt = 0; ievt < events.length(); ievt++) {
                                        JSONObject event = events.getJSONObject(ievt);
                                        if (event != null) {
                                            String uname = event.has("name") ? event.getString("name") : "";
                                            String ucypher = event.has("cypher") ? event.getString("cypher") : "";
                                            String uServer = event.has("server") ? event.getString("server") : "";
                                            Object uClient = event.has("client") ? event.get("client") : null;
                                            if (uname.equalsIgnoreCase(name)) {
                                                if (!ucypher.equalsIgnoreCase(cypher)) {
                                                    // event to execute
                                                    String uClientData = event.toString();
                                                    String uRetVal = null;
                                                    if (uServer != null && !uServer.isEmpty()) {
                                                        // get instance and method
                                                        Object[] result = get_method_by_class_name(uServer, liquid, null);
                                                        Object classInstance = result[0];
                                                        Method method = (Method) result[1];

                                                        if (classInstance != null && method != null) {
                                                            // encapsulate previous result in current params .. depending of event type ???
                                                            params = transfer_result_to_params(retVal, (String) params);

                                                            uRetVal = (String) method.invoke(classInstance, (Object) liquid, (Object) params, (Object) uClientData, (Object) requestParam);
                                                            if (uRetVal != null && !uRetVal.isEmpty()) {
                                                                // set new result
                                                                retVal = transfer_result_to_results(uRetVal, retVal);
                                                            }
                                                        } else {
                                                            errors += "[Error processing next event:" + uname + "on control:" + liquid.controlId + " server:" + uServer + "]";
                                                        }
                                                    }
                                                    // client code from json
                                                    if (uClient != null) {
                                                        // encapsulate client data
                                                        if (client == null) {
                                                            client = new JSONArray();
                                                        }
                                                        JSONArray clientJSON = (JSONArray) client;
                                                        if (clientJSON != null) {
                                                            if (uClient instanceof JSONArray) {
                                                                JSONArray uClientJSON = (JSONArray) uClient;
                                                                clientJSON.put(uClientJSON);
                                                            } else if (uClient instanceof String) {
                                                                String uClientString = (String) uClient;
                                                                if (!uClientString.isEmpty()) {
                                                                    clientJSON.put(uClientString);
                                                                    client = (Object) clientJSON;
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
            if (client != null) {
                transfer_client_to_result(client, retVal);
            }
        }
        return retVal;
    }



    /**
     * Transfer client param to parameter for next event process
     *
     * @param clientToTransfer
     * @param result
     * @return
     * @throws JSONException
     */
    static public String transfer_client_to_result(Object clientToTransfer, String result) throws JSONException {
        if(result != null && !result.isEmpty()) {
            JSONObject retValJSON = new JSONObject(result);
            if (clientToTransfer != null) {
                if (retValJSON.has("client")) {
                    Object retValClient = retValJSON.get("client");
                    JSONArray newRetValClient = null;
                    if (retValClient instanceof String) {
                        if (clientToTransfer instanceof String) {
                            newRetValClient = new JSONArray();
                            newRetValClient.put(retValClient);
                            newRetValClient.put(clientToTransfer);
                        } else if (clientToTransfer instanceof JSONArray) {
                            newRetValClient = new JSONArray();
                            newRetValClient.put(retValClient);
                            for (int i = 0; i < ((JSONArray) clientToTransfer).length(); i++) {
                                newRetValClient.put(((JSONArray) clientToTransfer).get(i));
                            }
                        }
                        if (newRetValClient != null) {
                            retValJSON.put("client", newRetValClient);
                        }

                    } else if (retValClient instanceof JSONArray) {
                        if (clientToTransfer instanceof String) {
                            ((JSONArray) retValClient).put(clientToTransfer);
                        } else if (clientToTransfer instanceof JSONArray) {
                            for (int i = 0; i < ((JSONArray) clientToTransfer).length(); i++) {
                                ((JSONArray) retValClient).put(((JSONArray) clientToTransfer).get(i));
                            }
                        }
                        retValJSON.put("client", retValClient);
                    }
                }
            }
            return retValJSON.toString();
        } else {
            return result;
        }
    }

    /**
     *
     * Transfer result to parameter of next event process
     *  ex.:
     *      {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     *          to
     *      {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     *
     * @param retValToTransfer
     * @param params
     * @return
     * @throws JSONException
     */
    static public String transfer_result_to_params(String retValToTransfer, String params) throws JSONException {
        String retVal = params;
        JSONObject retValJSON = new JSONObject((String) retValToTransfer);
        JSONObject rootJSON = new JSONObject((String) params);
        JSONArray paramsJSON = rootJSON.getJSONArray("params");

        if (retValJSON.has("resultSet")) {
            JSONArray resultsSetJSON = retValJSON.getJSONArray("resultSet");
            for (int ir = 0; ir < resultsSetJSON.length(); ir++) {
                JSONObject resultSetJSON = (JSONObject) resultsSetJSON.getJSONObject(ir);
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = (JSONObject) paramsJSON.get(ip);
                    if (paramJSON.has("data")) {
                        JSONObject dataJSON = paramJSON.getJSONObject("data");
                        for (Object keyObject : JSONObject.getNames(resultSetJSON)) {
                            String key = (String) keyObject;
                            Object obj = resultSetJSON.get(key);
                            dataJSON.put(key, obj);
                        }
                    }
                }
                retVal = rootJSON.toString();
            }
        }
        for (String key : new String[]{"error", "warning", "message"}) {
            if (retValJSON.has(key)) {
                rootJSON.put(key, retValJSON.getString(key));
                retVal = rootJSON.toString();
            }
        }
        return retVal;
    }


    /**
     *
     * Transfer current result to result for next event process
     *   ex.:
     *       {"resultSet":[{"1":"85","2":"","3":"","4":"","5":"2020-05-10 15:28:15.880412+02"}],"error":""}
     *           to
     *       {"params":[{"data":{"1":"nextval(`liquidx.feedbacks_message_seq`::regclass)","2":"","3":"","4":"","5":"CURRENT_TIMESTAMP"}}]}
     *
     * @param retValToTransfer
     * @param retValTarget
     * @return
     * @throws JSONException
     */
    static public String transfer_result_to_results(String retValToTransfer, String retValTarget) throws JSONException {
        String retVal = retValTarget;
        JSONObject retValToTransferJSON = new JSONObject((String) retValToTransfer != null ? retValToTransfer : "{}");
        JSONObject retValTargetJSON = new JSONObject((String) retValTarget);

        if (retValToTransferJSON.has("resultSet")) {
            Object resultSetToTranfserJSON = retValToTransferJSON.get("resultSet");
            retValTargetJSON.put("resultSet", resultSetToTranfserJSON);
            retVal = retValTargetJSON.toString();
        }
        for (String key : new String[]{"tables", "foreignTables"}) {
            if (retValToTransferJSON.has(key)) {
                JSONArray resultSetToTranfserJSONList = retValToTransferJSON.getJSONArray(key);
                if (retValTargetJSON.has(key)) {
                    JSONArray retValTargetJSONList = retValTargetJSON.getJSONArray(key);
                    if(retValTargetJSON.has(key)) {
                        for(int it=0; it<resultSetToTranfserJSONList.length(); it++) {
                            JSONObject t = resultSetToTranfserJSONList.getJSONObject(it);
                            if(t != null) {
                                String tName = t.getString("table");
                                retValTargetJSONList.put(t);
                            }
                        }
                    }
                } else {
                    retValTargetJSON.put(key, resultSetToTranfserJSONList);
                }
            }
        }
        for (String key : new String[]{"error", "warning", "message", "client"}) {
            if (retValToTransferJSON.has(key)) {
                if (retValTargetJSON.has(key) && !retValTargetJSON.isNull(key)) {
                    String data = retValTargetJSON.getString(key);
                    if(data != null) data = utility.base64Decode(data);
                    retValTargetJSON.put(key, utility.base64Encode( (data != null ? data : "") + "\n\n" + utility.base64Decode( retValToTransferJSON.getString(key))) );
                } else {
                    retValTargetJSON.put(key, retValToTransferJSON.getString(key));
                }
            }
        }
        retVal = retValTargetJSON.toString();
        return retVal;
    }


    /**
     *
     * @param error
     * @param result
     * @return
     */
    static public String append_error_to_result(String error, String result) {
        if(error != null) {
            if(result != null) {
                try {
                    JSONObject resultJson = new JSONObject(result);
                    String errors = "";
                    if(resultJson.has("error")) {
                        errors = utility.base64Decode( resultJson.getString("error") );
                        errors += "\n\n";
                    }
                    errors += error;
                    resultJson.put("error", errors);
                    result = resultJson.toString();
                } catch (JSONException ex) {
                    Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        }
        return result;
    }

    
    /**
     *  Esegue un file python nel server da js
     *
     * @param request
     * @param out
     * @return
     */
    static public String pythonExecute(HttpServletRequest request, JspWriter out) {
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
            workspace tbl_wrk = workspace.get_tbl_manager_workspace(tblWrk != null && !tblWrk.isEmpty() ? tblWrk : controlId);
            if (tbl_wrk == null) {
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
                return python.exec(request, "Liquid", pythonFileToProcess, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) null);
            } catch (Throwable th) {
                error = "Error in pythonExecute():" + pythonFileToProcess + " (" + th.getLocalizedMessage() + ")\"}";
                System.err.println(" pythonExecute() [" + controlId + "] Error:" + th.getLocalizedMessage());
            }

            errorJson = "{ \"error\":\"" + utility.base64Encode(error) + "\"}";

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" pythonExecute() [" + controlId + "] Error:" + e.getLocalizedMessage());
        }
        return errorJson;
    }




    /**
     * Callback varie di test
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     * @throws Exception
     */
    static public String echo(Object tbl_wrk, Object params, Object clientData, Object freeParam) throws Exception {
        return testEvent(tbl_wrk, params, clientData, freeParam);
    }

    // ES.: Funzione di collaudo generica della callback
    static boolean glEnable = true;

    static public String testEvent(Object tbl_wrk, Object params, Object clientData, Object freeParam) throws Exception {
        String result = "{ \"result\":1";
        result += ",\"timecode\":" + System.currentTimeMillis();
        result += ",\"message\":\"testEvent(): ";

        if (tbl_wrk != null) {
            result += " tableKey:" + ((workspace) tbl_wrk).controlId;
        } else {
            result += " tableKey:N/D";
        }

        if (params != null) {
            result += " params:" + utility.base64Encode((String) params); // ((String)params).replaceAll("\"", "'")+"";
        } else {
            result += " params:N/D";
        }

        if (clientData != null) {
            result += " clientData:" + ((Object) clientData).toString().length() + "";
        } else {
            result += " clientData:N/D";
        }

        if (clientData != null) {
            result += " freeParam:" + ((Object) freeParam) + "";
        } else {
            result += " freeParam:N/D";
        }

        String updateResults = "";
        if (params != null) {
            if (tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest) freeParam;
                String ids = db.getSelection(tbl_wrk, params);
            }
        }
        result += "\"";
        result += "}";

        return result;
    }

    static public String testBean(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Exception {
        HttpServletRequest request = (HttpServletRequest)requestParam;

        String result = "{ \"result\":1";
        result += ",\"timecode\":" + System.currentTimeMillis();
        result += ",\"message\":\"testBean(): ";

        if (tbl_wrk != null) {
            result += " tableKey:" + ((workspace) tbl_wrk).controlId;
        } else {
            result += " tableKey:N/D";
        }

        if (params != null) {
            result += " params:" + ((String) params).replaceAll("\"", "'") + "";
        } else {
            result += " params:N/D";
        }

        if (clientData != null) {
            result += " clientData:" + ((Object) clientData).toString().length() + "";
        } else {
            result += " clientData:N/D";
        }

        if (clientData != null) {
            result += " freeParam:" + ((Object) requestParam) + "";
        } else {
            result += " freeParam:N/D";
        }

        String updateResults = "";
        String beanMessage = "";
        if (params != null) {
            if (tbl_wrk != null) {
                String ids = db.getSelection(tbl_wrk, params);
                int maxRows = 0;

                // ES.: Elenco selezione come JSONArray
                JSONArray jsonIds = (JSONArray) bean.get_bean(request, (String) ids, "jsonarray", maxRows);
                result += " json-ids:" + (jsonIds != null ? workspace.jsonArrayToString(jsonIds, "'", "'", ",") : "N/D") + "";

                // ES.: Elenco selezione come ArrayList<String>
                ArrayList<String> idsList = (ArrayList<String>) bean.get_bean(request, (String) ids, "array", maxRows);
                result += " ids:" + (ids != null ? workspace.arrayToString(idsList != null ? idsList.toArray() : null, "'", "'", ",") : "N/D") + "";

                //
                // ES.: Elenco selezione come bean (all field, all foreign tables)
                //
                ArrayList<Object> beans = (ArrayList<Object>) bean.get_bean(request, (String) ids, "bean", "all", "all", maxRows);
                if (beans != null) {
                    int i = 1;
                    int n = beans.size();
                    for (Object bean : beans) {
                        try {

                            // ES.: Caricamento foreign tables 1° livello
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object[] loadBeasnResult = null;

                            loadBeasnResult = com.liquid.bean.load_bean(bean, "UTENTI", maxRows, request);
                            loadBeasnResult = com.liquid.bean.load_bean(bean, "DOMAINS", maxRows, request);
                            loadBeasnResult = com.liquid.bean.load_bean(bean, "QUOTES_DETAIL", maxRows, request);

                            // ES.: Caricamento foreign tables 2° livello per tutte le righe di QUOTES_DETAIL
                            ArrayList<Object> beansQD = (ArrayList<Object>) utility.get(bean, "QUOTES_DETAIL");
                            if (beansQD != null) {
                                for (Object beanQD : beansQD) {
                                    loadBeasnResult = com.liquid.bean.load_bean(beanQD, "MATERIALS", maxRows, request);
                                }
                            }

                            // ES.: Stampa risultati
                            beanMessage += ""
                                    + " <br/>bean: <b>#" + String.valueOf(i) + "/" + String.valueOf(n) + "</b>"
                                    + " <br/>Id: <b>" + utility.get(bean, "id") + "</b>"
                                    + " <br/>Date: <b>" + utility.get(bean, "date") + "</b>"
                                    + " <br/>col #1: <b>" + utility.get(bean, workspace.getColumnByName(tbl_wrk, 0).getString("name")) + "</b>"
                                    + " <br/>col #2: <b>" + utility.get(bean, workspace.getColumnByName(tbl_wrk, 1).getString("name")) + "</b>"
                                    + " <br/>col #3: <b>" + utility.get(bean, workspace.getColumnByName(tbl_wrk, 2).getString("name")) + "</b>"
                                    + " <br/>col #4: <b>" + utility.get(bean, workspace.getColumnByName(tbl_wrk, 3).getString("name")) + "</b>"
                                    + " <br/>ft utenti: <b>" + utility.get(bean, "utenti$id") + "</b>"
                                    + " <br/>ft quotes_detail: <b>" + utility.get(bean, "QUOTES_DETAIL") + "</b>"
                                    + " <br/>ft quotes_detail.materials: <b>" + utility.get(utility.get(bean, "QUOTES_DETAIL"), "MATERIALS") + "</b>";
                            i++;

                            // ES.: Modifica di un campo
                            int tipo = (int) utility.get(bean, "tipo");
                            utility.set(bean, "tipo", tipo + 1);

                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        // ES.: Aggiornamento riga nel DB
                        String updateResult = db.update(bean, tbl_wrk, request);

                        // ES.: Passa al risultato l'elenco degli id modificati, per il refresh nel client
                        updateResults += (updateResults.length() > 0 ? "," : "") + (updateResult != null ? updateResult : "");

                        // ES.: Esegue un file python
                        String pyResult = "";
                        try {
                            pyResult = python.exec(request, "Liquid.event.testBean", "/testPython/echo.py", (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) bean);
                        } catch (Throwable th) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, th);
                        }

                        result += "<br/>";
                        result += "Python response:" + utility.base64Encode(pyResult); // .replace("\"", "\\\"");
                        result += "<br/>";
                    }
                } else {
                    beanMessage += "<br/>";
                    beanMessage += "No selections .. <br/>select one or more rows for read the beans";
                    beanMessage += "<br/>";
                }

                if (Messagebox.show(" Test ERROR message ", "Liquid", Messagebox.OK + Messagebox.CANCEL + Messagebox.ERROR) == Messagebox.OK) {
                    beanMessage += " <br/> ERROR message: <b>OK</b>";
                    if (Messagebox.show(" Test WARNING ... continue ?", "Liquid", Messagebox.YES + Messagebox.NO + Messagebox.WARNING) == Messagebox.YES) {
                        beanMessage += " <br/> WARNING message: <b>YES</b>";
                        while (Messagebox.show(" Test QUESTION message ", "Liquid", Messagebox.IGNORE + Messagebox.ABORT + Messagebox.RETRY + Messagebox.QUESTION) == Messagebox.RETRY) {
                            beanMessage += " <br/> QUESTION message: <b>RETRY</b>";
                        };
                        if (Messagebox.show(" Test INFO message ", "Liquid", Messagebox.OK + Messagebox.INFO) == Messagebox.OK) {
                            beanMessage += " <br/> INFO message: <b>OK</b>";
                            Messagebox.show(" Test DEBUG message ", "Liquid", +Messagebox.OK + Messagebox.CANCEL + Messagebox.DEBUG);
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
        if (glEnable) {
            result += "\"Liquid.disableCommand('" + ((workspace) tbl_wrk).controlId + "','insert')\"";
        } else {
            result += "\"Liquid.enableCommand('" + ((workspace) tbl_wrk).controlId + "','insert')\"";
        }
        result += ",\"Liquid.showToast('LIQUID','" + utility.base64Encode(beanMessage) + "','success')\"";
        result += "]";

        glEnable = !glEnable;

        result += ",\"data\":" + updateResults + "";
        result += "}";

        return result;
    }

    static public String testParentBean(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Exception {
        String result = "{ \"result\":1";
        String updateResults = "";
        HttpServletRequest request = (HttpServletRequest)requestParam;

        result += ",\"message\":\"testParentBean(): ";

        if (tbl_wrk != null) {
            if (params != null) {
                // Selezione sul pannello chiamante
                String ids = db.getSelection(tbl_wrk, params);
                //
                // ES.: Legge il bean completo, tutti i campi, tutte le foreign tables
                //
                int maxRows = 0;
                ArrayList<Object> beans = (ArrayList<Object>) bean.get_bean(requestParam, (String) ids, "bean", "all", "all", maxRows);
                if (beans != null) {
                    int i = 1, n = beans.size();
                    for (Object bean : beans) {
                        try {
                            // ES.: Caricamento foreign tables parent
                            // N.B.: La selezione corrente del client risiede in params (String as getJSONArray)
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object parentLevel1Bean = com.liquid.bean.load_parent_bean(bean, params, maxRows, request);

                            Object parentLevel2Bean = com.liquid.bean.load_parent_bean(parentLevel1Bean, params, maxRows, request);

                            Object parentLevel3Bean = com.liquid.bean.load_parent_bean(parentLevel2Bean, params, maxRows, request);

                            // ES.: Stampa risultati
                            result += " bean #" + String.valueOf(i++) + "/" + String.valueOf(n)
                                    + " Id:" + utility.get(bean, "id")
                                    + " Level 1 parent bean :" + parentLevel1Bean
                                    + " Level 2 parent bean :" + parentLevel2Bean
                                    + " Level 3 parent bean :" + parentLevel3Bean;

                            // ES.: Modifica campo priority
                            int priority = (int) utility.get(bean, "priority");
                            utility.set(bean, "priority", priority + 1);

                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        // Richiesta conferma dal client (Messaggio con timeout)
                        if (Messagebox.show("Updating table (set priority += 1) ... continue operation ?", "Liquid", Messagebox.OK + Messagebox.CANCEL + Messagebox.QUESTION, 30, Messagebox.CANCEL) == Messagebox.OK) {

                            // ES.: Aggiornamento riga nel DB
                            String updateResult = db.update(bean, tbl_wrk, request);

                            // ES.: Passa al risultato l'elenco degli id modificati, per il refresh nel client
                            updateResults += (updateResults.length() > 0 ? "," : "") + updateResult;
                        }
                    }
                }
            }
        }
        result += "\"";
        result += ",\"data\":" + updateResults + "";
        result += "}";
        return result;
    }

    static public String testScript(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Exception {
        HttpServletRequest request = (HttpServletRequest)requestParam;
        String resultJson = "{ \"result\":1,\"message\":\"";
        String updateResults = "";

        String result = "testScript(): ";

        if (tbl_wrk != null) {
            if (params != null) {
                // Selezione sul pannello chiamante
                String ids = db.getSelection(tbl_wrk, params);
                //
                // ES.: Legge il bean completo, tutti i campi, tutte le foreign tables
                //
                int maxRows = 0;
                ArrayList<Object> beans = (ArrayList<Object>) bean.get_bean(requestParam, (String) ids, "bean", "all", "all", maxRows);
                if (beans != null) {
                    int i = 1, n = beans.size();
                    for (Object bean : beans) {
                        try {
                            // ES.: Caricamento foreign tables parent
                            // N.B.: La selezione corrente del client risiede in params (String as getJSONArray)
                            //      Ritorna { int nBeans, int nBeansLoaded, String errors, String warning }
                            Object[] loadBeasnResult = com.liquid.bean.load_bean(bean, "$Parent", params, maxRows, request);

                            // ES.: Stampa risultati
                            result += " bean #" + String.valueOf(i++) + "/" + String.valueOf(n)
                                    + " Id:" + utility.get(bean, "id")
                                    + " parent bean :" + utility.get(bean, "$Parent");

                        } catch (Throwable ex) {
                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                        }

                        // Richiesta conferma dal client (Messaggio con timeout)
                        String scriptResult = JSScript.script("prompt('JS script from server test : type yout response','...');");
                        result += "scriptResult(b64):" + utility.base64Encode(scriptResult);
                    }
                }
            }
        }
        resultJson += utility.base64Encode(result);
        resultJson += "\"";
        resultJson += ",\"data\":" + updateResults + "";
        resultJson += "}";
        return resultJson;
    }

    static public String testEventX(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Exception {
        if (params != null) {
            if (tbl_wrk != null) {
                HttpServletRequest request = (HttpServletRequest) requestParam;
                String ids = workspace.getSelection(((workspace) tbl_wrk).controlId, (String) params);
                int maxRows = 0, i = 1;
                ArrayList<Object> beans = (ArrayList<Object>) bean.get_bean(request, (String) ids, "bean", "all", "all", maxRows);
                for (Object bean : beans) {
                    try {
                        System.out.print(" bean #" + String.valueOf(i) + "/" + String.valueOf(beans.size())
                                + " Id:" + com.liquid.utility.get(bean, "id")
                                + " Date:" + com.liquid.utility.get(bean, "date")
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

    static public String testValidateLess11(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"timestamp\":" + System.currentTimeMillis();
        String title = "", error = "", warning = "", message = "";
        boolean fail = false;
        if (params != null) {
            if (tbl_wrk != null) {
                try {
                    HttpServletRequest request = (HttpServletRequest) freeParam;
                    JSONObject rootJSON = new JSONObject((String) params);
                    JSONArray paramsJSON = rootJSON.getJSONArray("params");
                    for (int ip = 0; ip < paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if (paramJSON.has("value")) {
                            String value = paramJSON.getString("value");
                            if (value != null) {
                                value = utility.base64Decode(value);
                            }
                            if (Integer.parseInt(value) <= 10) {
                                result += ",\"result\":\"" + utility.base64Encode(value) + "\"";
                            } else {
                                fail = true;
                                warning = "Should be <= 10";
                            }
                        }
                    }
                } catch (JSONException ex) {
                    fail = true;
                    Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
                    error = "[SERVER] ERROR: " + ex.getLocalizedMessage();
                }
            }
        }
        result += ",\"fail\":" + fail + "";
        result += ",\"title\":\"" + title + "\"";
        result += ",\"error\":\"" + utility.base64Encode(error) + "\"";
        result += ",\"warning\":\"" + utility.base64Encode(warning) + "\"";
        result += ",\"message\":\"" + utility.base64Encode(message) + "\"";
        result += "}";
        return result;
    }

    static public String testDialogX(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"timestamp\":" + System.currentTimeMillis();
        String title = "", error = "", warning = "", message = "";
        boolean fail = false;
        if (params != null) {
            try {
                HttpServletRequest request = (HttpServletRequest) freeParam;
                JSONObject paramsJSON = event.getJSONObject(params, "dialogX");
                if (paramsJSON != null) {
                    JSONArray names = paramsJSON.names();
                    if (names != null) {
                        for (int io = 0; io < names.length(); io++) {
                            String propName = names.getString(io);
                            Object propVal = paramsJSON.get(propName);

                            if (propVal != null) {
                                // propVal = utility.base64Decode(propVal);
                            }
                        }
                    }
                }
            } catch (Throwable th) {
                fail = true;
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, th);
                error = "[SERVER] ERROR: " + th.getLocalizedMessage();
            }
        }
        result += ",\"fail\":" + fail + "";
        result += ",\"title\":\"" + title + "\"";
        result += ",\"error\":\"" + utility.base64Encode(error) + "\"";
        result += ",\"warning\":\"" + utility.base64Encode(warning) + "\"";
        result += ",\"message\":\"" + utility.base64Encode(message) + "\"";
        result += "}";
        return result;
    }

    //
    // Fine callback di test
    //




    /**
     * Insert row system command (server side)
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String insertRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"result\":1", error = "";
        try {

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("beforeInsertRow", tbl_wrk, params, clientData, freeParam);
                        if (retVal != null) {
                            if (retVal.getClass() == boolean.class) {
                                if ((boolean) retVal == false) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                            if (retVal.getClass() == Integer.class) {
                                if ((int) retVal == 0) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" insertRow() Error:" + e.getLocalizedMessage());
            }

            String resAdd = db.insertFields(tbl_wrk, params, clientData, freeParam, (event.eventCallback) null);

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("afterInsertRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }

            result += ",\"data\":" + (resAdd != null && !resAdd.isEmpty() ? resAdd : "\"\"") + "";
            result += "}";
            return result;

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" insertRow() Error:" + e.getLocalizedMessage());
        }

        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error) + "\"}";
    }


    /**
     * Solve the field by the database engine
     *
     * @param conn
     * @param col
     * @param colTypes
     * @param colPrecs
     * @param defaultVlaue
     * @param request
     * @return
     * @throws Exception
     */
    static public String setFieldAsDefault(Connection conn, JSONObject col, int colTypes, int colPrecs, String defaultVlaue, HttpServletRequest request) throws Exception {
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String colDefault = defaultVlaue, out_string = "";
        boolean autoIncString = false;

        if (colDefault == null || defaultVlaue.isEmpty()) {
            if(col.has("default")) {
                try {
                    colDefault = col.getString("default");
                } catch (Exception e) {
                }
            }
        }
        if (colDefault != null && !colDefault.isEmpty()) {
            String fieldName = null, fieldValue = null;
            NumberFormat nf = NumberFormat.getInstance();

            if(col.has("autoIncString")) {
                try {
                    autoIncString = col.getBoolean("autoIncString");
                } catch (JSONException e) {
                }
            }

            String bkColDefault = colDefault;
            colDefault = "";
            for (int i = 0; i < bkColDefault.length(); i++) {
                if ((bkColDefault.charAt(i) == '$' || bkColDefault.charAt(i) == '%') && bkColDefault.charAt(i + 1) == '{') {
                    i += 2;
                    int s = i;
                    while (bkColDefault.charAt(i) != '}' && i < bkColDefault.length()) {
                        i++;
                    }
                    String cVar = bkColDefault.substring(s, i);
                    if (!cVar.isEmpty()) {
                        Object oVar = request.getSession().getAttribute(cVar);
                        String cVarValue = (String) String.valueOf(oVar);
                        colDefault += (cVarValue != null ? cVarValue : "");
                    }
                } else {
                    colDefault += bkColDefault.charAt(i);
                }
            }

            if (!colDefault.startsWith("\"")) {
                boolean isNumeric = false;

                try {
                    isNumeric = StringUtils.isNumeric(colDefault);
                } catch (Throwable e) {
                }

                if (autoIncString) {
                    // spetta al db la risoluzione
                    return colDefault;

                } else if (" ".equals(colDefault) || isNumeric) { // casi noti...
                    return colDefault;

                } else {

                    String executingQuery = "SELECT " + colDefault.replace("`", "'") + ";";

                    try {

                        psdo = conn.prepareStatement(executingQuery);
                        rsdo = psdo.executeQuery();

                        if (rsdo != null) {

                            while (rsdo.next()) {

                                if (colTypes == 8) {
                                    double dFieldValue = rsdo.getDouble(1);
                                    if (colPrecs < 0) {
                                        fieldValue = String.format(Locale.US, "%.2f", dFieldValue);
                                    } else {
                                        nf.setMaximumFractionDigits(colPrecs);
                                        fieldValue = nf.format(dFieldValue);
                                    }

                                } else if (colTypes == 6 || colTypes == 93) {
                                    Timestamp ts = rsdo.getTimestamp(1);
                                    SimpleDateFormat df = new SimpleDateFormat("dd-MM-yyyy H:mm:ss.SSS");
                                    fieldValue = df.format(ts);

                                } else if (colTypes == 91) {
                                    java.sql.Date dt = rsdo.getDate(1);
                                    SimpleDateFormat df = new SimpleDateFormat("dd-MM-yyyy");
                                    fieldValue = df.format(dt);

                                } else if (colTypes == 92) {
                                    Time tt = rsdo.getTime(1);
                                    SimpleDateFormat df = new SimpleDateFormat("H:mm:ss.SSS");
                                    fieldValue = df.format(tt);

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
                        if (rsdo != null) {
                            rsdo.close();
                        }
                        rsdo = null;
                        if (psdo != null) {
                            psdo.close();
                        }
                        psdo = null;
                    }
                }
            }
        }
        return "";
    }



    /**
     * onInserting system event : initialize recordset without write into db
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requetParam
     * @return
     */
    static public String onInserting(Object tbl_wrk, Object params, Object clientData, Object requetParam) {
        String retVal = "", out_string = "", error = "";
        Connection conn = null;
        try {
            if (tbl_wrk != null) {
                // System.out.println(" onInserting() Raised");
                JSONObject rootJSON = null;
                JSONArray paramsJSON = null;
                JSONObject rowData = null;
                workspace liquid = (workspace) tbl_wrk;
                HttpServletRequest request = (HttpServletRequest) requetParam;
                String schema = null;
                String table = null;
                try {
                    schema = liquid.tableJson.getString("schema");
                } catch (Exception e) {
                }
                try {
                    table = liquid.tableJson.getString("table");
                } catch (Exception e) {
                }
                try {
                    rootJSON = new JSONObject((String) params);
                } catch (Exception e) {
                }
                try {
                    paramsJSON = (rootJSON != null ? rootJSON.getJSONArray("params") : null);
                } catch (Exception e) {
                }

                if (paramsJSON != null) {
                    for (int ip = 0; ip < paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if (paramJSON.has("data")) {
                            rowData = (JSONObject) paramJSON.getJSONObject("data");
                        }
                    }
                }

                Object [] connResult = connection.getConnection(null, request, ((workspace) tbl_wrk).tableJson);
                conn = (Connection)connResult[0];
                String connError = (String)connResult[1];
                if (conn != null) {
                    String reqDateSep = (String)request.getAttribute("dateSep");
                    String reqTimeSep = (String)request.getAttribute("timeSep");
                    String dateSep = reqDateSep != null ? reqDateSep : workspace.dateSep;
                    String timeSep = reqTimeSep != null ? reqTimeSep : workspace.timeSep;
                    DateFormat dateFormat = new SimpleDateFormat("dd" + dateSep + "MM" + dateSep + "yyyy");
                    DateFormat dateTimeFormat = new SimpleDateFormat("dd" + dateSep + "MM" + dateSep + "yyyy HH" + timeSep + "mm" + timeSep + "ss.SS");

                    long cRow = 0;
                    long lStartTime = 0;
                    long lQueryTime = 0;
                    long lRetrieveTime = 0;

                    try {

                        if (conn != null) {
                            JSONArray cols = liquid.tableJson.getJSONArray("columns");
                            ArrayList<String> defaultVlaues = new ArrayList<String>();
                            int[] colTypes = new int[cols.length()];
                            int[] colPrecs = new int[cols.length()];
                            for (int ic = 0; ic < cols.length(); ic++) {
                                JSONObject col = cols.getJSONObject(ic);
                                if (col.has("type")) {
                                    try {
                                        colTypes[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                                    } catch (Exception e) {
                                    }
                                }
                                if (col.has("precision")) {
                                    try {
                                        colPrecs[ic] = Integer.parseInt(col.getString("precision"));
                                    } catch (Exception e) {
                                        colPrecs[ic] = -1;
                                    }
                                }
                                if (rowData != null) {
                                    defaultVlaues.add(rowData.getString(col.getString("field")));
                                } else {
                                    defaultVlaues.add("");
                                }
                            }

                            out_string += "{";

                            for (int ic = 0; ic < cols.length(); ic++) {

                                lStartTime = System.currentTimeMillis();

                                try {

                                    String fieldName = null;
                                    JSONObject col = cols.getJSONObject(ic);
                                    boolean nullable = true;

                                    // N.B.: defaultVlaues, ovvero il dato elaborato e passato dal client, prevale sulla definizione di default del DB
                                    String colDefault = defaultVlaues != null ? defaultVlaues.get(ic) : null;
                                    colDefault = setFieldAsDefault(conn, col, colTypes[ic], colPrecs[ic], colDefault, request);
                                    int colType = 0;

                                    try {
                                        colType = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                                    } catch (Exception e) {
                                    }
                                    try {
                                        nullable = col.getBoolean("nullable");
                                    } catch (Exception e) {
                                    }

                                    try {
                                        fieldName = col.getString("field");
                                    } catch (Exception e) {
                                    }
                                    if (fieldName == null || fieldName.isEmpty()) {
                                        try {
                                            fieldName = col.getString("name");
                                        } catch (Exception e) {
                                        }
                                    }

                                    if(colType == 6) {
                                        try {
                                            Timestamp ts = DateUtil.toTimestamp(colDefault);
                                            colDefault = DateUtil.toString(ts);
                                        } catch (Exception e) {
                                            // fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                                            throw new Exception(e);
                                        }
                                    } else if(colType == 93) {
                                        try {
                                            Timestamp ts = DateUtil.toTimestamp(colDefault);
                                            colDefault = DateUtil.toString(ts);
                                        } catch (Exception e) {
                                            // fieldValue = "00" + workspace.dateSep + "00" + workspace.dateSep + "0000 00" + workspace.timeSep + "00" + workspace.timeSep + "00";
                                            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, e);
                                            throw new Exception(e);
                                        }
                                    }

                                    if (cRow > 0) {
                                        out_string += ",";
                                    }
                                    out_string += "\"" + fieldName + "\":\"" + (colDefault != null ? colDefault.replace("\\", "\\\\").replace("\"", "\\\"") : "") + "\"";
                                    cRow++;

                                    if (out_string.charAt(out_string.length() - 1) == ',') {
                                        System.err.println("Error at cRow:" + cRow + " invalid char");
                                    }

                                } catch (Exception e) {
                                    // N.B.: Segnala l'errore ma conrinua l'esecuzione
                                    // TODO : Gestire la possibilita di fermare la procedura
                                    error += "[ Retrieve Error:" + e.getLocalizedMessage() + " ]";
                                    System.err.println("Retrieve Error at cRow:" + cRow + ":" + e.getLocalizedMessage());
                                }

                                lRetrieveTime += System.currentTimeMillis() - lStartTime;
                            }
                            out_string += "}";
                        }
                    } catch (Exception e) {
                        error += " [" + (liquid.controlId) + "] Query Error:" + e.getLocalizedMessage();
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
            } else {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, "");
                retVal = "{\"error\":\"" + utility.base64Encode("Error: workspace not found") + "\"}";
            }
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            retVal = "{\"error\":\"" + utility.base64Encode("Fatal error:" + th.getLocalizedMessage()) + "\"}";

        } finally {
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return retVal;
    }



    /**
     * System event on inserted row
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String onInserted(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        Logger.getLogger(db.class.getName()).log(Level.INFO, "onInserted() get called");
        return null;
    }



    /**
     * System event on insetring row (before insert)
     *
     *  Callback per test overlay evento di sistema
     *  Per Test : "events":[ "name":"onInserting" : "com.liquid.event.onInsertingRow" ...]
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String onInsertingRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        System.out.println(" TEST : onInsertingRow() Raised");
        return null;
    }

    // Per Test con "events":[ ... "com.liquid.event.onInsertingRow" ...]
    static public String onInsertedRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        System.out.println(" TEST : onInsertedRow() Raised");
        return null;
    }

    // Evento di SISTEMA Risoluzione dei campi rimasti al default e inserimento del record nel DB
    // Per Test con "owner":"com.liquid.event"
    static public String onPastedRow(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String retVal = "", out_string = "", error = "";
        Connection conn = null;
        try {
            if (tbl_wrk != null) {
                // System.out.println(" onPasted() Raised");
                HttpServletRequest request = (HttpServletRequest) requestParam;
                workspace liquid = (workspace) tbl_wrk;
                String schema = null;
                String table = null;
                try {
                    schema = liquid.tableJson.getString("schema");
                } catch (Exception e) {
                }
                try {
                    table = liquid.tableJson.getString("table");
                } catch (Exception e) {
                }

                Object [] connResult = connection.getConnection(null, request, ((workspace) tbl_wrk).tableJson);
                conn = (Connection)connResult[0];
                String connError = (String)connResult[1];
                if (conn != null) {
                    long cRow = 0;
                    long lStartTime = 0;
                    long lQueryTime = 0;
                    long lRetrieveTime = 0;

                    // NO : clientData è sull' URL e quindi limitato
                    // JSONObject rowData = new JSONObject( ((String)clientData).replaceAll("\n", "\\n") );
                    JSONObject rootJSON = new JSONObject((String) params);
                    JSONArray paramsJSON = rootJSON.getJSONArray("params");
                    for (int ip = 0; ip < paramsJSON.length(); ip++) {
                        JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                        if (paramJSON.has("data")) {
                            JSONObject rowData = (JSONObject) paramJSON.getJSONObject("data");

                            // Risoluzione campi di default (tipicamente chiave primaria)
                            JSONArray cols = liquid.tableJson.getJSONArray("columns");
                            int[] colTypes = new int[cols.length()];
                            int[] colPrecs = new int[cols.length()];
                            for (int ic = 0; ic < cols.length(); ic++) {
                                try {
                                    colTypes[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("type"));
                                } catch (Exception e) {
                                }
                                try {
                                    colPrecs[ic] = Integer.parseInt(cols.getJSONObject(ic).getString("precision"));
                                } catch (Exception e) {
                                    colPrecs[ic] = -1;
                                }
                            }

                            for (int ic = 0; ic < cols.length(); ic++) {

                                try {

                                    String fieldData = rowData.getString(cols.getJSONObject(ic).getString("field"));
                                    String fieldName = null;
                                    JSONObject col = cols.getJSONObject(ic);

                                    if (col.has("default")) {
                                        if (fieldData.equalsIgnoreCase(col.getString("default"))) {
                                            boolean autoIncString = false;
                                            try {
                                                autoIncString = col.getBoolean("autoIncString");
                                            } catch (JSONException e) {
                                            }
                                            if (!autoIncString) {
                                                fieldData = setFieldAsDefault(conn, col, colTypes[ic], colPrecs[ic], null, request);
                                                rowData.put(String.valueOf(ic + 1), fieldData);
                                            }
                                        }
                                    }

                                } catch (Exception e) {
                                    // N.B.: Segnala l'errore ma conrinua l'esecuzione
                                    // TODO : Gestire la possibilita di fermare la procedura
                                    error += "[ Retrieve Error:" + e.getLocalizedMessage() + " ]";
                                    System.err.println("Retrieve Error at cRow:" + cRow + ":" + e.getLocalizedMessage());
                                }

                                lRetrieveTime += System.currentTimeMillis() - lStartTime;
                            }

                            // Inserimento record
                            String sModifications = "";
                            String sFields = "";
                            JSONArray fieldsJSON = new JSONArray();
                            for (int ic = 0; ic < cols.length(); ic++) {
                                String fieldData = rowData.getString(String.valueOf(ic + 1));
                                JSONObject fieldJSON = new JSONObject();
                                fieldJSON.put("field", cols.getJSONObject(ic).getString("field"));
                                fieldJSON.put("value", fieldData);
                                fieldsJSON.put(fieldJSON);
                            }
                            // sFields = (sFields.length()>0?",":"")+"{\"field\":\""+cols.getJSONObject(ic).getString("field")+"\",\"value\":\""+(fieldData != null ? fieldData : "")+"\"}";
                            sFields = fieldsJSON.toString();
                            sModifications += "{\"rowId\":\"\",\"fields\":" + sFields + "}";

                            String insertingParams = "{ \"params\":[{\"modifications\":[" + sModifications + "] } ] }";

                            // JSONObject insertingParamsJson = new JSONObject( insertingParams );
                            return db.insertFields(tbl_wrk, insertingParams, clientData, requestParam, null);
                        }
                    }
                }
            } else {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, "No workspace defined");
                retVal = "{\"error\":\"" + utility.base64Encode("No workspace defined") + "\"}";
            }
        } catch (Throwable th) {
            Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, th);
            retVal = "{\"error\":\"" + utility.base64Encode("Fatal error:" + th.getLocalizedMessage()) + "\"}";

        } finally {
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException ex) {
                Logger.getLogger(db.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return retVal;
    }



    /**
     * update row from GUI (system event)
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String updateRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"result\":1", error = "";
        try {

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("onUpdatingRow", tbl_wrk, params, clientData, freeParam);
                        if (retVal != null) {
                            if (retVal.getClass() == boolean.class) {
                                if ((boolean) retVal == false) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                            if (retVal.getClass() == Integer.class) {
                                if ((int) retVal == 0) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }

            String resUpd = db.updateFields(tbl_wrk, params, clientData, freeParam, (event.eventCallback) null);

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("onUpdatedRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
            }

            result += ",\"data\":" + (resUpd != null && !resUpd.isEmpty() ? resUpd : "\"\"") + "";
            result += "}";
            return result;

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" updateRow() Error:" + e.getLocalizedMessage());
        }

        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error) + "\"}";
    }




    /**
     * on updating (before update) (system event)
     *
     *  Evento di SISTEMA onUpdating : aggiornamento iniziale del record senza scrittura nel DB
     *  Per Test con "owner":"com.liquid.event"
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String onUpdating(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }

    static public String onUpdated(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }

    // Per Test con "events":[ ... "com.liquid.event.onUpdatingRow" ...]
    static public String onUpdatingRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }


    /**
     * on deleting (before delete) (system event)
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String deleteRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"result\":1", error = "";

        try {

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("onDeletingRow", tbl_wrk, params, clientData, freeParam);
                        if (retVal != null) {
                            if (retVal.getClass() == boolean.class) {
                                if ((boolean) retVal == false) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                            if (retVal.getClass() == Integer.class) {
                                if ((int) retVal == 0) {
                                    return "{ \"result\":0\", \"msg\":\"stopped\"}";
                                }
                            }
                        }
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
            }

            String resDel = db.deleteRow(tbl_wrk, params, clientData, freeParam, (event.eventCallback) null);

            try {
                if (tbl_wrk != null) {
                    workspace tblWrk = (workspace) tbl_wrk;
                    Object owner = tblWrk.getOwner();
                    if (owner != null) {
                        Object retVal = forwardEvent("onDeletedRow", tbl_wrk, params, clientData, freeParam);
                    }
                }
            } catch (Throwable e) {
                error += "Error:" + e.getLocalizedMessage();
                System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
            }

            result += ",\"data\":" + (resDel != null && !resDel.isEmpty() ? resDel : "\"\"") + "";
            result += "}";
            return result;

        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" deleteRow() Error:" + e.getLocalizedMessage());
        }

        return "{ \"result\":0, \"error\":\"" + utility.base64Encode(error) + "\"}";
    }


    /**
     * On deleting row (befer delete) (system event)
     *
     *     Evento di SISTEMA onDeleting : cancellazione iniziale del record senza scrittura nel DB
     *     Per Test con "owner":"com.liquid.event"
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String onDeleting(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }

    static public String onDeleted(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }

    // Per Test con "events":[ ... "com.liquid.event.onDeletingRow" ...]
    static public String onDeletingRow(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        return null;
    }

    // Per Test con "events":[ ... "com.liquid.event.onRetrieveRows" ...]
    static public String onRetrieveRows(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        // System.out.println(" onRetrieveRows() Raised");
        return null;
    }


    /**
     * getDocuments : get list of documento for id (DMS services)
     *
     *      Read "app.liquid.dms.connection.dmsSchema" as Schema
     *           "app.liquid.dms.connection.dmsTable" as Tchema
     *      params :
     *          { database:... , schema:... , table:... , name:... , ids:nodeKeys };
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String getDocuments(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Class cls = null;
                // collecting keys for the link
                ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (String) params);
                try {
                    // Custom implementation
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("getDocuments", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) keyList);
                } catch (Throwable th) {
                    // default implementation
                    return getDocumentsDefault(tbl_wrk, params, clientData, keyList);
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" getDocuments() error:" + e.getLocalizedMessage());
        }
        return result;
    }


    /**
     * Default DMS implementation
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    public static String getDocumentsDefault( Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        String dmsSchema = null;
        String dmsTable = null;
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String sQuery = null;
        String sWhere = "";
        int nRecs = 0;

        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }

            //  params :
            // { database:... , schema:... , table:... , name:... , ids:nodeKeys };

            if(freeParam != null) {
                Object [] connRes = connection.getDBConnection();
                conn = (Connection)connRes[0];
                if(conn != null) {
                    ArrayList<String> keyList = (ArrayList<String>)freeParam;
                    for(int ik=0; ik<keyList.size(); ik++) {
                        sWhere += sWhere.length()>0?" OR ":"" + "link='"+keyList.get(ik)+"'";
                    }
                    sQuery = "SELECT * from \""+dmsSchema+"\".\""+dmsTable+"\" WHERE ("+sWhere+") + ORDER BY date DESC";
                    psdo = conn.prepareStatement(sQuery);
                    rsdo = psdo.executeQuery();
                    if(rsdo != null) {
                        while(rsdo.next()) {
                            String file = rsdo.getString("file");
                            // N.B.: Protocollo JSON : nella risposta JSON il caratere "->\" è a carico del server, e di conseguenza \->\\
                            file = file != null ? file.replace("\\", "\\\\").replace("\"", "\\\"") : "";
                            int size = rsdo.getInt("size");
                            String date = rsdo.getString("date");
                            String note = rsdo.getString("note");
                            String type = rsdo.getString("type");
                            String id = rsdo.getString("id");
                            String options = "";
                            String fieldSet = "{" + "\"file\":\""+(file!=null?file:"")+"\", \"size\":"+size+",\"note\":\""+note+"\""+",\"type\":\""+type+"\""+",\"id\":\""+id+"\"" + "}";
                            resultSet.append( (nRecs>0?",":"") + fieldSet);
                            nRecs++;
                        }
                    }
                    if(rsdo != null) rsdo.close();
                    if(psdo != null) psdo.close();
                }
            }
        } catch (Throwable e) {
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
        } finally {
            try {
                conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }





    /**
     * put file into DMS
     *
     * @param tbl_wrk
     * @param b64FileContent
     * @param fileName
     * @param fileSize
     * @param docType
     * @param userData
     * @param database
     * @param schema
     * @param table
     * @param name
     * @param rowId
     * @param clientData
     * @param requestParam
     * @return
     * @throws IOException
     * @throws ClassNotFoundException
     * @throws InvocationTargetException
     * @throws InstantiationException
     * @throws IllegalAccessException
     * @throws NoSuchMethodException
     */
    static public String uploadDocument(Object tbl_wrk,
                                        String b64FileContent, String fileName, Long fileSize,
                                        String docType, String userData,
                                        String database, String schema, String table, String name, Object rowId,
                                        Object clientData, Object requestParam) throws Throwable {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                JSONObject paramsJson = new JSONObject("{\"params\":null}");
                JSONObject dmsParamsJson = new JSONObject();

                dmsParamsJson.put("database", database != null ? database : tblWrk.tableJson.has("database") ? tblWrk.tableJson.getString("database") : null);
                dmsParamsJson.put("schema", schema != null ? schema : tblWrk.tableJson.has("schema") ? tblWrk.tableJson.getString("schema") : null);
                dmsParamsJson.put("table", table != null ? table : tblWrk.tableJson.has("table") ? tblWrk.tableJson.getString("table") : null);
                dmsParamsJson.put("name", name != null ? name : tblWrk.tableJson.has("name") ? tblWrk.tableJson.getString("name") : null);
                dmsParamsJson.put("row", rowId != null ? String.valueOf(rowId) : null);
                dmsParamsJson.put("file", fileName != null ? fileName : null);
                dmsParamsJson.put("size", fileSize != null ? fileSize : null);

                ServletContext context = ((HttpServletRequest)requestParam).getSession().getServletContext();
                String mimeType = context.getMimeType(fileName);
                dmsParamsJson.put("mimeType", mimeType != null ? mimeType : null);

                dmsParamsJson.put("content", b64FileContent != null ? b64FileContent : null);
                dmsParamsJson.put("doc_type", docType != null ? docType : null);
                dmsParamsJson.put("user_data", userData != null ? userData : null);
                JSONArray ids = new JSONArray();
                ids.put(rowId);
                dmsParamsJson.put("ids", ids);
                paramsJson.put("params", dmsParamsJson);
                return uploadDocument(tbl_wrk, paramsJson.toString(), clientData, requestParam);
            }
        } catch(Throwable th){
            error = " uploadDocuments() error:" + th.getLocalizedMessage();
            System.err.println(error);
            throw th;
        }
        return result;
    }

    /**
     * Handle file update from DMS panel
     * need in params special keys like :
     *  [database][schema][table][name][ids]
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String uploadDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) throws Throwable {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Class cls = null;
                HttpServletRequest request = (HttpServletRequest) requestParam;
                if (request != null) {
                    // data:*/*;base64,
                    if (tblWrk != null) {
                        if (clientData != null) {
                            String docName = (String) clientData;
                            if (docName != null) {
                                if(tblWrk.tableJson.has("documents")) {
                                    JSONArray documents = tblWrk.tableJson.getJSONArray("documents");
                                    for (int i = 0; i < documents.length(); i++) {
                                        JSONObject document = (JSONObject) documents.get(i);
                                        if (document != null) {
                                            if (docName.equalsIgnoreCase(document.getString("name"))) {
                                                if (document.has("maxSize")) {

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    JSONObject paramsJson = new JSONObject((String) params);
                    JSONObject paramJson = paramsJson.getJSONObject("params");


                    if(paramJson.has("file")) {
                        if(!paramJson.has("mimeType")) {
                            String file = paramJson.getString("file");
                            Path path = new File(file).toPath();
                            if (path != null) {
                                // fileContent = Files.readAllBytes( path ) ;
                                paramJson.put("mimeType", Files.probeContentType(path));
                            }
                        }
                    }

                    // collecting keys for the link
                    ArrayList<String> keyList = utility.get_dms_keys(tblWrk, (String) params);
                    if(keyList != null) {
                        try {
                            cls = Class.forName("app.liquid.dms.connection");
                            Object classInstance = (Object) cls.newInstance();
                            Method method = cls.getMethod("uploadDocument", Object.class, Object.class, Object.class, Object.class);
                            return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) keyList);
                        } catch (Throwable th){
                            //
                            // default implementation
                            //
                            return uploadDocumentDefault( tbl_wrk, paramsJson.toString(), clientData, keyList );
                        }
                    } else {
                        throw new InvalidParameterException("Unable to build DMS keys");
                    }
                }
            }
        } catch (Throwable th2) {
            error = " uploadDocuments() error:" + th2.getLocalizedMessage();
            System.err.println(error);
            throw th2;
        }
        return result;
    }


    /**
     * Default upload file into DMS implementation : set file name, write file, create row in DB
     *
     * @param tbl_wrk
     * @param params        (parametri usate per comporre il nome del file)
     * @param clientData
     * @param requestParam  (Campo link nel DB; elenco identificatori ArrayList<String> per identificare i records ai quali il doc è collegato)
     * @return
     */
    static public String uploadDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) throws Throwable {
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        Connection conn = null;
        PreparedStatement psdo = null;
        String sQuery = null;
        String sWhere = "";
        String dmsSchema = null, dmsTable = null, dmsDocType = null, dmsRootFolder = null;
        long dmsMaxFileSize = 0;
        int nRecs = 0;

        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fdt = cls.getDeclaredField("dmsDocType");
            if(fdt != null) {
                fdt.setAccessible(true);
                dmsDocType = (String) fdt.get(null);
            }
            Field fr = cls.getDeclaredField("dmsRootFolder");
            if(fr != null) {
                fr.setAccessible(true);
                dmsRootFolder = (String) fr.get(null);
            }
            Field fms = cls.getDeclaredField("dmsMaxFileSize");
            if(fms != null) {
                fms.setAccessible(true);
                dmsMaxFileSize = (long) fms.get(null);
            }

            if(dmsRootFolder != null && !dmsRootFolder.isEmpty()){
                if (!utility.folderExist(dmsRootFolder)) {
                    if(!utility.createFolder(dmsRootFolder)) {
                        throw new Exception("Unable to create foolder : " + dmsRootFolder);
                    }
                }
            } else {
                throw new InvalidParameterException("'dmsRootFolder' not set in 'app.liquid.dms.connection'");
            }


            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");


            if(!dmsRootFolder.endsWith(File.separator))
                dmsRootFolder += File.separator;

            int added = 0;
            String fileAbsolutePath = dmsRootFolder;
            // Database
            String comp = paramJson.has("database") ? paramJson.getString("database") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + "D." + comp;
            }
            // Schema
            comp = paramJson.has("schema") ? paramJson.getString("schema") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".S." + comp;
            }
            // Table
            comp = paramJson.has("table") ? paramJson.getString("table") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".T." + comp;
            }
            // Row
            comp = paramJson.has("row") ? paramJson.getString("row") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".R." + comp;
            }
            // DMS folder name
            comp = paramJson.has("name") ? paramJson.getString("name") : null;
            if(comp != null && !comp.isEmpty()) {
                fileAbsolutePath += (added > 0 ? "." : "") + ".N." + comp;
            }
            // Time tick
            long tick = System.currentTimeMillis();
            fileAbsolutePath += (added > 0 ? "." : "") + ".TK." + tick;

            // File name
            String fileName = paramJson.getString("file");
            fileAbsolutePath += (added > 0 ? "." : "") + ".F." + fileName;


            // Scrittura file
            if(paramJson.has("content")) {
                String b64FileContent = paramJson.getString("content");
                byte [] fileContent = null;
                if(b64FileContent.startsWith("base64,")) {
                    fileContent = utility.base64DecodeBytes(b64FileContent.substring(7));
                } else {
                    fileContent = utility.base64DecodeBytes(b64FileContent);
                }
                if(fileContent.length > dmsMaxFileSize && dmsMaxFileSize > 0) {
                    throw new Exception("File too large .. max:"+(dmsMaxFileSize/1024)+"Kb");
                }
                Files.write(Paths.get(fileAbsolutePath), fileContent);
                paramJson.put("hash", utility.get_file_md5(fileAbsolutePath));
            } else {
                // paramJson.put("hash", null);
                throw new Exception("File content not defined");
            }

            if(!paramJson.has("note")) {
                paramJson.put("note", "");
            }

            Object doc_type_id = null;
            boolean bResolveDocTypeId = false;
            if(paramJson.has("doc_type_id")) {
                doc_type_id = paramJson.get("doc_type_id");
            } else {
                if (paramJson.has("doc_type")) {
                    doc_type_id = "(SELECT id FROM \"cnconline\".\""+dmsDocType+"\" WHERE \"type\"='"+paramJson.get("doc_type")+"')";
                    bResolveDocTypeId = true;
                }
            }
            Object user_data = null;
            if(paramJson.has("user_data")) {
                user_data = paramJson.get("user_data");
            }



            // paramJson : { database: ... , schema: ..., table: ..., name: ..., ids:nodesKey, file:"", size:"", note:"", fileContent:"" mimeType:""};
            if(requestParam != null) {
                Object [] connRes = connection.getDBConnection();
                conn = (Connection)connRes[0];
                if(conn != null) {
                    // N.B.: one document can refers to multiple rows in table, if rowSelect is "multiple"
                    // JSONArray ids = paramJson.getJSONArray("ids");
                    ArrayList<String> keyList = null;
                    if(requestParam != null) {
                        keyList = (ArrayList<String>)requestParam;
                    } else {
                        throw new Exception("No keys defined");
                    }

                    conn.setAutoCommit(false);

                    for (int i=0; i<keyList.size(); i++) {

                        sQuery = "INSERT INTO \""+dmsSchema+"\".\""+dmsTable+"\" " +
                                "(\"file\",\"size\",\"note\",\"type\",\"hash\",\"link\",\"doc_type_id\",\"user_data\")" +
                                " VALUES " +
                                "('"+fileAbsolutePath+"'"
                                +",'"+paramJson.getInt("size")+"'"
                                +",'"+paramJson.getString("note")+"'"
                                +",'"+paramJson.getString("mimeType")+"'"
                                +",'"+paramJson.getString("hash")+"'"
                                +",'"+keyList.get(i)+"'"
                                +","+doc_type_id
                                +",?"
                                +")";
                        psdo = conn.prepareStatement(sQuery, Statement.RETURN_GENERATED_KEYS);
                        if(user_data instanceof String) {
                            psdo.setString(1, (String)user_data);
                        } else if(user_data instanceof byte []) {
                            psdo.setString(1, (String)utility.base64Encode((byte[]) user_data));
                        } else {
                            psdo.setNull(1, Types.VARCHAR);
                        }
                        int res = psdo.executeUpdate();
                        if(res >= 0) {
                            if(bResolveDocTypeId) {
                                ResultSet rs = psdo.getGeneratedKeys();
                                PreparedStatement psdoRead = null;
                                ResultSet rsdoRead = null;
                                doc_type_id = null;
                                try {
                                    if (rs != null && rs.next()) {
                                        sQuery = "SELECT doc_type_id FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" " +
                                                "WHERE id=" + rs.getString(1);
                                        psdoRead = conn.prepareStatement(sQuery);
                                        rsdoRead = psdoRead.executeQuery();
                                        if (rsdoRead != null) {
                                            if (rsdoRead.next()) {
                                                doc_type_id = rsdoRead.getString(1);
                                            }
                                        }
                                    }
                                } finally {
                                    if(rs != null) rs.close();
                                    if(psdoRead != null) psdoRead.close();
                                    if(rsdoRead != null) rsdoRead.close();
                                }
                            }
                            String fieldSet = "{"
                                    + "\"file\":\"" + (paramJson.getString("file")) + "\""
                                    + ",\"size\":" + paramJson.getInt("size")
                                    + ",\"note\":\"" + paramJson.getString("note") + "\""
                                    + ",\"type\":\"" + paramJson.getString("mimeType") + "\""
                                    + ",\"hash\":\"" + paramJson.getString("hash") + "\""
                                    + ",\"link\":\"" + keyList.get(i) + "\""
                                    + ",\"doc_type_id\":\"" + doc_type_id + "\""
                                    + "}";
                            resultSet.append(nRecs > 0 ? "," : "" + fieldSet);
                            nRecs++;
                        }
                    }
                    conn.commit();
                }
            }
        } catch (Throwable e) {
            conn.rollback();
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
            throw e;

        } finally {
            try {
                if(psdo != null)
                    psdo.close();
                if(conn != null)
                    conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }





    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData    "content" -> download as content, "getLink" -> download the data, default download as file
     * @param requestParam
     * @return
     */
    static public String downloadDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String error = "", resultSet = "";
        Object[] result = null;
        try {
            HttpServletRequest request = (HttpServletRequest) requestParam;
            HttpServletResponse response = (HttpServletResponse) request.getAttribute("response");
            workspace tblWrk = (workspace) tbl_wrk;
            Class cls = null;

            ServletOutputStream out_stream = response.getOutputStream();

            if (out_stream != null) {

                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("downloadDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    result = (Object[]) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam);
                } catch (Throwable th) {
                    // default implementatio
                    result = downloadDocumentDefault(tbl_wrk, params, clientData, requestParam);
                }
                if ("getLink".equalsIgnoreCase((String) clientData)) {
                    String outData = "{"
                            + "\"fileName\":\"\""
                            + ",\"fileMimeType\":\"\""
                            + ",\"file\":\"\""
                            + ",\"size\":\"\""
                            + ",\"date\":\"\""
                            + ",\"note\":\"\""
                            + ",\"type\":\"\""
                            + ",\"link\":\"\""
                            + ",\"hash\":\"\""
                            + ",\"id\":\"\""
                            + "\"doc_type\":\"\""
                            + ",\"doc_type_desc\":\"\""
                            + ",\"user_data\":\"\""
                            + "}";
                    response.getOutputStream().write(outData.getBytes());
                } else {
                    if (result[2] != null) {
                        response.setContentType((String) result[1]);
                        if ("content".equalsIgnoreCase((String) clientData)) {
                            // download as content
                        } else {
                            // download as file
                            response.setHeader("Content-Disposition", "attachment; filename=" + (String) result[0]);
                        }
                        out_stream.write((byte[]) result[2]);
                    } else {
                        String err = (String) result[15];
                        response.setContentType((String) result[1]);
                        response.setStatus(500);
                        response.getOutputStream().write((err != null ? err : "File not found").getBytes());
                    }
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" downloadDocument() error:" + e.getLocalizedMessage());
        }
        return null;
    }

    static public Object [] downloadDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        byte [] fileContent = null;
        String fileName = "";
        String fileMimeType = "";
        Connection conn = null;
        PreparedStatement psdo = null;
        ResultSet rsdo = null;
        String sQuery = null;
        String sWhere = "";
        String error = null;
        String dmsSchema = null, dmsTable = null, dmsDocType = null;
        int nRecs = 0;
        String file = null, date = null, note = null, type = null, link = null, hash = null, id = null, doc_type = null, doc_type_desc = null, user_data = null;
        long size = 0;

        try {

            // root table data
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }
            Field fdt = cls.getDeclaredField("dmsDocType");
            if(fdt != null) {
                fdt.setAccessible(true);
                dmsDocType = (String) fdt.get(null);
            }



            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // { paramJson:..., schema:..., table:..., ids:..., id: ... };
            if(paramJson != null) {

                String sid = paramJson.has("id") ? paramJson.getString("id") : null;
                String slink = paramJson.has("link") ? paramJson.getString("link") : null;

                Object [] connRes = connection.getDBConnection();
                conn = (Connection)connRes[0];
                if(conn != null) {
                    String cols = "D.file, D.size, D.date, D.note, D.type, D.link, D.hash, D.id, DT.type as doc_type";
                    if("IT".equalsIgnoreCase(workspace.getGLLang())) {
                        cols += ", DT.type_desc_it as doc_type_desc";
                    } else {
                        cols += ", DT.type_desc as doc_type_desc";
                    }
                    sQuery = "SELECT "+cols+""
                            + " from \"" + dmsSchema + "\".\"" + dmsTable + "\" D"
                            + " LEFT JOIN \""+ dmsSchema + "\".\"" + dmsDocType +"\" DT ON DT.id=doc_type_id";

                    if(sid != null && !sid.isEmpty()) {
                        sQuery += " WHERE (id='" + sid + "')";
                    } else if(slink != null && !slink.isEmpty()) {
                        if(slink.startsWith("DMS://"))
                            slink = slink.substring(6);
                        sQuery += " WHERE (link='" + slink + "')";
                    } else {
                        throw new Exception("Cannot download document : missing search key");
                    }

                    sQuery +=" ORDER BY \"date\" DESC";

                    psdo = conn.prepareStatement(sQuery);
                    rsdo = psdo.executeQuery();
                    if(rsdo != null) {
                        if(rsdo.next()) {
                            file = rsdo.getString("file");
                            size = rsdo.getInt("size");
                            date = rsdo.getString("date");
                            note = rsdo.getString("note");
                            type = rsdo.getString("type");
                            doc_type = rsdo.getString("doc_type");
                            doc_type_desc = rsdo.getString("doc_type_desc");
                            link = rsdo.getString("link");
                            hash = rsdo.getString("hash");
                            id = rsdo.getString("id");

                            if("getLink".equalsIgnoreCase((String)clientData)) {
                                // Non necessario leggere il contenuto
                            } else {
                                Path path = new File(file).toPath();
                                if (path != null) {
                                    fileName = file;
                                    fileMimeType = Files.probeContentType(path);
                                    fileContent = Files.readAllBytes(path);
                                } else {
                                    String err = "ERROR : File \"" + file + "\" not found";
                                    System.err.println(err);
                                    throw new Exception(err);
                                }
                            }
                            nRecs++;
                        }
                    }
                }
            }
        } catch (Throwable e) {
            error = "Internal Error:" + e.getLocalizedMessage();
            System.err.println(error);            
        } finally {
            try {
                if(rsdo != null) rsdo.close();
                if(psdo != null) psdo.close();
                if(conn != null) conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return new Object[] {
                (Object)fileName, (Object)fileMimeType, (Object)fileContent,
                (Object)file, (Object)size,
                (Object)date, (Object)note, (Object)type, (Object)link, (Object)hash, (Object)id,
                (Object)doc_type, (Object)doc_type_desc, (Object)user_data,
                (Object)nRecs,
                (Object)error
        };
    }


    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String deleteDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            workspace tblWrk = (workspace) tbl_wrk;
            Class cls = null;
            try {
                cls = Class.forName("app.liquid.dms.connection");
                Method method = cls.getMethod("deleteDocument", Object.class, Object.class, Object.class, Object.class);
                Object classInstance = (Object) cls.newInstance();
                return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam);
            } catch (Throwable th) {
                // Default implementation
                return deleteDocumentDefault( tbl_wrk, params, clientData, requestParam );
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" deleteDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }


    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String deleteDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object requestParam ) {
        StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
        Connection conn = null;
        PreparedStatement psdo = null;
        String sQuery = null, sQuerySel = null;
        String sWhere = "";
        String dmsSchema = null, dmsTable = null;
        int nRecs = 0;

        try {

            // root table
            Class cls = Class.forName("app.liquid.dms.connection");
            Field fs = cls.getDeclaredField("dmsSchema");
            if(fs != null) {
                fs.setAccessible(true);
                dmsSchema = (String) fs.get(null);
            }
            Field ft = cls.getDeclaredField("dmsTable");
            if(ft != null) {
                ft.setAccessible(true);
                dmsTable = (String) ft.get(null);
            }

            JSONObject paramsJson = new JSONObject((String)params);
            JSONObject paramJson = paramsJson.getJSONObject("params");
            // { paramJson:..., schema:..., table:..., ids:..., id: ... };
            if(paramJson != null) {
                Object [] connRes = connection.getDBConnection();
                conn = (Connection)connRes[0];
                if(conn != null) {
                    if(paramJson.has("id")) {
                        String id = paramJson.getString("id");
                        sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (id='" + id + "')";
                        sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link='" + id + "')";
                    } else if(paramJson.has("link")) {
                        String link = paramJson.getString("link");
                        if(link.startsWith("DMS://")) link = link.substring(6);
                        sQuery = "DELETE FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link='" + link + "')";
                        sQuerySel = "SELECT file FROM \"" + dmsSchema + "\".\"" + dmsTable + "\" WHERE (link='" + link + "')";
                    }
                    if(sQuery != null) {
                        psdo = conn.prepareStatement(sQuerySel);
                        ResultSet rsdo = psdo.executeQuery();
                        if(rsdo != null) {
                            if(rsdo.next()) {
                                String file = rsdo.getString("file");
                                if(file != null && !file.isEmpty()) {
                                    boolean resDel = new File(file).delete();
                                    if(!resDel) {

                                    }
                                }
                            }
                            rsdo.close();;
                        }
                        psdo.close();


                        psdo = conn.prepareStatement(sQuery);
                        int res = psdo.executeUpdate();
                        if (res >= 0) {
                            String fieldSet;
                            if(paramJson.has("id")) {
                                fieldSet = "{" + "\"id\":\"" + (paramJson.getString("id")) + ",\"res\":" + res + " }";
                            } else {
                                fieldSet = "{" + "\"link\":\"" + (paramJson.getString("link")) + ",\"res\":" + res + "}";
                            }
                            resultSet.append((nRecs > 0 ? "," : "") + fieldSet);
                            nRecs++;
                        }
                        if (psdo != null) psdo.close();
                    }
                }
            }
        } catch (Throwable e) {
            System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
        } finally {
            try {
                conn.close();
            } catch (SQLException ex) {
                Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        resultSet.append("]}");
        return resultSet.toString();
    }




    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param requestParam
     * @return
     */
    static public String updateDocument(Object tbl_wrk, Object params, Object clientData, Object requestParam) {
        String result = "{ \"resultSet\":{} }", error = "", resultSet = "";
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Class cls = null;
                try {
                    cls = Class.forName("app.liquid.dms.connection");
                    Method method = cls.getMethod("updateDocument", Object.class, Object.class, Object.class, Object.class);
                    Object classInstance = (Object) cls.newInstance();
                    return (String) method.invoke(classInstance, (Object) tbl_wrk, (Object) params, (Object) clientData, (Object) requestParam);
                } catch (Throwable th) {
                    // Default implementation
                    return updateDocumentDefault( tbl_wrk, params, clientData, requestParam );
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" updateDocument() error:" + e.getLocalizedMessage());
        }
        return result;
    }


    static public String updateDocumentDefault( Object tbl_wrk, Object params, Object clientData, Object auxParams ) {
        try {
            StringBuilder resultSet = new StringBuilder("{\"resultSet\":[");
            Connection conn = null;
            PreparedStatement psdo = null;
            String sQuery = null;
            String sWhere = "";
            String dmsSchema = null, dmsTable = null;
            int nRecs = 0;

            try {

                // root table
                Class cls = Class.forName("app.liquid.dms.connection");
                Field fs = cls.getDeclaredField("dmsSchema");
                if(fs != null) {
                    fs.setAccessible(true);
                    dmsSchema = (String) fs.get(null);
                }
                Field ft = cls.getDeclaredField("dmsTable");
                if(ft != null) {
                    ft.setAccessible(true);
                    dmsTable = (String) ft.get(null);
                }

                JSONObject paramsJson = new JSONObject((String)params);
                JSONObject paramJson = paramsJson.getJSONObject("params");
                // { paramJson:..., schema:..., table:..., ids:..., id: ... };
                if(paramJson != null) {
                    Object [] connRes = connection.getDBConnection();
                    conn = (Connection)connRes[0];
                    if(conn != null) {
                        ArrayList<String> keyList;
                        if(auxParams != null) {
                            keyList = (ArrayList<String>)auxParams;
                        } else {
                            throw new Exception("No keys defined");
                        }
                        for(int ik=0; ik<keyList.size(); ik++) {
                            sQuery = "UPDATE \""+dmsSchema+"\".\""+dmsTable+"\" SET " +"note='"+paramJson.getString("note")+"'"+ " WHERE (id='"+paramJson.getString("id")+"')";
                            psdo = conn.prepareStatement(sQuery);
                            int res = psdo.executeUpdate();
                            if(res >= 0) {
                                String fieldSet = "{" + "\"id\":\""+(paramJson.getString("id")) + "}";
                                resultSet.append( (nRecs>0?",":"") + fieldSet);
                                nRecs++;
                            }
                            if(psdo != null) psdo.close();
                        }
                    }
                }
            } catch (Throwable e) {
                System.err.println("Query Error:" + e.getLocalizedMessage() + sQuery);
            } finally {
                try {
                    conn.close();
                } catch (SQLException ex) {
                    Logger.getLogger(connection.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
            resultSet.append("]}");
            return resultSet.toString();
        } catch(Throwable th) {
        }
        return null;
    }





    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public String init(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        String result = "{ \"result\":1", error = "";
        try {
            System.out.println("[LIQUID ver.:"+workspace.version_string+"] init() started...");
            result += "}";
            return result;
        } catch (Exception e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" init() Error:" + e.getLocalizedMessage());
        }

        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Object owner = tblWrk.getOwner();
                if (owner != null) {
                    forwardEvent("onInit", tbl_wrk, params, clientData, freeParam);
                }
            }
        } catch (Throwable e) {
            error += "Error:" + e.getLocalizedMessage();
            System.err.println(" init() Error:" + e.getLocalizedMessage());
        }

        return "{ \"error\":\"" + utility.base64Encode(error) + "\"}";
    }

    /**
     *
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public Object close(Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        Object result = null;
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Object owner = tblWrk.getOwner();
                if (owner != null) {
                    result = forwardEvent("onclose", tbl_wrk, params, clientData, freeParam);
                }
            }
        } catch (Throwable e) {
            System.err.println(" close() Error:" + e.getLocalizedMessage());
        }
        return "{ \"result\":\"" + (result != null ? utility.base64Encode(result.toString()) : "") + "\"}";
    }


    /**
     *
     * @param eventName
     * @param tbl_wrk
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public Object forwardEvent(String eventName, Object tbl_wrk, Object params, Object clientData, Object freeParam) {
        try {
            if (tbl_wrk != null) {
                workspace tblWrk = (workspace) tbl_wrk;
                Object owner = tblWrk.getOwner();
                if (owner != null) {
                    return forwardEvent(eventName, tbl_wrk, owner, params, clientData, freeParam);
                } else {
                    // workspace hsa no owner .. stop the chain
                }
            }
        } catch (Throwable e) {
            if (!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }
        return null;
    }

    /**
     *
     * @param eventName
     * @param tbl_wrk
     * @param owner
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public Object forwardEvent(String eventName, Object tbl_wrk, Object owner, Object params, Object clientData, Object freeParam) {
        try {
            if (owner != null) {
                String className = null;
                Class<?> enclosingClass = owner.getClass().getEnclosingClass();
                if (enclosingClass != null) {
                    className = enclosingClass.getName();
                } else {
                    className = owner.getClass().getName();
                }
                Class cls = Class.forName(className);
                Method method = cls.getMethod(eventName, Object.class, Object.class, Object.class, Object.class);
                return (Object) method.invoke(owner, tbl_wrk, params, clientData, freeParam);
            }
        } catch (Throwable e) {
            if (!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }
        return null;
    }

    /**
     *
     * @param eventName
     * @param tbl_wrk
     * @param ownerClassName
     * @param params
     * @param clientData
     * @param freeParam
     * @return
     */
    static public Object forwardEvent(String eventName, Object tbl_wrk, String ownerClassName, Object params, Object clientData, Object freeParam) {
        try {
            if (ownerClassName != null && !ownerClassName.isEmpty()) {
                String sMethod = "";
                String[] classParts = ownerClassName.replace(" ", ".").split("\\.");
                String objectClassName = "";
                Object classInstance = null;
                Class cls = null;

                if (classParts.length > 1) {
                    if (classParts.length > 1) {
                        sMethod = classParts[classParts.length - 1].replace("()", "");
                        for (int i = 0; i < classParts.length - 1; i++) {
                            objectClassName += (objectClassName.length() > 0 ? "." : "") + classParts[i];
                        }
                    }
                    cls = Class.forName(objectClassName);
                    if (classInstance == null) {
                        classInstance = (Object) cls.newInstance();
                    }
                    if (classInstance != null) {
                        Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
                        return (Object) method.invoke(classInstance, tbl_wrk, params, clientData, freeParam);
                    }
                } else {
                    System.err.println(" forwardEvent() on event " + eventName + " invalid ownerClassName :" + ownerClassName + " (should be package.class.method)");
                }

            }
        } catch (Throwable e) {
            if (!(e instanceof java.lang.NoSuchMethodException)) {
                System.err.println(" forwardEvent() Error:" + e.getLocalizedMessage());
            }
        }
        return null;
    }

    //
    // event for tests    
    //
    static public Object longTimeTaskTest(Object owner, Object params, Object clientData, Object freeParam) {
        try {
            Thread.sleep(30000);
            return "{ \"client\":\"\", \"message\":\"" + utility.base64Encode("longTimeTaskTest Done") + "\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    static public Object longTimeTaskMessageTest(Object owner, Object params, Object clientData, Object freeParam) {
        try {
            Thread.sleep(1000);
            String selectedAction = "";
            int revVal = Messagebox.show(" Test QUESTION message .. select an action : ", "Liquid", Messagebox.IGNORE + Messagebox.ABORT + Messagebox.RETRY + Messagebox.QUESTION);
            if (revVal == Messagebox.RETRY) {
                selectedAction = "RETRY";
            } else if (revVal == Messagebox.IGNORE) {
                selectedAction = "IGNORE";
            } else if (revVal == Messagebox.ABORT) {
                selectedAction = "ABORT";
            } else {
                selectedAction = "TIMEOUT";
            }
            return "{ \"client\":\"\", \"message\":\"" + utility.base64Encode("longTimeTaskMessageTest Done. Selected action:" + selectedAction) + "\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    static public Object longTimeTaskJavascriptTest(Object owner, Object params, Object clientData, Object freeParam) {
        try {
            Thread.sleep(1000);
            String revVal = JSScript.script("prompt('Type any data','')", JSScript.SYNC);
            JSScript.script("alert('You typed:" + revVal + "')", JSScript.ASYNC);
            Thread.sleep(3000);
            return "{ \"client\":\"\", \"message\":\"" + utility.base64Encode("longTimeTaskJavascriptTest Done. result:" + revVal) + "\" }";
        } catch (InterruptedException ex) {
            Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    static public Object longTimeTaskCallbackTest(Object owner, Object params, Object clientData, Object freeParam) throws InterruptedException {
        int n = 10;
        for (int i = 0; i < n; i++) {
            Thread.sleep(1000);
            Callback.send("Phase " + (i + 1) + "/" + n + " done... [ time tick: " + System.currentTimeMillis() + "]");
        }
        return "{ \"client\":\"\", \"message\":\"" + utility.base64Encode("longTimeTaskCallbackTest Done") + "\" }";
    }

    static public JSONArray getJSONArray(Object params, String paramName) {
        if (params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String) params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has(paramName)) {
                        return paramJSON.getJSONArray(paramName);
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }


    /**
     *
     * @param params
     * @param paramName
     * @return
     */
    static public JSONObject getJSONObject(Object params, String paramName) throws Exception {
        return getJSONObject(params, paramName, null);
    }

    /**
     *
     * @param params
     * @param paramName
     * @param controlId
     * @return
     */
    static public JSONObject getJSONObject(Object params, String paramName, String controlId) throws Exception {
        return getJSONObject(params, paramName, controlId, null);
    }

    /**
     *
     * @param params
     * @param paramName
     * @param controlId
     * @return
     */
    static public JSONObject getJSONObject(Object params, String paramName, String controlId, HttpServletRequest request) throws Exception {
        if (params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String) params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has(paramName)) {
                        if (controlId != null && !controlId.isEmpty()) {
                            if (paramJSON.has("name")) {
                                if (controlId.equalsIgnoreCase(paramJSON.getString("name"))) {
                                    Object value = paramJSON.get(paramName);
                                    if (value instanceof JSONObject) {
                                        return paramJSON.getJSONObject(paramName);
                                    } else {
                                        JSONObject result = new JSONObject();
                                        result.put(paramName, value);
                                        return result;
                                    }
                                }
                            }
                        } else if (controlId != null && controlId.isEmpty()) {
                            if (!paramJSON.has("name")) { // exclude the "name" field, get the "name" content
                                return paramJSON.getJSONObject(paramName);
                            }
                        } else if (controlId == null) {
                            if (paramJSON.has(paramName)) {
                                Object o = paramJSON.get(paramName);
                                if (o instanceof JSONObject) {
                                    return paramJSON.getJSONObject(paramName);
                                } else if (o instanceof JSONArray) {
                                    JSONArray oArray = (JSONArray) o;
                                    if (oArray.length() == 1) {
                                        Object obj = oArray.get(0);
                                        if (obj instanceof JSONObject) {
                                            if("formX".equalsIgnoreCase(paramName)) {
                                                // Risoluzione dei campi variabili
                                                if(workspace.solve_object_var(obj, request) < 0) {
                                                }
                                            }
                                            return (JSONObject) obj;
                                        } else {
                                            String type = obj.getClass().getName();
                                            Logger.getLogger(event.class.getName()).log(Level.SEVERE, "event.getJSONObject() : Cannot return JSONObject from param '" + paramName + "' ... it's a '" + type + "'");
                                        }
                                    } else {
                                        Logger.getLogger(event.class.getName()).log(Level.SEVERE, "event.getJSONObject() : Cannot return JSONObject from param '" + paramName + "' ... it's a 'JSONArray' with multiple content");
                                    }
                                }
                            }
                        } else {
                            return paramJSON.getJSONObject(paramName);
                        }
                    }
                }
                
                // Search in param with no name
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has(paramName)) {
                        if (!paramJSON.has("name")) {
                            Object value = paramJSON.get(paramName);
                            if (value instanceof JSONObject) {
                                return paramJSON.getJSONObject(paramName);
                            } else {
                                JSONObject result = new JSONObject();
                                result.put(paramName, value);
                                return result;
                            }
                        }
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }


    /**
     *
     * @param params
     * @param paramName
     * @return
     */
    static public Object getObject(Object params, String paramName) {
        if (params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String) params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                // provilege first controlObject
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has(paramName)) {
                        if (paramJSON.has("sel")) {
                            return paramJSON.get(paramName);
                        }
                    }
                }
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has(paramName)) {
                        return paramJSON.get(paramName);
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }

    /**
     *
     * @param params
     * @param controlName
     * @return
     */
    static public Object getControlObject(Object params, String controlName) {
        if (params != null) {
            try {
                JSONObject rootJSON = new JSONObject((String) params);
                JSONArray paramsJSON = rootJSON.getJSONArray("params");
                // provilege first controlObject
                for (int ip = 0; ip < paramsJSON.length(); ip++) {
                    JSONObject paramJSON = paramsJSON.getJSONObject(ip);
                    if (paramJSON.has("name")) {
                        String cControlname =  paramJSON.getString("name");
                        if(controlName.equalsIgnoreCase( cControlname )) {
                            return paramJSON.get(cControlname);
                        }
                    }
                }
            } catch (JSONException ex) {
                Logger.getLogger(event.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return null;
    }


    /**
     * Load data from function (callback defined in "server":".." into the json of the control)
     *
     * @param tbl_wrk
     * @param sourceData
     *
     * @return @return Object[] { (Object) result, (Object) nRec, (String)error};
     */
    public static Object[] loadSourceData(workspace tbl_wrk, JSONObject sourceData, ParamsUtil.get_recordset_params requestParams) throws Exception {
        String result = null, rootKey = null, error = null;
        int nRecs = 0;

        if (tbl_wrk != null) {

            if (sourceData != null) {
                String className = sourceData.getString("server");
                Object owner = tbl_wrk != null ? tbl_wrk.getOwner() : null;
                Object params = requestParams != null ? requestParams.requestJson : null;
                Object clientData = null;
                Object request = requestParams != null ? requestParams.request : null;

                try {

                    // get instance and method
                    Object[] result_method = get_method_by_class_name(className, tbl_wrk, null /*(String)owner*/ );
                    if(result_method != null) {
                        Object classInstance = result_method[0];
                        Method method = (Method) result_method[1];
                        if (method != null) {
                            if (classInstance != null) {
                                Object[] loadSourceDataResult = null;

                                //
                                // N.B.: The loadSourceData return :
                                // Object [] { String Data, int nRecs, String rootKey, String error }
                                //

                                try {
                                    loadSourceDataResult = (Object[]) method.invoke(classInstance, tbl_wrk, params, clientData, (Object) request);
                                } catch (Throwable th1) {
                                    try {
                                        loadSourceDataResult = (Object[]) method.invoke(classInstance, tbl_wrk, params, clientData);
                                    } catch (Throwable th2) {
                                        try {
                                            loadSourceDataResult = (Object[]) method.invoke(classInstance, tbl_wrk, params);
                                        } catch (Throwable th3) {
                                            try {
                                                loadSourceDataResult = (Object[]) method.invoke(classInstance, tbl_wrk);
                                            } catch (Throwable th4) {
                                                loadSourceDataResult = (Object[]) method.invoke(classInstance);
                                            }
                                        }
                                    }
                                }

                                if(loadSourceDataResult != null) {
                                    if(loadSourceDataResult.length >= 3) {

                                        result = (String)loadSourceDataResult[0];
                                        nRecs = (int)(loadSourceDataResult.length >= 2 ? loadSourceDataResult[1] : 0);
                                        rootKey = (String)(loadSourceDataResult.length >= 3 ? loadSourceDataResult[2] : null);
                                        error = (String)(loadSourceDataResult.length >= 4 ? loadSourceDataResult[3] : null);

                                        if(rootKey != null && !rootKey.isEmpty()) {
                                            try {
                                                JSONObject resultJson = new JSONObject(result);
                                                if (resultJson != null) {
                                                    if(resultJson.has(rootKey)) {
                                                        Object resultRoot = resultJson.get(rootKey);
                                                        JSONArray rowsetJson = null;
                                                        if(resultRoot instanceof JSONObject) {
                                                            if (resultRoot != null) {
                                                                JSONArray names = ((JSONObject) resultRoot).names();
                                                                for(int iname=0; iname<names.length(); iname++) {
                                                                    Object obj = ((JSONObject) resultRoot).get(names.getString(iname));
                                                                    if(obj instanceof JSONArray) {
                                                                        rowsetJson = (JSONArray)obj; 
                                                                        break;
                                                                    }
                                                                }
                                                            } else {
                                                                result = null;
                                                            }
                                                        } else if(resultRoot instanceof JSONArray) {
                                                            if (resultRoot != null) {
                                                                rowsetJson = (JSONArray)resultRoot;
                                                            }
                                                        } else {
                                                            error = "Invalid rootKey from sourceData .. (class:" + className + ") .. rootKey '"+rootKey+"' should be a JSON Object or Array";
                                                            System.err.println(error);
                                                            result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                                        }

                                                        // Transcode the field
                                                        result = utility.jsonToRowset(tbl_wrk, rowsetJson);

                                                    } else {
                                                        error = "Error extracting rootKey from sourceData .. (class:" + className + ") .. rootKey '"+rootKey+"' not found";
                                                        System.err.println(error);
                                                        result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                                    }
                                                } else {
                                                    error = "Error extracting rootKey from sourceData .. (class:" + className + ") .. invalid json";
                                                    System.err.println(error);
                                                    result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                                }
                                            } catch (Exception e) {
                                                error = "Error extracting rootKey from sourceData .. (class:" + className + ") ... error:"+e.getMessage();
                                                System.err.println(error);
                                                result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                            }
                                        }

                                    } else {
                                        error = "Invalid result type : should be Object[4] .. (class:" + className + ")";
                                        System.err.println(error);
                                        result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                    }
                                } else {
                                    error = "Empty result : should be Object[4] .. (class:" + className + ")";
                                    System.err.println(error);
                                    result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                                }


                            } else {
                                error = "classInstance not valid for class : " + className;
                                System.err.println(error);
                                result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                            }
                        } else {
                            error = "method not found for class : " + className;
                            System.err.println(error);
                            result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                        }
                    } else {
                        error = "class not found : " + className;
                        System.err.println(error);
                        result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                    }

                } catch (InvocationTargetException ite) {
                    final Throwable cause = ite.getTargetException();
                    error = ite.getCause().getLocalizedMessage();
                    System.err.println("nested exception - " + cause + " " + ite.getCause());
                    result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";

                } catch (Throwable th) {
                    error = "Error in class.method:" + className + " (" + th.getMessage() + ")";
                    System.err.println(" execute() [" + tbl_wrk.controlId + "] Error:" + th.getMessage());
                    result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
                }

            } else {
                error = "invalid sourceData";
                System.err.println(error);
                result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
            }

        } else {
            error = "Invalid workspace";
            System.err.println(error);
            result = "{ \"error\":\""+utility.base64Encode(error)+"\" }";
        }

        return new Object[] { (Object) result, (Object) nRecs, error != null ? utility.base64Encode(error) : null };
    }

}
