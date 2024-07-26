
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
 const cors = require('cors');

const app = express();
const port = 3006;
app.use(cors());
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), async (req, res) => {
    const filePath = path.join(__dirname, req.file.path);
    const processedFilePath = path.join(__dirname, 'processed_' + req.file.filename + '.png');

    try {
        // Process the image
        await sharp(filePath)
            .grayscale()
            .normalize()
            .toFile(processedFilePath);

        // Perform OCR
        const { data: { text } } = await Tesseract.recognize(processedFilePath, 'eng');
        console.log({ data: { text } } )
        const coordinates = parseCoordinates(text);
        console.log(coordinates)
        // Convert and scale coordinates
        const cartesianCoords = convertToCartesian(coordinates);
        const scaledCoords = scaleCoordinates(cartesianCoords, 800, 600); // Example canvas size
        
        // Send scaled coordinates as JSON response
        res.json(scaledCoords);
        await deleteFileWithRetry(filePath);
        await deleteFileWithRetry(processedFilePath);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing the image.');
        try {
            await deleteFileWithRetry(filePath);
            await deleteFileWithRetry(processedFilePath);
        } catch (err) {
            console.error('Failed to delete files after error:', err);
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

async function deleteFileWithRetry(filePath, retries = 3) {
    while (retries > 0) {
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
            return;
        } catch (err) {
            if (err.code === 'EPERM' && retries > 0) {
                console.warn(`Retrying file deletion: ${filePath}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for a second before retrying
                retries--;
            } else {
                console.error(`Failed to delete file ${filePath}:`, err);
                return;
            }
        }
    }
}

function parseCoordinates(text) {
    const regex = /(North|South|East|West)\s*(\d{1,3}(?:\.\d+)?|°?\s*\d{1,3}'?\s*\d{1,3}"?)\s*(North|South|East|West)?/g;
    const coordinates = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const direction1 = match[1];
        const value = match[2];
        const direction2 = match[3];

        const direction = direction2 ? `${direction1} ${direction2}` : direction1;
        coordinates.push({ direction, value });
    }

    return coordinates;
}

function convertToCartesian(coordinates) {
    const cartesian = [];
    let x = 400; // Starting x coordinate (center of canvas)
    let y = 300; // Starting y coordinate (center of canvas)

    // Direction offsets (for simplicity, assuming each step is 50 units)
    const stepSize = 50;

    coordinates.forEach(coord => {
        const direction = coord.direction;
        const distance = parseFloat(coord.value) * stepSize;

        switch (direction) {
            case 'North':
                y -= distance;
                break;
            case 'South':
                y += distance;
                break;
            case 'East':
                x += distance;
                break;
            case 'West':
                x -= distance;
                break;
            default:
                console.warn('Unknown direction:', direction);
                break;
        }

        cartesian.push({ x, y });
    });

    return cartesian;
}

function scaleCoordinates(coords, width, height) {
    const xValues = coords.map(p => p.x);
    const yValues = coords.map(p => p.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    return coords.map(p => ({
        x: (p.x - xMin) / xRange * width,
        y: height - (p.y - yMin) / yRange * height // Invert y-axis for canvas
    }));
}
