package com.liquid;

import org.apache.commons.net.PrintCommandListener;
import org.apache.commons.net.ProtocolCommandListener;
import org.apache.commons.net.ftp.FTP;
import org.apache.commons.net.ftp.FTPClient;
import org.apache.commons.net.ftp.FTPReply;


import java.io.*;
import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;


public class ftp {

    static public String host = null;
    static public String user = null;
    static public String password = null;
    static public String mode = null;
    static public String remoteRootFolder = null;


    static boolean setByURL(String url) throws MalformedURLException {
        URL tptURL = new URL(url.startsWith("ftp://") ? url : "ftp://" + url);
        host = tptURL.getHost();
        Map<String, String> params = utility.query_string_to_hash_map(tptURL.getQuery());
        user = params.get("user");
        password = params.get("password");
        mode = params.get("mode");
        remoteRootFolder = params.get("remoteRootFolder");
        return true;
    }

    public static byte [] download(String remoteFile) throws IOException {
        return (byte[])main( new Object [] { host, user, password, null, remoteFile, "GET"} );
    }
    public static boolean upload(byte [] content, String remoteFile) throws IOException {
        return (boolean)main( new Object [] { host, user, password, content, remoteFile, "PUT"} );
    }
    public static boolean delete(String remoteFile) throws IOException {
        return (boolean)main( new Object [] { host, user, password, null, remoteFile, "DELETE"} );
    }

    public static Object main(final Object[] args) throws IOException {
        String server;
        String username;
        String password;
        Object localFile;
        String remoteFile;
        String command;
        Object retVal = null;
        boolean completed = false;

        String[] parts;
        int port = 0;
        FTPClient ftpClient;
        ProtocolCommandListener listener;
        InputStream in = null;

        server = (String)args[0];
        parts = server.split(":");
        if (parts.length == 2) {
            server = parts[0];
            port = Integer.parseInt(parts[1]);
        }
        username = (String)args[1];
        password = (String)args[2];
        localFile = args[3];
        remoteFile = (String)args[4];
        command = (String)args[5];

        listener = new PrintCommandListener(new PrintWriter(System.out), true);
        ftpClient = new FTPClient();
        ftpClient.addProtocolCommandListener(listener);

        try {
            final int reply;
            if (port > 0) {
                ftpClient.connect(server, port);
            } else {
                ftpClient.connect(server);
            }
            System.out.println("Connected to " + server + ".");

            reply = ftpClient.getReplyCode();

            if (!FTPReply.isPositiveCompletion(reply)) {
                ftpClient.disconnect();
                System.err.println("FTP server refused connection.");
                System.exit(1);
            }

        } catch (final IOException e) {
            if (ftpClient.isConnected()) {
                try {
                    ftpClient.disconnect();
                } catch (final IOException f) {
                    // do nothing
                }
            }
            System.err.println("Could not connect to server1.");
            e.printStackTrace();
            System.exit(1);
        }


        __main: try {
            if (!ftpClient.login(username, password)) {
                System.err.println("Could not login to " + server);
                break __main;
            }

            if(!ftpClient.enterRemotePassiveMode()) {
                System.err.println("FTP server passive mode.");
            }
            ftpClient.enterLocalPassiveMode();

            if("GET".equalsIgnoreCase(command)) {
                // download file
                remoteFile = remoteRootFolder + (!remoteRootFolder.endsWith(File.separator) && !remoteFile.startsWith(File.separator) ? File.separator : "") + remoteFile;
                String remoteFolder = utility.get_file_folder(remoteFile);
                String remoteFileName = utility.get_file_name(remoteFile);
                final int result = ftpClient.cwd(remoteFolder);
                if (result == 250) {
                    if(localFile instanceof String) {
                        final File outputFile = new File((String)localFile);
                        final FileOutputStream fos = new FileOutputStream(outputFile);
                        ftpClient.retrieveFile(remoteFileName, fos);
                        fos.flush();
                        fos.close();
                        retVal = true;
                    } else if(localFile instanceof byte []) {
                        ByteArrayOutputStream fos = new ByteArrayOutputStream();
                        ftpClient.retrieveFile(remoteFileName, fos);
                        retVal = (byte[])fos.toByteArray();
                        fos.flush();
                        fos.close();
                    }

                } else {
                    retVal = null;
                }

            } else if("PUT".equalsIgnoreCase(command)) {
                remoteFile = remoteRootFolder + (!remoteRootFolder.endsWith(File.separator) && !remoteFile.startsWith(File.separator) ? File.separator : "") + remoteFile;

                String remoteFolder = utility.get_file_folder(remoteFile);
                String remoteFileName = utility.get_file_name(remoteFile);

                ftpClient.setFileType(FTP.BINARY_FILE_TYPE, FTP.BINARY_FILE_TYPE);
                ftpClient.setFileTransferMode(FTP.BINARY_FILE_TYPE);
                ftpClient.setBufferSize(0);

                if(localFile instanceof String) {
                    File file = new File((String)localFile);
                    if (file.isFile()) {
                        System.out.println("file ::" + file.getName());
                        in = new FileInputStream(file);
                        if(ftpClient.changeWorkingDirectory(remoteFolder)) {
                            completed = ftpClient.storeFile(remoteFileName, in);
                            retVal = true;
                        } else {
                            retVal = false;
                        }
                    }
                } else if(localFile instanceof byte []) {
                    byte [] data = (byte [])localFile;
                    in = new ByteArrayInputStream(data);
                    if(ftpClient.changeWorkingDirectory(remoteFolder)) {
                        completed = ftpClient.storeFile(remoteFileName, in);
                        retVal = true;
                    } else {
                        retVal = false;
                    }
                }
                if((boolean)retVal){
                    int reply = ftpClient.getReplyCode();
                    System.err.println(ftpClient.getReplyString());
                    if(reply >= 200 && reply <= 230) {
                        if(!completed) {
                            if (ftpClient.completePendingCommand()) {
                                retVal = true;
                            } else {
                                retVal = false;
                            }
                        } else {
                            retVal = true;
                        }
                    } else {
                        retVal = false;
                    }
                }

            } else if("DELETE".equalsIgnoreCase(command)) {
                if (!ftpClient.deleteFile(remoteFile)) {
                    System.err.println("Couldn't initiate transfer. Check that file names are valid.");
                    retVal = false;
                    break __main;
                }  else {
                    retVal = true;
                }
            }


        } catch (final IOException e) {
            Logger.getLogger(ftp.class.getName()).log(Level.SEVERE, e, null);
            throw e;
        } finally {
            try {
                if(in != null) in.close();
            } catch (final IOException e) { }
            try {
                if (ftpClient.isConnected()) {
                    ftpClient.logout();
                    ftpClient.disconnect();
                }
            } catch (final IOException e) { }
        }

        return retVal;
    }
}
