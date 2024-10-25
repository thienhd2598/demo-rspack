const fs = require('fs');
const path = require('path');
const glob = require('glob');

const inputDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'actionKeys.json');

const actionKeysPattern = /export\s+const\s+actionKeys\s+=\s+({[\s\S]*?});/g;

const readFileContent = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

const scanFiles = async () => {
    const output = [];
    try {
        const files = glob.sync(path.join(inputDir, '**/*.js'));        
        for (const file of files) {
            const content = await readFileContent(file);
            let match;            
            while ((match = actionKeysPattern.exec(content)) !== null) {
                const keysObject = eval(`(${match[1]})`);
                Object.keys(keysObject).forEach(key => {                    
                    output.push({
                        key,
                        ...keysObject[key]
                    })
                })
            }
        }
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
        console.log('[SUCCESS]: Dữ liệu đã được ghi vào', outputFile);
    } catch (err) {
        console.error('[ERROR]:', err);
    }
};

scanFiles();