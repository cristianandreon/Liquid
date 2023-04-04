/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.ArrayList;

import ch.ethz.ssh2.Connection;
import ch.ethz.ssh2.Session;
import ch.ethz.ssh2.StreamGobbler;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.SftpException;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributeView;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileTime;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;

/**
 *
 * @author root
 */
public class sshManager {

    public long delayTimeMs = 100;

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
        ArrayList<String> resultLines = cmd((String)" history -d $(($HISTCMD-1))", (String) null);
        if(resultLines != null) {
            for(int i=0; i<resultLines.size(); i++) {
                if(i > 0) {
                    // normally don't happes
                    System.err.println("removeLastCommand() outout:"+resultLines.get(i));
                    java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.SEVERE, "removeLastCommand() outout:"+resultLines.get(i));
                }
            }
        }
    }

    public ArrayList<String> cmd(String commands, String param) throws InterruptedException {
        ArrayList<String> ls = new ArrayList<String>();
        
        String [] commands_array = commands.split("\r\n\r\n");
        if (commands_array != null) {
            try {
                
                for(int ic=0; ic<commands_array.length; ic++) {
                    String command = commands_array[ic];

                    if(!command.isEmpty()) {
                        if (command.lastIndexOf("\n") != command.length() - 1) {
                            command += "\n";
                        }

                        if(stdout != null) {
                            while (stdout.available() > 0) {
                                String residual = br.readLine();
                                System.out.print(residual);
                                java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.SEVERE, residual);
                            }
                        }
                        if(stderr != null) {
                            while (stderr.available() > 0) {
                                String residualErr = brErr.readLine();
                                System.err.print(residualErr);
                                java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.SEVERE, residualErr);
                            }
                        }



                        if(writer != null) {
                            writer.write(command);
                            writer.flush();
                        }

                        if (stderr.available() > 0) {
                            String err = brErr.readLine();
                            System.err.println(err);
                            java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.SEVERE, err);
                        }

                        Thread.sleep(delayTimeMs);

                        if (param != null) {
                            if (param.lastIndexOf("\n") != command.length() - 1) {
                                param += "\n";
                            }
                            sess.getStdin().write(param.getBytes());
                            sess.getStdin().flush();
                        }

                        Thread.sleep(delayTimeMs);

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
                                } else {
                                    boolean bAddLine = true;
                                    if(ls.size()>0) {
                                        String last = ls.get(ls.size()-1);
                                        if(!last.isEmpty()) {
                                            if((int)last.charAt(last.length()-1) == 32) {
                                                ls.set(ls.size()-1, last.substring(last.length()-1)+line);
                                                bAddLine = false;
                                            }
                                        }
                                    }
                                    if(bAddLine) {
                                        ls.add(line);
                                        System.out.println(line);
                                    }
                                }
                                java.util.logging.Logger.getLogger(sshManager.class.getName()).log(Level.INFO, line);
                            } else {
                                break;
                            }
                        }

                        /*                
                        writer.write(" \n");
                        writer.flush();

                        Thread.sleep(delayTimeMs);
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
                        */


                        // sess.close();
                        // sess = null;
                    }
                }
            
            } catch (IOException e) {
                System.err.print("cmd() error:"+e.getMessage());   
                return null;
            }
        }
        return ls;
    }
    
    
    static public String copy_file_to_user_folder(String ip, String usr, String psw, String remoteFile, String tempFolder) throws InterruptedException {
        String newRemoteFile = null;
        try {
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

            newRemoteFile = "/home/"+usr+"/"+tempFolder+"/"+fileName;
            cmd = " cp "+remoteFile+" " + newRemoteFile;
            ssh.cmd(cmd);
            ssh.removeLastCommand();
        } catch (Exception e) {
            System.err.print("copy_file_to_user_folder() error:"+e.getMessage());            
        }
        
        return newRemoteFile;
    }
    
    static public boolean remove_file_from_user_folder(String ip, String usr, String psw, String remoteFile) throws InterruptedException {
        try {
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
            } catch (Exception e) {
                System.err.print("remove_file_from_user_folder() error:"+e.getMessage());
                return false;
            }
        
        return true;
    }
    
    public boolean create_folders(String folder, String user) throws InterruptedException {
        
        String [] folders = folder.split("/");        
        String sCmd = null, baseFolder = "";
        
        for (int i=0; i<folders.length; i++) {
            
            try {
                
                if(!"home".equalsIgnoreCase(folders[i]) && !user.equalsIgnoreCase(folders[i]) && !"".equalsIgnoreCase(folders[i])) {
                    sCmd = " mkdir -p " + baseFolder+""+folders[i];
                    cmd(sCmd);

                    sCmd = " chown " + user + " " + baseFolder+""+folders[i] + "";
                    cmd(sCmd);

                    sCmd = " chmod " + "744" + " " + baseFolder+""+folders[i] + "";
                    cmd(sCmd); 
                }
                baseFolder += folders[i] + "/";
                
            } catch (Exception e) {
                System.err.print("create_folders() error:"+e.getMessage());            
                return false;
            }
        }
        
        return true;
    }    
    
    public long getRemoteFileSize(String file) throws InterruptedException {
        long fileSize = 0L;
        try {
            // FCK : need second command to carry result of the previous one
            String sCmd = " ls -l " + file;
            ArrayList<String> resultLines = cmd(sCmd + "\r\n\r\n\n");
            removeLastCommand();
            
            if(resultLines != null) {
                if(resultLines.size() >= 3) {
                    for(int i=0; i<resultLines.size(); i++) {
                        if(resultLines.get(i+1).contains(sCmd)) {
                        } else if(resultLines.get(i+1).contains(file)) {                           
                            String line = resultLines.get(i+1);
                            if(line.contains(sCmd)) {
                                String [] parts = line.split(" ");
                                // -rw-r--r-- 1 root root 36454433 Feb 18 13:45 sia.war
                                if(parts.length >= 4) {
                                    String sSize = parts[4];
                                    if(sSize != null && !sSize.isEmpty()) {
                                        fileSize = Long.parseLong(sSize);
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            System.err.print("get_file_size() error:"+e.getMessage());
        }
        
        return fileSize;
    }
    
    public Date [] getRemoteFileDate(String file) throws InterruptedException {
        Date [] date_arr = new Date[3];
        try {
            // FCK : need second command to carry result of the previous one
            String sCmd = " stat " + file + "\r\n\r\n\n";
            ArrayList<String> resultLines = cmd(sCmd);
            removeLastCommand();
            
            if(resultLines != null) {
                for(int i=0; i<resultLines.size(); i++) {
                    String line = resultLines.get(i).trim();

                    if(line.startsWith("Access:") 
                            || line.startsWith("Modify:") 
                            || line.startsWith("Change:") 
                            ) {
                        String [] parts = line.split(" ");
                        
                        if(parts.length >= 4) {
                            String sDate = parts[1] + " " + parts[2];
                            // 2021-02-19 01:11:49.962409164
                            try {
                                DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SS");
                                java.util.Date valueDate = dateFormat.parse(sDate);
                                if(valueDate != null) {
                                    if(line.startsWith("Access:")) {
                                        date_arr[0] = valueDate;
                                    } else if(line.startsWith("Modify:")) {
                                        date_arr[1] = valueDate;
                                    } else if(line.startsWith("Change:")) {
                                        date_arr[2] = valueDate;
                                    }
                                }
                            } catch(Exception ex) {                                
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            System.err.print("get_file_size() error:"+e.getMessage());
        }
        
        return date_arr;
    }    
    
     public boolean isRemoteFileChanged(String host, String user, String password, String sourceFile, String targetFile) throws Exception {
        boolean isRemoteFileChanged = true;
        try {
            java.util.Date [] date_arr = getRemoteFileDate(targetFile);                                        
            if(date_arr != null) {
                File sourcefile = new File(sourceFile);
                Path path = Paths.get(sourcefile.getPath());
                BasicFileAttributeView attributes = Files.getFileAttributeView(path, BasicFileAttributeView.class, LinkOption.NOFOLLOW_LINKS);
                BasicFileAttributes latt = attributes.readAttributes();
                FileTime ctf = latt.lastModifiedTime();                                            
                long ct = ctf.toMillis() / 1000;
                long rt = date_arr[1] != null ? date_arr[1].getTime() / 1000 : 0;
                if (ct > (long) rt) {
                    // file changed
                } else {
                    long lRetVal = getRemoteFileSize(targetFile);
                    if(lRetVal != sourcefile.length()) {
                        // file changed
                    } else {
                        // file not changed
                        isRemoteFileChanged = false;
                    }
                }
            }
        } catch (Exception e) {
            System.err.print("isRemoteFileChanged() error:"+e.getMessage());
        }
        return isRemoteFileChanged;
     }
     
    public String [] getRemoteDiskInfo() throws InterruptedException {
        String [] info_arr = new String[10];
        boolean bDetectedData = false;
        int count = 0;
        try {
            // FCK : need second command to carry result of the previous one
            String sCmd = " df" + "\r\n\r\n\n";
            ArrayList<String> resultLines = cmd(sCmd);
            removeLastCommand();
            
            if(resultLines != null) {
                for(int i=0; i<resultLines.size(); i++) {
                    String line = resultLines.get(i).trim();
                    /*
                                            40137760  32594572   5511012  86% /
                      none                   4093244       200   4093044   1% /dev
                      none                   4098096         0   4098096   0% /dev/shm
                      none                   4098096        64   4098032   1% /var/run
                      none                   4098096         0   4098096   0% /var/lock
                      none                   4098096         0   4098096   0% /lib/init/rw
                      /dev/sda1               233191     48991    171759  23% /boot
                    */
                    
                    if(line.startsWith("Filesystem")) {
                        bDetectedData = true;
                    }
                    if(bDetectedData) {
                        if(count == 2) {
                            String [] parts = line.split(" ");
                            if(parts.length >= 9) {
                                // 1K-blocks      Used Available Use% Mounted on
                                info_arr[0] = parts[0]; // 1K-blocks
                                info_arr[1] = parts[2]; // Used
                                info_arr[2] = parts[5]; // Available
                                info_arr[3] = parts[7]; // Use
                                info_arr[4] = parts[8]; // Mounted on
                            }
                        }
                        count++;
                    }
                }
            }

        } catch (Exception e) {
            System.err.print("getRemoteDiskInfo() error:"+e.getMessage());
        }
        
        return info_arr;
    }    
     
}
