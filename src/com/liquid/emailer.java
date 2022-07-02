package com.liquid;

import static com.liquid.emailer.Auth;
import static com.liquid.emailer.Host;
import static com.liquid.emailer.Password;
import static com.liquid.emailer.Port;
import static com.liquid.emailer.Username;
import static com.liquid.login.logout;
import com.sun.mail.util.MailSSLSocketFactory;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.mail.*;
import javax.mail.internet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.jsp.JspWriter;
import org.json.JSONArray;
import org.json.JSONObject;



public class emailer {

    public String LastError = "";
    public String DebugMessage = "";

    public static String Host = "smtp.host.com";
    public static String Port = "587";
    public static String Username = "";
    public static String Password = "";
    public static String Auth = "true";
    public static String Protocol = "smtp";
    

    public String AppName = "";
    public String AppURL = "";
    public String AppImage = "";
    public String From = "info@liquid-framework.eu";

    
    /**
     * send an email message (from liquid.jsp sevlet)
     * 
     * @return 
     */
    static public String send(HttpServletRequest request, HttpServletResponse response, JspWriter out) {
        try {        
            String RemoteIP = request.getRemoteAddr();
            String sRedirect = null;
            emailer emailerInstance = new emailer();
            boolean result = emailerInstance.send(request.getParameter("to"), request.getParameter("from"), request.getParameter("subject"), request.getParameter("message"));
            if(!result) {
                return "{ \"result\":-1, \"error\":\""+utility.base64Encode(emailerInstance.LastError)+"\"}";
            } else {
                return "{ \"result\":1 }";
            }
        } catch (Exception e) { 
            Logger.getLogger("// emailer.send() Error:" + e.getLocalizedMessage());
            return "{ \"result\":-60, \"error\":\""+utility.base64Encode(e.getLocalizedMessage())+"\"}";
        }
    }

    /**
     * send an email message (from execute)
     * 
     * @return 
     */
    static public String send(Object tbl_wrk, Object params, Object clientData, Object freeParam ) {
        try {            
            if(params != null) {
                HttpServletRequest request = (HttpServletRequest)freeParam;
                JSONObject rootJson = new JSONObject((String)params);
                if(rootJson != null) {
                    JSONArray paramsJson  = rootJson.getJSONArray("params");
                    for(int i=0; i<paramsJson.length(); i++) {
                        JSONObject paramJson = (JSONObject)paramsJson.get(i);
                        if(paramJson.has("form")) {
                            if(paramJson.has("data")) {
                                JSONObject dataJson = paramJson.getJSONObject("data");
                                if(dataJson != null) {
                                    emailer emailerInstance = new emailer();
                                    String to = dataJson.has("to") ? dataJson.getString("to") : "";
                                    String from = dataJson.has("from") ? dataJson.getString("from") : "";
                                    String subject = dataJson.has("subject") ? dataJson.getString("subject") : "";
                                    String message = dataJson.has("message") ? dataJson.getString("message") : "";
                                    boolean result = emailerInstance.send(to, from, subject, message);
                                    if(!result) {
                                        return "{ \"result\":-1, \"error\":\""+utility.base64Encode(emailerInstance.LastError)+"\"}";
                                    } else {
                                        return "{ \"result\":1 }";
                                    }
                                }
                            }
                        }
                    }
                }
            }            
        } catch (Throwable e) {
            if(!(e instanceof java.lang.NoSuchMethodException)) {
                Logger.getLogger("// login() Error:" + e.getLocalizedMessage());
            }
        }        
        return null;
    }
    
    
    /**
     * send an email message
     * 
     * @param to
     * @param pFrom
     * @param subject
     * @param msg
     * @return 
     */
    public boolean send(String to, String pFrom, String subject, String msg) {

        Session session = null;
        Transport transport = null;
        boolean bAutenticated = false;
        
        LastError = "";
        String sFrom = (pFrom != null && !pFrom.isEmpty() ? pFrom : From);
        Properties properties = System.getProperties();
 

        try {

            // Setup mail server
            properties.put("mail.transport.protocol", Protocol);
            properties.put("mail.smtp.starttls.enable", "true");
            properties.put("mail.smtp.host", Host);
            properties.put("mail.smtp.port", Port);
            properties.put("mail.smtp.auth", Auth);
            properties.put("mail.smtp.ssl.trust", "*");


            properties.put("mail.smtps.ssl.checkserveridentity", "false");
            properties.put("mail.smtps.ssl.trust", "*");
             
            MailSSLSocketFactory sf = new MailSSLSocketFactory();
            sf.setTrustAllHosts(true); 
            properties.put("mail.imap.ssl.trust", "*");
            properties.put("mail.imap.ssl.socketFactory", sf);


            javax.mail.Authenticator auth = new SMTPAuthenticator();

            session = Session.getInstance(properties, new javax.mail.Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(Username, Password);
                }
            });

