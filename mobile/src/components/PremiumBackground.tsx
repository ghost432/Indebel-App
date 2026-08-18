import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface PremiumBackgroundProps {
  children: React.ReactNode;
}

export default function PremiumBackground({ children }: PremiumBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Premium Background Elements */}
      <View style={styles.blobOrange} />
      <View style={styles.blobBlue} />
      
      {/* Frost Overlay */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  blobOrange: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(223, 100, 34, 0.18)',
    transform: [{ scaleX: 1.2 }],
  },
  blobBlue: {
    position: 'absolute',
    top: height * 0.25,
    right: -width * 0.3,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: 'rgba(43, 78, 239, 0.15)',
    transform: [{ scaleY: 1.2 }],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.65)',
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  }
});
