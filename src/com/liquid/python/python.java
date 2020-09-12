package com.liquid.python;

import com.google.gson.Gson;
import com.liquid.ThreadSession;
import com.liquid.utility;
import com.liquid.workspace;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Serializable;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import org.apache.commons.lang.SerializationUtils;
import org.json.JSONObject;

// N.B.: jython non incorporata : 40Mb

public class python {
    
    public python() {
        try {
        } catch (Throwable ex) {
            Logger.getLogger(python.class.getName()).log(Level.SEVERE, null, ex);
        }
    }


    /**
     * Set the timeout of execution (seconds)
     * <p>
     * This method set the max execution time of the python interpreter
     * @see         python
     */
    static public int glProcessTimeoutSec = 30*60;
    
    /**
     * Set the check request alive interval (seconds)
     * <p>
     * This method set the interval to check if the request is still alive
     * @see         python
     */
    static public int glProcessCheckAliveSec = 45;


    //
    // N.B.: Possibile comunicazione interattica con il client assegnando la coda stdin in threadSession
    //      In alternativa assegnare un file che python legge quando in attesa di risposata
    //
    
    /**
     * <h3>Execute python file in the server</h3>
     * <p>
     * This method execute a .py file by the python interpreter
     * python must be installed in the server. Liquid search in the system path the interpreter
     * You can set the interpreter by these parameters:
     * </p>
     *  <p>workspace.pythonPath (String)</p>
     *  <p>workspace.pythonExecutable (String)</p>
     * <p>
     *  <p>in your python code :</p>
     *  <p>print("[@]: ...") write message to the browser console</p>
     *  <p>print("...") write to the output</p>
     * 
     * @param  request  the Http requet (HttpServletRequest)
     * @param  caller the caller name (optional, for information purpose) (String)
     * @param  pythonFileToProcess the python file to execute. Should exist in the server
     * @param  tbl_wrk the table workspace of the control (Object)
     * @param  params the parameters of the control, typically the selection (Object)
     * @param  clientData the data of the source event or command (Object)
     * @param  userParam the user data to pass to python code, typically the beans you have read (Object)

     * @return      all data inside the start key "out_json={" end the end key "}=out_json_end"
     * 
     * @see         python
     */
    static public String exec(HttpServletRequest request, String caller, String pythonFileToProcess, Object tbl_wrk, Object params, Object clientData, Object userParam) throws Exception {
        String pythonInterpreter = null;
        String controlId = null, pythonInterpreterHomeFolder = "", outString = "", outErrorStr = "";
        Process process = null;
        int retVal = 999;
        boolean bReportError = false;
        boolean bDebug = false;
        boolean bKillProcess = false;
        String sKillReason = "";
        String sKillDesc = "";

        JspWriter out = null;
        
        ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
        if(threadSession != null) {
            out = threadSession.out;
        }
        
        /*
        try {
            pythonFileToProcess = (String) request.getParameter("pyFile");
        } catch (Exception ex) {
            Logger.getLogger(python.class.getName()).log(Level.SEVERE, null, ex);
        }
        */
        
        ArrayList<String> argsList = new ArrayList<String>();
        
        // 0° parametro
        pythonInterpreter = workspace.getPythonInterpreter();
        pythonInterpreterHomeFolder = utility.get_parent_path(pythonInterpreter);
        argsList.add(pythonInterpreter);
            
        // 1° parametro
        String pythonFullFileToProcess = utility.get_absolute_path(request, pythonFileToProcess);
        argsList.add(pythonFullFileToProcess);

        
        // 2° parametro
        if(tbl_wrk != null) {            
            workspace tblWrk = (workspace)tbl_wrk;
            argsList.add(tblWrk.tableJson.toString().replace("\"","\\\""));
        } else {
            argsList.add("");
        }
        // 3° parametro
        if(params != null) {            
            argsList.add(((String)params).replace("\"","\\\""));
        } else {
            argsList.add("");
        }
        // 4° parametro
        if(clientData != null) {            
            argsList.add(((String)clientData).replace("\"","\\\""));
        } else {
            argsList.add("");
        }
        // 5° parametro
        if(userParam != null) {
            if(userParam.getClass().equals(String.class)) {
                argsList.add(((String)userParam).replace("\"","\\\""));
            } else {
                /*
                TODO : dead loop by parent property
                Object parent = utility.get(userParam, "$Parent");
                utility.set(userParam, "$Parent", null);
                String sUserParam = new Gson().toJson((Object)userParam).toString();
                argsList.add(sUserParam.replace("\"","\\\""));
                utility.set(userParam, "$Parent", null);
                */
                argsList.add("");
            }
        } else {
            argsList.add("");
        }
        // 6° parametro
        if(caller != null) {
            argsList.add((String)caller.replace("\"","\\\""));
        } else {
            StackTraceElement[] stacktrace = Thread.currentThread().getStackTrace();
            StackTraceElement e = stacktrace[2]; // maybe this number needs to be corrected
            String methodName = e.getMethodName();
            if(methodName != null && !methodName.isEmpty()) {
                argsList.add(methodName.replace("\"","\\\""));
            } else {
                argsList.add("[N/D]");
            }
        }
        

        
        try {
            
            long cCheckClientTimeMs = System.currentTimeMillis();
            long cTimeMs = System.currentTimeMillis();
            long processTimeoutMs = glProcessTimeoutSec * 1000;
            long expireTimeMsec = glProcessCheckAliveSec * 1000;

            if(out != null) 
                out.print("<Liquid>" + "Avvio processo (" + cTimeMs + ")...Timeout:" + (processTimeoutMs / 1000) + "sec </Liquid>");


            ProcessBuilder pbuilder = new ProcessBuilder(argsList);
            pbuilder.directory(new File(pythonInterpreterHomeFolder));
            process = pbuilder.start();
            if (process != null) {

                retVal = 999;

                Thread.sleep(100);

                BufferedReader inStream = new BufferedReader(new InputStreamReader(process.getInputStream()));
                BufferedWriter outStream = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));

                if (inStream != null) {
                    String line = null;
                    String keyLogString = "[@]:";
                    int lineCount = 0;

                    while (retVal == 999) {

                        while (inStream.ready()) {
                            line = inStream.readLine();
                            lineCount++;
                            if (line != null) {
                                if (line.startsWith(keyLogString)) {
                                    int index = line.indexOf(keyLogString);
                                    if(out != null) {
                                        out.print("<Liquid>" + line.substring(index + keyLogString.length()) + "</Liquid>");
                                        out.flush();
                                    }
                                } else {
                                    outString += line;
                                }

                            } else {
                                break;
                            }
                        }

                        try {
                            retVal = process.exitValue();
                        } catch (IllegalThreadStateException e) {
                            retVal = 999;
                            Thread.sleep(100);
                        } catch (Exception e) {
                            retVal = -999;
                        }

                        // Molto Importante : Chiude il processo se il client abbandona
                        // JAVA DI MERDA : Non ha la Response.isClientConnected() di microsoft
                        // Esporre il socket a response costava troppo
                        if ((System.currentTimeMillis() - cCheckClientTimeMs) >= expireTimeMsec && expireTimeMsec > 0) {
                            cCheckClientTimeMs = System.currentTimeMillis();
                            try {
                                if(out != null) {
                                    out.print("<Liquid>[KA]</Liquid>");
                                    out.flush();
                                }
                                // Controlla la scadenza (rinnovata dal polling)
                                if ((int) request.getSession().getAttribute("GLOperationExpired") == 1) {
                                    bKillProcess = true;
                                    if (workspace.GLLang.equalsIgnoreCase("IT")) {
                                        sKillReason = "Connessione scaduta";
                                        sKillDesc = "Connessione scaduta (" + (expireTimeMsec / 1000.0) + "sec)";
                                    } else {
                                        sKillReason = "Connection lost";
                                        sKillDesc = "Connection lost";
                                    }
                                } else {
                                    request.getSession().setAttribute("GLOperationExpired", 1);
                                }
                            } catch (IOException ioe) {
                                bKillProcess = true;
                                if (workspace.GLLang.equalsIgnoreCase("IT")) {
                                    sKillReason = "Connessione chiusa";
                                    sKillDesc = "Connessione chiusa (" + (ioe.getLocalizedMessage()) + "sec)";
                                } else {
                                    sKillReason = "Connection lost";
                                    sKillDesc = "Connection lost";
                                }
                            } catch (Exception e) {
                                bKillProcess = true;
                                if (workspace.GLLang.equalsIgnoreCase("IT")) {
                                    sKillReason = "Connessione chiusa";
                                    sKillDesc = "Connessione chiusa (" + (e.getLocalizedMessage()) + "sec)";
                                } else {
                                    sKillReason = "Connection lost";
                                    sKillDesc = "Connection lost";
                                }
                            }
                        }

                        // Verifica il timeout
                        if ((System.currentTimeMillis() - cTimeMs) >= processTimeoutMs) {
                            bKillProcess = true;
                            sKillReason = "Timeout";
                            sKillDesc = "Processo in timeout (" + (processTimeoutMs / 1000) + "sec)";
                        }

                        if (bKillProcess) {
                            if(out != null) {
                                out.print("<Liquid>" + sKillReason + " ... killing process .." + "</Liquid>");
                                out.flush();
                            }

                            utility.close_process(process);

                            if(out != null) {
                                out.print("<Liquid>" + sKillReason + " ... exiting .." + "</Liquid>");
                                out.flush();
                            }

                            retVal = -999;
                            outErrorStr = "";
                            outString = "out_json={ \"error\":\"" + sKillDesc + " \" }=out_json_end";
                        }
                    }

                    inStream.close();

                } else {
                    // errorStr += "[Error] unable to create in object";
                    outString = "{ \"error\":\"Fatal Error : unable to create in object!\" }";
                }

            } else {
                // errorStr += "[Error] unable to create exec object";
                outString = "{ \"error\":\"Fatal Error : unable to create exec object\" }";
            }

            
        } catch (Exception e) {
            // errorStr += "[Fatal Error #Exec]";
            outString = "{ \"error\":\"Fatal Error #exec : [" + e.getMessage() + "]\" }";

            if (process != null) {
                try {
                    retVal = process.exitValue();
                } catch (IllegalThreadStateException e2) {
                    // still pending
                    utility.close_process(process);
                } catch (Exception e2) {
                }
            }
        }

        
        // Scrive il tag di fine messaggistica e inizio risposta
        if(out != null) {
            try {
                out.print("<LiquidStartResponde/>");
                out.flush();
            } catch (IOException ex) {
                Logger.getLogger(python.class.getName()).log(Level.SEVERE, null, ex);
            }
        }

        
        // Identifica la risposta da pyton e la passa alla chiamante per il da farsi (passaggio al client o meno)
        String keyString = "out_json={";
        if (outString != null && !outString.isEmpty()) {
            if (outString.contains(keyString)) {
                int index = outString.indexOf(keyString);
                outString = outString.substring(index + keyString.length() - 1);
                keyString = "}=out_json_end";
                if (outString.contains(keyString)) {
                    String initialString = "{";

                    index = outString.indexOf(keyString);

                    /////////////////////////////////////////
                    // Informazioni Ambiente per debug
                    //
                    initialString += "\"LiquidPythonWrapper\":\"" + "1.1" + "\"";

                    
                    outString = initialString + "," + outString.substring(1, index + 1);

                } else {
                    bReportError = true;
                }

            } else {
                bReportError = true;
            }

        } else {
            bReportError = true;
        }
        

        if (bReportError) {

            int cArg = 0;
            String arg0 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg1 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg2 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg3 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg4 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg5 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;
            String arg6 = (String) (argsList.get(cArg)).replace("\\", "/");
            cArg++;

            arg1 = arg1.replace("\"", "'");
            arg2 = arg2.replace("\"", "'");
            arg3 = arg3.replace("\"", "'");
            arg4 = arg4.replace("\"", "'");
            arg5 = arg5.replace("\"", "'");
            arg6 = arg6.replace("\"", "'");

            // out.print ("arg9:["+arg9+"]");
            outString = "{ \"error\":\"Esecuzione file python fallita: risposta inattesa\""
                    + ",\"arg0\":\"" + arg0 + "\""
                    + ",\"arg1\":\"" + arg1 + "\""
                    + ",\"arg2\":\"" + arg2 + "\""
                    + ",\"arg3\":\"" + arg3 + "\""
                    + ",\"arg4\":\"" + arg4 + "\""
                    + ",\"arg5\":\"" + arg5 + "\""
                    + ",\"arg6\":\"" + arg6 + "\""
                    ;

            outString += " }";
        }
                                
        return outString;
    }
}    
