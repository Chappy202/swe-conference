var fs=require('fs');var c=fs.readFileSync('src/services/triageEngine.ts','utf8');console.log('byte0:',c.charCodeAt(0));console.log(c.substring(0,200));  
