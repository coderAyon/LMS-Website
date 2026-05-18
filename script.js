// ==================== State Management ====================
let currentUser = null;
let currentRole = null;
let currentSection = 'home';
let allBooks = [];
let userDownloads = [];
let currentSlideIndex = 0;
let currentBookPreviewIndex = 0;
let selectedBookForModal = null;
let slideshowInterval = null;
let currentCoverflowIndex = 0;
let coverflowBooks = [];
let touchStartX = 0;
let touchEndX = 0;
let coverflowInterval = null;

// ==================== Initialize Application ====================
function initializeApp() {
    loadBooksFromStorage();
    updateStats();
    renderFeaturedSlider();
    renderBooksGrid();
    updateUserInterface();

    // Add keyboard navigation for coverflow (only once)
    document.addEventListener('keydown', handleCoverflowKeyboard);
}

// ==================== Login & Authentication ====================
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function login(role) {
    currentRole = role;
    currentUser = role === 'admin' ? 'Admin User' : 'Library User';
    localStorage.setItem('currentRole', role);
    localStorage.setItem('currentUser', currentUser);
    updateUserInterface();
    closeLoginModal();
    showNotification(`Logged in as ${role}`, 'success');
}

function logout() {
    currentUser = null;
    currentRole = null;
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');
    userDownloads = [];
    updateUserInterface();
    navigateTo('home');
    showNotification('Logged out successfully', 'info');
}

function updateUserInterface() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');
    const adminBtn = document.getElementById('adminBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');

    // Load from localStorage
    const storedRole = localStorage.getItem('currentRole');
    const storedUser = localStorage.getItem('currentUser');

    if (storedRole) {
        currentRole = storedRole;
        currentUser = storedUser;
    }

    if (currentRole) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userInfo.style.display = 'flex';
        userName.textContent = currentUser;
        userRole.textContent = currentRole.toUpperCase();

        if (currentRole === 'admin') {
            adminBtn.style.display = 'block';
            dashboardBtn.style.display = 'none';
        } else {
            dashboardBtn.style.display = 'block';
            adminBtn.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        adminBtn.style.display = 'none';
        dashboardBtn.style.display = 'none';
    }
}

