// ==================== STATE MANAGEMENT ====================
let allBooks = [];
let userDownloads = [];
let currentUser = null;
let currentRole = null;
let currentSection = 'home';
let featuredStartIndex = 0;
let selectedBookForModal = null;

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

    // Update total count badge
    if (badge) badge.textContent = `${allBooks.length} Volumes Cataloged`;

    grid.innerHTML = KNOWLEDGE_AREAS_CONFIG.map(area => {
        const count = allBooks.filter(b => b.category === area.category).length;
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
            const isInPages = window.location.pathname.includes('/pages/');
            const response = await axios.get(isInPages ? '../data/books.json' : 'data/books.json');
            allBooks = response.data;
        }

        // Deterministic mock enterprise field injection
        allBooks = allBooks.map(book => {
            if (true) { // Re-inject or override semesters to get perfect 1st-8th Semester coverage
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

        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));

        // Update home stats UI
        const heroBookCount = document.getElementById('heroBookCount');
        if (heroBookCount) heroBookCount.textContent = allBooks.length;

        const pageId = getCurrentPageId();
        if (pageId === 'home') renderFeaturedSlider();
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

        localStorage.setItem('libraryBooks', JSON.stringify(allBooks));

        const heroBookCount2 = document.getElementById('heroBookCount');
        if (heroBookCount2) heroBookCount2.textContent = allBooks.length;

        const fallbackPageId = getCurrentPageId();
        if (fallbackPageId === 'home') { if (typeof renderFeaturedSlider === 'function') renderFeaturedSlider(); }
        if (fallbackPageId === 'catalog') { if (typeof renderCatalogGrid === 'function') renderCatalogGrid(); }
        if (fallbackPageId === 'admin') { if (document.getElementById('adminBooksTable')) updateAdminTable(); }
        if (fallbackPageId === 'saved') renderSavedBooks();
        if (fallbackPageId === 'dashboard') renderDashboardPortfolio();

        showNotification("Loaded local fallback catalog due to file system security rules.", "success");
    }
}

