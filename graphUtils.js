const { createCanvas } = require('canvas');

// Function to convert directional coordinates to Cartesian coordinates
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

// Function to create a graph image from coordinates
function createGraphFromCoordinates(coordinates) {
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
  
    // Set the background color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  
    // Convert directional coordinates to Cartesian coordinates
    const cartesianCoords = convertToCartesian(coordinates);
    
    // Log unscaled Cartesian coordinates
    console.log('Unscaled Cartesian coordinates:', cartesianCoords);
    
    // Scale coordinates to fit within canvas
    const scaledCoords = scaleCoordinates(cartesianCoords, width, height);
    
    // Log scaled coordinates
    console.log('Scaled coordinates:', scaledCoords);
  
    // Draw the coordinates as points
    ctx.fillStyle = '#ff0000'; // Red color for points
    scaledCoords.forEach(coord => {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  
    return canvas;
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
  

module.exports = { createGraphFromCoordinates };
