(function () {
  // Inject validation-state styles once — not defined in style.css
  const _style = document.createElement('style');
  _style.textContent = `
    .input-field--valid {
      border-color: #4d7c7a !important;
      border-width: 2px !important;
    }
    .input-field--invalid {
      border-color: #b91c1c !important;
      border-width: 2px !important;
    }
    .input-field--valid + .input-label {
      color: #4d7c7a;
    }
    .input-field--invalid + .input-label {
      color: #b91c1c;
    }
  `;
  document.head.appendChild(_style);

  // ── Factory ────────────────────────────────────────────────────────────────
  // InputField.create(config) → { element, getValue, setValue, setValid,
  //                               setInvalid, clearValidation, focus }
  //
  // config:
  //   id          {string}   — id + name attribute on the <input>
  //   label       {string}   — <label> text (floats above on focus/fill)
  //   placeholder {string}   — visible hint text inside the input (optional)
  //   type        {string}   — input type, default "text"
  //   onChange    {function} — called with (value, event) on every keystroke
  //   required    {boolean}  — adds required attribute (default false)

  function create({ id, label, placeholder, type = 'text', onChange, required = false } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';

    const input = document.createElement('input');
    input.type        = type;
    input.id          = id;
    input.name        = id;
    input.className   = 'input-field';
    // A non-empty placeholder is required for the CSS :not(:placeholder-shown)
    // floating-label trick in style.css; fall back to a single space.
    input.placeholder = placeholder || ' ';
    if (required) input.required = true;

    const labelEl = document.createElement('label');
    labelEl.htmlFor     = id;
    labelEl.className   = 'input-label';
    labelEl.textContent = label;

    // Input must precede label so the CSS sibling selector (+) works
    wrapper.appendChild(input);
    wrapper.appendChild(labelEl);

    input.addEventListener('input', function (e) {
      if (typeof onChange === 'function') onChange(input.value, e);
    });

    // ── Public instance API ──────────────────────────────────────────────────
    return {
      element: wrapper,

      getValue() {
        return input.value.trim();
      },

      setValue(v) {
        input.value = v ?? '';
      },

      setValid() {
        input.classList.remove('input-field--invalid');
        input.classList.add('input-field--valid');
      },

      setInvalid() {
        input.classList.remove('input-field--valid');
        input.classList.add('input-field--invalid');
      },

      clearValidation() {
        input.classList.remove('input-field--valid', 'input-field--invalid');
      },

      focus() {
        input.focus();
      },
    };
  }

  window.InputField = { create };
})();
