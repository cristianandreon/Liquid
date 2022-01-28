package com.liquid;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import java.lang.reflect.Method;
import java.util.ArrayList;



public class worker {

    public String userId = null;
    public int status = 0;
    public Object Instance = null;
    public Method method = null;
    public String params;
    public String clientData;
    public Runnable runnable = null;
    public Object result = null;
    public Thread thread = null;
    
    
    static public int RUNNING = 1;
    static public int DONE = 200;
    
    static public ArrayList<worker> workers = new ArrayList<worker>();


    
    
    static public String start_worker(HttpServletRequest request, String operation, JspWriter out) {
        String out_string = "", error = "", errorJson = "", className = "", clientData = "", params = "";
        JSONObject requestJson = null;
        String userId = null, tblWrk = null, columnsResolved = null, async = "";
        String sRequest = workspace.get_request_content(request);

        try {
            className = (String) request.getParameter("className");
        } catch (Exception e) {
        }
        try {
            clientData = (String) request.getParameter("clientData");
        } catch (Exception e) {
        }
        try {
            userId = (String) request.getParameter("userId");
        } catch (Exception e) {
        }            
        try {
            async = (String) request.getParameter("async");
        } catch (Exception e) {
        }            

        params = workspace.get_request_content(request);


        try {
            if(className != null && !className.isEmpty()) {
                String sMethod = "";
                String objectClassName = className;
                String [] classParts = className.replace(" ", ".").split("\\.");
                Object classInstance = null;
                Class cls = null;

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
                    Method method = cls.getMethod(sMethod, Object.class, Object.class, Object.class, Object.class);
                    
                    worker wrk = new worker();
                    wrk.userId = userId;
                    wrk.status = RUNNING;
                    wrk.Instance = classInstance;
                    wrk.method = method;
                    wrk.params = params;
                    wrk.clientData = clientData;
                    wrk.result = null;
                    
                    wrk.runnable = new workerRunnable((Object)wrk);
                    
                    wrk.thread = new Thread(wrk.runnable);
                    wrk.thread.start();

                    workers.add( wrk );
                    
                    // Add child thread to make message work fine
                    if(!ThreadSession.addChildThread ( wrk.thread.getId() )) {
                        error = "Error appending child thread";
                        System.err.println(" start_worker() ["+userId+"] "+error);
                    }
                    
                    if("true".equalsIgnoreCase(async) || "true".equalsIgnoreCase(async)) {
                        while(wrk.status == RUNNING && wrk.thread.isAlive() && !wrk.thread.isInterrupted()) {
                            Thread.sleep(100);
                        }
                    }
                    
                    String resultString = "{ \"userId\":\"" + userId +"\",\"status\":\""+wrk.status+"\",\"isInterrupted\":\""+wrk.thread.isInterrupted()+"\" }";
                    if(wrk.result != null) {
                        // merging result
                        JSONObject resultJson = new JSONObject(resultString);                    
                        if(wrk.result instanceof String) {                            
                            JSONObject resultJSON = new JSONObject((String)wrk.result);
                            utility.mergeJsonObject(resultJSON, resultJson);
                        } else if(wrk.result instanceof Integer || wrk.result instanceof Boolean || wrk.result instanceof Long) {
                        } else if(wrk.result instanceof JSONObject) {
                            utility.mergeJsonObject((JSONObject)wrk.result, resultJson);
                        } else if(wrk.result instanceof JSONArray) {
                            JSONObject resultJSON = new JSONObject();
                            resultJSON.put("result", wrk.result);
                            utility.mergeJsonObject((JSONObject)resultJSON, resultJson);
                        }
                        return resultJson.toString();
                    } else {
                        return resultString;
                    }                         
                }
            }

        } catch (Throwable th) {
            error = "Error in class.method:"+className+" ("+th.getLocalizedMessage()+")\"}";
            System.err.println(" start_worker() ["+userId+"] Error:" + th.getLocalizedMessage());
        }
        
        errorJson = "{ \"error\":\"" + utility.base64Encode(error)+"\"}";
        return errorJson;
    }

    
    static public String get_worker(HttpServletRequest request, String operation, JspWriter out) {
        String error = "", errorJson = "", userId = "";
        try {
            try {
                userId = (String) request.getParameter("userId");
            } catch (Exception e) {
            }
            if(userId != null && !userId.isEmpty()) {
                for(int i=0; i<workers.size(); i++) {
                    if(userId.equalsIgnoreCase(workers.get(i).userId)) {
                        String resutlJson = "";
                        if(workers.get(i).status == DONE) {
                            resutlJson = "{ \"userId\":\"" + userId + "\""+",\"result\":" + (String)workers.get(i).result+",\"status\":\"" + workers.get(i).status+"\""+"}";
                        } else {
                            resutlJson = "{ \"userId\":\"" + userId + "\""+",\"status\":\"" + workers.get(i).status+"\""+"}";
                        }
                        return resutlJson;
                    }
               }
           }
            
        } catch (Throwable th) {
            error = "Error in get_worker_result(): "+th.getLocalizedMessage()+"";
            System.err.println(" start_worker() ["+userId+"] Error:" + th.getLocalizedMessage());
        }
        
        errorJson = "{ \"error\":\"" + utility.base64Encode(error)+"\"}";
        return errorJson;
   }
}