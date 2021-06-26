/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2021.
 */

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
import java.net.InetAddress;
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

    public static ArrayList<String> getURL(String baseURL, String postData) {
        return new net().getURLEx(baseURL, postData, 0, null);
    }

    public static ArrayList<String> getURL(String baseURL, String postData, Object headers) {
        return new net().getURLEx(baseURL, postData, 0, headers);
    }

    public static ArrayList<String> getURL(String baseURL, String postData, int timeout, Object headers) {
        return new net().getURLEx(baseURL, postData, timeout, headers);
    }

    public ArrayList<String> getURLEx(String baseURL, String postData, int timeout, Object headers) {
        ArrayList<String> outString = new ArrayList<String>(2);
        StringBuffer resultString = new StringBuffer("");
        HttpsURLConnection conns = null;
        HttpURLConnection connh = null;
        URL myUrl;

        try {

            long lastTime = System.currentTimeMillis();

            if (outString.size() == 0) {
                outString.add("");
                outString.add("");
            }
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
                outString.set(1, String.valueOf(responseCode));
                is = conns.getInputStream();
                map = conns.getHeaderFields();
            } else if (connh != null) {
                connh.connect();
                responseCode = connh.getResponseCode();
                outString.set(1, String.valueOf(responseCode));
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
            InputStreamReader isr = new InputStreamReader(is);
            BufferedReader br = new BufferedReader(isr);

            String inputLine;
            while ((inputLine = br.readLine()) != null) {
                resultString.append(inputLine);
            }
            br.close();

            outString.set(0, resultString.toString());

            System.out.println("Response Code : " + responseCode + " size: " + resultString.length() + " time:" + (float) (System.currentTimeMillis() - lastTime) / 1000.0f + " sec");

        } catch (MalformedURLException ex) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, ex);
            outString.set(0, ex.getMessage());
        } catch (Exception e) {
            Logger.getLogger(net.class.getName()).log(Level.SEVERE, null, e);
            outString.set(0, e.getMessage());
        } finally {
            if (conns != null) {
                conns.disconnect();
            } else if (connh != null) {
                connh.disconnect();
            }
        }
        return outString;
    }

    void process_header_params(Object headers, Object conn) {
        boolean userAgentSet = false;
        boolean acceptLanguageSet = false;
        boolean hostName = false;
        if (headers != null) {
            try {
                HttpsURLConnection conns = (HttpsURLConnection) (conn instanceof HttpsURLConnection ? conn : null);
                HttpURLConnection connh = (HttpURLConnection) (conn instanceof HttpURLConnection ? conn : null);
                ArrayList<Object> params = new ArrayList<Object>();

                if (headers instanceof String) {
                    String[] sparams = ((String) headers).split(",");
                    for (int ip = 0; ip < sparams.length; ip++) {
                        params.add(sparams[ip]);
                    }
                } else if (headers instanceof ArrayList) {
                    params = (ArrayList<Object>) headers;
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
                                connh.setRequestProperty(pair[0], pair[1].trim());
                            } else if (conns != null) {
                                conns.setRequestProperty(pair[0], pair[1].trim());
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

}
