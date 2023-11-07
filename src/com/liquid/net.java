/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.liquid;

import com.sun.javafx.fxml.builder.URLBuilder;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.*;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Cristitan
 */
public class net {

    /**
     * Read an URL and return Object [ content (byte[]), http status code (int) ]
     * if postData in not null user "POST" method, elsewhere "GET"
     *
     * @param baseURL
     * @param postData
     *
     * @return Objkect []
     *  [0] = content (byte[])
     *  [1] = responseCode (int)
     *  [2] = contentType (String)
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws KeyManagementException
     */
    public static Object [] getURL(String baseURL, String postData) throws IOException, NoSuchAlgorithmException, KeyManagementException, URISyntaxException {
        return new net().getURLEx(baseURL, postData, 0, null);
    }

    /**
     * Read an URL and return Object [ content (byte[]), http status code (int) ]
     * if postData in not null user "POST" method, elsewhere "GET"
     *
     * @param baseURL
     * @param postData
     * @param headers
     *
     * @return Objkect []
     *  [0] = content (byte[])
     *  [1] = responseCode (int)
     *  [2] = contentType (String)
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws KeyManagementException
     */
    public static Object [] getURL(String baseURL, String postData, Object headers) throws IOException, NoSuchAlgorithmException, KeyManagementException, URISyntaxException {
        return new net().getURLEx(baseURL, postData, 0, headers);
    }

    /**
     * Read an URL and return Object [ content (byte[]), http status code (int) ]
     * if postData in not null user "POST" method, elsewhere "GET"
     *
     * @param baseURL
     * @param postData
     * @param timeout
     * @param headers
     *
     * @return Objkect []
     *  [0] = content (byte[])
     *  [1] = responseCode (int)
     *  [2] = contentType (String)
     *
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws KeyManagementException
     */
    public static Object [] getURL(String baseURL, String postData, int timeout, Object headers) throws IOException, NoSuchAlgorithmException, KeyManagementException, URISyntaxException {
        return new net().getURLEx(baseURL, postData, timeout, headers);
    }