// ==================== Navigation ====================
function navigateTo(section) {
    // Hide all sections
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('catalogSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';

    // Remove active state from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    currentSection = section;

    // Show selected section
    switch (section) {
        case 'home':
            document.getElementById('homeSection').style.display = 'block';
            document.getElementById('homeBtn').classList.add('active');
            renderFeaturedSlider();
            break;
        case 'catalog':
            document.getElementById('catalogSection').style.display = 'block';
            document.getElementById('catalogBtn').classList.add('active');
            filterBooks();
            break;
        case 'dashboard':
            if (currentRole === 'user') {
                document.getElementById('dashboardSection').style.display = 'block';
                document.getElementById('dashboardBtn').classList.add('active');
                loadUserBooks();
            } else {
                showNotification('Access Denied', 'error');
            }
            break;
        case 'admin':
            if (currentRole === 'admin') {
                document.getElementById('adminSection').style.display = 'block';
                document.getElementById('adminBtn').classList.add('active');
                loadAdminBooks();
            } else {
                showNotification('Access Denied', 'error');
            }
            break;
    }
}

// Sample books data with reliable placeholder images
const sampleBooks = [
    {
        id: 1,
        title: "The Future of AI",
        author: "John Smith",
        category: "Technology",
        description: "Explore latest advancements in artificial intelligence and machine learning with practical insights and real-world applications.",
        cover: "https://picsum.photos/seed/ai-future/300/450",
        previewImages: [
            "https://picsum.photos/seed/ai-preview1/600/800",
            "https://picsum.photos/seed/ai-preview2/600/800",
            "https://picsum.photos/seed/ai-preview3/600/800"
        ],
        isbn: "978-1234567890",
        downloads: 1523,
        pages: 342,
        rating: 4.5,
        yearPublished: 2023,
        publisher: "TechPress Publishing",
        language: "English"
    },
    {
        id: 2,
        title: "Quantum Physics Explained",
        author: "Dr. Emily Johnson",
        category: "Science",
        description: "A comprehensive guide to understanding quantum mechanics and its applications in modern technology and scientific research.",
        cover: "https://picsum.photos/seed/quantum-physics/300/450",
        previewImages: [
            "https://picsum.photos/seed/quantum1/600/800",
            "https://picsum.photos/seed/quantum2/600/800"
        ],
        isbn: "978-0987654321",
        downloads: 892,
        pages: 428,
        rating: 4.8,
        yearPublished: 2022,
        publisher: "Science Academic Press",
        language: "English"
    },
    {
        id: 3,
        title: "The Digital Revolution",
        author: "Sarah Williams",
        category: "Technology",
        description: "How digital transformation is reshaping business and society in 21st century. An essential read for modern entrepreneurs.",
        cover: "https://picsum.photos/seed/digital-revolution/300/450",
        previewImages: [
            "https://picsum.photos/seed/digital1/600/800",
            "https://picsum.photos/seed/digital2/600/800"
        ],
        isbn: "978-1122334455",
        downloads: 654,
        pages: 256,
        rating: 4.2,
        yearPublished: 2023,
        publisher: "Digital Future Books",
        language: "English"
    },
    {
        id: 4,
        title: "History of Civilizations",
        author: "Prof. Michael Brown",
        category: "History",
        description: "An in-depth exploration of human civilizations through the ages, from ancient empires to modern nations.",
        cover: "https://picsum.photos/seed/history-civilizations/300/450",
        previewImages: [
            "https://picsum.photos/seed/history1/600/800",
            "https://picsum.photos/seed/history2/600/800"
        ],
        isbn: "978-5566778899",
        downloads: 431,
        pages: 512,
        rating: 4.6,
        yearPublished: 2021,
        publisher: "Historical Society Press",
        language: "English"
    },
    {
        id: 5,
        title: "Business Strategy Guide",
        author: "David Lee",
        category: "Business",
        description: "A comprehensive guide to developing effective business strategies in today's competitive market.",
        cover: "https://picsum.photos/seed/business-strategy/300/450",
        previewImages: [
            "https://picsum.photos/seed/business1/600/800",
            "https://picsum.photos/seed/business2/600/800"
        ],
        isbn: "978-6677889900",
        downloads: 723,
        pages: 189,
        rating: 4.3,
        yearPublished: 2022,
        publisher: "Business Excellence Publishing",
        language: "English"
    },
    {
        id: 6,
        title: "Modern Literature",
        author: "Anna Martinez",
        category: "Fiction",
        description: "An exploration of contemporary literary works and their cultural significance in today's world.",
        cover: "https://picsum.photos/seed/modern-literature/300/450",
        previewImages: [
            "https://picsum.photos/seed/literature1/600/800",
            "https://picsum.photos/seed/literature2/600/800"
        ],
        isbn: "978-7788990011",
        downloads: 567,
        pages: 298,
        rating: 4.1,
        yearPublished: 2023,
        publisher: "Literary House",
        language: "English"
    },
    {
        id: 7,
        title: "Environmental Science",
        author: "Dr. Robert Green",
        category: "Science",
        description: "Understanding environmental challenges and sustainable solutions for a better future.",
        cover: "https://picsum.photos/seed/environmental-science/300/450",
        previewImages: [
            "https://picsum.photos/seed/environment1/600/800",
            "https://picsum.photos/seed/environment2/600/800"
        ],
        isbn: "978-8899001122",
        downloads: 345,
        pages: 376,
        rating: 4.7,
        yearPublished: 2022,
        publisher: "Green Earth Publications",
        language: "English"
    },
    {
        id: 8,
        title: "Psychology Today",
        author: "Dr. Lisa Chen",
        category: "Science",
        description: "Modern psychological insights and their applications in everyday life and professional practice.",
        cover: "https://picsum.photos/seed/psychology-today/300/450",
        previewImages: [
            "https://picsum.photos/seed/psychology1/600/800",
            "https://picsum.photos/seed/psychology2/600/800"
        ],
        isbn: "978-9900112233",
        downloads: 678,
        pages: 424,
        rating: 4.4,
        yearPublished: 2021,
        publisher: "Mind & Behavior Press",
        language: "English"
    }
];

function loadBooksFromStorage() {
    // Force refresh with new sample data to fix image issues
    localStorage.removeItem('libraryBooks');
    allBooks = [...sampleBooks];
    localStorage.setItem('libraryBooks', JSON.stringify(allBooks));

    const downloads = localStorage.getItem('userDownloads');
    if (downloads) {
        userDownloads = JSON.parse(downloads);
    }
}

function saveBooksToStorage() {
    localStorage.setItem('libraryBooks', JSON.stringify(allBooks));
}

function saveDownloads() {
    localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
}

// ==================== Admin Functions ====================
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tab + 'Tab').style.display = 'block';
    event.target.classList.add('active');
}

