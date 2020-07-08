package com.reactnativecommunity.asyncstorage;

import android.util.Base64;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Arrays;
import java.util.HashMap;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

class Crypto {

    private static final String ALGORITHM = "AES";

    private static final String FEEDBACK = "CBC";

    private static final String PADDING = "PKCS5PADDING";

    private static final int KEY_LENGTH = 256;

    private static final int SALT_LENGTH = 8;

    private static final int KEY_ITERATION_COUNT = 2048;

    private static final String KEY_FACTORY_ALGORITHM = "PBKDF2WithHmacSHA1";

    private static final String PREFIX = ALGORITHM + KEY_LENGTH + ":";

    private static final SecureRandom random = new SecureRandom();

    private static final HashMap<String, Key> keys = new HashMap<>();

    private static byte[] salt = null;


    private static Key getKey(String secret, byte[] salt) throws NoSuchAlgorithmException, InvalidKeySpecException {
        String key = secret + new String(salt);

        if (!keys.containsKey(key)) {
            KeySpec spec = new PBEKeySpec(secret.toCharArray(), salt, KEY_ITERATION_COUNT, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(KEY_FACTORY_ALGORITHM);
            Key secretKey = new SecretKeySpec(factory.generateSecret(spec).getEncoded(), ALGORITHM);

            keys.put(key, secretKey);
        }

        return keys.get(key);
    }

    static String encrypt(String plaintext, String secret) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM + "/" + FEEDBACK + "/" + PADDING);

            byte[] iv = new byte[cipher.getBlockSize()];
            random.nextBytes(iv);

            if (salt == null) {
                salt = new byte[SALT_LENGTH];
                random.nextBytes(salt);
            }

            Key key = getKey(secret, salt);
            cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            stream.write(iv);
            stream.write(salt);
            stream.write(encrypted);

            return PREFIX + Base64.encodeToString(stream.toByteArray(), Base64.DEFAULT);
        } catch (Exception e) {
            FLog.e(ReactConstants.TAG, PREFIX + e.getMessage(), e);
            return plaintext;
        }
    }

    static String decrypt(String encrypted, String secret) {
        if (!encrypted.startsWith(PREFIX)) return encrypted;

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM + "/" + FEEDBACK + "/" + PADDING);

            byte[] decoded = Base64.decode(encrypted.substring(PREFIX.length()), Base64.DEFAULT);

            int blockSize = cipher.getBlockSize();
            int inputOffset = blockSize + SALT_LENGTH;

            byte[] salt = Arrays.copyOfRange(decoded, blockSize, inputOffset);
            Key key = getKey(secret, salt);

            cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(decoded, 0, blockSize));
            byte[] decrypted = cipher.doFinal(decoded, inputOffset, decoded.length - inputOffset);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            FLog.e(ReactConstants.TAG, PREFIX + e.getMessage(), e);
            return encrypted;
        }
    }
}
