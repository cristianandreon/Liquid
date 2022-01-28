/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.net.BindException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;



/**
 * Manage the clients connections
 */
class wsServerThread extends Thread {

    public String error;

    public boolean run = false;
    public int bufSize = 0;
    public int timeout = 0;

    public ArrayList<wsClientThread> clientThreads = new ArrayList<wsClientThread> ();

    private ServerSocket server = null;

    public void run() {

        try {
            server = new ServerSocket(wsStreamerServer.port);
        } catch (BindException ex) {
            //
            // may be other service maybe our service still pending (when you stop and restart debugger the application server, and the listner) is still running
            // anyway don't know how to acquire existing listen socket
            //
            wsStreamerServer.run = true;
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            throw new IllegalStateException("Could not create web server", ex);
        } catch (IOException ex) {
            wsStreamerServer.run = false;
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            throw new IllegalStateException("Could not create web server", ex);
        }

        try {

            bufSize = server.getReceiveBufferSize();
            timeout = server.getSoTimeout();

        } catch (Exception ex) {                
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            Logger.getLogger(wsStreamerClient.class.getName()).log(Level.SEVERE, null, ex);
        }

        run = true;            

        while(run) {

            Socket clientSocket = null;

            try {
                // waits until a client connects
                clientSocket = server.accept();
                if (clientSocket != null) {
                    wsClientThread clientThread = new wsClientThread(clientSocket);
                    clientThread.serverThread = this;
                    clientThreads.add(clientThread);
                    clientThread.start();
                }

            } catch (IOException ex) {
                error = ex.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not wait for client connection", ex);
            }
        }
    }
}
