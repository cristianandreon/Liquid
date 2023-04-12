/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author Cristitan
 *
 * N.B.: In aplini application server (site.geisoft.org) out.flush non scrive e quindo non ilvia il messagebox al client se non dopo che il flusso e' stato chiuso
 *
 */
public class Messagebox {
    
    static public int OK = 1;
    static public int CANCEL = 2;
    static public int YES = 4;
    static public int NO = 8;
    static public int IGNORE = 16;
    static public int ABORT = 32;
    static public int RETRY = 64;
    static public int QUESTION = 128;
    static public int ERROR = 256;
    static public int WARNING = 512;
    static public int INFO = 1024;
    static public int DEBUG = 2048;
    static public int AUTOCLOSE = 4096;
    
    static public int timeout = 60;
    static long sleepIntervelMsec = 1 * 1000;
    static long checkerIntervelMsec = 10 * 1000;

    // TODO : DEBUG modalita di consegna dati
    static int deliveryMode = 0;
        // 0   ->   Do nothing
        // 1   ->   close stream,  NO chiudendo lo stream si erde la ripsosta:
        // 2    ->  Fill buffer-size : NO, NON funziona

            
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)
     * @return 

     * @see         Messagebox
     */    
    static public int show( String message ) {
        return show( message, "Liquid", Messagebox.INFO + Messagebox.CANCEL, 0.0f, Messagebox.CANCEL );
    }
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)
     * @param  title the title of the message box (String)
     * @return 

     * @see         Messagebox
     */    
    static public int show( String message, String title ) {
        return show( message, title, Messagebox.INFO + Messagebox.CANCEL, 0.0f, Messagebox.CANCEL );
    }
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)
     * @param  title the title of the message box (String)
     * @param  buttons the buttoms to use (ex: OK+CANCEL) (int)

     * @see         Messagebox
     */    
    static public int show( String message, String title, int buttons ) {
        return show( message, title, buttons, 0.0f, Messagebox.CANCEL );        
    }
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)
     * @param  title the title of the message box (String)
     * @param  buttons the buttoms to use (ex: OK+CANCEL) (int)
     * @param  autoCloseTimeSec the max time, in seconds, to show the message (float)

     * @see         Messagebox
     */    
    static public int show( String message, String title, int buttons, float autoCloseTimeSec ) {
        return show( message, title, buttons, autoCloseTimeSec, Messagebox.CANCEL );        
    }
    
    /**
     * <h3>Show a message in the client and wait for the response</h3>
     * <p>
     * This method set a property from a bean
     * </p>
     * @param  message  the message to show (String)
     * @param  title the title of the message box (String)
     * @param  buttons the buttoms to use (ex: OK+CANCEL) (int)
     * @param  autoCloseTimeSec the max time, in seconds, to show the message (float)
     * @param  autoCloseButton the result to pass back to server if the timout occours (int)

     * @see         Messagebox
     */    
    static int show( String message, String title, int buttons, float autoCloseTimeSec, int autoCloseButton ) {
        int retVal = 0;
        ThreadSession threadSession = ThreadSession.getThreadSessionInfo ( );
        if(threadSession != null) {
            if("DIRECT".equalsIgnoreCase(threadSession.mode)) {
                // Stampa direttamente : assenga di un recettore
                if(threadSession.response != null) {
                    PrintWriter writer = null;
                    try {
                        writer = threadSession.response.getWriter();
                        writer.print(title + " : " + message);
                        writer.flush();
                    } catch (IOException ex) {
                        Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
                if(threadSession.outputStream != null) {
                    try {
                        wsStreamerClient.send(threadSession.outputStream, title + " : " + message, threadSession.token, "P");
                    } catch (IOException ex) {
                        Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }

            } else if(threadSession.out != null || threadSession.outputStream != null) {
                try {
                    String messageJson = "<Liquid>serverMessage:{"
                            + "\"title\":\""+utility.base64Encode(title)+"\""
                            + ",\"message\":\""+utility.base64Encode(message)+"\""
                            + ",\"buttons\":"+buttons
                            + ",\"timeout\":"+autoCloseTimeSec
                            + ",\"timeoutButton\":\""+autoCloseButton+"\""
                            + ",\"cypher\":\""+utility.base64Encode(threadSession.cypher)+"\""
                            + "}</Liquid><LiquidStartResponde/>";

                    // Ajax...
                    if(threadSession.response != null) {

                        /*
                        NON RISOLVE
                        myHttpServletResponse resWrapper = new myHttpServletResponse(threadSession.response);
                        ServletOutputStream out = resWrapper.getOutputStream();
                        out.write(messageJson.getBytes(StandardCharsets.UTF_8));
                        out.flush();
                        resWrapper.flushBuffer();
                        // OK out.close();
                        */

                        /*
                        NON RISOLVE
                        // ServletOutputStream out = threadSession.response.getOutputStream();
                        // out.write(messageJson.getBytes(StandardCharsets.UTF_8));
                        // out.flush();
                        */


                        if(deliveryMode == 0) {

                            // NON RISOLVE
                            if(!threadSession.response.isCommitted()) {
                                threadSession.response.setHeader("Connection", "keep-alive");
                                threadSession.response.setHeader("Content-Length", "-1");
                                threadSession.response.setHeader("Cache-Control", "no-store");
                            }


                            // NON RISOLVE
                            messageJson += "<Liquid>\n\n</Liquid>";
                            // NON RISOLVE
                            // threadSession.response.setBufferSize(messageJson.length());
                        }

                        if(deliveryMode == 2) {
                            // NON RISOLVE
                            int bsize = threadSession.response.getBufferSize();
                            while(messageJson.length() < bsize) {
                                messageJson += "<Liquid></Liquid>";
                            }
                        }

                        PrintWriter writer = threadSession.response.getWriter();
                        writer.print(messageJson);
                        writer.flush();


                        try {
                            // IN TEST
                            threadSession.response.setCharacterEncoding("UTF-8");
                            // NON RISOLVE
                            threadSession.response.flushBuffer();
                        } catch (Exception e) {
                            System.err.println(e);
                        }

                        if(deliveryMode == 1) {
                            // OK : Needed so secure send a data to client : but can send back dialogbox once
                            writer.close();
                        }
                    }

                    // web socket
                    if(threadSession.outputStream != null) {
                        wsStreamerClient.send(threadSession.outputStream, messageJson, threadSession.token, "P");
                    }

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
                        if(threadSession.out != null || threadSession.outputStream != null) {
                            boolean bStillPending = true;
                            if(System.currentTimeMillis() - cTimeChecker > checkerIntervelMsec) {
                                cTimeChecker = System.currentTimeMillis();
                                try {
                                    if(threadSession.out != null) {
                                        threadSession.out.print("<Liquid></Liquid>");
                                        threadSession.out.flush();
                                    }
                                    if(threadSession.outputStream != null) {
                                        wsStreamerClient.send( threadSession.outputStream, "<Liquid></Liquid>", threadSession.token, "P" );
                                    }
                                } catch (Exception ex) {
                                    // request cancelled
                                    Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, "WARNING : MessageBox.show() : the end user has cancelled the reaquest");
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
                                    try {
                                        retVal = (incomingMessage != null && !incomingMessage.isEmpty() ? Integer.parseInt(incomingMessage) : 0);
                                    } catch (Exception ex) {
                                        retVal = -1;
                                    }
                                    ThreadSession.resetIncomingMessage();
                                    break;
                                }
                            }
                        } else {
                            // no stream
                        }
                    }
                } catch (InterruptedException ex) {
                    Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, ex);
                }
            } else {
                // Fatal error
                Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, null, "No output stream available. Cannot communicate with client");
            }
        } else {
            // Fatal error
            Logger.getLogger(Messagebox.class.getName()).log(Level.SEVERE, "No sessionInfo available... No HttpRequest started so cannot communicate with client");
        }
        return retVal;
    }    
}
