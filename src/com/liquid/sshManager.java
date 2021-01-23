/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.ArrayList;

import ch.ethz.ssh2.ChannelCondition;
import ch.ethz.ssh2.Connection;
import ch.ethz.ssh2.Session;
import ch.ethz.ssh2.StreamGobbler;
import java.io.File;
import java.io.IOException;
import java.util.logging.Level;

/**
 *
 * @author root
 */
public class sshManager {

    public long delayTimeMs = 500;

    private Connection conn = null;
    private Session sess = null;
    public OutputStreamWriter writer = null;
    public PrintWriter pw = null;
    public InputStream stdout = null;
    public InputStream stderr = null;
    public InputStreamReader isOut = null;
    public InputStreamReader isErr = null;
    public BufferedReader br = null;
    public BufferedReader brErr = null;

    public String ip = null;
    public String usr = null;
    public String psw = null;

    public ArrayList<String> errors = new ArrayList<String>();

    // ...
    public boolean connect(String ip, String usr, String psw) throws InterruptedException {
        if (conn == null) {
            ArrayList<String> ls = new ArrayList<String>();
            try {

                errors.clear();

                conn = new Connection(ip);
                conn.connect();

                // autenticazione...
                boolean isAuthenticated = conn.authenticateWithPassword(usr, psw);
                // verifica
                if (isAuthenticated == false) {
                    errors.add("Authentication error");
                    return false;
                }

                sess = conn.openSession();

                try {
                    sess.requestPTY("xterm");
                    sess.startShell();
                } catch (Exception e) {
                    sess.requestPTY("bash");
                    sess.startShell();
                }
                writer = new OutputStreamWriter(sess.getStdin(), "utf-8");
                // pw = new PrintWriter(sess.getStdin());

                stdout = new StreamGobbler(sess.getStdout());
                stderr = new StreamGobbler(sess.getStderr());
                isOut = new InputStreamReader(stdout);
                isErr = new InputStreamReader(stderr);
                br = new BufferedReader(isOut);
                brErr = new BufferedReader(isErr);

                this.ip = ip;
                this.usr = usr;
                this.psw = psw;

                Thread.sleep(500);
                long timeout = 10000L;
                // sess.waitForCondition(ChannelCondition.TIMEOUT | ChannelCondition.CLOSED | ChannelCondition.EOF | ChannelCondition.EXIT_STATUS, timeout);
                // int r = sess.waitUntilDataAvailable(timeout);

                long curTime = System.currentTimeMillis();
                while (System.currentTimeMillis() - curTime < timeout) {
                    if (stdout.available() > 0) {
                        while (stdout.available() > 0) {
                            String line = br.readLine();
                            System.out.print(line);
                        }
                        break;
                    }
                }

            } catch (IOException e) {
                return false;
            }
            return true;
        }
        return false;
    }

    public boolean close() {

        if (isOut != null) {
            try {
                isOut.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (isErr != null) {
            try {
                isErr.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        if (br != null) {
            try {
                br.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (brErr != null) {
            try {
                brErr.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        if (stdout != null) {
            try {
                stdout.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (stderr != null) {
            try {
                stderr.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        if (writer != null) {
            try {
                writer.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            writer = null;
        }
        if (pw != null) {
            try {
                writer.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            pw = null;
        }

        if (sess != null) {
            sess.close();
        }
        sess = null;

        if (conn != null) {
            conn.close();
        }
        conn = null;

        return true;
    }

    public ArrayList<String> ls(String dir) throws InterruptedException {
        return cmd("ls -r", new Object[]{dir});
    }

    public ArrayList<String> cp(String source, String target) throws InterruptedException {
        return cmd("cp", new Object[]{source, target});
    }

    public ArrayList<String> cmd(String cmd, Object[] args) throws InterruptedException {
        if (conn != null && sess != null) {
            String command = cmd;
            for (int i = 0; i < args.length; i++) {
                String arg = (String) args[i];
                command += " " + arg;
            }
            return cmd(command);
        }
        return null;
    }

    public ArrayList<String> cmd(String command) throws InterruptedException {
        return cmd(command, (String) null);
    }
    
    public void removeLastCommand() throws InterruptedException {         
        cmd((String)" history -d $(($HISTCMD-1))", (String) null);
    }

    public ArrayList<String> cmd(String command, String param) throws InterruptedException {
        ArrayList<String> ls = new ArrayList<String>();
        if (command != null) {
            try {

                if (command.lastIndexOf("\n") != command.length() - 1) {
                    command += "\n";
                }

                while (stdout.available() > 0) {
                    System.out.print(br.readLine());
                }
                while (stderr.available() > 0) {
                    System.err.print(brErr.readLine());
                }

                writer.write(command);
                writer.flush();

                Thread.sleep(delayTimeMs);

                if (param != null) {
                    if (param.lastIndexOf("\n") != command.length() - 1) {
                        param += "\n";
                    }
                    sess.getStdin().write(param.getBytes());
                }

                long timeout = 10000L;
                // sess.waitForCondition(ChannelCondition.TIMEOUT | ChannelCondition.CLOSED | ChannelCondition.EOF | ChannelCondition.EXIT_STATUS, timeout);
                // int r = sess.waitUntilDataAvailable(timeout);

                long curTime = System.currentTimeMillis();
                while (System.currentTimeMillis() - curTime < timeout) {
                    if (stdout.available() > 0) {
                        break;
                    }
                }

                while (true) {
                    if (stderr.available() > 0) {
                        String err = brErr.readLine();
                        System.err.println(err);
                        java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.SEVERE, err);
                    }
                    if (stdout.available() > 0) {
                        String line = br.readLine();
                        if (line == null) {
                            break;
                        }
                        ls.add(line);
                        System.out.println(line);
                        java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.INFO, line);
                    } else {
                        break;
                    }
                }
                // sess.close();
                // sess = null;

            } catch (IOException e) {
                return null;
            }
        }
        return ls;
    }
    
    
    static String copy_file_to_user_folder(String ip, String usr, String psw, String remoteFile, String tempFolder) throws InterruptedException {
        sshManager ssh = new sshManager();
        ssh.connect(ip, usr, psw);
        String cmd = " sudo su -";
        ssh.cmd(cmd, psw);
        ssh.removeLastCommand();
        
        File f = new File(remoteFile);
        String fileName = f.getName();
        cmd = " mkdir /home/"+usr+"/"+tempFolder;
        ssh.cmd(cmd);
        ssh.removeLastCommand();
        
        String newRemoteFile = "/home/"+usr+"/"+tempFolder+"/"+fileName;
        cmd = " cp "+remoteFile+" " + newRemoteFile;
        ssh.cmd(cmd);
        ssh.removeLastCommand();
        
        return newRemoteFile;
    }
    
    static boolean remove_file_from_user_folder(String ip, String usr, String psw, String remoteFile) throws InterruptedException {
        sshManager ssh = new sshManager();
        ssh.connect(ip, usr, psw);
        String cmd = " sudo su -";
        ssh.cmd(cmd, psw);
        ssh.removeLastCommand();
        
        File f = new File(remoteFile);
        String fileName = f.getName();
        cmd = " rm "+remoteFile;
        ssh.cmd(cmd);
        ssh.removeLastCommand();
        
        return true;
    }
    
}
