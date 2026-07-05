/**
 * storage.js — thin wrapper around AsyncStorage
 * Compatible with @react-native-async-storage/async-storage v1.x (Expo Go safe)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const setItem   = (key, value) => AsyncStorage.setItem(key, value);
export const getItem   = (key)        => AsyncStorage.getItem(key);
export const removeItem = (key)       => AsyncStorage.removeItem(key);
export const multiRemove = (keys)     => AsyncStorage.multiRemove(keys);
