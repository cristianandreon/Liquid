package com.liquid;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * @author Cristitan
 */


public class nameSpacer {

    static public Logger logger = Logger.getLogger(nameSpacer.class.getName());

    static public String DB2Hibernate(String stringToConvert) {
        String[] items = stringToConvert.split("_");
        String out = "";
        for (int i = 0; i < items.length; i++) {
            if (i == 0)
                out += items[i].toLowerCase();
            else {
                out += items[i].substring(0, 1).toUpperCase();
                out += items[i].substring(1, items[i].length()).toLowerCase();
            }
        }
        return out;
    }

    static public String DB2Label(String stringToConvert) {
        String[] items = stringToConvert.split("_");
        String out = "";
        for (int i = 0; i < items.length; i++) {
            if (i == 0) {
                out += items[i].substring(0, 1).toUpperCase();
                out += items[i].substring(1, items[i].length()).toLowerCase();
            } else {
                out += " ";
                out += items[i].toLowerCase();
            }
        }
        return out;
    }

    static public String hibernate2DB(String stringToConvert) {
        String field = "";
        String out = "";
        int fieldCount = 0;
        for (char c : stringToConvert.toCharArray()) {
            if (((int) c >= (int) 'A' && (int) c <= (int) 'Z') && field.length() > 0) {
                if (fieldCount > 0)
                    out += "_";
                out += field.toUpperCase();
                field = "" + c;
                fieldCount++;
            } else {
                field += c;
            }
        }

        if (!field.isEmpty()) {
            if (fieldCount > 0)
                out += "_";
            out += field.toUpperCase();
        }

        return out;
    }

    /**
     *
     */
    static public void testMe() {
        String test = "TABELLA_CLIENTI";

        String h = nameSpacer.DB2Hibernate(test);
        String db = nameSpacer.hibernate2DB(h);

        logger.log(Level.INFO, " nameSpacer test : " + test + " -> " + h + " -> " + db);


        test = "tabellaClientiProva";

        db = nameSpacer.hibernate2DB(test);
        h = nameSpacer.DB2Hibernate(db);

        logger.log(Level.INFO, " nameSpacer test : " + test + " -> " + h + " -> " + db);
    }


    public static String capitalizeFirstLetter(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1).replaceAll("/ /g", "").toLowerCase();
    };

    public static String capitalizeOnlyFirstLetter(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1).replaceAll("/ /g", "");
    };

    public static String getGetter(String name) {
        return "get"+capitalizeOnlyFirstLetter(name);
    }
    public static String getSetter(String name) {
        return "set"+capitalizeOnlyFirstLetter(name);
    }
}

