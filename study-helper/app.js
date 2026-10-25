/* ============================================================
   CourseHub - Full Application Engine
   ============================================================ */

/* ---------- 1. SUPABASE CLIENT ---------- */
const SUPABASE_URL = "https://ehpyhqvemeglmxiwbtwx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mkxKleQBxm2qJbZywt2kRg_y2SMPrM7";

let supabase = null;
try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Supabase SDK not loaded - auth will run in demo mode.");
    }
} catch (e) {
    console.warn("Supabase init failed:", e);
}

let currentAuthMode = 'signin';
let currentUser = null;

/* ---------- 2. STATIC DATA ---------- */
const INSTITUTIONS = [
    { id: 'inst-1', name: 'Stanford University' },
    { id: 'inst-2', name: 'MIT - Massachusetts Institute of Technology' },
    { id: 'inst-3', name: 'UC Berkeley' }
];

const CATEGORIES = [
    { id: 'all', label: 'All Resources', icon: 'fa-layer-group' },
    { id: 'Lecture Notes', label: 'Lecture Notes', icon: 'fa-file-lines' },
    { id: 'Exam Prep', label: 'Exam Prep & Reviews', icon: 'fa-award' },
    { id: 'Practice Problems', label: 'Practice Problems', icon: 'fa-chart-column' }
];

const COURSES = [
    { id: 'cs101', institutionId: 'inst-1', code: 'CS 101', name: 'Intro to Computer Science & Algorithms', term: 'Fall 2026' },
    { id: 'math201', institutionId: 'inst-1', code: 'MATH 201', name: 'Linear Algebra & Differential Equations', term: 'Fall 2026' },
    { id: 'chem102', institutionId: 'inst-1', code: 'CHEM 102', name: 'General Organic Chemistry II', term: 'Fall 2026' },
    { id: 'phys150', institutionId: 'inst-1', code: 'PHYS 150', name: 'Quantum Physics & Relativity', term: 'Fall 2026' },
    { id: 'mit-601', institutionId: 'inst-2', code: '6.001', name: 'Structure & Interpretation of Computer Programs', term: 'Fall 2026' },
    { id: 'mit-1806', institutionId: 'inst-2', code: '18.06', name: 'Linear Algebra', term: 'Fall 2026' },
    { id: 'berk-cs61a', institutionId: 'inst-3', code: 'CS 61A', name: 'Structure & Interpretation of Computer Programs', term: 'Fall 2026' },
    { id: 'berk-cs61b', institutionId: 'inst-3', code: 'CS 61B', name: 'Data Structures', term: 'Fall 2026' }
];

let state = {
    selectedInstId: 'inst-1',
    enrolledCourseIds: ['cs101', 'math201', 'chem102'],
    activeTab: 'feed',
    selectedCategoryFilter: 'all',
    searchQuery: '',
    savedResourceIds: ['res-1'],
    resources: [
        {
            id: 'res-1',
            courseId: 'cs101',
            uploaderName: 'Alex Rivera',
            title: 'Lecture 4: Binary Search Trees & Recursion Depth',
            description: 'Detailed annotations on tree traversals, balancing conditions, and space-time complexity analysis.',
            category: 'Lecture Notes',
            fileType: 'PDF',
            fileSize: '3.4 MB',
            createdAt: '2 hours ago',
            upvotes: 28,
            contentPreview: '# CS 101: Binary Search Trees\n\n1. In-Order Traversal (Left, Root, Right)\n2. Pre-Order Traversal (Root, Left, Right)\n3. Post-Order Traversal (Left, Right, Root)\n\nAVL Self-Balancing condition: height difference between left & right subtrees <= 1.'
        },
        {
            id: 'res-2',
            courseId: 'math201',
            uploaderName: 'Sophia Chen',
            title: 'Eigenvalues & Diagonalization Practice Exam',
            description: 'Complete practice exam with step-by-step matrix reduction solutions for Midterm 2.',
            category: 'Exam Prep',
            fileType: 'PDF',
            fileSize: '1.8 MB',
            createdAt: '1 day ago',
            upvotes: 42,
            contentPreview: '# MATH 201: Matrix Eigenvalues\n\nCharacteristic Equation: det(A - λI) = 0\n\nSteps:\n1. Compute determinant\n2. Solve polynomial for eigenvalues λ\n3. Find nullspace for (A - λI)v = 0'
        }
    ],
    studyMethods: [
        {
            id: 'method-1',
            author: 'David Kim',
            title: 'Feynman Technique with Active Recall Matrix',
            description: 'Explain core algorithm concepts in plain language on paper without looking at slides, then fill missing gaps in red ink.',
            upvotes: 19,
            createdAt: '3 days ago'
        }
    ]
};

