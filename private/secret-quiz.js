document.body.insertAdjacentHTML('beforeend', `
    <button id="dimecka-quiz-trigger" class="dimecka-quiz-trigger" type="button">
        Don't click
    </button>

    <dialog id="dimecka-quiz-dialog" class="dimecka-quiz-dialog">
        <div class="dimecka-quiz-header">
            <button id="dimecka-quiz-close" class="dimecka-quiz-close" type="button" aria-label="Close quiz">×</button>
        </div>
        <p id="dimecka-quiz-question">Did you miss me?</p>
        <div id="dimecka-quiz-actions" class="dimecka-quiz-actions">
            <button id="dimecka-quiz-yes" type="button">Yes</button>
            <button id="dimecka-quiz-no" type="button">No</button>
        </div>
    </dialog>
`);

const dimeckaQuizTrigger = document.getElementById('dimecka-quiz-trigger');
const dimeckaQuizDialog = document.getElementById('dimecka-quiz-dialog');
const dimeckaQuizQuestion = document.getElementById('dimecka-quiz-question');
const dimeckaQuizActions = document.getElementById('dimecka-quiz-actions');
const dimeckaQuizYes = document.getElementById('dimecka-quiz-yes');
const dimeckaQuizNo = document.getElementById('dimecka-quiz-no');
const bangerUrl = 'https://youtu.be/XfR9iY5y94s?si=RlZd5Y3xL-I1Lp4g';
const christmasUrl = 'https://youtu.be/PTslBTBl1X8?si=JT37hGKgw1O_RMjO';
let dimeckaQuizStep = 'first';

const showNextQuestionPlaceholder = () => {
    dimeckaQuizQuestion.textContent = 'Next question coming soon.';
    dimeckaQuizActions.classList.add('hidden');
};

const showBetterDayQuestion = () => {
    dimeckaQuizStep = 'nah-better';
    dimeckaQuizQuestion.textContent = "I can see you're not in the mood.\n\nHere's one to make your day better";
    dimeckaQuizYes.textContent = '👀';
    dimeckaQuizNo.classList.add('hidden');
    dimeckaQuizActions.classList.remove('hidden');
};

const showBetterDayFollowup = () => {
    dimeckaQuizStep = 'nah-better-followup';
    dimeckaQuizQuestion.innerHTML = `🎄🎄🎄<br>
        <em>So here it is merry Christmas</em><br>
        <em>Everybody's having fun</em><br>
        <em>Look to the future now</em><br>
        <em>It's only just begun</em><br>
        🎄🎄🎄`;
    dimeckaQuizYes.textContent = 'Thanks';
    dimeckaQuizNo.textContent = "Didn't help";
    dimeckaQuizNo.classList.remove('hidden');
    dimeckaQuizActions.classList.remove('hidden');
};

const resetDimeckaQuiz = () => {
    dimeckaQuizStep = 'first';
    dimeckaQuizQuestion.textContent = 'Did you miss me?';
    dimeckaQuizYes.textContent = 'Yes';
    dimeckaQuizNo.textContent = 'No';
    dimeckaQuizNo.classList.remove('hidden');
    if (!dimeckaQuizNo.isConnected) dimeckaQuizActions.append(dimeckaQuizNo);
    dimeckaQuizActions.classList.remove('hidden');
};

const hideDimeckaQuiz = () => {
    dimeckaQuizTrigger.classList.add('hidden');
    if (dimeckaQuizDialog.open) dimeckaQuizDialog.close();
};

dimeckaQuizTrigger.addEventListener('click', () => {
    resetDimeckaQuiz();
    dimeckaQuizDialog.showModal();
});
dimeckaQuizDialog.querySelector('#dimecka-quiz-close').addEventListener('click', () => dimeckaQuizDialog.close());

