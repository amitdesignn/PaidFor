// TypeScript declarations for native SMS module

declare module 'react-native' {
    interface NativeModulesStatic {
        SmsModule: {
            checkPermission(): Promise<boolean>;
            requestPermission(): Promise<boolean>;
        };
    }
}

export { };