/* ---------- 3. UTILITIES ---------- */
function showToast(message, type) {
    type = type || 'success';
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast) return;
    toastMsg.innerText = message;
    if (type === 'success') {
        toastIcon.className = "fa-solid fa-circle-check text-emerald-400";
        toast.className = "fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border bg-emerald-950/90 text-emerald-200 border-emerald-500/50 transition-all duration-300";
    } else {
        toastIcon.className = "fa-solid fa-circle-info text-indigo-400";
        toast.className = "fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border bg-indigo-950/90 text-indigo-200 border-indigo-500/50 transition-all duration-300";
    }
    toast.classList.remove('hidden');
    setTimeout(function () { toast.classList.add('hidden'); }, 3500);
}

function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.classList.remove('hidden');
    m.classList.add('flex');
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('flex');
}

/* ---------- 4. AUTH ---------- */
function updateAuthUI(user) {
    currentUser = user;
    const signinBtn = document.getElementById('auth-signin-btn');
    const userBadge = document.getElementById('auth-user-badge');
    const emailDisplay = document.getElementById('user-email-display');
    if (!signinBtn || !userBadge) return;

    if (user) {
        signinBtn.classList.add('hidden');
        userBadge.classList.remove('hidden');
        userBadge.classList.add('flex');
        emailDisplay.innerText = user.email || 'student@univ.edu';
    } else {
        signinBtn.classList.remove('hidden');
        userBadge.classList.add('hidden');
        userBadge.classList.remove('flex');
    }
}

function switchAuthMode(mode) {
    currentAuthMode = mode;
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabSignin = document.getElementById('auth-tab-signin');
    const tabSignup = document.getElementById('auth-tab-signup');
    const statusBox = document.getElementById('auth-status-box');
    if (statusBox) statusBox.classList.add('hidden');

    if (mode === 'signin') {
        title.innerText = 'Sign In to CourseHub';
        submitBtn.innerHTML = '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>';
        tabSignin.className = "flex-1 py-1.5 rounded-lg bg-indigo-600 text-white transition-all";
        tabSignup.className = "flex-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all";
    } else {
        title.innerText = 'Create your CourseHub Account';
        submitBtn.innerHTML = '<span>Sign Up</span><i class="fa-solid fa-user-plus"></i>';
        tabSignup.className = "flex-1 py-1.5 rounded-lg bg-indigo-600 text-white transition-all";
        tabSignin.className = "flex-1 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-all";
    }
}

async function handleGitHubSignIn() {
    if (!supabase) {
        showToast("Supabase not configured - cannot use GitHub sign-in.", "info");
        return;
    }
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    } catch (err) {
        showToast(err.message || "GitHub sign-in failed.", "info");
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const statusBox = document.getElementById('auth-status-box');

    statusBox.className = "p-3 rounded-xl border text-xs font-medium bg-slate-950 text-indigo-300 border-indigo-800/80";
    statusBox.innerText = "Processing request...";
    statusBox.classList.remove('hidden');

    if (!supabase) {
        statusBox.className = "p-3 rounded-xl border text-xs font-medium bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
        statusBox.innerText = "Demo mode: signed in as " + email + " (Supabase not connected)";
        updateAuthUI({ email: email });
        setTimeout(function () { closeModal('auth-modal'); }, 800);
        return;
    }

    try {
        if (currentAuthMode === 'signin') {
            const res = await supabase.auth.signInWithPassword({ email: email, password: password });
            if (res.error) throw res.error;
            showToast("Successfully signed in!", "success");
            closeModal('auth-modal');
        } else {
            const res = await supabase.auth.signUp({ email: email, password: password });
            if (res.error) throw res.error;
            if (res.data && res.data.session) {
                showToast("Account created successfully!", "success");
                closeModal('auth-modal');
            } else {
                statusBox.className = "p-3 rounded-xl border text-xs font-medium bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
                statusBox.innerText = "Registration successful! Please check your email to confirm your account.";
            }
        }
    } catch (err) {
        statusBox.className = "p-3 rounded-xl border text-xs font-medium bg-rose-950/80 text-rose-300 border-rose-800/80";
        statusBox.innerText = (err && err.message) ? err.message : "An authentication error occurred.";
    }
}

