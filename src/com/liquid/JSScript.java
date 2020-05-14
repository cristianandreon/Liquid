/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author Cristitan
 */
public class JSScript {
    
    static public int ASYNC = 1;
    static public int SYNC = 2;
    
    static public int timeout = 60;
    static long sleepIntervelMsec = 1 * 1000;
    static long checkerIntervelMsec = 10 * 1000;
        
            
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)

     * @see         Messagebox
     */    
    static public String script( String script ) {
        return script( script, 0 );
    }
    
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  script  the script to execute(String)
     * @param  type the execution mode (int)

     * @see         Messagebox
     */    
    static String script( String script, int type ) {
        String retVal = null;
        ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
        if(threadSession.out != null) {
            try {
                String scriptJson = "<Liquid>serverScript:{"
                        + "\"script\":\""+utility.base64Encode(script)+"\""
                        + ",\"type\":"+type
                        + ",\"timeout\":"+timeout
                        + ",\"cypher\":\""+utility.base64Encode(threadSession.cypher)+"\""
                        + "}</Liquid><LiquidStartResponde/>";
                threadSession.out.print(scriptJson);
                threadSession.out.flush();
            } catch (IOException ex) {
                Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, ex);
            }
            // Attesa risposta
            try {
                long cTime = System.currentTimeMillis();
                long cTimeChecker = System.currentTimeMillis();
                while(System.currentTimeMillis() - cTime < timeout * 1000 || timeout <= 0) {
                    Thread.sleep(sleepIntervelMsec);
                    // Verifica messagi in coda
                    if(threadSession.out == null) {
                        // No stream
                        break;
                    } else {
                        boolean bStillPending = true;
                        if(System.currentTimeMillis() - cTimeChecker > checkerIntervelMsec) {
                            cTimeChecker = System.currentTimeMillis();
                            try {
                                threadSession.out.print("<Liquid></Liquid>");
                                threadSession.out.flush();
                            } catch (Exception ex) {
                                // request cancelled
                                Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, "WARNING : HSScript.script() : the end user has cancelled the reaquest");
                                bStillPending = false;
                            }
                        }
                        if(!bStillPending) {
                            // No stream pending
                            break;
                        } else {
                            String incomingMessage = ThreadSession.getIncomingMessage();
                            if(incomingMessage != null) {
                                // Processa il messaggio
                                retVal = incomingMessage;
                                ThreadSession.resetIncomingMessage();
                                break;
                            }
                        }
                    }
                }
            } catch (InterruptedException ex) {
                Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else {
            // Fatal error
            Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, "No sessionInfo available. Cannot communicate with client");
        }
        return retVal;
    }    
}
