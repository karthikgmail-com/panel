// Function to apply theme from localStorage before DOM content fully loads (if needed for critical styling)
// However, better to do it once DOM is ready to ensure body exists.
function applyThemeOnLoad() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    if (savedTheme === 'dark') {
        body.classList.add('dark');
    } else if (savedTheme === 'light') {
        body.classList.remove('dark');
    } else { // Not in localStorage, check system
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark');
        }
    }
}
applyThemeOnLoad(); // Apply as early as possible if <body> is guaranteed.

document.addEventListener('DOMContentLoaded', () => {
    // Re-apply or confirm theme once DOM is fully ready, especially if toggle is on this page
    // applyThemeOnLoad(); // Already called, but ensure it's robust.

    const questionsContainer = document.getElementById('questions-container');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const timerDisplay = document.getElementById('time-left');
    const loadingIndicator = document.getElementById('loading-indicator');

    const subjectNameDisplay = document.getElementById('subject-name');
    const lessonNameDisplay = document.getElementById('lesson-name');
    const totalQuestionsNumDisplay = document.getElementById('total-questions-num');

    let questions = [];
    let userAnswers = {}; // Store { questionIndex: selectedOptionValue }
    let timerInterval;
    let timeAllocated = 0; // in seconds

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const standard = getQueryParam('standard');
    const subject = getQueryParam('subject');
    const lesson = getQueryParam('lesson');

    if (subjectNameDisplay) subjectNameDisplay.textContent = subject || 'N/A';
    if (lessonNameDisplay) lessonNameDisplay.textContent = lesson === 'mixed' ? 'Mixed Questions' : (lesson ? lesson.replace(/lesson(\d+)/, 'Lesson $1') : 'N/A');


    async function loadQuestions() {
        if (!standard || !subject || !lesson) {
            if(loadingIndicator) loadingIndicator.style.display = 'none';
            if(questionsContainer) questionsContainer.innerHTML = '<p class="text-red-500 dark:text-red-400 text-center p-4">Error: Quiz parameters missing. Please return to homepage.</p>';
            if(submitQuizBtn) submitQuizBtn.style.display = 'none';
            return;
        }

        const subjectPath = subject.toLowerCase().replace(/\s+/g, '');
        let filePath;
        if (lesson === 'mixed') {
            filePath = `data/${standard}/${subjectPath}/_mixed.json`;
        } else {
            filePath = `data/${standard}/${subjectPath}/${lesson}.json`;
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            const rawQuestions = await response.json();

            // Ensure questions is an array (it might be an object with a 'questions' property)
            if (Array.isArray(rawQuestions)) {
                questions = rawQuestions;
            } else if (rawQuestions && Array.isArray(rawQuestions.questions)) {
                questions = rawQuestions.questions;
            } else {
                throw new Error("Question data is not in the expected array format.");
            }

            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (questionsContainer) questionsContainer.style.display = 'block';
            if (submitQuizBtn) submitQuizBtn.style.display = 'inline-block';

            renderQuestions();
            if (totalQuestionsNumDisplay) totalQuestionsNumDisplay.textContent = questions.length;
            setupTimer();
        } catch (error) {
            console.error('Failed to load questions:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (questionsContainer) {
                questionsContainer.style.display = 'block';
                questionsContainer.innerHTML = `<p class="text-red-500 dark:text-red-400 text-center p-4">Fatal Error (contact admin)</p>`;
            }
            if (submitQuizBtn) submitQuizBtn.style.display = 'none';
        }
    }

    function renderQuestions() {
        if (!questionsContainer) return;
        questionsContainer.innerHTML = '';
        questions.forEach((q, index) => {
            const questionId = `q_${index}`;
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card bg-white dark:bg-slate-700 p-4 sm:p-6 rounded-lg shadow-md mb-6';

            let questionHTML = `<p class="question-text text-base sm:text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">${index + 1}. ${q.question}</p>`;
            if (q.question_image) {
                questionHTML += `<img src="${q.question_image}" alt="Question image ${index + 1}" class="my-3 rounded-md max-h-72 mx-auto shadow-sm border dark:border-slate-600">`;
            }

            const optionsHTML = q.options.map((option, i) => {
                const optionId = `${questionId}_option${i}`;
                let optionText, optionImageHTML = '';
                let optionValue;

                if (typeof option === 'string') {
                    optionText = option;
                    optionValue = option;
                } else { // Object with text and/or image
                    optionText = option.text || '';
                    optionValue = option.text || `option_${i}`; // Ensure a value
                    if (option.image) {
                        optionImageHTML = `<img src="${option.image}" alt="Option image ${i+1}" class="option-image ml-2 my-1 inline-block max-h-16 rounded border dark:border-slate-600 shadow-sm">`;
                    }
                }
                // Google-like radio button styling:
                // Hide actual radio, style the label.
                // Use Tailwind for focus, hover, and checked states on the label.
                // Refined selected state: only border color changes on the label, custom radio indicator handles the fill.
                return `
                    <label for="${optionId}" class="option-label flex items-center p-3 my-2 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 cursor-pointer transition-colors duration-150 has-[:checked]:border-blue-600 dark:has-[:checked]:border-sky-500 has-[:checked]:font-medium">
                        <input type="radio" name="${questionId}" id="${optionId}" value="${optionValue.replace(/"/g, '&quot;')}" class="custom-radio opacity-0 w-0 h-0">
                        <span class="radio-custom-indicator w-5 h-5 inline-block mr-3 border-2 border-gray-400 dark:border-gray-500 rounded-full flex-shrink-0 transition-all duration-150"></span>
                        <span class="option-text text-sm sm:text-base text-gray-700 dark:text-gray-200">${optionText}</span>
                        ${optionImageHTML}
                    </label>
                `;
            }).join('');

            questionCard.innerHTML = questionHTML + `<div class="options mt-4 space-y-1">${optionsHTML}</div>`;
            questionsContainer.appendChild(questionCard);

            // Add event listener for custom radio button behavior if needed (e.g. if has-[:checked] is not enough)
            // For now, relying on has-[:checked] and CSS for styling the custom indicator.
            // However, storing answers requires JS:
            const radioButtons = questionCard.querySelectorAll(`input[name="${questionId}"]`);
            radioButtons.forEach(radio => {
                radio.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        userAnswers[index] = event.target.value;
                        // Update all labels in this group to remove manual 'selected' class if any, and re-apply to current.
                        // This is mainly if we don't rely solely on :checked state for complex styling.
                        // For now, :checked CSS handles visual state.
                    }
                });
            });
        });
        addCustomRadioStyling();
    }

    function addCustomRadioStyling() {
        // This function could inject dynamic CSS if needed, or it's better done in style.css
        // For :checked state of the custom indicator
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            .custom-radio:checked + .radio-custom-indicator {
                background-color: #3b82f6; /* blue-500 */
                border-color: #2563eb; /* blue-600 */
                background-image: url('data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="3"/></svg>');
                background-repeat: no-repeat;
                background-position: center;
            }
            body.dark .custom-radio:checked + .radio-custom-indicator {
                background-color: #0ea5e9; /* sky-500 */
                border-color: #0284c7; /* sky-600 */
            }
        `;
        document.head.appendChild(styleSheet);
    }

    function setupTimer() {
        if (!questions || questions.length === 0) return;
        timeAllocated = questions.length * 2 * 60; // 2 minutes per question, in seconds

        updateTimerDisplay(); // Initial display

        timerInterval = setInterval(() => {
            timeAllocated--;
            updateTimerDisplay();
            if (timeAllocated <= 0) {
                clearInterval(timerInterval);
                if(timerDisplay) timerDisplay.innerHTML = "Time's up!"; // Keep "Time: " prefix
                timerDisplay.closest('#timer')?.classList.add('low-time');
                autoSubmitQuiz();
            } else if (timeAllocated < 60 && timeAllocated > 0) { // Less than 1 min remaining
                 timerDisplay.closest('#timer')?.classList.add('low-time');
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        const minutes = Math.floor(timeAllocated / 60);
        const seconds = timeAllocated % 60;
        // Assumes timerDisplay is the parent div and time-left is the span
        const timeLeftSpan = document.getElementById('time-left');
        if(timeLeftSpan) timeLeftSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function calculateAndStoreResults() {
        let score = 0;
        const resultsToStore = questions.map((q, index) => {
            const userAnswer = userAnswers[index] || null; // Default to null if not answered
            const correctAnswer = q.answer;
            const isCorrect = userAnswer === correctAnswer;
            if (isCorrect) {
                score++;
            }
            return {
                question: q.question,
                question_image: q.question_image || null,
                options: q.options,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect
            };
        });

        localStorage.setItem('quizResults', JSON.stringify({
            score: score,
            totalQuestions: questions.length,
            results: resultsToStore,
            subject: subject, // Already have from getQueryParam
            lesson: lesson,   // Already have from getQueryParam
            standard: standard // Already have from getQueryParam
        }));

        window.location.href = 'results.html';
    }

    function autoSubmitQuiz() {
        console.log("Time's up! Submitting quiz automatically.");
        // Optionally, add a visual cue like a message, but for now, just submit.
        if (submitQuizBtn) submitQuizBtn.disabled = true;
        calculateAndStoreResults();
    }

    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', () => {
            if (submitQuizBtn.disabled) return;

            // Optional: Confirmation dialog
            // if (!confirm("Are you sure you want to submit your answers?")) {
            //     return;
            // }
            clearInterval(timerInterval);
            submitQuizBtn.disabled = true;
            submitQuizBtn.textContent = "Submitting...";
            calculateAndStoreResults();
        });
    }

    // Load questions when the page is ready
    loadQuestions();
});
