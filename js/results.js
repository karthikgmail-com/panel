// Function to apply theme from localStorage
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
applyThemeOnLoad();

document.addEventListener('DOMContentLoaded', () => {
    const correctAnswersSpan = document.getElementById('correct-answers');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const percentageDisplay = document.getElementById('percentage-display');
    const resultMessage = document.getElementById('result-message');
    const incorrectAnswersContainer = document.getElementById('incorrect-answers-container');
    const noIncorrectAnswersMsg = document.getElementById('no-incorrect-answers');
    const retakeQuizBtn = document.getElementById('retake-quiz-btn');
    const returnHomeBtn = document.getElementById('return-home-btn');
    const resultsCard = document.getElementById('results-card');

    // Initial animation for results card
    if (resultsCard) {
        // Ensure it starts from the initial state defined in CSS if applicable
        // resultsCard.classList.add('initial-state'); // If CSS defines .initial-state
        setTimeout(() => {
            resultsCard.classList.add('loaded'); // Triggers transition to opacity: 1, transform: translateY(0)
        }, 100); // Short delay for CSS to apply initial state before transition
    }

    const quizResultsData = JSON.parse(localStorage.getItem('quizResults'));

    if (quizResultsData) {
        const { score, totalQuestions, results, subject, lesson, standard } = quizResultsData;

        if (correctAnswersSpan) correctAnswersSpan.textContent = score;
        if (totalQuestionsSpan) totalQuestionsSpan.textContent = totalQuestions;

        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        if (percentageDisplay) percentageDisplay.textContent = `${percentage}%`;

        if (resultMessage) {
            if (percentage >= 90) {
                resultMessage.textContent = "Excellent! Perfect Score!";
                if (typeof confetti === 'function') { confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 1001 }); }
            } else if (percentage >= 75) {
                resultMessage.textContent = "Great Job! You're doing well!";
                if (typeof confetti === 'function') { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 1001 }); }
            } else if (percentage >= 50) {
                resultMessage.textContent = "Good Effort! Keep practicing.";
            } else {
                resultMessage.textContent = "Keep practicing! Every attempt helps you learn.";
            }
        }

        const incorrectAnswers = results.filter(r => !r.isCorrect);

        if (incorrectAnswersContainer) {
            if (incorrectAnswers.length > 0) {
                if (noIncorrectAnswersMsg) noIncorrectAnswersMsg.style.display = 'none';
                incorrectAnswersContainer.innerHTML = '';

                incorrectAnswers.forEach((item, idx) => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'incorrect-question-item p-3 my-3 bg-red-50 dark:bg-red-900/[.2] rounded-lg border border-red-200 dark:border-red-700/[.3] shadow-sm';

                    let questionPart = `<p class="question-text text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"><strong>Q${results.findIndex(r => r.question === item.question) + 1}:</strong> ${item.question}</p>`;
                    if (item.question_image) {
                        questionPart += `<img src="${item.question_image}" alt="Question image" class="my-2 rounded-md max-h-40 border dark:border-slate-600">`;
                    }

                    let userAnswerDisplay = 'Not answered';
                    if (item.userAnswer !== null) {
                        const userAnswerObject = item.options.find(opt => (typeof opt === 'string' ? opt : opt.text) === item.userAnswer);
                        if (typeof userAnswerObject === 'object' && userAnswerObject.image) {
                            userAnswerDisplay = `${item.userAnswer} <img src="${userAnswerObject.image}" alt="Your answer image" class="option-image ml-1 inline-block max-h-10 rounded">`;
                        } else {
                            userAnswerDisplay = item.userAnswer;
                        }
                    }

                    const correctAnswerObject = item.options.find(opt => (typeof opt === 'string' ? opt : opt.text) === item.correctAnswer);
                    let correctAnswerDisplay = item.correctAnswer;
                     if (typeof correctAnswerObject === 'object' && correctAnswerObject.image) {
                        correctAnswerDisplay = `${item.correctAnswer} <img src="${correctAnswerObject.image}" alt="Correct answer image" class="option-image ml-1 inline-block max-h-10 rounded">`;
                    }

                    itemElement.innerHTML = `
                        ${questionPart}
                        <p class="user-answer text-xs mt-1"><strong>Your Answer:</strong> <span class="text-red-600 dark:text-red-400 font-semibold">${userAnswerDisplay}</span></p>
                        <p class="correct-answer text-xs"><strong>Correct Answer:</strong> <span class="text-green-600 dark:text-green-400 font-semibold">${correctAnswerDisplay}</span></p>
                    `;
                    incorrectAnswersContainer.appendChild(itemElement);
                });
            } else {
                if (noIncorrectAnswersMsg) noIncorrectAnswersMsg.style.display = 'block';
                incorrectAnswersContainer.innerHTML = '';
            }
        }

        if (retakeQuizBtn) {
            retakeQuizBtn.addEventListener('click', () => {
                window.location.href = `quiz.html?standard=${standard}&subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`;
            });
        }

    } else {
        if (resultsCard) resultsCard.innerHTML = '<p class="text-center text-red-500 dark:text-red-400 p-5">Could not load test results. Please try taking a test first.</p>';
    }

    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
