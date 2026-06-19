// Provide a safe fallback for Lucide icons if the CDN script fails to load (e.g. network timeout / offline)
if (typeof window.lucide === 'undefined') {
    window.lucide = {
        createIcons: function() {
            console.warn("Lucide library failed to load. Icon rendering skipped.");
        }
    };
}
if (typeof lucide === 'undefined') {
    var lucide = window.lucide;
}

// Provide a safe fallback for GSAP animations if the CDN script fails to load
if (typeof window.gsap === 'undefined') {
    window.gsap = {
        registerPlugin: function() {},
        killTweensOf: function() {},
        set: function() {},
        timeline: function() {
            const mock = {
                fromTo: function() { return mock; },
                to: function() { return mock; },
                set: function() { return mock; }
            };
            return mock;
        },
        fromTo: function(el, from, to) {
            if (to && typeof to.onComplete === 'function') {
                to.onComplete();
            }
            return { kill: function() {} };
        },
        to: function(el, to) {
            if (to && typeof to.onComplete === 'function') {
                to.onComplete();
            }
            return { kill: function() {} };
        }
    };
}
if (typeof gsap === 'undefined') {
    var gsap = window.gsap;
}
if (typeof window.ScrollTrigger === 'undefined') {
    window.ScrollTrigger = {};
}

// Provide a safe fallback for Swiper if the CDN script fails to load
if (typeof window.Swiper === 'undefined') {
    window.Swiper = function() {
        console.warn("Swiper library failed to load. Slider disabled.");
        return {
            on: function() {},
            destroy: function() {},
            update: function() {}
        };
    };
}
if (typeof Swiper === 'undefined') {
    var Swiper = window.Swiper;
}


// ==================== STATE MANAGEMENT ====================
let allBooks = [];
let userDownloads = [];
let currentUser = null;
let currentRole = null;
let currentUserEmail = null;
let currentSection = 'home';
let featuredStartIndex = 0;
let selectedBookForModal = null;

const MEMBERSHIP_APPLICATIONS_KEY = 'libraryMemberApplications';
const CUSTOM_BOOK_APPLICATIONS_KEY = 'customBookApplications';

// ==================== PAGINATION STATE ====================
let catalogCurrentPage = 1;
const CATALOG_PER_PAGE = 12;
let adminCurrentPage = 1;
const ADMIN_PER_PAGE = 10;

// ==================== SYSTEM NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastIcon || !toastMessage) return;

    toastMessage.textContent = message;

    // Choose Lucide icon based on alert context in Light Mode
    if (type === 'success') {
        toastIcon.className = "w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0";
        toastIcon.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i>`;
    } else if (type === 'error') {
        toastIcon.className = "w-8 h-8 rounded-lg bg-rose-50 text-rose-650 flex items-center justify-center shrink-0";
        toastIcon.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4"></i>`;
    } else {
        toastIcon.className = "w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center shrink-0";
        toastIcon.innerHTML = `<i data-lucide="info" class="w-4 h-4"></i>`;
    }

    // Refresh Lucide dynamically
    lucide.createIcons({
        attrs: {
            class: 'w-4 h-4'
        },
        nameAttr: 'data-lucide'
    });

    toast.classList.remove('hidden');
    gsap.killTweensOf(toast);

    gsap.fromTo(toast,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }
    );

    setTimeout(() => {
        gsap.to(toast, {
            y: 30,
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
            onComplete: () => { toast.classList.add('hidden'); }
        });
    }, 4000);
}

// ==================== KNOWLEDGE AREAS DYNAMIC RENDERER ====================
const KNOWLEDGE_AREAS_CONFIG = [
    { category: 'Technology', subtitle: 'Computer Science', desc: 'AI, algorithms, software craft & system design volumes.', icon: 'cpu', gradientFrom: 'brand-500', gradientTo: 'brand-600', iconBgFrom: 'brand-50', iconBgTo: 'brand-100', iconBorder: 'brand-200/60', iconText: 'brand-600', badgeBg: 'brand-50', badgeText: 'brand-600', badgeBorder: 'brand-100', arrowBg: 'brand-600' },
    { category: 'Science', subtitle: 'Physics & Universe', desc: 'Cosmology, cognition, evolution & natural phenomena.', icon: 'atom', gradientFrom: 'violet-500', gradientTo: 'purple-500', iconBgFrom: 'violet-50', iconBgTo: 'purple-100', iconBorder: 'violet-200/60', iconText: 'violet-600', badgeBg: 'violet-50', badgeText: 'violet-600', badgeBorder: 'violet-100', arrowBg: 'violet-600' },
    { category: 'Fiction', subtitle: 'Literature', desc: 'Classic novels, dystopian tales & epic sci-fi series.', icon: 'book-open', gradientFrom: 'rose-500', gradientTo: 'pink-500', iconBgFrom: 'rose-50', iconBgTo: 'pink-100', iconBorder: 'rose-200/60', iconText: 'rose-600', badgeBg: 'rose-50', badgeText: 'rose-600', badgeBorder: 'rose-100', arrowBg: 'rose-600' },
    { category: 'History', subtitle: 'Legacy Archives', desc: 'Biographies, philosophy, ancient civilizations & wars.', icon: 'hourglass', gradientFrom: 'amber-500', gradientTo: 'orange-500', iconBgFrom: 'amber-50', iconBgTo: 'orange-100', iconBorder: 'amber-200/60', iconText: 'amber-600', badgeBg: 'amber-50', badgeText: 'amber-600', badgeBorder: 'amber-100', arrowBg: 'amber-600' },
    { category: 'Business', subtitle: 'Finance & Strategy', desc: 'Leadership, wealth building, startups & productivity.', icon: 'trending-up', gradientFrom: 'emerald-500', gradientTo: 'teal-500', iconBgFrom: 'emerald-50', iconBgTo: 'teal-100', iconBorder: 'emerald-200/60', iconText: 'emerald-600', badgeBg: 'emerald-50', badgeText: 'emerald-600', badgeBorder: 'emerald-100', arrowBg: 'emerald-600' }
];