function addBook() {
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const category = document.getElementById('bookCategory').value;
    const description = document.getElementById('bookDescription').value;
    const cover = document.getElementById('bookCover').value;
    const previewImagesStr = document.getElementById('bookPreviewImages').value;
    const isbn = document.getElementById('bookISBN').value;

    if (!title || !author || !description) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const previewImages = previewImagesStr.split(',').map(img => img.trim()).filter(img => img);

    const newBook = {
        id: allBooks.length + 1,
        title,
        author,
        category,
        description,
        cover: cover || 'https://via.placeholder.com/150x220/808080/ffffff?text=No+Cover',
        previewImages: previewImages.length > 0 ? previewImages : ['https://via.placeholder.com/300x400/808080/ffffff?text=No+Preview'],
        isbn,
        downloads: 0
    };

    allBooks.push(newBook);
    saveBooksToStorage();

    // Clear form
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookDescription').value = '';
    document.getElementById('bookCover').value = '';
    document.getElementById('bookPreviewImages').value = '';
    document.getElementById('bookISBN').value = '';

    showNotification('Book added successfully!', 'success');
    updateStats();
}

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        allBooks = allBooks.filter(book => book.id !== bookId);
        saveBooksToStorage();
        loadAdminBooks();
        updateStats();
        showNotification('Book deleted successfully', 'success');
    }
}

function loadAdminBooks() {
    const adminBooksList = document.getElementById('adminBooksList');
    adminBooksList.innerHTML = '';

    allBooks.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'admin-book-item';
        bookItem.innerHTML = `
            <img src="${book.cover}" alt="${book.title}" class="admin-book-cover" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%22100%22%3E%3Crect fill=%234B90E2%22 width=%2280%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📚%3C/text%3E%3C/svg%3E'; this.style.objectFit='contain';">
            <div class="admin-book-details">
                <h4>${book.title}</h4>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Category:</strong> ${book.category}</p>
                <p><strong>ISBN:</strong> ${book.isbn}</p>
                <p><strong>Downloads:</strong> ${book.downloads}</p>
            </div>
            <div class="admin-book-actions">
                <button class="btn btn-secondary" onclick="editBook(${book.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteBook(${book.id})">Delete</button>
            </div>
        `;
        adminBooksList.appendChild(bookItem);
    });
}

function editBook(bookId) {
    showNotification('Edit feature coming soon!', 'info');
}

// ==================== User Dashboard ====================
function switchDashboardTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tab + 'Tab').style.display = 'block';
    event.target.classList.add('active');
}

function loadUserBooks() {
    const userBooksGrid = document.getElementById('userBooksGrid');
    userBooksGrid.innerHTML = '';

    const downloadedBooks = allBooks.filter(book => userDownloads.includes(book.id));

    if (downloadedBooks.length === 0) {
        userBooksGrid.innerHTML = '<p class="empty-message">No books downloaded yet. <a href="#" onclick="navigateTo(\'catalog\')">Browse catalog</a></p>';
        return;
    }

    downloadedBooks.forEach(book => {
        renderBookCard(book, userBooksGrid);
    });

    // Load recommendations
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    recommendationsGrid.innerHTML = '';
    const recommendations = allBooks.filter(book => !userDownloads.includes(book.id)).slice(0, 6);
    recommendations.forEach(book => {
        renderBookCard(book, recommendationsGrid);
    });
}

// ==================== Book Rendering ====================
function renderBooksGrid() {
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';
    allBooks.forEach(book => {
        renderBookCard(book, booksGrid);
    });
}

