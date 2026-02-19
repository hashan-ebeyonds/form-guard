/**
 * FormGuard.js v2.1
 * Advanced Form Validation Library — English built-in, other locales load separately.
 * License: MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self,
                global.FormGuard = factory());
})(this, function () {
    'use strict';

    // ── Shared locale registry ──────────────────────────────────────────────
    const _registry = {
        en: {
            required: 'This field is required.',
            minLength: 'Must be at least {min} characters.',
            maxLength: 'Must be no more than {max} characters.',
            min: 'Must be at least {min}.',
            max: 'Must be no more than {max}.',
            email: 'Please enter a valid email address.',
            url: 'Please enter a valid URL.',
            pattern: 'Invalid format.',
            numeric: 'Must be a number.',
            integer: 'Must be an integer.',
            alpha: 'Must contain only letters.',
            alphanumeric: 'Must contain only letters and numbers.',
            phone: 'Please enter a valid phone number.',
            date: 'Please enter a valid date.',
            dateMin: 'Date must be on or after {min}.',
            dateMax: 'Date must be on or before {max}.',
            equalTo: 'Must match the "{target}" field.',
            notEqualTo: 'Must not match the "{target}" field.',
            in: 'Must be one of: {values}.',
            notIn: 'Must not be one of: {values}.',
            fileSize: 'File size must not exceed {max}.',
            fileType: 'Allowed file types: {types}.',
            creditCard: 'Please enter a valid credit card number.',
            strongPassword: 'Password must contain uppercase, lowercase, number, and special character.',
            hexColor: 'Please enter a valid hex color (e.g. #ff0000).',
            ipv4: 'Please enter a valid IPv4 address.',
            ipv6: 'Please enter a valid IPv6 address.',
            json: 'Please enter valid JSON.',
            custom: 'Invalid value.',
        },
    };

    // ── Utilities ───────────────────────────────────────────────────────────
    const utils = {
        interpolate(tpl, vars) {
            return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : '{' + k + '}');
        },
        isEmpty(v) {
            if (v === null || v === undefined) return true;
            if (typeof v === 'string') return v.trim() === '';
            if (Array.isArray(v)) return v.length === 0;
            if (typeof FileList !== 'undefined' && v instanceof FileList) return v.length === 0;
            return false;
        },
        luhnCheck(n) {
            const d = String(n).replace(/\D/g, '');
            let s = 0, dbl = false;
            for (let i = d.length - 1; i >= 0; i--) {
                let x = parseInt(d[i]);
                if (dbl) { x *= 2; if (x > 9) x -= 9; }
                s += x; dbl = !dbl;
            }
            return s % 10 === 0;
        },
        formatBytes(b) {
            if (b < 1024) return b + ' B';
            if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
            return (b / 1048576).toFixed(1) + ' MB';
        },
        debounce(fn, ms) {
            let t;
            return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
        },
    };

    // ── Built-in validators ─────────────────────────────────────────────────
    const validators = {
        required: v => !utils.isEmpty(v),
        minLength: (v, m) => utils.isEmpty(v) || String(v).length >= m,
        maxLength: (v, m) => utils.isEmpty(v) || String(v).length <= m,
        min: (v, m) => utils.isEmpty(v) || Number(v) >= Number(m),
        max: (v, m) => utils.isEmpty(v) || Number(v) <= Number(m),
        email: v => utils.isEmpty(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        url(v) { if (utils.isEmpty(v)) return true; try { new URL(v); return true; } catch { return false; } },
        pattern(v, r) { if (utils.isEmpty(v)) return true; return (r instanceof RegExp ? r : new RegExp(r)).test(v); },
        numeric: v => utils.isEmpty(v) || (!isNaN(Number(v)) && String(v).trim() !== ''),
        integer: v => utils.isEmpty(v) || Number.isInteger(Number(v)),
        alpha: v => utils.isEmpty(v) || /^[a-zA-Z\u00C0-\u024F]+$/.test(v),
        alphanumeric: v => utils.isEmpty(v) || /^[a-zA-Z0-9\u00C0-\u024F]+$/.test(v),
        phone: v => utils.isEmpty(v) || /^\+?[\d\s\-().]{7,20}$/.test(v),
        date: v => utils.isEmpty(v) || !isNaN(new Date(v).getTime()),
        dateMin: (v, m) => utils.isEmpty(v) || new Date(v) >= new Date(m),
        dateMax: (v, m) => utils.isEmpty(v) || new Date(v) <= new Date(m),
        equalTo: (v, t, a) => utils.isEmpty(v) || v === a[t],
        notEqualTo: (v, t, a) => utils.isEmpty(v) || v !== a[t],
        in(v, l) { if (utils.isEmpty(v)) return true; const a = Array.isArray(l) ? l : String(l).split(',').map(s => s.trim()); return a.includes(String(v)); },
        notIn(v, l) { if (utils.isEmpty(v)) return true; const a = Array.isArray(l) ? l : String(l).split(',').map(s => s.trim()); return !a.includes(String(v)); },
        fileSize(v, m) { if (!v || !(typeof FileList !== 'undefined' && v instanceof FileList) || v.length === 0) return true; for (let i = 0; i < v.length; i++) if (v[i].size > m) return false; return true; },
        fileType(v, types) {
            if (!v || !(typeof FileList !== 'undefined' && v instanceof FileList) || v.length === 0) return true;
            const ok = Array.isArray(types) ? types : String(types).split(',').map(s => s.trim().toLowerCase());
            for (let i = 0; i < v.length; i++) {
                const ext = v[i].name.split('.').pop().toLowerCase();
                if (!ok.some(t => t === ext || v[i].type.toLowerCase().startsWith(t))) return false;
            }
            return true;
        },
        creditCard(v) { if (utils.isEmpty(v)) return true; const c = String(v).replace(/\s/g, ''); return /^\d{13,19}$/.test(c) && utils.luhnCheck(c); },
        strongPassword: v => utils.isEmpty(v) || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(v),
        hexColor: v => utils.isEmpty(v) || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v),
        ipv4(v) { return utils.isEmpty(v) || (/^(\d{1,3}\.){3}\d{1,3}$/.test(v) && v.split('.').every(n => parseInt(n) <= 255)); },
        ipv6: v => utils.isEmpty(v) || /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/.test(v),
        json(v) { if (utils.isEmpty(v)) return true; try { JSON.parse(v); return true; } catch { return false; } },
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    function isMeta(k) { return k.endsWith('Message') || k.endsWith('Label'); }
    function fieldValue(el) { if (el.type === 'checkbox') return el.checked; if (el.type === 'file') return el.files; return el.value; }

    /**
     * Map the user-facing validateOn option to the correct DOM event.
     *
     * KEY FIX: 'blur' does not bubble — so attaching it to the <form> element
     * never fires for child inputs. 'focusout' is functionally identical (fires
     * when a field loses focus) but DOES bubble, so the form-level listener
     * correctly catches it from any child.
     */
    function resolveEvent(validateOn) {
        switch (validateOn) {
            case 'blur': return { domEvent: 'focusout', debounced: false };
            case 'change': return { domEvent: 'change', debounced: false };
            case 'input': return { domEvent: 'input', debounced: true };
            default: return { domEvent: validateOn, debounced: false };
        }
    }

    // ── FormInstance ─────────────────────────────────────────────────────────
    class FormInstance {
        constructor(form, schema, options, guard) {
            this.form = form;
            this.schema = schema;
            this.guard = guard;
            this.options = Object.assign({
                validateOn: 'submit',
                debounce: 300,
                showErrors: true,
                errorClass: 'fg-error',
                validClass: 'fg-valid',
                errorContainerClass: 'fg-error-message',
                scrollToError: true,
                revalidateOnLocaleChange: false,
                onSuccess: null,
                onError: null,
                onFieldValid: null,
                onFieldInvalid: null,
            }, options);
            this._listeners = [];
            this._init();
        }

        _init() {
            const { validateOn, debounce: ms } = this.options;

            // Always handle submit
            const onSubmit = async (e) => {
                e.preventDefault();
                const result = await this._runAll();
                if (result.valid) {
                    this.options.onSuccess && this.options.onSuccess(this._collect(), result);
                } else {
                    this.options.onError && this.options.onError(result.errors, result);
                    if (this.options.scrollToError) {
                        const first = this.form.querySelector('.' + this.options.errorClass);
                        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            };
            this._listen(this.form, 'submit', onSubmit);

            // Live validation
            if (validateOn !== 'submit') {
                const { domEvent, debounced } = resolveEvent(validateOn);

                const handler = async (e) => {
                    const el = e.target;
                    const name = el.name;
                    // Only validate fields that exist in the schema
                    if (!name || !this.schema[name]) return;
                    const errors = await this.guard._runField(fieldValue(el), this.schema[name], this._collect());
                    this._applyState(name, errors);
                };

                this._listen(this.form, domEvent, debounced ? utils.debounce(handler, ms) : handler);
            }
        }

        async _runAll() {
            const data = this._collect();
            const result = await this.guard._runSchema(this.schema, data);
            if (this.options.showErrors) {
                Object.keys(this.schema).forEach(f => this._clearState(f));
                Object.keys(this.schema).forEach(f => this._applyState(f, result.errors[f] || []));
            }
            return result;
        }

        _collect() {
            const data = {};
            Array.from(this.form.elements).forEach(el => {
                if (!el.name) return;
                if (el.type === 'checkbox') data[el.name] = el.checked;
                else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
                else if (el.type === 'file') data[el.name] = el.files;
                else if (el.type === 'select-multiple') data[el.name] = Array.from(el.selectedOptions).map(o => o.value);
                else data[el.name] = el.value;
            });
            return data;
        }

        _applyState(name, errors) {
            const { errorClass: ec, validClass: vc, errorContainerClass: ecc } = this.options;
            const el = this.form.querySelector('[name="' + name + '"]');
            if (!el) return;
            this._clearState(name);
            if (errors.length > 0) {
                el.classList.add(ec);
                el.setAttribute('aria-invalid', 'true');
                let box = this.form.querySelector('[data-fg-errors="' + name + '"]');
                if (!box) {
                    box = document.createElement('div');
                    box.className = ecc;
                    box.setAttribute('data-fg-errors', name);
                    box.setAttribute('role', 'alert');
                    el.parentNode.insertBefore(box, el.nextSibling);
                }
                box.innerHTML = errors.map(e => '<span class="fg-error-item">' + e.message + '</span>').join('');
                this.options.onFieldInvalid && this.options.onFieldInvalid(name, errors);
            } else {
                el.classList.add(vc);
                el.removeAttribute('aria-invalid');
                this.options.onFieldValid && this.options.onFieldValid(name);
            }
        }

        _clearState(name) {
            const el = this.form.querySelector('[name="' + name + '"]');
            if (el) {
                el.classList.remove(this.options.errorClass, this.options.validClass);
                el.removeAttribute('aria-invalid');
            }
            const box = this.form.querySelector('[data-fg-errors="' + name + '"]');
            if (box) box.remove();
        }

        _listen(el, event, fn) {
            el.addEventListener(event, fn);
            this._listeners.push({ el, event, fn });
        }

        async validate() { return this._runAll(); }
        reset() { Object.keys(this.schema).forEach(f => this._clearState(f)); this.form.reset(); }
        destroy() { this._listeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn)); this._listeners = []; }
    }

    // ── FormGuard ────────────────────────────────────────────────────────────
    class FormGuard {
        constructor(options = {}) {
            this.locale = options.locale || 'en';
            this._custom = {};
            this._overrides = options.messages ? Object.assign({}, options.messages) : {};
            this._instances = new Map();
            if (!_registry[this.locale]) {
                console.warn('FormGuard: Locale "' + this.locale + '" not registered. Falling back to "en".');
                this.locale = 'en';
            }
        }

        get _msgs() { return Object.assign({}, _registry[this.locale] || _registry.en, this._overrides); }

        setLocale(locale) {
            if (!_registry[locale]) throw new Error('FormGuard: Locale "' + locale + '" not registered. Load locales/' + locale + '.js first.');
            this.locale = locale;
            this._instances.forEach(inst => { if (inst.options.revalidateOnLocaleChange) inst.validate(); });
            return this;
        }

        hasLocale(locale) { return Object.prototype.hasOwnProperty.call(_registry, locale); }
        getLocales() { return Object.keys(_registry); }

        addRule(name, fn, msg) {
            if (typeof fn !== 'function') throw new Error('FormGuard.addRule: "' + name + '" must be a function.');
            this._custom[name] = fn;
            if (typeof msg === 'string') {
                this._overrides[name] = msg;
            } else if (msg && typeof msg === 'object') {
                Object.entries(msg).forEach(([lang, text]) => {
                    if (!_registry[lang]) _registry[lang] = {};
                    _registry[lang][name] = text;
                });
                this._overrides[name] = msg[this.locale] || msg.en || 'Invalid value.';
            }
            return this;
        }

        _runFieldSync(value, rules, all) {
            const errors = [];
            for (const rn in rules) {
                if (!Object.prototype.hasOwnProperty.call(rules, rn) || isMeta(rn)) continue;
                const fn = validators[rn] || this._custom[rn];
                if (!fn) { console.warn('FormGuard: Unknown rule "' + rn + '"'); continue; }
                if (rn !== 'required' && utils.isEmpty(value)) continue;
                const ok = fn(value, rules[rn], all || {});
                if (ok instanceof Promise) continue;
                if (!ok) errors.push({ rule: rn, message: this._buildMsg(rn, rules[rn], rules) });
            }
            return errors;
        }

        async _runField(value, rules, all) {
            const errors = this._runFieldSync(value, rules, all);
            for (const rn in rules) {
                if (!Object.prototype.hasOwnProperty.call(rules, rn) || isMeta(rn)) continue;
                const fn = validators[rn] || this._custom[rn];
                if (!fn) continue;
                if (rn !== 'required' && utils.isEmpty(value)) continue;
                const ok = fn(value, rules[rn], all || {});
                if (ok instanceof Promise) {
                    const r = await ok;
                    if (!r) errors.push({ rule: rn, message: this._buildMsg(rn, rules[rn], rules) });
                }
            }
            return errors;
        }

        async _runSchema(schema, data) {
            const out = { valid: true, errors: {} };
            for (const f in schema) {
                if (!Object.prototype.hasOwnProperty.call(schema, f)) continue;
                const e = await this._runField(data[f], schema[f], data);
                if (e.length) { out.valid = false; out.errors[f] = e; }
            }
            return out;
        }

        _buildMsg(rn, rp, rules) {
            const inlineKey = rn + 'Message';
            if (rules[inlineKey]) return rules[inlineKey];
            const tpl = this._msgs[rn] || this._msgs.custom || 'Invalid value.';
            const vars = { min: rp, max: rp };
            if (rn === 'equalTo' || rn === 'notEqualTo') vars.target = rules[rp + 'Label'] || rp;
            if (rn === 'in' || rn === 'notIn') vars.values = Array.isArray(rp) ? rp.join(', ') : rp;
            if (rn === 'fileSize') vars.max = utils.formatBytes(rp);
            if (rn === 'fileType') vars.types = Array.isArray(rp) ? rp.join(', ') : rp;
            return utils.interpolate(tpl, vars);
        }

        // Headless validation
        validate(schema, data) {
            const out = { valid: true, errors: {} };
            for (const f in schema) {
                if (!Object.prototype.hasOwnProperty.call(schema, f)) continue;
                const e = this._runFieldSync(data[f], schema[f], data);
                if (e.length) { out.valid = false; out.errors[f] = e; }
            }
            return out;
        }

        validateAsync(schema, data) { return this._runSchema(schema, data); }

        // DOM binding
        bind(form, schema, options) {
            if (typeof form === 'string') form = document.querySelector(form);
            if (!form) throw new Error('FormGuard.bind: Form not found.');
            const inst = new FormInstance(form, schema, options || {}, this);
            this._instances.set(form, inst);
            return inst;
        }

        unbind(form) {
            if (typeof form === 'string') form = document.querySelector(form);
            const inst = this._instances.get(form);
            if (inst) { inst.destroy(); this._instances.delete(form); }
        }
    }

    // ── Static API ──────────────────────────────────────────────────────────
    FormGuard.create = options => new FormGuard(options);

    /**
     * Called by each locale file to register itself.
     * @param {string}  locale  e.g. 'fr'
     * @param {Object}  msgs    message map
     * @param {boolean} [extend=true]  if true, missing keys fall back to English
     */
    FormGuard.registerLocale = function (locale, msgs, extend) {
        _registry[locale] = (extend !== false)
            ? Object.assign({}, _registry.en, msgs)
            : Object.assign({}, msgs);
    };

    FormGuard.localeRegistry = _registry;
    FormGuard.validators = validators;
    FormGuard.utils = utils;

    return FormGuard;
});
