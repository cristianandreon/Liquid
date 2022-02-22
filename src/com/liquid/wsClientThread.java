/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.Socket;
import java.net.SocketAddress;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONException;




class wsClientThread extends Thread {

    public boolean run = true;
    public String id = null;
    public String error = null;
    public String hostName = null;
    public wsServerThread serverThread = null;

    private Socket clientSocket = null;
    private SocketAddress ra = null;
    private OutputStream outputStream = null;

    wsClientThread(Socket clientSocket) {
        this.clientSocket = clientSocket;
        this.ra = clientSocket.getRemoteSocketAddress();
    }

    public void run() {
        System.out.println("[LIQUID Streamer] : ClientThread running");

        wsStreamerServer.nConnections++;

        InputStream inputStream;
        try {
            inputStream = clientSocket.getInputStream();
        } catch (IOException ex) {
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            throw new IllegalStateException("Could not connect to client input stream", ex);
        }

        try {
            outputStream = clientSocket.getOutputStream();
        } catch (IOException ex) {
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            throw new IllegalStateException("Could not connect to client input stream", ex);
        }

        try {
            wsStreamerClient.doHandShakeToInitializeWebSocketConnection(inputStream, outputStream);
        } catch (UnsupportedEncodingException ex) {
            error = ex.getLocalizedMessage();
            wsStreamerServer.errors += error + "\n";
            throw new IllegalStateException("Could not connect to client input stream", ex);
        }

        // Welcome
        /*
            try {
                send(("[LIQUID Streamer Ver.:" + ServerClientThread.version + "] start session").getBytes());
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
         */
        this.hostName = this.clientSocket.getLocalAddress().getHostName() + " - " + this.clientSocket.getRemoteSocketAddress() + "-" + login.getSaltString(16);
        Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : client conencted : " + this.hostName);

        while (run) {
            try {
                if(outputStream != null) {
                    if (wsStreamerClient.processMessageLoop(this, inputStream, outputStream) < 0) {
                        serverThread.clientThreads.remove(this);
                        return;
                    }
                }
            } catch (IOException ex) {
                error = ex.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                // throw new IllegalStateException("Could not connect to client input stream", ex);
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : processMessageLoop() error : " + ex.getLocalizedMessage());
                run = false;
            } catch (JSONException ex) {
                error = ex.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                // throw new IllegalStateException("Could not connect to client input stream", ex);
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : processMessageLoop() error : " + ex.getLocalizedMessage());
                run = false;
            } catch (InterruptedException ex) {
                error = ex.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                // throw new IllegalStateException("Could not connect to client input stream", ex);
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : processMessageLoop() error : " + ex.getLocalizedMessage());
                run = false;
            } catch (Exception ex) {
                error = ex.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : processMessageLoop() error : " + ex.getLocalizedMessage());
                run = false;
            } catch (Throwable th) {
                error = th.getLocalizedMessage();
                wsStreamerServer.errors += error + "\n";
                Logger.getLogger(wsStreamerClient.class.getName()).log(Level.INFO, "[LIQUID Streamer] : processMessageLoop() error : " + th.getLocalizedMessage());
                run = false;
            }
        }
    }
}