function renderBookCard(book, container) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.innerHTML = `
        <div class="book-card-image">
            <img src="${book.cover}" alt="${book.title}" loading="lazy" 
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22%3E%3Crect fill=%22%234B90E2%22 width=%22300%22 height=%22450%22/%3E%3Ctext x=%2250%25%22 y=%2240%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📚%3C/text%3E%3Ctext x=%2250%25%22 y=%2260%25%22 font-size=%2216%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${encodeURIComponent(book.title)}%3C/text%3E%3C/svg%3E'; this.style.objectFit='contain';">
            <div class="book-card-overlay">
                <button class="btn btn-primary btn-sm" onclick="openBookModal(${book.id})">View Details</button>
            </div>
        </div>
        <div class="book-card-info">
            <div class="book-title">${book.title}</div>
            <div class="book-author">by ${book.author}</div>
            <div class="book-meta">
                <span class="book-rating">⭐ ${book.rating || '4.0'}</span>
                <span class="book-year">${book.yearPublished || '2023'}</span>
                <span class="book-pages">${book.pages || '300'} pages</span>
            </div>
            <div class="book-actions">
                <button class="btn btn-primary btn-sm" onclick="openBookModal(${book.id})">View Details</button>
                <button class="btn btn-secondary btn-sm" onclick="quickDownload(${book.id})">
                    <span class="download-icon">📥</span> Download
                </button>
            </div>
        </div>
    `;
    container.appendChild(bookCard);
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    filterBooks(); // Re-filter books to show all results
}

function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm);
        const matchesCategory = category === '' || book.category === category;
        return matchesSearch && matchesCategory;
    });

    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '';
    filtered.forEach(book => {
        renderBookCard(book, booksGrid);
    });
}

// ==================== Book Modal ====================
function openBookModal(bookId) {
    selectedBookForModal = allBooks.find(book => book.id === bookId);
    if (!selectedBookForModal) return;

    document.getElementById('modalBookTitle').textContent = selectedBookForModal.title;
    document.getElementById('modalBookAuthor').textContent = `By ${selectedBookForModal.author}`;
    document.getElementById('modalBookISBN').textContent = `ISBN: ${selectedBookForModal.isbn}`;
    document.getElementById('modalBookDescription').textContent = selectedBookForModal.description;

    const coverImg = document.getElementById('modalBookCover');
    coverImg.src = selectedBookForModal.cover;
    coverImg.onerror = function () {
        this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22220%22%3E%3Crect fill=%234B90E2%22 width=%22150%22 height=%22220%22/%3E%3Ctext x=%2250%25%22 y=%2240%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📚%3C/text%3E%3Ctext x=%2250%25%22 y=%2260%25%22 font-size=%2212%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E' + encodeURIComponent(selectedBookForModal.title) + '%3C/text%3E%3C/svg%3E';
        this.style.objectFit = 'contain';
    };

    // Setup preview images
    const bookPreviewSlider = document.getElementById('bookPreviewSlider');
    if (selectedBookForModal.previewImages && selectedBookForModal.previewImages.length > 0) {
        bookPreviewSlider.style.display = 'block';
        renderBookPreviewSlider();
    } else {
        bookPreviewSlider.style.display = 'none';
    }

    // Update download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (currentRole === 'user') {
        downloadBtn.style.display = 'block';
        if (userDownloads.includes(bookId)) {
            downloadBtn.textContent = 'Downloaded ✓';
            downloadBtn.disabled = true;
        } else {
            downloadBtn.textContent = 'Download';
            downloadBtn.disabled = false;
        }
    } else if (currentRole === 'admin') {
        downloadBtn.textContent = 'Download (Admin)';
        downloadBtn.style.display = 'block';
    } else {
        downloadBtn.style.display = 'none';
    }

    document.getElementById('bookModal').style.display = 'block';
    currentBookPreviewIndex = 0;
}

function closeBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}

function downloadBook() {
    if (!currentRole) {
        showNotification('Please login to download books', 'error');
        return;
    }

    if (currentRole !== 'admin' && currentRole !== 'user') {
        showNotification('Invalid access', 'error');
        return;
    }

    if (currentRole === 'user' && !userDownloads.includes(selectedBookForModal.id)) {
        userDownloads.push(selectedBookForModal.id);
        saveDownloads();
        selectedBookForModal.downloads++;
        saveBooksToStorage();

        // Update button
        document.getElementById('downloadBtn').textContent = 'Downloaded ✓';
        document.getElementById('downloadBtn').disabled = true;

        showNotification(`"${selectedBookForModal.title}" downloaded successfully!`, 'success');
    } else if (currentRole === 'admin') {
        showNotification(`Admin: Ready to download "${selectedBookForModal.title}"`, 'success');
    }
}

