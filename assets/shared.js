/* Shared helpers for the High5 games. Plain globals so pages work over file:// too. */

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function parseNames(text) {
    return text
        .split(',')
        .map(name => name.trim())
        .filter(name => name !== '');
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === id);
    });
}

/* Replays a CSS entry animation that has already run once. */
function replayAnimation(el, animation) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = animation;
}

function createTimer({ seconds, display, warnAt = 5, onTick, onDone }) {
    let remaining = seconds;
    let intervalId = null;

    function paint() {
        if (display) {
            display.textContent = remaining;
            display.classList.toggle('timer-warning', remaining <= warnAt);
        }
        if (onTick) onTick(remaining);
    }

    paint();

    return {
        start() {
            if (intervalId !== null) return;
            intervalId = setInterval(() => {
                remaining--;
                paint();
                if (remaining <= 0) {
                    this.stop();
                    if (onDone) onDone();
                }
            }, 1000);
        },
        stop() {
            clearInterval(intervalId);
            intervalId = null;
        },
        reset(newSeconds) {
            this.stop();
            remaining = newSeconds === undefined ? seconds : newSeconds;
            paint();
        },
        get remaining() {
            return remaining;
        }
    };
}

/* Tracks team scores by index, so duplicate team names never collide. */
class TeamScores {
    constructor() {
        this.teams = [];
    }

    init(names) {
        this.teams = names.map(name => ({ name, score: 0 }));
    }

    get count() {
        return this.teams.length;
    }

    name(index) {
        return this.teams[index].name;
    }

    award(index, points = 1) {
        this.teams[index].score += points;
    }

    topScore() {
        return this.teams.reduce((max, team) => Math.max(max, team.score), 0);
    }

    standings() {
        return this.teams
            .map((team, index) => ({ ...team, index }))
            .sort((a, b) => b.score - a.score);
    }

    renderScoreboard(el) {
        const top = this.topScore();
        el.innerHTML = '';
        this.teams.forEach(team => {
            const chip = document.createElement('div');
            chip.className = 'score-chip';
            if (top > 0 && team.score === top) chip.classList.add('leading');
            chip.innerHTML = `${escapeHtml(team.name)}<span class="score-value">${team.score}</span>`;
            el.appendChild(chip);
        });
    }

    renderTeamButtons(el, onPick) {
        el.innerHTML = '';
        this.teams.forEach((team, index) => {
            const btn = document.createElement('button');
            btn.textContent = team.name;
            btn.onclick = () => onPick(index);
            el.appendChild(btn);
        });
    }

    renderStandings(el) {
        const ranked = this.standings();
        const top = ranked.length ? ranked[0].score : 0;
        el.innerHTML = '';
        ranked.forEach(team => {
            const li = document.createElement('li');
            if (team.score === top) li.classList.add('first');
            li.innerHTML = `<span>${escapeHtml(team.name)}</span><span>${team.score}</span>`;
            el.appendChild(li);
        });
    }

    winnerText() {
        const ranked = this.standings();
        if (ranked.length === 0) return 'No teams played.';
        const top = ranked[0].score;
        const winners = ranked.filter(team => team.score === top);
        if (top === 0) return 'Nobody scored. Rematch?';
        if (winners.length === 1) return `${winners[0].name} wins!`;
        return `It's a tie: ${winners.map(team => team.name).join(' and ')}!`;
    }
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}
