# TN Board MCQ Test (Google Themed)

A clean, Google-themed MCQ testing web application for Tamil Nadu State Board students (+1 and +2). This app focuses on simplicity, ease of use, and fast performance, built entirely with frontend technologies (HTML, CSS with Tailwind CSS, and Vanilla JavaScript).

## Features

-   **Google-Inspired UI:** Clean, minimalist design with Material Design cues (cards, shadows, clear typography).
-   **Standard, Subject & Lesson Selection:** Uses styled dropdowns for selecting quiz parameters.
-   **Mixed Questions Mode:** Option to get random MCQs from all lessons in a selected subject.
-   **Scrollable Quiz Interface:** All questions presented on a single, scrollable page.
    -   Questions displayed in individual cards.
    -   Custom-styled radio buttons for option selection.
-   **Image Support:** Questions and options can include images.
-   **Countdown Timer:** Dynamic timer (2 minutes per question) with a visual cue for low time. Auto-submits when time expires.
-   **Instant Results Page:**
    -   Clear score summary (correct/total, percentage).
    -   Encouraging feedback messages.
    -   Confetti animation for high scores.
    -   Detailed review section for incorrect answers (question, your answer, correct answer, with images).
-   **Retake & Navigation:** "Retake Test" and "Return to Home" options.
-   **Dark Mode:**
    -   User-toggleable dark/light mode.
    -   Defaults to system preference (`prefers-color-scheme`).
    -   User preference saved in `localStorage`.
-   **Responsive Design:** Mobile-first approach ensures usability across devices.
-   **Page Transitions:** Subtle fade-in animation on page load.
-   **Static & Deployable:** No backend required; fully deployable on static hosting platforms like GitHub Pages or Cloudflare Pages.

## Data Format

Quiz questions are stored in static JSON files located in the `/data` directory, following the structure:
`data/{standard_url_safe}/{subject_lowercase_no_spaces}/{lesson_file_name}.json`

-   `{standard_url_safe}`: e.g., `plus1`, `plus2`
-   `{subject_lowercase_no_spaces}`: e.g., `physics`, `computerscience`
-   `{lesson_file_name}.json`: e.g., `lesson1.json`. For mixed mode, `_mixed.json` is used.

**Example Question JSON Structure (array of objects):**
```json
[
  {
    "question": "What is the SI unit of force?",
    "question_image": "url/to/optional_question_image.jpg", // Optional
    "options": [
      "Watt",
      "Newton",
      { "text": "Joule", "image": "url/to/optional_option_image.jpg" }, // Option can be string or object
      "Pascal"
    ],
    "answer": "Newton"
  }
  // ... more questions
]
```

## Running Locally

1.  Clone the repository.
2.  Navigate to the project directory.
3.  Open `index.html` directly in your web browser.
    *For best results and to ensure `fetch` API works correctly for local JSON files, it's recommended to use a simple local HTTP server:*
    ```bash
    # If you have Python 3.x
    python -m http.server
    ```
    Then open `http://localhost:8000` (or the port indicated) in your browser.

## Deployment

As a fully static site, this project can be deployed to any static hosting service:

-   **GitHub Pages:** Ensure `index.html` is at the root of your deployment branch. Configure via repository Settings > Pages.
-   **Cloudflare Pages:** Connect your Git repository. Typically no build command is needed; set the output directory to `/` (root).
-   Other services like Netlify, Vercel, etc., also support simple static deployments.

## Customization

-   **Questions:** Add or modify JSON files in the `/data` directory. Ensure the structure is correct.
-   **Subjects/Lessons:** Update the `subjectData` object in `js/script.js` to reflect new subjects or lessons. The lesson names in `subjectData` should map to lesson file names (e.g., a displayed lesson name like "Lesson 1: Kinematics" should have a corresponding value like `lesson1` if the file is `lesson1.json`).
-   **Styling:** Adjust Tailwind CSS classes in HTML files or add custom styles to `style.css`. The color palette and font (Roboto) are set up for a Google-themed appearance.

---
Built with HTML, Tailwind CSS, and Vanilla JavaScript.
Inspired by Google's Material Design principles for a clean user experience.