function quickDownload(bookId) {
    if (!currentRole) {
        showNotification('Please login to download', 'error');
        return;
    }

    const book = allBooks.find(b => b.id === bookId);
    if (currentRole === 'user') {
        if (!userDownloads.includes(bookId)) {
            userDownloads.push(bookId);
            saveDownloads();
            book.downloads++;
            saveBooksToStorage();
            showNotification(`Downloaded "${book.title}"`, 'success');
        } else {
            showNotification(`"${book.title}" already downloaded`, 'info');
        }
    } else if (currentRole === 'admin') {
        showNotification(`Admin: Book "${book.title}" ready for download`, 'success');
    }
}

function readBook() {
    showNotification('Read online feature coming soon!', 'info');
}

// ==================== Image Sliders ====================
function renderFeaturedSlider() {
    const coverflowBooksContainer = document.getElementById('coverflowBooks');
    const coverflowIndicators = document.getElementById('coverflowIndicators');
    const coverflowCarousel = document.querySelector('.coverflow-carousel');

    coverflowBooksContainer.innerHTML = '';
    coverflowIndicators.innerHTML = '';

    // Get featured books (first 6 books)
    coverflowBooks = allBooks.slice(0, 6);

    // Create coverflow book elements
    coverflowBooks.forEach((book, index) => {
        const bookElement = document.createElement('div');
        bookElement.className = 'coverflow-book';
        bookElement.dataset.index = index;
        bookElement.innerHTML = `
            <div class="coverflow-book-cover">
                <img src="${book.cover}" alt="${book.title}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22%3E%3Crect fill=%22%234B90E2%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2240%25%22 font-size=%2216%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📚%3C/text%3E%3Ctext x=%2250%25%22 y=%2260%25%22 font-size=%2212%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${encodeURIComponent(book.title)}%3C/text%3E%3C/svg%3E'; this.style.objectFit='cover';">
            </div>
            <div class="coverflow-book-info">
                <div class="coverflow-book-title">${book.title}</div>
                <div class="coverflow-book-author">by ${book.author}</div>
            </div>
        `;

        // Add click event to open book modal
        bookElement.addEventListener('click', () => openBookModal(book.id));

        coverflowBooksContainer.appendChild(bookElement);

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = `coverflow-indicator ${index === 0 ? 'active' : ''}`;
        indicator.onclick = () => goToCoverflowSlide(index);
        coverflowIndicators.appendChild(indicator);
    });

    // Initialize coverflow position
    console.log('Initializing coverflow carousel...');
    updateCoverflowPosition();

    // Start automatic slideshow
    startCoverflowSlideshow();

    // Debug: Check if coverflow elements exist
    setTimeout(() => {
        const coverflowBooks = document.querySelectorAll('.coverflow-book');
        console.log('Coverflow books found:', coverflowBooks.length);
        if (coverflowBooks.length === 0) {
            console.log('No coverflow books found - checking data');
            console.log('Sample books data:', allBooks);
        }
    }, 1000);

    // Add touch support for mobile
    addTouchSupport(coverflowCarousel);

    // Add hover to pause functionality
    coverflowCarousel.addEventListener('mouseenter', stopCoverflowSlideshow);
    coverflowCarousel.addEventListener('mouseleave', startCoverflowSlideshow);
}

// ==================== Coverflow Functions ====================
function updateCoverflowPosition() {
    const books = document.querySelectorAll('.coverflow-book');
    const indicators = document.querySelectorAll('.coverflow-indicator');

    books.forEach((book, index) => {
        // Remove all position classes
        book.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next', 'hidden');

        // Calculate relative position to current index
        const relativeIndex = index - currentCoverflowIndex;
        const totalBooks = coverflowBooks.length;

        // Handle circular navigation
        let adjustedIndex = relativeIndex;
        if (adjustedIndex < -Math.floor(totalBooks / 2)) {
            adjustedIndex += totalBooks;
        } else if (adjustedIndex > Math.floor(totalBooks / 2)) {
            adjustedIndex -= totalBooks;
        }

        // Apply appropriate class based on position
        switch (adjustedIndex) {
            case 0:
                book.classList.add('active');
                break;
            case -1:
            case totalBooks - 1:
                book.classList.add('prev');
                break;
            case 1:
            case -(totalBooks - 1):
                book.classList.add('next');
                break;
            case -2:
            case totalBooks - 2:
                book.classList.add('far-prev');
                break;
            case 2:
            case -(totalBooks - 2):
                book.classList.add('far-next');
                break;
            default:
                book.classList.add('hidden');
        }
    });

    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentCoverflowIndex);
    });
}

