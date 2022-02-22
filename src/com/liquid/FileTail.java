/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import org.json.JSONException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.JspWriter;
import java.io.*;
import java.net.Socket;
import java.net.SocketAddress;
import java.util.logging.Level;
import java.util.logging.Logger;


class FileTail extends Thread {

    public String fileName;
    public boolean keepReadingTail = true;
    public OutputStream outputStream = null;
    public HttpServletRequest request = null;
    public String token = null;
    public String error = null;

    static FileTail glFileTail = null;

    /**
     * Start single instance listem thread to file content
     *
     * @param outputStream
     * @param request
     * @param jspWriter
     * @param token
     * @return
     */
    public static boolean start_tail_file(OutputStream outputStream, HttpServletRequest request, JspWriter jspWriter, String token) throws IOException {
        if(outputStream != null && request != null) {
            if(glFileTail != null) {
                stop_tail_file(outputStream, request, jspWriter, token);
                glFileTail = null;
            }
            if(glFileTail == null) {
                FileTail fileTail = new FileTail();
                glFileTail = fileTail;
                fileTail.fileName = request.getParameter("fileName");

                if(utility.fileExist(fileTail.fileName)) {
                    fileTail.outputStream = outputStream;
                    fileTail.request = request;
                    fileTail.token = token;
                    fileTail.keepReadingTail = true;

                    // Avvio del thread
                    fileTail.start();

                    return true;
                } else {
                    fileTail.error = "File '"+fileTail.fileName+"' not found";
                    outputStream.write(fileTail.error.getBytes());
                    outputStream.flush();
                    outputStream.close();
                    return false;
                }
            }
        }
        return false;
    }

    public static boolean stop_tail_file(OutputStream outputStream, HttpServletRequest request, JspWriter jspWriter, String token) {
        if (glFileTail != null) {
            glFileTail.keepReadingTail = false;
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            if(glFileTail.isAlive()) {
                glFileTail.stop();
            }
            glFileTail = null;
            return true;
        }
        return false;
    }

    public void run() {

        try {

            this.error = null;

            File f = new File(fileName);
            BufferedReader inStream = new BufferedReader( new InputStreamReader( new FileInputStream(f) ));
            boolean retVal = false;
            int lineCount = 0;

            if (inStream != null) {

                // go to EOF
                while (true) {
                    if (inStream.ready()) {
                        inStream.readLine();
                    } else {
                        break;
                    }
                }

                String line = null;
                while (keepReadingTail) {
                    if (inStream.ready()) {
                        line = inStream.readLine();
                        lineCount++;
                        if (line != null) {
                            if(outputStream != null) {
                                wsStreamerClient.send(outputStream, line, token);
                            }
                        }
                    } else {
                        Thread.sleep(1000);
                    }
                }
            }

        } catch (Exception e) {
            Logger.getLogger(utility.class.getName()).log(Level.SEVERE, null, e);
            error = e.getMessage();
            keepReadingTail = false;
            if(e instanceof java.net.SocketException) {
                try {
                    outputStream.close();
                } catch (IOException e2) {
                    e.printStackTrace();
                }
                outputStream = null;
            }
        }

        if(outputStream != null) {
            try {
                if(error != null && !error.isEmpty()) {
                    outputStream.write(("error:" + error).getBytes());
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
            try {
                outputStream.flush();
            } catch (IOException e) {
                e.printStackTrace();
            }

            /* NON Spetta al tail chiudere lo stream
            try {
                outputStream.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            outputStream = null;
            */
        }
    }
}
