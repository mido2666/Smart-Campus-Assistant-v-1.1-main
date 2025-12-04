/**
 * Script to clear professor courses cache from localStorage
 * This helps when courses are updated in the database but still show old data
 * 
 * Usage: Run this in browser console or add as a utility function
 */

// Clear all professor-related cache
function clearProfessorCache() {
  console.log('🧹 Clearing professor cache...');
  
  const keysToRemove = [
    'professor-courses',
    'professor-courses-timestamp',
    'professor-attendance',
    'professor-notifications',
    'professor-notifications-archived',
    'professor-notifications-pinned',
    'professor-notifications-snoozed'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
    }
  });
  
  console.log('✅ Professor cache cleared! Please refresh the page.');
  
  // Optionally reload the page
  // window.location.reload();
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.clearProfessorCache = clearProfessorCache;
}

// Also provide instructions
console.log(`
To clear professor cache in browser console, run:
  clearProfessorCache()
  
Or manually:
  localStorage.removeItem('professor-courses');
  localStorage.removeItem('professor-courses-timestamp');
  location.reload();
`);

