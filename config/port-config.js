/**
 * Port Configuration Helper
 * Provides utilities for managing server ports and avoiding conflicts
 */

/**
 * Get available port with fallback options
 * @param {number} preferredPort - The preferred port to use
 * @returns {number} Available port number
 */
export function getAvailablePort(preferredPort = 3001) {
  const fallbackPorts = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009];
  
  // If environment variable is set, use that
  if (process.env.PORT) {
    const envPort = parseInt(process.env.PORT);
    if (envPort && envPort > 0 && envPort < 65536) {
      return envPort;
    }
  }
  
  // Use preferred port if it's in the fallback list
  if (fallbackPorts.includes(preferredPort)) {
    return preferredPort;
  }
  
  // Return first fallback port
  return fallbackPorts[0];
}

/**
 * Get CORS origins for the given port
 * @param {number} port - The server port
 * @returns {string[]} Array of allowed origins
 */
export function getCorsOrigins(port) {
  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    `http://localhost:${port}`,
    // Loopback equivalents
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    `http://127.0.0.1:${port}`
  ];
  
  // Add common development ports
  const commonPorts = Array.from({length: 10}, (_, i) => 3000 + i)
    .concat(Array.from({length: 10}, (_, i) => 5000 + i));
  
  // Add Vite port range (5173-5180) for development
  const vitePorts = Array.from({length: 8}, (_, i) => 5173 + i);
  
  const dynamicLocalhost = commonPorts.concat(vitePorts).map(p => `http://localhost:${p}`);
  const dynamicLoopback = commonPorts.concat(vitePorts).map(p => `http://127.0.0.1:${p}`);
  
  return [...baseOrigins, ...dynamicLocalhost, ...dynamicLoopback];
}

/**
 * Log server startup information
 * @param {number} port - The server port
 */
export function logServerStart(port) {
  console.log('🚀 Server started successfully!');
  console.log(`📡 API server listening on http://localhost:${port}`);
  console.log(`🌐 CORS enabled for ports: 3000-3009, 5000-5009, 5173-5180, and ${port}`);
  console.log('');
  console.log('💡 Frontend should connect to: http://localhost:' + port);
  console.log('💡 WebSocket should connect to: ws://localhost:' + port);
}

/**
 * Handle port conflict errors
 * @param {Error} error - The error object
 * @param {number} port - The port that was in use
 */
export function handlePortError(error, port) {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use!`);
    console.error('💡 Try one of these solutions:');
    console.error('   1. Kill the process using the port: netstat -ano | findstr :' + port);
    console.error('   2. Set a different port: PORT=3002 npm run server');
    console.error('   3. Use the next available port by restarting the server');
    console.error('   4. Check for other Node.js processes: tasklist | findstr node.exe');
  } else {
    console.error('❌ Server error:', error);
  }
}

export default {
  getAvailablePort,
  getCorsOrigins,
  logServerStart,
  handlePortError
};
