'use strict';

// ProfileUI — orchestrates all interactive behavior on the profile page.
//
// Assumes these globals are loaded before this script:
//   window.ProfileForm       — profileForm.js
//   window.ValidationMessage — shared/validationMessage.js

(function () {

  // ── DOM refs ──────────────────────────────────────────────────────────────

  const onboardingSection   = document.getElementById('onboarding-section');
  const formSection         = document.getElementById('form-section');
  const confirmationSection = document.getElementById('confirmation-section');

  const ctaBtn  = document.getElementById('cta-btn');
  const saveBtn = document.getElementById('save-btn');

  const strengthBar   = document.getElementById('strength-bar');
  const strengthLabel = document.getElementById('strength-label');

  // ── Helpers ───────────────────────────────────────────────────────────────

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function setStrength(percent) {
    if (strengthBar) {
      strengthBar.style.width = `${percent}%`;
      strengthBar.setAttribute('aria-valuenow', percent);
    }
    if (strengthLabel) {
      strengthLabel.textContent = `${percent}%`;
    }
  }

  // ── Validation message ────────────────────────────────────────────────────

  let _msg = null;

  function _ensureMsg() {
    if (!_msg && saveBtn && window.ValidationMessage) {
      _msg = window.ValidationMessage.create(saveBtn);
    }
    return _msg;
  }

  // ── Section transitions ───────────────────────────────────────────────────

  function showOnboarding() {
    show(onboardingSection);
    hide(formSection);
    hide(confirmationSection);
  }

  function showForm() {
    hide(onboardingSection);
    show(formSection);
    hide(confirmationSection);
  }

  function showConfirmation() {
    hide(onboardingSection);
    hide(formSection);
    show(confirmationSection);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    const msg = _ensureMsg();
    if (msg) msg.clear();

    saveBtn.disabled = true;

    try {
      await window.ProfileForm.submit();
      showConfirmation();
    } catch (err) {
      if (msg) msg.showInvalid((err && err.message) || (window.I18n ? window.I18n.t('profile.error.saveFailed') : 'Could not save profile. Please try again.'));
      saveBtn.disabled = false;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async function init() {
    // Wire button listeners immediately — no need to wait for data load
    if (ctaBtn) ctaBtn.addEventListener('click', showForm);
    if (saveBtn) saveBtn.addEventListener('click', handleSave);

    // ProfileForm.init() loads existing data, pre-fills fields, and resolves
    // with { hasExistingData } once the fetch is complete.
    const { hasExistingData } = await window.ProfileForm.init(({ completedCount, totalCount }) => {
      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      setStrength(percent);
    });

    if (hasExistingData) {
      showForm();
    } else {
      showOnboarding();
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
