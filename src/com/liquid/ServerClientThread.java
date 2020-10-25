/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.BindException;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketAddress;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPOutputStream;
import javax.xml.bind.DatatypeConverter;

/**
 * 
 */

public class ServerClientThread {
    
    
    /**
     * Manage the clients connections
     */
    class ServerThread extends Thread {

        public String error;
                
        public boolean run = false;
        public int bufSize = 0;
        public int timeout = 0;

        private ServerSocket server = null;
        ArrayList<ClientThread> clientThreads = new ArrayList<ClientThread> ();

        public void run() {

            try {
                server = new ServerSocket(StreamerServer.port);
            } catch (BindException ex) {
                //
                // may be other service maybe our service still pending (when you stop and restart debugger the application server, and the listner) is still running
                // anyway don't know how to acquire existing listen socket
                //
                StreamerServer.run = true;
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not create web server", ex);
            } catch (IOException ex) {
                StreamerServer.run = false;
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not create web server", ex);
            }

            try {
                bufSize = server.getReceiveBufferSize();
                timeout = server.getSoTimeout();
            } catch (Exception ex) {                
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                Logger.getLogger(ServerClientThread.class.getName()).log(Level.SEVERE, null, ex);
            }

            run = true;            

            while(run) {

                Socket clientSocket = null;

                try {
                    // waits until a client connects
                    clientSocket = server.accept();
                    if (clientSocket != null) {
                        ClientThread clientThread = new ClientThread(clientSocket);
                        clientThread.serverThread = this;
                        clientThreads.add(clientThread);
                        clientThread.start();
                    }

                } catch (IOException ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                    throw new IllegalStateException("Could not wait for client connection", ex);
                }
            }
        }
    }
    
    
    /**
     * Manage the client requests
     */
    
    class ClientThread extends Thread {

        public boolean run = true;
        public String id = null;
        public String error = null;
        
        private Socket clientSocket = null;
        private SocketAddress ra = null;
        private ServerThread serverThread = null;
        private OutputStream outputStream = null;

        ClientThread(Socket clientSocket) {
            this.clientSocket = clientSocket;
            this.ra = clientSocket.getRemoteSocketAddress();
        }

        public void run() {
            System.out.println("[LIQUID Streamer] : ClientThread running");

            StreamerServer.nConnections++;
            
            InputStream inputStream;
            try {
                inputStream = clientSocket.getInputStream();
            } catch (IOException ex) {
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not connect to client input stream", ex);
            }
            
            try {
                outputStream = clientSocket.getOutputStream();
            } catch (IOException ex) {
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not connect to client input stream", ex);
            }

            try {
                doHandShakeToInitializeWebSocketConnection(inputStream, outputStream);
            } catch (UnsupportedEncodingException ex) {
                error = ex.getLocalizedMessage();
                StreamerServer.errors += error + "\n";
                throw new IllegalStateException("Could not connect to client input stream", ex);
            }

            try {
                outputStream.write(encode("[LIQUID Streamer] start"));
                outputStream.flush();
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }

            while (run) {
                try {
                    if(ServerClientThread.processMessageLoop(inputStream) < 0) {
                        serverThread.clientThreads.remove(this);
                        return;
                    }
                } catch (IOException ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                    throw new IllegalStateException("Could not connect to client input stream", ex);
                }
            }
        }
        
        public int send(String data) throws IOException {
            return ServerClientThread.send(this.outputStream, data);
        }
    }

    
    
    
    /**
     * Handle incoming data
     * 
     * @param inputStream
     * @return
     * @throws IOException 
     */

