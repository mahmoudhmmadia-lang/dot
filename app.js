// NOQTA (نقطة) — Mahmoud & Rouh Mahmoud Project Script

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initLogoPicker();
  initPostFilters();
  initCopyButtons();
  initTimelineCheckboxes();
});

/* Tab Switcher */
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-section');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      btns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetSec = document.getElementById(target);
      if (targetSec) {
        targetSec.classList.add('active');
      }
    });
  });
}

/* Husband (Mahmoud) & Wife (Rouh Mahmoud) Logo Picker */
function initLogoPicker() {
  const pickBtns = document.querySelectorAll('.pick-btn');
  let savedPicks = JSON.parse(localStorage.getItem('noqta_couple_picks_v2')) || {};

  // Restore saved picks
  pickBtns.forEach(btn => {
    const logoCard = btn.closest('.logo-card');
    const logoId = logoCard.getAttribute('data-logo-id');
    const person = btn.getAttribute('data-person');

    if (savedPicks[logoId] && savedPicks[logoId][person]) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', () => {
      if (!savedPicks[logoId]) savedPicks[logoId] = {};

      if (savedPicks[logoId][person]) {
        delete savedPicks[logoId][person];
        btn.classList.remove('selected');
        const nameText = person === 'mahmoud' ? 'محمود 💙' : 'روح محمود 💖';
        showToast(`تم إلغاء التحديد لـ ${nameText}`);
      } else {
        savedPicks[logoId][person] = true;
        btn.classList.add('selected');
        const nameText = person === 'mahmoud' ? 'محمود 💙' : 'روح محمود 💖';
        showToast(`تم حفظ الشعار كـ خيار مفضل لـ ${nameText}`);
      }

      localStorage.setItem('noqta_couple_picks_v2', JSON.stringify(savedPicks));
    });
  });
}

/* Category Filter for Posts */
function initPostFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const postCards = document.querySelectorAll('.post-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      postCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else {
          const category = card.getAttribute('data-category');
          card.style.display = (category === filter) ? 'flex' : 'none';
        }
      });
    });
  });
}

/* Copy Post Text */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.post-card');
      const body = card.querySelector('.post-body');

      if (body) {
        navigator.clipboard.writeText(body.textContent.trim()).then(() => {
          showToast('تم نسخ نص البوست للحافظة بنجاح! 📋');
        }).catch(err => {
          console.error(err);
        });
      }
    });
  });
}

/* Timeline Checkboxes */
function initTimelineCheckboxes() {
  const cbs = document.querySelectorAll('.timeline-check');
  let savedSteps = JSON.parse(localStorage.getItem('noqta_timeline_steps')) || {};

  cbs.forEach((cb, idx) => {
    if (savedSteps[idx]) cb.checked = true;

    cb.addEventListener('change', () => {
      savedSteps[idx] = cb.checked;
      localStorage.setItem('noqta_timeline_steps', JSON.stringify(savedSteps));
      showToast(cb.checked ? 'تم تحديث الخطوة كمكتملة! 🚀' : 'تم تجميع الخطوة للمتابعة');
    });
  });
}

/* Toast Notification */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
