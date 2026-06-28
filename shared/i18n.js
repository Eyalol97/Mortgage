//[cite: 1]
globalThis.DoorStepCopy = (function () {
  const _t = {
    en: {
      // Navbar
      'nav.simulator': 'Simulator',
      'nav.bot':       'Bot',
      'nav.signIn':    'Sign In',
      'nav.profile':   'Profile',
      'nav.langBtn':   'עברית',
      'nav.logout':    'Log out',

      // Home — hero
      'home.eyebrow':   'Israeli Mortgage Assistant',
      'home.title':     'DoorStep',
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

      // Simulator — info cards
      'sim.info.card1.title': '3 of 4 Solver',
      'sim.info.card1.desc':  'Fill any three of the four financial fields. The simulator derives the missing value — monthly payment, duration, equity, or price.',
      'sim.info.card2.title': 'Bank of Israel Aligned',
      'sim.info.card2.desc':  'All calculations follow Bank of Israel regulations, including LTV limits, track mix rules, and standard amortization conventions.',
      'sim.info.card3.title': 'PDF Export',
      'sim.info.card3.desc':  'Save multiple mortgage scenarios as mixes and download a side-by-side PDF summary to share with your mortgage advisor.',

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

      // Landing page
      'lp.eyebrow':        'Israeli Mortgage Assistant',
      'lp.title':          'Mortgage Guidance,<br><strong>Simplified</strong> for your future.',
      'lp.subtitle':       'Navigate the complex landscape of Israeli home financing with intelligent simulations and AI-powered guidance — regulation-aware and instantly accessible.',
      'lp.cta.start':      'Get Started Now',
      'lp.cta.explore':    'Explore Simulator',
      'lp.card.label':     'Ask the Bot',
      'lp.card.valueUnit': 'AI guidance',
      'lp.card.bar.label': 'Profile Completion',
      'lp.card.bar.value': '+Better Results',
      'lp.card.cta':       'Talk to the Concierge →',
      'lp.features.title': 'Elite Tools for Smart Decisions',
      'lp.features.sub':   'Our specialised modules provide the deep insights you need to secure the best mortgage terms available today.',
      'lp.sim.title':      'Mortgage Simulator',
      'lp.sim.desc':       'Run high-fidelity financial scenarios. Adjust interest rates, terms, and down payments to see the long-term impact on your wealth instantly.',
      'lp.sim.bullet1':    'Amortization Schedule',
      'lp.sim.bullet2':    'Multi-track Mix Comparison',
      'lp.sim.bullet3':    'PDF Summary Export',
      'lp.sim.link':       'Open Simulator →',
      'lp.bot.title':      'Mortgage Concierge',
      'lp.bot.desc':       'Get instant insights through our AI-driven concierge. Ask complex questions and receive guidance tailored to Bank of Israel regulations.',
      'lp.bot.bullet1':    'Available 24/7',
      'lp.bot.bullet2':    'Regulation-Aware Answers',
      'lp.bot.bullet3':    'Personalised to Your Profile',
      'lp.bot.link':       'Talk to Concierge →',
      'lp.value.title':    'DoorStep.<br>Professional Results.',
      'lp.value.desc':     'Everyone deserves the level of financial insight typically reserved for elite investors. Our platform democratises mortgage intelligence for every Israeli homebuyer.',
      'lp.value.cta':      'Create Free Account →',
      'lp.value.stat1num': 'Bank of Israel',
      'lp.value.stat1lbl': 'Regulation-aligned guidance',
      'lp.value.stat2num': 'HE + EN',
      'lp.value.stat2lbl': 'Full bilingual support',
      'lp.footer':         '© 2025 DoorStep — Mortgage Intelligence',

      // Auth
      'auth.brand':           'DoorStep',
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
      'nav.bot':       'בוט משכנתא',
      'nav.signIn':    'התחברות',
      'nav.profile':   'פרופיל',
      'nav.langBtn':   'English',
      'nav.logout':    'התנתקות',

      // Home — hero
      'home.eyebrow':  'עוזר משכנתא ישראלי',
      'home.title':    'DoorStep',
      'home.subtitle': 'שאלו שאלות על משכנתא בעברית או באנגלית — וקבלו תשובות ברורות המותאמות לתקנות בנק ישראל.',
      'home.cta':      '← פתיחת סימולטור',

      // Home — chat
      'home.greeting':       'שלום! אני עוזר המשכנתא שלכם. אני יכול לעזור לכם להבין מושגים במשכנתא, מסלולי ריבית, תקנות בנק ישראל ועוד. מה תרצו לדעת?',
      'home.chipsLabel':     'נושאים מוצעים',
      'home.followUpsLabel': 'שאלות המשך',
      'home.inputPlaceholder': 'שאלו שאלה על משכנתא…',
      'home.disclaimer':     'תשובה זו למטרות לימודיות בלבד ואינה מהווה ייעוץ פיננסי. יש להתייעץ עם יועץ משכנתאות מורשה לפני קבלת החלטות.',

      // Home — chip labels
      'home.chip.amortization':    'מהו לוח סילוקין?',
      'home.chip.tracks':          'מסלולי משכנתא',
      'home.chip.prime':           'ריבית הפריים',
      'home.chip.ltv':             'מהו אחוז המימון (LTV)?',
      'home.chip.fixedVsVariable': 'קבועה מול משתנה',
      'home.chip.monthlyPayment':  'החזר חודשי',

      // Bot dynamic strings
      'bot.outOfDomain': 'אני יכול לעזור רק בשאלות הקשורות למשכנתא — מושגים, מסלולי ריבית, סוגי הלוואות או תקנות בנק ישראל. אנא נסו שאלה אחרת.',
      'bot.networkError': 'מצטערים, משהו השתבש בתקשורת עם השרת. אנא נסו שוב.',

      // Simulator — form
      'sim.title':           'סימולטור משכנתא',
      'sim.subtitle':        'מלאו 3 מתוך 4 השדות הפיננסיים ולחצו על <strong>חשב</strong> כדי לחשב את הערך החסר.',
      'sim.loanSettings':    'הגדרות הלוואה',
      'sim.repaymentMethod': 'שיטת פירעון',
      'sim.selectDefault':   '— בחירה —',
      'sim.shpitzer':        'שפיצר (תשלום קבוע)',
      'sim.kerenShava':      'קרן שווה',
      'sim.bullet':          'בלון / בוליט (ריבית בלבד)',
      'sim.interestMethod':  'סוג ריבית',
      'sim.primeLinked':     'פריים',
      'sim.fixed':           'קבועה',
      'sim.cpiLinked':       'צמודה למדד',
      'sim.annualRate':      'ריבית שנתית (%)',
      'sim.annualRateHint':  '— אופציונלי, השאירו ריק לברירת מחדל של השוק',
      'sim.financialFields': 'שדות פיננסיים',
      'sim.fill3of4':        '(מלאו בדיוק 3 מתוך 4)',
      'sim.propertyPrice':   'מחיר הנכס (₪)',
      'sim.equity':          'הון עצמי (₪)',
      'sim.duration':        'משך ההלוואה (שנים)',
      'sim.monthlyPayment':  'החזר חודשי מבוקש (₪)',

      // Simulator — actions & results
      'sim.solve':             'חשב',
      'sim.calculating':       'מחשב…',
      'sim.results':           'תוצאות החישוב',
      'sim.monthlyPaymentLabel': 'החזר חודשי',
      'sim.totalInterest':     'סך כל הריבית',
      'sim.totalPayment':      'סך כל התשלום',
      'sim.viewAmort':         'הצגת לוח סילוקין',
      'sim.saveAsMix':         'שמירה כתמהיל',
      'sim.compareAll':        'השוואת כל התמהילים',
      'sim.mixComparison':     'השוואת תמהילים',
      'sim.amortSchedule':     'לוח סילוקין',
      'sim.downloadPdf':       'הורדת סיכום ב-PDF',
      'sim.mixTab':            'תמהיל',

      // Simulator — main table column headers
      'sim.col.propertyPrice':  'מחיר הנכס (₪)',
      'sim.col.equity':         'הון עצמי (₪)',
      'sim.col.duration':       'משך (שנים)',
      'sim.col.monthlyPayment': 'החזר חודשי (₪)',
      'sim.col.loanAmount':     'סכום ההלוואה (₪)',
      'sim.col.totalInterest':  'סך הריבית (₪)',
      'sim.col.totalPayment':   'סך התשלום (₪)',

      // Simulator — amort table headers
      'sim.amortHeader.month':            'חודש',
      'sim.amortHeader.payment':          'תשלום (₪)',
      'sim.amortHeader.principal':        'ע"ח הקרן (₪)',
      'sim.amortHeader.interest':         'ע"ח הריבית (₪)',
      'sim.amortHeader.remainingBalance': 'יתרת הקרן (₪)',

      // Simulator — show-all button
      'sim.showAll': 'הצגת כל',
      'sim.months':  'החודשים',

      // Simulator — solved-field labels
      'sim.fieldLabel.propertyPrice':  'מחיר הנכס',
      'sim.fieldLabel.equity':         'הון עצמי',
      'sim.fieldLabel.duration':       'משך (שנים)',
      'sim.fieldLabel.monthlyPayment': 'החזר חודשי',

      // Simulator — comparison table
      'sim.cmp.annualRate':      'ריבית שנתית',
      'sim.cmp.years':           'שנ\'',
      'sim.cmp.lowestInterest':  'בעל הריבית הכוללת הנמוכה ביותר',
      'sim.fieldLabel.loanAmount': 'סכום ההלוואה',

      // Simulator — PDF hints
      'sim.pdf.noMixes':    'חשבו ושמרו לפחות מסלול אחד כתמהיל לפני הורדת ה-PDF.',
      'sim.pdf.oneMix':     'שמרתם תמהיל אחד — חשבו ושמרו תמהיל נוסף כדי לפתוח את השוואת ה-PDF.',
      'sim.pdf.generating': 'מייצר PDF…',
      'sim.pdf.error':      'לא ניתן ליצור את קובץ ה-PDF. אנא נסו שוב.',

      // Simulator — solve validation messages
      'sim.solve.needRepayment': 'יש לבחור שיטת פירעון תחילה (שפיצר, קרן שווה או בוליט).',
      'sim.solve.needInterest':  'יש לבחור סוג ריבית תחילה (פריים, קבועה או צמודה למדד).',
      'sim.solve.needMore':      'יש למלא עוד שדות — בדיוק 3 מתוך 4 השדות הפיננסיים חייבים להיות מלאים.',
      'sim.solve.tooMany':       'כל 4 השדות מלאים. השאירו שדה אחד ריק — והערך שלו יחושב עבורכם.',
      'sim.solve.durationRange': 'משך ההלוואה חייב להיות בין שנה אחת ל-30 שנה.',
      'sim.solve.equityGtPrice': 'ההון העצמי אינו יכול להיות שווה או גדול ממחיר הנכס.',
      'sim.solve.ratePositive':  'הריבית השנתית חייבת להיות מספר חיובי. השאירו ריק כדי להשתמש בריבית השוק.',
      'sim.solve.noRate':        'לא ניתן לטעון את ריבית השוק באופן אוטומטי. אנא הזנו ריבית שנתית ידנית.',

      // Simulator — mix management
      'sim.mix.delete':     'הסרת תמהיל זה',
      'sim.mix.deleteHint': 'הסרת תמהיל',
      'sim.mix.hint':       'לחצו לטעינת תמהיל · ✕ להסרה ולניסיון הגדרות אחרות',
      'sim.cmp.clickToView': 'לחצו לטעינת תמהיל זה',

      // Simulator — input placeholders
      'sim.placeholder.annualRate':     'לדוגמה: 4.5',
      'sim.placeholder.propertyPrice':  'לדוגמה: 2,000,000',
      'sim.placeholder.equity':         'לדוגמה: 500,000',
      'sim.placeholder.duration':       'לדוגמה: 25',
      'sim.placeholder.monthlyPayment': 'לדוגמה: 5,500',

      // Simulator — Bank of Israel regulation violations
      'sim.reg.maxLtv':            'אחוז המימון (LTV) עולה על מגבלת בנק ישראל של 75% לדירה יחידה. הגדילו את ההון העצמי או הקטינו את סכום ההלוואה.',
      'sim.reg.equityExceedsPrice':'ההון העצמי אינו יכול להיות שווה או גדול ממחיר הנכס.',
      'sim.reg.maxLoanYears':      'משך ההלוואה חורג מהמקסימום המותר על פי חוק (30 שנה).',
      'sim.reg.trackRatio':        'חלוקת המסלולים חורגת ממגבלות בנק ישראל.',

      // Simulator — errors
      'sim.error.noMixes':    'לא נשמרו תמהילים עדיין.',
      'sim.error.calcFailed': 'החישוב נכשל.',
      'sim.error.network':    'שגיאת רשת — אנא נסו שוב.',

      // Simulator — info cards
      'sim.info.card1.title': 'פתרון של 3 מתוך 4 שדות',
      'sim.info.card1.desc':  'מלאו כל שלושה מתוך ארבעת השדות הפיננסיים והסימולטור יחשב עבורכם את הערך החסר — החזר חודשי, משך, הון עצמי או מחיר הנכס.',
      'sim.info.card2.title': 'תואם לתקנות בנק ישראל',
      'sim.info.card2.desc':  'כל החישובים מבוצעים בהתאם למגבלות בנק ישראל, כולל תקרות אחוזי מימון (LTV), כללי תמהיל מסלולים ושיטות סילוקין מקובלות.',
      'sim.info.card3.title': 'ייצוא מלא ל-PDF',
      'sim.info.card3.desc':  'שמרו מספר תרחישי משכנתא כתמהילים השוואתיים והורידו קובץ PDF מסוכם להצגה ישירה בפני יועץ המשכנתא שלכם.',

      // Profile
      'profile.buildTitle':    'בניית הפרופיל הפיננסי שלכם',
      'profile.buildDesc':     'הפרופיל מאפשר להתאים אישית את סימולציות המשכנתא ותשובות הבוט למצבכם הפיננסי האמיתי. זה לוקח פחות מדקה.',
      'profile.getStarted':    'בואו נתחיל',
      'profile.formTitle':     'הפרופיל הפיננסי שלכם',
      'profile.formDesc':      'המידע נשמר בפרטיות מלאה — ומשמש אך ורק לשיפור ודיוק התוצאות שלכם.',
      'profile.strength':      'אמינות וחוזק הפרופיל',
      'profile.name':          'שם מלא',
      'profile.gender':              'מגדר',
      'profile.gender.male':         'זכר',
      'profile.gender.female':       'נקבה',
      'profile.gender.nonBinary':    'לא-בינארי',
      'profile.gender.preferNotToSay': 'מעדיף/ה שלא לענות',
      'profile.age':           'גיל',
      'profile.income':        'הכנסה חודשית נטו (₪)',
      'profile.incomeTooltip': 'משמש להערכת מסלולי משכנתא המתאימים לכושר ההחזר החודשי שלכם.',
      'profile.equity':        'הון עצמי זמין (₪)',
      'profile.equityTooltip': 'קובע את אחוז המימון ואת מסלולי המשכנתא שתוכלו לקבל מהבנק.',
      'profile.savings':       'סך כל החסכונות (₪)',
      'profile.savingsTooltip':'מסייע לחשב כמה זמן ייקח לכם להגיע ליעד ההון העצמי הנדרש.',
      'profile.householdSize': 'מספר נפשות במשק הבית',
      'profile.householdTooltip': 'משפיע על הערכת כושר ההחזר והזכאות למענקים או תוכניות סיוע במילואים/מדינה.',
      'profile.saveBtn':       'שמירת פרופיל',
      'profile.savedTitle':    'הפרופיל נשמר בהצלחה!',
      'profile.savedDesc':     'הפרטים הפיננסיים שלכם עודכנו במערכת. בוט המשכנתא והסימולטור יתאימו כעת את כל התוצאות במיוחד עבורכם.',
      'profile.goToBot':       'מעבר לבוט המשכנתא',
      'profile.openSimulator': 'פתיחת הסימולטור',
      'profile.error.saveFailed': 'לא ניתן לשמור את הפרופיל. אנא נסו שוב.',

      // Landing page
      'lp.eyebrow':        'עוזר משכנתא ישראלי',
      'lp.title':          'הדרך לדירה מתחילה כאן.<br><strong>משכנתא חכמה</strong>, פשוטה ומותאמת עבורכם.',
      'lp.subtitle': 'ניווט פשוט בעולם המשכנתאות המורכב בישראל באמצעות סימולציות חכמות וייעוץ מבוסס AI — מעודכן לתקנות בנק ישראל ונגיש באופן מיידי.',
      'lp.cta.start':      'מתחילים עכשיו',
      'lp.cta.explore':    'לסימולטור המתקדם',
      'lp.card.label':     'שאלו את הבוט',
      'lp.card.valueUnit': 'הכוונת AI',
      'lp.card.bar.label': 'מילוי פרופיל פיננסי',
      'lp.card.bar.value': 'לתוצאות מדויקות יותר',
      'lp.card.cta':       'שיחה עם הבוט הפיננסי ←',
      'lp.features.title': 'כלים מתקדמים להחלטות פיננסיות חכמות',
      'lp.features.sub':   'המודולים שלנו מספקים תובנות כדי לעזור לכם למצוא את תנאי המשכנתא המתאימים לכם ביותר.',
      'lp.sim.title':      'סימולטור משכנתא מתקדם',
      'lp.sim.desc':       'הריצו תרחישים שונים - שנו ריביות, תקופות והון עצמי כדי לראות מיד את ההשפעה ארוכת הטווח.',
      'lp.sim.bullet1':    'לוח סילוקין מפורט',
      'lp.sim.bullet2':    'השוואת תמהילים רב-מסלוליים',
      'lp.sim.bullet3':    'ייצוא דוחות וסיכומים ל-PDF',
      'lp.sim.link':       'פתח סימולטור ←',
      'lp.bot.title':      'עוזר משכנתא מבוסס AI',
      'lp.bot.desc':       'קבלו תובנות מיידיות 24/7. שאלו שאלות מורכבות וקבלו הכוונה מותאמת אישית ובזמן אמת על פי כל מגבלות בנק ישראל.',
      'lp.bot.bullet1':    'זמינות מלאה 24/7',
      'lp.bot.bullet2':    'תשובות מבוססות רגולציה וחוק',
      'lp.bot.bullet3':    'התאמה אישית מלאה לפרופיל שלכם',
      'lp.bot.link':       'שיחה עם העוזר הדיגיטלי ←',
      'lp.value.title':    'DoorStep.<br>תוצאות מקצועיות מהשורה הראשונה.',
      'lp.value.desc':     'לכל רוכש דירה מגיעה רמת התובנה הפיננסית ששמורה בדרך כלל למשקיעי קצה מנוסים. הפלטפורמה שלנו מנגישה את בינת הנדל"ן והמשכנתאות לכל בית בישראל.',
      'lp.value.cta':      'יצירת חשבון חינם ←',
      'lp.value.stat1num': 'בנק ישראל',
      'lp.value.stat1lbl': 'הכוונה תואמת רגולציה במלואה',
      'lp.value.stat2num': 'עברית + EN',
      'lp.value.stat2lbl': 'תמיכה דו-לשונית מלאה',
      'lp.footer':         '© 2025 DoorStep — Mortgage Intelligence',

      // Auth
      'auth.brand':           'DoorStep',
      'auth.signIn':          'כניסה למערכת',
      'auth.signUp':          'הרשמה',
      'auth.email':           'כתובת אימייל',
      'auth.password':        'סיסמה',
      'auth.loginBtn':        'התחברות',
      'auth.createBtn':       'יצירת חשבון',
      'auth.passwordHint':    'מומלץ להשתמש בסיסמה ייחודית שאינה בשימוש באתרים אחרים.',
      'auth.signupPassPlaceholder': '8 תווים לפחות',
      'auth.error.missingFields': 'אנא הזנו את כתובת האימייל והסיסמה שלכם.',
      'auth.error.shortPassword': 'הסיסמה חייבת להכיל 8 תווים לפחות.',
      'auth.error.network':       'שגיאת רשת — אנא בדקו את החיבור ונסו שוב.',
      'auth.error.loginFailed':   'ההתחברות נכשלה. אנא בדקו את פרטי הגישה.',
      'auth.error.signupFailed':  'ההרשמה נכשלה. אנא נסו שוב.',
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

  return { t, apply, toggle, current };
})();
globalThis.I18n = globalThis.DoorStepCopy;