    private static int processMessageLoop(InputStream inputStream) throws IOException {
        int len = 0;
        byte[] b = new byte[1024];
        // rawIn is a Socket.getInputStream();
        while (true) {
            len = inputStream.read(b);
            if (len != -1) {

                byte rLength = 0;
                int rMaskIndex = 2;
                int rDataStart = 0;
                //b[0] is always text in my case so no need to check;
                byte data = b[1];
                byte op = (byte) 127;
                rLength = (byte) (data & op);

                if (rLength == (byte) 126) {
                    rMaskIndex = 4;
                }
                if (rLength == (byte) 127) {
                    rMaskIndex = 10;
                }

                byte[] masks = new byte[4];

                int j = 0;
                int i = 0;
                for (i = rMaskIndex; i < (rMaskIndex + 4); i++) {
                    masks[j] = b[i];
                    j++;
                }

                rDataStart = rMaskIndex + 4;

                int messLen = len - rDataStart;

                byte[] message = new byte[messLen];

                for (i = rDataStart, j = 0; i < len; i++, j++) {
                    message[j] = (byte) (b[i] ^ masks[j % 4]);
                }

                StreamerServer.nRequests++;
                StreamerServer.nRecived += message.length;

                System.out.println("[LIQUID Streamer] < "+message.length+"bytes");

                b = new byte[1024];

            } else {
                inputStream.close();
                return -1;
            }
        }
    }
    
    
    /**
     * sendind data back to client
     * 
     * @param outputStream
     * @param data
     * @return
     * @throws IOException 
     */
    private static int send(OutputStream outputStream, String data) throws IOException {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream(data.length());
        try {
            GZIPOutputStream zipStream = new GZIPOutputStream(byteStream);

            zipStream.write(data.getBytes());
            zipStream.close();
        } finally {
            byteStream.close();
        }

        byte[] compressedData = byteStream.toByteArray();

        outputStream.write(compressedData, 0, compressedData.length);
        outputStream.flush();
        return compressedData.length;
    }
    

    /**
     * encode the message arrived (websocket protocol)
     * 
     * @param mess
     * @return
     * @throws IOException 
     */
    public static byte[] encode(String mess) throws IOException {
        byte[] rawData = mess.getBytes();

        int frameCount = 0;
        byte[] frame = new byte[10];

        frame[0] = (byte) 129;

        if (rawData.length <= 125) {
            frame[1] = (byte) rawData.length;
            frameCount = 2;
        } else if (rawData.length >= 126 && rawData.length <= 65535) {
            frame[1] = (byte) 126;
            int len = rawData.length;
            frame[2] = (byte) ((len >> 8) & (byte) 255);
            frame[3] = (byte) (len & (byte) 255);
            frameCount = 4;
        } else {
            frame[1] = (byte) 127;
            int len = rawData.length;
            frame[2] = (byte) ((len >> 56) & (byte) 255);
            frame[3] = (byte) ((len >> 48) & (byte) 255);
            frame[4] = (byte) ((len >> 40) & (byte) 255);
            frame[5] = (byte) ((len >> 32) & (byte) 255);
            frame[6] = (byte) ((len >> 24) & (byte) 255);
            frame[7] = (byte) ((len >> 16) & (byte) 255);
            frame[8] = (byte) ((len >> 8) & (byte) 255);
            frame[9] = (byte) (len & (byte) 255);
            frameCount = 10;
        }

        int bLength = frameCount + rawData.length;

        byte[] reply = new byte[bLength];

        int bLim = 0;
        for (int i = 0; i < frameCount; i++) {
            reply[bLim] = frame[i];
            bLim++;
        }
        for (int i = 0; i < rawData.length; i++) {
            reply[bLim] = rawData[i];
            bLim++;
        }

        return reply;
    }

    
    /**
     * upgrading to websocket protocol
     * @param inputStream
     * @param outputStream
     * @throws UnsupportedEncodingException 
     */
    private static void doHandShakeToInitializeWebSocketConnection(InputStream inputStream, OutputStream outputStream) throws UnsupportedEncodingException {
        String data = new Scanner(inputStream, "UTF-8").useDelimiter("\\r\\n\\r\\n").next();

        Matcher get = Pattern.compile("^GET").matcher(data);

        if (get.find()) {
            Matcher match = Pattern.compile("Sec-WebSocket-Key: (.*)").matcher(data);
            boolean found = match.find();

            byte[] response = null;
            try {
                response = ("HTTP/1.1 101 Switching Protocols\r\n"
                        + "Connection: Upgrade\r\n"
                        + "Upgrade: websocket\r\n"
                        + "Sec-WebSocket-Accept: "
                        + utility.base64Encode( MessageDigest.getInstance("SHA-1").digest((match.group(1) + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes("UTF-8")) )
                        + "\r\n\r\n")
                        .getBytes("UTF-8");
            } catch (NoSuchAlgorithmException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }

            try {
                outputStream.write(response, 0, response.length);
            } catch (IOException ex) {
                Logger.getLogger(ServerClientThread.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else {
            Logger.getLogger(ServerClientThread.class.getName()).log(Level.SEVERE, "doHandShakeToInitializeWebSocketConnection() : unexpected case!");
        }
    }
}
