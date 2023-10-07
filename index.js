const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app = express();
const ports = [2727, 6969];

let isOutside = ''
let rootFolder = '';

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/:folderPath(*)', async (req, res) => {
    if (req.socket.localPort == 2727) {
        isOutside = ''
        rootFolder = 'Storage';
    } else {   
        isOutside = '../'
        rootFolder = 'KPOP';
    }

    const { folderPath } = req.params;
    
    if (!folderPath.includes('/view') && !folderPath.includes('/embed')) {
        const fullPath = folderPath ? path.join(__dirname, isOutside + rootFolder, folderPath) : path.join(__dirname, isOutside + rootFolder);
    
        try {
            const items = await listFilesAndFolders(fullPath);
            const itemDetails = await getItemDetails(fullPath, items);

            res.render('index', { folderPath, itemDetails });
        } catch (error) {
            var text = 'Error saat membaca direktori.';
            res.status(500).render('404', { text });
        }
    } else {
        var fileName = folderPath.split('/');
        var newFolderPath = folderPath.split('/');
            newFolderPath.pop();
        const newFullPath = newFolderPath.join('/', newFolderPath)

        fileName = fileName[fileName.length - 2]
    
        const filePath = path.join(__dirname, isOutside + rootFolder, newFullPath);

        var getActions = folderPath.split('/');
            getActions = getActions[getActions.length - 1];

        switch (getActions) {
            case 'view':
                res.render('view', { filePath });
                break;
            case 'embed':
                // res.header('Content-Disposition', `attachment; filename="${fileName}"`);
                res.sendFile(filePath);
                break;
        }
    }
});

// Fungsi untuk mendapatkan daftar file dan folder dalam suatu direktori
async function listFilesAndFolders(directory) {
    const items = await fs.readdir(directory);
    return items;
}

async function getItemDetails(basePath, items) {
    const itemDetails = [];
    for (const item of items) {
        const itemPath = path.join(basePath, item);
        const isFile = await isItemTypeFile(itemPath);
        itemDetails.push({
            name: item,
            type: isFile ? 'file' : 'folder',
            path: itemPath.replace(`${__dirname}\\${rootFolder}\\`, '').replace(`${basePath}\\`, '').replace('#', '%23').toLowerCase()
        });
    }
    return itemDetails;
}
  
// Fungsi untuk mendeteksi apakah suatu entitas adalah file atau folder
async function isItemTypeFile(itemPath) {
    try {
        const stats = await fs.stat(itemPath);
        return stats.isFile();
    } catch (err) {
        return false; // Menganggap jika terjadi kesalahan, itu bukanlah file
    }
}

app.listen(ports[0], () => {
    console.log(`Server berjalan di http://localhost:${ports[0]}`);
});

app.listen(ports[1], () => {
    console.log(`Server berjalan di http://localhost:${ports[1]}`);
});
