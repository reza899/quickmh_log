export const translations = {
  en: {
    appTitle: 'QuickMH Log',
    appSubtitle:
      'A simple, private tool to track your mental health scores over time.',
    nav: {
      assessments: 'Assessments',
      history: 'History',
      importExport: 'Import/Export',
    },
    backBtn: '&larr; Back to Assessments',
    detail: {
      description: 'Description',
      measures: 'What It Measures',
      scoring: 'How to Score',
      interpretation: 'Score Interpretation',
      clinicalNote: 'Clinical Note',
    },
    form: {
      title: 'Log New Entry',
      date: 'Date',
      score: 'Score',
      note: 'Note (Optional)',
      notePlaceholder: 'Any specific context or feelings...',
      save: 'Save Entry',
    },
    history: {
      title: 'Your Log History',
      subtitle: 'Click on a column header to sort.',
      table: {
        date: 'Date',
        domain: 'Domain',
        score: 'Score',
        note: 'Note',
        actions: 'Actions',
      },
      empty:
        'No entries yet. Go to Assessments to log your first score.',
    },
    importExport: {
      title: 'Import / Export Data',
      exportSubtitle:
        'Save your data to a CSV file or import it from a previous backup. This is useful for moving data between devices.',
      exportBtn: 'Export All Data as CSV',
      importTitle: 'Import from CSV',
      importSubtitle:
        'Select a CSV file with columns: <code>id,date,domainKey,score,note</code>. New entries will be added to your existing log.',
    },
    toast: {
      saved: 'Entry saved successfully!',
      deleted: 'Entry deleted.',
      exported: 'Data exported.',
      imported: (count) =>
        `${count} new entries imported successfully!`,
      importError: 'Failed to import CSV. Please check file format.',
      noDataToExport: 'No data to export.',
    },
    confirmDelete: 'Are you sure you want to delete this entry?',
    domains: {
      'phq-9': {
        name: 'PHQ-9 (Depression)',
        description:
          'The Patient Health Questionnaire-9 is a multipurpose instrument for screening, diagnosing, monitoring and measuring the severity of depression.',
        scoreRange: '0-27',
        measures: [
          'Loss of interest or pleasure',
          'Feeling down, depressed, or hopeless',
          'Trouble with sleep',
          'Feeling tired or having little energy',
          'Poor appetite or overeating',
          'Feeling bad about yourself',
          'Trouble concentrating',
          'Moving or speaking slowly, or being fidgety',
          'Thoughts of self-harm',
        ],
        scoring:
          'Each of the 9 items is scored from 0 ("not at all") to 3 ("nearly every day"). The total score is the sum of all item scores.',
        interpretation: [
          { range: '0-4', level: 'Minimal depression' },
          { range: '5-9', level: 'Mild depression' },
          { range: '10-14', level: 'Moderate depression' },
          { range: '15-19', level: 'Moderately severe depression' },
          { range: '20-27', level: 'Severe depression' },
        ],
        clinicalNote:
          'Scores of 10 or greater are considered clinically significant. A healthcare professional should be consulted for diagnosis and treatment planning, especially if thoughts of self-harm are present.',
      },
      'gad-7': {
        name: 'GAD-7 (Anxiety)',
        description:
          'The Generalized Anxiety Disorder-7 scale is a self-administered questionnaire used for screening and measuring the severity of generalized anxiety disorder.',
        scoreRange: '0-21',
        measures: [
          'Feeling nervous, anxious, or on edge',
          'Not being able to stop or control worrying',
          'Worrying too much about different things',
          'Trouble relaxing',
          'Being so restless that it is hard to sit still',
          'Becoming easily annoyed or irritable',
          'Feeling afraid as if something awful might happen',
        ],
        scoring:
          'Each of the 7 items is scored from 0 ("not at all") to 3 ("nearly every day"). The total score is the sum of all item scores.',
        interpretation: [
          { range: '0-4', level: 'Minimal anxiety' },
          { range: '5-9', level: 'Mild anxiety' },
          { range: '10-14', level: 'Moderate anxiety' },
          { range: '15-21', level: 'Severe anxiety' },
        ],
        clinicalNote:
          'Scores of 10 or greater represent a reasonable cut-point for identifying cases of GAD. Further evaluation by a clinician is recommended for scores in the moderate to severe range.',
      },
      'aaq-ii': {
        name: 'AAQ-II (Experiential Avoidance)',
        description:
          'The Acceptance and Action Questionnaire-II measures psychological inflexibility, or "experiential avoidance"—the tendency to avoid unwanted private experiences (thoughts, feelings, memories).',
        scoreRange: '7-49',
        measures: [
          'Willingness to experience unwanted thoughts/feelings',
          'Ability to live by personal values even with psychological pain',
          'Control over life direction versus being controlled by emotions',
        ],
        scoring:
          'This is a 7-item scale, with each item rated on a 7-point Likert scale from 1 ("never true") to 7 ("always true"). The total score is the sum of all items.',
        interpretation: [
          { range: '7-23', level: 'Higher psychological flexibility' },
          { range: '24-28', level: 'Potential for clinical distress' },
          {
            range: '29-49',
            level: 'Higher psychological inflexibility',
          },
        ],
        clinicalNote:
          'Higher scores indicate greater experiential avoidance. A cutoff score around 24-28 has been suggested to indicate a risk for clinical-level problems. This is not a diagnostic tool but measures a core process in many psychological issues.',
      },
      'oci-r': {
        name: 'OCI-R (Obsessive–Compulsive)',
        description:
          'The Obsessive-Compulsive Inventory-Revised is a brief self-report scale that assesses the distress associated with common symptoms of Obsessive-Compulsive Disorder (OCD).',
        scoreRange: '0-72',
        measures: [
          'Washing/Contamination',
          'Obsessing/Ruminating',
          'Hoarding',
          'Ordering/Arranging',
          'Checking',
          'Neutralizing/Mental Rituals',
        ],
        scoring:
          'Consists of 18 items, each rated on a 5-point scale from 0 ("not at all") to 4 ("extremely"). The total score is the sum of all items.',
        interpretation: [
          { range: '0-20', level: 'Subclinical range' },
          { range: '21-30', level: 'Mild to moderate symptoms' },
          { range: '31-40', level: 'Moderate to severe symptoms' },
          { range: '41+', level: 'Severe to extreme symptoms' },
        ],
        clinicalNote:
          'A cutoff score of 21 is often used to distinguish patients with OCD from non-clinical samples. High scores suggest the need for a comprehensive clinical evaluation for OCD.',
      },
      rosenberg: {
        name: 'Rosenberg Self-Esteem Scale',
        description:
          'A 10-item scale that measures global self-worth by measuring both positive and negative feelings about the self.',
        scoreRange: '0-30',
        measures: [
          'Overall sense of self-worth',
          'Feelings of self-acceptance',
          'Satisfaction with oneself',
          'Attitudes of self-respect',
        ],
        scoring:
          'Items are answered on a four-point scale from Strongly Agree to Strongly Disagree. For items 1, 2, 4, 6, 7, scores are: SA=3, A=2, D=1, SD=0. For reverse-scored items 3, 5, 8, 9, 10, scores are: SA=0, A=1, D=2, SD=3. The total is the sum of final scores.',
        interpretation: [
          { range: '0-14', level: 'Low self-esteem' },
          { range: '15-25', level: 'Normal range of self-esteem' },
          { range: '26-30', level: 'High self-esteem' },
        ],
        clinicalNote:
          'Scores below 15 suggest clinically relevant low self-esteem. While not a disorder itself, low self-esteem is a risk factor for many mental health conditions like depression.',
      },
      maslach: {
        name: 'Maslach Burnout Inventory (MBI)',
        description:
          'The MBI is the most widely used tool for measuring burnout. It assesses three dimensions: emotional exhaustion, depersonalization, and personal accomplishment.',
        scoreRange: 'Varies by subscale',
        measures: [
          "Emotional Exhaustion: Feeling emotionally overextended and exhausted by one's work.",
          "Depersonalization: An unfeeling and impersonal response towards recipients of one's service, care, or instruction.",
          "Personal Accomplishment: Feelings of competence and successful achievement in one's work.",
        ],
        scoring:
          'The MBI has multiple versions (e.g., for Human Services, Educators). Scoring is complex, involving separate totals for each of the three subscales. For this app, please enter a single, overall "burnout" score based on your personal assessment or a specific MBI version\'s primary scale (e.g., Emotional Exhaustion). A common range is 0-54 for Exhaustion.',
        interpretation: [
          { range: '0-16', level: 'Low burnout' },
          { range: '17-29', level: 'Moderate burnout' },
          { range: '30+', level: 'High burnout' },
        ],
        clinicalNote:
          'High scores on Emotional Exhaustion and Depersonalization, coupled with low scores on Personal Accomplishment, indicate burnout. This is an occupational phenomenon, not a medical condition, but can lead to health problems.',
      },
      procrastination: {
        name: 'Pure Procrastination Scale (PPS)',
        description:
          'A 12-item scale designed to measure trait procrastination, the tendency to needlessly delay tasks to the point of experiencing subjective discomfort.',
        scoreRange: '12-60',
        measures: [
          'Decisional delay (difficulty making decisions)',
          'Implemental delay (failing to act on intentions)',
          'Lateness and timeliness',
          'Lack of productive energy',
        ],
        scoring:
          'Each of the 12 items is rated on a 5-point scale from 1 ("very rarely/not at all true for me") to 5 ("very often/very true for me"). The total score is the sum of all items.',
        interpretation: [
          { range: '12-25', level: 'Low procrastination' },
          { range: '26-39', level: 'Moderate procrastination' },
          { range: '40-60', level: 'High procrastination' },
        ],
        clinicalNote:
          'High scores are associated with lower well-being, higher stress, and poorer performance. While not a formal diagnosis, chronic procrastination can be a target for therapeutic intervention.',
      },
    },
  },
  fa: {
    appTitle: 'گزارش سریع سلامت روان',
    appSubtitle:
      'ابزاری ساده و خصوصی برای پیگیری نمرات سلامت روان شما در طول زمان.',
    nav: {
      assessments: 'ارزیابی‌ها',
      history: 'تاریخچه',
      importExport: 'درون‌ریزی / برون‌بری',
    },
    backBtn: '&rarr; بازگشت به ارزیابی‌ها',
    detail: {
      description: 'توضیحات',
      measures: 'چه چیزهایی را می‌سنجد',
      scoring: 'نحوه نمره‌دهی',
      interpretation: 'تفسیر نمرات',
      clinicalNote: 'نکته بالینی',
    },
    form: {
      title: 'ثبت گزارش جدید',
      date: 'تاریخ',
      score: 'نمره',
      note: 'یادداشت (اختیاری)',
      notePlaceholder: 'هرگونه زمینه یا احساسات خاص...',
      save: 'ذخیره گزارش',
    },
    history: {
      title: 'تاریخچه گزارش‌های شما',
      subtitle: 'برای مرتب‌سازی روی عنوان ستون کلیک کنید.',
      table: {
        date: 'تاریخ',
        domain: 'حوزه',
        score: 'نمره',
        note: 'یادداشت',
        actions: 'عملیات',
      },
      empty:
        'هنوز گزارشی ثبت نشده است. برای ثبت اولین نمره به بخش ارزیابی‌ها بروید.',
    },
    importExport: {
      title: 'درون‌ریزی / برون‌بری داده‌ها',
      exportSubtitle:
        'داده‌های خود را در یک فایل CSV ذخیره کنید یا از یک نسخه پشتیبان قبلی درون‌ریزی کنید. این کار برای انتقال داده‌ها بین دستگاه‌ها مفید است.',
      exportBtn: 'برون‌بری تمام داده‌ها به صورت CSV',
      importTitle: 'درون‌ریزی از CSV',
      importSubtitle:
        'یک فایل CSV با ستون‌های <code>id,date,domainKey,score,note</code> انتخاب کنید. گزارش‌های جدید به گزارش‌های فعلی شما اضافه خواهند شد.',
    },
    toast: {
      saved: 'گزارش با موفقیت ذخیره شد!',
      deleted: 'گزارش حذف شد.',
      exported: 'داده‌ها برون‌بری شدند.',
      imported: (count) =>
        `${count.toLocaleString(
          'fa-IR'
        )} گزارش جدید با موفقیت درون‌ریزی شد!`,
      importError:
        'درون‌ریزی CSV ناموفق بود. لطفاً فرمت فایل را بررسی کنید.',
      noDataToExport: 'داده‌ای برای برون‌بری وجود ندارد.',
    },
    confirmDelete: 'آیا از حذف این گزارش مطمئن هستید؟',
    domains: {
      'phq-9': {
        name: 'PHQ-9 (افسردگی)',
        description:
          'پرسشنامه سلامت بیمار-۹ (PHQ-9) ابزاری چندمنظوره برای غربالگری، تشخیص، نظارت و اندازه‌گیری شدت افسردگی است.',
        scoreRange: '۰-۲۷',
        measures: [
          'از دست دادن علاقه یا لذت',
          'احساس ناراحتی، افسردگی یا ناامیدی',
          'مشکل در خوابیدن',
          'احساس خستگی یا کمبود انرژی',
          'کم‌اشتهایی یا پرخوری',
          'احساس بدی نسبت به خود',
          'مشکل در تمرکز',
          'کندی در حرکت یا صحبت کردن، یا بی‌قراری',
          'افکار آسیب رساندن به خود',
        ],
        scoring:
          'هر یک از ۹ مورد از ۰ ("اصلاً") تا ۳ ("تقریباً هر روز") نمره‌گذاری می‌شود. نمره کل مجموع نمرات همه موارد است.',
        interpretation: [
          { range: '۰-۴', level: 'افسردگی حداقلی' },
          { range: '۵-۹', level: 'افسردگی خفیف' },
          { range: '۱۰-۱۴', level: 'افسردگی متوسط' },
          { range: '۱۵-۱۹', level: 'افسردگی نسبتاً شدید' },
          { range: '۲۰-۲۷', level: 'افسردگی شدید' },
        ],
        clinicalNote:
          'نمرات ۱۰ یا بیشتر از نظر بالینی قابل توجه در نظر گرفته می‌شوند. باید برای تشخیص و برنامه‌ریزی درمانی با یک متخصص بهداشت روان مشورت شود، به خصوص اگر افکار آسیب رساندن به خود وجود داشته باشد.',
      },
      'gad-7': {
        name: 'GAD-7 (اضطراب)',
        description:
          'مقیاس اختلال اضطراب فراگیر-۷ (GAD-7) یک پرسشنامه خودسنجی است که برای غربالگری و اندازه‌گیری شدت اختلال اضطراب فراگیر استفاده می‌شود.',
        scoreRange: '۰-۲۱',
        measures: [
          'احساس عصبی بودن، اضطراب یا دلشوره',
          'عدم توانایی در متوقف کردن یا کنترل نگرانی',
          'نگرانی بیش از حد در مورد مسائل مختلف',
          'مشکل در آرام شدن',
          'آنقدر بی‌قرار بودن که نشستن سخت باشد',
          'به راحتی آزرده یا تحریک‌پذیر شدن',
          'احساس ترس، انگار که اتفاق وحشتناکی قرار است بیفتد',
        ],
        scoring:
          'هر یک از ۷ مورد از ۰ ("اصلاً") تا ۳ ("تقریباً هر روز") نمره‌گذاری می‌شود. نمره کل مجموع نمرات همه موارد است.',
        interpretation: [
          { range: '۰-۴', level: 'اضطراب حداقلی' },
          { range: '۵-۹', level: 'اضطراب خفیف' },
          { range: '۱۰-۱۴', level: 'اضطراب متوسط' },
          { range: '۱۵-۲۱', level: 'اضطراب شدید' },
        ],
        clinicalNote:
          'نمرات ۱۰ یا بیشتر یک نقطه برش منطقی برای شناسایی موارد GAD است. برای نمرات در محدوده متوسط تا شدید، ارزیابی بیشتر توسط یک متخصص بالینی توصیه می‌شود.',
      },
      'aaq-ii': {
        name: 'AAQ-II (اجتناب تجربه‌ای)',
        description:
          'پرسشنامه پذیرش و عمل-II (AAQ-II) عدم انعطاف‌پذیری روانشناختی یا "اجتناب تجربه‌ای" را اندازه‌گیری می‌کند - تمایل به اجتناب از تجربیات درونی ناخواسته (افکار، احساسات، خاطرات).',
        scoreRange: '۷-۴۹',
        measures: [
          'تمایل به تجربه افکار/احساسات ناخواسته',
          'توانایی زندگی بر اساس ارزش‌های شخصی حتی با وجود درد روانی',
          'کنترل بر مسیر زندگی در مقابل کنترل شدن توسط احساسات',
        ],
        scoring:
          'این یک مقیاس ۷ موردی است که هر مورد در یک مقیاس لیکرت ۷ درجه‌ای از ۱ ("هرگز درست نیست") تا ۷ ("همیشه درست است") ارزیابی می‌شود. نمره کل مجموع همه موارد است.',
        interpretation: [
          { range: '۷-۲۳', level: 'انعطاف‌پذیری روانشناختی بالاتر' },
          { range: '۲۴-۲۸', level: 'پتانسیل برای پریشانی بالینی' },
          {
            range: '۲۹-۴۹',
            level: 'عدم انعطاف‌پذیری روانشناختی بالاتر',
          },
        ],
        clinicalNote:
          'نمرات بالاتر نشان‌دهنده اجتناب تجربه‌ای بیشتر است. نمره برش حدود ۲۴-۲۸ به عنوان نشانه‌ای از خطر مشکلات در سطح بالینی پیشنهاد شده است. این ابزار تشخیصی نیست اما یک فرآیند اصلی در بسیاری از مسائل روانشناختی را اندازه‌گیری می‌کند.',
      },
      'oci-r': {
        name: 'OCI-R (وسواس فکری-عملی)',
        description:
          'موجودی وسواس فکری-عملی-تجدیدنظر شده (OCI-R) یک مقیاس خودگزارشی کوتاه است که پریشانی مرتبط با علائم شایع اختلال وسواس فکری-عملی (OCD) را ارزیابی می‌کند.',
        scoreRange: '۰-۷۲',
        measures: [
          'شستشو/آلودگی',
          'وسواس فکری/نشخوار فکری',
          'احتکار',
          'نظم و ترتیب',
          'وارسی',
          'خنثی‌سازی/آیین‌های ذهنی',
        ],
        scoring:
          'شامل ۱۸ مورد است که هر کدام در یک مقیاس ۵ درجه‌ای از ۰ ("اصلاً") تا ۴ ("بسیار زیاد") ارزیابی می‌شوند. نمره کل مجموع همه موارد است.',
        interpretation: [
          { range: '۰-۲۰', level: 'محدوده تحت بالینی' },
          { range: '۲۱-۳۰', level: 'علائم خفیف تا متوسط' },
          { range: '۳۱-۴۰', level: 'علائم متوسط تا شدید' },
          { range: '۴۱+', level: 'علائم شدید تا بسیار شدید' },
        ],
        clinicalNote:
          'نمره برش ۲۱ اغلب برای تمایز بیماران مبتلا به OCD از نمونه‌های غیربالینی استفاده می‌شود. نمرات بالا نیاز به ارزیابی بالینی جامع برای OCD را نشان می‌دهد.',
      },
      rosenberg: {
        name: 'مقیاس عزت نفس روزنبرگ',
        description:
          'یک مقیاس ۱۰ موردی که ارزش خود جهانی را با اندازه‌گیری احساسات مثبت و منفی در مورد خود می‌سنجد.',
        scoreRange: '۰-۳۰',
        measures: [
          'احساس کلی ارزشمندی',
          'احساس خودپذیری',
          'رضایت از خود',
          'نگرش‌های احترام به خود',
        ],
        scoring:
          'موارد در یک مقیاس چهار درجه‌ای از "کاملاً موافقم" تا "کاملاً مخالفم" پاسخ داده می‌شوند. برای موارد ۱، ۲، ۴، ۶، ۷، نمرات به این صورت است: کاملاً موافقم=۳، موافقم=۲، مخالفم=۱، کاملاً مخالفم=۰. برای موارد با نمره‌گذاری معکوس ۳، ۵، ۸، ۹، ۱۰، نمرات به این صورت است: کاملاً موافقم=۰، موافقم=۱، مخالفم=۲، کاملاً مخالفم=۳. نمره کل مجموع نمرات نهایی است.',
        interpretation: [
          { range: '۰-۱۴', level: 'عزت نفس پایین' },
          { range: '۱۵-۲۵', level: 'محدوده طبیعی عزت نفس' },
          { range: '۲۶-۳۰', level: 'عزت نفس بالا' },
        ],
        clinicalNote:
          'نمرات زیر ۱۵ نشان‌دهنده عزت نفس پایین از نظر بالینی است. اگرچه خود یک اختلال نیست، اما عزت نفس پایین یک عامل خطر برای بسیاری از شرایط سلامت روان مانند افسردگی است.',
      },
      maslach: {
        name: 'پرسشنامه فرسودگی شغلی ماسلاک (MBI)',
        description:
          'MBI پرکاربردترین ابزار برای اندازه‌گیری فرسودگی شغلی است. این ابزار سه بعد را ارزیابی می‌کند: خستگی هیجانی، مسخ شخصیت و موفقیت شخصی.',
        scoreRange: 'متغیر بر اساس زیرمقیاس',
        measures: [
          'خستگی هیجانی: احساس فرسودگی و خستگی هیجانی ناشی از کار.',
          'مسخ شخصیت: پاسخ بی‌احساس و غیرشخصی نسبت به دریافت‌کنندگان خدمات، مراقبت یا آموزش.',
          'موفقیت شخصی: احساس شایستگی و دستیابی موفقیت‌آمیز در کار.',
        ],
        scoring:
          'MBI نسخه‌های متعددی دارد. نمره‌گذاری پیچیده است و شامل مجموع‌های جداگانه برای هر یک از سه زیرمقیاس است. برای این برنامه، لطفاً یک نمره کلی "فرسودگی شغلی" بر اساس ارزیابی شخصی خود یا مقیاس اصلی یک نسخه خاص MBI (مثلاً خستگی هیجانی) وارد کنید. یک محدوده رایج برای خستگی ۰-۵۴ است.',
        interpretation: [
          { range: '۰-۱۶', level: 'فرسودگی شغلی کم' },
          { range: '۱۷-۲۹', level: 'فرسودگی شغلی متوسط' },
          { range: '۳۰+', level: 'فرسودگی شغلی زیاد' },
        ],
        clinicalNote:
          'نمرات بالا در خستگی هیجانی و مسخ شخصیت، همراه با نمرات پایین در موفقیت شخصی، نشان‌دهنده فرسودگی شغلی است. این یک پدیده شغلی است، نه یک وضعیت پزشکی، اما می‌تواند منجر به مشکلات سلامتی شود.',
      },
      procrastination: {
        name: 'مقیاس اهمال‌کاری محض (PPS)',
        description:
          'یک مقیاس ۱۲ موردی که برای اندازه‌گیری اهمال‌کاری به عنوان یک ویژگی شخصیتی طراحی شده است؛ تمایل به به تعویق انداختن بی‌مورد وظایف تا حد تجربه ناراحتی ذهنی.',
        scoreRange: '۱۲-۶۰',
        measures: [
          'تأخیر در تصمیم‌گیری (مشکل در گرفتن تصمیم)',
          'تأخیر در اجرا (عدم اقدام بر اساس نیت‌ها)',
          'دیرکرد و وقت‌شناسی',
          'فقدان انرژی مولد',
        ],
        scoring:
          'هر یک از ۱۲ مورد در یک مقیاس ۵ درجه‌ای از ۱ ("بسیار به ندرت/اصلاً در مورد من صدق نمی‌کند") تا ۵ ("بسیار اغلب/بسیار در مورد من صدق می‌کند") ارزیابی می‌شود. نمره کل مجموع همه موارد است.',
        interpretation: [
          { range: '۱۲-۲۵', level: 'اهمال‌کاری کم' },
          { range: '۲۶-۳۹', level: 'اهمال‌کاری متوسط' },
          { range: '۴۰-۶۰', level: 'اهمال‌کاری زیاد' },
        ],
        clinicalNote:
          'نمرات بالا با بهزیستی پایین‌تر، استرس بالاتر و عملکرد ضعیف‌تر مرتبط است. اگرچه یک تشخیص رسمی نیست، اما اهمال‌کاری مزمن می‌تواند هدفی برای مداخله درمانی باشد.',
      },
    },
  },
};