            if (session != null) {
                transport = session.getTransport(Protocol);
                transport.connect(Host, Username, Password);
                transport.close();
                bAutenticated = true;
            }

        } catch (Exception e0) {

            Logger.getLogger(emailer.class.getName()).log(Level.SEVERE, "send() Error:" + e0.getLocalizedMessage());
            
            try {
            
                properties.put("mail.smtp.starttls.enable", "false");
            
                transport = session.getTransport(Protocol);
                transport.connect(Host, Username, Password);
                transport.close();
                bAutenticated = true;
        
        
            } catch (Exception e) {
                Logger.getLogger(emailer.class.getName()).log(Level.SEVERE, "send() Error:" + e.getLocalizedMessage());
                LastError = "[Sending mail Exception:" + e.getMessage() + "]";
                bAutenticated = false;
            }
        }
 

        if(bAutenticated) {

            // Authentication success ..
            try {

                MimeMessage message = new MimeMessage(session);
                message.setFrom(new InternetAddress(From != null ? From : "liquid.java.framework@gmail.com"));
                message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
                message.setSubject(subject);
                message.setText(msg, "utf-8", "html");
                Transport.send(message);
                LastError = "";

            } catch (Exception e) {
                Logger.getLogger(emailer.class.getName()).log(Level.SEVERE, "get_standard_mnessage() Error:" + e.getLocalizedMessage());
                LastError = "[Sending mail Exception:" + e.getMessage() + "]";
                return false;
            }
            return true;

        } else {
            LastError = "Session atunthentication faled";
        }
        return false;
    }

    
    
    // needs papercut or local smtp server
    /**
     * 
     * @param recipients
     * @param subject
     * @param message
     * @param from
     * @return
     * @throws MessagingException 
     */
    public static boolean postMail(String recipients[], String subject, String message, String from) throws MessagingException {

        try {

            // Assuming you are sending email from localhost
            String host = "localhost";

            // Set the host smtp address
            Properties props = new Properties();
            props.put("mail.smtp.host", host);
            props.put("mail.smtp.port", "25");

            Session session = Session.getDefaultInstance(props, null);
            session.setDebug(false);

            // create a message
            Message msg = new MimeMessage(session);

            // set the from and to address
            InternetAddress addressFrom = new InternetAddress(from);
            msg.setFrom(addressFrom);

            InternetAddress[] addressTo = new InternetAddress[recipients.length];
            for (int i = 0; i < recipients.length; i++) {
                addressTo[i] = new InternetAddress(recipients[i]);
            }
            msg.setRecipients(Message.RecipientType.TO, addressTo);

            // msg.addHeader("MyHeaderName", "myHeaderValue");
            msg.setSubject(subject);
            msg.setContent(message, "text/html");
            msg.setSentDate(new Date());
            Transport.send(msg);
            return true;

        } catch (Throwable th) {
            System.err.print("Error:" + th.getLocalizedMessage());
        }
        return false;
    }

    
    

    private class SMTPAuthenticator extends javax.mail.Authenticator {

        public javax.mail.PasswordAuthentication getPasswordAuthentication() {
            return new javax.mail.PasswordAuthentication(Username, Password);
        }
    }

    
    /**
     * standard html message creator
     * 
     * @param key
     * @param params
     * @return 
     */
    public String get_standard_message(String key, String[] params) {

        try {

            String imgBase64 = "";
            // "data:image/jpeg;base64,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";
            if (AppImage != null && !AppImage.isEmpty()) {
                try {
                    File f = new java.io.File(AppImage);
                    byte[] fileContent = Files.readAllBytes(Paths.get(f.getAbsolutePath()));
                    String fileContentb64 = utility.base64Encode(fileContent);
                    String contentType = Files.probeContentType(Paths.get(f.getAbsolutePath()));
                    imgBase64 = "data:" + contentType + ";base64," + fileContentb64;
                } catch (Exception e) {
                    System.err.println("get_standard_mnessage() Error:" + e.getLocalizedMessage());
                }
            }

            if (key.equalsIgnoreCase("demoAccount")) {
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + AppName + "</b> - Richiesta Account Dimostrativo"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Nome Azienda"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[4] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Email"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[5] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Cell"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[10] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Target"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[11] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Codice paese/lingua:"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[6] + "</b>" + " / " + "<b>" + params[7] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Ip address:"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[8] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "User agent:"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[9] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("demoAccountFeedback")) {
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\"><div style=\"float:right; top:10px; padding-top:15px;\" /><b>" + AppName + "</b> - Demo Account Request</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Your domain"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Your email"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#efedee; color:#5298c7; font-size:85%; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "You'll recive as soon as possible your account access data<br/>Thanks for your interest in " + AppName + ""
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("Contact")) {
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + AppName + "</b> - Richiesta / Contatto"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Dominio"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + (params[1] != null ? (
                         "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Commento/Richiesta"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>")
                        :"")
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Email"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[2] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("sendOrder")) {
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + AppName + "</b> - Notifica Ordine"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Dominio"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Utente"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "ID Ordine"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[2] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("RegisterUser")) {
                String validateAccountLink = "<a style=\"font-size:19px;\" href=\"" + params[4]
                        + "?operation=validateEmail&emailToken=" + params[5]
                        + "&redirect=" + params[6]
                        + "&domain_id=" + params[3]
                        + "&application_id=" + params[2]
                        + "&email=" + params[1]
                        + "&database=" + params[7]
                        + "&schema=" + params[8]
                        + "&table=" + params[9]
                        + "\">"
                        + "validate your account" + "</a>";
                String loginLink = "<a style=\"color:darkGray; font-size:19px;\" href=\"" + AppURL + "/" + params[2] + "/?user=" + params[1] + "\">login <b>" + params[1] + "</b></a>";
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\"><div style=\"float:left; top:10px; padding-top:15px;\" /><b>" + AppName + "</b> - User registration</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Domain"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[2] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Password"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "validate account link"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + validateAccountLink
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + loginLink
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("RegisterUserNotify")) {
                return ""
                        + "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + AppName + "</b> - New user"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Domain"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[3] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Email"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "validate account link"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b><a href=\"\" onclick=\"location.href='" + params[4] + "?operation=validateEmail&emailToken=" + params[5] + "'&redirect=" + params[6] + "'&domain_id=" + params[3] + "'&application_id=" + params[2] + "'&email=" + params[1] + "\">" + "click here to validate your account" + "</b></a>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("RecoveryPassword")) {
                return "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\"><div style=\"float:right; top:10px; padding-top:15px;\" /><b>" + AppName + "</b> - Password recovery</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "User"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[2] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Password"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Link"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[3] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("newPassword")) {
                String newPassword = params[0];
                try {
                    newPassword = (newPassword.length() >= 3 ? "***" + newPassword.substring(newPassword.length() - 2, newPassword.length()) : "***") + "(" + params[0].length() + " chars)";
                } catch (Exception e) {
                    newPassword = "***" + "(" + params[0].length() + " chars)" + "[" + e.getMessage() + "]";
                }
                return "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\" /><div style=\"float:right; top:10px; padding-top:15px;\"><b>" + AppName + "</b> - Password change</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Password"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + newPassword + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";
            } else if (key.equalsIgnoreCase("sendFeedback")) {
                return "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + AppName + "</b> - Feedback"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Domain"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "User"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "File"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<a href='" + params[2] + "'  download='" + params[3] + "' download ><b>" + params[3] + "</b></a>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Machine"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[4] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Precision"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[5] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Material"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[6] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Treatment"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[7] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Machine allowerance"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[11] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Price"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[8] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Aspected price"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[9] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Price detail"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[12] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Notes"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[10] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Roughing"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[13] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Finishing"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[14] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Preview"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b><img style=\"border=1px gray\" src=\"" + params[15] + "\"/></b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("notifyFeedback")) {
                return "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\"><div style=\"float:right; top:10px; padding-top:15px;\" /><b>" + AppName + "</b> - Feedback Notify</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Utente"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "File"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[3] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Macchina"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[4] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Precisione"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[5] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Materiale"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[6] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Trattamento"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[7] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Sovrametalli"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[11] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Prezzo"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[8] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Prezzo atteso"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[9] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Dettaglio prezzo"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[12] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Annotazioni"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[10] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Parametri Sgrossatura"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[13] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Parametri Finitura"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[14] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Anteprima"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b><img style=\"border=1px gray\" src=\"" + params[15] + "\"/></b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else if (key.equalsIgnoreCase("notifyExpire")) {
                return "<table cellpadding=20 cellspacing=20 style=\" font-family:calibri; font-size:24px; border:1px solid lightGray; "
                        + "-moz-border-radius: 11px; -webkit-border-radius: 11px; border-radius: 11px; -khtml-border-radius: 11px; -moz-box-shadow: 6px  6px 5px #dedede; -webkit-box-shadow:  6px  6px 5px #dedede; "
                        + "filter: progid:DXImageTransform.Microsoft.Shadow(color='#dedede', Direction=135, Strength=5); box-shadow: 6px 6px 5px #dedede; "
                        + "\">"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#a3c4da; color:#292929; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px;  -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<img src=\"" + imgBase64 + "\" style=\"background-color: lightgray;margin: 5px;border: 1px solid #87b7de;padding: 3px;\"><div style=\"float:right; top:10px; padding-top:15px;\" /><b>" + AppName + "</b> - Expiration notify</div>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Domain"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[0] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "User"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[1] + "</b>" + "(" + params[2] + "." + params[3] + ")"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"1\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "Expiration date"
                        + "</td>"
                        + "<td colspan=\"1\" style=\"background-color:#f9f6f7; color:#5298c7; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[4] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "<tr>"
                        + "<td colspan=\"2\" style=\"background-color:#efedee; color:#003f69; -moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -khtml-border-radius: 5px; -moz-box-shadow: 4px 4px 3px #dedede; -webkit-box-shadow:  4px 4px 3px #dedede; \">"
                        + "<b>" + params[5] + "</b>"
                        + "</td>"
                        + "</tr>"
                        + "</table>";

            } else {
                return "get_standard_mnessage() : unknown key:" + key;
            }
        } catch (Exception e) {
            System.err.println("get_standard_mnessage() Error:" + e.getLocalizedMessage());
            return "[Error:" + e.getMessage() + "]";
        }
    }


    /*  test cases :    
    
            emailer.Host = "smtp.gmail.com"; // DA SISTEMARE : tls://server";
            emailer.Username = "utentibonus110@gmail.com";

            emailer.Host = "smtp.office365.com";
            emailer.Username = "utentibonus110@outlook.it";
            emailer.Port = "587";
            emailer.Password = "";
            
            emailer.test(emailer.Host, emailer.Port, emailer.Username, emailer.Password);

            // security page
            // https://myaccount.google.com/lesssecureapps?pli=1&rapt=AEjHL4Opv7n8ZxTGmlkVJjlIc11UDexSS2ioRPddKIkQ8jBhaBH5LBHl6eLFWTyRw_Gogw6suAo-mUtZWiBbab2n1lMxh_TxfA
    */
            
    /**
     * Test the emailer
     * 
     * @param _Host
     * @param _Port
     * @param _Username
     * @param _Password
     * @return 
     */
    public static Object [] test(String _Host, String _Port, String _Username, String _Password) {
        boolean retVal = false;
        emailer emailerInstance = new emailer();

        try {
            
            Host = _Host;
            Port = _Port;
            Username = _Username;
            Password = _Password;
            
            emailerInstance.AppName = (String) "Test APP";
            emailerInstance.AppURL = (String) "Test URL";
            emailerInstance.AppImage = (String) "test App Image";
            emailerInstance.From = (String) null;

            if (emailerInstance.send("liquid.java.framework@gmail.com", null, "Liquid Emailer Test", "Test message")) {
                retVal = true;
            } else {
                retVal = false;
            }
        } catch (Throwable th) {
            emailerInstance.LastError += th.getLocalizedMessage();
            System.err.println("test() Error:" + th.getLocalizedMessage());
        }
        
        return new Object [] { retVal, emailerInstance.LastError };
    }
}
