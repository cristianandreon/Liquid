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
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 *
 * @author Cristitan
 */
public class net {

    public static ArrayList<String> getURL ( String baseURL, String postData ) {
        return new net().getURLEx ( baseURL, postData, 0, null );
    }
    
    public static ArrayList<String> getURL ( String baseURL, String postData, String auxData ) {
        return new net().getURLEx ( baseURL, postData, 0, auxData );
    }

    public static ArrayList<String> getURL ( String baseURL, String postData, int timeout, String auxData ) {
        return new net().getURLEx ( baseURL, postData, timeout, auxData );
    }

    public ArrayList<String> getURLEx ( String baseURL, String postData, int timeout, String auxData ) {
        ArrayList<String> outString = new ArrayList<String>(2);
        StringBuffer resultString = new StringBuffer("");
        URL myUrl;
        
        try {
            
            if(outString.size()==0) {
                outString.add("");
                outString.add("");
            }            
            myUrl = new URL(baseURL);
            InputStream is = null;
            Map<String, List<String>> map = null;
            OutputStream wr = null;
            HttpsURLConnection conns = null;
            HttpURLConnection connh = null;
            int responseCode = 0;

            System.out.println("baseURL: " + baseURL);
            
            // Supporto SSL
            if(baseURL.startsWith("https://")) {
                HttpsURLConnection conn = (HttpsURLConnection)myUrl.openConnection();

                SSLContext sc = SSLContext.getInstance("SSL");  
                sc.init(null, new TrustManager[]{new TrustAnyTrustManager()}, new java.security.SecureRandom());  
                conn.setSSLSocketFactory(sc.getSocketFactory());
                
                conn.setRequestProperty("User-Agent", "LIQUID");
                conn.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
                
                if(postData != null) {
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                }
                    
                wr = conn.getOutputStream();
    
                conns = conn;
                
            } else {
                HttpURLConnection conn = (HttpURLConnection)myUrl.openConnection();

                conn.setRequestProperty("User-Agent", "CNCONLINE");
                conn.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
                

                if(postData != null) {
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                }
                
                connh = conn;
            }

    
            if(postData != null) {
                wr.write(postData.getBytes("UTF-8"));
                wr.flush();
                wr.close();
            }

            if(conns != null) {
                conns.connect();
                responseCode = conns.getResponseCode();
                is = conns.getInputStream();
                map = conns.getHeaderFields();
            } else if(connh != null) {
                connh.connect();
                responseCode = connh.getResponseCode();
                is = connh.getInputStream();
                map = connh.getHeaderFields();
            }
            
            System.out.println("Response Code : " + responseCode);
            
            
            
            /* TOMCAT MERDA : NON FUNZIONA : TOMACAT non riconosce la JSESSIONID
            for (Map.Entry<String, List<String>> entry : map.entrySet()) {
                if("Set-Cookie".equalsIgnoreCase(entry.getKey())) {
                    List<String> coockies = entry.getValue();
                    for (String coockie : coockies) {
                        if(coockie.contains("JSESSIONID")) {
                            outString.set(1, coockie);
                            System.out.println("Set-coockie: " + coockie);
                        }
                    }
                }
            }
            */
            
            
            InputStreamReader isr = new InputStreamReader(is);
            BufferedReader br = new BufferedReader(isr);

            String inputLine;
            while ((inputLine = br.readLine()) != null) {
                resultString.append( inputLine );
            }
            br.close();
            
            outString.set(0, resultString.toString());

            System.out.println("Response size: " + resultString.length());
            
        } catch (MalformedURLException ex) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, ex);
            outString.set(0, ex.getMessage());
        } catch (Exception e) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, e);
            outString.set(0, e.getMessage());
        }        
        return outString;
    }
    
    
    
    // Supporto SSL
    public final class TrustAnyTrustManager implements X509TrustManager {

        public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
        }

        public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
        }

        public X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[]{};
        }
    }
    
}
