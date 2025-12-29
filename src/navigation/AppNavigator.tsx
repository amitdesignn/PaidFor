// App Navigator
// Stack navigation with deep linking support

import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/HistoryScreen';
import NoteCaptureScreen from '../screens/NoteCaptureScreen';

export type RootStackParamList = {
    History: undefined;
    NoteCapture: { transactionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['paidfor://'],
    config: {
        screens: {
            History: 'history',
            NoteCapture: 'note/:transactionId',
        },
    },
};

export default function AppNavigator() {
    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator
                initialRouteName="History"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#0F172A' },
                }}
            >
                <Stack.Screen name="History" component={HistoryScreen} />
                <Stack.Screen
                    name="NoteCapture"
                    component={NoteCaptureScreen}
                    options={{
                        animation: 'slide_from_bottom',
                        presentation: 'modal',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
