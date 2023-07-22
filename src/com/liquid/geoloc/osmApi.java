/*
 * Copyright (c) Cristian Andreon - cristianandreon.eu - 2023.
 */

package com.liquid.geoloc;

import com.liquid.net;
import com.sun.org.apache.xerces.internal.impl.io.UTF8Reader;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URLEncoder;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;

public class osmApi {

    static private String base_url = "https://nominatim.openstreetmap.org/search";

    static private String auxParams = "&format=json";

    /*
    [{"place_id":128245052,"licence":"Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright","osm_type":"way"
    ,"osm_id":90394480,"boundingbox":["52.5487473","52.5488481","-1.816513","-1.8163464"],"lat":"52.5487921","lon":"-1.8164308339635031","display_name":"135, Pilkington Avenue, Maney, Sutton Coldfield, Wylde Green, Birmingham, West Midlands Combined Authority, Inghilterra, B72 1LH, Regno Unito","class":"building","type":"residential","importance":0.41000999999999993,"address":{"house_number":"135","road":"Pilkington Avenue","hamlet":"Maney","town":"Sutton Coldfield","village":"Wylde Green","city":"Birmingham","ISO3166-2-lvl8":"GB-BIR","state_district":"West Midlands Combined Authority","state":"Inghilterra","ISO3166-2-lvl4":"GB-ENG","postcode":"B72 1LH","country":"Regno Unito","country_code":"gb"}}]
    */

    static public Object [] get_gps_from_address ( String address ) throws Exception {
        String url = base_url + "?q=" + URLEncoder.encode(address) + auxParams;
        Object[] res = net.getURL(
                url,
                null,
                30
        );
        if ((int)res[1] == 200) {
            JSONArray jarr = new JSONArray( new String( (byte[])res[0]));
            if(jarr != null) {
                return new Object[] { true, Float.parseFloat(jarr.getJSONObject(0).getString("lon")), Float.parseFloat(jarr.getJSONObject(0).getString("lat")) };
            }
        }
        return new Object[] { false, null, null };
    }

    static public float get_distance_km (float lon1, float lat1, float lon2, float lat2) {
        return get_distance_km (lon1, lat1, lon2, lat2, 0.0f, 0.0f);
    }

    static public float get_distance_km (float lon1, float lat1, float lon2, float lat2, double el1, double el2) {
        final int R = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters

        double height = el1 - el2;

        distance = Math.pow(distance, 2) + Math.pow(height, 2);

        return (float)Math.sqrt(distance) / 1000.0f;
    }

}