function nextCoverflow() {
    currentCoverflowIndex = (currentCoverflowIndex + 1) % coverflowBooks.length;
    updateCoverflowPosition();
    // Reset slideshow timer when manually navigating
    stopCoverflowSlideshow();
    startCoverflowSlideshow();
}

function prevCoverflow() {
    currentCoverflowIndex = (currentCoverflowIndex - 1 + coverflowBooks.length) % coverflowBooks.length;
    updateCoverflowPosition();
    // Reset slideshow timer when manually navigating
    stopCoverflowSlideshow();
    startCoverflowSlideshow();
}

function goToCoverflowSlide(index) {
    currentCoverflowIndex = index;
    updateCoverflowPosition();
    // Reset slideshow timer when manually navigating
    stopCoverflowSlideshow();
    startCoverflowSlideshow();
}

function handleCoverflowKeyboard(event) {
    if (currentSection !== 'home') return;

    switch (event.key) {
        case 'ArrowLeft':
            prevCoverflow();
            break;
        case 'ArrowRight':
            nextCoverflow();
            break;
        case 'Enter':
        case ' ':
            const activeBook = document.querySelector('.coverflow-book.active');
            if (activeBook) {
                activeBook.click();
            }
            event.preventDefault();
            break;
    }
}

function startCoverflowSlideshow() {
    // Clear any existing interval
    if (coverflowInterval) {
        clearInterval(coverflowInterval);
    }

    // Set new interval for automatic slide change
    coverflowInterval = setInterval(() => {
        nextCoverflow();
    }, 4000); // Change slide every 4 seconds
}

function stopCoverflowSlideshow() {
    if (coverflowInterval) {
        clearInterval(coverflowInterval);
        coverflowInterval = null;
    }
}

function addTouchSupport(element) {
    element.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        // Stop slideshow on touch start
        stopCoverflowSlideshow();
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
        // Restart slideshow after touch ends
        startCoverflowSlideshow();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextCoverflow(); // Swipe left - go to next
            } else {
                prevCoverflow(); // Swipe right - go to previous
            }
        }
    }
}

function renderBookPreviewSlider() {
    const bookPreviewTrack = document.getElementById('bookPreviewTrack');
    bookPreviewTrack.innerHTML = '';

    selectedBookForModal.previewImages.forEach((image, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `<img src="${image}" alt="Preview ${index + 1}" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22800%22%3E%3Crect fill=%234B90E2%22 width=%22600%22 height=%22800%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2232%22 fill=%22white%22 text-anchor=%22middle%22 dy=%22.3em%22%3E📄 Preview ${index + 1}%3C/text%3E%3C/svg%3E'; this.style.objectFit='contain';">`;
        bookPreviewTrack.appendChild(slide);
    });

    updateBookPreviewPosition();
}

function prevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + 6) % 6;
    updateSliderPosition();
    // Reset slideshow timer when manually navigating
    stopSlideshow();
    startSlideshow();
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % 6;
    updateSliderPosition();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateSliderPosition();
    // Reset slideshow timer when manually navigating
    stopSlideshow();
    startSlideshow();
}

function updateSliderPosition() {
    const sliderTrack = document.getElementById('sliderTrack');
    sliderTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex);
    });
}

function prevBookPreview() {
    currentBookPreviewIndex = (currentBookPreviewIndex - 1 + selectedBookForModal.previewImages.length) % selectedBookForModal.previewImages.length;
    updateBookPreviewPosition();
}

function nextBookPreview() {
    currentBookPreviewIndex = (currentBookPreviewIndex + 1) % selectedBookForModal.previewImages.length;
    updateBookPreviewPosition();
}

function updateBookPreviewPosition() {
    const bookPreviewTrack = document.getElementById('bookPreviewTrack');
    bookPreviewTrack.style.transform = `translateX(-${currentBookPreviewIndex * 100}%)`;
}

// ==================== Statistics ====================
function updateStats() {
    document.getElementById('totalBooks').textContent = allBooks.length;
    document.getElementById('downloadedBooks').textContent = userDownloads.length;
}

// ==================== Notifications ====================
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ==================== Modal Close on Outside Click ====================
window.onclick = function (event) {
    const loginModal = document.getElementById('loginModal');
    const bookModal = document.getElementById('bookModal');

    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === bookModal) {
        closeBookModal();
    }
}

// ==================== Initialize on Load ====================
document.addEventListener('DOMContentLoaded', initializeApp);
