package com.liquid;

import org.apache.commons.lang.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;

public class crypt {

    private static final String ALGORITHM = "AES";
    private static final byte[] keyValue = "GTHSDALO92762945".getBytes();

    // [-104, 57, 48, -62, 103, 112, -100, -74, 10, 120, -106, -34, 119, 21, -17, -41, 45, -75, 73, -44, 100, -73, 1, 71, -58, 7, 78, 52, -83, -113, 55, 98]
    public static void test() throws Exception {
        String encriptValue = utility.base64Encode(encrypt("{\"test\":\"enc_aes\",  \"data\":0.001}\n"));
        byte[] decryptedValue = decrypt(utility.base64DecodeBytes(encriptValue));
        System.out.println(new String(decryptedValue));

        String idOpal = "5843";
        String urlPrintJson = "{\"idOpal\":\""+idOpal+"\",\"mode\":\"OPAL\",\"password\":\"I/9ph+W+Bp8FxtLCrtobJD1n99E=\"}";
        byte [] bytesToB64 = encrypt(urlPrintJson);
        encriptValue=utility.base64Encode(bytesToB64);
        System.out.println(encriptValue);
        decryptedValue = decrypt(utility.base64DecodeBytes(encriptValue));
        if(!decryptedValue.equals(urlPrintJson.getBytes())) {
            System.out.println("Test FAILED");
        }
    }
    // OK
    // d+M3TN4l7P5oRAgLlXSOFcbZVNcx/yr+B2IhHpg/EAWjmQfEtfUZVSUu5uiSE9oYPLEczAP1zvlXOWcjtz6/Y3kT6g1v/fWU8AWGItf1d+wttUnUZLcBR8YHTjStjzdi
    // d+M3TN4l7P5oRAgLlXSOFcbZVNcx/yr+B2IhHpg/EAWjmQfEtfUZVSUu5uiSE9oYPLEczAP1zvlXOWcjtz6/YwIuHLi1QVlFJLLX0c86+9AttUnUZLcBR8YHTjStjzdi



    /**
     *
     * @param valueToEnc
     * @return
     * @throws Exception
     */
    public static byte[] encrypt(String valueToEnc) throws Exception {
        Key key = generateKey();
        Cipher c = Cipher.getInstance(ALGORITHM);
        c.init(Cipher.ENCRYPT_MODE, key);
        return c.doFinal((valueToEnc+StringUtils.repeat(" ", 16-valueToEnc.length()%16)).getBytes());
    }

    /**
     *
     * @param encryptedValue
     * @return
     * @throws Exception
     */
    public static byte[] decrypt(byte[] encryptedValue) throws Exception {
        Key key = generateKey();
        Cipher c = Cipher.getInstance(ALGORITHM);
        c.init(Cipher.DECRYPT_MODE, key);
        return c.doFinal(encryptedValue);
    }

    private static Key generateKey() throws Exception {
        Key key = new SecretKeySpec(keyValue, ALGORITHM);
        return key;
    }

}
