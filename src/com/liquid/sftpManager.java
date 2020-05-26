package com.liquid;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributeView;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileTime;
import java.util.Date;


import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpATTRS;
import com.jcraft.jsch.SftpException;
import com.jcraft.jsch.SftpProgressMonitor;


public class sftpManager implements SftpProgressMonitor {
	
    long uploadingTotal = 0;
    long uploadingCurrent = 0;
    long uploadingLastCurrent = 0;
    long lastCurrentTimeMillis = 0;
    
    String glSourceFile = null;
    String glTtargetFile = null;
    long glFileSize = 0L;
    
    float maxSpeed = 0.0f;
    float minSpeed = 0.0f;
    float mediaSpeed = 0.0f;
    float timeLeft = 0.0f;
    float count = 0;

    public Object [] upload ( String host, String user, String password, String sourceFile, InputStream sourceFileIS, String targetFile ) throws JSchException, SftpException, IOException {
        long retVal = 0, fileSize = 0;
        int port = 22;
        String knownHostsFilename = "/home/world/.ssh/known_hosts";        
        ChannelSftp sftpChannel = null;
        
        JSch jsch = new JSch();
        jsch.setKnownHosts(knownHostsFilename);
        Session session = jsch.getSession(user, host, port);
        session.setPassword(password);
        
        // disable host fingerprint check
        java.util.Properties config = new java.util.Properties(); 
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        
        try {
        	
	        session.connect();
	        sftpChannel = (ChannelSftp) session.openChannel("sftp");
	        sftpChannel.connect();

	        if(sourceFile != null) {
	        	File file = new File(sourceFile);
				Path path = Paths.get(file.getPath());
	            BasicFileAttributeView attributes = Files.getFileAttributeView(path, BasicFileAttributeView.class, LinkOption.NOFOLLOW_LINKS);
	            BasicFileAttributes latt = attributes.readAttributes();
	            glFileSize = fileSize = latt.size();
	            glSourceFile = sourceFile;
	            glTtargetFile = targetFile;
	            
	            
	            FileTime ctf = latt.creationTime();
	            long ct = ctf.toMillis() / 1000;
	        	
	            try {
			        SftpATTRS attrs = sftpChannel.lstat(targetFile);
			        long remoteSize = attrs.getSize();
			        int rt = attrs.getATime();
			        String rts = attrs.getAtimeString();
			        
		        	Date creationDate = new Date((long)ct * 1000L);
		        	System.out.println(" Local " +
		                       creationDate.getDate() + "/" + (creationDate.getMonth() + 1) + "/" + (creationDate.getYear() + 1900) +
		                       " " + 
		                       creationDate.getHours() + ":"+creationDate.getMinutes() + ":" + creationDate.getSeconds()
		                       );
		        	
		        	creationDate = new Date((long)rt * 1000L);
		        	System.out.println(" Remote " +
		                       creationDate.getDate() + "/" + (creationDate.getMonth() + 1) + "/" + (creationDate.getYear() + 1900) +
		                       " " + 
		                       creationDate.getHours() + ":"+creationDate.getMinutes() + ":" + creationDate.getSeconds()
		                       );	               
			        
			        if(ct > (long)rt || remoteSize != glFileSize) {
			        	// file changed
			        } else {
			        	return new Object [] { retVal, false };
			        }
	            } catch (Exception e) {
	            	System.err.print("Error:"+e.getLocalizedMessage());
	            }
	        }
	        
	        checkSFTPFolderExist(sftpChannel, targetFile);
        
	        sftpChannel.put(sourceFileIS, targetFile, this);
	        
            retVal = this.uploadingCurrent;
	        
        } finally {        
        	sftpChannel.exit();
        	session.disconnect();
        }

        return new Object [] { retVal, true };        
    }
    