async function handleSignOut() {
    if (supabase) {
        try {
            const res = await supabase.auth.signOut();
            if (res.error) showToast(res.error.message, "info");
            else showToast("Signed out successfully", "info");
        } catch (err) {
            showToast("Signed out", "info");
        }
    } else {
        showToast("Signed out", "info");
    }
    updateAuthUI(null);
}

/* ---------- 5. INSTITUTION & SEARCH ---------- */
function initInstitutionDropdown() {
    const select = document.getElementById('institution-select');
    if (!select) return;
    select.innerHTML = INSTITUTIONS.map(function (inst) {
        return '<option value="' + inst.id + '">' + inst.name + '</option>';
    }).join('');
    select.value = state.selectedInstId;
}

function handleInstitutionChange(instId) {
    state.selectedInstId = instId;
    const inst = INSTITUTIONS.find(function (i) { return i.id === instId; });
    if (inst) {
        document.getElementById('current-inst-label').innerText = inst.name;
        document.getElementById('enroll-modal-inst-name').innerText = inst.name;
    }
    renderEnrollCatalog();
}

function handleSearchInput(val) {
    state.searchQuery = val.trim().toLowerCase();
    const clearBtn = document.getElementById('clear-search-btn');
    if (state.searchQuery) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
    renderFeed();
    renderStudyMethods();
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    handleSearchInput('');
}

/* ---------- 6. TAB SWITCHING ---------- */
function switchTab(tabName) {
    state.activeTab = tabName;
    ['feed', 'methods', 'saved', 'honor'].forEach(function (t) {
        const tabEl = document.getElementById('tab-' + t);
        if (tabEl) tabEl.classList.add('hidden');
        const btn = document.getElementById('nav-' + t);
        if (btn) btn.className = "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/60";
    });

    const activeTabEl = document.getElementById('tab-' + tabName);
    if (activeTabEl) activeTabEl.classList.remove('hidden');

    const activeBtn = document.getElementById('nav-' + tabName);
    if (activeBtn) activeBtn.className = "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all bg-indigo-600 text-white shadow-md";

    if (tabName === 'feed') renderFeed();
    if (tabName === 'methods') renderStudyMethods();
    if (tabName === 'saved') renderSavedLibrary();
}

/* ---------- 7. CATEGORY FILTERS ---------- */
function renderCategoryFilters() {
    const bar = document.getElementById('category-filter-bar');
    if (!bar) return;
    bar.innerHTML = CATEGORIES.map(function (cat) {
        const active = state.selectedCategoryFilter === cat.id;
        const cls = active
            ? 'bg-indigo-600/90 text-white border border-indigo-500 shadow-md'
            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200';
        return '<button onclick="selectCategoryFilter(\'' + cat.id + '\')" class="px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ' + cls + '">'
            + '<i class="fa-solid ' + cat.icon + '"></i><span>' + cat.label + '</span></button>';
    }).join('');
}

function selectCategoryFilter(catId) {
    state.selectedCategoryFilter = catId;
    renderCategoryFilters();
    renderFeed();
}

