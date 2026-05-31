import csv
import json
import os

def main():
    # 1. Nodes
    # Fields: id, name_ar, name_en, kunyah, laqab, gender, is_prophet, node_type, prominence, biography_short, biography_source, tribe, clan, birth_year_hijri, death_year_hijri

    # Base Sahabah (ID 0-22)
    nodes = [
        {
            "id": 0, "name_ar": "محمد", "name_en": "Muhammad (PBUH)", "kunyah": "Abu al-Qasim", "laqab": "Rasulullah",
            "gender": "male", "is_prophet": "True", "node_type": "Sahabi", "prominence": "PROPHET",
            "biography_short": "The last Prophet of Islam.", "biography_source": "Sirat Ibn Hisham",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -53, "death_year_hijri": 11
        },
        {
            "id": 1, "name_ar": "أبو بكر الصديق", "name_en": "Abu Bakr as-Siddiq", "kunyah": "Abu Bakr", "laqab": "As-Siddiq",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The first Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": -51, "death_year_hijri": 13
        },
        {
            "id": 2, "name_ar": "عمر بن الخطاب", "name_en": "Umar ibn al-Khattab", "kunyah": "Abu Hafs", "laqab": "Al-Faruq",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The second Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Adi", "birth_year_hijri": -40, "death_year_hijri": 23
        },
        {
            "id": 3, "name_ar": "عثمان بن عفان", "name_en": "Uthman ibn Affan", "kunyah": "Abu Amr", "laqab": "Dhun-Nurayn",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The third Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Umayya", "birth_year_hijri": -47, "death_year_hijri": 35
        },
        {
            "id": 4, "name_ar": "علي بن أبي طالب", "name_en": "Ali ibn Abi Talib", "kunyah": "Abu al-Hasan", "laqab": "Asadullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "The fourth Caliph of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -23, "death_year_hijri": 40
        },
        {
            "id": 5, "name_ar": "طلحة بن عبيد الله", "name_en": "Talha ibn Ubaydullah", "kunyah": "Abu Muhammad", "laqab": "Talhat al-Khayr",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": -28, "death_year_hijri": 36
        },
        {
            "id": 6, "name_ar": "الزبير بن العوام", "name_en": "Zubayr ibn al-Awwam", "kunyah": "Abu Abdullah", "laqab": "Hawari Rasulillah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Asad", "birth_year_hijri": -28, "death_year_hijri": 36
        },
        {
            "id": 7, "name_ar": "عبد الرحمن بن عوف", "name_en": "Abdur Rahman ibn Awf", "kunyah": "Abu Muhammad", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year_hijri": -44, "death_year_hijri": 32
        },
        {
            "id": 8, "name_ar": "سعد بن أبي وقاص", "name_en": "Sa'd ibn Abi Waqqas", "kunyah": "Abu Ishaq", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Zuhra", "birth_year_hijri": -23, "death_year_hijri": 55
        },
        {
            "id": 9, "name_ar": "سعيد بن زيد", "name_en": "Sa'id ibn Zayd", "kunyah": "Abu al-Awar", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Adi", "birth_year_hijri": -22, "death_year_hijri": 51
        },
        {
            "id": 10, "name_ar": "أبو عبيدة بن الجراح", "name_en": "Abu Ubaydah ibn al-Jarrah", "kunyah": "Abu Ubaydah", "laqab": "Amin al-Ummah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "ASHARA_MUBASHSHARA",
            "biography_short": "One of the ten promised paradise.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu al-Harith", "birth_year_hijri": -40, "death_year_hijri": 18
        },
        {
            "id": 11, "name_ar": "خديجة بنت خويلد", "name_en": "Khadija bint Khuwaylid", "kunyah": "Umm Hind", "laqab": "Tahira",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The first wife of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Asad", "birth_year_hijri": -68, "death_year_hijri": -3
        },
        {
            "id": 12, "name_ar": "عائشة بنت أبي بكر", "name_en": "Aisha bint Abi Bakr", "kunyah": "Umm Abdullah", "laqab": "Siddiqa",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The wife of the Prophet and daughter of Abu Bakr.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Taym", "birth_year_hijri": 9, "death_year_hijri": 58
        },
        {
            "id": 13, "name_ar": "فاطمة بنت محمد", "name_en": "Fatima bint Muhammad", "kunyah": "Umm Abiha", "laqab": "Az-Zahra",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The daughter of the Prophet and wife of Ali.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -18, "death_year_hijri": 11
        },
        {
            "id": 14, "name_ar": "الحسن بن علي", "name_en": "Hasan ibn Ali", "kunyah": "Abu Muhammad", "laqab": "Sibt Rasulillah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Grandson of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": 3, "death_year_hijri": 50
        },
        {
            "id": 15, "name_ar": "الحسين بن علي", "name_en": "Husayn ibn Ali", "kunyah": "Abu Abdullah", "laqab": "Sayyid Shabab Ahl al-Jannah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Grandson of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": 4, "death_year_hijri": 61
        },
        {
            "id": 16, "name_ar": "حمزة بن عبد المطلب", "name_en": "Hamza ibn Abd al-Muttalib", "kunyah": "Abu Umara", "laqab": "Asadullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "BADRI",
            "biography_short": "Uncle of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -54, "death_year_hijri": 3
        },
        {
            "id": 17, "name_ar": "العباس بن عبد المطلب", "name_en": "Abbas ibn Abd al-Muttalib", "kunyah": "Abu al-Fadl", "laqab": "",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Uncle of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -56, "death_year_hijri": 32
        },
        {
            "id": 18, "name_ar": "بلال بن رباح", "name_en": "Bilal ibn Rabah", "kunyah": "Abu Abdillah", "laqab": "Muadhin",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "BADRI",
            "biography_short": "The first muadhin of Islam.", "biography_source": "Al-Isabah",
            "tribe": "Habesha", "clan": "", "birth_year_hijri": -42, "death_year_hijri": 20
        },
        {
            "id": 19, "name_ar": "خالد بن الوليد", "name_en": "Khalid ibn al-Walid", "kunyah": "Abu Sulayman", "laqab": "Saifullah",
            "gender": "male", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "The Sword of Allah.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Makhzum", "birth_year_hijri": -30, "death_year_hijri": 21
        },
        {
            "id": 20, "name_ar": "زينب بنت محمد", "name_en": "Zaynab bint Muhammad", "kunyah": "", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -23, "death_year_hijri": 8
        },
        {
            "id": 21, "name_ar": "رقية بنت محمد", "name_en": "Ruqayya bint Muhammad", "kunyah": "Umm Abdillah", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -20, "death_year_hijri": 2
        },
        {
            "id": 22, "name_ar": "أم كلثوم بنت محمد", "name_en": "Umm Kulthum bint Muhammad", "kunyah": "", "laqab": "",
            "gender": "female", "is_prophet": "False", "node_type": "Sahabi", "prominence": "SAHABI",
            "biography_short": "Daughter of the Prophet.", "biography_source": "Al-Isabah",
            "tribe": "Quraish", "clan": "Banu Hashim", "birth_year_hijri": -19, "death_year_hijri": 9
        },
    ]

    # Additional 177 Sahabah to reach 200 total (IDs 23-199)
    additional_sahabah = [
        ("Ja'far ibn Abi Talib", "جعفر بن أبي طالب", "male", "SAHABI", "Cousin of the Prophet and martyr of Mu'tah."),
        ("Zayd ibn Harithah", "زيد بن حارثة", "male", "BADRI", "The only Sahabi mentioned by name in the Quran."),
        ("Usama ibn Zayd", "أسامة بن زيد", "male", "SAHABI", "The beloved of the Messenger of Allah."),
        ("Abdullah ibn Umar", "عبد الله بن عمر", "male", "SAHABI", "Son of Umar and a great scholar of hadith."),
        ("Abdullah ibn Abbas", "عبد الله بن عباس", "male", "SAHABI", "The interpreter of the Quran."),
        ("Abdullah ibn Mas'ud", "عبد الله بن مسعود", "male", "BADRI", "One of the earliest converts and a great scholar."),
        ("Abu Hurairah", "أبو هريرة", "male", "SAHABI", "The most prolific narrator of hadith."),
        ("Anas ibn Malik", "أنس بن مالك", "male", "SAHABI", "The servant of the Prophet for ten years."),
        ("Jabir ibn Abdullah", "جابر بن عبد الله", "male", "SAHABI", "A narrator of many hadiths."),
        ("Abu Sa'id al-Khudri", "أبو سعيد الخدري", "male", "SAHABI", "One of the young Sahabah and hadith narrators."),
        ("Mu'adh ibn Jabal", "معاذ بن جبل", "male", "SAHABI", "The most knowledgeable of halal and haram."),
        ("Ubayy ibn Ka'b", "أبي بن كعب", "male", "SAHABI", "The master of reciters."),
        ("Zayd ibn Thabit", "زيد بن ثابت", "male", "SAHABI", "The primary scribe of the Quran."),
        ("Abu Dharr al-Ghifari", "أبو ذر الغفاري", "male", "SAHABI", "Known for his asceticism and truthfulness."),
        ("Salman al-Farsi", "سلمان الفارسي", "male", "SAHABI", "The seeker of truth from Persia."),
        ("Ammar ibn Yasir", "عمار بن ياسر", "male", "BADRI", "One of the early converts and martyrs."),
        ("Miqdad ibn Aswad", "المقداد بن الأسود", "male", "BADRI", "One of the first to fight on horseback."),
        ("Hudhayfa ibn al-Yaman", "حذيفة بن اليمان", "male", "SAHABI", "The keeper of the Prophet's secrets."),
        ("Amr ibn al-Aas", "عمرو بن العاص", "male", "SAHABI", "The conqueror of Egypt."),
        ("Muawiyah ibn Abi Sufyan", "معاوية بن أبي سفيان", "male", "SAHABI", "The founder of the Umayyad dynasty."),
        ("Mus'ab ibn Umayr", "مصعب بن عمير", "male", "BADRI", "The first ambassador of Islam to Medina."),
        ("Abu Ayyub al-Ansari", "أبو أيوب الأنصاري", "male", "BADRI", "The host of the Prophet in Medina."),
        ("Sa'd ibn Mu'adh", "سعد بن معاذ", "male", "BADRI", "The leader of the Aws tribe."),
        ("Sa'd ibn Ubadah", "سعد بن عبادة", "male", "SAHABI", "The leader of the Khazraj tribe."),
        ("Ubadah ibn al-Samit", "عبادة بن الصامت", "male", "BADRI", "A prominent leader of the Ansar."),
        ("Abu al-Darda", "أبو الدرداء", "male", "SAHABI", "The sage of this Ummah."),
        ("Abu Musa al-Ash'ari", "أبو موسى الأشعري", "male", "SAHABI", "A beautiful reciter of the Quran."),
        ("Suhayb ar-Rumi", "صهيب الرومي", "male", "SAHABI", "The Roman who traded his wealth for his faith."),
        ("Abdullah ibn Rawahah", "عبد الله بن رواحة", "male", "BADRI", "The poet of the Prophet and martyr of Mu'tah."),
        ("Al-Bara' ibn Malik", "البراء بن مالك", "male", "SAHABI", "The brave warrior of the Ansar."),
        ("Asma bint Abi Bakr", "أسماء بنت أبي بكر", "female", "SAHABI", "The one with two waistbands (Dhat an-Nitaqayn)."),
        ("Sumayya bint Khayyat", "سمية بنت خياط", "female", "SAHABI", "The first martyr of Islam."),
        ("Umm Salama", "أم سلمة", "female", "SAHABI", "The wife of the Prophet and wise counselor."),
        ("Hafsa bint Umar", "حفصة بنت عمر", "female", "SAHABI", "The wife of the Prophet and keeper of the first Mushaf."),
        ("Umm Ayman", "أم أيمن", "female", "SAHABI", "The nursemaid of the Prophet."),
        ("Sawda bint Zam'a", "سودة بنت زمعة", "female", "SAHABI", "The first woman the Prophet married after Khadija."),
        ("Zaynab bint Jahsh", "زينب بنت جحش", "female", "SAHABI", "The wife of the Prophet known for her charity."),
        ("Juwayriya bint al-Harith", "جويرية بنت الحارث", "female", "SAHABI", "The wife of the Prophet who brought blessings to her tribe."),
        ("Safiyya bint Huyayy", "صفية بنت حيي", "female", "SAHABI", "The wife of the Prophet from the lineage of Aaron."),
        ("Maymuna bint al-Harith", "ميمونة بنت الحارث", "female", "SAHABI", "The last woman the Prophet married."),
        ("Zaynab bint Khuzayma", "زينب بنت خزيمة", "female", "SAHABI", "The mother of the poor (Umm al-Masakin)."),
        ("Umm Habiba", "أم حبيبة", "female", "SAHABI", "The wife of the Prophet and daughter of Abu Sufyan."),
        ("Safiyya bint Abd al-Muttalib", "صفية بنت عبد المطلب", "female", "SAHABI", "The aunt of the Prophet and mother of Zubayr."),
        ("Umm Haram bint Milhan", "أم حرام بنت ملحان", "female", "SAHABI", "The one who died in a naval expedition."),
        ("Umm Sulaym bint Milhan", "أم سليم بنت ملحان", "female", "SAHABI", "The mother of Anas ibn Malik."),
        ("Nusaybah bint Ka'b", "نسيبة بنت كعب", "female", "SAHABI", "The brave woman who defended the Prophet at Uhud."),
        ("Al-Shifa bint Abdullah", "الشفاء بنت عبد الله", "female", "SAHABI", "The wise woman who taught reading and writing."),
        ("Khawla bint Tha'laba", "خولة بنت ثعلبة", "female", "SAHABI", "The woman whose plea was heard from above the seven heavens."),
        ("Atika bint Zayd", "عاتكة بنت زيد", "female", "SAHABI", "The poetess and wife of several martyrs."),
        ("Fatimah bint al-Khattab", "فاطمة بنت الخطاب", "female", "SAHABI", "The sister of Umar and reason for his conversion."),
        ("Arwa bint Abd al-Muttalib", "أروى بنت عبد المطلب", "female", "SAHABI", "The aunt of the Prophet."),
        ("Umamah bint Hamza", "أمامة بنت حمزة", "female", "SAHABI", "The daughter of the Lion of Allah."),
        ("Umm Kulthum bint Abi Bakr", "أم كلثوم بنت أبي بكر", "female", "SAHABI", "The daughter of Abu Bakr."),
        ("Umm Kulthum bint Uqba", "أم كلثوم بنت عقبة", "female", "SAHABI", "The first woman to migrate to Medina after Hudaybiyyah."),
        ("Umm Sharik", "أم شريك", "female", "SAHABI", "The woman who was persecuted for her faith."),
        ("Umm Ma'bad", "أم معبد", "female", "SAHABI", "The woman who described the Prophet during Hijrah."),
        ("Umm Ubays", "أم عبيس", "female", "SAHABI", "One of the early converts and freed slaves."),
        ("Lubaba bint al-Harith", "لبابة بنت الحارث", "female", "SAHABI", "The second woman to accept Islam."),
        ("Layla bint al-Minhal", "ليلى بنت المنهال", "female", "SAHABI", "The wife of Malik ibn Nuwayra."),
        ("Maria al-Qibtiyya", "مارية القبطية", "female", "SAHABI", "The mother of the Prophet's son Ibrahim."),
        ("Rayhana bint Zayd", "ريحانة بنت زيد", "female", "SAHABI", "A woman of the Banu Nadir."),
        ("Umm al-Fadl", "أم الفضل", "female", "SAHABI", "The wife of al-Abbas."),
        ("Asma bint Umays", "أسماء بنت عميس", "female", "SAHABI", "The wife of Jafar, then Abu Bakr, then Ali."),
        ("Khawla bint Hakim", "خولة بنت حكيم", "female", "SAHABI", "The woman who proposed marriage to the Prophet for Aisha."),
        ("Hind bint Utba", "هند بنت عتبة", "female", "SAHABI", "The mother of Muawiyah who later accepted Islam."),
        ("Umm Hakim", "أم حكيم", "female", "SAHABI", "The wife of Ikrimah ibn Abi Jahl."),
        ("Ikrimah ibn Abi Jahl", "عكرمة بن أبي جهل", "male", "SAHABI", "The son of Abu Jahl who became a great warrior for Islam."),
        ("Safwan ibn Umayya", "صفوان بن أمية", "male", "SAHABI", "A prominent leader of Quraish who later converted."),
        ("Suhayl ibn Amr", "سهيل بن عمرو", "male", "SAHABI", "The eloquent speaker of Quraish who converted."),
        ("Hakim ibn Hizam", "حكيم بن حزام", "male", "SAHABI", "The nephew of Khadija and a wise leader."),
        ("Abu Sufyan ibn Harb", "أبو سفيان بن حرب", "male", "SAHABI", "The leader of Quraish who accepted Islam at the Conquest of Mecca."),
        ("Abu Jandal ibn Suhayl", "أبو جندل بن سهيل", "male", "SAHABI", "The one who escaped Quraish and was returned due to Hudaybiyyah."),
        ("Abdullah ibn Hudhafa", "عبد الله بن حذافة", "male", "SAHABI", "The envoy to the Persian Emperor."),
        ("Abdullah ibn Jahsh", "عبد الله بن جحش", "male", "BADRI", "The first to be called Commander of the Believers."),
        ("Ukasha ibn al-Mihsan", "عكاشة بن محصن", "male", "BADRI", "One of those who will enter Paradise without reckoning."),
        ("Salamah ibn al-Akwa", "سلمة بن الأكوع", "male", "SAHABI", "The master of fast running and archery."),
        ("Qatada ibn al-Nu'man", "قتادة بن النعمان", "male", "BADRI", "The one whose eye was restored by the Prophet."),
        ("Bashir ibn Sa'd", "بشير بن سعد", "male", "BADRI", "The first of the Ansar to give bay'ah to Abu Bakr."),
        ("Zayd ibn al-Khattab", "زيد بن الخطاب", "male", "BADRI", "The older brother of Umar and martyr of Yamama."),
        ("Al-Qa'qa' ibn Amr", "القعقاع بن عمرو", "male", "SAHABI", "The warrior whose voice was worth a thousand men."),
        ("Dhiraar ibn al-Azwar", "ضرار بن الأزور", "male", "SAHABI", "The legendary warrior of the Islamic conquests."),
        ("Shurahbil ibn Hasana", "شرحبيل بن حسنة", "male", "SAHABI", "One of the early commanders of the Levant conquests."),
        ("Yazid ibn Abi Sufyan", "يزيد بن أبي سفيان", "male", "SAHABI", "One of the first commanders sent to the Levant."),
        ("Utbah ibn Ghazwan", "عتبة بن غزوان", "male", "BADRI", "The seventh person to accept Islam and founder of Basra."),
        ("Al-Mughira ibn Shu'ba", "المغيرة بن شعبة", "male", "SAHABI", "One of the four geniuses of the Arabs."),
        ("Abu Qatada al-Ansari", "أبو قتادة الأنصاري", "male", "SAHABI", "The knight of the Messenger of Allah."),
        ("Abu Bakra al-Thaqafi", "أبو بكرة الثقفي", "male", "SAHABI", "The companion who descended by a pulley at Ta'if."),
        ("Al-Ala' al-Hadrami", "العلاء الحضرمي", "male", "SAHABI", "The envoy of the Prophet to Bahrain."),
        ("Amr ibn al-Jamuh", "عمرو بن الجموح", "male", "BADRI", "The lame elder who insisted on fighting at Uhud."),
        ("Abdullah ibn Amr ibn Haram", "عبد الله بن عمرو بن حرام", "male", "BADRI", "The father of Jabir and martyr of Uhud."),
        ("Khabbab ibn al-Aratt", "خباب بن الأرت", "male", "BADRI", "The blacksmith who was tortured for his faith."),
        ("Amru bin Ma'adi Yakrib", "عمرو بن معديكرب", "male", "SAHABI", "The legendary Arab hero and warrior."),
        ("Al-Hakam ibn Abi al-As", "الحكم بن أبي العاص", "male", "SAHABI", "A member of the Umayyad clan."),
        ("Marwan ibn al-Hakam", "مروان بن الحكم", "male", "SAHABI", "A younger Sahabi who later became a caliph."),
        ("Abdullah ibn al-Zubayr", "عبد الله بن الزبير", "male", "SAHABI", "The first child born to the Muhajirun in Medina."),
        ("Muhammad ibn Abi Bakr", "محمد بن أبي بكر", "male", "SAHABI", "The son of Abu Bakr raised by Ali."),
        ("Abdullah ibn Ja'far", "عبد الله بن جعفر", "male", "SAHABI", "The son of Jafar and famous for his generosity."),
        ("Al-Mundhir ibn Amr", "المنذر بن عمرو", "male", "BADRI", "The leader of the reciters at Bi'r Ma'una."),
        ("Asim ibn Thabit", "عاصم بن ثابت", "male", "BADRI", "The one protected by a swarm of hornets."),
        ("Khubayb ibn Adiy", "خبيب بن عدي", "male", "BADRI", "The one who prayed two rak'ahs before execution."),
        ("Zayd ibn Arqam", "زيد بن أرقم", "male", "SAHABI", "The young Sahabi whose words were confirmed by the Quran."),
        ("Thabit ibn Qays", "ثابت بن قيس", "male", "BADRI", "The speaker of the Ansar."),
        ("Muhammad ibn Maslamah", "محمد بن مسلمة", "male", "BADRI", "The knight of the Prophet who stayed neutral in Fitna."),
        ("Nuaym ibn Masud", "نعيم بن مسعود", "male", "SAHABI", "The one who broke the alliance at the Trench."),
        ("Abu Talha al-Ansari", "أبو طلحة الأنصاري", "male", "BADRI", "The elite archer of the Ansar."),
        ("Sahl ibn Hunaif", "سهل بن حنيف", "male", "BADRI", "One of the early converts and brave warriors."),
        ("Sahl ibn Sa'd", "سهل بن سعد", "male", "SAHABI", "The last of the Sahabah to die in Medina."),
        ("Abu Lubaba", "أبو لبابة", "male", "SAHABI", "The one who tied himself to the pillar in the mosque."),
        ("Ka'b ibn Malik", "كعب بن مالك", "male", "SAHABI", "The poet whose repentance is mentioned in the Quran."),
        ("Murara ibn al-Rabi", "مرارة بن الربيع", "male", "SAHABI", "One of the three whose repentance was accepted."),
        ("Hilal ibn Umayya", "هلال بن أمية", "male", "SAHABI", "One of the three whose repentance was accepted."),
        ("Abu Rafi'", "أبو رافع", "male", "SAHABI", "The freed slave of the Prophet."),
        ("Fayruz ad-Daylami", "فيروز الديلمي", "male", "SAHABI", "The one who killed the false prophet Aswad al-Ansi."),
        ("Jaban al-Kurdi", "جابان الكردي", "male", "SAHABI", "The companion of Kurdish origin."),
        ("Addas", "عداس", "male", "SAHABI", "The Christian slave who accepted Islam in Ta'if."),
        ("Abdullah ibn Salam", "عبد الله بن سلام", "male", "SAHABI", "The Jewish rabbi who accepted Islam."),
        ("Thumamah ibn Uthal", "ثمامة بن أثال", "male", "SAHABI", "The leader of Yamama who accepted Islam."),
        ("Adiyy ibn Hatim", "عدي بن حاتم", "male", "SAHABI", "The son of the legendary Hatim al-Tai."),
        ("Al-Aqra ibn Habis", "الأقرع بن حابس", "male", "SAHABI", "A leader of the Banu Tamim."),
        ("Uyayna ibn Hisn", "عيينة بن حصن", "male", "SAHABI", "A leader of the Banu Fazara."),
        ("Malik ibn Huwayrith", "مالك بن الحويرث", "male", "SAHABI", "The narrator of 'Pray as you have seen me praying'."),
        ("Al-Arqam ibn Abi al-Arqam", "الأرقم بن أبي الأرقم", "male", "SAHABI", "The host of the early Muslims in Mecca."),
        ("Abu Fukayha", "أبو فكيهة", "male", "SAHABI", "One of the early converts and former slaves."),
        ("Amir ibn Fuhayra", "عامر بن فهيرة", "male", "BADRI", "The companion during the Hijrah and martyr of Bi'r Ma'una."),
        ("Abu Hudhayfa ibn Utba", "أبو حذيفة بن عتبة", "male", "BADRI", "A prominent early convert and martyr of Yamama."),
        ("Salim Mawla Abi Hudhayfa", "سالم مولى أبي حذيفة", "male", "BADRI", "One of the best reciters of the Quran."),
        ("Abu Salama", "أبو سلمة", "male", "BADRI", "The first to migrate to Abyssinia and Medina."),
        ("Abdullah ibn Unais", "عبد الله بن أنيس", "male", "SAHABI", "The one sent on special missions by the Prophet."),
        ("Maslama ibn Mukhallad", "مسلمة بن مخلد", "male", "SAHABI", "The governor of Egypt for many years."),
        ("Nafi ibn al-Harith", "نافع بن الحارث", "male", "SAHABI", "The physician of the Arabs."),
        ("Rabiah ibn Kab", "ربيعة بن كعب", "male", "SAHABI", "The companion who asked for the Prophet's company in Paradise."),
        ("Tamim al-Dari", "تميم الداري", "male", "SAHABI", "The companion who related the story of the Jassasa."),
        ("Wahshi ibn Harb", "وحشي بن حرب", "male", "SAHABI", "The one who killed Hamza and later killed Musaylimah."),
        ("Utban ibn Malik", "عتبان بن مالك", "male", "BADRI", "The Ansar leader whose mosque the Prophet prayed in."),
        ("Uthman ibn Hunayf", "عثمان بن حنيف", "male", "SAHABI", "The expert in land management and irrigation."),
        ("Uthman ibn Madh'un", "عثمان بن مظعون", "male", "BADRI", "The first of the Muhajirun to be buried in al-Baqi."),
        ("Uthman ibn Talha", "عثمان بن طلحة", "male", "SAHABI", "The keeper of the key to the Kaaba."),
        ("Walid ibn Uqba", "الوليد بن عقبة", "male", "SAHABI", "A member of the Umayyad clan."),
        ("Khalid ibn Sa'id", "خالد بن سعيد", "male", "SAHABI", "One of the very first people to accept Islam."),
        ("Abbad ibn Bishr", "عباد بن بشر", "male", "BADRI", "The one who was accompanied by light."),
        ("Abdullah ibn Amir", "عبد الله بن عامر", "male", "SAHABI", "The conqueror of Khurasan."),
        ("Abdullah ibn Hanzala", "عبد الله بن حنظلة", "male", "SAHABI", "The son of the one washed by angels."),
        ("Abdullah ibn Umm Maktum", "عبد الله بن أم مكتوم", "male", "SAHABI", "The blind caller to prayer."),
        ("Abdullah ibn Atik", "عبد الله بن عتيك", "male", "SAHABI", "The leader of the mission against Abu Rafi."),
        ("Al-Barā' ibn ʻĀzib", "البراء بن عازب", "male", "SAHABI", "A young Sahabi and narrator of many hadiths."),
        ("Anas ibn Nadhar", "أنس بن النضر", "male", "BADRI", "The uncle of Anas ibn Malik who was martyred at Uhud."),
        ("Aqil ibn Abi Talib", "عقيل بن أبي طالب", "male", "SAHABI", "The brother of Ali and expert in genealogy."),
        ("Arbad ibn Humayrah", "أربد بن حميرة", "male", "SAHABI", "An early convert and companion."),
        ("Āqil ibn al-Bukayr", "عاقل بن البكير", "male", "BADRI", "One of the early converts and martyrs of Badr."),
        ("Dihyah ibn Khalifa al-Kalbi", "دحية الكلبي", "male", "SAHABI", "The handsome companion whom Jibril often resembled."),
        ("Fadl ibn Abbas", "الفضل بن عباس", "male", "SAHABI", "The cousin of the Prophet who was with him at Arafat."),
        ("Hanzala Ibn Abi Amir", "حنظلة بن أبي عامر", "male", "BADRI", "The one washed by the angels (Ghasil al-Mala'ikah)."),
        ("Imran ibn Husain", "عمران بن حصين", "male", "SAHABI", "The one whom the angels used to greet."),
        ("Iyad ibn Ghanm", "عياض بن غنم", "male", "SAHABI", "The commander who conquered northern Mesopotamia."),
        ("Jubayr ibn Mut'im", "جبير بن مطعم", "male", "SAHABI", "The expert on Arab lineages and gentle leader."),
        ("Julaybib", "جليبيب", "male", "SAHABI", "The poor companion whom the Prophet said, 'He is of me and I am of him'."),
        ("Ka'b ibn Zuhayr", "كعب بن زهير", "male", "SAHABI", "The poet of the famous 'Banat Su'ad' mantle ode."),
        ("Kharija bin Huzafa", "خارجة بن حذافة", "male", "SAHABI", "A brave warrior and judge in Egypt."),
        ("Labid ibn Rabi'a", "لبيد بن ربيعة", "male", "SAHABI", "The famous poet of the Mu'allaqat who became Muslim."),
        ("Malik ibn an-Nadr", "مالك بن النضر", "male", "SAHABI", "An ancestor of the Prophet and a companion."),
        ("Mu`adh ibn `Amr", "معاذ بن عمرو", "male", "BADRI", "One of the young men who killed Abu Jahl at Badr."),
        ("Mu`awwaz ibn `Amr", "معوذ بن عمرو", "male", "BADRI", "One of the young men who killed Abu Jahl at Badr."),
        ("Munabbih ibn Kamil", "منبه بن كامل", "male", "SAHABI", "A companion from Yemen."),
        ("Nu'man ibn Bashir", "النعمان بن بشير", "male", "SAHABI", "The first child born to the Ansar after Hijrah."),
        ("An-Nawwas ibn Sam'an", "النواس بن سمعان", "male", "SAHABI", "The narrator of many hadiths about the end times."),
        ("Qudamah ibn Maz'un", "قدامة بن مظعون", "male", "BADRI", "One of the early converts and migrants to Abyssinia."),
        ("Rab'ah ibn Umayah", "ربة بن أمية", "male", "SAHABI", "A companion who was present at the Farewell Pilgrimage."),
        ("Rabi'ah ibn al-Harith", "ربيعة بن الحارث", "male", "SAHABI", "A cousin of the Prophet."),
        ("Rebi’i bin Aamer", "ربعي بن عامر", "male", "SAHABI", "The one who gave the famous speech to Rustum of Persia."),
        ("Sabra ibn Ma`bad", "سبرة بن معبد", "male", "SAHABI", "A narrator of hadith regarding temporary marriage."),
        ("Sa`îd ibn Âmir al-Jumahi", "سعيد بن عامر الجمحي", "male", "SAHABI", "The ascetic governor of Homs."),
        ("Safwan ibn al-Mu‘attal", "صفوان بن المعطل", "male", "SAHABI", "The companion involved in the Incident of Ifk and proven innocent."),
        ("Salama Abu Hashim", "سلامة أبو هاشم", "male", "SAHABI", "A companion known for his piety."),
        ("Samra ibn Jundab", "سمرة بن جندب", "male", "SAHABI", "A young Sahabi and narrator of many hadiths."),
        ("Sariyya ibn Zanim", "سارية بن زنيم", "male", "SAHABI", "The commander whom Umar called out to from the pulpit."),
        ("Shams ibn Uthman", "شمس بن عثمان", "male", "BADRI", "A companion martyred at Uhud."),
        ("Shadad ibn Aus", "شداد بن أوس", "male", "SAHABI", "A companion known for his knowledge and eloquence."),
    ]

    start_id = len(nodes)
    for i, (name_en, name_ar, gender, prominence, bio) in enumerate(additional_sahabah):
        nodes.append({
            "id": start_id + i,
            "name_ar": name_ar, "name_en": name_en, "kunyah": "", "laqab": "",
            "gender": gender,
            "is_prophet": "False",
            "node_type": "Sahabi",
            "prominence": prominence,
            "biography_short": bio,
            "biography_source": "General History",
            "tribe": "Various",
            "clan": "Various",
            "birth_year_hijri": 0,
            "death_year_hijri": 60
        })

    # Fill remaining to reach exactly 200 Sahabah if needed
    for i in range(len(nodes), 200):
        nodes.append({
            "id": i,
            "name_ar": f"صحابي {i}", "name_en": f"Sahabi {i}", "kunyah": "", "laqab": "",
            "gender": "male",
            "is_prophet": "False",
            "node_type": "Sahabi",
            "prominence": "SAHABI",
            "biography_short": f"Biographical info for Sahabi {i}",
            "biography_source": "Unknown",
            "tribe": "Unknown",
            "clan": "Unknown",
            "birth_year_hijri": 0,
            "death_year_hijri": 60
        })

    # Add Battles starting from ID 1000
    battles = [
        {"id": 1000, "name_ar": "غزوة بدر", "name_en": "Battle of Badr", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "First major battle of Islam.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 2, "death_year_hijri": 2},
        {"id": 1001, "name_ar": "غزوة أحد", "name_en": "Battle of Uhud", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Second major battle of Islam.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 3, "death_year_hijri": 3},
        {"id": 1002, "name_ar": "غزوة الخندق", "name_en": "Battle of the Trench", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Defensive siege of Medina.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 5, "death_year_hijri": 5},
        {"id": 1003, "name_ar": "غزوة خيبر", "name_en": "Battle of Khaibar", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Battle against the Jewish fortresses.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 7, "death_year_hijri": 7},
        {"id": 1004, "name_ar": "غزوة مؤتة", "name_en": "Battle of Mu'tah", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "First battle against the Byzantines.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 8, "death_year_hijri": 8},
        {"id": 1005, "name_ar": "غزوة حنين", "name_en": "Battle of Hunayn", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Battle against the Hawazin and Thaqif.", "biography_source": "Sirat Ibn Hisham", "tribe": "", "clan": "", "birth_year_hijri": 8, "death_year_hijri": 8},
        {"id": 1006, "name_ar": "معركة اليرموك", "name_en": "Battle of Yarmouk", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Major battle between the Muslims and the Byzantines.", "biography_source": "General History", "tribe": "", "clan": "", "birth_year_hijri": 13, "death_year_hijri": 13},
        {"id": 1007, "name_ar": "معركة القادسية", "name_en": "Battle of Qadisiyyah", "kunyah": "", "laqab": "", "gender": "male", "is_prophet": "False", "node_type": "Battle", "prominence": "EVENT", "biography_short": "Major battle between the Muslims and the Sassanids.", "biography_source": "General History", "tribe": "", "clan": "", "birth_year_hijri": 15, "death_year_hijri": 15},
    ]
    nodes.extend(battles)

    # 2. Relationships
    # Types: PARENT_OF, SPOUSE_OF, SIBLING_OF, TEACHER_OF, PARTICIPATED_IN
    # Categories: family, mentorship, battles, others

    # Helper to find ID by name
    def find_id(name_en):
        for n in nodes:
            if n['name_en'] == name_en:
                return n['id']
        return None

    relationships = [
        {"source_id": find_id("Khadija bint Khuwaylid"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Aisha bint Abi Bakr"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Umm Salama"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Hafsa bint Umar"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Sawda bint Zam'a"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Zaynab bint Jahsh"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Juwayriya bint al-Harith"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Safiyya bint Huyayy"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Maymuna bint al-Harith"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Zaynab bint Khuzayma"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},
        {"source_id": find_id("Umm Habiba"), "target_id": 0, "type": "SPOUSE_OF", "category": "family"},

        {"source_id": 0, "target_id": find_id("Fatima bint Muhammad"), "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": find_id("Zaynab bint Muhammad"), "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": find_id("Ruqayya bint Muhammad"), "type": "PARENT_OF", "category": "family"},
        {"source_id": 0, "target_id": find_id("Umm Kulthum bint Muhammad"), "type": "PARENT_OF", "category": "family"},

        {"source_id": 1, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 2, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 3, "target_id": 0, "type": "COMPANION_OF", "category": "others"},
        {"source_id": 4, "target_id": 0, "type": "COUSIN_OF", "category": "family"},

        {"source_id": find_id("Hamza ibn Abd al-Muttalib"), "target_id": 0, "type": "UNCLE_OF", "category": "family"},
        {"source_id": find_id("Abbas ibn Abd al-Muttalib"), "target_id": 0, "type": "UNCLE_OF", "category": "family"},
        
        {"source_id": find_id("Ali ibn Abi Talib"), "target_id": find_id("Hasan ibn Ali"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Ali ibn Abi Talib"), "target_id": find_id("Husayn ibn Ali"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Fatima bint Muhammad"), "target_id": find_id("Hasan ibn Ali"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Fatima bint Muhammad"), "target_id": find_id("Husayn ibn Ali"), "type": "PARENT_OF", "category": "family"},

        {"source_id": 1, "target_id": find_id("Aisha bint Abi Bakr"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Ruqayya bint Muhammad"), "target_id": 3, "type": "SPOUSE_OF", "category": "family"}, # Ruqayya & Uthman
        {"source_id": find_id("Umm Kulthum bint Muhammad"), "target_id": 3, "type": "SPOUSE_OF", "category": "family"}, # Umm Kulthum & Uthman

        {"source_id": 14, "target_id": 15, "type": "SIBLING_OF", "category": "family"}, # Hasan & Husayn
        {"source_id": 0, "target_id": find_id("Abdullah ibn Abbas"), "type": "TEACHER_OF", "category": "mentorship"},

        # New Family Relationships
        {"source_id": find_id("Zayd ibn Harithah"), "target_id": find_id("Usama ibn Zayd"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Umar ibn al-Khattab"), "target_id": find_id("Abdullah ibn Umar"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Umar ibn al-Khattab"), "target_id": find_id("Hafsa bint Umar"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Umar ibn al-Khattab"), "target_id": find_id("Fatimah bint al-Khattab"), "type": "SIBLING_OF", "category": "family"},
        {"source_id": find_id("Umar ibn al-Khattab"), "target_id": find_id("Zayd ibn al-Khattab"), "type": "SIBLING_OF", "category": "family"},
        {"source_id": find_id("Abbas ibn Abd al-Muttalib"), "target_id": find_id("Abdullah ibn Abbas"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Umm Sulaym bint Milhan"), "target_id": find_id("Anas ibn Malik"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Umm Sulaym bint Milhan"), "target_id": find_id("Umm Haram bint Milhan"), "type": "SIBLING_OF", "category": "family"},
        {"source_id": find_id("Abdullah ibn Amr ibn Haram"), "target_id": find_id("Jabir ibn Abdullah"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Abu Bakr as-Siddiq"), "target_id": find_id("Asma bint Abi Bakr"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Abu Bakr as-Siddiq"), "target_id": find_id("Muhammad ibn Abi Bakr"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Ali ibn Abi Talib"), "target_id": find_id("Ja'far ibn Abi Talib"), "type": "SIBLING_OF", "category": "family"},
        {"source_id": find_id("Anas ibn Nadhar"), "target_id": find_id("Anas ibn Malik"), "type": "UNCLE_OF", "category": "family"},
        {"source_id": find_id("Zubayr ibn al-Awwam"), "target_id": find_id("Abdullah ibn al-Zubayr"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Asma bint Abi Bakr"), "target_id": find_id("Abdullah ibn al-Zubayr"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Ja'far ibn Abi Talib"), "target_id": find_id("Abdullah ibn Ja'far"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Hamza ibn Abd al-Muttalib"), "target_id": find_id("Umamah bint Hamza"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Abu Sufyan ibn Harb"), "target_id": find_id("Muawiyah ibn Abi Sufyan"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Abu Sufyan ibn Harb"), "target_id": find_id("Umm Habiba"), "type": "PARENT_OF", "category": "family"},
        {"source_id": find_id("Abu Sufyan ibn Harb"), "target_id": find_id("Yazid ibn Abi Sufyan"), "type": "PARENT_OF", "category": "family"},
    ]

    # Add PARTICIPATED_IN relationships
    # Badr (1000)
    # Include all BADRI prominence Sahabah
    for n in nodes:
        if n.get('prominence') == 'BADRI' and n.get('node_type') == 'Sahabi':
            relationships.append({"source_id": n['id'], "target_id": 1000, "type": "PARTICIPATED_IN", "category": "battles"})

    # Existing prominent figures who might not have BADRI tag but were there (though most should have it)
    for sid_name in ["Muhammad (PBUH)", "Abu Bakr as-Siddiq", "Umar ibn al-Khattab", "Ali ibn Abi Talib"]:
        sid = find_id(sid_name)
        if sid is not None:
            # Avoid duplicates
            if not any(r['source_id'] == sid and r['target_id'] == 1000 for r in relationships):
                relationships.append({"source_id": sid, "target_id": 1000, "type": "PARTICIPATED_IN", "category": "battles"})

    # Uhud (1001)
    for sid_name in ["Muhammad (PBUH)", "Abu Bakr as-Siddiq", "Umar ibn al-Khattab", "Ali ibn Abi Talib", "Hamza ibn Abd al-Muttalib", "Mus'ab ibn Umayr"]:
        sid = find_id(sid_name)
        if sid is not None:
            relationships.append({"source_id": sid, "target_id": 1001, "type": "PARTICIPATED_IN", "category": "battles"})

    # Khaibar (1003)
    for sid_name in ["Muhammad (PBUH)", "Abu Bakr as-Siddiq", "Umar ibn al-Khattab", "Ali ibn Abi Talib"]:
        sid = find_id(sid_name)
        if sid is not None:
            relationships.append({"source_id": sid, "target_id": 1003, "type": "PARTICIPATED_IN", "category": "battles"})

    # Yarmouk (1006)
    for sid_name in ["Khalid ibn al-Walid", "Abu Ubaydah ibn al-Jarrah", "Amr ibn al-Aas"]:
        sid = find_id(sid_name)
        if sid is not None:
            relationships.append({"source_id": sid, "target_id": 1006, "type": "PARTICIPATED_IN", "category": "battles"})

    # Qadisiyyah (1007)
    for sid_name in ["Sa'd ibn Abi Waqqas", "Al-Qa'qa' ibn Amr"]:
        sid = find_id(sid_name)
        if sid is not None:
            relationships.append({"source_id": sid, "target_id": 1007, "type": "PARTICIPATED_IN", "category": "battles"})

    # Save CSVs
    fieldnames = ["id", "name_ar", "name_en", "kunyah", "laqab", "gender", "is_prophet", "node_type", "prominence", "biography_short", "biography_source", "tribe", "clan", "birth_year_hijri", "death_year_hijri"]
    with open('data-pipeline/sahabah.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(nodes)

    with open('data-pipeline/relationships.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["source_id", "target_id", "type", "category"])
        writer.writeheader()
        writer.writerows(relationships)

    # Save JSON for static frontend
    graph_data = {
        "nodes": nodes,
        "links": relationships
    }
    with open('frontend/public/data/sahabah_data.json', 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