function renderKnowledgeAreas() {
    const grid = document.getElementById('knowledgeAreasGrid');
    const badge = document.getElementById('totalVolumesBadge');
    if (!grid) return;

    mergeApprovedCustomBooksIntoCatalog();
    mergeCurrentUserCustomBooksIntoCatalog();
    const visibleBooks = allBooks.filter(isCatalogVisibleBook);

    // Update total count badge
    if (badge) badge.textContent = `${visibleBooks.length} Volumes Cataloged`;

    grid.innerHTML = KNOWLEDGE_AREAS_CONFIG.map(area => {
        const count = visibleBooks.filter(b => b.category === area.category).length;
        return `
            <div onclick="navigateToCatalogWithFilter('${area.category}')"
                class="bg-white border border-slate-200 p-6 rounded-3xl cursor-pointer flex flex-col items-center text-center relative overflow-hidden group">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-${area.iconBgFrom} to-${area.iconBgTo} border border-${area.iconBorder} text-${area.iconText} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:rotate-12">
                    <i data-lucide="${area.icon}" class="w-7 h-7"></i>
                </div>
                <h4 class="font-extrabold text-slate-900 text-base mb-1">${area.category}</h4>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4">${area.subtitle}</p>
                <p class="text-[11px] text-slate-500 leading-relaxed mb-5 font-medium">${area.desc}</p>
                <div class="flex items-center justify-between w-full mt-auto pt-4 border-t border-slate-100">
                    <span class="px-2.5 py-1 bg-${area.badgeBg} text-${area.badgeText} border border-${area.badgeBorder} text-[9px] font-black uppercase tracking-wider rounded-lg">${count} Volume${count !== 1 ? 's' : ''}</span>
                    <div class="w-7 h-7 rounded-full bg-${area.arrowBg} text-white flex items-center justify-center transition-transform duration-300 group-hover:-rotate-45">
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// ==================== DATABASE INTEGRATION (AXIOS) ====================
async function fetchCatalogDatabase() {
    try {
        // Cache bust: clear stale Unsplash covers so Open Library images load
        const stored = localStorage.getItem('libraryBooks');
        if (stored && stored.includes('unsplash.com')) {
            localStorage.removeItem('libraryBooks');
        }

        const storedClean = localStorage.getItem('libraryBooks');
        if (storedClean) {
            allBooks = JSON.parse(storedClean);

            // Auto-migrate semesters up to 8th Semester to guarantee instant gorgeous visual presentation
            const hasSemestersAbove4 = allBooks.some(b => b.semester && (
                b.semester.includes("5th") ||
                b.semester.includes("6th") ||
                b.semester.includes("7th") ||
                b.semester.includes("8th")
            ));
            if (!hasSemestersAbove4) {
                allBooks = allBooks.map(book => {
                    const semesters = [
                        "1st Semester", "2nd Semester", "3rd Semester", "4th Semester",
                        "5th Semester", "6th Semester", "7th Semester", "8th Semester"
                    ];
                    book.semester = semesters[book.id % semesters.length];
                    return book;
                });
                localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
            }
        } else {
            // Load from books.json relative to active folder path
            const response = await axios.get('data/books.json');
            allBooks = response.data;
        }

        // Deterministic mock enterprise field injection
        allBooks = allBooks.map(book => {
            if (!book.isCustom) { // Re-inject or override semesters to get perfect 1st-8th Semester coverage
                const semesters = [
                    "1st Semester", "2nd Semester", "3rd Semester", "4th Semester",
                    "5th Semester", "6th Semester", "7th Semester", "8th Semester"
                ];
                book.semester = semesters[book.id % semesters.length];
            }
            if (!book.status) {
                const statuses = ["Available", "Reserved", "Out of Stock"];
                const r = book.id % 10;
                book.status = r < 7 ? "Available" : (r < 9 ? "Reserved" : "Out of Stock");
            }
            if (!book.department) {
                const depts = {
                    "Technology": "Computer Science",
                    "Science": "Applied Physics",
                    "Business": "Business Administration",
                    "Fiction": "General Education",
                    "History": "Liberal Arts"
                };
                book.department = depts[book.category] || "General Education";
            }
            if (book.copiesTotal === undefined) {
                book.copiesTotal = 5 + (book.id % 6);
            }
            if (book.copiesAvailable === undefined) {
                book.copiesAvailable = book.status === "Out of Stock" ? 0 : Math.max(1, book.copiesTotal - (book.id % 4));
            }
            return book;
        });

        mergeApprovedCustomBooksIntoCatalog();
        mergeCurrentUserCustomBooksIntoCatalog();
        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));

        // Update home stats UI
        const heroBookCount = document.getElementById('heroBookCount');
        if (heroBookCount) heroBookCount.textContent = allBooks.length;

        const pageId = getCurrentPageId();
        if (pageId === 'home') {
            renderFeaturedSlider();
            renderFeaturedList();
        }
        renderKnowledgeAreas();
        if (pageId === 'catalog') renderCatalogGrid();
        if (pageId === 'admin') updateAdminTable();
        if (pageId === 'dashboard') renderDashboardPortfolio();
        if (pageId === 'saved') renderSavedBooks();
        updateLibraryStats();
        checkPendingFilters();
    } catch (error) {
        console.error("Database connection failure (CORS/File Protocol):", error);

        // Premium Local Sandbox Fallback for file:/// testing
        allBooks = [
            {
                "id": 1,
                "title": "Artificial Intelligence: A Modern Approach",
                "author": "Stuart Russell & Peter Norvig",
                "category": "Technology",
                "department": "Computer Science",
                "semester": "1st Semester",
                "status": "Available",
                "copiesTotal": 8,
                "copiesAvailable": 6,
                "description": "The long-anticipated revision of this industry-standard guide. This book offers a comprehensive, up-to-date introduction to the theory and practice of artificial intelligence.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780136086208-L.jpg",
                "isbn": "978-0136086208",
                "yearPublished": 2021
            },
            {
                "id": 2,
                "title": "A Brief History of Time",
                "author": "Stephen Hawking",
                "category": "Science",
                "department": "Applied Physics",
                "semester": "2nd Semester",
                "status": "Available",
                "copiesTotal": 5,
                "copiesAvailable": 3,
                "description": "A landmark volume in science writing by one of the great minds of our time. Hawking explores the secrets of the universe, from black holes to general relativity.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
                "isbn": "978-0553380163",
                "yearPublished": 1998
            },
            {
                "id": 3,
                "title": "Zero to One: Notes on Startups",
                "author": "Peter Thiel",
                "category": "Business",
                "department": "Business Administration",
                "semester": "3rd Semester",
                "status": "Available",
                "copiesTotal": 10,
                "copiesAvailable": 8,
                "description": "The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg",
                "isbn": "978-0804139298",
                "yearPublished": 2014
            },
            {
                "id": 4,
                "title": "The Hobbit",
                "author": "J.R.R. Tolkien",
                "category": "Fiction",
                "department": "General Education",
                "semester": "4th Semester",
                "status": "Reserved",
                "copiesTotal": 4,
                "copiesAvailable": 0,
                "description": "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life...",
                "cover": "https://covers.openlibrary.org/b/isbn/9780345339683-L.jpg",
                "isbn": "978-0345339683",
                "yearPublished": 1937
            },
            {
                "id": 5,
                "title": "Sapiens: A Brief History of Humankind",
                "author": "Yuval Noah Harari",
                "category": "History",
                "department": "Liberal Arts",
                "semester": "5th Semester",
                "status": "Available",
                "copiesTotal": 7,
                "copiesAvailable": 7,
                "description": "100,000 years ago, at least six human species inhabited the earth. Today there is just one.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
                "isbn": "978-0062316097",
                "yearPublished": 2014
            },
            {
                "id": 6,
                "title": "Clean Code",
                "author": "Robert C. Martin",
                "category": "Technology",
                "department": "Computer Science",
                "semester": "6th Semester",
                "status": "Available",
                "copiesTotal": 12,
                "copiesAvailable": 9,
                "description": "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
                "isbn": "978-0132350884",
                "yearPublished": 2008
            },
            {
                "id": 7,
                "title": "The Innovators",
                "author": "Walter Isaacson",
                "category": "Technology",
                "department": "Computer Science",
                "semester": "7th Semester",
                "status": "Out of Stock",
                "copiesTotal": 3,
                "copiesAvailable": 0,
                "description": "The Innovators is Walter Isaacson's revealing story of the people who created the computer and the Internet.",
                "cover": "https://covers.openlibrary.org/b/isbn/9781476708690-L.jpg",
                "isbn": "978-1476708690",
                "yearPublished": 2014
            },
            {
                "id": 8,
                "title": "Thinking, Fast and Slow",
                "author": "Daniel Kahneman",
                "category": "Science",
                "department": "Applied Physics",
                "semester": "8th Semester",
                "status": "Reserved",
                "copiesTotal": 6,
                "copiesAvailable": 1,
                "description": "Daniel Kahneman takes us on a groundbreaking tour of the mind.",
                "cover": "https://covers.openlibrary.org/b/isbn/9780374275631-L.jpg",
                "isbn": "978-0374275631",
                "yearPublished": 2011
            }
        ];

        mergeApprovedCustomBooksIntoCatalog();
        mergeCurrentUserCustomBooksIntoCatalog();
        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));

        const heroBookCount2 = document.getElementById('heroBookCount');
        if (heroBookCount2) heroBookCount2.textContent = allBooks.length;

        const fallbackPageId = getCurrentPageId();
        if (fallbackPageId === 'home') {
            if (typeof renderFeaturedSlider === 'function') renderFeaturedSlider();
            if (typeof renderFeaturedList === 'function') renderFeaturedList();
        }
        if (fallbackPageId === 'catalog') { if (typeof renderCatalogGrid === 'function') renderCatalogGrid(); }
        if (fallbackPageId === 'admin') { if (document.getElementById('adminBooksTable')) updateAdminTable(); }
        if (fallbackPageId === 'saved') renderSavedBooks();
        if (fallbackPageId === 'dashboard') renderDashboardPortfolio();
        checkPendingFilters();

        showNotification("Loaded local fallback catalog due to file system security rules.", "success");
    }
}

function saveDatabase() {
    try {
        console.log('Saving to localStorage...', allBooks);
        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
        console.log('localStorage saved successfully');
        
        // Verify it was saved
        const saved = localStorage.getItem('libraryBooks');
        console.log('Verification - data in storage:', saved ? JSON.parse(saved).length + ' books' : 'FAILED');
        
        try {
            updateLibraryStats();
        } catch (err) {
            console.error('updateLibraryStats error (non-critical):', err);
        }
    } catch (err) {
        console.error('CRITICAL: saveDatabase failed:', err);
        alert('Error saving to browser storage: ' + err.message);
    }
}

async function factoryResetDatabase() {
    localStorage.removeItem('libraryBooks');
    await fetchCatalogDatabase();
    if (document.getElementById('adminBooksTable')) {
        updateAdminTable();
    }
    showNotification("Factory settings restored. Original catalog reloaded.", "success");
}


function loadDownloads() {
    const stored = localStorage.getItem('userDownloads');
    userDownloads = stored ? JSON.parse(stored) : [];
}

function saveDownloads() {
    localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
    updateLibraryStats();
}

function getMemberApplications() {
    try {
        const parsed = JSON.parse(localStorage.getItem(MEMBERSHIP_APPLICATIONS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse member applications:', error);
        return [];
    }
}

function saveMemberApplications(applications) {
    localStorage.setItem(MEMBERSHIP_APPLICATIONS_KEY, JSON.stringify(applications));
    updateMemberApprovalBadges(applications);
}

function getLatestMemberApplication(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    return getMemberApplications()
        .filter(app => (app.email || '').toLowerCase() === normalizedEmail)
        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0] || null;
}

function updateMemberApprovalBadges(applications = getMemberApplications()) {
    const pendingCount = applications.filter(app => app.status === 'pending').length;
    const approvedCount = applications.filter(app => app.status === 'approved').length;
    const rejectedCount = applications.filter(app => app.status === 'rejected').length;

    const pendingBadge = document.getElementById('pendingMembersBadge');
    const pendingCountEl = document.getElementById('memberPendingCount');
    const approvedCountEl = document.getElementById('memberApprovedCount');
    const rejectedCountEl = document.getElementById('memberRejectedCount');

    if (pendingBadge) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.classList.toggle('hidden', pendingCount === 0);
        pendingBadge.classList.toggle('inline-flex', pendingCount > 0);
    }
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    if (rejectedCountEl) rejectedCountEl.textContent = rejectedCount;
}

function getCustomBookApplications() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CUSTOM_BOOK_APPLICATIONS_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse custom book applications:', error);
        return [];
    }
}

function saveCustomBookApplications(applications) {
    localStorage.setItem(CUSTOM_BOOK_APPLICATIONS_KEY, JSON.stringify(applications));
    updateCustomBookApprovalBadges(applications);
}

function updateCustomBookApprovalBadges(applications = getCustomBookApplications()) {
    const pendingCount = applications.filter(app => app.approvalStatus === 'pending').length;
    const approvedCount = applications.filter(app => app.approvalStatus === 'approved').length;
    const rejectedCount = applications.filter(app => app.approvalStatus === 'rejected').length;

    const pendingBadge = document.getElementById('pendingBooksBadge');
    const pendingCountEl = document.getElementById('bookPendingCount');
    const approvedCountEl = document.getElementById('bookApprovedCount');
    const rejectedCountEl = document.getElementById('bookRejectedCount');

    if (pendingBadge) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.classList.toggle('hidden', pendingCount === 0);
        pendingBadge.classList.toggle('inline-flex', pendingCount > 0);
    }
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    if (rejectedCountEl) rejectedCountEl.textContent = rejectedCount;
}

function getBookApprovalStatusClasses(status) {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
}

function mergeApprovedCustomBooksIntoCatalog({ persist = false } = {}) {
    const approvedBooks = getCustomBookApplications()
        .filter(app => app.approvalStatus === 'approved')
        .map(app => ({
            ...app,
            isCustom: true,
            approvalStatus: 'approved',
            reviewStatus: 'approved',
            status: 'Available',
            copiesTotal: app.copiesTotal || 1,
            copiesAvailable: app.copiesAvailable || 1,
            publisher: app.publisher || 'Custom Reader Entry',
            pages: app.pages || 300,
            yearPublished: app.yearPublished || new Date().getFullYear(),
            rating: app.rating || 5.0
        }));

    if (!approvedBooks.length) return false;

    let changed = false;
    approvedBooks.forEach(approvedBook => {
        const existingIndex = allBooks.findIndex(book =>
            String(book.id) === String(approvedBook.id) ||
            ((book.isbn || '').toLowerCase() === (approvedBook.isbn || '').toLowerCase())
        );

        if (existingIndex === -1) {
            allBooks.push(approvedBook);
            changed = true;
        } else {
            allBooks[existingIndex] = {
                ...allBooks[existingIndex],
                ...approvedBook
            };
            changed = true;
        }
    });

    if (changed && persist) {
        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
    }

    return changed;
}

function mergeCurrentUserCustomBooksIntoCatalog({ persist = false } = {}) {
    if (!currentUserEmail) return false;

    const customBooks = JSON.parse(localStorage.getItem(`customUserBooks_${currentUserEmail}`) || '[]')
        .filter(book => (book.approvalStatus || 'pending') !== 'rejected')
        .map(book => {
            const approvalStatus = book.approvalStatus || 'pending';
            return {
                ...book,
                isCustom: true,
                ownerEmail: book.ownerEmail || currentUserEmail,
                submittedByEmail: book.submittedByEmail || currentUserEmail,
                submittedBy: book.submittedBy || currentUser || currentUserEmail,
                approvalStatus,
                reviewStatus: book.reviewStatus || approvalStatus,
                status: approvalStatus === 'approved' ? 'Available' : 'Pending Review',
                copiesTotal: book.copiesTotal || 1,
                copiesAvailable: approvalStatus === 'approved' ? (book.copiesAvailable || 1) : 0,
                publisher: book.publisher || 'Custom Reader Entry',
                pages: book.pages || 300,
                yearPublished: book.yearPublished || new Date().getFullYear(),
                rating: book.rating || 5.0
            };
        });

    if (!customBooks.length) return false;

    let changed = false;
    customBooks.forEach(customBook => {
        const existingIndex = allBooks.findIndex(book =>
            String(book.id) === String(customBook.id) ||
            ((book.isbn || '').toLowerCase() === (customBook.isbn || '').toLowerCase())
        );

        if (existingIndex === -1) {
            allBooks.push(customBook);
            changed = true;
        } else {
            const existingBook = allBooks[existingIndex];
            if (existingBook.approvalStatus !== 'approved') {
                allBooks[existingIndex] = {
                    ...existingBook,
                    ...customBook
                };
                changed = true;
            }
        }
    });

    if (changed && persist) {
        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
    }

    return changed;
}

function isCatalogVisibleBook(book) {
    if (!book || !book.isCustom) return true;
    if ((book.approvalStatus || '') === 'approved') return true;
    const ownerEmail = (book.ownerEmail || book.submittedByEmail || '').toLowerCase();
    return Boolean(currentUserEmail && ownerEmail === currentUserEmail.toLowerCase());
}

function getMemberStatusClasses(status) {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function renderMemberApprovals() {
    const container = document.getElementById('memberApplicationsList');
    const applications = getMemberApplications().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    updateMemberApprovalBadges(applications);

    if (!container) return;

    if (!applications.length) {
        container.innerHTML = `
            <div class="p-10 text-center">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mb-4">
                    <i data-lucide="inbox" class="w-6 h-6"></i>
                </div>
                <h4 class="text-sm font-black text-slate-800 mb-1">No member applications yet</h4>
                <p class="text-xs font-semibold text-slate-400">New registrations will appear here for approval.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = applications.map(app => {
        const status = app.status || 'pending';
        const statusClasses = getMemberStatusClasses(status);
        const submitted = app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Unknown';
        const reviewed = app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : '';
        const safe = {
            id: escapeHTML(app.id),
            name: escapeHTML(app.name || 'Unnamed Applicant'),
            email: escapeHTML(app.email || '-'),
            studentId: escapeHTML(app.studentId || '-'),
            program: escapeHTML(app.program || '-'),
            membershipType: escapeHTML(app.membershipType || '-'),
            department: escapeHTML(app.department || '-'),
            semester: escapeHTML(app.semester || '-'),
            branch: escapeHTML(app.branch || '-'),
            phone: escapeHTML(app.phone || '-'),
            status: escapeHTML(status),
            submitted: escapeHTML(submitted),
            reviewed: escapeHTML(reviewed || 'Completed')
        };
        const actions = status === 'pending' ? `
            <div class="flex flex-wrap gap-2 justify-end">
                <button onclick="approveMemberApplication('${safe.id}')" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black active:scale-95 transition-all duration-200">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Approve</span>
                </button>
                <button onclick="rejectMemberApplication('${safe.id}')" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black active:scale-95 transition-all duration-200">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    <span>Reject</span>
                </button>
            </div>
        ` : `
            <div class="text-right">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Reviewed</span>
                <span class="block text-[11px] font-bold text-slate-500">${safe.reviewed}</span>
            </div>
        `;

        return `
            <article class="p-5 md:p-6 hover:bg-slate-50/60 transition-colors duration-150">
                <div class="flex flex-col lg:flex-row lg:items-start gap-5 justify-between">
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <h4 class="text-sm font-black text-slate-850">${safe.name}</h4>
                            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusClasses}">${safe.status}</span>
                            <span class="text-[10px] font-bold text-slate-400">Submitted ${safe.submitted}</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Email</span><span class="font-bold text-slate-700 break-all">${safe.email}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Student ID</span><span class="font-bold text-slate-700">${safe.studentId}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Program</span><span class="font-bold text-slate-700">${safe.program}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Membership</span><span class="font-bold text-slate-700">${safe.membershipType}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Department</span><span class="font-bold text-slate-700">${safe.department}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Semester</span><span class="font-bold text-slate-700">${safe.semester}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Branch</span><span class="font-bold text-slate-700">${safe.branch}</span></div>
                            <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Phone</span><span class="font-bold text-slate-700">${safe.phone}</span></div>
                        </div>
                    </div>
                    <div class="lg:w-44 shrink-0">${actions}</div>
                </div>
            </article>
        `;
    }).join('');

    lucide.createIcons();
}

function approveMemberApplication(applicationId) {
    const applications = getMemberApplications();
    const appIndex = applications.findIndex(app => String(app.id) === String(applicationId));
    if (appIndex === -1) {
        showNotification("Application not found.", "error");
        return;
    }

    const application = applications[appIndex];
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const existingUserIndex = registeredUsers.findIndex(user => (user.email || '').toLowerCase() === application.email.toLowerCase());
    const existingUser = existingUserIndex === -1 ? {} : registeredUsers[existingUserIndex];
    const approvedPhoto = application.profileImage || application.memberPhoto || existingUser.profileImage || existingUser.memberPhoto || '';
    const approvedUser = {
        name: application.name,
        email: application.email,
        password: application.password || existingUser.password || '',
        phone: application.phone || '',
        department: application.department || '',
        studentId: application.studentId || '',
        program: application.program || '',
        semester: application.semester || '',
        degreeLevel: application.degreeLevel || '',
        membershipType: application.membershipType || '',
        branch: application.branch || '',
        profileImage: approvedPhoto,
        memberPhoto: approvedPhoto,
        membershipStatus: 'approved',
        approvedAt: new Date().toISOString()
    };

    if (existingUserIndex === -1) {
        registeredUsers.push(approvedUser);
    } else {
        registeredUsers[existingUserIndex] = { ...registeredUsers[existingUserIndex], ...approvedUser };
    }

    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    applications[appIndex] = {
        ...application,
        profileImage: approvedPhoto,
        memberPhoto: approvedPhoto,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUserEmail || 'admin@gmail.com'
    };
    saveMemberApplications(applications);
    renderMemberApprovals();
    showNotification(`${application.name} has been approved as a library member.`, "success");
}

function rejectMemberApplication(applicationId) {
    const applications = getMemberApplications();
    const appIndex = applications.findIndex(app => String(app.id) === String(applicationId));
    if (appIndex === -1) {
        showNotification("Application not found.", "error");
        return;
    }

    applications[appIndex] = {
        ...applications[appIndex],
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUserEmail || 'admin@gmail.com'
    };
    saveMemberApplications(applications);
    renderMemberApprovals();
    showNotification(`${applications[appIndex].name}'s membership application was rejected.`, "info");
}

function upsertUserCustomBook(ownerEmail, bookRecord) {
    if (!ownerEmail) return;
    const storageKey = `customUserBooks_${ownerEmail}`;
    const customBooks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const existingIndex = customBooks.findIndex(book => String(book.id) === String(bookRecord.id));

    if (existingIndex === -1) {
        customBooks.push(bookRecord);
    } else {
        customBooks[existingIndex] = {
            ...customBooks[existingIndex],
            ...bookRecord
        };
    }

    localStorage.setItem(storageKey, JSON.stringify(customBooks));
}

function renderCustomBookApprovals() {
    const container = document.getElementById('customBookApplicationsList');
    const applications = getCustomBookApplications().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    updateCustomBookApprovalBadges(applications);

    if (!container) return;

    if (!applications.length) {
        container.innerHTML = `
            <div class="p-10 text-center">
                <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center mb-4">
                    <i data-lucide="book-plus" class="w-6 h-6"></i>
                </div>
                <h4 class="text-sm font-black text-slate-800 mb-1">No custom book submissions yet</h4>
                <p class="text-xs font-semibold text-slate-400">Reader-created books will appear here before entering the catalog.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = applications.map(app => {
        const status = app.approvalStatus || 'pending';
        const statusClasses = getBookApprovalStatusClasses(status);
        const submitted = app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'Unknown';
        const reviewed = app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : '';
        const safe = {
            id: escapeHTML(app.id),
            title: escapeHTML(app.title || 'Untitled Book'),
            author: escapeHTML(app.author || 'Unknown Author'),
            isbn: escapeHTML(app.isbn || '-'),
            category: escapeHTML(app.category || '-'),
            department: escapeHTML(app.department || '-'),
            semester: escapeHTML(app.semester || '-'),
            description: escapeHTML(app.description || 'No summary provided.'),
            ownerEmail: escapeHTML(app.submittedByEmail || app.ownerEmail || '-'),
            ownerName: escapeHTML(app.submittedBy || 'Reader'),
            cover: escapeHTML(app.cover || ''),
            status: escapeHTML(status),
            submitted: escapeHTML(submitted),
            reviewed: escapeHTML(reviewed || 'Completed')
        };
        const actions = status === 'pending' ? `
            <div class="flex flex-wrap gap-2 justify-end">
                <button onclick="approveCustomBookApplication('${safe.id}')" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black active:scale-95 transition-all duration-200">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Approve</span>
                </button>
                <button onclick="rejectCustomBookApplication('${safe.id}')" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black active:scale-95 transition-all duration-200">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    <span>Reject</span>
                </button>
            </div>
        ` : `
            <div class="text-right">
                <span class="block text-[10px] font-black uppercase tracking-wider text-slate-400">Reviewed</span>
                <span class="block text-[11px] font-bold text-slate-500">${safe.reviewed}</span>
            </div>
        `;

        return `
            <article class="p-5 md:p-6 hover:bg-slate-50/60 transition-colors duration-150">
                <div class="flex flex-col xl:flex-row xl:items-start gap-5 justify-between">
                    <div class="flex flex-col sm:flex-row gap-4 min-w-0 flex-1">
                        <div class="w-20 h-28 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                            ${safe.cover ? `<img src="${safe.cover}" alt="${safe.title}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-slate-300"><i data-lucide="book-open" class="w-7 h-7"></i></div>`}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                <h4 class="text-sm font-black text-slate-850">${safe.title}</h4>
                                <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusClasses}">${safe.status}</span>
                                <span class="text-[10px] font-bold text-slate-400">Submitted ${safe.submitted}</span>
                            </div>
                            <p class="text-xs font-bold text-slate-500 mb-3">by ${safe.author}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs mb-3">
                                <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Reader</span><span class="font-bold text-slate-700 break-all">${safe.ownerName} (${safe.ownerEmail})</span></div>
                                <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">ISBN</span><span class="font-bold text-slate-700">${safe.isbn}</span></div>
                                <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Category</span><span class="font-bold text-slate-700">${safe.category}</span></div>
                                <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Semester</span><span class="font-bold text-slate-700">${safe.semester}</span></div>
                                <div><span class="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Department</span><span class="font-bold text-slate-700">${safe.department}</span></div>
                            </div>
                            <p class="text-xs leading-relaxed text-slate-500 font-medium max-w-3xl">${safe.description}</p>
                        </div>
                    </div>
                    <div class="xl:w-44 shrink-0">${actions}</div>
                </div>
            </article>
        `;
    }).join('');

    lucide.createIcons();
}

function approveCustomBookApplication(applicationId) {
    const applications = getCustomBookApplications();
    const appIndex = applications.findIndex(app => String(app.id) === String(applicationId));
    if (appIndex === -1) {
        showNotification("Custom book submission not found.", "error");
        return;
    }

    const application = applications[appIndex];
    const approvedBook = {
        ...application,
        approvalStatus: 'approved',
        reviewStatus: 'approved',
        status: 'Available',
        copiesTotal: application.copiesTotal || 1,
        copiesAvailable: application.copiesAvailable || 1,
        approvedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUserEmail || 'admin@gmail.com'
    };

    const existingIndex = allBooks.findIndex(book =>
        String(book.id) === String(approvedBook.id) ||
        ((book.isbn || '').toLowerCase() === (approvedBook.isbn || '').toLowerCase())
    );
    if (existingIndex === -1) {
        allBooks.push(approvedBook);
    } else {
        allBooks[existingIndex] = {
            ...allBooks[existingIndex],
            ...approvedBook
        };
    }

    applications[appIndex] = approvedBook;
    saveCustomBookApplications(applications);
    saveDatabase();
    upsertUserCustomBook(application.submittedByEmail || application.ownerEmail, approvedBook);
    renderCustomBookApprovals();
    updateAdminTable();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
    showNotification(`"${application.title}" has been approved and published.`, "success");
}

function rejectCustomBookApplication(applicationId) {
    const applications = getCustomBookApplications();
    const appIndex = applications.findIndex(app => String(app.id) === String(applicationId));
    if (appIndex === -1) {
        showNotification("Custom book submission not found.", "error");
        return;
    }

    const application = applications[appIndex];
    const rejectedBook = {
        ...application,
        approvalStatus: 'rejected',
        reviewStatus: 'rejected',
        status: 'Rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUserEmail || 'admin@gmail.com'
    };

    applications[appIndex] = rejectedBook;
    allBooks = allBooks.filter(book => String(book.id) !== String(application.id));
    saveCustomBookApplications(applications);
    saveDatabase();
    upsertUserCustomBook(application.submittedByEmail || application.ownerEmail, rejectedBook);
    renderCustomBookApprovals();
    updateAdminTable();
    showNotification(`"${application.title}" was rejected.`, "info");
}

function getRegisteredUserByEmail(email) {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return registeredUsers.find(user => (user.email || '').toLowerCase() === (email || '').toLowerCase()) || null;
}

function getMemberCardFormData() {
    return {
        name: document.getElementById('memberFullName')?.value.trim() || '',
        email: document.getElementById('memberEmail')?.value.trim().toLowerCase() || '',
        studentId: document.getElementById('memberStudentId')?.value.trim().toUpperCase() || '',
        phone: document.getElementById('memberPhone')?.value.trim() || '',
        degreeLevel: document.getElementById('memberDegreeLevel')?.value || '',
        department: document.getElementById('memberDepartment')?.value.trim() || '',
        program: document.getElementById('memberProgram')?.value.trim() || '',
        semester: document.getElementById('memberSemester')?.value.trim() || '',
        membershipType: document.getElementById('memberMembershipType')?.value || '',
        branch: document.getElementById('memberBranch')?.value || '',
        declarationAccepted: Boolean(document.getElementById('memberDeclaration')?.checked),
        profileImage: document.getElementById('memberCardForm')?.dataset.memberPhoto || ''
    };
}

function setMemberCardStatus(status, message) {
    const statusEl = document.getElementById('memberCardStatus');
    if (!statusEl) return;

    const config = {
        approved: ['check-circle', 'bg-emerald-50', 'border-emerald-200', 'text-emerald-700'],
        pending: ['clock', 'bg-amber-50', 'border-amber-200', 'text-amber-700'],
        rejected: ['x-circle', 'bg-rose-50', 'border-rose-200', 'text-rose-700'],
        ready: ['id-card', 'bg-brand-50', 'border-brand-100', 'text-brand-700']
    }[status] || ['info', 'bg-slate-50', 'border-slate-200', 'text-slate-500'];

    statusEl.className = `inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black ${config.slice(1).join(' ')}`;
    statusEl.innerHTML = `<i data-lucide="${config[0]}" class="w-4 h-4"></i><span>${escapeHTML(message)}</span>`;
    lucide.createIcons();
}

function populateMemberCardForm() {
    if (!currentUserEmail) return;

    const registeredUser = getRegisteredUserByEmail(currentUserEmail) || {};
    const latestApplication = getLatestMemberApplication(currentUserEmail) || {};
    const source = { ...registeredUser, ...latestApplication };

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };

    setValue('memberFullName', source.name || currentUser || '');
    setValue('memberEmail', currentUserEmail || source.email || '');
    setValue('memberStudentId', source.studentId || '');
    setValue('memberPhone', source.phone || '');
    setValue('memberDegreeLevel', source.degreeLevel || '');
    setValue('memberDepartment', source.department || '');
    setValue('memberProgram', source.program || '');
    setValue('memberSemester', source.semester || '');
    setValue('memberMembershipType', source.membershipType || '');
    setValue('memberBranch', source.branch || '');

    const photo = source.profileImage || source.memberPhoto || '';
    if (photo) {
        const preview = document.getElementById('memberPhotoPreview');
        const placeholder = document.getElementById('memberPhotoPlaceholder');
        const form = document.getElementById('memberCardForm');
        if (preview) {
            preview.src = photo;
            preview.classList.remove('hidden');
        }
        if (placeholder) placeholder.classList.add('hidden');
        if (form) form.dataset.memberPhoto = photo;
    }

    const status = latestApplication.status || registeredUser.membershipStatus || 'ready';
    if (status === 'pending') {
        setMemberCardStatus('pending', 'Waiting for admin approval');
    } else if (status === 'approved' || registeredUser.membershipStatus === 'approved') {
        setMemberCardStatus('approved', 'Member card approved');
    } else if (status === 'rejected') {
        setMemberCardStatus('rejected', 'Previous application rejected');
    } else {
        setMemberCardStatus('ready', 'Ready to submit');
    }

    if (typeof syncCustomSelects === 'function') {
        syncCustomSelects();
    }
}

function initMemberCardPage() {
    if (!currentUserEmail) {
        window.location.href = 'login.html?role=user&redirect=member.html';
        return;
    }

    populateMemberCardForm();

    const photoInput = document.getElementById('memberPhotoInput');
    if (photoInput) {
        photoInput.addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file for the member photo.', 'error');
                return;
            }
            if (file.size > 1.5 * 1024 * 1024) {
                showNotification('Image too large. Please select an image under 1.5MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const photoData = loadEvent.target.result;
                const preview = document.getElementById('memberPhotoPreview');
                const placeholder = document.getElementById('memberPhotoPlaceholder');
                const form = document.getElementById('memberCardForm');
                if (preview) {
                    preview.src = photoData;
                    preview.classList.remove('hidden');
                }
                if (placeholder) placeholder.classList.add('hidden');
                if (form) form.dataset.memberPhoto = photoData;
                showNotification('Member photo attached.', 'success');
            };
            reader.readAsDataURL(file);
        });
    }
}

function handleMemberCardSubmit(event) {
    if (event) event.preventDefault();
    if (!currentUserEmail) {
        showNotification('Please sign in before submitting a member card.', 'error');
        return;
    }

    const formData = getMemberCardFormData();
    if (!formData.name || !formData.email || !formData.studentId || !formData.membershipType || !formData.branch || !formData.declarationAccepted) {
        showNotification('Please complete all required member card fields.', 'error');
        return;
    }

    const registeredUser = getRegisteredUserByEmail(currentUserEmail) || {};
    const applications = getMemberApplications();
    const pendingIndex = applications.findIndex(app =>
        (app.email || '').toLowerCase() === currentUserEmail.toLowerCase() && app.status === 'pending'
    );

    const applicationRecord = {
        id: pendingIndex === -1 ? `APP-${Date.now()}` : applications[pendingIndex].id,
        ...formData,
        password: registeredUser.password || '',
        status: 'pending',
        submittedAt: pendingIndex === -1 ? new Date().toISOString() : applications[pendingIndex].submittedAt,
        updatedAt: new Date().toISOString(),
        source: 'member-card'
    };

    if (pendingIndex === -1) {
        applications.push(applicationRecord);
    } else {
        applications[pendingIndex] = {
            ...applications[pendingIndex],
            ...applicationRecord
        };
    }

    saveMemberApplications(applications);
    setMemberCardStatus('pending', 'Waiting for admin approval');
    showNotification('Member card submitted for admin approval.', 'success');
}

function updateLibraryStats() {
    const adminTotalCount = document.getElementById('adminTotalCount');
    const heroBookCount = document.getElementById('heroBookCount');

    if (adminTotalCount) adminTotalCount.textContent = allBooks.length;
    if (heroBookCount) heroBookCount.textContent = allBooks.length;
    updateMemberApprovalBadges();
    updateCustomBookApprovalBadges();
}

function injectWhatsAppButton() {
    if (document.getElementById('whatsappContactButton')) return;

    if (!document.getElementById('whatsappContactStyles')) {
        const style = document.createElement('style');
        style.id = 'whatsappContactStyles';
        style.textContent = `
            .whatsapp-contact-button {
                position: fixed;
                right: 24px;
                bottom: 24px;
                z-index: 80;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 999px;
                border: 1px solid rgba(22, 163, 74, 0.32);
                background: #22c55e;
                color: #fff;
                font: 800 13px/1 "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                text-decoration: none;
                box-shadow: 0 14px 30px rgba(34, 197, 94, 0.34), 0 4px 12px rgba(15, 23, 42, 0.14);
                transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
            }

            .whatsapp-contact-button:hover {
                background: #16a34a;
                transform: translateY(-2px);
                box-shadow: 0 18px 36px rgba(34, 197, 94, 0.42), 0 6px 14px rgba(15, 23, 42, 0.16);
            }

            .whatsapp-contact-button:active {
                transform: translateY(0) scale(0.98);
            }

            .whatsapp-contact-button svg {
                width: 26px;
                height: 26px;
                display: block;
            }

            @media (max-width: 640px) {
                .whatsapp-contact-button {
                    right: 16px;
                    bottom: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    const button = document.createElement('a');
    button.id = 'whatsappContactButton';
    button.className = 'whatsapp-contact-button';
    button.href = 'https://wa.me/8801630802119?text=Hello%20GBLMS%2C%20I%20need%20help.';
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.setAttribute('aria-label', 'Contact GBLMS on WhatsApp');
    button.innerHTML = `
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M16.04 4C9.42 4 4.05 9.34 4.05 15.92c0 2.1.55 4.15 1.6 5.96L4 28l6.28-1.62a12.06 12.06 0 0 0 5.76 1.47C22.66 27.85 28 22.5 28 15.92 28 9.34 22.66 4 16.04 4Zm0 21.8c-1.84 0-3.64-.5-5.2-1.45l-.37-.22-3.72.96.99-3.6-.24-.37a9.78 9.78 0 0 1-1.5-5.2c0-5.44 4.5-9.88 10.04-9.88 5.52 0 10 4.44 10 9.88s-4.48 9.88-10 9.88Zm5.5-7.4c-.3-.15-1.78-.87-2.06-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5a9.06 9.06 0 0 1-1.67-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.07-.8.38-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.23 5.15 4.53.72.3 1.28.49 1.72.62.72.23 1.38.2 1.9.12.58-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
        </svg>
    `;
    document.body.appendChild(button);
}

// ==================== APP BOOTSTRAPPING ====================
function initializeApp() {
    injectLoginModalHTML();
    injectWhatsAppButton();
    loadDownloads();
    initUserSession();   // ← Must run BEFORE fetchCatalogDatabase so currentUser is set

    // Standalone page auto-redirection if already authenticated
    const pageId = getCurrentPageId();
    if ((pageId === 'login' || pageId === 'register') && currentUser) {
        const urlParams = new URLSearchParams(window.location.search);
        const requestedRole = urlParams.get('role') === 'admin' ? 'admin' : 'user';
        if (pageId === 'login' && requestedRole !== currentRole) {
            clearSession();
        } else {
            const redirectPage = urlParams.get('redirect');
            if (redirectPage && redirectPage !== 'login.html' && redirectPage !== 'register.html') {
                window.location.href = redirectPage + getSessionQueryString();
            } else {
                if (currentRole === 'admin') {
                    window.location.href = 'admin.html' + getSessionQueryString();
                } else {
                    window.location.href = 'saved.html' + getSessionQueryString();
                }
            }
            return;
        }
    }

    fetchCatalogDatabase();
    checkPageSecurity();
    updateActiveNavLinkStyle();
    initCustomSelects();

    if (getCurrentPageId() === 'profile') {
        initProfilePage();
    }
    if (getCurrentPageId() === 'member') {
        initMemberCardPage();
    }
    if (getCurrentPageId() === 'dashboard') {
        initAddBookImageLoader();
    }

    // Refresh lucide icons initially
    lucide.createIcons();

    // Run introductory animation
    animateIntro();
}

// ==================== INTRODUCTORY ANIMATIONS ====================
function animateIntro() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });



    const pageId = getCurrentPageId();
    if (pageId === 'home') {
        // Badge pill
        const badge = document.querySelector("#heroSection .inline-flex");
        if (badge) {
            tl.fromTo(badge, { y: 15, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.45 }, "-=0.2");
        }

        // h1 lines cascade
        const h1Spans = document.querySelectorAll("#heroSection h1 .hero-title-line > span");
        if (h1Spans.length) {
            tl.fromTo(h1Spans, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power4.out" }, "-=0.25");
        }

        // Subparagraph
        const subPara = document.querySelector("#heroSection > div p.text-slate-500");
        if (subPara) {
            tl.fromTo(subPara, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, "-=0.3");
        }

        // Buttons
        const buttons = document.querySelectorAll("#heroSection button");
        if (buttons.length) {
            tl.fromTo(buttons, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.4 }, "-=0.2");
        }

        // Trust bar
        const avatars = document.querySelectorAll("#heroAvatars > *");
        if (avatars.length) {
            tl.fromTo(avatars, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.07, duration: 0.3, ease: "back.out(2)" }, "-=0.15");
        }

        // Stat cards — lift in with stagger
        const statCards = document.querySelectorAll("#heroSection .grid.grid-cols-2 > div");
        if (statCards.length) {
            tl.fromTo(statCards, { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, stagger: 0.09, duration: 0.45 }, "-=0.2");
        }

        // Live status bar
        const liveStatusBar = document.querySelector("#heroSection .mt-4.bg-white");
        if (liveStatusBar) {
            tl.fromTo(liveStatusBar, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, "-=0.1");
        }

        // Floating elements pop in after main content
        const floatElements = document.querySelectorAll(".float-el, .float-el-slow, .float-el-reverse");
        if (floatElements.length) {
            tl.fromTo(floatElements,
                { scale: 0.7, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, stagger: 0.15, duration: 0.55, ease: "back.out(1.5)" },
                "-=0.1"
            );
        }
    } else {
        // Subtle fade entrance for sub-page page-sections
        const pageSec = document.querySelector('.page-section');
        if (pageSec) {
            tl.fromTo(pageSec, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2");
        }
    }

    // Boot scroll animations after intro completes
    setTimeout(initScrollAnimations, 800);
}


// ==================== SCROLL ANIMATIONS (GSAP ScrollTrigger) ====================
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // ── Universal section fade-up ──────────────────────────────
    // Every [data-animate="section"] gently rises as it enters viewport
    document.querySelectorAll('[data-animate="section"]').forEach(section => {
        gsap.fromTo(section,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.75,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 88%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // ── Heading reveal: label slides up → h2 sweeps in ────────
    document.querySelectorAll('[data-animate="heading"]').forEach(heading => {
        const spans = heading.querySelectorAll('span');
        const h2 = heading.querySelector('h2');
        const p = heading.querySelector('p');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: heading,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
        if (spans.length) tl.fromTo(spans, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
        if (h2) tl.fromTo(h2, { y: 20, opacity: 0, clipPath: "inset(100% 0% 0% 0%)" }, { y: 0, opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "power3.out" }, "-=0.2");
        if (p) tl.fromTo(p, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.15");
    });

    // ── Card grids: staggered lift-in ─────────────────────────
    document.querySelectorAll('[data-animate="stagger-cards"]').forEach(grid => {
        const cards = grid.children;
        gsap.fromTo(cards,
            { y: 35, opacity: 0, scale: 0.97 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.55,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: grid,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // ── FAQ rows: slide in from left ──────────────────────────
    document.querySelectorAll('[data-animate="stagger-faq"]').forEach(faqList => {
        const rows = faqList.children;
        gsap.fromTo(rows,
            { x: -24, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.45,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: faqList,
                    start: "top 87%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // ── Capacity progress bar: animate width on scroll ────────
    const capacityBar = document.querySelector('.w-\\[78\\%\\]');
    if (capacityBar) {
        gsap.fromTo(capacityBar,
            { width: "0%" },
            {
                width: "78%",
                duration: 1.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: capacityBar,
                    start: "top 88%",
                    toggleActions: "play none none none"
                }
            }
        );
    }

    // ── Heatmap cells: cascade pop-in ────────────────────────
    const heatmapGrid = document.querySelector('[data-animate="section"] .grid.grid-cols-7');
    if (heatmapGrid) {
        const cells = heatmapGrid.querySelectorAll('div');
        gsap.fromTo(cells,
            { scale: 0, opacity: 0, borderRadius: "50%" },
            {
                scale: 1,
                opacity: 1,
                borderRadius: "6px",
                duration: 0.35,
                stagger: { each: 0.025, from: "start" },
                ease: "back.out(1.4)",
                scrollTrigger: {
                    trigger: heatmapGrid,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            }
        );
    }

    // ── SVG sparklines: draw-on path animation ────────────────
    document.querySelectorAll('[data-animate="stagger-cards"] svg path').forEach((path) => {
        const length = path.getTotalLength ? path.getTotalLength() : 200;
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: path.closest('[data-animate="stagger-cards"]'),
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
    });

    // ── Seat node circles: pop-in with stagger ────────────────
    document.querySelectorAll('.rounded-2xl.border.border-slate-100').forEach(seatRow => {
        const dots = seatRow.querySelectorAll('span');
        if (dots.length) {
            gsap.fromTo(dots,
                { scale: 0, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.3,
                    stagger: 0.07,
                    ease: "back.out(2)",
                    scrollTrigger: {
                        trigger: seatRow,
                        start: "top 90%",
                        toggleActions: "play none none none"
                    }
                }
            );
        }
    });

    // ── Hero stat counters: count up on load (already visible) ──
    document.querySelectorAll('#heroSection .grid > div').forEach(card => {
        const numEl = card.querySelector('span.text-3xl');
        if (!numEl) return;
        const rawText = numEl.textContent.trim();
        const numMatch = rawText.match(/[\d.]+/);
        if (!numMatch) return;
        const finalVal = parseFloat(numMatch[0]);
        const suffix = rawText.replace(numMatch[0], '');
        const obj = { val: 0 };
        gsap.to(obj, {
            val: finalVal,
            duration: 1.6,
            ease: "power2.out",
            delay: 0.8,
            onUpdate: () => {
                const display = finalVal % 1 !== 0 ? obj.val.toFixed(1) : Math.floor(obj.val);
                numEl.textContent = display + suffix;
            }
        });
    });
}


// ==================== USER AUTH SYSTEM ====================
function initUserSession() {
    // 1. Try restoring from URL query parameters (cross-folder navigation fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const paramRole = urlParams.get('sRole');
    const paramUser = urlParams.get('sUser');
    const paramEmail = urlParams.get('sEmail');

    if (paramRole && paramUser && paramEmail) {
        localStorage.setItem('currentRole', paramRole);
        localStorage.setItem('currentUser', paramUser);
        localStorage.setItem('currentUserEmail', paramEmail);
        try {
            window.name = JSON.stringify({ currentRole: paramRole, currentUser: paramUser, currentUserEmail: paramEmail });
        } catch (e) { }
    }

    let savedRole = localStorage.getItem('currentRole');
    let savedUser = localStorage.getItem('currentUser');
    let savedEmail = localStorage.getItem('currentUserEmail');

    // Fallback to window.name for file:// protocol origin isolation
    if (!savedRole || !savedUser) {
        try {
            if (window.name && window.name.trim().startsWith('{')) {
                const session = JSON.parse(window.name);
                if (session.currentRole && session.currentUser) {
                    savedRole = session.currentRole;
                    savedUser = session.currentUser;
                    savedEmail = session.currentUserEmail;
                    // Restore back to this origin's local storage
                    localStorage.setItem('currentRole', savedRole);
                    localStorage.setItem('currentUser', savedUser);
                    localStorage.setItem('currentUserEmail', savedEmail);
                }
            }
        } catch (e) {
            console.warn("Failed to restore window.name fallback session:", e);
        }
    }

    if (savedRole && savedUser) {
        currentRole = savedRole;
        currentUser = savedUser;
        currentUserEmail = savedEmail;
        updateSessionUI();
    }
}

function saveSession(role, name, email) {
    currentRole = role;
    currentUser = name;
    currentUserEmail = email;

    localStorage.setItem('currentRole', role);
    localStorage.setItem('currentUser', name);
    localStorage.setItem('currentUserEmail', email);

    // Save to window.name for file:// protocol cross-folder sharing fallback
    try {
        window.name = JSON.stringify({ currentRole: role, currentUser: name, currentUserEmail: email });
    } catch (e) {
        console.warn("Failed to write session state to window.name:", e);
    }
}

function clearSession() {
    currentRole = null;
    currentUser = null;
    currentUserEmail = null;

    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserEmail');

    try {
        window.name = '';
    } catch (e) {
        console.warn("Failed to clear session state from window.name:", e);
    }
}

function injectLoginModalHTML() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;

    modal.innerHTML = `
        <div class="modal-card w-full max-w-[480px] bg-white border border-slate-100 rounded-3xl p-8 relative shadow-[0_25px_50px_-12px_rgba(30,58,138,0.15)] overflow-hidden">
            <!-- Close Button -->
            <button onclick="closeLoginModal()"
                class="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-150 flex items-center justify-center transition-colors duration-250">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Role Selection Header -->
            <div class="text-center mt-3 mb-8">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 border border-brand-100/50">
                    <i data-lucide="key-round" class="w-6 h-6"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Select Role</h3>
                <p class="text-slate-400 text-xs font-semibold mt-1">Choose your role to access the portal</p>
            </div>

            <!-- Options Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- Admin Card -->
                <div onclick="selectRole('admin')" 
                    class="relative border border-slate-150 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer bg-white hover:bg-brand-50/10 shadow-sm transition-colors duration-200 group">
                    
                    <!-- Icon badge -->
                    <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100 group-hover:bg-brand-100/50 transition-colors duration-200">
                        <i data-lucide="shield" class="w-6 h-6"></i>
                    </div>
                    <h4 class="text-base font-extrabold text-slate-800 mb-1 group-hover:text-brand-600 transition-colors">Admin Portal</h4>
                    <p class="text-[11px] text-slate-400 font-semibold leading-relaxed">Manage books, catalog data & systems</p>
                </div>

                <!-- User Card -->
                <div onclick="selectRole('user')" 
                    class="relative border border-slate-150 hover:border-accent-500 rounded-2xl p-6 text-center cursor-pointer bg-white hover:bg-accent-50/10 shadow-sm transition-colors duration-200 group">
                    
                    <!-- Icon badge -->
                    <div class="w-14 h-14 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 group-hover:bg-accent-100/50 transition-colors duration-200">
                        <i data-lucide="user" class="w-6 h-6"></i>
                    </div>
                    <h4 class="text-base font-extrabold text-slate-800 mb-1 group-hover:text-accent-600 transition-colors">User Portal</h4>
                    <p class="text-[11px] text-slate-400 font-semibold leading-relaxed">Download and read academic resources</p>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Dialog selectors configurations
function showLoginModal() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // If we're already on login.html or register.html, do nothing to prevent cycles
    if (currentPage === 'login.html' || currentPage === 'register.html') return;

    const modal = document.getElementById('loginModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Explicitly process newly injected Lucide icons upon modal activation
    if (window.lucide) {
        lucide.createIcons();
    }

    const card = modal.querySelector('.modal-card');
    if (card) {
        gsap.fromTo(card,
            { scale: 0.85, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.5)" }
        );
    }
}

function selectRole(role) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    closeLoginModal();
    // Redirect to login.html with role and redirect parameters
    setTimeout(() => {
        window.location.href = `login.html?role=${role}&redirect=${encodeURIComponent(currentPage)}`;
    }, 250);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    const card = modal.querySelector('.modal-card');
    if (!card) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        return;
    }
    gsap.to(card, {
        scale: 0.85,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
}

function toggleAuthView(view) {
    const loginView = document.getElementById('loginFormView');
    const registerView = document.getElementById('registerFormView');
    if (!loginView || !registerView) return;

    if (view === 'login') {
        loginView.classList.remove('hidden');
        registerView.classList.add('hidden');
    } else {
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    }
    if (window.lucide) {
        lucide.createIcons();
    }
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    const urlParams = new URLSearchParams(window.location.search);
    const requestedRole = urlParams.get('role') === 'admin' ? 'admin' : 'user';
    const redirectPage = urlParams.get('redirect');
    const isAdminCredentials = email === 'admin@gmail.com' && pass === 'admin1234';

    if (requestedRole === 'admin' && !isAdminCredentials) {
        showNotification("Admin Login Only: use an administrator account for this page.", "error");
        return;
    }

    if (requestedRole === 'user' && email === 'admin@gmail.com') {
        showNotification("Reader Login Only: admin accounts must use the admin sign in page.", "error");
        return;
    }

    if (isAdminCredentials) {
        saveSession('admin', 'Admin Manager', 'admin@gmail.com');
        updateSessionUI();
        closeLoginModal();
        showNotification("Portal Authentication Verified: Welcome, Admin Manager", "success");

        if (redirectPage && redirectPage !== 'login.html' && redirectPage !== 'register.html') {
            setTimeout(() => {
                window.location.href = redirectPage + getSessionQueryString();
            }, 1000);
        } else {
            setTimeout(() => {
                navigateTo('admin');
            }, 1000);
        }
        return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = registeredUsers.find(u => u.email === email && u.password === pass);
    if (user) {
        saveSession('user', user.name, user.email);
        updateSessionUI();
        closeLoginModal();
        showNotification(`Portal Authentication Verified: Welcome, ${user.name}`, "success");

        if (redirectPage && redirectPage !== 'login.html' && redirectPage !== 'register.html') {
            setTimeout(() => {
                window.location.href = redirectPage + getSessionQueryString();
            }, 1000);
        } else {
            setTimeout(() => {
                navigateTo('saved');
            }, 1000);
        }
        return;
    }

    const latestApplication = getLatestMemberApplication(email);
    if (latestApplication && latestApplication.password === pass) {
        if (latestApplication.status === 'pending') {
            showNotification("Membership Pending: an admin must approve your application before sign in.", "info");
            return;
        }
        if (latestApplication.status === 'rejected') {
            showNotification("Membership Not Approved: please contact the library office.", "error");
            return;
        }
    }

    showNotification("Authentication Failed: Invalid email or password.", "error");
}

function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const pass = document.getElementById('registerPassword').value;
    const confirmPassEl = document.getElementById('registerConfirmPassword');
    
    if (confirmPassEl && pass !== confirmPassEl.value) {
        showNotification("Registration Failed: Passwords do not match.", "error");
        return;
    }

    if (email === 'admin@gmail.com') {
        showNotification("Registration Blocked: admin@gmail.com is reserved.", "error");
        return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const exists = registeredUsers.some(u => u.email === email);
    if (exists) {
        showNotification("Registration Failed: Email already registered.", "error");
        return;
    }

    registeredUsers.push({
        name,
        email,
        password: pass,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    // Clear registration fields
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    if (confirmPassEl) confirmPassEl.value = '';

    showNotification("Account Created: you can sign in now.", "success");

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPage = urlParams.get('redirect');
    const redirectQuery = redirectPage ? `?redirect=${encodeURIComponent(redirectPage)}` : '';
    
    if (getCurrentPageId() === 'register') {
        setTimeout(() => {
            window.location.href = `login.html` + redirectQuery;
        }, 1200);
    } else {
        toggleAuthView('login');
    }
}

function logout() {
    clearSession();
    updateSessionUI();
    navigateTo('home');
    showNotification("Session closed successfully.", "info");
}

function ensureMemberCardDropdownLink() {
    const menu = document.getElementById('userDropdownMenu');
    const profileLink = document.getElementById('dropdownProfileLink');
    if (!menu || !profileLink || document.getElementById('dropdownMemberCardLink')) return;

    const link = document.createElement('a');
    link.href = '#';
    link.id = 'dropdownMemberCardLink';
    link.className = 'flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors duration-150 hidden';
    link.setAttribute('onclick', "navigateTo('member'); return false;");
    link.innerHTML = `
        <i data-lucide="id-card" class="w-4 h-4 text-slate-400"></i>
        <span>Add Member Card</span>
    `;
    profileLink.insertAdjacentElement('afterend', link);
}

function updateHeroMembershipButton() {
    const button = document.getElementById('heroMembershipBtn');
    if (!button) return;

    const label = button.querySelector('[data-hero-membership-label]');
    const isAdmin = currentRole === 'admin';

    button.setAttribute('onclick', isAdmin ? "navigateToMemberApprovals(); return false;" : "navigateTo('member'); return false;");
    button.setAttribute('aria-label', isAdmin ? 'Open member approvals' : 'Open LMS membership');
    if (label) label.textContent = isAdmin ? 'Member Approval' : 'LMS Membership';
}

function updateSessionUI() {
    ensureMemberCardDropdownLink();

    const loginBtn = document.getElementById('loginBtn');
    const heroAccessConsoleBtn = document.getElementById('heroAccessConsoleBtn');
    const navUser = document.getElementById('navUser');
    const navUserName = document.getElementById('navUserName');
    const navUserRole = document.getElementById('navUserRole');
    const userAvatar = document.getElementById('userAvatar');

    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserRole = document.getElementById('dropdownUserRole');
    const dropdownDashboardLink = document.getElementById('dropdownDashboardLink');
    const dropdownAdminLink = document.getElementById('dropdownAdminLink');
    const dropdownSavedLink = document.getElementById('dropdownSavedLink');
    const dropdownMemberCardLink = document.getElementById('dropdownMemberCardLink');

    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');
    const footerLibraryLink = document.getElementById('footerLibraryLink');

    const mobileDashboardLink = document.getElementById('mobileDashboardLink');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    const savedNavLink = document.getElementById('savedNavLink');

    updateHeroMembershipButton();

    if (currentUser) {
        document.body.classList.add('session-authenticated');
        if (loginBtn) loginBtn.classList.add('hidden');
        if (heroAccessConsoleBtn) heroAccessConsoleBtn.classList.add('hidden');
        if (navUser) { navUser.classList.remove('hidden'); navUser.classList.add('flex'); }

        if (navUserName) navUserName.textContent = currentUser;
        if (navUserRole) navUserRole.textContent = currentRole.toUpperCase();
        if (userAvatar) {
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = registeredUsers.find(u => u.email === currentUserEmail);
            const avatarImage = currentUserEmail === 'admin@gmail.com'
                ? localStorage.getItem('adminAvatar')
                : user?.profileImage;
            if (avatarImage) {
                userAvatar.innerHTML = `<img src="${avatarImage}" class="w-full h-full object-cover rounded-full" style="max-width: 100%; max-height: 100%;" />`;
            } else {
                userAvatar.innerHTML = '';
                userAvatar.textContent = currentUser.charAt(0);
            }
        }
        if (dropdownUserName) dropdownUserName.textContent = currentUser;
        if (dropdownUserRole) dropdownUserRole.textContent = currentRole.toUpperCase();

        if (savedNavLink) savedNavLink.classList.remove('hidden');
        if (dropdownSavedLink) dropdownSavedLink.classList.remove('hidden');

        if (currentRole === 'admin') {
            if (adminLink) adminLink.classList.remove('hidden');
            if (mobileAdminLink) mobileAdminLink.classList.remove('hidden');
            if (dashboardLink) dashboardLink.classList.add('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
            if (footerLibraryLink) footerLibraryLink.classList.remove('hidden');
            if (dropdownDashboardLink) dropdownDashboardLink.classList.remove('hidden');
            if (dropdownAdminLink) dropdownAdminLink.classList.remove('hidden');
            if (dropdownMemberCardLink) dropdownMemberCardLink.classList.add('hidden');
        } else {
            if (dashboardLink) dashboardLink.classList.remove('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
            if (footerLibraryLink) footerLibraryLink.classList.remove('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
            if (dropdownDashboardLink) dropdownDashboardLink.classList.remove('hidden');
            if (dropdownAdminLink) dropdownAdminLink.classList.add('hidden');
            if (dropdownMemberCardLink) dropdownMemberCardLink.classList.remove('hidden');
        }
    } else {
        document.body.classList.remove('session-authenticated');
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (heroAccessConsoleBtn) heroAccessConsoleBtn.classList.remove('hidden');
        if (navUser) navUser.classList.add('hidden');
        if (savedNavLink) savedNavLink.classList.add('hidden');
        if (dashboardLink) dashboardLink.classList.add('hidden');
        if (mobileDashboardLink) mobileDashboardLink.classList.add('hidden');
        if (footerLibraryLink) footerLibraryLink.classList.add('hidden');
        if (adminLink) adminLink.classList.add('hidden');
        if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
        if (dropdownSavedLink) dropdownSavedLink.classList.add('hidden');
        if (dropdownMemberCardLink) dropdownMemberCardLink.classList.add('hidden');
    }

    // NOTE: Do NOT call lucide.createIcons() here — it destroys and
    // rebuilds every SVG icon on the page, causing the dropdown chevron
    // and other header icons to momentarily vanish (flicker).
    // Icons are already initialised in initializeApp().
}

// ==================== PROFILE PAGE CONTROLLER ====================
function initProfilePage() {
    if (!currentUserEmail) {
        // Show login modal instead of redirecting — keep user on profile.html
        setTimeout(() => showLoginModal(), 150);
        return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    let user = registeredUsers.find(u => u.email === currentUserEmail);

    // If it's the admin logging in, they won't be in registeredUsers. Let's mock a user object for admin.
    if (currentUserEmail === 'admin@gmail.com') {
        user = {
            name: currentUser || 'Admin Manager',
            email: 'admin@gmail.com',
            phone: localStorage.getItem('adminPhone') || '',
            department: localStorage.getItem('adminDept') || 'Administration',
            studentId: localStorage.getItem('adminId') || 'ADM-001',
            bio: localStorage.getItem('adminBio') || 'System administrator for GBLMS database controls.',
            profileImage: localStorage.getItem('adminAvatar') || ''
        };
    }

    if (!user) return;

    // Populating UI Elements
    const pName = document.getElementById('profileName');
    const pEmail = document.getElementById('profileEmail');
    const pPhone = document.getElementById('profilePhone');
    const pDept = document.getElementById('profileDept');
    const pId = document.getElementById('profileId');
    const pBio = document.getElementById('profileBio');
    const pAvatarPreview = document.getElementById('profileAvatarPreview');
    const pAvatarText = document.getElementById('profileAvatarText');
    const pNameHeader = document.getElementById('profileNameHeader');
    const pRoleHeader = document.getElementById('profileRoleHeader');

    if (pName) pName.value = user.name || '';
    if (pEmail) pEmail.value = user.email || '';
    if (pPhone) pPhone.value = user.phone || '';
    if (pDept) pDept.value = user.department || '';
    if (pId) pId.value = user.studentId || '';
    if (pBio) pBio.value = user.bio || '';
    if (pNameHeader) pNameHeader.textContent = user.name || currentUser;
    if (pRoleHeader) pRoleHeader.textContent = currentRole.toUpperCase();

    // Render large profile avatar
    if (pAvatarPreview) {
        if (user.profileImage) {
            pAvatarPreview.src = user.profileImage;
            pAvatarPreview.classList.remove('hidden');
            if (pAvatarText) pAvatarText.classList.add('hidden');
        } else {
            pAvatarPreview.classList.add('hidden');
            if (pAvatarText) {
                pAvatarText.textContent = (user.name || currentUser).charAt(0).toUpperCase();
                pAvatarText.classList.remove('hidden');
            }
        }
    }

    // Set up file upload listener
    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            // Enforce file size limit (e.g. 1.5MB to fit in localStorage safely)
            if (file.size > 1.5 * 1024 * 1024) {
                showNotification("Image too large. Please select an image under 1.5MB.", "error");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64Data = event.target.result;
                if (pAvatarPreview) {
                    pAvatarPreview.src = base64Data;
                    pAvatarPreview.classList.remove('hidden');
                    if (pAvatarText) pAvatarText.classList.add('hidden');
                }
                // Temporarily store base64 in dataset to save on form submit
                document.getElementById('profileCard').dataset.tempAvatar = base64Data;
                showNotification("Image uploaded successfully. Click Save to persist.", "success");
            };
            reader.readAsDataURL(file);
        });
    }
}

function saveUserProfile(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const department = document.getElementById('profileDept').value.trim();
    const studentId = document.getElementById('profileId').value.trim();
    const bio = document.getElementById('profileBio').value.trim();
    const tempAvatar = document.getElementById('profileCard')?.dataset.tempAvatar;

    if (!name) {
        showNotification("Name field cannot be empty.", "error");
        return;
    }

    if (currentUserEmail === 'admin@gmail.com') {
        localStorage.setItem('adminPhone', phone);
        localStorage.setItem('adminDept', department);
        localStorage.setItem('adminId', studentId);
        localStorage.setItem('adminBio', bio);
        if (tempAvatar) {
            localStorage.setItem('adminAvatar', tempAvatar);
        }
        // Name update for admin
        currentUser = name;
        saveSession('admin', name, 'admin@gmail.com');
    } else {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = registeredUsers.findIndex(u => u.email === currentUserEmail);
        if (userIndex !== -1) {
            registeredUsers[userIndex].name = name;
            registeredUsers[userIndex].phone = phone;
            registeredUsers[userIndex].department = department;
            registeredUsers[userIndex].studentId = studentId;
            registeredUsers[userIndex].bio = bio;
            if (tempAvatar) {
                registeredUsers[userIndex].profileImage = tempAvatar;
            }
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            currentUser = name;
            saveSession(currentRole, name, currentUserEmail);
        }
    }

    // Refresh layout display
    const pNameHeader = document.getElementById('profileNameHeader');
    if (pNameHeader) pNameHeader.textContent = name;

    updateSessionUI();
    if (tempAvatar) {
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.innerHTML = `<img src="${tempAvatar}" class="w-full h-full object-cover rounded-full" style="max-width: 100%; max-height: 100%;" />`;
        }
        const profileCard = document.getElementById('profileCard');
        if (profileCard) delete profileCard.dataset.tempAvatar;
    }
    localStorage.setItem('pendingPortalToast', JSON.stringify({
        message: 'Profile updated successfully.',
        type: 'success'
    }));
    navigateTo('home');
}

function toggleUserDropdown(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const menu = document.getElementById('userDropdownMenu');
    const chevron = document.getElementById('dropdownChevron');
    if (!menu) return;

    const isHidden = menu.classList.contains('hidden');

    if (isHidden) {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        gsap.fromTo(menu,
            { scale: 0.95, opacity: 0, y: -10 },
            { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
        );
        if (chevron) gsap.to(chevron, { rotation: 180, duration: 0.2 });
    } else {
        closeUserDropdown();
    }
}

function closeUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    const chevron = document.getElementById('dropdownChevron');
    if (!menu || menu.classList.contains('hidden')) return;

    gsap.to(menu, {
        scale: 0.95,
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
            menu.classList.add('hidden');
            menu.classList.remove('flex');
        }
    });
    if (chevron) gsap.to(chevron, { rotation: 0, duration: 0.15 });
}

function toggleActionDropdown(event, bookId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const existingPortal = document.getElementById('action-dropdown-portal');
    const isAlreadyOpen = existingPortal && existingPortal.dataset.bookId === String(bookId);

    // Close any existing portal dropdown
    closeAllActionDropdowns(true);

    if (isAlreadyOpen) return;

    // Find the trigger button
    const triggerBtn = event.currentTarget;
    const rect = triggerBtn.getBoundingClientRect();

    // Create portal dropdown on body
    const portal = document.createElement('div');
    portal.id = 'action-dropdown-portal';
    portal.dataset.bookId = String(bookId);
    portal.className = 'fixed w-40 rounded-xl bg-white border border-slate-200 shadow-2xl py-1.5 select-none';
    portal.style.zIndex = '9999';
    portal.style.top = `${rect.bottom + 6}px`;
    portal.style.left = `${rect.right - 160}px`;

    portal.innerHTML = `
        <button onclick="event.stopPropagation(); closeAllActionDropdowns(true); editBookRecord('${bookId}');" class="w-full px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 cursor-pointer transition-colors duration-150">
            <i data-lucide="edit-3" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Edit Record</span>
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button onclick="event.stopPropagation(); closeAllActionDropdowns(true); deleteBookRecord('${bookId}');" class="w-full px-3.5 py-2.5 text-left text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer transition-colors duration-150">
            <i data-lucide="trash" class="w-3.5 h-3.5 text-red-400"></i>
            <span>Delete Record</span>
        </button>
    `;

    portal.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(portal);
    lucide.createIcons();

    gsap.fromTo(portal,
        { scale: 0.95, opacity: 0, y: -4 },
        { scale: 1, opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }
    );

    requestAnimationFrame(() => {
        const portalRect = portal.getBoundingClientRect();
        if (portalRect.bottom > window.innerHeight - 10) {
            portal.style.top = `${rect.top - portalRect.height - 6}px`;
        }
        if (portalRect.left < 10) {
            portal.style.left = `${rect.left}px`;
        }
    });
}

function closeAllActionDropdowns(instant = false) {
    const portal = document.getElementById('action-dropdown-portal');
    if (!portal) return;

    if (instant) {
        portal.remove();
    } else {
        gsap.to(portal, {
            scale: 0.95,
            opacity: 0,
            y: -4,
            duration: 0.12,
            ease: "power2.in",
            onComplete: () => portal.remove()
        });
    }
}

window.addEventListener('click', () => {
    closeUserDropdown();
    closeAllActionDropdowns(false);
});

// ==================== CORE ROUTING SYSTEM ====================
function getCurrentPageId() {
    const path = window.location.pathname;
    if (path.endsWith('catalog.html')) return 'catalog';
    if (path.endsWith('dashboard.html')) return 'dashboard';
    if (path.endsWith('admin.html')) return 'admin';
    if (path.endsWith('saved.html')) return 'saved';
    if (path.endsWith('profile.html')) return 'profile';
    if (path.endsWith('member.html')) return 'member';
    if (path.endsWith('login.html')) return 'login';
    if (path.endsWith('register.html')) return 'register';
    return 'home';
}

function checkPageSecurity() {
    const pageId = getCurrentPageId();
    const homeRedirect = 'index.html';

    if (pageId === 'admin' && currentRole !== 'admin') {
        window.location.href = homeRedirect;
        localStorage.setItem('securityAlert', 'Admin privileges required.');
    }

    if (pageId === 'member' && !currentUser) {
        window.location.href = 'login.html?role=user&redirect=member.html';
        return;
    }

    const pendingAlert = localStorage.getItem('securityAlert');
    if (pendingAlert) {
        setTimeout(() => {
            showNotification(pendingAlert, 'error');
            localStorage.removeItem('securityAlert');
        }, 300);
    }

    const pendingToast = localStorage.getItem('pendingPortalToast');
    if (pendingToast) {
        try {
            const toast = JSON.parse(pendingToast);
            setTimeout(() => {
                showNotification(toast.message || 'Action completed successfully.', toast.type || 'success');
                localStorage.removeItem('pendingPortalToast');
            }, 300);
        } catch (error) {
            localStorage.removeItem('pendingPortalToast');
        }
    }
}

function updateActiveNavLinkStyle() {
    const pageId = getCurrentPageId();
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-section') === pageId) {
            link.classList.add('active', 'text-brand-600');
            link.classList.remove('text-slate-655', 'text-slate-650');
        } else {
            link.classList.remove('active', 'text-brand-600');
            link.classList.add('text-slate-655');
        }
    });

    document.querySelectorAll('#mobileDrawer a').forEach(link => {
        if (link.getAttribute('data-section') === pageId) {
            link.classList.add('text-brand-600');
            link.classList.remove('text-slate-800');
        } else {
            link.classList.remove('text-brand-600');
            link.classList.add('text-slate-800');
        }
    });
}

function checkPendingFilters() {
    const pending = localStorage.getItem('pendingCategoryFilter');
    if (pending && getCurrentPageId() === 'catalog') {
        const filter = document.getElementById('categoryFilter');
        if (filter) {
            filter.value = pending;
            if (typeof syncCustomSelects === 'function') syncCustomSelects();
            filterBooks();
        }
        localStorage.removeItem('pendingCategoryFilter');
    }

    const pendingAdminTab = localStorage.getItem('pendingAdminTab');
    if (pendingAdminTab && getCurrentPageId() === 'admin') {
        const tabBtn = document.getElementById(`${pendingAdminTab}TabBtn`);
        if (tabBtn && typeof switchAdminTab === 'function') {
            switchAdminTab(pendingAdminTab, tabBtn);
        }
        localStorage.removeItem('pendingAdminTab');
    }
}

function getSessionQueryString() {
    if (currentUser && currentRole && currentUserEmail) {
        return `?sRole=${encodeURIComponent(currentRole)}&sUser=${encodeURIComponent(currentUser)}&sEmail=${encodeURIComponent(currentUserEmail)}`;
    }
    return '';
}

function navigateTo(sectionId) {
    const currentPage = getCurrentPageId();
    if (sectionId === currentPage) return;

    const drawer = document.getElementById('mobileDrawer');
    if (drawer && !drawer.classList.contains('hidden')) {
        toggleMobileMenu();
    }

    let targetPage = 'index.html';
    if (sectionId === 'catalog') targetPage = 'catalog.html';
    else if (sectionId === 'dashboard') targetPage = 'dashboard.html';
    else if (sectionId === 'admin') targetPage = 'admin.html';
    else if (sectionId === 'saved') targetPage = 'saved.html';
    else if (sectionId === 'profile') targetPage = 'profile.html';
    else if (sectionId === 'member') targetPage = 'member.html';

    const queryString = getSessionQueryString();
    window.location.href = targetPage + queryString;
}

function navigateToMemberApprovals() {
    if (currentRole !== 'admin') {
        navigateTo('member');
        return;
    }

    localStorage.setItem('pendingAdminTab', 'memberApprovals');

    if (getCurrentPageId() === 'admin') {
        checkPendingFilters();
        return;
    }

    navigateTo('admin');
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;

    drawer.classList.toggle('hidden');
    drawer.classList.toggle('flex');

    const hamburger = document.getElementById('hamburger');
    const menuIcon = hamburger ? hamburger.querySelector('i') : null;
    if (menuIcon) {
        const isOpen = drawer.classList.contains('flex');

        gsap.fromTo(menuIcon,
            { rotation: 0, scale: 0.8 },
            {
                rotation: isOpen ? 180 : 0,
                scale: 1,
                duration: 0.3,
                ease: "back.out(1.8)",
                onStart: () => {
                    menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
                    lucide.createIcons();
                }
            }
        );
    }

    if (drawer.classList.contains('flex')) {
        gsap.fromTo(drawer.querySelectorAll('a'),
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power3.out" }
        );
    }
}

function navigateToCatalogWithFilter(categoryName) {
    localStorage.setItem('pendingCategoryFilter', categoryName);
    navigateTo('catalog');
}

// ==================== CURATED MASTERWORKS — CUSTOM COVERFLOW ====================
let currentCoverflowIndex = 0;
let coverflowBooks = [];
let coverflowInterval = null;
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false;
let startX = 0;
let dragOffset = 0;

function renderFeaturedSlider() {
    const wrapper = document.getElementById('masterworksWrapper');
    const indicators = document.getElementById('coverflowIndicators');
    const carousel = document.querySelector('.coverflow-carousel');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (indicators) indicators.innerHTML = '';

    coverflowBooks = allBooks.slice(0, Math.min(allBooks.length, 8));
    currentCoverflowIndex = Math.floor(coverflowBooks.length / 2);

    coverflowBooks.forEach((book, index) => {
        const card = document.createElement('div');
        card.className = 'coverflow-book';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="coverflow-book-cover">
                <!-- 1. Pulsing Loading Skeleton -->
                <div class="skeleton-loader absolute inset-0 bg-slate-300 animate-pulse flex items-center justify-center">
                    <i data-lucide="book-open" class="w-8 h-8 text-slate-400 animate-bounce"></i>
                </div>

                <!-- 2. Real Image -->
                <img src="${book.cover}" alt="${book.title}" class="opacity-0 transition-opacity duration-500"
                     onload="handleImageLoad(this)"
                     onerror="handleImageError(this)">

                <!-- 3. Fallback Cover Container -->
                <div class="fallback-cover absolute inset-0 hidden flex flex-col justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 text-center select-none rounded-2xl">
                    <div class="flex-grow flex flex-col items-center justify-center gap-2">
                        <i data-lucide="book-open" class="w-8 h-8 text-slate-400"></i>
                        <div class="text-[11px] font-black text-slate-700 leading-snug px-1 line-clamp-3">${book.title}</div>
                        <div class="text-[9px] font-bold text-slate-400 truncate w-full">by ${book.author}</div>
                    </div>
                    <div class="text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mt-2">${book.category}</div>
                </div>

                <div class="mw-card-overlay"></div>
                <div class="mw-card-meta-row">
                    <span class="mw-card-badge">${book.category}</span>
                    <div class="mw-card-rating">★ ${book.rating || '4.5'}</div>
                </div>
                <div class="coverflow-book-info">
                    <div class="coverflow-book-title">${book.title}</div>
                    <div class="coverflow-book-author">by ${book.author}</div>
                </div>
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (Math.abs(dragOffset) > 10) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            openBookModal(book.id);
        });
        wrapper.appendChild(card);

        // Create indicator dot
        if (indicators) {
            const dot = document.createElement('div');
            dot.className = `coverflow-indicator ${index === currentCoverflowIndex ? 'active' : ''}`;
            dot.onclick = () => goToCoverflowSlide(index);
            indicators.appendChild(dot);
        }
    });

    // Position all cards
    updateCoverflowPosition();

    // Start auto-play
    startCoverflowSlideshow();

    // Touch support
    if (carousel) {
        addCoverflowTouchSupport(carousel);
        carousel.addEventListener('mouseenter', stopCoverflowSlideshow);
        carousel.addEventListener('mouseleave', startCoverflowSlideshow);
    }

    // Keyboard support
    document.removeEventListener('keydown', handleCoverflowKeyboard);
    document.addEventListener('keydown', handleCoverflowKeyboard);

    lucide.createIcons();
}

function renderFeaturedList() {
    const grid = document.getElementById('featuredBooksGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const featured = allBooks
        .filter(b => b.rating && Number(b.rating) >= 4.5)
        .slice(0, 8);

    featured.forEach(book => {
        const card = createBookCard(book);
        grid.appendChild(card);
    });

    lucide.createIcons();
}

function updateCoverflowPosition() {
    const books = document.querySelectorAll('.coverflow-book');
    const indicators = document.querySelectorAll('.coverflow-indicator');
    const totalBooks = coverflowBooks.length;

    books.forEach((book, index) => {
        book.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next', 'hidden');

        let relativeIndex = index - currentCoverflowIndex;

        // Handle circular wrapping
        if (relativeIndex < -Math.floor(totalBooks / 2)) {
            relativeIndex += totalBooks;
        } else if (relativeIndex > Math.floor(totalBooks / 2)) {
            relativeIndex -= totalBooks;
        }

        switch (relativeIndex) {
            case 0: book.classList.add('active'); break;
            case -1: book.classList.add('prev'); break;
            case 1: book.classList.add('next'); break;
            case -2: book.classList.add('far-prev'); break;
            case 2: book.classList.add('far-next'); break;
            default: book.classList.add('hidden'); break;
        }
    });

    indicators.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCoverflowIndex);
    });
}

function nextCoverflow() {
    currentCoverflowIndex = (currentCoverflowIndex + 1) % coverflowBooks.length;
    updateCoverflowPosition();
}

function prevCoverflow() {
    currentCoverflowIndex = (currentCoverflowIndex - 1 + coverflowBooks.length) % coverflowBooks.length;
    updateCoverflowPosition();
}

function goToCoverflowSlide(index) {
    currentCoverflowIndex = index;
    updateCoverflowPosition();
    stopCoverflowSlideshow();
    startCoverflowSlideshow();
}

function handleCoverflowKeyboard(event) {
    if (currentSection !== 'home') return;
    if (event.key === 'ArrowLeft') { prevCoverflow(); stopCoverflowSlideshow(); startCoverflowSlideshow(); }
    if (event.key === 'ArrowRight') { nextCoverflow(); stopCoverflowSlideshow(); startCoverflowSlideshow(); }
}

function startCoverflowSlideshow() {
    if (coverflowInterval) clearInterval(coverflowInterval);
    coverflowInterval = setInterval(() => nextCoverflow(), 4000);
}

function stopCoverflowSlideshow() {
    if (coverflowInterval) { clearInterval(coverflowInterval); coverflowInterval = null; }
}

function addCoverflowTouchSupport(element) {
    element.style.userSelect = 'none';
    element.style.touchAction = 'pan-y';
    element.style.cursor = 'grab';

    // Prevent default browser dragging on images
    element.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    const onPointerDown = (e) => {
        isDragging = true;
        startX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        dragOffset = 0;
        element.style.cursor = 'grabbing';
        stopCoverflowSlideshow();

        // Temporarily suspend transition animations for absolute immediate tracking
        document.querySelectorAll('.coverflow-book').forEach(book => {
            book.style.transition = 'none';
        });
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        dragOffset = currentX - startX;

        const wrapper = document.getElementById('masterworksWrapper');
        if (wrapper) {
            // Apply slight horizontal shifting to parent stage
            wrapper.style.transform = `translateX(${dragOffset * 0.4}px)`;

            // Dynamically rotate active and peripheral book cards
            const activeBook = wrapper.querySelector('.coverflow-book.active');
            const prevBook = wrapper.querySelector('.coverflow-book.prev');
            const nextBook = wrapper.querySelector('.coverflow-book.next');

            if (activeBook) {
                activeBook.style.transform = `translateX(-50%) translateZ(50px) rotateY(${dragOffset * 0.08}deg) scale(1.15)`;
            }
            if (prevBook) {
                prevBook.style.transform = `translateX(calc(-50% - 200px)) translateZ(-120px) rotateY(${28 + dragOffset * 0.04}deg) scale(0.95)`;
            }
            if (nextBook) {
                nextBook.style.transform = `translateX(calc(-50% + 200px)) translateZ(-120px) rotateY(${-28 + dragOffset * 0.04}deg) scale(0.95)`;
            }
        }
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        element.style.cursor = 'grab';

        // Re-enable smooth transition animations
        document.querySelectorAll('.coverflow-book').forEach(book => {
            book.style.transition = '';
            book.style.transform = '';
        });

        const wrapper = document.getElementById('masterworksWrapper');
        if (wrapper) {
            wrapper.style.transform = '';
        }

        // Action threshold
        const threshold = 65;
        if (dragOffset > threshold) {
            prevCoverflow();
        } else if (dragOffset < -threshold) {
            nextCoverflow();
        } else {
            updateCoverflowPosition();
        }

        startCoverflowSlideshow();
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);

    // Touch event fallbacks for robust mobile responsiveness
    element.addEventListener('touchstart', onPointerDown, { passive: true });
    element.addEventListener('touchmove', onPointerMove, { passive: true });
    element.addEventListener('touchend', onPointerUp);
}


// ==================== DISCOVERY CATALOG COMPONENTS ====================
function renderCatalogGrid() {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;

    mergeApprovedCustomBooksIntoCatalog({ persist: true });
    mergeCurrentUserCustomBooksIntoCatalog({ persist: true });
    grid.innerHTML = '';

    allBooks.filter(isCatalogVisibleBook).forEach(book => {
        grid.appendChild(createBookCard(book));
    });

    const divs = grid.querySelectorAll(':scope > div');
    if (divs.length) {
        gsap.fromTo(divs,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }

    lucide.createIcons();
    updateCatalogStats();
}

// ==================== IMAGE LOADING & FALLBACK HANDLERS ====================
function handleImageLoad(img) {
    img.classList.remove('opacity-0');
    const parent = img.parentElement;
    if (parent) {
        const skeleton = parent.querySelector('.skeleton-loader');
        if (skeleton) {
            skeleton.classList.add('hidden');
        }
    }
}

function handleImageError(img) {
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
        const skeleton = parent.querySelector('.skeleton-loader');
        if (skeleton) {
            skeleton.classList.add('hidden');
        }
        const fallback = parent.querySelector('.fallback-cover');
        if (fallback) {
            fallback.classList.remove('hidden');
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
}

function createBookCard(book, options = {}) {
    const bookIdNum = Number(book.id);
    const isSaved = userDownloads.some(id => Number(id) === bookIdNum);
    const card = document.createElement('div');
    card.className = "bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-brand-500/25 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-sm p-3 relative text-left";

    const categoryTextColors = {
        "Technology": "text-brand-600",
        "Science": "text-accent-600",
        "Fiction": "text-pink-600",
        "History": "text-amber-600",
        "Business": "text-emerald-600"
    };
    const categoryTextColor = categoryTextColors[book.category] || "text-slate-400";
    const approvalStatus = book.approvalStatus || '';
    const isCustomBook = Boolean(book.isCustom);
    const canManageCustomBook = (Boolean(options.allowCustomManagement) || Boolean(options.showCustomRemove)) &&
        isCustomBook &&
        (!book.ownerEmail || !currentUserEmail || (book.ownerEmail || '').toLowerCase() === currentUserEmail.toLowerCase());
    const approvalBadge = canManageCustomBook && approvalStatus ? `
        <span class="inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2 py-1 rounded-lg border mb-2 ${getBookApprovalStatusClasses(approvalStatus)}">
            <i data-lucide="${approvalStatus === 'approved' ? 'check-circle' : approvalStatus === 'rejected' ? 'x-circle' : 'clock'}" class="w-3 h-3"></i>
            ${approvalStatus === 'approved' ? 'Approved' : approvalStatus === 'rejected' ? 'Rejected' : 'Pending Review'}
        </span>
    ` : '';
    const customBookActions = canManageCustomBook ? `
        <div class="flex items-center justify-end gap-2 flex-wrap">
            ${approvalStatus !== 'approved' ? `
            <button onclick="event.stopPropagation(); editCustomBook(${book.id});" 
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all duration-200 select-none text-slate-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-200" 
                    title="Edit Before Approval">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                <span class="text-[10px] font-black uppercase tracking-wider">EDIT</span>
            </button>
            ` : ''}
            ${(!approvalStatus || approvalStatus === 'rejected') ? `
            <button onclick="event.stopPropagation(); publishCustomBook(${book.id});" 
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all duration-200 select-none text-brand-600 bg-brand-50 hover:bg-brand-100/80 border border-brand-100" 
                    title="Publish for Admin Approval">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span class="text-[10px] font-black uppercase tracking-wider">${approvalStatus === 'rejected' ? 'PUBLISH AGAIN' : 'PUBLISH'}</span>
            </button>
            ` : ''}
            <button onclick="event.stopPropagation(); deleteCustomBook(${book.id});" 
                    class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all duration-200 select-none text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-100" 
                    title="Remove Custom Book">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span class="text-[10px] font-black uppercase tracking-wider">REMOVE</span>
            </button>
        </div>
    ` : '';

    card.innerHTML = `
        <!-- Book Cover with Premium Hover Overlay -->
        <div class="relative w-full aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
            <!-- 1. Pulsing Loading Skeleton -->
            <div class="skeleton-loader absolute inset-0 bg-slate-300 animate-pulse flex items-center justify-center">
                <i data-lucide="book-open" class="w-8 h-8 text-slate-400 animate-bounce"></i>
            </div>
            
            <!-- 2. Real Image (initially opacity-0, becomes opacity-100 on load) -->
            <img src="${book.cover}" alt="${book.title}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-0"
                 onload="handleImageLoad(this)"
                 onerror="handleImageError(this)">

            <!-- 3. Fallback Cover Container -->
            <div class="fallback-cover absolute inset-0 hidden flex flex-col justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 text-center select-none rounded-2xl">
                <div class="flex-grow flex flex-col items-center justify-center gap-2">
                    <i data-lucide="book-open" class="w-8 h-8 text-slate-400"></i>
                    <div class="text-[13px] font-black text-slate-700 leading-snug px-1 line-clamp-3">${book.title}</div>
                    <div class="text-[10px] font-bold text-slate-400 truncate w-full">by ${book.author}</div>
                </div>
                <div class="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-2">${book.category}</div>
            </div>

            <!-- 4. Hover Overlay -->
            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 backdrop-blur-[2px]">
                <button onclick="openBookModal(${book.id})" class="px-6 py-2.5 bg-white/95 text-slate-900 rounded-xl text-xs font-extrabold active:scale-95 transition-transform shadow-md hover:bg-white hover:text-brand-600 flex items-center gap-1.5">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                    <span>Inspect Details</span>
                </button>
            </div>
        </div>
        
        <!-- Book Details context block -->
        <div class="pt-3 px-1 flex-grow flex flex-col justify-between text-left">
            <div>
                ${approvalBadge}
                <!-- Curated Category Tag -->
                <span class="text-[9px] font-black tracking-widest ${categoryTextColor} uppercase block mb-1.5">${book.category}</span>
                
                <!-- Highly polished title -->
                <h4 class="font-extrabold text-[15px] text-slate-800 line-clamp-2 group-hover:text-brand-600 transition-colors duration-200 leading-snug cursor-pointer" onclick="openBookModal(${book.id})">${book.title}</h4>
                
                <!-- Subtitle Author -->
                <p class="text-[12px] font-medium text-slate-400 mt-1 line-clamp-1">by ${book.author}</p>
            </div>
            
            <!-- Bottom Interactive Controls Row -->
            <div class="flex justify-between items-center mt-3.5 pt-2.5 border-t border-slate-200/60">
                <!-- Rating Indicators -->
                <span class="text-[12px] font-extrabold text-amber-500 flex items-center gap-1">
                    <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                    <span>${book.rating || '4.5'}</span>
                </span>
                
                <!-- Premium Toggle bookmark/save indicator -->
                ${canManageCustomBook ? customBookActions : `
                <button onclick="event.stopPropagation(); quickBuffer(${book.id});" 
                        class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all duration-200 select-none ${isSaved
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100'
            : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50/50'
        }" 
                        title="${isSaved ? 'Buffered Locally' : 'Buffer to Offline Cache'}">
                    <i data-lucide="${isSaved ? 'check' : 'bookmark'}" class="w-3.5 h-3.5 ${isSaved ? 'stroke-[2.5]' : ''}"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">${isSaved ? 'SAVED' : 'SAVE'}</span>
                </button>
                `}
            </div>
        </div>
    `;
    return card;
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    filterBooks();
}

function filterBooks(resetPage = true) {
    if (resetPage) catalogCurrentPage = 1;
    mergeApprovedCustomBooksIntoCatalog({ persist: true });
    mergeCurrentUserCustomBooksIntoCatalog({ persist: true });

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortControl = document.getElementById('sortControl');
    const grid = document.getElementById('booksGrid');

    if (!grid) return;

    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const catVal = categoryFilter ? categoryFilter.value : '';
    const semVal = semesterFilter ? semesterFilter.value : '';
    const statusVal = statusFilter ? statusFilter.value : '';
    const sortVal = sortControl ? sortControl.value : 'title-asc';

    let filtered = allBooks.filter(book => {
        if (!isCatalogVisibleBook(book)) return false;

        const matchesSearch = book.title.toLowerCase().includes(searchVal) ||
            book.author.toLowerCase().includes(searchVal) ||
            book.isbn.includes(searchVal);

        const matchesCategory = !catVal || book.category === catVal;
        const matchesSemester = !semVal || book.semester === semVal;
        const matchesStatus = !statusVal || book.status === statusVal;

        return matchesSearch && matchesCategory && matchesSemester && matchesStatus;
    });

    // Handle curating sort specifications
    if (sortVal === 'title-asc') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortVal === 'title-desc') {
        filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortVal === 'rating-desc') {
        filtered.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortVal === 'year-desc') {
        filtered.sort((a, b) => (b.yearPublished || 2021) - (a.yearPublished || 2021));
    }

    // ── Paginate ──
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / CATALOG_PER_PAGE);
    if (catalogCurrentPage > totalPages) catalogCurrentPage = 1;
    const start = (catalogCurrentPage - 1) * CATALOG_PER_PAGE;
    const paginated = filtered.slice(start, start + CATALOG_PER_PAGE);

    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
                    <i data-lucide="search-code" class="w-8 h-8"></i>
                </div>
                <div>
                    <h3 class="text-lg font-black text-slate-800">No matching indexes found</h3>
                    <p class="text-slate-500 text-xs mt-1">Adjust search identifiers or subject classification categories.</p>
                </div>
            </div>
        `;
        document.getElementById('catalogPagination') && (document.getElementById('catalogPagination').innerHTML = '');
        lucide.createIcons();
        updateActiveFilterChips();
        updateCatalogStats();
        return;
    }

    paginated.forEach(book => { grid.appendChild(createBookCard(book)); });

    const divs = grid.querySelectorAll(':scope > div');
    if (divs.length) {
        gsap.fromTo(divs,
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.35, stagger: 0.03 }
        );
    }

    renderPaginationBar('catalogPagination', catalogCurrentPage, totalPages, (p) => {
        catalogCurrentPage = p;
        filterBooks(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    lucide.createIcons();
    updateActiveFilterChips();
    updateCatalogStats();
}

function updateCatalogStats() {
    const totalCountEl = document.getElementById('catalogTotalCount');
    const availableCountEl = document.getElementById('catalogAvailableCount');
    const reservedCountEl = document.getElementById('catalogReservedCount');
    const savedCountEl = document.getElementById('catalogSavedCount');
    const visibleBooks = allBooks.filter(isCatalogVisibleBook);

    if (totalCountEl) totalCountEl.textContent = visibleBooks.length;
    if (availableCountEl) {
        availableCountEl.textContent = visibleBooks.filter(b => b.status === 'Available').length;
    }
    if (reservedCountEl) {
        reservedCountEl.textContent = visibleBooks.filter(b => b.status === 'Reserved').length;
    }
    if (savedCountEl) {
        savedCountEl.textContent = userDownloads.length;
    }
}

function updateActiveFilterChips() {
    const container = document.getElementById('activeFiltersContainer');
    if (!container) return;

    const categoryFilter = document.getElementById('categoryFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const statusFilter = document.getElementById('statusFilter');

    const catVal = categoryFilter ? categoryFilter.value : '';
    const semVal = semesterFilter ? semesterFilter.value : '';
    const statusVal = statusFilter ? statusFilter.value : '';

    let chipsHtml = '';
    let activeCount = 0;

    if (catVal) {
        chipsHtml += createChipHtml('Category', catVal, 'categoryFilter');
        activeCount++;
    }
    if (semVal) {
        chipsHtml += createChipHtml('Semester', semVal, 'semesterFilter');
        activeCount++;
    }
    if (statusVal) {
        chipsHtml += createChipHtml('Status', statusVal, 'statusFilter');
        activeCount++;
    }

    if (activeCount > 0) {
        chipsHtml += `
            <button onclick="clearAllFilters()" class="text-[10px] font-black text-red-600 hover:text-red-750 transition-colors duration-200 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100/60 border border-red-100 flex items-center justify-center gap-1 active:scale-95 shrink-0 uppercase tracking-wider">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Clear All</span>
            </button>
        `;
        container.innerHTML = chipsHtml;
        container.classList.remove('hidden');
        container.classList.add('flex');
    } else {
        container.innerHTML = '';
        container.classList.remove('flex');
        container.classList.add('hidden');
    }

    lucide.createIcons();
}

function createChipHtml(label, value, filterId) {
    return `
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-xl text-xs font-semibold text-brand-700 shadow-sm shrink-0 select-none">
            <span class="text-slate-400 font-medium text-[10px] uppercase tracking-wider leading-none">${label}:</span>
            <span class="font-extrabold text-[11px] leading-none">${value}</span>
            <button onclick="removeFilter('${filterId}')" class="w-5 h-5 rounded-full hover:bg-brand-100/80 text-brand-500 hover:text-brand-700 flex items-center justify-center transition-colors duration-200 active:scale-90 ml-0.5 shrink-0">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        </div>
    `;
}

function removeFilter(filterId) {
    const filter = document.getElementById(filterId);
    if (filter) {
        filter.value = '';
        syncCustomSelects();
        filter.dispatchEvent(new Event('change'));
    }
}

function clearAllFilters() {
    const filters = ['categoryFilter', 'semesterFilter', 'statusFilter'];
    filters.forEach(id => {
        const filter = document.getElementById(id);
        if (filter) {
            filter.value = '';
        }
    });
    syncCustomSelects();
    const cat = document.getElementById('categoryFilter');
    if (cat) {
        cat.dispatchEvent(new Event('change'));
    }
}

// ==================== LIBRARY PORTFOLIO DASHBOARD ====================
let addBookTempCover = '';
let editingCustomBookId = null;

function setCustomBookFormMode(mode = 'create') {
    const isEditing = mode === 'edit';
    const title = document.getElementById('addBookFormTitle');
    const hint = document.getElementById('addBookFormHint');
    const submitText = document.getElementById('customBookSubmitText');
    const submitIcon = document.getElementById('customBookSubmitIcon');

    if (title) title.textContent = isEditing ? 'Edit Custom Book' : 'Add Custom Book';
    if (hint) {
        hint.textContent = isEditing
            ? 'Update this book while it is still waiting for admin approval.'
            : 'Create a personal book entry and publish it to admins for catalog approval.';
    }
    if (submitText) submitText.textContent = isEditing ? 'Save Changes' : 'Publish for Approval';
    if (submitIcon) submitIcon.setAttribute('data-lucide', isEditing ? 'save' : 'send');
    if (window.lucide) lucide.createIcons();
}

function resetCustomBookFormMode() {
    editingCustomBookId = null;
    addBookTempCover = '';
    const form = document.getElementById('customBookForm');
    if (form) form.reset();

    const categoryEl = document.getElementById('addBookCategory');
    const departmentEl = document.getElementById('addBookDept');
    const semesterEl = document.getElementById('addBookSemester');
    if (categoryEl) categoryEl.value = 'Technology';
    if (departmentEl) departmentEl.value = 'Computer Science';
    if (semesterEl) semesterEl.value = '1st Semester';

    syncCustomSelects();
    setCustomBookFormMode('create');
}

function showAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (!modal) {
        resetCustomBookFormMode();
        const addTabButton = Array.from(document.querySelectorAll('.dash-tab'))
            .find(btn => btn.textContent.trim().includes('Add Custom Book'));
        switchDashboardTab('addBook', addTabButton || document.querySelector('.dash-tab'));
        document.getElementById('addBookTitle')?.focus();
        return;
    }
    addBookTempCover = '';
    // reset form fields
    const form = modal.querySelector('form');
    if (form) form.reset();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    gsap.fromTo(modal.querySelector('.modal-card'),
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
    if (window.lucide) lucide.createIcons();
}

function editCustomBook(bookId) {
    if (!currentUserEmail) {
        showNotification("Portal Sign In required.", "error");
        return;
    }

    const customBooks = JSON.parse(localStorage.getItem(`customUserBooks_${currentUserEmail}`) || '[]');
    const book = customBooks.find(item => Number(item.id) === Number(bookId));

    if (!book) {
        showNotification("Custom book entry not found.", "error");
        return;
    }
    if (book.approvalStatus === 'approved') {
        showNotification("Approved books can no longer be edited.", "info");
        return;
    }

    editingCustomBookId = Number(bookId);
    addBookTempCover = '';

    const addTabButton = Array.from(document.querySelectorAll('.dash-tab'))
        .find(btn => btn.textContent.trim().includes('Add Custom Book'));
    switchDashboardTab('addBook', addTabButton || document.querySelector('.dash-tab'));

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };

    setValue('addBookTitle', book.title);
    setValue('addBookAuthor', book.author);
    setValue('addBookISBN', book.isbn);
    setValue('addBookCover', book.cover);
    setValue('addBookDescription', book.description);
    setValue('addBookCategory', book.category || 'Technology');
    setValue('addBookDept', book.department || 'Computer Science');
    setValue('addBookSemester', book.semester || '1st Semester');

    syncCustomSelects();
    setCustomBookFormMode('edit');
    document.getElementById('addBookTitle')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (!modal) return;
    gsap.to(modal.querySelector('.modal-card'), {
        scale: 0.85,
        opacity: 0,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
}

function initAddBookImageLoader() {
    const uploader = document.getElementById('addBookCoverInput');
    if (!uploader) return;

    uploader.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1.5 * 1024 * 1024) {
            showNotification("Image exceeds 1.5MB size quota limit.", "error");
            uploader.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            addBookTempCover = event.target.result;
            showNotification("Book cover loaded successfully.", "success");
        };
        reader.readAsDataURL(file);
    };
}

function handleAddBookSubmit(event) {
    event.preventDefault();
    if (!currentUserEmail) {
        showNotification("Portal Sign In required.", "error");
        return;
    }

    const form = event.target;
    const titleEl = document.getElementById('addBookTitle');
    const authorEl = document.getElementById('addBookAuthor');
    const isbnEl = document.getElementById('addBookISBN');
    const coverEl = document.getElementById('addBookCover');
    const descriptionEl = document.getElementById('addBookDescription');
    const categoryEl = document.getElementById('addBookCategory');
    const departmentEl = document.getElementById('addBookDept');
    const semesterEl = document.getElementById('addBookSemester');
    const submitButton = form.querySelector('button[type="submit"]');

    const title = titleEl?.value.trim() || '';
    const author = authorEl?.value.trim() || '';
    const isbn = isbnEl?.value.trim() || '';
    const category = categoryEl?.value || 'Technology';
    const department = departmentEl?.value || 'Computer Science';
    const semester = semesterEl?.value || '1st Semester';
    const cover = coverEl?.value.trim() || addBookTempCover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80";
    const description = descriptionEl?.value.trim() || '';

    if (!title || !author || !isbn || !description) {
        showNotification("Please complete title, author, ISBN and summary.", "error");
        return;
    }

    const isEditing = editingCustomBookId !== null;
    const customBooks = JSON.parse(localStorage.getItem(`customUserBooks_${currentUserEmail}`) || '[]');
    const submittedBooks = getCustomBookApplications();
    const editingIndex = isEditing
        ? customBooks.findIndex(book => Number(book.id) === Number(editingCustomBookId))
        : -1;

    if (isEditing && editingIndex === -1) {
        showNotification("Custom book entry not found.", "error");
        resetCustomBookFormMode();
        return;
    }
    if (isEditing && customBooks[editingIndex].approvalStatus === 'approved') {
        showNotification("Approved books can no longer be edited.", "info");
        resetCustomBookFormMode();
        renderDashboardPortfolio();
        return;
    }

    const duplicate = [
        ...allBooks,
        ...customBooks.filter(book => book.approvalStatus !== 'rejected'),
        ...submittedBooks.filter(book => book.approvalStatus !== 'rejected')
    ].some(book =>
        Number(book.id) !== Number(editingCustomBookId) &&
        (book.isbn || '').toLowerCase() === isbn.toLowerCase()
    );

    if (duplicate) {
        showNotification("A book with this ISBN already exists or is waiting for approval.", "error");
        return;
    }

    const originalButtonHtml = submitButton ? submitButton.innerHTML : '';
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `<i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i><span>${isEditing ? 'Saving...' : 'Publishing...'}</span>`;
        lucide.createIcons();
    }

    const now = new Date().toISOString();
    if (isEditing) {
        const existingBook = customBooks[editingIndex];
        const updatedBook = {
            ...existingBook,
            title,
            author,
            category,
            department,
            semester,
            isbn,
            description,
            cover,
            isCustom: true,
            ownerEmail: currentUserEmail,
            submittedByEmail: currentUserEmail,
            submittedBy: currentUser || currentUserEmail,
            updatedAt: now
        };

        customBooks[editingIndex] = updatedBook;
        localStorage.setItem(`customUserBooks_${currentUserEmail}`, JSON.stringify(customBooks));

        const appIndex = submittedBooks.findIndex(app => Number(app.id) === Number(editingCustomBookId));
        if (appIndex !== -1) {
            submittedBooks[appIndex] = {
                ...submittedBooks[appIndex],
                ...updatedBook,
                updatedAt: now
            };
            saveCustomBookApplications(submittedBooks);
        } else if (updatedBook.approvalStatus === 'pending') {
            submittedBooks.push(updatedBook);
            saveCustomBookApplications(submittedBooks);
        }

        allBooks = allBooks.filter(item => Number(item.id) !== Number(editingCustomBookId));
        mergeCurrentUserCustomBooksIntoCatalog();
        saveDatabase();
        resetCustomBookFormMode();
        showNotification(`Book "${title}" updated.`, "success");
        renderDashboardPortfolio();
        const myBooksButton = Array.from(document.querySelectorAll('.dash-tab'))
            .find(btn => btn.textContent.trim().includes('Offline Cache'));
        switchDashboardTab('myBooks', myBooksButton || document.querySelector('.dash-tab'));

        if (submitButton) {
            submitButton.disabled = false;
            lucide.createIcons();
        }
        return;
    }

    const newBook = {
        id: Date.now() + Math.floor(Math.random() * 1000), // unique timestamp-based ID
        title,
        author,
        category,
        department,
        semester,
        status: 'Pending Review',
        copiesTotal: 1,
        copiesAvailable: 0,
        publisher: 'Custom Reader Entry',
        pages: 300,
        yearPublished: new Date().getFullYear(),
        isbn,
        description,
        cover,
        rating: 5.0,
        isCustom: true,
        ownerEmail: currentUserEmail,
        submittedByEmail: currentUserEmail,
        submittedBy: currentUser || currentUserEmail,
        approvalStatus: 'pending',
        reviewStatus: 'pending',
        createdAt: now,
        submittedAt: now,
        updatedAt: now
    };

    customBooks.push(newBook);
    localStorage.setItem(`customUserBooks_${currentUserEmail}`, JSON.stringify(customBooks));

    submittedBooks.push(newBook);
    saveCustomBookApplications(submittedBooks);
    mergeCurrentUserCustomBooksIntoCatalog();
    saveDatabase();

    form.reset();
    if (categoryEl) categoryEl.value = 'Technology';
    if (departmentEl) departmentEl.value = 'Computer Science';
    if (semesterEl) semesterEl.value = '1st Semester';
    addBookTempCover = '';
    syncCustomSelects();

    showNotification(`Book "${title}" submitted for admin approval.`, "success");
    renderDashboardPortfolio();
    const myBooksButton = Array.from(document.querySelectorAll('.dash-tab'))
        .find(btn => btn.textContent.trim().includes('Offline Cache'));
    switchDashboardTab('myBooks', myBooksButton || document.querySelector('.dash-tab'));

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHtml;
        lucide.createIcons();
    }
}

function publishCustomBook(bookId) {
    if (!currentUserEmail) {
        showNotification("Portal Sign In required.", "error");
        return;
    }

    const storageKey = `customUserBooks_${currentUserEmail}`;
    const customBooks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const bookIndex = customBooks.findIndex(book => Number(book.id) === Number(bookId));

    if (bookIndex === -1) {
        showNotification("Custom book entry not found.", "error");
        return;
    }

    const book = customBooks[bookIndex];
    if (book.approvalStatus === 'pending') {
        showNotification(`"${book.title}" is already waiting for admin approval.`, "info");
        return;
    }
    if (book.approvalStatus === 'approved') {
        showNotification(`"${book.title}" is already approved.`, "success");
        return;
    }

    const now = new Date().toISOString();
    const pendingBook = {
        ...book,
        isCustom: true,
        ownerEmail: currentUserEmail,
        submittedByEmail: currentUserEmail,
        submittedBy: currentUser || currentUserEmail,
        approvalStatus: 'pending',
        reviewStatus: 'pending',
        status: 'Pending Review',
        copiesAvailable: 0,
        submittedAt: book.submittedAt || now,
        updatedAt: now
    };

    customBooks[bookIndex] = pendingBook;
    localStorage.setItem(storageKey, JSON.stringify(customBooks));

    const applications = getCustomBookApplications();
    const appIndex = applications.findIndex(app =>
        Number(app.id) === Number(bookId) ||
        (
            (app.isbn || '').toLowerCase() === (book.isbn || '').toLowerCase() &&
            (app.submittedByEmail || app.ownerEmail || '').toLowerCase() === currentUserEmail.toLowerCase()
        )
    );

    if (appIndex === -1) {
        applications.push(pendingBook);
    } else {
        applications[appIndex] = {
            ...applications[appIndex],
            ...pendingBook,
            id: pendingBook.id
        };
    }

    allBooks = allBooks.filter(item => Number(item.id) !== Number(bookId));
    saveCustomBookApplications(applications);
    saveDatabase();
    renderDashboardPortfolio();
    showNotification(`"${book.title}" sent to admins for approval.`, "success");
}

function deleteCustomBook(bookId) {
    if (!currentUserEmail) {
        showNotification("Portal Sign In required.", "error");
        return;
    }

    const bookIdText = String(bookId);
    const storageKey = `customUserBooks_${currentUserEmail}`;
    const customBooks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const customBook = customBooks.find(book => String(book.id) === bookIdText);

    if (!customBook) {
        showNotification("Custom book entry not found.", "error");
        renderDashboardPortfolio();
        return;
    }

    if (confirm(`Remove "${customBook.title}" from your custom books?`)) {
        localStorage.setItem(storageKey, JSON.stringify(
            customBooks.filter(book => String(book.id) !== bookIdText)
        ));

        userDownloads = userDownloads.filter(id => String(id) !== bookIdText);
        saveDownloads();

        allBooks = allBooks.filter(book => String(book.id) !== bookIdText);

        const applications = getCustomBookApplications();
        saveCustomBookApplications(applications.filter(app => String(app.id) !== bookIdText));

        saveDatabase();
        showNotification("Custom book removed from your library.", "info");

        const pageId = getCurrentPageId();
        if (pageId === 'dashboard') renderDashboardPortfolio();
        if (pageId === 'catalog') filterBooks();
        if (pageId === 'saved') renderSavedBooks();
    }
}

function renderDashboardPortfolio() {
    const userGrid = document.getElementById('userBooksGrid');
    const recGrid = document.getElementById('recommendationsGrid');

    // If not logged in at all, show a sign-in prompt instead of empty state
    if (!currentUser) {
        const notLoggedInHtml = `
            <div class="col-span-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                    <i data-lucide="shield-check" class="w-8 h-8"></i>
                </div>
                <div>
                    <h3 class="text-lg font-black text-slate-800">Sign in to view your Library</h3>
                    <p class="text-slate-500 text-xs mt-1 mb-6">Authenticate as an Academic Reader to access your saved books and recommendations.</p>
                    <button onclick="showLoginModal()" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Login / Register</button>
                </div>
            </div>
        `;
        if (userGrid) userGrid.innerHTML = notLoggedInHtml;
        if (recGrid) recGrid.innerHTML = '';
        lucide.createIcons();
        return;
    }

    if (userGrid) {
        userGrid.innerHTML = '';

        // Load custom books
        const customBooks = JSON.parse(localStorage.getItem(`customUserBooks_${currentUserEmail}`) || '[]');
        customBooks.forEach(b => b.isCustom = true);

        // Load buffered catalog books
        const savedList = allBooks.filter(b => userDownloads.some(id => Number(id) === Number(b.id)));

        const combinedMap = new Map();
        [...customBooks, ...savedList].forEach(book => {
            const key = String(book.id);
            if (!combinedMap.has(key)) combinedMap.set(key, book);
        });
        const combinedList = Array.from(combinedMap.values());

        if (combinedList.length === 0) {
            userGrid.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                        <i data-lucide="cloud-lightning" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-800">Your Library is empty</h3>
                        <p class="text-slate-500 text-xs mt-1 mb-6">Buffer books from the catalog or add your own custom books to start your collection.</p>
                        <div class="flex justify-center gap-2">
                            <button onclick="navigateTo('catalog')" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Explore Catalog</button>
                            <button onclick="showAddBookModal()" class="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl active:scale-95 transition-all">Add Custom Book</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            combinedList.forEach(book => {
                const isOwnCustomBook = book.isCustom &&
                    (!book.ownerEmail || !currentUserEmail || (book.ownerEmail || '').toLowerCase() === currentUserEmail.toLowerCase());
                const isStoredCustomBook = book.isCustom &&
                    customBooks.some(customBook => Number(customBook.id) === Number(book.id));
                userGrid.appendChild(createBookCard(book, {
                    allowCustomManagement: isOwnCustomBook || isStoredCustomBook,
                    showCustomRemove: isStoredCustomBook
                }));
            });
            const divs = userGrid.querySelectorAll(':scope > div');
            if (divs.length) {
                gsap.fromTo(divs,
                    { opacity: 0, y: 20, scale: 0.97 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
                );
            }
        }
    }

    if (recGrid) {
        recGrid.innerHTML = '';
        const recList = allBooks.filter(b => !userDownloads.some(id => Number(id) === Number(b.id))).slice(0, 4);

        if (recList.length === 0) {
            recGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400 text-xs font-bold">
                    <i data-lucide="award" class="w-8 h-8 text-amber-500 mx-auto mb-2"></i>
                    <span>All metadata volumes synchronized locally. High reading coverage achieved!</span>
                </div>
            `;
        } else {
            recList.forEach(book => {
                recGrid.appendChild(createBookCard(book));
            });
        }
    }

    lucide.createIcons();
}

function switchDashboardTab(tabId, tabBtn) {
    document.querySelectorAll('.dash-tab').forEach(btn => {
        btn.classList.remove('active', 'text-brand-600');
        btn.classList.add('text-slate-500');
    });
    document.querySelectorAll('.dash-panel').forEach(panel => {
        panel.classList.remove('active', 'block');
        panel.classList.add('hidden');
    });

    tabBtn.classList.add('active', 'text-brand-600');
    tabBtn.classList.remove('text-slate-500');

    const activePanel = document.getElementById(`${tabId}Tab`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('active', 'block');

        const divs = activePanel.querySelectorAll('.books-grid > div');
        if (divs.length) {
            gsap.fromTo(divs,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }
            );
        }
    }
}

// ==================== ADMINISTRATIVE WORKSPACE CONTROLS ====================
function switchAdminTab(tabId, tabBtn) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active', 'text-brand-600');
        btn.classList.add('text-slate-500');
    });
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active', 'block');
        panel.classList.add('hidden');
    });

    tabBtn.classList.add('active', 'text-brand-600');
    tabBtn.classList.remove('text-slate-500');

    const activePanel = document.getElementById(`${tabId}Tab`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('active', 'block');

        if (tabId === 'manageBooks') {
            updateAdminTable();
        }
        if (tabId === 'memberApprovals') {
            renderMemberApprovals();
        }
        if (tabId === 'bookApprovals') {
            renderCustomBookApprovals();
        }
    }
}

function updateAdminTable() {
    console.log('updateAdminTable called with allBooks length:', allBooks.length);
    
    const tbody = document.getElementById('adminBooksTable');
    if (!tbody) {
        console.error('adminBooksTable element not found!');
        return;
    }

    const totalPages = Math.ceil(allBooks.length / ADMIN_PER_PAGE);
    if (adminCurrentPage > totalPages) adminCurrentPage = 1;
    const start = (adminCurrentPage - 1) * ADMIN_PER_PAGE;
    const pageBooks = allBooks.slice(start, start + ADMIN_PER_PAGE);

    console.log('Rendering', pageBooks.length, 'books on page', adminCurrentPage);

    tbody.innerHTML = '';
    const countEl = document.getElementById('adminTotalCount');
    if (countEl) countEl.textContent = allBooks.length;

    pageBooks.forEach(book => {
        let statusClass = '', statusDot = '';
        if (book.status === 'Available') { statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'; statusDot = 'bg-emerald-600'; }
        else if (book.status === 'Reserved') { statusClass = 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'; statusDot = 'bg-amber-600'; }
        else { statusClass = 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm'; statusDot = 'bg-rose-600'; }

        const semColors = { '1st Semester': 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm', '2nd Semester': 'bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm', '3rd Semester': 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm', '4th Semester': 'bg-pink-100 text-pink-800 border-pink-300 shadow-sm', '5th Semester': 'bg-orange-100 text-orange-850 border-orange-300 shadow-sm', '6th Semester': 'bg-amber-100 text-amber-850 border-amber-300 shadow-sm', '7th Semester': 'bg-emerald-100 text-emerald-850 border-emerald-300 shadow-sm', '8th Semester': 'bg-rose-100 text-rose-850 border-rose-300 shadow-sm' };
        const semClass = semColors[book.semester] || 'bg-slate-100 text-slate-800 border-slate-300 shadow-sm';

        const catColors = { 'Technology': 'bg-cyan-100 text-cyan-850 border-cyan-300 shadow-sm', 'Science': 'bg-teal-100 text-teal-850 border-teal-300 shadow-sm', 'Fiction': 'bg-orange-100 text-orange-850 border-orange-300 shadow-sm', 'History': 'bg-yellow-100 text-yellow-850 border-yellow-300 shadow-sm', 'Business': 'bg-violet-100 text-violet-850 border-violet-300 shadow-sm' };
        const catClass = catColors[book.category] || 'bg-slate-100 text-slate-850 border-slate-300 shadow-sm';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-all duration-150 border-b border-slate-100 text-slate-700 text-xs group';
        tr.innerHTML = `
            <td class="p-4 pl-6 align-middle"><div class="w-10 h-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"><img src="${book.cover}" alt="Cover" class="w-full h-full object-cover"></div></td>
            <td class="p-4 align-middle"><div class="flex flex-col text-left"><span class="text-xs font-bold text-slate-800 leading-tight mb-1 group-hover:text-brand-600 transition-colors duration-150">${book.title}</span><div class="flex items-center gap-1.5 text-[10px] text-slate-455 leading-none"><span>by ${book.author}</span><span class="text-slate-300">•</span><span>Year: ${book.yearPublished}</span><span class="text-slate-300">•</span><span class="font-semibold text-slate-550">${book.department || 'General Education'}</span></div></div></td>
            <td class="p-4 align-middle"><span class="inline-flex items-center px-2.5 py-0.5 border text-[10px] font-black rounded-full ${semClass}">${book.semester || '1st Semester'}</span></td>
            <td class="p-4 align-middle"><span class="inline-flex items-center gap-1 px-2.5 py-0.5 border text-[10px] font-black rounded-full ${statusClass}"><span class="w-1.5 h-1.5 rounded-full ${statusDot} mr-1"></span>${book.status || 'Available'}</span></td>
            <td class="p-4 align-middle"><span class="px-2.5 py-0.5 border text-[10px] font-black uppercase tracking-wide rounded-md ${catClass}">${book.category}</span></td>
            <td class="p-4 align-middle"><div class="flex flex-col text-left"><span class="text-xs font-bold text-slate-700">${book.copiesAvailable !== undefined ? book.copiesAvailable : 5} / ${book.copiesTotal !== undefined ? book.copiesTotal : 5}</span><span class="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Available</span></div></td>
            <td class="p-4 align-middle font-mono text-[10px] text-slate-500 font-bold">${book.isbn}</td>
            <td class="p-4 pr-6 align-middle text-right"><button onclick="toggleActionDropdown(event, '${book.id}')" class="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-slate-700 text-slate-500 border border-slate-200/80 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ml-auto" title="Manage Record"><i data-lucide="more-vertical" class="w-4 h-4"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    console.log('Table rendered with', pageBooks.length, 'books');

    renderPaginationBar('adminPagination', adminCurrentPage, totalPages, (p) => {
        adminCurrentPage = p;
        updateAdminTable();
    });

    lucide.createIcons();
}

// ==================== SHARED PAGINATION BAR ====================
function renderPaginationBar(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) { if (container) container.innerHTML = ''; return; }

    const btnBase = 'w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 active:scale-95 border select-none';
    const btnActive = 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20';
    const btnInactive = 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer';
    const btnDisabled = 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed';

    const fnName = `__pgCb_${containerId}`;
    window[fnName] = onPageChange;

    let html = '';
    html += `<button onclick="window['${fnName}'](${currentPage - 1})" class="${btnBase} ${currentPage === 1 ? btnDisabled : btnInactive}" ${currentPage === 1 ? 'disabled' : ''}><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>`;

    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    pages.forEach(p => {
        if (p === '...') { html += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 text-xs font-bold">…</span>`; }
        else { html += `<button onclick="window['${fnName}'](${p})" class="${btnBase} ${p === currentPage ? btnActive : btnInactive}">${p}</button>`; }
    });

    html += `<button onclick="window['${fnName}'](${currentPage + 1})" class="${btnBase} ${currentPage === totalPages ? btnDisabled : btnInactive}" ${currentPage === totalPages ? 'disabled' : ''}><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>`;
    html += `<span class="text-[11px] font-bold text-slate-400 ml-1">Page ${currentPage} of ${totalPages}</span>`;

    container.innerHTML = html;
    lucide.createIcons();
}

let isSubmittingBook = false;

function addBook(event) {
    console.log('=== addBook CALLED ===');
    
    // Prevent duplicate submissions
    if (isSubmittingBook) {
        console.warn('Submission already in progress');
        return;
    }
    
    if (event) {
        event.preventDefault();
    }
    
    const bookTitleEl = document.getElementById('bookTitle');
    const bookAuthorEl = document.getElementById('bookAuthor');
    const bookISBNEl = document.getElementById('bookISBN');
    const bookDescriptionEl = document.getElementById('bookDescription');
    const bookCoverEl = document.getElementById('bookCover');
    const bookCategorySelect = document.getElementById('bookCategory');
    const bookDeptSelect = document.getElementById('bookDept');
    const bookSemesterSelect = document.getElementById('bookSemester');
    const saveBookBtn = document.getElementById('saveBookBtn');
    
    const title = bookTitleEl?.value?.trim() || '';
    const author = bookAuthorEl?.value?.trim() || '';
    const isbn = bookISBNEl?.value?.trim() || '';
    const description = bookDescriptionEl?.value?.trim() || '';
    const cover = bookCoverEl?.value?.trim() || '';
    const category = bookCategorySelect?.value || 'Technology';
    const department = bookDeptSelect?.value || 'Computer Science';
    const semester = bookSemesterSelect?.value || '1st Semester';
    
    console.log('Form values:', { title, author, isbn });
    
    // Validate required fields
    if (!title) {
        console.warn('Missing title');
        showNotification("Error: Please enter a Volume Title.", "error");
        return;
    }
    if (!author) {
        console.warn('Missing author');
        showNotification("Error: Please enter an Author Name.", "error");
        return;
    }
    if (!isbn) {
        console.warn('Missing isbn');
        showNotification("Error: Please enter an ISBN Index ID.", "error");
        return;
    }
    if (!description) {
        console.warn('Missing description');
        showNotification("Error: Please enter a Volume Abstract Summary.", "error");
        return;
    }
    
    console.log('Validation passed');
    
    // ─────────── SET LOADING STATE ───────────
    isSubmittingBook = true;
    if (saveBookBtn) {
        saveBookBtn.disabled = true;
        const originalHTML = saveBookBtn.innerHTML;
        saveBookBtn.innerHTML = `<i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i><span>Saving...</span>`;
        lucide.createIcons();
    }
    
    // Create record
    const finalCover = cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80";
    
    const newRecord = {
        id: Date.now(),
        title: title,
        author: author,
        category: category,
        department: department,
        semester: semester,
        status: 'Available',
        copiesTotal: 5,
        copiesAvailable: 5,
        isbn: isbn,
        cover: finalCover,
        description: description,
        rating: 4.5,
        yearPublished: new Date().getFullYear(),
        pages: 380,
        publisher: "GBLMS Press"
    };
    
    console.log('New record created:', newRecord);
    console.log('allBooks before push:', allBooks.length);
    
    // Save to database
    try {
        if (!Array.isArray(allBooks)) {
            console.warn('allBooks not array, initializing');
            window.allBooks = [];
        }
        allBooks.push(newRecord);
        console.log('allBooks after push:', allBooks.length);
        
        saveDatabase();
        console.log('saveDatabase() completed');
    } catch (err) {
        console.error('ERROR in save:', err);
        isSubmittingBook = false;
        if (saveBookBtn) {
            saveBookBtn.disabled = false;
            saveBookBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Save System Record</span>`;
            lucide.createIcons();
        }
        showNotification('Error saving: ' + err.message, 'error');
        return;
    }
    
    // Reset form
    try {
        if (bookTitleEl) bookTitleEl.value = '';
        if (bookAuthorEl) bookAuthorEl.value = '';
        if (bookISBNEl) bookISBNEl.value = '';
        if (bookCoverEl) bookCoverEl.value = '';
        if (bookDescriptionEl) bookDescriptionEl.value = '';
        if (bookCategorySelect) bookCategorySelect.value = 'Technology';
        if (bookDeptSelect) bookDeptSelect.value = 'Computer Science';
        if (bookSemesterSelect) bookSemesterSelect.value = '1st Semester';
        
        syncCustomSelects();
        console.log('Form reset');
    } catch (err) {
        console.error('Form reset error:', err);
    }
    
    // Show success
    showNotification(`Volume "${title}" successfully cataloged.`, "success");
    console.log('=== addBook COMPLETE ===');
    
    try {
        updateAdminTable();
        console.log('Table updated');
    } catch (err) {
        console.error('Table update error:', err);
    }
    
    // Refresh category displays so new book appears in catalog
    try {
        if (typeof renderKnowledgeAreas === 'function') {
            renderKnowledgeAreas();
            console.log('Category displays refreshed');
        }
        if (typeof renderFeaturedCarousel === 'function') {
            renderFeaturedCarousel();
            console.log('Featured carousel refreshed');
        }
        if (typeof displayCatalogBooks === 'function') {
            displayCatalogBooks();
            console.log('Catalog books refreshed');
        }
    } catch (err) {
        console.error('Catalog refresh error (non-critical):', err);
    }
    
    // Reset button state and auto-redirect after brief delay
    setTimeout(() => {
        isSubmittingBook = false;
        if (saveBookBtn) {
            saveBookBtn.disabled = false;
            saveBookBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Save System Record</span>`;
            lucide.createIcons();
        }
        
        // Auto-redirect to database list view after 2 seconds
        setTimeout(() => {
            const dbListBtn = document.getElementById('databaseListTabBtn');
            if (dbListBtn) {
                dbListBtn.click();
                console.log('Auto-redirected to database list view');
            }
        }, 1500);
    }, 500);
}

let bookIdToDelete = null;

function deleteBookRecord(bookId) {
    console.log('deleteBookRecord called with bookId:', bookId);
    
    const record = allBooks.find(b => String(b.id) === String(bookId));
    console.log('Record found:', record);
    if (!record) {
        console.error('Record not found for bookId:', bookId);
        return;
    }

    // Dismiss administrative edit drawer if open to prevent UI overlapping
    closeEditDrawer(true);

    bookIdToDelete = bookId;

    const titleEl = document.getElementById('deleteBookTitle');
    if (titleEl) {
        titleEl.textContent = `"${record.title}"`;
    }

    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        // Set visible via inline style — avoids class conflict with 'hidden'
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.opacity = '0';

        const card = modal.querySelector('.modal-card');

        // Premium GSAP entrance
        gsap.killTweensOf([modal, card]);
        gsap.to(modal, { opacity: 1, duration: 0.25 });
        if (card) {
            gsap.fromTo(card,
                { scale: 0.88, y: 20, opacity: 0 },
                { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.6)" }
            );
        }

        // Refresh Lucide icons inside the modal
        lucide.createIcons();
        console.log('Delete confirmation modal opened');
    }

}

function executeDeleteRecord() {
    if (bookIdToDelete === null) return;

    const record = allBooks.find(b => String(b.id) === String(bookIdToDelete));
    if (!record) return;

    allBooks = allBooks.filter(b => String(b.id) !== String(bookIdToDelete));
    userDownloads = userDownloads.filter(id => String(id) !== String(bookIdToDelete));

    saveDownloads();
    saveDatabase();
    updateAdminTable();
    if (typeof renderFeaturedCarousel === 'function') renderFeaturedCarousel();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();

    showNotification(`Volume "${record.title}" removed.`, "info");
    closeDeleteModal();
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal || modal.style.display === 'none' || modal.style.display === '') return;

    const card = modal.querySelector('.modal-card');
    gsap.killTweensOf([modal, card]);

    if (card) {
        gsap.to(card, { scale: 0.88, y: 20, opacity: 0, duration: 0.2, ease: "power2.in" });
    }

    gsap.to(modal, {
        opacity: 0,
        duration: 0.22,
        onComplete: () => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            bookIdToDelete = null;
        }
    });
}

function editBookRecord(bookId) {
    console.log('editBookRecord called with bookId:', bookId);
    
    const record = allBooks.find(b => String(b.id) === String(bookId));
    console.log('Record found:', record);
    if (!record) {
        console.error('Record not found for bookId:', bookId);
        return;
    }

    // Set form values safely with optional chaining and nullish coalescing
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('editBookId', record.id);
    setVal('editBookTitle', record.title);
    setVal('editBookAuthor', record.author);
    setVal('editBookISBN', record.isbn);
    setVal('editBookCover', record.cover);
    setVal('editBookDescription', record.description);
    setVal('editBookCategory', record.category);
    setVal('editBookDept', record.department || "Computer Science");
    setVal('editBookSemester', record.semester || "1st Semester");
    setVal('editBookStatus', record.status || "Available");
    setVal('editBookCopiesTotal', record.copiesTotal || 5);
    setVal('editBookCopiesAvailable', record.copiesAvailable || 5);

    syncCustomSelects();

    const overlay = document.getElementById('editDrawerOverlay');
    const drawer = document.getElementById('editDrawer');
    if (overlay && drawer) {
        overlay.classList.remove('hidden');
        gsap.killTweensOf([overlay, drawer]);
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(drawer, { x: '100%' }, { x: '0%', duration: 0.45, ease: "power3.out" });

        // Refresh icons inside drawer
        lucide.createIcons();
        console.log('Edit drawer opened for bookId:', bookId);
    }
}

function closeEditDrawer(instant = false) {
    const overlay = document.getElementById('editDrawerOverlay');
    const drawer = document.getElementById('editDrawer');
    if (overlay && drawer) {
        gsap.killTweensOf([overlay, drawer]);
        if (instant) {
            overlay.style.opacity = '0';
            overlay.classList.add('hidden');
            gsap.set(drawer, { x: '100%' });
        } else {
            gsap.to(overlay, { opacity: 0, duration: 0.3 });
            gsap.to(drawer, {
                x: '100%',
                duration: 0.35,
                ease: "power3.in",
                onComplete: () => {
                    overlay.classList.add('hidden');
                }
            });
        }
    }
}

function saveBookEdit() {
    const bookId = parseInt(document.getElementById('editBookId').value);
    const title = document.getElementById('editBookTitle').value.trim();
    const author = document.getElementById('editBookAuthor').value.trim();
    const category = document.getElementById('editBookCategory').value;
    const department = document.getElementById('editBookDept').value;
    const semester = document.getElementById('editBookSemester').value;
    const status = document.getElementById('editBookStatus').value;
    const copiesTotal = parseInt(document.getElementById('editBookCopiesTotal').value) || 5;
    const copiesAvailable = parseInt(document.getElementById('editBookCopiesAvailable').value) || 5;
    const isbn = document.getElementById('editBookISBN').value.trim();
    const cover = document.getElementById('editBookCover').value.trim();
    const description = document.getElementById('editBookDescription').value.trim();

    if (!title || !author || !isbn || !description) {
        showNotification("Validation error: Please fill all required fields.", "error");
        return;
    }

    const recordIndex = allBooks.findIndex(b => b.id === bookId);
    if (recordIndex === -1) {
        showNotification("Error: Record could not be located in database.", "error");
        return;
    }

    allBooks[recordIndex] = {
        ...allBooks[recordIndex],
        title,
        author,
        category,
        department,
        semester,
        status,
        copiesTotal,
        copiesAvailable,
        isbn,
        cover: cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80",
        description
    };

    saveDatabase();
    updateAdminTable();
    closeEditDrawer();

    // Trigger updates to search lists or featured carousels if present
    if (typeof renderFeaturedCarousel === 'function') renderFeaturedCarousel();
    if (typeof renderCatalogGrid === 'function') renderCatalogGrid();

    showNotification(`Volume "${title}" successfully updated.`, "success");
}

// ==================== SYSTEM MODAL: VOLUME INSPECTION ====================
function openBookModal(bookId) {
    const bookIdNum = Number(bookId);
    let book = allBooks.find(b => Number(b.id) === bookIdNum);
    if (!book && currentUserEmail) {
        const customBooks = JSON.parse(localStorage.getItem(`customUserBooks_${currentUserEmail}`) || '[]');
        book = customBooks.find(b => Number(b.id) === bookIdNum);
    }
    selectedBookForModal = book;
    if (!selectedBookForModal) return;

    document.getElementById('modalBookTitle').textContent = selectedBookForModal.title;
    document.getElementById('modalBookAuthor').textContent = `by ${selectedBookForModal.author}`;
    document.getElementById('modalBookCategory').textContent = selectedBookForModal.category;
    document.getElementById('modalBookISBN').textContent = `ISBN Index Identifier: ${selectedBookForModal.isbn}`;
    document.getElementById('modalBookDescription').textContent = selectedBookForModal.description;
    document.getElementById('modalBookCover').src = selectedBookForModal.cover;

    // Technical metadata specs table in Light Mode
    const metaContainer = document.getElementById('modalBookMeta');
    if (metaContainer) {
        metaContainer.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="meta-icon-box">
                    <i data-lucide="book-open" class="w-4 h-4"></i>
                </div>
                <div class="flex flex-col text-left">
                    <span class="text-[9px] font-extrabold uppercase text-slate-400 tracking-widest leading-none">Pages</span>
                    <span class="text-xs font-black text-slate-800 mt-1 leading-none">${selectedBookForModal.pages || 350} p</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="meta-icon-box">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <div class="flex flex-col text-left">
                    <span class="text-[9px] font-extrabold uppercase text-slate-400 tracking-widest leading-none">Released</span>
                    <span class="text-xs font-black text-slate-800 mt-1 leading-none">${selectedBookForModal.yearPublished || 2021}</span>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="meta-icon-box">
                    <i data-lucide="building" class="w-4 h-4"></i>
                </div>
                <div class="flex flex-col text-left truncate">
                    <span class="text-[9px] font-extrabold uppercase text-slate-400 tracking-widest leading-none">Publisher</span>
                    <span class="text-xs font-black text-slate-800 mt-1 leading-none truncate block max-w-[90px]">${selectedBookForModal.publisher || 'Pearson'}</span>
                </div>
            </div>
        `;
    }

    // Dynamic ratings stars calculator
    const ratingContainer = document.querySelector('#bookModal .text-amber-500')?.parentElement;
    if (ratingContainer) {
        const ratingVal = parseFloat(selectedBookForModal.rating) || 4.5;
        const fullStars = Math.floor(ratingVal);
        const halfStar = (ratingVal % 1) >= 0.4;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-current text-amber-500"></i>`;
        }
        if (halfStar) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 fill-current text-amber-500 opacity-60"></i>`;
        }
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += `<i data-lucide="star" class="w-4 h-4 text-slate-200"></i>`;
        }

        ratingContainer.innerHTML = `
            <div class="flex gap-0.5">${starsHtml}</div>
            <span class="px-2.5 py-0.5 bg-amber-50 border border-amber-200/60 rounded-lg text-xs font-extrabold text-amber-700">★ ${ratingVal.toFixed(1)} Rating Avg</span>
        `;
    }

    // Update dynamic download button configuration
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> <span>Download</span>`;
        btn.disabled = false;
        btn.className = "flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm active:scale-95 transition-all duration-200 shadow-lg shadow-brand-500/10";
    }

    const modal = document.getElementById('bookModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    gsap.fromTo(modal.querySelector('.modal-card'),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
    );

    lucide.createIcons();
}

// Dialog closing configurations
function closeBookModal() {
    const modal = document.getElementById('bookModal');
    gsap.to(modal.querySelector('.modal-card'), {
        y: 60,
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
}

function downloadBook() {
    if (!currentUser) {
        closeBookModal();
        showLoginModal();
        showNotification("Access Denied: Portal Sign In required.", "error");
        return;
    }

    if (selectedBookForModal) {
        const pdfUrl = selectedBookForModal.pdfUrl || "https://openlibrary.org";
        window.open(pdfUrl, '_blank');
        showNotification(`Opening: "${selectedBookForModal.title}" PDF in a new tab.`, "success");
    }
}

function quickBuffer(bookId) {
    if (!currentUser) {
        showLoginModal();
        showNotification("Access Denied: Portal Sign In required.", "error");
        return;
    }

    const bookIdNum = Number(bookId);
    const hasDownload = userDownloads.some(id => Number(id) === bookIdNum);

    if (!hasDownload) {
        userDownloads.push(bookIdNum);
        saveDownloads();
        showNotification("Volume buffered to offline cache portfolio.", "success");
    } else {
        userDownloads = userDownloads.filter(id => Number(id) !== bookIdNum);
        saveDownloads();
        showNotification("Volume removed from offline cache portfolio.", "info");
    }

    // Dynamic instant re-render depending on active page
    const pageId = getCurrentPageId();
    if (pageId === 'catalog') {
        filterBooks();
    } else if (pageId === 'dashboard') {
        renderDashboardPortfolio();
    } else if (pageId === 'saved') {
        renderSavedBooks();
    } else {
        if (typeof renderFeaturedSlider === 'function') renderFeaturedSlider();
        if (typeof renderFeaturedList === 'function') renderFeaturedList();
        if (typeof renderCatalogGrid === 'function') renderCatalogGrid();
    }
}

// ==================== SAVED BOOKS PAGE ====================
function renderSavedBooks() {
    const grid = document.getElementById('savedBooksGrid');
    const badge = document.getElementById('savedCountBadge');
    const clearBtn = document.getElementById('clearAllSavedBtn');
    const toolbar = document.getElementById('savedToolbar');
    const catFilters = document.getElementById('savedCategoryFilters');
    if (!grid) return;

    const savedList = allBooks.filter(b => userDownloads.some(id => Number(id) === Number(b.id)));

    // Update badge
    if (badge) badge.textContent = `${savedList.length} saved`;

    // Show/hide clear & toolbar
    if (clearBtn) { savedList.length > 0 ? clearBtn.classList.replace('hidden', 'flex') : clearBtn.classList.replace('flex', 'hidden'); }
    if (toolbar) { savedList.length > 0 ? toolbar.classList.replace('hidden', 'flex') : toolbar.classList.replace('flex', 'hidden'); }

    // Category filter chips
    if (catFilters) {
        const cats = [...new Set(savedList.map(b => b.category))].filter(Boolean);
        const activeCat = catFilters.dataset.active || '';
        catFilters.innerHTML = cats.length > 1 ? [
            `<button onclick="setSavedCategory('')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${!activeCat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">All</button>`,
            ...cats.map(c => `<button onclick="setSavedCategory('${c}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${activeCat === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}">${c}</button>`)
        ].join('') : '';
        if (cats.length > 1) catFilters.classList.replace('hidden', 'flex'); else catFilters.classList.replace('flex', 'hidden');
    }

    // Not logged in
    if (!currentUser) {
        grid.innerHTML = `<div class="col-span-full py-20 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><i data-lucide="shield-check" class="w-8 h-8"></i></div>
            <div><h3 class="text-lg font-black text-slate-800">Sign in to view your saved books</h3><p class="text-slate-500 text-xs mt-1 mb-6">Create an account or sign in to start saving books.</p>
            <button onclick="showLoginModal()" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Login / Register</button></div></div>`;
        lucide.createIcons(); return;
    }

    // Filter by search
    const searchVal = (document.getElementById('savedSearchInput')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('savedSortSelect')?.value || 'saved-order';
    const activeCat = catFilters?.dataset.active || '';

    let list = savedList.filter(b => {
        const matchSearch = !searchVal || b.title.toLowerCase().includes(searchVal) || b.author.toLowerCase().includes(searchVal);
        const matchCat = !activeCat || b.category === activeCat;
        return matchSearch && matchCat;
    });

    // Sort
    if (sortVal === 'title-asc') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortVal === 'title-desc') list.sort((a, b) => b.title.localeCompare(a.title));
    else if (sortVal === 'rating-desc') list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    else if (sortVal === 'category') list.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    // saved-order: keep original userDownloads order
    else list.sort((a, b) => userDownloads.indexOf(Number(a.id)) - userDownloads.indexOf(Number(b.id)));

    grid.innerHTML = '';

    if (list.length === 0 && savedList.length > 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center"><p class="text-slate-400 text-sm font-semibold">No books match your search.</p></div>`;
        lucide.createIcons(); return;
    }

    if (savedList.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><i data-lucide="bookmark" class="w-8 h-8"></i></div>
            <div><h3 class="text-lg font-black text-slate-800">No saved books yet</h3><p class="text-slate-500 text-xs mt-1 mb-6">Browse the catalog and click Save on any book to add it here.</p>
            <button onclick="navigateTo('catalog')" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Explore Catalog</button></div></div>`;
        lucide.createIcons(); return;
    }

    list.forEach(book => grid.appendChild(createBookCard(book)));

    const divs = grid.querySelectorAll(':scope > div');
    if (divs.length) {
        gsap.fromTo(divs,
            { opacity: 0, y: 20, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
        );
    }
    lucide.createIcons();
}

function setSavedCategory(cat) {
    const catFilters = document.getElementById('savedCategoryFilters');
    if (catFilters) catFilters.dataset.active = cat;
    renderSavedBooks();
}

function clearAllSaved() {
    if (!confirm('Remove all saved books from your collection?')) return;
    userDownloads = [];
    saveDownloads();
    renderSavedBooks();
    showNotification('All saved books have been removed.', 'info');
}

// ==================== NEWSLETTER ACTION ====================
function subscribeNewsletter(event) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    if (input && input.value) {
        showNotification(`Subscribed: System logs dispatched to ${input.value}.`, 'success');
        input.value = '';
    }
}

// ==================== CAMPUS PORTAL COLLABORATIVE INTERACTIONS ====================
let bookedRoomsState = JSON.parse(localStorage.getItem('bookedRoomsState')) || {};
let registeredEventsState = JSON.parse(localStorage.getItem('registeredEventsState')) || {};

let _activeRoomNumber = null;

function bookStudyRoom(roomNumber) {
    if (!currentUser) {
        showLoginModal();
        showNotification("Access Denied: Portal Sign In required to book collaboration spaces.", "error");
        return;
    }
    openRoomModal(roomNumber);
}

function openRoomModal(roomNumber) {
    _activeRoomNumber = roomNumber;
    const roomNames = {
        102: "Turing Lounge (102)",
        103: "Da Vinci Annex (103)"
    };
    const title = document.getElementById('roomModalTitle');
    if (title) title.textContent = roomNames[roomNumber] || `Room (${roomNumber})`;

    // Set minimum date to today
    const dateInput = document.getElementById('roomBookDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
        // Keep summary live when date changes
        dateInput.onchange = () => {
            const tVal = document.getElementById('roomBookTime').value;
            if (!tVal) return;
            const dVal = dateInput.value;
            const dFmt = dVal ? new Date(dVal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : '';
            const summaryText = document.getElementById('bookingSummaryText');
            if (summaryText && dFmt) summaryText.textContent = `Booking: ${dFmt} · ${tVal}`;
        };
    }

    // Reset time slots
    document.getElementById('roomBookTime').value = '';
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.classList.remove('border-brand-500', 'bg-brand-600', 'text-white', 'shadow-md');
        btn.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
    });

    // Hide summary
    const summary = document.getElementById('bookingSummary');
    if (summary) summary.classList.add('hidden');

    const modal = document.getElementById('roomBookingModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const card = document.getElementById('roomBookingCard');
    gsap.fromTo(card,
        { scale: 0.88, y: 24, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.38, ease: "back.out(1.5)" }
    );
    lucide.createIcons();
}

function closeRoomModal() {
    const modal = document.getElementById('roomBookingModal');
    const card = document.getElementById('roomBookingCard');
    gsap.to(card, {
        scale: 0.88, y: 24, opacity: 0, duration: 0.22, ease: "power2.in",
        onComplete: () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            _activeRoomNumber = null;
        }
    });
}

function selectTimeSlot(btn, timeValue) {
    // Reset all buttons
    document.querySelectorAll('.time-slot-btn').forEach(b => {
        b.classList.remove('border-brand-500', 'bg-brand-600', 'text-white', 'shadow-md');
        b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
    });
    // Highlight selected
    btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-600');
    btn.classList.add('border-brand-500', 'bg-brand-600', 'text-white', 'shadow-md');
    document.getElementById('roomBookTime').value = timeValue;

    // Show summary
    const dateInput = document.getElementById('roomBookDate');
    const dateVal = dateInput ? dateInput.value : '';
    const dateFormatted = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : '';
    const summary = document.getElementById('bookingSummary');
    const summaryText = document.getElementById('bookingSummaryText');
    if (summary && summaryText && dateFormatted) {
        summaryText.textContent = `Booking: ${dateFormatted} · ${timeValue}`;
        summary.classList.remove('hidden');
        summary.classList.add('flex');
    }
}

function confirmRoomBooking() {
    const roomNumber = _activeRoomNumber;
    const dateVal = document.getElementById('roomBookDate').value;
    const timeVal = document.getElementById('roomBookTime').value;

    if (!dateVal) {
        showNotification("Please select a reservation date.", "error");
        return;
    }
    if (!timeVal) {
        showNotification("Please select a time slot.", "error");
        return;
    }

    const roomNames = { 102: "Turing Lounge (102)", 103: "Da Vinci Annex (103)" };
    const roomName = roomNames[roomNumber] || `Room (${roomNumber})`;
    const dateFormatted = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });

    bookedRoomsState[roomNumber] = { date: dateVal, time: timeVal };
    localStorage.setItem('bookedRoomsState', JSON.stringify(bookedRoomsState));

    // Update room UI
    const badge = document.getElementById(`badgeRoom${roomNumber}`);
    const btn = document.getElementById(`btnRoom${roomNumber}`);
    const border = document.getElementById(`borderRoom${roomNumber}`);
    const seatLayout = document.getElementById(`seatLayout${roomNumber}`);

    if (badge) {
        badge.textContent = "Reserved";
        badge.className = "px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black tracking-wider uppercase rounded-md shadow-sm";
        gsap.fromTo(badge, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: "back.out" });
    }
    if (border) border.className = "absolute inset-x-0 top-0 h-1 bg-rose-500 transition-colors duration-300";
    if (seatLayout) {
        seatLayout.querySelectorAll('span').forEach(s => {
            s.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/10";
        });
        gsap.fromTo(seatLayout.querySelectorAll('span'), { scale: 0.7 }, { scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out" });
    }
    if (btn) {
        btn.textContent = `Reserved · ${timeVal.split('–')[0].trim()}`;
        btn.disabled = true;
        btn.className = "w-full py-3 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl cursor-not-allowed border border-slate-200/50";
    }

    closeRoomModal();
    showNotification(`✓ ${roomName} reserved for ${dateFormatted}, ${timeVal}`, "success");
}

function registerEvent(eventIndex) {
    if (!currentUser) {
        showLoginModal();
        showNotification("Access Denied: Portal Sign In required to register for masterclasses.", "error");
        return;
    }

    const eventTitles = {
        1: "Decentralized AI & Cognitive Infrastructures",
        2: "Post-Structural Literature in the Digital Era",
        3: "Fintech Sovereignty & Modern Business Engines"
    };

    registeredEventsState[eventIndex] = true;
    localStorage.setItem('registeredEventsState', JSON.stringify(registeredEventsState));

    const btn = document.getElementById(`btnEvent${eventIndex}`);
    if (btn) {
        btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Seat Verified ✓</span>`;
        btn.disabled = true;
        btn.className = "w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-250 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed";

        gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "back.out" });
        lucide.createIcons();
    }

    showNotification(`RSVP Verified: Seat secured for "${eventTitles[eventIndex]}".`, "success");
}

function toggleFAQ(faqIndex) {
    const content = document.getElementById(`faqContent${faqIndex}`);
    const icon = document.getElementById(`faqIcon${faqIndex}`);
    const card = document.getElementById(`faqCard${faqIndex}`);

    if (!content || !icon) return;

    const isHidden = content.classList.contains('hidden');

    if (isHidden) {
        // Show instantly — measure real height then animate via max-height
        content.classList.remove('hidden');
        const fullHeight = content.scrollHeight;
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.28s ease, opacity 0.2s ease';

        // Trigger reflow so transition fires immediately
        content.getBoundingClientRect();
        content.style.maxHeight = fullHeight + 'px';
        content.style.opacity = '1';

        gsap.to(icon, { rotate: 180, duration: 0.22 });
        if (card) {
            const iconBox = card.querySelector('.faq-icon-box');
            let borderClass = 'border-brand-500/35';
            let bgClass = 'bg-brand-50/5';
            if (iconBox) {
                const originalBg = iconBox.dataset.originalBg || 'bg-brand-600';
                if (originalBg.includes('accent')) {
                    borderClass = 'border-accent-500/35';
                    bgClass = 'bg-accent-50/5';
                } else if (originalBg.includes('amber')) {
                    borderClass = 'border-amber-500/35';
                    bgClass = 'bg-amber-50/5';
                } else if (originalBg.includes('emerald')) {
                    borderClass = 'border-emerald-500/35';
                    bgClass = 'bg-emerald-50/5';
                } else if (originalBg.includes('rose')) {
                    borderClass = 'border-rose-500/35';
                    bgClass = 'bg-rose-50/5';
                }
            }
            card.classList.add(borderClass, bgClass, 'shadow-md');
            card.classList.remove('hover:bg-slate-50/30');
            if (iconBox) {
                const expandedBg = iconBox.dataset.expandedBg || 'bg-brand-50';
                const expandedText = iconBox.dataset.expandedText || 'text-brand-600';
                iconBox.classList.remove('bg-brand-600', 'bg-accent-600', 'bg-amber-600', 'bg-emerald-600', 'bg-rose-600', 'text-white');
                iconBox.classList.add(expandedBg, expandedText);
            }
        }
    } else {
        const fullHeight = content.scrollHeight;
        content.style.maxHeight = fullHeight + 'px';
        content.style.overflow = 'hidden';
        content.style.transition = 'max-height 0.22s ease, opacity 0.18s ease';

        content.getBoundingClientRect();
        content.style.maxHeight = '0px';
        content.style.opacity = '0';

        gsap.to(icon, { rotate: 0, duration: 0.2 });
        if (card) {
            card.classList.remove(
                'border-brand-500/35', 'bg-brand-50/5',
                'border-accent-500/35', 'bg-accent-50/5',
                'border-amber-500/35', 'bg-amber-50/5',
                'border-emerald-500/35', 'bg-emerald-50/5',
                'border-rose-500/35', 'bg-rose-50/5',
                'shadow-md'
            );
            card.classList.add('hover:bg-slate-50/30');
            const iconBox = card.querySelector('.faq-icon-box');
            if (iconBox) {
                iconBox.classList.remove('bg-brand-50', 'text-brand-600', 'bg-cyan-50', 'text-cyan-600', 'bg-violet-50', 'text-violet-600', 'bg-emerald-50', 'text-emerald-600', 'bg-amber-50', 'text-amber-600', 'bg-rose-50', 'text-rose-600');
                const originalBg = iconBox.dataset.originalBg || 'bg-brand-600';
                iconBox.classList.add(originalBg, 'text-white');
            }
        }

        content.addEventListener('transitionend', function handler() {
            content.classList.add('hidden');
            content.style.maxHeight = '';
            content.style.opacity = '';
            content.style.transition = '';
            content.removeEventListener('transitionend', handler);
        });
    }
}

// Restore interaction state on app initialization
function restoreCampusStates() {
    // Rooms
    Object.keys(bookedRoomsState).forEach(roomNumber => {
        if (bookedRoomsState[roomNumber]) {
            const badge = document.getElementById(`badgeRoom${roomNumber}`);
            const btn = document.getElementById(`btnRoom${roomNumber}`);
            const border = document.getElementById(`borderRoom${roomNumber}`);
            const seatLayout = document.getElementById(`seatLayout${roomNumber}`);

            if (badge) {
                badge.textContent = "Occupied";
                badge.className = "px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black tracking-wider uppercase rounded-md shadow-sm";
            }
            if (border) {
                border.className = "absolute inset-x-0 top-0 h-1 bg-rose-500";
            }
            if (seatLayout) {
                const seats = seatLayout.querySelectorAll('span');
                seats.forEach(seat => {
                    seat.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/10";
                });
            }
            if (btn) {
                btn.textContent = "Occupied until 5:00 PM";
                btn.disabled = true;
                btn.className = "w-full py-3 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl cursor-not-allowed border border-slate-200/50";
            }
        }
    });

    // Events
    Object.keys(registeredEventsState).forEach(eventIndex => {
        if (registeredEventsState[eventIndex]) {
            const btn = document.getElementById(`btnEvent${eventIndex}`);
            if (btn) {
                btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Seat Verified ✓</span>`;
                btn.disabled = true;
                btn.className = "w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-250 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed";
            }
        }
    });
}

// Intercept original init logic to append restoring campus states
const originalInit = initializeApp;
initializeApp = function () {
    originalInit();
    restoreCampusStates();
};


// Close modals + custom dropdowns when clicking outside
document.addEventListener('click', function (e) {
    // Modals — close when clicking the backdrop overlay directly
    const loginModal = document.getElementById('loginModal');
    const bookModal = document.getElementById('bookModal');
    if (e.target === loginModal) closeLoginModal();
    if (e.target === bookModal) closeBookModal();

    // Custom select dropdowns — close when clicking outside any container
    if (!e.target.closest('.custom-select-container')) {
        closeAllCustomSelects();
    }

    // User nav dropdown — close when clicking outside
    if (!e.target.closest('#navUser')) {
        closeUserDropdown();
    }
});

// ==================== INITIALIZE APP SYSTEM BOOT ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ==================== PREMIUM CUSTOM SELECTS SYSTEM ====================
function initCustomSelects() {
    document.querySelectorAll('.custom-select-container').forEach(container => {
        const selectId = container.getAttribute('data-select-id');
        const trigger = container.querySelector('button');
        const menu = container.querySelector('.select-options-menu');
        const label = container.querySelector('.custom-select-label');
        const chevron = container.querySelector('.select-chevron');
        const originalSelect = document.getElementById(selectId);

        if (!trigger || !menu || !originalSelect) return;

        // Sync label with initial value of original select
        const currentVal = originalSelect.value;
        const matchingOpt = menu.querySelector(`[data-value="${currentVal}"]`);
        if (matchingOpt) {
            label.textContent = matchingOpt.textContent;
        }

        // Toggle dropdown on trigger click
        trigger.onclick = (e) => {
            e.stopPropagation();
            const isHidden = menu.classList.contains('hidden');

            // Close all other custom selects first
            closeAllCustomSelects();

            if (isHidden) {
                menu.classList.remove('hidden');
                gsap.fromTo(menu,
                    { scale: 0.95, opacity: 0, y: -5 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
                );
                if (chevron) gsap.to(chevron, { rotation: 180, duration: 0.2 });
            }
        };

        // Option selection click
        menu.querySelectorAll('[data-value]').forEach(option => {
            option.onclick = (e) => {
                e.stopPropagation();
                const val = option.getAttribute('data-value');
                originalSelect.value = val;
                label.textContent = option.textContent;

                // Trigger change event programmatically
                originalSelect.dispatchEvent(new Event('change'));

                closeAllCustomSelects();
            };
        });
    });
}

function closeAllCustomSelects() {
    document.querySelectorAll('.custom-select-container .select-options-menu').forEach(menu => {
        if (!menu.classList.contains('hidden')) {
            const container = menu.closest('.custom-select-container');
            const chevron = container ? container.querySelector('.select-chevron') : null;

            gsap.to(menu, {
                scale: 0.95,
                opacity: 0,
                y: -5,
                duration: 0.15,
                ease: "power2.in",
                onComplete: () => {
                    menu.classList.add('hidden');
                }
            });
            if (chevron) gsap.to(chevron, { rotation: 0, duration: 0.15 });
        }
    });
}

function syncCustomSelects() {
    document.querySelectorAll('.custom-select-container').forEach(container => {
        const selectId = container.getAttribute('data-select-id');
        const label = container.querySelector('.custom-select-label');
        const menu = container.querySelector('.select-options-menu');
        const originalSelect = document.getElementById(selectId);

        if (label && originalSelect && menu) {
            const val = originalSelect.value;
            const matchingOpt = menu.querySelector(`[data-value="${val}"]`);
            if (matchingOpt) {
                label.textContent = matchingOpt.textContent;
            }
        }
    });
}
