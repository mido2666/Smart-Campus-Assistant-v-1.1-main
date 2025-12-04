/**
 * Utility to get a relevant image for a course based on its name and code.
 * Uses local images from public folder for better compatibility.
 */

// Map of keywords to specific images (using public folder paths)
const keywordImages: { [key: string]: string } = {
    // Applied Statistics
    'applied statistics': '/courses/applied-statistics.jpg',
    'statistics': '/courses/applied-statistics.jpg',
    'statistical analysis': '/courses/applied-statistics.jpg',
    'stats': '/courses/applied-statistics.jpg',

    // Graduation Project
    'graduation project': '/courses/graduation-project.jpg',
    'graduation': '/courses/graduation-project.jpg',
    'capstone project': '/courses/graduation-project.jpg',
    'senior project': '/courses/graduation-project.jpg',

    // Enterprise Information Systems
    'enterprise information systems': '/courses/enterprise-information-systems.jpg',
    'enterprise information': '/courses/enterprise-information-systems.jpg',
    'information systems': '/courses/enterprise-information-systems.jpg',
    'erp': '/courses/enterprise-information-systems.jpg',

    // Computer Programming Applications
    'computer programming': '/courses/computer-programming.jpg',
    'programming applications': '/courses/computer-programming.jpg',
    'programming': '/courses/computer-programming.jpg',

    // Strategic Management
    'strategic management': '/courses/strategic-management.jpg',
    'strategic': '/courses/strategic-management.jpg',
    'strategy': '/courses/strategic-management.jpg',

    // Business Analytics & Data Mining
    'business analytics': '/courses/business-analytics.jpg',
    'analytics': '/courses/business-analytics.jpg',
    'data mining': '/courses/business-analytics.jpg',
    'business intelligence': '/courses/business-analytics.jpg',

    // AI & Data
    'intelligence': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    'ml': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1000&auto=format&fit=crop',
    'data': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    'sql': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1000&auto=format&fit=crop',
    'database': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1000&auto=format&fit=crop',

    // Web & Mobile
    'web': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1000&auto=format&fit=crop',
    'frontend': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1000&auto=format&fit=crop',
    'backend': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1000&auto=format&fit=crop',
    'fullstack': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop',
    'mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
    'app': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=1000&auto=format&fit=crop',
    'android': 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=1000&auto=format&fit=crop',
    'ios': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop',

    // Security & Network
    'security': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop',
    'cyber': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1000&auto=format&fit=crop',
    'network': 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?q=80&w=1000&auto=format&fit=crop',
    'cloud': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',

    // Math & Science
    'math': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    'calculus': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    'algebra': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
    'physics': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1000&auto=format&fit=crop',
    'chemistry': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
    'biology': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000&auto=format&fit=crop',

    // Design & Arts
    'design': 'https://images.unsplash.com/photo-1561070791821-3f44a5638d48?q=80&w=1000&auto=format&fit=crop',
    'ui': 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=1000&auto=format&fit=crop',
    'ux': 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=1000&auto=format&fit=crop',
    'art': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop',

    // Business & Management (fallback for other business courses)
    'business': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    'management': 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop',
    'marketing': 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=1000&auto=format&fit=crop',
    'finance': 'https://images.unsplash.com/photo-1554224155-98406858d0be?q=80&w=1000&auto=format&fit=crop',

    // Engineering
    'engineering': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop',
    'robot': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop',
    'electronics': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1000&auto=format&fit=crop',

    // General
    'history': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1000&auto=format&fit=crop',
    'language': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
    'english': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
    'writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
};

// Pool of generic high-quality images for fallbacks
const genericImages = [
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop', // Coding laptop
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop', // Students group
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop', // Coffee & Notes
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop', // Library
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop', // Books
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop', // Classroom
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop', // Planning
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop', // Digital
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop', // Tech abstract
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop', // Teamwork
];

/**
 * Returns a deterministic image URL based on course name and ID.
 * @param courseName Name of the course
 * @param courseId ID of the course (string or number)
 */
export const getCourseImage = (courseName: string, courseId: string | number): string => {
    const lowerName = courseName.toLowerCase();

    // 1. Check for specific keywords (prioritize longer, more specific keywords first)
    const sortedKeywords = Object.keys(keywordImages).sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
        if (lowerName.includes(keyword)) {
            return keywordImages[keyword];
        }
    }

    // 2. If no keyword match, use deterministic hash of ID to pick from generic pool
    const idString = String(courseId);
    let hash = 0;
    for (let i = 0; i < idString.length; i++) {
        hash = ((hash << 5) - hash) + idString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % genericImages.length;
    return genericImages[index];
};
