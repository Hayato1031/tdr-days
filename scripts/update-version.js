#!/usr/bin/env node

/**
 * Version Update Script
 * 
 * Usage: node scripts/update-version.js [new-version]
 * Example: node scripts/update-version.js 1.0.6
 * 
 * This script updates version information across all relevant files:
 * - app.json (expo version)
 * - android/app/build.gradle (versionName and versionCode)
 * - src/constants/app.ts (VERSION and VERSION_CODE)
 */

const fs = require('fs');
const path = require('path');

function updateVersion(newVersion) {
  if (!newVersion) {
    console.error('❌ Please provide a version number');
    console.log('Usage: node scripts/update-version.js [version]');
    console.log('Example: node scripts/update-version.js 1.0.6');
    process.exit(1);
  }

  // Validate version format (basic check)
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ Invalid version format. Please use format: x.y.z (e.g., 1.0.6)');
    process.exit(1);
  }

  const versionParts = newVersion.split('.');
  const majorMinor = `${versionParts[0]}.${versionParts[1]}`;
  const patch = parseInt(versionParts[2]);
  
  // Calculate version code (simple incrementing number)
  // You can adjust this logic based on your needs
  const versionCode = parseInt(versionParts[0]) * 10000 + parseInt(versionParts[1]) * 100 + patch;

  console.log(`🚀 Updating version to ${newVersion} (code: ${versionCode})`);

  try {
    // 1. Update app.json
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    appJson.expo.version = newVersion;
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    console.log('✅ Updated app.json');

    // 2. Update android/app/build.gradle
    const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
    let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Update versionCode
    buildGradleContent = buildGradleContent.replace(
      /versionCode \d+/,
      `versionCode ${versionCode}`
    );
    
    // Update versionName
    buildGradleContent = buildGradleContent.replace(
      /versionName "[^"]+"/,
      `versionName "${newVersion}"`
    );
    
    fs.writeFileSync(buildGradlePath, buildGradleContent);
    console.log('✅ Updated android/app/build.gradle');

    // 3. Update src/constants/app.ts
    const appConstantsPath = path.join(__dirname, '../src/constants/app.ts');
    let appConstantsContent = fs.readFileSync(appConstantsPath, 'utf8');
    
    // Update VERSION
    appConstantsContent = appConstantsContent.replace(
      /VERSION: '[^']+'/,
      `VERSION: '${newVersion}'`
    );
    
    // Update VERSION_CODE
    appConstantsContent = appConstantsContent.replace(
      /VERSION_CODE: \d+/,
      `VERSION_CODE: ${versionCode}`
    );
    
    fs.writeFileSync(appConstantsPath, appConstantsContent);
    console.log('✅ Updated src/constants/app.ts');

    console.log('\n🎉 Version update complete!');
    console.log(`📱 New version: ${newVersion}`);
    console.log(`🔢 Version code: ${versionCode}`);
    console.log('\n📋 Next steps:');
    console.log('1. Test the app thoroughly');
    console.log('2. Commit the changes: git add . && git commit -m "Bump version to ' + newVersion + '"');
    console.log('3. Build and publish to stores');

  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

// Get version from command line arguments
const newVersion = process.argv[2];
updateVersion(newVersion);