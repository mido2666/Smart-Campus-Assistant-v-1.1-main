import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const nameMapping: { [key: string]: string } = {
    "أ.د ابراهيم سليم": "Ibrahim Salim",
    "أ.د عادل نسيم": "Adel Nassim",
    "أ.د. مجدي أحمد عبد البر": "Magdy Ahmed AbdelBarr",
    "أ.د نجلاء محمد إبراهيم بكر": "Naglaa Mohamed Ibrahim",
    "أ.د. وليد محمد ميلاد": "Walid Mohamed Milad",
    "أ.م.د ايمان منير علي": "Iman Mounir Ali",
    "أ.م.د حسن صلاح محمد الدسوقى": "Hassan Salah Mohamed",
    "أ.م.د حسن صلاح محمد الدسوقي": "Hassan Salah Mohamed",
    "د. ابراهيم حسين محمود": "Ibrahim Hussein Mahmoud",
    "د. احمد امين": "Ahmed Amin",
    "د. احمد صلاح سيد محمد": "Ahmed Salah Sayed",
    "د. احمد محمد حسن عبد الجواد": "Ahmed Mohamed Hassan",
    "د. احمد محمد سلام": "Ahmed Mohamed Salam",
    "د. اسلام سميح محمد عاطف": "Islam Samih Mohamed",
    "د. جمال الدين عبد الحكيم محمد": "Gamal ElDin AbdelHakim",
    "د. جمال حمدان": "Gamal Hamdan",
    "د. حنان حسين حسن فرج": "Hanan Hussein Hassan",
    "د. رزق غبريال بسيط عجبان": "Rizk Ghobrial Basit",
    "د. رضا دسوقي علام": "Reda Desouki Allam",
    "د. زينب محمد إبراهيم بكر": "Zeinab Mohamed Ibrahim",
    "د. شريف محمد صبحي": "Sherif Mohamed Sobhy",
    "د. شيماء أحمد فرغل": "Shaimaa Ahmed Farghal",
    "د. عاطف فتحى حبيب سيدهم": "Atef Fathy Habib",
    "د. عزت عبد الله عبد الحليم": "Ezzat Abdullah AbdelHalim",
    "د. عمرو محمد ابراهيم محمد": "Amr Mohamed Ibrahim",
    "د. ماجدة محمد فرغل": "Magda Mohamed Farghal",
    "د. مبروك إسماعيل": "Mabrouk Ismail",
    "د. مجدي أحمد عبد البر": "Magdy Ahmed AbdelBarr",
    "د. محمد أحمد المرزوقى": "Mohamed Ahmed ElMarzouki",
    "د. محمد أحمد المرزوقي": "Mohamed Ahmed ElMarzouki",
    "د. محمد أحمد محفوظ": "Mohamed Ahmed Mahfouz",
    "د. محمد صلاح الدين محمد": "Mohamed Salah ElDin",
    "د. محمود الزهيري": "Mahmoud ElZohairy",
    "د. محمود عزت عباس عبد الحافظ": "Mahmoud Ezzat Abbas",
    "د. مصطفى مشرفة": "Mostafa Mosharafa",
    "د. مصطفى نصر الدين أحمد": "Mostafa Nasr ElDin",
    "د. مصطفى نصر الدين أحمد أبو العزم": "Mostafa Nasr ElDin",
    "د. وليد محمد ميلاد": "Walid Mohamed Milad",
    "د. يحيى على احمد المرسى": "Yahya Ali Ahmed",
    "م. أحمد ناصر احمد شيبه الحمد": "Ahmed Nasser Ahmed",
    "م. أماني إمام محمد": "Amani Imam Mohamed",
    "م. أماني إمام محمد محمد": "Amani Imam Mohamed",
    "م. إبراهيم خليل": "Ibrahim Khalil",
    "م. امير سلطان": "Amir Sultan",
    "م. بلال محمد": "Belal Mohamed",
    "م. جالا محمد علي": "Gala Mohamed Ali",
    "م. جهاد يحيى زكريا طه": "Gehad Yahya Zakaria",
    "م. حسام محمد سيد": "Hossam Mohamed Sayed",
    "م. حسين البطران": "Hussein ElBatran",
    "م. رحاب ابوالعلا عبدالونيس": "Rehab AbuElEla AbdelWanis",
    "م. ساره ايمن موريس": "Sarah Ayman Maurice",
    "م. سهيله ياسر": "Sohaila Yasser",
    "م. شيماء روبي منصور": "Shaimaa Roby Mansour",
    "م. طارق عصام": "Tarek Essam",
    "م. طاهر أبوزيد السنوسي": "Taher AbuZeid ElSenousi",
    "م. فاطمه اسماعيل سالم": "Fatma Ismail Salem",
    "م.م آية عصام محمد عبد الرحيم": "Aya Essam Mohamed",
    "م.م إيمان رمضان أحمد عبد الله": "Iman Ramadan Ahmed",
    "م.م انجى فرج فهمى": "Engy Farag Fahmy",
    "م.م بسام جمال فاروق": "Bassam Gamal Farouk",
    "م. محمد احمد عفيفي": "Mohamed Ahmed Afifi",
    "م. محمد احمد عفيفي محمد": "Mohamed Ahmed Afifi",
    "م. محمد خالد أمين": "Mohamed Khaled Amin",
    "م. مروة حنفي مرزوق": "Marwa Hanafy Marzouk",
    "م.م علي احمد عبد العزيز": "Ali Ahmed AbdelAziz",
    "م.م فتحى على فتحى شبل": "Fathy Ali Fathy",
    "م.م نهى محمد شحات سليمان": "Noha Mohamed Shahat",
    "م.م هشام صلاح فوزى": "Hisham Salah Fawzy",
    "م. ندى محسن فايق محمد عبد الرازق": "Nada Mohsen Fayek",
    "م. نورها احمد محمد محمد": "Nourhan Ahmed Mohamed",
    "م. نورهان احمد محمد محمد": "Nourhan Ahmed Mohamed",
    "م. هبة أشرف أحمد": "Heba Ashraf Ahmed",
    "م. هدير محمد الدسوقي": "Hadeer Mohamed ElDesouki",
    "م. وحيد عادل يحيي": "Wahid Adel Yahya"
};

async function main() {
    console.log('🔄 Starting name translation...');

    const professors = await prisma.user.findMany({
        where: { role: 'PROFESSOR' }
    });

    console.log(`Found ${professors.length} professors to update.`);

    for (const professor of professors) {
        const arabicName = professor.name;
        const englishName = nameMapping[arabicName];

        if (!englishName) {
            console.warn(`⚠️ No mapping found for: ${arabicName}`);
            continue;
        }

        // Split name to get first and last names
        const parts = englishName.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');

        await prisma.user.update({
            where: { id: professor.id },
            data: {
                name: englishName,
                firstName: firstName,
                lastName: lastName
            }
        });

        console.log(`✅ Updated: ${arabicName} -> ${englishName}`);
    }

    console.log('🎉 Name translation completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during translation:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