/* ---------- 8. ENROLLED CLASSES LIST ---------- */
function renderEnrolledClassesList() {
    const container = document.getElementById('enrolled-classes-list');
    if (!container) return;
    const enrolled = COURSES.filter(function (c) { return state.enrolledCourseIds.indexOf(c.id) !== -1; });
    document.getElementById('enrolled-count-header').innerText = enrolled.length;

    if (enrolled.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-slate-500 text-center py-2">No active classes. Click "+ Add Class" to enroll.</p>';
        return;
    }

    container.innerHTML = enrolled.map(function (course) {
        return '<div class="flex items-center justify-between p-2.5 rounded-xl border bg-slate-950/50 border-slate-800 text-xs">'
            + '<div><span class="font-bold text-slate-200 block">' + course.code + '</span>'
            + '<span class="text-[10px] text-slate-400 truncate max-w-[140px] block">' + course.name + '</span></div>'
            + '<button onclick="unenrollCourse(\'' + course.id + '\')" class="text-slate-500 hover:text-rose-400 text-xs p-1" title="Unenroll"><i class="fa-solid fa-xmark"></i></button>'
            + '</div>';
    }).join('');
}

/* ---------- 9. RENDER FEED ---------- */
function renderFeed() {
    const grid = document.getElementById('resource-cards-grid');
    if (!grid) return;

    let filtered = state.resources.filter(function (res) {
        return state.enrolledCourseIds.indexOf(res.courseId) !== -1;
    });

    if (state.selectedCategoryFilter !== 'all') {
        filtered = filtered.filter(function (res) { return res.category === state.selectedCategoryFilter; });
    }

    if (state.searchQuery) {
        filtered = filtered.filter(function (res) {
            return res.title.toLowerCase().indexOf(state.searchQuery) !== -1
                || res.description.toLowerCase().indexOf(state.searchQuery) !== -1;
        });
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">No matching resources found for your active enrolled classes.</div>';
        return;
    }

    grid.innerHTML = filtered.map(function (resource) {
        const isSaved = state.savedResourceIds.indexOf(resource.id) !== -1;
        const course = COURSES.find(function (c) { return c.id === resource.courseId; }) || { code: 'COURSE' };
        return '<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all shadow-sm">'
            + '<div class="flex flex-col gap-2">'
            + '<div class="flex items-center justify-between">'
            + '<span class="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-bold uppercase">' + course.code + ' • ' + resource.category + '</span>'
            + '<button onclick="toggleSaveResource(\'' + resource.id + '\')" class="text-xs ' + (isSaved ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300') + '"><i class="fa-' + (isSaved ? 'solid' : 'regular') + ' fa-bookmark"></i></button>'
            + '</div>'
            + '<h3 class="text-base font-bold text-slate-100 mt-1">' + resource.title + '</h3>'
            + '<p class="text-xs text-slate-400 leading-relaxed">' + resource.description + '</p>'
            + '</div>'
            + '<div class="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">'
            + '<div class="flex items-center gap-3">'
            + '<button onclick="upvoteResource(\'' + resource.id + '\')" class="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">'
            + '<i class="fa-solid fa-thumbs-up text-indigo-400"></i><span class="font-bold text-slate-200">' + resource.upvotes + '</span></button>'
            + '<span class="text-[11px] text-slate-500">By ' + resource.uploaderName + '</span>'
            + '</div>'
            + '<button onclick="openPreviewModal(\'' + resource.id + '\')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all">Preview</button>'
            + '</div></div>';
    }).join('');
}

/* ---------- 10. RENDER STUDY METHODS ---------- */
function renderStudyMethods() {
    const list = document.getElementById('study-methods-list');
    if (!list) return;

    let filtered = state.studyMethods;
    if (state.searchQuery) {
        filtered = filtered.filter(function (m) {
            return m.title.toLowerCase().indexOf(state.searchQuery) !== -1
                || m.description.toLowerCase().indexOf(state.searchQuery) !== -1;
        });
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">No study methods posted yet. Click "+ Post Strategy" above!</div>';
        return;
    }

    list.innerHTML = filtered.map(function (m) {
        return '<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">'
            + '<div class="flex items-center justify-between">'
            + '<h3 class="text-sm font-bold text-white flex items-center gap-2"><i class="fa-solid fa-lightbulb text-amber-400"></i>' + m.title + '</h3>'
            + '<span class="text-[11px] text-slate-500">Posted by ' + m.author + '</span>'
            + '</div>'
            + '<p class="text-xs text-slate-300 leading-relaxed">' + m.description + '</p>'
            + '</div>';
    }).join('');
}

/* ---------- 11. RENDER SAVED LIBRARY ---------- */
function renderSavedLibrary() {
    const grid = document.getElementById('saved-cards-grid');
    if (!grid) return;
    const savedList = state.resources.filter(function (r) { return state.savedResourceIds.indexOf(r.id) !== -1; });

    if (savedList.length === 0) {
        grid.innerHTML = '<div class="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">No saved materials in your library yet.</div>';
        return;
    }

    grid.innerHTML = savedList.map(function (resource) {
        return '<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">'
            + '<div>'
            + '<span class="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-bold uppercase">' + resource.category + '</span>'
            + '<h3 class="text-base font-bold text-slate-100 mt-2">' + resource.title + '</h3>'
            + '<p class="text-xs text-slate-400 mt-1">' + resource.description + '</p>'
            + '</div>'
            + '<div class="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">'
            + '<button onclick="toggleSaveResource(\'' + resource.id + '\')" class="text-xs text-rose-400 hover:text-rose-300"><i class="fa-solid fa-trash-can mr-1"></i> Remove</button>'
            + '<button onclick="openPreviewModal(\'' + resource.id + '\')" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">Preview</button>'
            + '</div></div>';
    }).join('');
}

/* ---------- 12. ENROLL CATALOG ---------- */
function renderEnrollCatalog() {
    const list = document.getElementById('enroll-catalog-list');
    if (!list) return;
    const instCourses = COURSES.filter(function (c) { return c.institutionId === state.selectedInstId; });

    list.innerHTML = instCourses.map(function (course) {
        const isEnrolled = state.enrolledCourseIds.indexOf(course.id) !== -1;
        const cls = isEnrolled
            ? 'bg-slate-800 text-slate-300 border border-slate-700'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md';
        return '<div class="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">'
            + '<div><span class="font-bold text-xs text-white">' + course.code + '</span>'
            + '<p class="text-[11px] text-slate-400">' + course.name + '</p></div>'
            + '<button onclick="toggleEnrollCourse(\'' + course.id + '\')" class="px-3 py-1.5 rounded-xl text-xs font-semibold ' + cls + '">'
            + (isEnrolled ? 'Enrolled' : '+ Enroll') + '</button>'
            + '</div>';
    }).join('');
}

function toggleEnrollCourse(courseId) {
    const idx = state.enrolledCourseIds.indexOf(courseId);
    if (idx !== -1) {
        state.enrolledCourseIds.splice(idx, 1);
        showToast("Unenrolled from class", "info");
    } else {
        state.enrolledCourseIds.push(courseId);
        showToast("Enrolled in class!", "success");
    }
    renderEnrolledClassesList();
    renderEnrollCatalog();
    renderFeed();
    updateBadges();
}

function unenrollCourse(courseId) {
    state.enrolledCourseIds = state.enrolledCourseIds.filter(function (id) { return id !== courseId; });
    showToast("Unenrolled from class", "info");
    renderEnrolledClassesList();
    renderEnrollCatalog();
    renderFeed();
    updateBadges();
}

/* ---------- 13. SAVE / UPVOTE ---------- */
function toggleSaveResource(resId) {
    const idx = state.savedResourceIds.indexOf(resId);
    if (idx !== -1) {
        state.savedResourceIds.splice(idx, 1);
        showToast("Removed from saved library", "info");
    } else {
        state.savedResourceIds.push(resId);
        showToast("Added to saved library!", "success");
    }
    updateBadges();
    renderFeed();
    renderSavedLibrary();
}

function upvoteResource(resId) {
    const res = state.resources.find(function (r) { return r.id === resId; });
    if (res) {
        res.upvotes += 1;
        renderFeed();
        showToast("Upvoted!", "success");
    }
}

function updateBadges() {
    const feedBadge = document.getElementById('badge-feed-count');
    const methodsBadge = document.getElementById('badge-methods-count');
    const savedBadge = document.getElementById('badge-saved-count');
    if (feedBadge) feedBadge.innerText = state.resources.length;
    if (methodsBadge) methodsBadge.innerText = state.studyMethods.length;
    if (savedBadge) savedBadge.innerText = state.savedResourceIds.length;
}

/* ---------- 14. FORM DROPDOWNS ---------- */
function populateFormDropdowns() {
    const uploadCourseSelect = document.getElementById('upload-course-select');
    if (uploadCourseSelect) {
        uploadCourseSelect.innerHTML = COURSES.map(function (c) {
            return '<option value="' + c.id + '">' + c.code + ' — ' + c.name + '</option>';
        }).join('');
    }

    const uploadCatSelect = document.getElementById('upload-category-select');
    if (uploadCatSelect) {
        uploadCatSelect.innerHTML = CATEGORIES.filter(function (c) { return c.id !== 'all'; }).map(function (c) {
            return '<option value="' + c.id + '">' + c.label + '</option>';
        }).join('');
    }
}

/* ---------- 15. PREVIEW MODAL ---------- */
function openPreviewModal(resId) {
    const res = state.resources.find(function (r) { return r.id === resId; });
    if (!res) return;
    document.getElementById('modal-preview-title').innerText = res.title;
    document.getElementById('modal-preview-meta').innerText = 'Uploaded by ' + res.uploaderName + ' • ' + res.category;
    document.getElementById('modal-preview-body').innerText = res.contentPreview || res.description;
    openModal('preview-modal');
}

/* ---------- 16. UPLOAD HANDLER ---------- */
function handleUploadSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast("Please sign in first to upload resources!", "info");
        openModal('auth-modal');
        return;
    }

    const courseId = document.getElementById('upload-course-select').value;
    const category = document.getElementById('upload-category-select').value;
    const title = document.getElementById('upload-title').value.trim();
    const description = document.getElementById('upload-desc').value.trim();

    state.resources.unshift({
        id: 'res-' + Date.now(),
        courseId: courseId,
        uploaderName: (currentUser.email || 'student').split('@')[0],
        title: title,
        description: description,
        category: category,
        fileType: 'PDF',
        fileSize: '1.2 MB',
        createdAt: 'Just now',
        upvotes: 0,
        contentPreview: '# ' + title + '\n\n' + description
    });

    document.getElementById('upload-form').reset();
    closeModal('upload-modal');
    showToast("Material uploaded successfully!", "success");
    updateBadges();
    renderFeed();
}

