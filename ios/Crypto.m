//
//  Crypto.m
//  RNCAsyncStorage
//
//  Created by Daniel Rosa on 10/07/2020.
//  Copyright © 2020 Medulife. All rights reserved.
//

#import "Crypto.h"
#import "RNEncryptor.h"
#import "RNDecryptor.h"

@implementation Crypto : NSObject

+ (NSString*)encrypt:(NSString*)plaintext withSecret:(NSString*)secret {
    if (plaintext == nil) return plaintext;
    
    NSError *error;
    
    NSData *data = [plaintext dataUsingEncoding:NSUTF8StringEncoding];
    
    NSData *encrypted = [RNEncryptor encryptData:data
                                    withSettings:kRNCryptorAES256Settings
                                        password:secret
                                           error:&error];
    
    if (!error) {
        NSString *encoded = [encrypted base64EncodedStringWithOptions: NSDataBase64Encoding64CharacterLineLength];
        return [CRYPTO_PREFIX stringByAppendingString:encoded];
    } else {
        return plaintext;
    }
}

+ (NSString*)decrypt:(NSString*)encrypted withSecret:(NSString*)secret {
    if (encrypted == nil || ![encrypted hasPrefix:CRYPTO_PREFIX]) return encrypted;
    
    NSError *error;
    
    NSData *data = [[NSData alloc] initWithBase64EncodedString:[encrypted substringFromIndex:CRYPTO_PREFIX.length]
                                                       options:NSDataBase64DecodingIgnoreUnknownCharacters];
    
    NSData *decrypted = [RNDecryptor decryptData:data
                                    withPassword:secret
                                           error:&error];
    
    if (!error) {
        return [[NSString alloc] initWithData:decrypted
                                     encoding:NSUTF8StringEncoding];
    } else {
        return encrypted;
    }
}

@end
