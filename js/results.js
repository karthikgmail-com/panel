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

    const scoreDisplay = document.getElementById('score-display');
    const correctAnswersSpan = document.getElementById('correct-answers');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const percentageDisplay = document.getElementById('percentage-display');
    const resultMessage = document.getElementById('result-message');
    const incorrectAnswersContainer = document.getElementById('incorrect-answers-container');
    const noIncorrectAnswersMsg = document.getElementById('no-incorrect-answers');
    const retakeQuizBtn = document.getElementById('retake-quiz-btn');
    const returnHomeBtn = document.getElementById('return-home-btn');
    const resultsCard = document.getElementById('results-card');

    const quizResultsData = JSON.parse(localStorage.getItem('quizResults'));

    if (quizResultsData) {
        const { score, totalQuestions, results, subject, lesson, standard } = quizResultsData;

        correctAnswersSpan.textContent = score;
        totalQuestionsSpan.textContent = totalQuestions;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        percentageDisplay.textContent = `${percentage}%`;

        if (percentage >= 80) {
            resultMessage.textContent = "Excellent! Well done!";
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    zIndex: 1001 // Ensure it's above other elements if needed
                });
            }
        } else if (percentage >= 60) {
            resultMessage.textContent = "Good effort! Keep practicing.";
        } else if (percentage >= 40) {
            resultMessage.textContent = "Keep practicing to improve your score.";
        } else {
            resultMessage.textContent = "Don't give up! Review your answers and try again.";
        }

        const incorrectAnswers = results.filter(r => !r.isCorrect);

        if (incorrectAnswers.length > 0) {
            if(noIncorrectAnswersMsg) noIncorrectAnswersMsg.style.display = 'none';
            incorrectAnswersContainer.innerHTML = ''; // Clear any placeholder

            incorrectAnswers.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'incorrect-question-item p-4 bg-red-50 rounded-lg border border-red-200 mb-4 shadow-sm';

                let optionsHTML = '<ul class="list-disc list-inside mt-1 text-sm">';
                item.options.forEach(opt => {
                    let optText = typeof opt === 'string' ? opt : opt.text;
                    let optImg = typeof opt === 'object' && opt.image ? `<img src="${opt.image}" alt="Option image" class="option-image ml-2 my-1 inline-block max-h-10 rounded">` : '';

                    if (optText === item.correctAnswer) {
                        optionsHTML += `<li class="text-green-700 font-semibold">${optText} ${optImg} (Correct)</li>`;
                    } else if (optText === item.userAnswer) {
                        optionsHTML += `<li class="text-red-700 font-semibold">${optText} ${optImg} (Your Answer)</li>`;
                    } else {
                        // optionsHTML += `<li>${optText} ${optImg}</li>`;
                    }
                });
                optionsHTML += '</ul>';


                itemElement.innerHTML = `
                    <p class="question-text text-md font-medium text-gray-800 mb-1"><strong>Q:</strong> ${item.question}</p>
                    ${item.question_image ? `<img src="${item.question_image}" alt="Question image" class="my-2 rounded-md max-h-48">` : ''}
                    <p class="user-answer text-sm mt-2"><strong>Your Answer:</strong> <span class="${item.isCorrect ? 'text-green-600' : 'text-red-600 font-semibold'}">${item.userAnswer || 'Not answered'}</span></p>
                    <p class="correct-answer text-sm"><strong>Correct Answer:</strong> <span class="text-green-600 font-semibold">${item.correctAnswer}</span></p>
                    ${incorrectAnswers.length < 5 ? `<details class="mt-1 text-sm"><summary class="cursor-pointer text-blue-600 hover:text-blue-800">Show all options</summary>${optionsHTML}</details>` : ''}

                `;
                incorrectAnswersContainer.appendChild(itemElement);
            });
        } else {
            if(noIncorrectAnswersMsg) noIncorrectAnswersMsg.style.display = 'block';
            incorrectAnswersContainer.innerHTML = ''; // Clear if it had anything
        }

        if (retakeQuizBtn) {
            retakeQuizBtn.addEventListener('click', () => {
                // Navigate back to the same quiz
                // Standard was stored as 'plus1' or 'plus2', needs to be converted back for URL if needed, or use as is if script.js handles it.
                // script.js expects standard with '+', but quiz.js gets it as 'plus1'.
                // For simplicity, let's assume quiz.html can take 'plus1' directly.
                window.location.href = `quiz.html?standard=${standard}&subject=${encodeURIComponent(subject)}&lesson=${encodeURIComponent(lesson)}`;
            });
        }

    } else {
        if (resultsCard) resultsCard.innerHTML = '<p class="text-center text-red-500">Could not load quiz results. Please try taking a quiz first.</p>';
    }

    if (returnHomeBtn) {
        returnHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Animate results card
    if (resultsCard) {
        setTimeout(() => {
            resultsCard.classList.add('loaded'); // Add class to trigger CSS transition
        }, 100); // Short delay to ensure transition is applied
    }

    // Clean up localStorage to prevent issues if the user navigates away and back
    // localStorage.removeItem('quizResults'); // Or clear only on "Return to Home" / starting new quiz
});
