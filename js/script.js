document.addEventListener('DOMContentLoaded', () => {
    const standardSelect = document.getElementById('standard-select');
    const subjectSelect = document.getElementById('subject-select');
    const lessonSelect = document.getElementById('lesson-select');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Mock data for subjects and lessons.
    const subjectData = {
        "+1": {
            "Physics": ["Lesson 1: Nature of Physical World and Measurement", "Lesson 2: Kinematics", "Lesson 3: Laws of Motion"],
            "Chemistry": ["Lesson 1: Basic Concepts of Chemistry and Chemical Calculations", "Lesson 2: Quantum Mechanical Model of Atom"],
            "Botany": ["Lesson 1: Living World", "Lesson 2: Plant Kingdom"],
            "Zoology": ["Lesson 1: The Living World", "Lesson 2: Animal Kingdom"],
            "Computer Science": ["Lesson 1: Introduction to Computers", "Lesson 2: Number Systems"]
        },
        "+2": {
            "Physics": ["Lesson 1: Electrostatics", "Lesson 2: Current Electricity", "Lesson 3: Magnetism and Magnetic Effects of Electric Current"],
            "Chemistry": ["Lesson 1: Solid State", "Lesson 2: Solutions", "Lesson 3: Electrochemistry"],
            "Botany": ["Lesson 1: Asexual and Sexual Reproduction in Plants", "Lesson 2: Classical Genetics"],
            "Zoology": ["Lesson 1: Reproduction in Organisms", "Lesson 2: Human Reproduction"],
            "Computer Science": ["Lesson 1: Function", "Lesson 2: Data Abstraction"]
        }
    };

    function updateDropdownsState() {
        const standardSelected = standardSelect.value !== "";
        const subjectSelected = subjectSelect.value !== "";
        const lessonSelected = lessonSelect.value !== "";

        subjectSelect.disabled = !standardSelected;
        lessonSelect.disabled = !standardSelected || !subjectSelected;
        startQuizBtn.disabled = !standardSelected || !subjectSelected || !lessonSelected;

        // Styling for disabled button to make it more apparent
        if (startQuizBtn.disabled) {
            startQuizBtn.classList.add('opacity-50', 'cursor-not-allowed');
            startQuizBtn.classList.remove('hover:bg-blue-700', 'dark:hover:bg-sky-600', 'hover:shadow-lg');
        } else {
            startQuizBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            startQuizBtn.classList.add('hover:bg-blue-700', 'dark:hover:bg-sky-600', 'hover:shadow-lg');
        }
    }

    standardSelect.addEventListener('change', () => {
        const selectedStandard = standardSelect.value;
        // Reset dependent dropdowns
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        lessonSelect.innerHTML = '<option value="">Select Lesson</option><option value="mixed">All Lessons (Mixed Questions)</option>';

        if (selectedStandard && subjectData[selectedStandard]) {
            const subjects = Object.keys(subjectData[selectedStandard]);
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
        }
        updateDropdownsState();
    });

    subjectSelect.addEventListener('change', () => {
        const selectedStandard = standardSelect.value;
        const selectedSubject = subjectSelect.value;
        // Reset lesson dropdown
        lessonSelect.innerHTML = '<option value="">Select Lesson</option><option value="mixed">All Lessons (Mixed Questions)</option>';

        if (selectedStandard && selectedSubject && subjectData[selectedStandard] && subjectData[selectedStandard][selectedSubject]) {
            const lessons = subjectData[selectedStandard][selectedSubject];
            lessons.forEach((lesson, index) => {
                const option = document.createElement('option');
                // Lesson value will be lesson1, lesson2, etc. to match JSON file names
                option.value = `lesson${index + 1}`;
                option.textContent = lesson;
                lessonSelect.appendChild(option);
            });
        }
        updateDropdownsState();
    });

    lessonSelect.addEventListener('change', () => {
        updateDropdownsState();
    });

    startQuizBtn.addEventListener('click', () => {
        if (startQuizBtn.disabled) return; // Extra check

        const standard = standardSelect.value;
        const subject = subjectSelect.value;
        const lesson = lessonSelect.value;

        // Standard, subject, and lesson must be selected
        if (standard && subject && lesson) {
            const encodedStandard = standard.replace('+', 'plus');
            window.location.href = `quiz.html?standard=${encodedStandard}&subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`;
        } else {
            // This path should ideally not be taken due to button disabling logic
            console.error("Attempted to start quiz without full selection.");
            // Optionally, provide user feedback, though button state should prevent this
        }
    });

    // --- Dark Mode Logic ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark');
            if(darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'true');
        } else {
            body.classList.remove('dark');
            if(darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'false');
        }
    }

    // Load saved theme or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
            // Optional: if defaulting to system dark, save it so toggle state is correct on first load
            // localStorage.setItem('theme', 'dark');
        } else {
            applyTheme('light');
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const currentThemeIsDark = body.classList.contains('dark');
            if (currentThemeIsDark) {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            } else {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Initial state update for dropdowns and button
    updateDropdownsState();
});
