function applyThemeOnLoad() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark'); // Default to light
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyThemeOnLoad(); // Apply theme as soon as DOM is ready

    const questionsContainer = document.getElementById('questions-container');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const timerDisplay = document.getElementById('time-left');
    const loadingIndicator = document.getElementById('loading-indicator');
    const progressIndicator = {
        current: document.getElementById('current-question-num'),
        total: document.getElementById('total-questions-num'),
    };
    const quizTitleElements = {
        subject: document.getElementById('subject-name'),
        lesson: document.getElementById('lesson-name'),
    };

    let questions = [];
    let userAnswers = {}; // Store { questionIndex: selectedOptionValue }
    let timerInterval;
    let timeAllocated = 0; // in seconds

    // Function to parse URL parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const standard = getQueryParam('standard');
    const subject = getQueryParam('subject');
    const lesson = getQueryParam('lesson');

    if (quizTitleElements.subject) quizTitleElements.subject.textContent = subject || 'N/A';
    if (quizTitleElements.lesson) quizTitleElements.lesson.textContent = lesson === 'mixed' ? 'Mixed Questions' : (lesson || 'N/A');


    async function loadQuestions() {
        if (!standard || !subject || !lesson) {
            questionsContainer.innerHTML = '<p class="text-red-500">Error: Quiz parameters missing. Please return to homepage and select a quiz.</p>';
            submitQuizBtn.disabled = true;
            return;
        }

        let filePath;
        if (lesson === 'mixed') {
            // For mixed mode, we'd need a manifest file or logic to fetch all lesson files for a subject
            // This is a placeholder - actual implementation of mixed mode data fetching will be more complex
            // For now, let's assume a manifest 'all.json' or we fetch the first lesson as a demo for mixed.
            // We need to define how mixed questions are aggregated.
            // TEMPORARY: Using a placeholder or first lesson for mixed mode demonstration.
            // A proper mixed mode would involve fetching multiple files and combining them.
            // Let's try to fetch a file named `_mixed.json` in the subject folder for now.
            // Or, more realistically, fetch all `lessonX.json` files and combine.
            // For simplicity in this step, we'll just log it and perhaps load a default if no mixed strategy is yet built.
            console.log(`Loading mixed questions for ${standard}/${subject}`);
            // This part will be expanded in a later step. For now, it might fail or load a sample.
            // We will simulate loading multiple lessons later. For now, let's try to load 'lesson1.json' as a fallback for mixed.
            filePath = `../data/${standard}/${subject.toLowerCase().replace(/\s+/g, '')}/lesson1.json`; // Fallback
            // A better approach for mixed:
            // 1. List all files in the subject directory.
            // 2. Fetch each one.
            // 3. Combine and shuffle.
            // This requires server-side listing or a manifest file. For pure static, manifest is better.
            // We'll assume a single file for now and refine mixed mode later.
            // For now, let's just try to load a specific file and if it fails, show an error.
            // Or, let's assume we have a pre-compiled `_mixed.json` for each subject.
            const subjectPath = subject.toLowerCase().replace(/\s+/g, '');
            filePath = `data/${standard}/${subjectPath}/_mixed.json`;
            // If _mixed.json isn't found, we should handle it gracefully.
            // For now, we'll proceed and let it fail if the file isn't there.
        } else {
            // Ensure subject name is path-friendly (e.g., "Computer Science" -> "computerscience")
            const subjectPath = subject.toLowerCase().replace(/\s+/g, '');
            filePath = `data/${standard}/${subjectPath}/${lesson}.json`;
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
            }
            questions = await response.json();
            if (!Array.isArray(questions)) {
                if (questions.questions && Array.isArray(questions.questions)) {
                    questions = questions.questions;
                } else {
                    throw new Error("Question data is not in the expected array format.");
                }
            }

            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (questionsContainer) questionsContainer.style.display = 'block';
            if (submitQuizBtn) submitQuizBtn.style.display = 'inline-block'; // Show submit button

            renderQuestions();
            setupTimer();
            updateProgress();

        } catch (error) {
            console.error('Failed to load questions:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (questionsContainer) {
                questionsContainer.style.display = 'block'; // Show container to display the error
                questionsContainer.innerHTML = `<p class="text-red-500 dark:text-red-400 text-center p-4">Fatal Error (contact admin)</p>`;
            }
            if (submitQuizBtn) submitQuizBtn.style.display = 'none';
        }
    }

    function renderQuestions() {
        if (!questionsContainer) return;
        questionsContainer.innerHTML = ''; // Clear previous
        questions.forEach((q, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question-card p-5 mb-6 bg-white rounded-lg shadow-md border border-gray-200';
            questionElement.innerHTML = `
                <p class="question-text text-lg font-semibold text-gray-800 mb-2">${index + 1}. ${q.question}</p>
                ${q.question_image ? `<img src="${q.question_image}" alt="Question image" class="my-3 rounded-md max-h-72 mx-auto shadow-sm">` : ''}
                <div class="options space-y-3 mt-4">
                    ${q.options.map((option, i) => {
                        const optionId = `q${index}_option${i}`;
                        let optionLabel;
                        if (typeof option === 'string') {
                            optionLabel = `<span class="option-text">${option}</span>`;
                        } else { // Object with text and/or image
                            optionLabel = `${option.text ? `<span class="option-text">${option.text}</span>` : ''}
                                         ${option.image ? `<img src="${option.image}" alt="Option image" class="option-image ml-2 my-1 inline-block max-h-16 rounded">` : ''}`;
                        }
                        // Applied .option-label and simplified base classes. Hover styles from Tailwind.
                        return `
                            <label for="${optionId}" class="option-label block p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <input type="radio" name="question${index}" id="${optionId}" value="${(typeof option === 'string' ? option : option.text) || `option_${i}`}" class="mr-3 opacity-0 absolute">
                                ${optionLabel}
                            </label>`;
                    }).join('')}
                </div>
            `;
            questionsContainer.appendChild(questionElement);

            // Add event listener for selecting options to give visual feedback using the .selected class
            const radioButtons = questionElement.querySelectorAll(`input[name="question${index}"]`);
            radioButtons.forEach(radio => {
                radio.addEventListener('change', (event) => {
                    // Remove 'selected' class from all labels for this question
                    questionElement.querySelectorAll('.options label.selected').forEach(label => label.classList.remove('selected'));

                    if (event.target.checked) {
                        event.target.parentElement.classList.add('selected');
                        userAnswers[index] = event.target.value;
                    }
                });
            });
        });
    }

    function setupTimer() {
        timeAllocated = questions.length * 2 * 60; // 2 minutes per question, in seconds
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeAllocated--;
            updateTimerDisplay();
            if (timeAllocated <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "Time's up!";
                timerDisplay.classList.add('low-time');
                autoSubmitQuiz();
            } else if (timeAllocated < 60 && !timerDisplay.classList.contains('low-time')) { // Less than 1 min
                timerDisplay.classList.add('low-time');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeAllocated / 60);
        const seconds = timeAllocated % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateProgress() {
        if (progressIndicator.current && progressIndicator.total) {
            // progressIndicator.current.textContent = '...'; // Or count answered questions
            progressIndicator.total.textContent = questions.length;
        }
    }


    function autoSubmitQuiz() {
        console.log("Time's up! Submitting quiz automatically.");
        // Add a visual cue that the quiz was auto-submitted
        const autoSubmitMessage = document.createElement('p');
        autoSubmitMessage.textContent = "Time ran out. Your quiz has been submitted automatically.";
        autoSubmitMessage.className = "text-center font-bold text-red-600 my-4";
        questionsContainer.insertAdjacentElement('afterend', autoSubmitMessage);
        submitQuizBtn.disabled = true;
        calculateAndStoreResults();
    }

    function calculateAndStoreResults() {
        let score = 0;
        const results = questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            // The correct answer could be the text itself or derived if options are objects
            const correctAnswer = q.answer;
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) {
                score++;
            }
            return {
                question: q.question,
                question_image: q.question_image,
                options: q.options,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect
            };
        });

        localStorage.setItem('quizResults', JSON.stringify({
            score: score,
            totalQuestions: questions.length,
            results: results,
            subject: subject,
            lesson: lesson,
            standard: standard // store standard for retake
        }));

        window.location.href = 'results.html';
    }

    submitQuizBtn.addEventListener('click', () => {
        // Optional: Confirm submission
        // if (!confirm("Are you sure you want to submit your answers?")) {
        //     return;
        // }
        clearInterval(timerInterval); // Stop timer on manual submit
        submitQuizBtn.disabled = true;
        submitQuizBtn.textContent = "Submitting...";
        calculateAndStoreResults();
    });

    // Load questions when the page is ready
    loadQuestions();
});
