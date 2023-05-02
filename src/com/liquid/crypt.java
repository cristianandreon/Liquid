package com.liquid;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.Key;

public class crypt {

    private static final String ALGORITHM = "AES";
    private static final byte[] keyValue = "GTHSDALO92762945".getBytes();

// [-104, 57, 48, -62, 103, 112, -100, -74, 10, 120, -106, -34, 119, 21, -17, -41, 45, -75, 73, -44, 100, -73, 1, 71, -58, 7, 78, 52, -83, -113, 55, 98]
    public static void test() throws Exception {
        String encriptValue = utility.base64Encode(encrypt("test_enc_dec_001"));
        byte[] dec = decrypt(utility.base64DecodeBytes(encriptValue));
        System.out.println(new String(dec));
    }


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
        return c.doFinal(valueToEnc.getBytes());
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
