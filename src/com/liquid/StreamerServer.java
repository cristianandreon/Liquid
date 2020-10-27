/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.net.SocketException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;


/**
 * @ServerEndpoint da un nome all'end point Questo può essere acceduto via
 * ws://localhost:8080/myfirstws/echo "localhost" è l'indirizzo dell'host dove è
 * deployato il server ws, "myfirstws" è il nome del package ed "echo" è
 * l'indirizzo specifico di questo endpoint
 */
public class StreamerServer {

    static public String AppURL = null;
    static public int port = 7373;
    static public boolean run = false;
    static public SrteamerClient.ServerThread serverThread = null;
    static public String errors = "";
    static public long nConnections = 0;
    static public long nRequests = 0;
    static public long nRecived = 0;
    static public long nSent = 0;

    // override user's assets (test purpose)
    static public boolean applyForAllUsers = true;

    
    public static void start( HttpServletRequest request ) throws SocketException, IOException {
        try {
            AppURL = request.getContextPath();
            if(serverThread == null) {
                serverThread = new SrteamerClient().new ServerThread();
                serverThread.start();
                StreamerServer.run = true;
            }
        } catch (Exception ex) {
            Logger.getLogger(SrteamerClient.class.getName()).log(Level.SEVERE, "Could not create web server "+ex.getLocalizedMessage());
        }        
    }                
}
