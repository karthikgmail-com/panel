document.addEventListener('DOMContentLoaded', () => {
    // const standardSelect = document.getElementById('standard-select'); // Old select
    const standardChipsContainer = document.getElementById('standard-chips-container');
    const standardChips = standardChipsContainer ? standardChipsContainer.querySelectorAll('.standard-chip') : [];

    const subjectPillsContainer = document.getElementById('subject-pills-container');
    const subjectLabel = document.getElementById('subject-label');
    const subjectSelect = document.getElementById('subject-select'); // Hidden select to store value

    const lessonLabel = document.getElementById('lesson-label'); // To show/hide lesson section
    const lessonSelect = document.getElementById('lesson-select'); // Will be replaced by modal later
    const startQuizBtn = document.getElementById('start-quiz-btn');

    let selectedStandardValue = '';
    let selectedSubjectValue = ''; // To store the currently selected subject

    // Mock data for subjects and lessons.
    const subjectData = {
        "+1": {
            "Physics": ["Lesson 1: Physical World", "Lesson 2: Kinematics", "Lesson 3: Dynamics"],
            "Chemistry": ["Lesson 1: Basic Concepts", "Lesson 2: Structure of Atom"],
            "Botany": ["Lesson 1: Plant Kingdom", "Lesson 2: Morphology"],
            "Zoology": ["Lesson 1: Animal Kingdom", "Lesson 2: Cell Biology"],
            "Computer Science": ["Lesson 1: Introduction", "Lesson 2: Algorithms"]
        },
        "+2": {
            "Physics": ["Lesson 1: Electrostatics", "Lesson 2: Current Electricity"],
            "Chemistry": ["Lesson 1: Solid State", "Lesson 2: Solutions"],
            "Botany": ["Lesson 1: Plant Physiology", "Lesson 2: Genetics"],
            "Zoology": ["Lesson 1: Human Physiology", "Lesson 2: Evolution"],
            "Computer Science": ["Lesson 1: Data Structures", "Lesson 2: Python Programming"]
        }
    };

    // Active/Inactive classes for chips
    const activeChipClasses = ['bg-blue-600', 'text-white', 'border-blue-700', 'dark:bg-sky-500', 'dark:text-slate-900', 'dark:border-sky-600', 'scale-105', 'ring-2', 'ring-blue-500', 'dark:ring-sky-400', 'ring-offset-2'];
    const inactiveChipClasses = ['bg-white', 'dark:bg-slate-700', 'border-gray-300', 'dark:border-slate-600', 'text-blue-600', 'dark:text-sky-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-600', 'hover:scale-105'];

    const activePillClasses = ['bg-blue-600', 'text-white', 'border-blue-700', 'dark:bg-sky-500', 'dark:text-slate-900', 'dark:border-sky-600', 'scale-105', 'shadow-lg'];
    const inactivePillClasses = ['bg-white', 'dark:bg-slate-700', 'border-gray-300', 'dark:border-slate-600', 'text-blue-600', 'dark:text-sky-400', 'hover:bg-gray-100', 'dark:hover:bg-slate-600', 'hover:scale-105', 'shadow-md'];


    function resetSubjectSelection() {
        if (subjectPillsContainer) subjectPillsContainer.innerHTML = ''; // Clear old pills
        if (subjectPillsContainer) subjectPillsContainer.style.display = 'none';
        if (subjectLabel) subjectLabel.style.display = 'none';
        subjectSelect.value = ''; // Reset hidden select
        selectedSubjectValue = '';
    }

    function resetLessonSelection() {
        lessonSelect.innerHTML = '<option value="">Select Lesson (or All Lessons)</option><option value="mixed">All Lessons (Mixed Questions)</option>';
        if (lessonLabel) lessonLabel.style.display = 'none';
        lessonSelect.style.display = 'none'; // This will be modal later
        lessonSelect.disabled = true;
    }

    standardChips.forEach(chip => {
        chip.addEventListener('click', () => {
            selectedStandardValue = chip.dataset.value;

            standardChips.forEach(c => {
                c.classList.remove(...activeChipClasses, 'ring-2', 'ring-blue-500', 'dark:ring-sky-400', 'ring-offset-2'); // Also remove explicit ring classes
                c.classList.add(...inactiveChipClasses);
            });
            chip.classList.add(...activeChipClasses);
            chip.classList.remove(...inactiveChipClasses);

            // Reset subsequent selections
            resetSubjectSelection();
            resetLessonSelection();
            startQuizBtn.disabled = true;

            if (selectedStandardValue && subjectData[selectedStandardValue]) {
                if (subjectLabel) subjectLabel.style.display = 'block';
                if (subjectPillsContainer) subjectPillsContainer.style.display = 'grid';
                const subjects = Object.keys(subjectData[selectedStandardValue]);
                subjects.forEach(subjectText => {
                    const pill = document.createElement('button');
                    pill.dataset.value = subjectText;
                    pill.textContent = subjectText;
                    pill.className = `subject-pill py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800`;
                    pill.classList.add(...inactivePillClasses, 'focus:ring-indigo-500', 'dark:focus:ring-sky-400');

                    pill.addEventListener('click', () => {
                        selectedSubjectValue = pill.dataset.value;
                        subjectSelect.value = selectedSubjectValue; // Update hidden select

                        subjectPillsContainer.querySelectorAll('.subject-pill').forEach(p => {
                            p.classList.remove(...activePillClasses);
                            p.classList.add(...inactivePillClasses);
                        });
                        pill.classList.add(...activePillClasses);
                        pill.classList.remove(...inactivePillClasses);

                        // Populate and show lesson selection (currently dropdown, will be modal)
                        resetLessonSelection();
                        if (lessonLabel) lessonLabel.style.display = 'block'; // Show lesson label
                        lessonSelect.style.display = 'block'; // Show lesson dropdown for now

                        if (selectedStandardValue && selectedSubjectValue && subjectData[selectedStandardValue] && subjectData[selectedStandardValue][selectedSubjectValue]) {
                            const lessons = subjectData[selectedStandardValue][selectedSubjectValue];
                            lessons.forEach((lesson, index) => {
                                const option = document.createElement('option');
                                option.value = `lesson${index + 1}`;
                                option.textContent = lesson;
                                lessonSelect.appendChild(option);
                            });
                            lessonSelect.disabled = false;
                        } else if (selectedSubjectValue) { // Only "Mixed" available
                            lessonSelect.disabled = false;
                        }
                        startQuizBtn.disabled = true; // Lesson must be chosen
                    });
                    if (subjectPillsContainer) subjectPillsContainer.appendChild(pill);
                });
            }
        });
    });

    // This event listener remains for the (soon to be replaced) lesson dropdown
    lessonSelect.addEventListener('change', () => {
        if (lessonSelect.value && selectedSubjectValue && selectedStandardValue) {
            startQuizBtn.disabled = false;
        } else {
            startQuizBtn.disabled = true;
        }
    });

    startQuizBtn.addEventListener('click', () => {
        const standard = selectedStandardValue; // Use the chip selected value
        const subject = subjectSelect.value; // Will get from selected subject pill later
        const lesson = lessonSelect.value; // Will get from lesson modal later

        if (standard && subject && lesson) {
            const encodedStandard = standard.replace('+', 'plus');
            window.location.href = `quiz.html?standard=${encodedStandard}&subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`;
        } else {
            alert("Please make all selections.");
        }
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Function to apply theme
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark');
            if(darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'true');
            // You might want to change the icon for the toggle here if you have separate light/dark icons
        } else {
            body.classList.remove('dark');
            if(darkModeToggle) darkModeToggle.setAttribute('aria-pressed', 'false');
        }
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Default to system preference if no theme is saved in localStorage
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            if (body.classList.contains('dark')) {
                applyTheme('light');
                localStorage.setItem('theme', 'light');
            } else {
                applyTheme('dark');
                localStorage.setItem('theme', 'dark');
            }
        });

        // Optional: Update icon based on theme
        // This requires two different SVG icons or manipulating the existing one.
        // For simplicity, the current SVG is a moon, which generally implies toggling to dark.
        // If it's dark, perhaps it should show a sun.
    }
});
