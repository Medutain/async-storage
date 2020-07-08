/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @jsdoc
 */

'use strict';

import RCTAsyncStorage from './RCTAsyncStorage';

if (!RCTAsyncStorage) {
  throw new Error(`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.

To fix this issue try these steps:

  • Run \`react-native link @react-native-community/async-storage\` in the project root.

  • Rebuild and restart the app.

  • Run the packager with \`--reset-cache\` flag.

  • If you are using CocoaPods on iOS, run \`pod install\` in the \`ios\` directory and then rebuild and re-run the app.

  • If this happens while testing with Jest, check out docs how to integrate AsyncStorage with it: https://github.com/react-native-community/async-storage/blob/master/docs/Jest-integration.md

If none of these fix the issue, please open an issue on the Github repository: https://github.com/react-native-community/react-native-async-storage/issues 
`);
}

type ReadOnlyArrayString = $ReadOnlyArray<string>;

type MultiGetCallbackFunction = (
  errors: ?$ReadOnlyArray<Error>,
  result: ?$ReadOnlyArray<ReadOnlyArrayString>,
) => void;

function checkValidInput(usedKey: string, value: any) {
  const isValuePassed = arguments.length > 1;

  if (typeof usedKey !== 'string') {
    console.warn(
      `[AsyncStorage] Using ${typeof usedKey} type for key is not supported. This can lead to unexpected behavior/errors. Use string instead.\nKey passed: ${usedKey}\n`,
    );
  }

  if (isValuePassed && typeof value !== 'string') {
    if (value == null) {
      throw new Error(
        `[AsyncStorage] Passing null/undefined as value is not supported. If you want to remove value, Use .remove method instead.\nPassed value: ${value}\nPassed key: ${usedKey}\n`,
      );
    } else {
      console.warn(
        `[AsyncStorage] The value for key "${usedKey}" is not a string. This can lead to unexpected behavior/errors. Consider stringifying it.\nPassed value: ${value}\nPassed key: ${usedKey}\n`,
      );
    }
  }
}

/**
 * `AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value
 * storage system that is global to the app.  It should be used instead of
 * LocalStorage.
 *
 * See http://reactnative.dev/docs/asyncstorage.html
 */
const AsyncStorage = {
  /**
   * Fetches an item for a `key` and invokes a callback upon completion.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#getitem
   */
  getItem: function(
    key: string,
    secret: string | null,
    callback?: ?(error: ?Error, result: string | null) => void,
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      checkValidInput(key);
      RCTAsyncStorage.multiGet([key], secret, function(errors, result) {
        // Unpack result to get value from [[key,value]]
        const value = result && result[0] && result[0][1] ? result[0][1] : null;
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0], value);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(value);
        }
      });
    });
  },

  /**
   * Sets the value for a `key` and invokes a callback upon completion.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#setitem
   */
  setItem: function(
    key: string,
    value: string,
    secret: string | null,
    callback?: ?(error: ?Error) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      checkValidInput(key, value);
      RCTAsyncStorage.multiSet([[key, value]], secret, function(errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Removes an item for a `key` and invokes a callback upon completion.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#removeitem
   */
  removeItem: function(
    key: string,
    callback?: ?(error: ?Error) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      checkValidInput(key);
      RCTAsyncStorage.multiRemove([key], function(errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Merges an existing `key` value with an input value, assuming both values
   * are stringified JSON.
   *
   * **NOTE:** This is not supported by all native implementations.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#mergeitem
   */
  mergeItem: function(
    key: string,
    value: string,
    callback?: ?(error: ?Error) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      checkValidInput(key, value);
      RCTAsyncStorage.multiMerge([[key, value]], function(errors) {
        const errs = convertErrors(errors);
        callback && callback(errs && errs[0]);
        if (errs) {
          reject(errs[0]);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Erases *all* `AsyncStorage` for all clients, libraries, etc. You probably
   * don't want to call this; use `removeItem` or `multiRemove` to clear only
   * your app's keys.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#clear
   */
  clear: function(callback?: ?(error: ?Error) => void): Promise<null> {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.clear(function(error) {
        const err = convertError(error);
        callback && callback(err);
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Gets *all* keys known to your app; for all callers, libraries, etc.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#getallkeys
   */
  getAllKeys: function(
    callback?: ?(error: ?Error, keys: ?ReadOnlyArrayString) => void,
  ): Promise<ReadOnlyArrayString> {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.getAllKeys(function(error, keys) {
        const err = convertError(error);
        callback && callback(err, keys);
        if (err) {
          reject(err);
        } else {
          resolve(keys);
        }
      });
    });
  },

  /**
   * This allows you to batch the fetching of items given an array of `key`
   * inputs. Your callback will be invoked with an array of corresponding
   * key-value pairs found.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#multiget
   */
  multiGet: function(
    keys: Array<string>,
    secret: string | null,
    callback?: ?MultiGetCallbackFunction,
  ): Promise<?$ReadOnlyArray<ReadOnlyArrayString>> {
    return new Promise((resolve, reject) => {
      keys.forEach(key => {
        checkValidInput(key);
      });

      RCTAsyncStorage.multiGet(keys, secret, function(errors, result) {
        const errs = convertErrors(errors);
        callback && callback(errs, result);
        if (errs) {
          reject(errs);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Use this as a batch operation for storing multiple key-value pairs. When
   * the operation completes you'll get a single callback with any errors.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#multiset
   */
  multiSet: function(
    keyValuePairs: Array<Array<string>>,
    secret: string | null,
    callback?: ?(errors: ?$ReadOnlyArray<?Error>) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      keyValuePairs.forEach(([key, value]) => {
        checkValidInput(key, value);
      });

      RCTAsyncStorage.multiSet(keyValuePairs, secret, function(errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Call this to batch the deletion of all keys in the `keys` array.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#multiremove
   */
  multiRemove: function(
    keys: Array<string>,
    callback?: ?(errors: ?$ReadOnlyArray<?Error>) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      keys.forEach(key => checkValidInput(key));

      RCTAsyncStorage.multiRemove(keys, function(errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },

  /**
   * Batch operation to merge in existing and new values for a given set of
   * keys. This assumes that the values are stringified JSON.
   *
   * **NOTE**: This is not supported by all native implementations.
   *
   * See http://reactnative.dev/docs/asyncstorage.html#multimerge
   */
  multiMerge: function(
    keyValuePairs: Array<Array<string>>,
    callback?: ?(errors: ?$ReadOnlyArray<?Error>) => void,
  ): Promise<null> {
    return new Promise((resolve, reject) => {
      RCTAsyncStorage.multiMerge(keyValuePairs, function(errors) {
        const error = convertErrors(errors);
        callback && callback(error);
        if (error) {
          reject(error);
        } else {
          resolve(null);
        }
      });
    });
  },
};

// Not all native implementations support merge.
if (!RCTAsyncStorage.multiMerge) {
  delete AsyncStorage.mergeItem;
  delete AsyncStorage.multiMerge;
}

function convertErrors(errs): ?$ReadOnlyArray<?Error> {
  if (!errs || (Array.isArray(errs) && errs.length === 0)) {
    return null;
  }
  return (Array.isArray(errs) ? errs : [errs]).map(e => convertError(e));
}

function convertError(error): ?Error {
  if (!error) {
    return null;
  }
  const out = new Error(error.message);
  // $FlowFixMe: adding custom properties to error.
  out.key = error.key;
  return out;
}

export default AsyncStorage;