function saveDatabase() {
    localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
    updateLibraryStats();
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

function updateLibraryStats() {
    const adminTotalCount = document.getElementById('adminTotalCount');
    const heroBookCount = document.getElementById('heroBookCount');

    if (adminTotalCount) adminTotalCount.textContent = allBooks.length;
    if (heroBookCount) heroBookCount.textContent = allBooks.length;
}

// ==================== APP BOOTSTRAPPING ====================
function initializeApp() {
    loadDownloads();
    initUserSession();   // ← Must run BEFORE fetchCatalogDatabase so currentUser is set
    fetchCatalogDatabase();
    checkPageSecurity();
    updateActiveNavLinkStyle();
    initCustomSelects();

    // Refresh lucide icons initially
    lucide.createIcons();

    // Run introductory animation
    animateIntro();
}

// ==================== INTRODUCTORY ANIMATIONS ====================
function animateIntro() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Header slides in
    tl.fromTo("header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 });

    const pageId = getCurrentPageId();
    if (pageId === 'home') {
        tl// Badge pill
            .fromTo("#heroSection .inline-flex", { y: 12, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.4 }, "-=0.2")

            // h1 lines cascade
            .fromTo("#heroSection h1", { y: 30, opacity: 0, clipPath: "inset(100% 0% 0% 0%)" }, { y: 0, opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.6 }, "-=0.25")

            // Subparagraph
            .fromTo("#heroSection > div p.text-slate-500", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, "-=0.3")

            // Buttons
            .fromTo("#heroSection button", { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.4 }, "-=0.2")

            // Trust bar
            .fromTo("#heroSection .flex.-space-x-2.5 > *", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.07, duration: 0.3, ease: "back.out(2)" }, "-=0.15")

            // Stat cards — lift in with stagger
            .fromTo("#heroSection .grid.grid-cols-2 > div", { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, stagger: 0.09, duration: 0.45 }, "-=0.2")

            // Live status bar
            .fromTo("#heroSection .mt-4.bg-white", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, "-=0.1")

            // Floating elements pop in after main content
            .fromTo(".float-el, .float-el-slow, .float-el-reverse",
                { scale: 0.7, opacity: 0, y: 20 },
                { scale: 1, opacity: 1, y: 0, stagger: 0.15, duration: 0.55, ease: "back.out(1.5)" },
                "-=0.1"
            );
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
    document.querySelectorAll('[data-animate="stagger-cards"] svg path').forEach((path, i) => {
        const length = path.getTotalLength ? path.getTotalLength() : 200;
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.inOut",
            delay: i * 0.15,
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
    const savedRole = localStorage.getItem('currentRole');
    const savedUser = localStorage.getItem('currentUser');

    if (savedRole && savedUser) {
        currentRole = savedRole;
        currentUser = savedUser;
        updateSessionUI();
    }
}

// Dialog selectors configurations
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    gsap.fromTo(modal.querySelector('.modal-card'),
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.5)" }
    );
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
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

function login(role) {
    currentRole = role;
    currentUser = role === 'admin' ? 'Admin Manager' : 'Academic Reader';

    localStorage.setItem('currentRole', currentRole);
    localStorage.setItem('currentUser', currentUser);

    updateSessionUI();
    closeLoginModal();
    showNotification(`Portal Authentication Verified: Welcome, ${currentUser}`, 'success');

    if (role === 'admin') {
        navigateTo('admin');
    } else {
        navigateTo('saved');
    }
}

function logout() {
    currentRole = null;
    currentUser = null;
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');

    updateSessionUI();
    navigateTo('home');
    showNotification("Session closed successfully.", "info");
}

function updateSessionUI() {
    const loginBtn = document.getElementById('loginBtn');
    const navUser = document.getElementById('navUser');
    const navUserName = document.getElementById('navUserName');
    const navUserRole = document.getElementById('navUserRole');
    const userAvatar = document.getElementById('userAvatar');

    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserRole = document.getElementById('dropdownUserRole');
    const dropdownDashboardLink = document.getElementById('dropdownDashboardLink');
    const dropdownAdminLink = document.getElementById('dropdownAdminLink');
    const dropdownSavedLink = document.getElementById('dropdownSavedLink');

    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');
    const footerLibraryLink = document.getElementById('footerLibraryLink');

    const mobileDashboardLink = document.getElementById('mobileDashboardLink');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    const savedNavLink = document.getElementById('savedNavLink');

    if (currentUser) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (navUser) { navUser.classList.remove('hidden'); navUser.classList.add('flex'); }

        if (navUserName) navUserName.textContent = currentUser;
        if (navUserRole) navUserRole.textContent = currentRole.toUpperCase();
        if (userAvatar) userAvatar.textContent = currentUser.charAt(0);
        if (dropdownUserName) dropdownUserName.textContent = currentUser;
        if (dropdownUserRole) dropdownUserRole.textContent = currentRole.toUpperCase();

        // Saved Books link visible for ALL logged-in users
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
        } else {
            if (dashboardLink) dashboardLink.classList.remove('hidden');
            if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
            if (footerLibraryLink) footerLibraryLink.classList.remove('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
            if (dropdownDashboardLink) dropdownDashboardLink.classList.remove('hidden');
            if (dropdownAdminLink) dropdownAdminLink.classList.add('hidden');
        }
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (navUser) navUser.classList.add('hidden');
        if (savedNavLink) savedNavLink.classList.add('hidden');
        if (dashboardLink) dashboardLink.classList.add('hidden');
        if (mobileDashboardLink) mobileDashboardLink.classList.add('hidden');
        if (footerLibraryLink) footerLibraryLink.classList.add('hidden');
        if (adminLink) adminLink.classList.add('hidden');
        if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
        if (dropdownSavedLink) dropdownSavedLink.classList.add('hidden');
    }

    lucide.createIcons();
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

    // Animate in
    gsap.fromTo(portal,
        { scale: 0.95, opacity: 0, y: -4 },
        { scale: 1, opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }
    );

    // Adjust position if dropdown goes off-screen
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
    return 'home';
}

function checkPageSecurity() {
    const pageId = getCurrentPageId();
    const isInPages = window.location.pathname.includes('/pages/');
    const homeRedirect = isInPages ? '../index.html' : 'index.html';

    // Only hard-redirect admins away from admin panel if they lack the role
    if (pageId === 'admin' && currentRole !== 'admin') {
        window.location.href = homeRedirect;
        localStorage.setItem('securityAlert', 'Admin privileges required.');
    }
    // Dashboard: both 'user' and 'admin' roles may view it.
    // If not logged in at all, we stay on the page but render a sign-in prompt (handled in renderDashboardPortfolio).

    // Display pending security notifications
    const pendingAlert = localStorage.getItem('securityAlert');
    if (pendingAlert) {
        setTimeout(() => {
            showNotification(pendingAlert, 'error');
            localStorage.removeItem('securityAlert');
        }, 300);
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
}

function navigateTo(sectionId) {
    const currentPage = getCurrentPageId();
    if (sectionId === currentPage) return;

    // Deactivate mobile drawer if active
    const drawer = document.getElementById('mobileDrawer');
    if (drawer && !drawer.classList.contains('hidden')) {
        toggleMobileMenu();
    }

    const isInPages = window.location.pathname.includes('/pages/');
    let targetPage = isInPages ? '../index.html' : 'index.html';
    if (sectionId === 'catalog') targetPage = isInPages ? 'catalog.html' : 'pages/catalog.html';
    else if (sectionId === 'dashboard') targetPage = isInPages ? 'dashboard.html' : 'pages/dashboard.html';
    else if (sectionId === 'admin') targetPage = isInPages ? 'admin.html' : 'pages/admin.html';
    else if (sectionId === 'saved') targetPage = isInPages ? 'saved.html' : 'pages/saved.html';

    window.location.href = targetPage;
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

        // Premium rotate-pop transition using GSAP
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

    // Build coverflow cards from books
    coverflowBooks = allBooks.slice(0, Math.min(allBooks.length, 8));
    currentCoverflowIndex = Math.floor(coverflowBooks.length / 2);

    coverflowBooks.forEach((book, index) => {
        const card = document.createElement('div');
        card.className = 'coverflow-book';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="coverflow-book-cover">
                <img src="${book.cover}" alt="${book.title}"
                     onerror="this.src='https://picsum.photos/seed/${encodeURIComponent(book.title)}/300/450';">
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

    grid.innerHTML = '';

    allBooks.forEach(book => {
        grid.appendChild(createBookCard(book));
    });

    gsap.fromTo("#booksGrid > div",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
    );

    lucide.createIcons();
    updateCatalogStats();
}

function createBookCard(book) {
    const bookIdNum = Number(book.id);
    const isSaved = userDownloads.some(id => Number(id) === bookIdNum);
    const card = document.createElement('div');
    card.className = "bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-brand-500/25 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group shadow-sm p-4 relative text-left";

    // Choose dynamic text color based on category for enhanced micro-aesthetics
    const categoryTextColors = {
        "Technology": "text-indigo-600",
        "Science": "text-cyan-600",
        "Fiction": "text-pink-600",
        "History": "text-amber-600",
        "Business": "text-emerald-600"
    };
    const categoryTextColor = categoryTextColors[book.category] || "text-slate-400";

    card.innerHTML = `
        <!-- Book Cover with Premium Hover Overlay -->
        <div class="relative w-full aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-300">
            <img src="${book.cover}" alt="${book.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://picsum.photos/seed/${encodeURIComponent(book.title)}/300/400';">
            <div class="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 backdrop-blur-[2px]">
                <button onclick="openBookModal(${book.id})" class="px-6 py-2.5 bg-white/95 text-slate-900 rounded-xl text-xs font-extrabold active:scale-95 transition-transform shadow-md hover:bg-white hover:text-brand-600 flex items-center gap-1.5">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                    <span>Inspect Details</span>
                </button>
            </div>
        </div>
        
        <!-- Book Details context block -->
        <div class="pt-4 px-1 flex-grow flex flex-col justify-between text-left">
            <div>
                <!-- Curated Category Tag -->
                <span class="text-[9px] font-black tracking-widest ${categoryTextColor} uppercase block mb-1.5">${book.category}</span>
                
                <!-- Highly polished title -->
                <h4 class="font-extrabold text-[15px] text-slate-800 line-clamp-2 group-hover:text-brand-600 transition-colors duration-200 leading-snug cursor-pointer" onclick="openBookModal(${book.id})">${book.title}</h4>
                
                <!-- Subtitle Author -->
                <p class="text-[12px] font-medium text-slate-400 mt-1 line-clamp-1">by ${book.author}</p>
            </div>
            
            <!-- Bottom Interactive Controls Row -->
            <div class="flex justify-between items-center mt-5 pt-3 border-t border-slate-100/80">
                <!-- Rating Indicators -->
                <span class="text-[12px] font-extrabold text-amber-500 flex items-center gap-1">
                    <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                    <span>${book.rating || '4.5'}</span>
                </span>
                
                <!-- Premium Toggle bookmark/save indicator -->
                <button onclick="event.stopPropagation(); quickBuffer(${book.id});" 
                        class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all duration-200 select-none ${isSaved
            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100'
            : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50/50'
        }" 
                        title="${isSaved ? 'Buffered Locally' : 'Buffer to Offline Cache'}">
                    <i data-lucide="${isSaved ? 'check' : 'bookmark'}" class="w-3.5 h-3.5 ${isSaved ? 'stroke-[2.5]' : ''}"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">${isSaved ? 'SAVED' : 'SAVE'}</span>
                </button>
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

    gsap.fromTo("#booksGrid > div",
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.35, stagger: 0.03 }
    );

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

    if (totalCountEl) totalCountEl.textContent = allBooks.length;
    if (availableCountEl) {
        availableCountEl.textContent = allBooks.filter(b => b.status === 'Available').length;
    }
    if (reservedCountEl) {
        reservedCountEl.textContent = allBooks.filter(b => b.status === 'Reserved').length;
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
                    <button onclick="showLoginModal()" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Portal Access</button>
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
        const savedList = allBooks.filter(b => userDownloads.some(id => Number(id) === Number(b.id)));

        if (savedList.length === 0) {
            userGrid.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div class="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                        <i data-lucide="cloud-lightning" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-slate-800">Offline database cache is empty</h3>
                        <p class="text-slate-500 text-xs mt-1 mb-6">Buffer books from the discovery catalog to build your offline portfolio.</p>
                        <button onclick="navigateTo('catalog')" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Explore Catalog</button>
                    </div>
                </div>
            `;
        } else {
            savedList.forEach(book => {
                userGrid.appendChild(createBookCard(book));
            });
            gsap.fromTo('#userBooksGrid > div',
                { opacity: 0, y: 20, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
            );
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

        gsap.fromTo(activePanel.querySelectorAll('.books-grid > div'),
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }
        );
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
    }
}

function updateAdminTable() {
    const tbody = document.getElementById('adminBooksTable');
    if (!tbody) return;

    const totalPages = Math.ceil(allBooks.length / ADMIN_PER_PAGE);
    if (adminCurrentPage > totalPages) adminCurrentPage = 1;
    const start = (adminCurrentPage - 1) * ADMIN_PER_PAGE;
    const pageBooks = allBooks.slice(start, start + ADMIN_PER_PAGE);

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

function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const category = document.getElementById('bookCategory').value;
    const department = document.getElementById('bookDept').value;
    const semester = document.getElementById('bookSemester').value;
    const status = document.getElementById('bookStatus').value;
    const copiesTotal = parseInt(document.getElementById('bookCopiesTotal').value) || 5;
    const copiesAvailable = parseInt(document.getElementById('bookCopiesAvailable').value) || 5;
    const isbn = document.getElementById('bookISBN').value.trim();
    const cover = document.getElementById('bookCover').value.trim();
    const description = document.getElementById('bookDescription').value.trim();

    if (!title || !author || !isbn || !description) {
        showNotification("Indexing error: Please fill all metadata fields.", "error");
        return;
    }

    const finalCover = cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80";

    const newRecord = {
        id: Date.now(),
        title,
        author,
        category,
        department,
        semester,
        status,
        copiesTotal,
        copiesAvailable,
        isbn,
        cover: finalCover,
        description,
        rating: 4.5,
        yearPublished: new Date().getFullYear(),
        pages: 380,
        publisher: "Bibliotheca Press"
    };

    allBooks.push(newRecord);
    saveDatabase();

    // Reset forms
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookISBN').value = '';
    document.getElementById('bookCover').value = '';
    document.getElementById('bookDescription').value = '';
    document.getElementById('bookCopiesTotal').value = '5';
    document.getElementById('bookCopiesAvailable').value = '5';

    // Reset selects to defaults
    document.getElementById('bookCategory').value = 'Technology';
    document.getElementById('bookDept').value = 'Computer Science';
    document.getElementById('bookSemester').value = '1st Semester';
    document.getElementById('bookStatus').value = 'Available';

    syncCustomSelects();

    showNotification(`Volume "${title}" successfully cataloged.`, "success");

    // Switch to database list view
    switchAdminTab('manageBooks', document.querySelector('.admin-tab'));
    renderFeaturedCarousel();
}

let bookIdToDelete = null;

function deleteBookRecord(bookId) {
    const record = allBooks.find(b => String(b.id) === String(bookId));
    if (!record) return;

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
    const record = allBooks.find(b => String(b.id) === String(bookId));
    if (!record) return;

    document.getElementById('editBookId').value = record.id;
    document.getElementById('editBookTitle').value = record.title;
    document.getElementById('editBookAuthor').value = record.author;
    document.getElementById('editBookCategory').value = record.category;
    document.getElementById('editBookDept').value = record.department || "General Education";
    document.getElementById('editBookSemester').value = record.semester || "1st Semester";
    document.getElementById('editBookStatus').value = record.status || "Available";
    document.getElementById('editBookCopiesTotal').value = record.copiesTotal !== undefined ? record.copiesTotal : 5;
    document.getElementById('editBookCopiesAvailable').value = record.copiesAvailable !== undefined ? record.copiesAvailable : 5;
    document.getElementById('editBookISBN').value = record.isbn;
    document.getElementById('editBookCover').value = record.cover;
    document.getElementById('editBookDescription').value = record.description;

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
    selectedBookForModal = allBooks.find(b => b.id === bookId);
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
        btn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i> <span>Buffer Offline</span>`;
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
            <button onclick="showLoginModal()" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Portal Access</button></div></div>`;
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

    gsap.fromTo('#savedBooksGrid > div',
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out' }
    );
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
            card.classList.add('border-brand-500/35', 'bg-brand-50/5', 'shadow-md');
            card.classList.remove('hover:bg-slate-50/30');
            const iconBox = card.querySelector('.faq-icon-box');
            if (iconBox) {
                const expandedBg = iconBox.dataset.expandedBg || 'bg-brand-50';
                const expandedText = iconBox.dataset.expandedText || 'text-brand-600';
                iconBox.classList.remove('bg-brand-600', 'bg-cyan-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'text-white');
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
            card.classList.remove('border-brand-500/35', 'bg-brand-50/5', 'shadow-md');
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
