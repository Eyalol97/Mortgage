(function () {
  const _t = {
    en: {
      // Navbar
      'nav.simulator': 'Simulator',
      'nav.signIn':    'Sign In',
      'nav.profile':   'Profile',
      'nav.langBtn':   'עברית',
      'nav.logout':    'Log out',

      // Home — hero
      'home.eyebrow':   'Israeli Mortgage Assistant',
      'home.title':     'Guided Clarity',
      'home.subtitle':  'Ask mortgage questions in plain Hebrew or English — get clear, regulation-aware answers instantly. Ready to run the numbers?',
      'home.cta':       'Open Simulator →',

      // Home — chat
      'home.greeting':      "Hi! I'm your Mortgage Assistant. I can help you understand mortgage concepts, interest rate tracks, Bank of Israel regulations, and more. What would you like to know?",
      'home.chipsLabel':    'Suggested topics',
      'home.followUpsLabel':'Follow-up questions',
      'home.inputPlaceholder': 'Ask a mortgage question…',
      'home.disclaimer':    'This response is for educational purposes only and does not constitute financial advice. Please consult a licensed mortgage advisor before making any decisions.',

      // Home — chip labels (display only; data-query stays in English)
      'home.chip.amortization':    'What is amortization?',
      'home.chip.tracks':          'Mortgage track types',
      'home.chip.prime':           'Prime rate explained',
      'home.chip.ltv':             'What is LTV?',
      'home.chip.fixedVsVariable': 'Fixed vs variable rate',
      'home.chip.monthlyPayment':  'Monthly payment',

      // Bot dynamic strings
      'bot.outOfDomain': "I can only help with mortgage-related questions — concepts, interest rate tracks, loan types, or Bank of Israel regulations. Please try a different question.",
      'bot.networkError': 'Sorry, something went wrong reaching the server. Please try again.',

      // Simulator — form
      'sim.title':           'Mortgage Simulator',
      'sim.subtitle':        'Fill in any 3 of the 4 financial fields and press <strong>Solve</strong> to calculate the missing value.',
      'sim.loanSettings':    'Loan Settings',
      'sim.repaymentMethod': 'Repayment Method',
      'sim.selectDefault':   '— Select —',
      'sim.shpitzer':        'Shpitzer (Fixed Payment)',
      'sim.kerenShava':      'Equal Principal (Keren Shava)',
      'sim.bullet':          'Bullet (Interest Only)',
      'sim.interestMethod':  'Interest Method',
      'sim.primeLinked':     'Prime-Linked',
      'sim.fixed':           'Fixed',
      'sim.cpiLinked':       'CPI-Linked',
      'sim.annualRate':      'Annual Interest Rate (%)',
      'sim.annualRateHint':  '— optional, leave empty for market default',
      'sim.financialFields': 'Financial Fields',
      'sim.fill3of4':        '(fill exactly 3 of 4)',
      'sim.propertyPrice':   'Property Price (₪)',
      'sim.equity':          'Equity / Down Payment (₪)',
      'sim.duration':        'Loan Duration (years)',
      'sim.monthlyPayment':  'Monthly Payment (₪)',

      // Simulator — actions & results
      'sim.solve':             'Solve',
      'sim.calculating':       'Calculating…',
      'sim.results':           'Results',
      'sim.monthlyPaymentLabel': 'Monthly Payment',
      'sim.totalInterest':     'Total Interest',
      'sim.totalPayment':      'Total Payment',
      'sim.viewAmort':         'View Amortization Schedule',
      'sim.saveAsMix':         'Save as Mix',
      'sim.compareAll':        'Compare All Mixes',
      'sim.mixComparison':     'Mix Comparison',
      'sim.amortSchedule':     'Amortization Schedule',
      'sim.downloadPdf':       'Download PDF Summary',
      'sim.mixTab':            'Mix',

      // Simulator — main table column headers
      'sim.col.propertyPrice':  'Property Price (₪)',
      'sim.col.equity':         'Equity (₪)',
      'sim.col.duration':       'Duration (yrs)',
      'sim.col.monthlyPayment': 'Monthly Payment (₪)',
      'sim.col.loanAmount':     'Loan Amount (₪)',
      'sim.col.totalInterest':  'Total Interest (₪)',
      'sim.col.totalPayment':   'Total Payment (₪)',

      // Simulator — amort table headers
      'sim.amortHeader.month':            'Month',
      'sim.amortHeader.payment':          'Payment (₪)',
      'sim.amortHeader.principal':        'Principal (₪)',
      'sim.amortHeader.interest':         'Interest (₪)',
      'sim.amortHeader.remainingBalance': 'Remaining Balance (₪)',

      // Simulator — show-all button
      'sim.showAll': 'Show all',
      'sim.months':  'months',

      // Simulator — solved-field labels
      'sim.fieldLabel.propertyPrice':  'Property Price',
      'sim.fieldLabel.equity':         'Equity',
      'sim.fieldLabel.duration':       'Duration (years)',
      'sim.fieldLabel.monthlyPayment': 'Monthly Payment',

      // Simulator — comparison table
      'sim.cmp.annualRate':      'Annual Rate',
      'sim.cmp.years':           'yrs',
      'sim.cmp.lowestInterest':  'has the lowest total interest',
      'sim.fieldLabel.loanAmount': 'Loan Amount',

      // Simulator — PDF hints
      'sim.pdf.noMixes':    'Solve and save at least one investment route as Mix first to download a PDF.',
      'sim.pdf.oneMix':     'You have 1 route saved — solve and save one more as Mix to unlock the comparison PDF.',
      'sim.pdf.generating': 'Generating PDF…',
      'sim.pdf.error':      'Could not generate PDF. Please try again.',

      // Simulator — solve validation messages
      'sim.solve.needRepayment': 'Select a Repayment Method first (Shpitzer, Equal Principal, or Bullet).',
      'sim.solve.needInterest':  'Select an Interest Method first (Prime-Linked, Fixed, or CPI-Linked).',
      'sim.solve.needMore':      'Fill in more fields — exactly 3 of the 4 amount fields must be filled.',
      'sim.solve.tooMany':       'All 4 fields are filled. Leave exactly one empty — that value will be solved for you.',
      'sim.solve.durationRange': 'Loan duration must be between 1 and 30 years.',
      'sim.solve.equityGtPrice': 'Equity cannot be equal to or greater than the property price.',
      'sim.solve.ratePositive':  'Annual interest rate must be a positive number. Leave it empty to use the market default.',
      'sim.solve.noRate':        'Could not load the market rate. Please enter the Annual Interest Rate (%) manually.',

      // Simulator — mix management
      'sim.mix.delete':     'Remove this mix',
      'sim.mix.deleteHint': 'Remove Mix',
      'sim.mix.hint':       'Click to load a mix · ✕ to remove and try different settings',
      'sim.cmp.clickToView': 'Click to load this mix',

      // Simulator — input placeholders
      'sim.placeholder.annualRate':     'e.g. 4.5',
      'sim.placeholder.propertyPrice':  'e.g. 2,000,000',
      'sim.placeholder.equity':         'e.g. 500,000',
      'sim.placeholder.duration':       'e.g. 25',
      'sim.placeholder.monthlyPayment': 'e.g. 5,500',

      // Simulator — Bank of Israel regulation violations
      'sim.reg.maxLtv':            'LTV exceeds the Bank of Israel limit of 75% for a primary residence. Increase your equity or reduce the loan.',
      'sim.reg.equityExceedsPrice':'Equity cannot equal or exceed the property price.',
      'sim.reg.maxLoanYears':      'Loan duration exceeds the maximum of 30 years.',
      'sim.reg.trackRatio':        'A track allocation exceeds the Bank of Israel cap.',

      // Simulator — errors
      'sim.error.noMixes':    'No mixes saved yet.',
      'sim.error.calcFailed': 'Calculation failed.',
      'sim.error.network':    'Network error — please try again.',

      // Profile
      'profile.buildTitle':    'Build Your Financial Profile',
      'profile.buildDesc':     'Your profile personalises mortgage simulations and bot answers to your actual situation. It only takes a minute.',
      'profile.getStarted':    'Get Started',
      'profile.formTitle':     'Your Financial Profile',
      'profile.formDesc':      'Kept private — used only to improve your results.',
      'profile.strength':      'Profile Strength',
      'profile.name':          'Name',
      'profile.gender':              'Gender',
      'profile.gender.male':         'Male',
      'profile.gender.female':       'Female',
      'profile.gender.nonBinary':    'Non-binary',
      'profile.gender.preferNotToSay': 'Prefer not to say',
      'profile.age':           'Age',
      'profile.income':        'Monthly Net Income (₪)',
      'profile.incomeTooltip': 'Used to estimate which mortgage tracks fit your repayment capacity.',
      'profile.equity':        'Equity / Down Payment (₪)',
      'profile.equityTooltip': 'Determines your loan-to-value ratio and the mortgage tracks you qualify for.',
      'profile.savings':       'Total Savings (₪)',
      'profile.savingsTooltip':'Helps calculate how long until you reach your target equity level.',
      'profile.householdSize': 'Household Size (people)',
      'profile.householdTooltip': 'Affects affordability estimates and eligibility for certain mortgage grants.',
      'profile.saveBtn':       'Save Profile',
      'profile.savedTitle':    'Profile Saved!',
      'profile.savedDesc':     'Your financial details are saved. The Mortgage Bot and Simulator will now tailor results to your profile.',
      'profile.goToBot':       'Go to Mortgage Bot',
      'profile.openSimulator': 'Open Simulator',
      'profile.error.saveFailed': 'Could not save profile. Please try again.',

      // Auth
      'auth.brand':           'Guided Clarity',
      'auth.signIn':          'Sign In',
      'auth.signUp':          'Sign Up',
      'auth.email':           'Email',
      'auth.password':        'Password',
      'auth.loginBtn':        'Sign In',
      'auth.createBtn':       'Create Account',
      'auth.passwordHint':    "Use a unique password you don't use elsewhere.",
      'auth.signupPassPlaceholder': 'At least 8 characters',
      'auth.error.missingFields': 'Please enter your email and password.',
      'auth.error.shortPassword': 'Password must be at least 8 characters.',
      'auth.error.network':       'Network error — please try again.',
      'auth.error.loginFailed':   'Sign in failed.',
      'auth.error.signupFailed':  'Sign up failed.',
    },

    he: {
      // Navbar
      'nav.simulator': 'סימולטור',
      'nav.signIn':    'כניסה',
      'nav.profile':   'פרופיל',
      'nav.langBtn':   'English',
      'nav.logout':    'התנתק',

      // Home — hero
      'home.eyebrow':  'עוזר משכנתאות ישראלי',
      'home.title':    'Guided Clarity',
      'home.subtitle': 'שאל שאלות משכנתא בעברית או באנגלית — קבל תשובות ברורות ומעודכנות לתקנות בנק ישראל. מוכן לחשב?',
      'home.cta':      '← פתח סימולטור',

      // Home — chat
      'home.greeting':       'שלום! אני עוזר המשכנתאות שלך. אני יכול לעזור לך להבין מושגי משכנתא, מסלולי ריבית, תקנות בנק ישראל ועוד. מה תרצה לדעת?',
      'home.chipsLabel':     'נושאים מוצעים',
      'home.followUpsLabel': 'שאלות המשך',
      'home.inputPlaceholder': 'שאל שאלה על משכנתא…',
      'home.disclaimer':     'תגובה זו למטרות חינוכיות בלבד ואינה מהווה ייעוץ פיננסי. אנא התייעץ עם יועץ משכנתאות מורשה לפני קבלת החלטות.',

      // Home — chip labels
      'home.chip.amortization':    'מהי הפחתה?',
      'home.chip.tracks':          'סוגי מסלולים',
      'home.chip.prime':           'ריבית הפריים',
      'home.chip.ltv':             'מהו LTV?',
      'home.chip.fixedVsVariable': 'קבועה מול משתנה',
      'home.chip.monthlyPayment':  'תשלום חודשי',

      // Bot dynamic strings
      'bot.outOfDomain': 'אני יכול לעזור רק בשאלות הקשורות למשכנתא — מושגים, מסלולי ריבית, סוגי הלוואות, או תקנות בנק ישראל. אנא נסה שאלה אחרת.',
      'bot.networkError': 'מצטערים, משהו השתבש. אנא נסה שוב.',

      // Simulator — form
      'sim.title':           'סימולטור משכנתא',
      'sim.subtitle':        'מלא 3 מתוך 4 שדות פיננסיים ולחץ על <strong>חשב</strong> לחישוב הערך החסר.',
      'sim.loanSettings':    'הגדרות הלוואה',
      'sim.repaymentMethod': 'שיטת פירעון',
      'sim.selectDefault':   '— בחר —',
      'sim.shpitzer':        'שפיצר (תשלום קבוע)',
      'sim.kerenShava':      'קרן שווה',
      'sim.bullet':          'בוליט (ריבית בלבד)',
      'sim.interestMethod':  'שיטת ריבית',
      'sim.primeLinked':     'פריים',
      'sim.fixed':           'קבועה',
      'sim.cpiLinked':       'מדד',
      'sim.annualRate':      'ריבית שנתית (%)',
      'sim.annualRateHint':  '— אופציונלי, השאר ריק לברירת המחדל',
      'sim.financialFields': 'שדות פיננסיים',
      'sim.fill3of4':        '(מלא בדיוק 3 מתוך 4)',
      'sim.propertyPrice':   'מחיר הנכס (₪)',
      'sim.equity':          'הון עצמי / מקדמה (₪)',
      'sim.duration':        'משך ההלוואה (שנים)',
      'sim.monthlyPayment':  'תשלום חודשי (₪)',

      // Simulator — actions & results
      'sim.solve':             'חשב',
      'sim.calculating':       'מחשב…',
      'sim.results':           'תוצאות',
      'sim.monthlyPaymentLabel': 'תשלום חודשי',
      'sim.totalInterest':     'ריבית כוללת',
      'sim.totalPayment':      'תשלום כולל',
      'sim.viewAmort':         'צפה בלוח סילוקין',
      'sim.saveAsMix':         'שמור כמיקס',
      'sim.compareAll':        'השווה את כל המיקסים',
      'sim.mixComparison':     'השוואת מיקסים',
      'sim.amortSchedule':     'לוח סילוקין',
      'sim.downloadPdf':       'הורד סיכום PDF',
      'sim.mixTab':            'מיקס',

      // Simulator — main table column headers
      'sim.col.propertyPrice':  'מחיר הנכס (₪)',
      'sim.col.equity':         'הון עצמי (₪)',
      'sim.col.duration':       'משך (שנים)',
      'sim.col.monthlyPayment': 'תשלום חודשי (₪)',
      'sim.col.loanAmount':     'סכום הלוואה (₪)',
      'sim.col.totalInterest':  'ריבית כוללת (₪)',
      'sim.col.totalPayment':   'תשלום כולל (₪)',

      // Simulator — amort table headers
      'sim.amortHeader.month':            'חודש',
      'sim.amortHeader.payment':          'תשלום (₪)',
      'sim.amortHeader.principal':        'קרן (₪)',
      'sim.amortHeader.interest':         'ריבית (₪)',
      'sim.amortHeader.remainingBalance': 'יתרת קרן (₪)',

      // Simulator — show-all button
      'sim.showAll': 'הצג את כל',
      'sim.months':  'חודשים',

      // Simulator — solved-field labels
      'sim.fieldLabel.propertyPrice':  'מחיר הנכס',
      'sim.fieldLabel.equity':         'הון עצמי',
      'sim.fieldLabel.duration':       'משך (שנים)',
      'sim.fieldLabel.monthlyPayment': 'תשלום חודשי',

      // Simulator — comparison table
      'sim.cmp.annualRate':      'ריבית שנתית',
      'sim.cmp.years':           'שנ\'',
      'sim.cmp.lowestInterest':  'בעל הריבית הכוללת הנמוכה ביותר',
      'sim.fieldLabel.loanAmount': 'סכום הלוואה',

      // Simulator — PDF hints
      'sim.pdf.noMixes':    'פתור ושמור לפחות מסלול השקעה אחד כמיקס לפני הורדת ה-PDF.',
      'sim.pdf.oneMix':     'יש לך מיקס אחד — פתור ושמור עוד אחד לקבלת השוואה.',
      'sim.pdf.generating': 'מייצר PDF…',
      'sim.pdf.error':      'לא ניתן ליצור PDF. אנא נסה שוב.',

      // Simulator — solve validation messages
      'sim.solve.needRepayment': 'בחר שיטת פירעון תחילה (שפיצר, קרן שווה, או בוליט).',
      'sim.solve.needInterest':  'בחר שיטת ריבית תחילה (פריים, קבועה, או מדד).',
      'sim.solve.needMore':      'מלא עוד שדות — יש למלא בדיוק 3 מתוך 4 שדות פיננסיים.',
      'sim.solve.tooMany':       'כל 4 השדות מלאים. השאר שדה אחד ריק — אותו ערך יחושב עבורך.',
      'sim.solve.durationRange': 'משך ההלוואה חייב להיות בין 1 ל-30 שנים.',
      'sim.solve.equityGtPrice': 'ההון העצמי לא יכול להיות שווה או גדול ממחיר הנכס.',
      'sim.solve.ratePositive':  'ריבית שנתית חייבת להיות מספר חיובי. השאר ריק לריבית שוק.',
      'sim.solve.noRate':        'לא ניתן לטעון ריבית שוק. אנא הזן ריבית שנתית ידנית.',

      // Simulator — mix management
      'sim.mix.delete':     'הסר מיקס זה',
      'sim.mix.deleteHint': 'הסר מיקס',
      'sim.mix.hint':       'לחץ לטעינת מיקס · ✕ להסרה ולניסיון הגדרות שונות',
      'sim.cmp.clickToView': 'לחץ לטעינת מיקס זה',

      // Simulator — input placeholders
      'sim.placeholder.annualRate':     'לדוגמה: 4.5',
      'sim.placeholder.propertyPrice':  'לדוגמה: 2,000,000',
      'sim.placeholder.equity':         'לדוגמה: 500,000',
      'sim.placeholder.duration':       'לדוגמה: 25',
      'sim.placeholder.monthlyPayment': 'לדוגמה: 5,500',

      // Simulator — Bank of Israel regulation violations
      'sim.reg.maxLtv':            'יחס המימון (LTV) עולה על מגבלת בנק ישראל של 75% למגורים ראשוניים. הגדל את ההון העצמי או הקטן את ההלוואה.',
      'sim.reg.equityExceedsPrice':'ההון העצמי לא יכול להיות שווה או גדול ממחיר הנכס.',
      'sim.reg.maxLoanYears':      'משך ההלוואה עולה על המקסימום המותר של 30 שנה.',
      'sim.reg.trackRatio':        'הקצאת מסלול עולה על מגבלת בנק ישראל.',

      // Simulator — errors
      'sim.error.noMixes':    'לא נשמרו מיקסים עדיין.',
      'sim.error.calcFailed': 'החישוב נכשל.',
      'sim.error.network':    'שגיאת רשת — אנא נסה שוב.',

      // Profile
      'profile.buildTitle':    'בנה את הפרופיל הפיננסי שלך',
      'profile.buildDesc':     'הפרופיל שלך מאפשר התאמה אישית של סימולציות המשכנתא ותשובות הבוט למצבך. זה לוקח רק דקה.',
      'profile.getStarted':    'בואו נתחיל',
      'profile.formTitle':     'הפרופיל הפיננסי שלך',
      'profile.formDesc':      'שמור בפרטיות — משמש רק לשיפור התוצאות שלך.',
      'profile.strength':      'חוזק הפרופיל',
      'profile.name':          'שם',
      'profile.gender':              'מגדר',
      'profile.gender.male':         'זכר',
      'profile.gender.female':       'נקבה',
      'profile.gender.nonBinary':    'לא בינארי',
      'profile.gender.preferNotToSay': 'אחר',
      'profile.age':           'גיל',
      'profile.income':        'הכנסה חודשית נטו (₪)',
      'profile.incomeTooltip': 'משמש להערכת מסלולי משכנתא המתאימים לכושר ההחזר שלך.',
      'profile.equity':        'הון עצמי / מקדמה (₪)',
      'profile.equityTooltip': 'קובע את יחס ה-LTV ואת מסלולי המשכנתא שאתה זכאי להם.',
      'profile.savings':       'חסכונות כוללים (₪)',
      'profile.savingsTooltip':'עוזר לחשב כמה זמן עד שתגיע לרמת ההון העצמי הרצויה.',
      'profile.householdSize': 'גודל משק הבית (אנשים)',
      'profile.householdTooltip': 'משפיע על הערכות עמידות בתשלומים והזכאות למענקי משכנתא.',
      'profile.saveBtn':       'שמור פרופיל',
      'profile.savedTitle':    'הפרופיל נשמר!',
      'profile.savedDesc':     'הפרטים הפיננסיים שלך נשמרו. עוזר המשכנתאות והסימולטור יתאימו את התוצאות לפרופיל שלך.',
      'profile.goToBot':       'עבור לעוזר המשכנתאות',
      'profile.openSimulator': 'פתח סימולטור',
      'profile.error.saveFailed': 'לא ניתן לשמור את הפרופיל. אנא נסה שוב.',

      // Auth
      'auth.brand':           'Guided Clarity',
      'auth.signIn':          'כניסה',
      'auth.signUp':          'הרשמה',
      'auth.email':           'אימייל',
      'auth.password':        'סיסמה',
      'auth.loginBtn':        'כניסה',
      'auth.createBtn':       'צור חשבון',
      'auth.passwordHint':    'השתמש בסיסמה ייחודית שאינה בשימוש במקומות אחרים.',
      'auth.signupPassPlaceholder': 'לפחות 8 תווים',
      'auth.error.missingFields': 'אנא הזן את האימייל והסיסמה שלך.',
      'auth.error.shortPassword': 'הסיסמה חייבת להכיל לפחות 8 תווים.',
      'auth.error.network':       'שגיאת רשת — אנא נסה שוב.',
      'auth.error.loginFailed':   'כניסה נכשלה.',
      'auth.error.signupFailed':  'הרשמה נכשלה.',
    },
  };

  let _lang = 'en';
  try { _lang = localStorage.getItem('lang') || 'en'; } catch { /* private browsing */ }

  function t(key) {
    return _t[_lang]?.[key] ?? _t.en[key] ?? key;
  }

  function apply() {
    document.documentElement.lang = _lang;
    document.documentElement.dir  = _lang === 'he' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: _lang } }));
  }

  function toggle() {
    _lang = _lang === 'en' ? 'he' : 'en';
    try { localStorage.setItem('lang', _lang); } catch { /* private browsing */ }
    apply();
    if (window.Navbar) window.Navbar.refresh();
  }

  function current() { return _lang; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.I18n = { t, apply, toggle, current };
})();