dimeckaQuizYes.addEventListener('click', () => {
    if (dimeckaQuizStep === 'nah-boring') {
        showBetterDayQuestion();
        return;
    }

    if (dimeckaQuizStep === 'nah-better') {
        window.open(christmasUrl, '_blank', 'noopener,noreferrer');
        showBetterDayFollowup();
        return;
    }

    if (dimeckaQuizStep === 'aye-banger') {
        dimeckaQuizStep = 'aye-karaoke';
        dimeckaQuizQuestion.innerHTML = `🦘🦘🦘<br>
            <em>Do you come from a land down under</em><br>
            <em>Where women glow and men plunder?</em><br>
            <em>Can't you hear, can't you hear the thunder?</em><br>
            <em>You better run, you better take cover</em><br>
            🦘🦘🦘<br><br>
            Hope you enjoyed the karaoke break.<br>
            Now get back to the refinement!`;
        window.open(bangerUrl, '_blank', 'noopener,noreferrer');
        dimeckaQuizActions.classList.add('hidden');
        return;
    }

    if (dimeckaQuizStep === 'nah-better-followup') {
        dimeckaQuizStep = 'thanks-refinement';
        dimeckaQuizQuestion.textContent = 'Always 🫡\n\nAnd now get back to the refinement!';
        dimeckaQuizActions.classList.add('hidden');
        return;
    }

    if (dimeckaQuizStep === 'nah-refinement' || dimeckaQuizStep === 'aye-karaoke') {
        showNextQuestionPlaceholder();
        return;
    }

    if (dimeckaQuizStep === 'second') {
        dimeckaQuizStep = 'aye-banger';
        dimeckaQuizQuestion.textContent = "Awesome. But first, let's listen to this banger 🎶🎶🎶";
        dimeckaQuizYes.textContent = 'Okay';
        dimeckaQuizNo.textContent = 'No, thanks';
        dimeckaQuizNo.classList.remove('hidden');
        dimeckaQuizActions.classList.remove('hidden');
        return;
    }

    dimeckaQuizStep = 'second';
    dimeckaQuizQuestion.textContent = 'I knew it! Now tell me, do you want to do some shenanigans with me?';
    if (!dimeckaQuizNo.isConnected) dimeckaQuizActions.append(dimeckaQuizNo);
    dimeckaQuizActions.classList.remove('hidden');
    dimeckaQuizYes.textContent = 'Aye, lead the way';
    dimeckaQuizNo.textContent = 'Nah, mate';
});

dimeckaQuizNo.addEventListener('click', () => {
    if (dimeckaQuizStep === 'second') {
        dimeckaQuizStep = 'nah-boring';
        dimeckaQuizQuestion.textContent = 'Boooooooring.';
        dimeckaQuizYes.textContent = 'I know.';
        dimeckaQuizNo.textContent = ':(';
        dimeckaQuizNo.classList.remove('hidden');
        dimeckaQuizActions.classList.remove('hidden');
    } else if (dimeckaQuizStep === 'aye-banger') {
        dimeckaQuizStep = 'no-banger';
        dimeckaQuizQuestion.textContent = 'Your miss.\n\nThen get back to the refinement, champ.';
        dimeckaQuizActions.classList.add('hidden');
    } else if (dimeckaQuizStep === 'nah-boring') {
        showBetterDayQuestion();
    } else if (dimeckaQuizStep === 'nah-better-followup') {
        dimeckaQuizStep = 'nah-refinement';
        dimeckaQuizQuestion.textContent = 'Too bad.\n\nNow get back to the refinement!';
        dimeckaQuizActions.classList.add('hidden');
    } else if (dimeckaQuizNo.textContent === 'No') {
        dimeckaQuizNo.textContent = 'Try Again';
    } else if (dimeckaQuizNo.textContent === 'Try Again') {
        dimeckaQuizNo.textContent = 'Wrong Answer';
    } else {
        dimeckaQuizNo.remove();
    }
});

window.addEventListener('secret-quiz-access', event => {
    if (event.detail) {
        dimeckaQuizTrigger.classList.remove('hidden');
    } else {
        hideDimeckaQuiz();
    }
});
