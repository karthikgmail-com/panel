document.addEventListener('DOMContentLoaded', () => {
    const standardSelect = document.getElementById('standard-select');
    const subjectSelect = document.getElementById('subject-select');
    const lessonSelect = document.getElementById('lesson-select');
    const startQuizBtn = document.getElementById('start-quiz-btn');

    // Mock data for subjects and lessons. This will eventually be more dynamic or configurable.
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

    standardSelect.addEventListener('change', () => {
        const selectedStandard = standardSelect.value;
        subjectSelect.innerHTML = '<option value="">Select Subject</option>'; // Reset
        lessonSelect.innerHTML = '<option value="">Select Lesson (or All Lessons)</option><option value="mixed">All Lessons (Mixed Questions)</option>'; // Reset
        subjectSelect.disabled = true;
        lessonSelect.disabled = true;
        startQuizBtn.disabled = true;

        if (selectedStandard && subjectData[selectedStandard]) {
            const subjects = Object.keys(subjectData[selectedStandard]);
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
            subjectSelect.disabled = false;
        }
    });

    subjectSelect.addEventListener('change', () => {
        const selectedStandard = standardSelect.value;
        const selectedSubject = subjectSelect.value;
        lessonSelect.innerHTML = '<option value="">Select Lesson (or All Lessons)</option><option value="mixed">All Lessons (Mixed Questions)</option>'; // Reset
        lessonSelect.disabled = true;
        startQuizBtn.disabled = true;


        if (selectedStandard && selectedSubject && subjectData[selectedStandard] && subjectData[selectedStandard][selectedSubject]) {
            const lessons = subjectData[selectedStandard][selectedSubject];
            lessons.forEach((lesson, index) => {
                const option = document.createElement('option');
                // Assuming lesson files are named lesson1.json, lesson2.json etc.
                // This needs to match the actual file naming convention.
                option.value = `lesson${index + 1}`; // Or use actual lesson names if they map to filenames
                option.textContent = lesson;
                lessonSelect.appendChild(option);
            });
            lessonSelect.disabled = false;
        } else if (selectedSubject) { // If subject is selected but no specific lessons (e.g. only mixed mode desired)
             lessonSelect.disabled = false; // Allow selecting "All Lessons"
        }
    });

    lessonSelect.addEventListener('change', () => {
        if (lessonSelect.value) {
            startQuizBtn.disabled = false;
        } else {
            startQuizBtn.disabled = true;
        }
    });

    startQuizBtn.addEventListener('click', () => {
        const standard = standardSelect.value;
        const subject = subjectSelect.value;
        const lesson = lessonSelect.value;

        if (standard && subject && lesson) {
            // Encode standard to be URL-friendly (e.g., +1 becomes plus1)
            const encodedStandard = standard.replace('+', 'plus');
            window.location.href = `quiz.html?standard=${encodedStandard}&subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`;
        } else {
            // Should not happen if button is enabled correctly, but as a fallback:
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
    } else { // Default to light or check system preference
        // Check system preference (optional)
        // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        //     applyTheme('dark');
        // } else {
        //     applyTheme('light');
        // }
        applyTheme('light'); // Default to light if no preference
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
