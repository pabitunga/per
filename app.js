// Faculty Jobs • Neo - Main Application Logic (with Firebase Auth)
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { app as firebaseApp } from './lib/firebase.js'; // Adjust path as needed
const auth = getAuth(firebaseApp);

class FacultyJobsApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'homepage';
        this.currentStep = 1;
        this.jobs = [];
        this.appConfig = {
            validJobPolicy: "ADMIN_APPROVAL",
            autoValidation: {
                requireVerifiedEmail: true,
                requiredFields: ["title", "institution", "location", "departments", "levels", "deadline"]
            },
            trustedEmployerMinLevel: 2
        };
        this.savedJobs = new Set();
        this.activeFilters = {
            departments: new Set(),
            levels: new Set(),
            search: ''
        };
        this.departments = ["Mathematics", "Statistics", "Computer Science", "Information Technology", "Physics", "Chemistry", "Biology", "Engineering", "Economics", "Management"];
        this.levels = ["Assistant Professor", "Associate Professor", "Professor", "Lecturer", "Research Scientist", "Postdoc"];
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderFilters();
        this.renderJobs();
        this.checkAuthState();
        console.log('Faculty Jobs App initialized');
    }

    loadData() {
        // Only using jobs from localStorage; user auth comes from Firebase
        const savedJobs = localStorage.getItem('facultyJobs_jobs');
        const savedJobsSet = localStorage.getItem('facultyJobs_savedJobs');
        const savedConfig = localStorage.getItem('facultyJobs_config');
        if (savedJobs) {
            this.jobs = JSON.parse(savedJobs);
        } else {
            this.jobs = [
                {
                    id: 'job1',
                    title: 'Assistant Professor – Mathematics',
                    institution: 'IIT Patna',
                    location: 'Patna, Bihar, India',
                    departments: ['Mathematics', 'Statistics'],
                    levels: ['Assistant Professor'],
                    description: 'Teach UG/PG, guide projects, contribute to research in control theory. We are looking for candidates with strong background in mathematics and statistics.',
                    applicationLink: 'https://example.com/apply',
                    deadline: new Date('2025-09-25'),
                    approved: true,
                    approved_at: new Date('2025-09-13T16:45:00Z'),
                    created_by: 'employer1',
                    active: true,
                    archived: false,
                    created_at: new Date('2025-09-10')
                }
                // Add/remove jobs as needed
            ];
        }
        if (savedConfig) this.appConfig = JSON.parse(savedConfig);
        if (savedJobsSet) this.savedJobs = new Set(JSON.parse(savedJobsSet));
    }
    saveData() {
        localStorage.setItem('facultyJobs_jobs', JSON.stringify(this.jobs));
        localStorage.setItem('facultyJobs_config', JSON.stringify(this.appConfig));
        localStorage.setItem('facultyJobs_savedJobs', JSON.stringify([...this.savedJobs]));
    }

    // --------- Event Listeners ---------
    setupEventListeners() {
        this.setupNavigationListeners();
        this.setupAuthListeners();
        this.setupSearchAndFilterListeners();
        this.setupJobPostingListeners();
        this.setupAdminListeners();
        this.setupModalListeners();
    }
    setupNavigationListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const postJobBtn = document.getElementById('postJobBtn');
        const adminBtn = document.getElementById('adminBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (loginBtn) loginBtn.addEventListener('click', e => { e.preventDefault(); this.showView('auth'); this.showAuthForm('login'); });
        if (registerBtn) registerBtn.addEventListener('click', e => { e.preventDefault(); this.showView('auth'); this.showAuthForm('register'); });
        if (postJobBtn) postJobBtn.addEventListener('click', e => { e.preventDefault(); this.showView('postJob'); });
        if (adminBtn) adminBtn.addEventListener('click', e => { e.preventDefault(); this.showView('admin'); });
        if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); this.logout(); });
    }
    setupAuthListeners() {
        // Role selection
        const roleSelect = document.getElementById('roleSelect');
        if (roleSelect) {
            roleSelect.addEventListener('change', e => {
                const orgNameGroup = document.getElementById('orgNameGroup');
                const orgNameInput = document.getElementById('orgNameInput');
                if (e.target.value === 'employer') {
                    orgNameGroup.classList.remove('hidden');
                    orgNameInput.required = true;
                } else {
                    orgNameGroup.classList.add('hidden');
                    orgNameInput.required = false;
                }
            });
        }
        // Form submissions
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');
        const forgotPasswordForm = document.getElementById('forgotPasswordFormElement');
        if (loginForm) loginForm.addEventListener('submit', e => { e.preventDefault(); this.handleLogin(e); });
        if (registerForm) registerForm.addEventListener('submit', e => { e.preventDefault(); this.handleRegister(e); });
        if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', e => { e.preventDefault(); this.handleForgotPassword(e); });
    }
    setupSearchAndFilterListeners() {
        const searchInput = document.getElementById('searchInput');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (searchInput) searchInput.addEventListener('input', e => { this.activeFilters.search = e.target.value.toLowerCase(); this.renderJobs(); });
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', e => { e.preventDefault(); this.clearAllFilters(); });
    }
    setupJobPostingListeners() {
        // Placeholders for future features
    }
    setupAdminListeners() {
        // Placeholders for future features
    }
    setupModalListeners() {
        // Placeholders for future features
    }

    // --------- Firebase Authentication ---------
    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        this.showToast('Logging in...', 'info');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (!user.emailVerified) {
                this.showToast('Check your inbox and verify your email before logging in.', 'error');
                await signOut(auth);
                return;
            }
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                role: 'candidate',
                orgName: '',
                verifiedEmail: user.emailVerified,
                trust_level: 0,
                created_at: new Date()
            };
            this.showToast('Login successful!', 'success');
            this.updateAuthState();
            this.showView('homepage');
        } catch (error) {
            this.showToast('Login Failed: ' + error.message, 'error');
        }
    }
    async handleRegister(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const displayName = formData.get('displayName') || formData.get('name');
        const role = formData.get('role') || document.getElementById('roleSelect').value;
        const orgName = document.getElementById('orgNameInput').value;
        this.showToast('Registering user...', 'info');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: role,
                orgName: role === 'employer' ? orgName : null,
                verifiedEmail: false,
                trust_level: role === 'employer' ? 1 : 0,
                created_at: new Date()
            };
            this.showToast('Registration successful! Check your email to verify your account.', 'success');
            this.showAuthForm('login');
        } catch (error) {
            this.showToast('Registration Failed: ' + error.message, 'error');
        }
    }
    async handleForgotPassword(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        if (!email) {
            this.showToast('Please enter your email address to reset password.', 'error');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            this.showToast('Password reset link sent to your email', 'success');
            this.showAuthForm('login');
        } catch (err) {
            this.showToast('Reset Error: ' + err.message, 'error');
        }
    }
    logout() {
        signOut(auth).then(() => {
            this.currentUser = null;
            this.updateAuthState();
            this.showView('homepage');
            this.showToast('Logged out successfully', 'success');
        });
    }
    checkAuthState() {
        this.updateAuthState();
    }
    updateAuthState() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const postJobBtn = document.getElementById('postJobBtn');
        const adminBtn = document.getElementById('adminBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (this.currentUser) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (registerBtn) registerBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (postJobBtn) postJobBtn.classList.add('hidden');
            if (adminBtn) adminBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
        }
    }

    // --------- Job & UI Logic (unchanged below) ---------
    showView(viewName) { /* ... as previously ... */ }
    showAuthForm(formName) { /* ... as previously ... */ }
    renderJobs() { /* ... as previously ... */ }
    filterJobs() { /* ... as previously ... */ }
    createJobCard(job) { /* ... as previously ... */ }
    formatDate(date) { /* ... as previously ... */ }
    renderFilters() { /* ... as previously ... */ }
    toggleFilter(filterType, value) { /* ... as previously ... */ }
    updateFilterUI() { /* ... as previously ... */ }
    clearAllFilters() { /* ... as previously ... */ }
    // ... and all your other unchanged methods for modals, toasts, etc.
    showToast(message, type = 'info') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) { toast.parentNode.removeChild(toast); } }, 4000);
    }
}

// Initialize the application
const app = new FacultyJobsApp();
window.app = app;