    /**
     *
     * @param surl
     * @return
     * @throws MalformedURLException
     */
    public static Object getDefaultHeaders(String surl) throws MalformedURLException {
        URL url = new URL(surl);
        HashMap<String,String> headers = new HashMap<String,String>();
        headers.put("Host", url.getHost());
        headers.put("User-Agent", "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0");
        headers.put("Connection", "keep-alive");
        // headers.put("Accept", "*/*");
        headers.put("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
        headers.put("Accept-Encoding", "gzip, deflate, br");
        headers.put("Accept-Language", "en-US,en;q=0.5");
        headers.put("Cookie", "_ga=GA1.2.996091584.1661426985; cookie_policy=1");
        headers.put("Upgrade-Insecure-Requests", "1");
        return headers;
    }


    /**
     * Internal function
     * Read an URL and return Object [ content (byte[]), http status code (int) ]
     * if postData in not null user "POST" method, elsewhere "GET"
     *
     * return Objkect []
     *  [0] = content (byte[])
     *  [1] = responseCode (int)
     *  [2] = contentType (String)
     *
     * @param baseURL
     * @param postData
     * @param timeout
     * @param headers
     * @return
     * @throws IOException
     * @throws NoSuchAlgorithmException
     * @throws KeyManagementException
     */
    public Object [] getURLEx(String baseURL, String postData, int timeout, Object headers) throws IOException, NoSuchAlgorithmException, KeyManagementException, URISyntaxException {
        Object [] outObject = new Object [3];
        HttpsURLConnection conns = null;
        HttpURLConnection connh = null;
        URL myUrl = null;

        try {

            long lastTime = System.currentTimeMillis();

            baseURL = get_url_from_string(baseURL).toString();
            myUrl = new URL(baseURL);
            InputStream is = null;
            Map<String, List<String>> map = null;
            OutputStream wr = null;
            int responseCode = 0;

            System.out.println("baseURL: " + baseURL);

            // Supporto SSL
            if (baseURL.startsWith("https://")) {
                // Https
                HttpsURLConnection conn = (HttpsURLConnection) myUrl.openConnection();
                SSLContext sc = SSLContext.getInstance("SSL");
                sc.init(null, new TrustManager[]{new TrustAnyTrustManager()}, new java.security.SecureRandom());
                conn.setSSLSocketFactory(sc.getSocketFactory());
                process_header_params(headers, conn);
                if (postData != null) {
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    wr = conn.getOutputStream();
                }
                conns = conn;

            } else {
                // Http
                HttpURLConnection conn = (HttpURLConnection) myUrl.openConnection();
                process_header_params(headers, conn);
                if (postData != null) {
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    wr = conn.getOutputStream();
                }
                connh = conn;
            }

            if (postData != null) {
                wr.write(postData.getBytes("UTF-8"));
                wr.flush();
                wr.close();
            }

            if (conns != null) {
                conns.connect();
                responseCode = conns.getResponseCode();
                outObject[1] = responseCode;
                outObject[2] = conns.getContentType();
                is = conns.getInputStream();
                map = conns.getHeaderFields();
            } else if (connh != null) {
                connh.connect();
                responseCode = connh.getResponseCode();
                outObject[1] = responseCode;
                outObject[2] = connh.getContentType();
                is = connh.getInputStream();
                map = connh.getHeaderFields();
            }

            /* TOMCAT SHIT : NON FUNZIONA : TOMACAT non riconosce la JSESSIONID
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

            outObject[0] = utility.getAllBytes(is);

            String sInfo = "Response Code : " + responseCode + " size: " + ((byte[])outObject[0]).length + " time:" + (float) (System.currentTimeMillis() - lastTime) / 1000.0f + " sec";
            Logger.getLogger(net.class.getName()).log(Level.INFO, sInfo);
            // System.out.println(sInfo);


        } catch (MalformedURLException ex) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, ex);
            outObject[1] = -1;
            throw ex;
        } catch (Exception e) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, e);
            outObject[1] = -1;
            throw e;
        } finally {
            if (conns != null) {
                conns.disconnect();
            } else if (connh != null) {
                connh.disconnect();
            }
        }
        return outObject;
    }

    void process_header_params(Object headers, Object conn) {
        boolean userAgentSet = false;
        boolean acceptLanguageSet = false;
        boolean hostName = false;
        if (headers != null) {
            try {
                HttpsURLConnection conns = null;
                HttpURLConnection connh = null;
                ArrayList<Object> params = new ArrayList<Object>();

                if(conn instanceof HttpsURLConnection)
                    conns = (HttpsURLConnection)conn;
                else if(conn instanceof HttpURLConnection)
                    connh = (HttpURLConnection)conn;

                if (headers instanceof String) {
                    String[] sparams = ((String) headers).split(",");
                    for (int ip = 0; ip < sparams.length; ip++) {
                        params.add(sparams[ip]);
                    }
                } else if (headers instanceof ArrayList) {
                    params = (ArrayList<Object>) headers;
                } else if (headers instanceof String[]) {
                    params.addAll( Arrays.asList( (String []) headers) );
                } else if (headers instanceof HashMap) {
                    HashMap hmparams = (HashMap) headers;
                    Iterator it = hmparams.entrySet().iterator();
                    Map.Entry pair = null;
                    while (it.hasNext()) {
                        pair = (Map.Entry) it.next();
                        params.add(pair.getKey()+":"+(String) pair.getValue());
                    }
                }

                for (int ip = 0; ip < params.size(); ip++) {
                    String[] pair = String.valueOf(params.get(ip)).split(":");
                    if (pair != null) {
                        if (pair.length >= 2) {
                            if ("User-Agent".equalsIgnoreCase(pair[0])) {
                                userAgentSet = true;
                            }
                            if ("Accept-Language".equalsIgnoreCase(pair[0])) {
                                acceptLanguageSet = true;
                            }
                            if ("Host".equalsIgnoreCase(pair[0])) {
                                hostName = true;
                            }
                            if (connh != null) {
                                connh.setRequestProperty(pair[0].trim(), pair[1].trim());
                            } else if (conns != null) {
                                conns.setRequestProperty(pair[0].trim(), pair[1].trim());
                            }
                        } else if (pair.length == 1) {
                            if (connh != null) {
                                connh.setRequestProperty(pair[0], "");
                            } else if (conns != null) {
                                conns.setRequestProperty(pair[0], "");
                            }
                        }
                    }
                }

                if (!userAgentSet) {
                    if (conns != null) {
                        conns.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 Edg/85.0.564.68");
                    }
                    if (connh != null) {
                        connh.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36 Edg/85.0.564.68");
                    }
                }
                if (!acceptLanguageSet) {
                    if (conns != null) {
                        conns.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
                    }
                    if (connh != null) {
                        connh.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
                    }
                }

                if (!hostName) {
                    if (conns != null) {
                        conns.setRequestProperty("Host", InetAddress.getLocalHost().getHostName());
                    }
                    if (connh != null) {
                        connh.setRequestProperty("Host", InetAddress.getLocalHost().getHostName());
                    }
                }

            } catch (Exception ex) {
                Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
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



    public static Object[] read_url(String url, String postData, int timeput, HashMap<String, String> params) throws Exception {
        Connection c = Jsoup.connect(url);

        // if(coockies != null) c.headers(coockies);

        c.ignoreContentType(true);

        c.header("accept","application/json,text/plain,*/*");
        c.header("accept-encoding","gzip, deflate, br");
        c.header("accept-language","it,en-US;q=0.9,en;q=0.8");
        // c.header("content-type","application/json;charset=UTF-8");
        // c.header("content-length", String.valueOf(body.length()));
        c.header("user-agent","Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36");
        // c.header("authorization","Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vc2NvcGFtaWNpLmNvbS9hcGkvbG9naW4iLCJpYXQiOjE2ODM3MDcxOTUsImV4cCI6MTY5MTU5MTE5NSwibmJmIjoxNjgzNzA3MTk1LCJqdGkiOiJjRGdoVWo4RFpQT1JwSUpVIiwic3ViIjozMzQyMzIwMCwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.HZFkz_G5d586M1-JykAz6QyD1EchEeBX08zrwBJD1so");
        c.header("sec-ch-ua", "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"");
        c.header("sec-ch-ua-mobile","?0");
        c.header("sec-ch-ua-platform", "Linux");
        c.header("sec-fetch-dest", "empty");
        c.header("sec-fetch-mode","cors");
        c.header("sec-fetch-site","same-origin");
        c.header("x-csrf-token","xoHspX7CtBcILCmyUieaQ0EpzuVLk4pMHWBoKCtG");
        c.header("x-requested-with","XMLHttpRequest");
        c.header("x-socket","");
        c.header("referer", params.get("referer"));
        c.header("origin", params.get("Origin"));
        c.header("host", params.get("host"));



        Document doc = null;
        if(postData != null) {
            c.header("Method","POST");
            c.data(postData);
        } else {
            c.header("Method","GET");
        }
        try {
            Connection.Response response = c.execute();
            if (response != null) {
                response = response.bufferUp();
                return new Object[]{response.bodyAsBytes(), response.statusCode(), response.contentType()};
            } else {
                return new Object[]{null, -1, null};
            }
        } catch (org.jsoup.HttpStatusException e) {
            return new Object[]{null, e.getStatusCode(), null};
        }
    }

    public static URL get_url_from_string( String url) throws MalformedURLException, URISyntaxException {
        URL Url = new URL(url);
        return new URI(Url.getProtocol(), null, Url.getHost(), Url.getPort(), Url.getPath(), Url.getQuery(), null).toURL();
    }

}
