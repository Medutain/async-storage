//
//  Crypto.h
//  RNCAsyncStorage
//
//  Created by Daniel Rosa on 10/07/2020.
//  Copyright © 2020 Medulife. All rights reserved.
//

#define CRYPTO_PREFIX @"AES256:"

@interface Crypto : NSObject

+ (NSString*)encrypt:(NSString*)plaintext withSecret:(NSString*)secret;
+ (NSString*)decrypt:(NSString*)encrypted withSecret:(NSString*)secret;

@end