    public long getRemoteFileSize ( String host, String user, String password, String targetFile ) throws JSchException, SftpException, IOException {
        long retVal = 0;
        int port = 22;
        String knownHostsFilename = "/home/world/.ssh/known_hosts";        
        ChannelSftp sftpChannel = null;
        
        JSch jsch = new JSch();
        jsch.setKnownHosts(knownHostsFilename);
        Session session = jsch.getSession(user, host, port);
        session.setPassword(password);
        
        // disable host fingerprint check
        java.util.Properties config = new java.util.Properties(); 
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        
        try {
	        session.connect();
	        sftpChannel = (ChannelSftp) session.openChannel("sftp");
	        sftpChannel.connect();

	        if(targetFile != null) {
		        SftpATTRS attrs = sftpChannel.lstat(targetFile);
		        long size = attrs.getSize();
	        	return size;
	        }
	        
        } finally {        
        	sftpChannel.exit();
        	session.disconnect();
        }
        return retVal;        
    }

    
    public boolean checkSFTPFolderExist(ChannelSftp sftp, String path) throws SftpException {
	    String[] folders = path.split( "/" );
	    boolean retVal = false;
	    String curfolder = "";
	    if(folders.length > 0) {
		    for ( int i=0; i<folders.length-1; i++ ) {
		    	String folder = folders[i];
		        if ( folder.length() > 0 ) {
		        	curfolder += "/" + folder;
		            try {
		                sftp.cd( curfolder );
		            } catch ( SftpException e ) {
		                sftp.mkdir( curfolder );
	                	sftp.cd( curfolder );
		                retVal = true;
		            }
		        }
		    }
	    }
	    return retVal;
    }
    
    

    
    
    public void init(int op, java.lang.String src, java.lang.String dest, long total) {
    	glTtargetFile = dest;
    	this.lastCurrentTimeMillis = System.currentTimeMillis();
        this.uploadingTotal = total > 0 ? total :glFileSize;
        this.uploadingCurrent = 0;
        count = 0;
        maxSpeed = 0.0f;
        minSpeed = 999999999.0f;
    }

    public boolean count(long sentBytes) {
    	long bytes = this.uploadingCurrent + sentBytes;
    	if(this.uploadingCurrent/1024/1024 != bytes /1024/1024) {
    		float ds = bytes - this.uploadingLastCurrent;
    		this.uploadingLastCurrent = bytes; 
    		float dt = (System.currentTimeMillis() - lastCurrentTimeMillis) / 1000;
    		this.lastCurrentTimeMillis = System.currentTimeMillis();
    		String pec = String.format("%1.2f",  (float)((float)this.uploadingCurrent / (float)glFileSize * 100.0f));
    		float fSpeed = (ds / dt / 1024.0f);
			if(fSpeed > maxSpeed) maxSpeed = fSpeed; 
			if(fSpeed < minSpeed) minSpeed = fSpeed;
			mediaSpeed = (mediaSpeed * count + fSpeed) / (count + 1);
			count++;
			timeLeft = mediaSpeed > 0.0f ? (glFileSize - uploadingCurrent ) / (mediaSpeed * 1024.0f) : 0.0f;
    		String speed = String.format("%1.2f", mediaSpeed);
    		String sTimeLeft = utility.getTimeString(timeLeft);   		
    		Callback.send("Uploading "+glSourceFile+" to " +glTtargetFile + "<br/>" + String.format("%1.2f", (float)bytes/1024.0f/1024.0f)+" / "+ String.format("%1.2f", (float)glFileSize/1024.0f/1024.0f) + " MB .. "+pec+"% done, Transfer rate:" +speed+" KB/sec .. "+sTimeLeft);
    	}
		this.uploadingCurrent = bytes;
        return(true);
    }

    public void end() {
    	if(this.uploadingTotal > 0)
    		this.uploadingCurrent = this.uploadingTotal;
    	else
    		this.uploadingCurrent = glFileSize;
		Callback.send("Uploading "+glSourceFile+" to " +glTtargetFile + "<br/>Size:" + String.format("%1.2f", (float)glFileSize/1024.0f/1024.0f) + " MB, Transfer rate max:" +maxSpeed+" Kb/sec"+ " min:"+minSpeed );
    }
    
}    