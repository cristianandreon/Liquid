/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.BindException;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Map;
import java.util.Scanner;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletInputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.servlet.jsp.JspWriter;
import org.json.JSONException;
import org.json.JSONObject;


/**
 * TODO: unzip request from client
 * TODO: send binary zipped as response
 */

public class ServerClientThread {
    
    static public String version = "1.01";
    
    
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
        private String hostName = null;

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

            
            this.hostName = this.clientSocket.getLocalAddress().getHostName() + " - " + this.clientSocket.getRemoteSocketAddress() + "-"+login.getSaltString(16);
            Logger.getLogger(ServerClientThread.class.getName()).log(Level.INFO, "[LIQUID Srteamer] : client conencted : "+this.hostName);
            
            while (run) {
                try {
                    if(ServerClientThread.processMessageLoop(this, inputStream, outputStream) < 0) {
                        serverThread.clientThreads.remove(this);
                        return;
                    }
                } catch (IOException ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                    throw new IllegalStateException("Could not connect to client input stream", ex);
                } catch (JSONException ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                    // throw new IllegalStateException("Could not connect to client input stream", ex);
                } catch (InterruptedException ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                    // throw new IllegalStateException("Could not connect to client input stream", ex);
                } catch (Exception ex) {
                    error = ex.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                } catch (Throwable th) {
                    error = th.getLocalizedMessage();
                    StreamerServer.errors += error + "\n";
                }
            }
        }
    }

    
    
    
    /**
     * Handle incoming data
     * 
     * @param inputStream
     * @return
     * @throws IOException 
     */

    private static int processMessageLoop(ClientThread clientThread, InputStream inputStream, OutputStream outputStream) throws IOException, JSONException, InterruptedException {
        int len = 0;
        byte[] b = new byte[1024];
        // rawIn is a Socket.getInputStream();
        while (true) {
            len = inputStream.read(b);
            if (len != -1) {

                byte rLength = 0;
                int rMaskIndex = 2;
                int rDataStart = 0;

                byte data = b[1];
                rLength = (byte) (data & (byte) 127);

                byte opCode = (byte) (((b[0] >> 4) & 0xFF) << 4);
                
                // disconnect ?
                int disconnect = opCode & (byte)0x8;
                if(disconnect == 8) {
                    if(clientThread != null) {
                        Logger.getLogger(ServerClientThread.class.getName()).log(Level.INFO, "[LIQUID Srteamer] : client disconencted : "+clientThread.hostName);                        
                    }
                    return -1;
                }
                

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
                // System.out.println("[LIQUID Streamer] \" "+new String(message)+"\"");

                ByteBuffer wrapped = ByteBuffer.wrap(message); // big-endian by default
                        
                
                long msgLen = getUnsignedInt(message, 0);
                int msgType = getUnsignedShort(message, 4);
                
                byte[] decompressedData = null;
                if(msgType == 1) {
                    decompressedData = gunzip(Arrays.copyOfRange(message, 4+2, message.length));
                } else if(msgType == 0) {
                    decompressedData = Arrays.copyOfRange(message, 4+2, message.length);
                } else {
                    // unexpected type
                    Logger.getLogger(ServerClientThread.class.getName()).log(Level.INFO, "[LIQUID Srteamer] : unexpected data type on host : "+clientThread.hostName);                        
                }
                
                if(decompressedData != null) {
                    handleCommand(decompressedData, outputStream);
                }

            } else {
                inputStream.close();
                if(clientThread != null) {
                    Logger.getLogger(ServerClientThread.class.getName()).log(Level.INFO, "[LIQUID Srteamer] : client terminated : "+clientThread.hostName);                        
                }
                return -1;
            }
        }
    }
    
    public static long getUnsignedInt(byte[] data, int pos) {
        long result = 0;
        for (int i = pos; i < pos+4; i++) {
            result += data[i] << 8 * (data.length - 1 - i);
        }
        return result;
    }
    public static int getUnsignedShort(byte[] data, int pos) {
        return (int)((data[pos+0] << 8) & 0xff00) | (data[pos+1] & 0x00ff);
    }
    

    static public boolean handleCommand( byte[] decompressedData, OutputStream outputStream ) throws JSONException, IOException, InterruptedException {
        boolean retVal = false;
        if(decompressedData != null) {
            if(decompressedData[0] == '{') {
                JSONObject requestJson = new JSONObject(new String(decompressedData, java.nio.charset.Charset.defaultCharset()));
                String operation = null;
                String sessionId = null;
                String token = null;
                
                try {
                
                    if(requestJson.has("sessionId")) {
                        sessionId = requestJson.getString("sessionId");
                        if(sessionId != null) {
                            // register the session
                            ThreadSession.saveThreadSessionInfo ( "Liquid", sessionId );
                        }
                    }
                    if(requestJson.has("token")) {
                        token = requestJson.getString("token");
                    }
                    
                    wsHttpServletRequest resuest = new wsHttpServletRequest(requestJson);
                    operation = resuest.getParameter("operation");
                    

                    if("get".equalsIgnoreCase(operation)) {

                        send( outputStream, db.get_table_recordset( (HttpServletRequest)resuest, (JspWriter)null ), token );
                        retVal = true;
                        
                    } else if ("auto".equalsIgnoreCase(operation)) {
                        // get the default json configuration of a control
                        send( outputStream, workspace.get_default_json( (HttpServletRequest)resuest, (JspWriter)null ), token );
                        retVal = true;

                    } else {
                        Logger.getLogger(ServerClientThread.class.getName()).log(Level.SEVERE, "[LIQUID Streamer] unsupported operation : "+operation);
                    }

                } catch (Throwable th) {
                    Logger.getLogger(ServerClientThread.class.getName()).log(Level.SEVERE, null, th);
                } finally {
                    ThreadSession.removeThreadSessionInfo();
                }                    
            } else {
                // not expected
            }
        }
        return retVal;
    }
    
    /**
     * sendind data back to client
     * 
     * @param outputStream
     * @param data
     * @return
     * @throws IOException 
     */
    private static int send(OutputStream outputStream, String data, String token) throws IOException {
        return send(outputStream, data.getBytes(), token);
    }
    private static int send(OutputStream outputStream, byte[] data, String token) throws IOException {
        boolean bZip = false;
        byte[] compressedData = encode( bZip ? gzip(data) : data, bZip, token );
        outputStream.write(compressedData, 0, compressedData.length);
        outputStream.flush();
        return compressedData.length;
    }
    
    private static byte[] gzip(String data) throws IOException {
        return gzip(data.getBytes());
    }
    
    private static byte[] gzip(byte [] data) throws IOException {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream(data.length+128);
        try {
            GZIPOutputStream zipStream = new GZIPOutputStream(byteStream);
            zipStream.write(data);
            zipStream.close();
        } finally {
            byteStream.close();
        }
        return byteStream.toByteArray();
    }
    
    private static byte[] gunzip(byte [] data) throws IOException {
        /*
        for(int i=0; i<data.length; i++)
            if(data[i] < 0) 
                data[i] = (byte) (127 + data[i]);
        */
        ByteArrayInputStream byteStream = new ByteArrayInputStream(data);
        try {
            GZIPInputStream zipStream = new GZIPInputStream(byteStream);
            zipStream.read(data);
            zipStream.close();
        } finally {
            byteStream.close();
        }
        return byteStream.readAllBytes();
    }
    

    /**
     * encode the message arrived (websocket protocol)
     * 
     * @param mess
     * @return
     * @throws IOException 
     */
    public static byte[] encode( byte[] rawData, boolean bBinary, String token ) throws IOException {
        int frameCount = 0;
        byte[] frame = new byte[10];

        frame[0] = (byte)(bBinary ? 128 : 128+1);

        int len = 1 + 32 + rawData.length;
        
        if (len <= 125) {
            frame[1] = (byte) (len);
            frameCount = 2;
        } else if (len >= 126 && len <= 65535) {
            frame[1] = (byte) 126;
            frame[2] = (byte) ((len >> 8) & (byte) 255);
            frame[3] = (byte) (len & (byte) 255);
            frameCount = 4;
        } else {
            frame[1] = (byte) 127;
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

        int bLength = frameCount + len;

        byte[] reply = new byte[bLength];

        int bLim = 0;
        for (int i = 0; i < frameCount; i++) {
            reply[bLim] = frame[i];
            bLim++;
        }

        reply[bLim] = (byte)(bBinary ? 'B' : ' ');
        bLim++;

        for (int i = 0; i < 32; i++) {
            reply[bLim] = (byte)token.charAt(i);
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
