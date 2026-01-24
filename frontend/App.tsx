import React from 'react';
import { StatusBar, View, StyleSheet, Platform } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <View style={styles.container}>
        <AppNavigator />
      </View>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      maxWidth: '45%',
      alignSelf: 'center',
      width: '100%',
    }),
  },
});