/* ---------- 17. STUDY METHOD HANDLER ---------- */
function handleMethodSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast("Please sign in first to post study methods!", "info");
        openModal('auth-modal');
        return;
    }

    const title = document.getElementById('method-title').value.trim();
    const description = document.getElementById('method-body').value.trim();

    state.studyMethods.unshift({
        id: 'method-' + Date.now(),
        author: (currentUser.email || 'student').split('@')[0],
        title: title,
        description: description,
        upvotes: 0,
        createdAt: 'Just now'
    });

    document.getElementById('method-form').reset();
    closeModal('new-method-modal');
    showToast("Study method posted!", "success");
    updateBadges();
    renderStudyMethods();
}

/* ---------- 18. BOOT ---------- */
document.addEventListener('DOMContentLoaded', function () {
    initInstitutionDropdown();
    renderCategoryFilters();
    renderEnrolledClassesList();
    renderFeed();
    renderStudyMethods();
    renderSavedLibrary();
    populateFormDropdowns();
    renderEnrollCatalog();
    updateBadges();

    if (supabase) {
        supabase.auth.getSession().then(function (res) {
            const session = res.data && res.data.session;
            updateAuthUI(session ? session.user : null);
        }).catch(function (err) {
            console.warn("Session check failed:", err);
        });

        supabase.auth.onAuthStateChange(function (_event, session) {
            updateAuthUI(session ? session.user : null);
        });
    }
});