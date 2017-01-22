#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var inputFolder = path.join(__dirname, '../../', 'resources/android/custom/');
var outputFolder = path.join(__dirname, '../../', '/platforms/android/res/');

if (process.env.CORDOVA_PLATFORMS != 'android') {
  return;
}

console.log('------------------------------------------------------------------------------------------');
console.log("Running hook: "+path.basename(process.env.CORDOVA_HOOK));
console.log('------------------------------------------------------------------------------------------');
fs.readdir(inputFolder, function(err, list) {
  list.forEach(function(folder){
    if (folder.indexOf('drawable') === 0) {
      copyAllFiles(inputFolder, folder)
    }
  });

  console.log('-----------------------------------------------------------------------------------------');
});

function copyAllFiles(path, folder) {
  sourceFolder = path+folder

  fs.readdir(sourceFolder, function(err, list) {
    list.forEach(function(file){
      targetFile = outputFolder + folder + '/' + file
      console.log('# ' + file + ' --> ' + targetFile);

      fs.createReadStream(sourceFolder + '/'  + file)
        .pipe(fs.createWriteStream(targetFile));
    });
  });
}
