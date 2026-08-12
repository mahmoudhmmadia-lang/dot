if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initLogoChooser();
  initExperiments();
  initVotes();
  initRoadmap();
  initPostFilters();
  initCopyButtons();
});

const storage = {
  read(key, fallback = {}) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The page still works when private browsing blocks storage.
    }
  }
};

function initLogoChooser() {
  const key = 'noqta_logo_choices_v4';
  const choices = storage.read(key);
  const buttons = [...document.querySelectorAll('[data-logo-group]')];

  function render(group) {
    const choice = choices[group];
    const summary = document.querySelector(`[data-logo-summary="${group}"]`);

    buttons
      .filter((button) => button.dataset.logoGroup === group)
      .forEach((button) => {
        const selected = choice?.id === button.dataset.logoId;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });

    if (!summary) return;
    const name = summary.querySelector('[data-summary-name]');
    const image = summary.querySelector('[data-summary-image]');

    if (choice) {
      name.textContent = choice.name;
      image.src = choice.src;
      image.alt = `الشعار المختار: ${choice.name}`;
    } else {
      name.textContent = 'لم يتم الاختيار بعد';
      image.src = group === 'pro' ? 'assets/noqta-pro.svg' : 'assets/noqta-business.svg';
      image.alt = '';
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.logoGroup;
      const isAlreadySelected = choices[group]?.id === button.dataset.logoId;

      if (isAlreadySelected) {
        delete choices[group];
        showToast('تم إلغاء اختيار الشعار.');
      } else {
        choices[group] = {
          id: button.dataset.logoId,
          name: button.dataset.logoName,
          src: button.dataset.logoSrc
        };
        showToast(`تم اعتماد «${button.dataset.logoName}» لهذا الاتجاه.`);
      }

      storage.write(key, choices);
      render(group);
    });
  });

  render('pro');
  render('biz');
}

function initTabs() {
  const buttons = [...document.querySelectorAll('.tab-btn')];
  const panels = [...document.querySelectorAll('.tab-panel')];
  const validIds = panels.map((panel) => panel.id);

  function activate(id, updateUrl = true, shouldScroll = true) {
    if (!validIds.includes(id)) id = 'decision';

    buttons.forEach((button) => {
      const isActive = button.dataset.tab === id;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === id;
      panel.hidden = !isActive;
      panel.classList.toggle('active', isActive);
    });

    if (updateUrl) history.replaceState(null, '', `#${id}`);
    if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button.dataset.tab));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? 1 : -1;
      const next = buttons[(index + direction + buttons.length) % buttons.length];
      next.focus();
      activate(next.dataset.tab);
    });
  });

  document.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => activate(button.dataset.go));
  });

  const initial = window.location.hash.replace('#', '');
  activate(validIds.includes(initial) ? initial : 'decision', false, false);
  document.documentElement.style.scrollBehavior = 'auto';
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => {
    document.documentElement.style.scrollBehavior = '';
  });
}

function initExperiments() {
  const saved = storage.read('noqta_experiments_v3');

  document.querySelectorAll('[data-experiment]').forEach((form) => {
    const id = form.dataset.experiment;
    const savedForm = saved[id] || {};

    form.querySelectorAll('input').forEach((input) => {
      if (savedForm[input.name] !== undefined) input.value = savedForm[input.name];
      input.addEventListener('input', () => {
        const current = storage.read('noqta_experiments_v3');
        current[id] = readExperiment(form);
        storage.write('noqta_experiments_v3', current);
        renderExperiment(form);
      });
    });

    renderExperiment(form);
  });
}

function readExperiment(form) {
  return [...form.querySelectorAll('input')].reduce((result, input) => {
    result[input.name] = Math.max(0, Number(input.value) || 0);
    return result;
  }, {});
}

function renderExperiment(form) {
  const values = readExperiment(form);
  const conversion = values.contacts > 0 ? (values.paid / values.contacts) * 100 : null;
  const hourly = values.hours > 0 ? values.revenue / values.hours : null;
  const target = form.dataset.experiment === 'pro' ? 30 : 20;
  const conversionEl = form.querySelector('[data-result="conversion"]');
  const hourlyEl = form.querySelector('[data-result="hourly"]');
  const signalEl = form.querySelector('[data-result="signal"]');

  conversionEl.textContent = conversion === null ? '—' : `${conversion.toFixed(1)}%`;
  hourlyEl.textContent = hourly === null ? '—' : hourly.toFixed(2);
  signalEl.className = 'signal';

  if (values.contacts === 0) {
    signalEl.textContent = 'بانتظار بيانات';
    signalEl.classList.add('neutral');
  } else if (values.interested > values.contacts || values.paid > values.interested) {
    signalEl.textContent = 'راجع الأرقام';
    signalEl.classList.add('negative');
  } else if (values.paid >= 3) {
    signalEl.textContent = 'إشارة قوية';
    signalEl.classList.add('positive');
  } else if (values.contacts < target) {
    signalEl.textContent = 'أكمل الاختبار';
    signalEl.classList.add('warning');
  } else if (values.paid > 0) {
    signalEl.textContent = 'إشارة أولية';
    signalEl.classList.add('warning');
  } else {
    signalEl.textContent = 'عدّل العرض';
    signalEl.classList.add('negative');
  }
}

function initVotes() {
  const key = 'noqta_team_votes_v3';
  const votes = storage.read(key);

  document.querySelectorAll('.person-vote').forEach((group) => {
    const person = group.dataset.person;
    const buttons = [...group.querySelectorAll('[data-choice]')];

    function render() {
      buttons.forEach((button) => {
        button.classList.toggle('selected', votes[person] === button.dataset.choice);
      });
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        votes[person] = button.dataset.choice;
        storage.write(key, votes);
        render();
        showToast('تم حفظ الرأي. ارجعوا إليه بعد نتائج اليوم 30.');
      });
    });

    render();
  });
}

function initRoadmap() {
  const key = 'noqta_roadmap_v3';
  const saved = storage.read(key);
  const boxes = [...document.querySelectorAll('[data-step]')];
  const number = document.querySelector('[data-progress-number]');
  const bar = document.querySelector('[data-progress-bar]');

  function updateProgress() {
    const completed = boxes.filter((box) => box.checked).length;
    const percentage = boxes.length ? Math.round((completed / boxes.length) * 100) : 0;
    number.textContent = `${percentage}%`;
    bar.style.width = `${percentage}%`;
  }

  boxes.forEach((box) => {
    box.checked = Boolean(saved[box.dataset.step]);
    box.addEventListener('change', () => {
      saved[box.dataset.step] = box.checked;
      storage.write(key, saved);
      updateProgress();
    });
  });

  updateProgress();
}

function initPostFilters() {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-segment]')];

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      cards.forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.segment !== filter;
      });
    });
  });
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const copy = button.closest('.post-card')?.querySelector('.post-copy');
      if (!copy) return;
      const text = copy.textContent.trim();

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      const original = button.textContent;
      button.textContent = 'تم النسخ';
      showToast('تم نسخ النص. راجعه وخصصه قبل النشر.');
      setTimeout(() => { button.textContent = original; }, 1600);
    });
  });
}

let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
