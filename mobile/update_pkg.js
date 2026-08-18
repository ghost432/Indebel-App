const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));

const updates = {
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-worklets": "0.5.1"
};

const devUpdates = {
  "@types/react": "~19.1.10",
  "typescript": "~5.9.2"
};

for (const [k, v] of Object.entries(updates)) {
  pkg.dependencies[k] = v;
}
for (const [k, v] of Object.entries(devUpdates)) {
  pkg.devDependencies[k] = v;
}

// Remove SDK 57 specific expo modules that don't exist in SDK 54
delete pkg.dependencies['@expo/ui'];
delete pkg.dependencies['expo-glass-effect'];

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
