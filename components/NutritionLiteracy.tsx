import React from 'react';
import { BookOpenIcon } from './icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <details className="group rounded-lg bg-gray-50 dark:bg-gray-800 p-4 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
        <span className="text-lg text-gray-800 dark:text-white">{title}</span>
        <span className="transition group-open:rotate-180">
          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" className="text-gray-600 dark:text-gray-300"><path d="M6 9l6 6 6-6"></path></svg>
        </span>
      </summary>
      <div className="mt-4 text-gray-600 dark:text-gray-300 prose prose-sm max-w-none">
        {children}
      </div>
    </details>
  );
};

const NutritionLiteracy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
      <div className="text-center mb-8">
        <BookOpenIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">ความรอบรู้ด้านโภชนาการ</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          เรียนรู้พื้นฐานเกี่ยวกับโภชนาการเพื่อสุขภาพที่ดีและยั่งยืน
        </p>
      </div>
      
      <div className="space-y-4">
        <AccordionItem title="สารอาหารหลัก (Macronutrients)">
          <p>สารอาหารหลักคือสารอาหารที่ร่างกายต้องการในปริมาณมากเพื่อให้พลังงานและสร้างเสริมร่างกาย ประกอบด้วย 3 ประเภทหลัก:</p>
          <ul>
            <li><strong>โปรตีน (Protein):</strong> เป็นส่วนประกอบสำคัญของเซลล์ เนื้อเยื่อ และอวัยวะต่างๆ ช่วยซ่อมแซมส่วนที่สึกหรอและเสริมสร้างกล้ามเนื้อ พบได้ในเนื้อสัตว์ ไข่ นม ถั่ว และเมล็ดพืช (1 กรัม ให้พลังงาน 4 กิโลแคลอรี่)</li>
            <li><strong>คาร์โบไฮเดรต (Carbohydrates):</strong> เป็นแหล่งพลังงานหลักของร่างกาย โดยเฉพาะสมองและระบบประสาท แบ่งเป็นคาร์โบไฮเดรตเชิงเดี่ยว (น้ำตาล) และเชิงซ้อน (แป้ง, ใยอาหาร) พบได้ในข้าว แป้ง ขนมปัง ผัก และผลไม้ (1 กรัม ให้พลังงาน 4 กิโลแคลอรี่)</li>
            <li><strong>ไขมัน (Fat):</strong> เป็นแหล่งพลังงานสำรอง ช่วยในการดูดซึมวิตามินบางชนิด และปกป้องอวัยวะภายใน ควรเลือกบริโภคไขมันดี เช่น ไขมันไม่อิ่มตัวเชิงเดี่ยวและเชิงซ้อน พบได้ในน้ำมันมะกอก อะโวคาโด ถั่ว และปลา (1 กรัม ให้พลังงาน 9 กิโลแคลอรี่)</li>
          </ul>
        </AccordionItem>
        
        <AccordionItem title="สารอาหารรอง (Micronutrients)">
          <p>สารอาหารรองคือวิตามินและแร่ธาตุที่ร่างกายต้องการในปริมาณน้อย แต่มีความสำคัญอย่างยิ่งต่อการทำงานของระบบต่างๆ ในร่างกาย</p>
          <ul>
            <li><strong>วิตามิน (Vitamins):</strong> เป็นสารอินทรีย์ที่ช่วยควบคุมการทำงานของร่างกายให้เป็นปกติ เช่น วิตามิน A ช่วยบำรุงสายตา, วิตามิน C ช่วยเสริมสร้างภูมิคุ้มกัน, วิตามิน D ช่วยในการดูดซึมแคลเซียม</li>
            <li><strong>แร่ธาตุ (Minerals):</strong> เป็นสารอนินทรีย์ที่เป็นส่วนประกอบของเนื้อเยื่อและของเหลวในร่างกาย เช่น แคลเซียมช่วยสร้างกระดูกและฟัน, ธาตุเหล็กเป็นส่วนประกอบของเม็ดเลือดแดง, โซเดียมช่วยควบคุมสมดุลของเหลว</li>
          </ul>
          <p>การรับประทานผักและผลไม้หลากสีจะช่วยให้ร่างกายได้รับวิตามินและแร่ธาตุอย่างครบถ้วน</p>
        </AccordionItem>
        
        <AccordionItem title="วิธีอ่านฉลากโภชนาการ">
          <p>การอ่านฉลากโภชนาการช่วยให้เราตัดสินใจเลือกซื้ออาหารที่ดีต่อสุขภาพได้ โดยมีจุดสำคัญที่ควรดูดังนี้:</p>
          <ol>
            <li><strong>หนึ่งหน่วยบริโภค (Serving Size):</strong> ข้อมูลโภชนาการทั้งหมดบนฉลากจะอ้างอิงตามปริมาณนี้ ควรตรวจสอบว่าเราบริโภคไปกี่หน่วย</li>
            <li><strong>พลังงานทั้งหมด (Calories):</strong> บอกปริมาณพลังงานที่จะได้รับจากการบริโภคหนึ่งหน่วย</li>
            <li><strong>ไขมัน (Fat):</strong> ควรเลือกอาหารที่มีไขมันอิ่มตัว (Saturated Fat) และไขมันทรานส์ (Trans Fat) น้อย</li>
            <li><strong>โซเดียม (Sodium):</strong> ควรจำกัดการบริโภคโซเดียมเพื่อลดความเสี่ยงของโรคความดันโลหิตสูง</li>
            <li><strong>คาร์โบไฮเดรต (Carbohydrate):</strong> ดูปริมาณใยอาหาร (Dietary Fiber) และน้ำตาล (Sugars) ใยอาหารสูงและน้ำตาลต่ำถือเป็นตัวเลือกที่ดี</li>
            <li><strong>โปรตีน (Protein):</strong> เป็นข้อมูลปริมาณโปรตีนต่อหนึ่งหน่วยบริโภค</li>
            <li><strong>ร้อยละของปริมาณที่แนะนำต่อวัน (% Daily Value):</strong> บอกว่าสารอาหารนั้นๆ มีสัดส่วนเท่าใดเมื่อเทียบกับปริมาณที่แนะนำให้บริโภคต่อวัน (โดยทั่วไปอ้างอิงที่ 2,000 กิโลแคลอรี่)</li>
          </ol>
        </AccordionItem>

        <AccordionItem title="ความสำคัญของการดื่มน้ำ">
            <p>น้ำเป็นส่วนประกอบที่สำคัญที่สุดของร่างกาย (ประมาณ 60% ของน้ำหนักตัว) และมีหน้าที่สำคัญหลายอย่าง:</p>
            <ul>
                <li><strong>ควบคุมอุณหภูมิร่างกาย:</strong> ผ่านการขับเหงื่อเพื่อระบายความร้อน</li>
                <li><strong>ขนส่งสารอาหารและออกซิเจน:</strong> น้ำเป็นตัวกลางในการลำเลียงสารต่างๆ ไปยังเซลล์ทั่วร่างกาย</li>
                <li><strong>ช่วยในการย่อยอาหารและการดูดซึม:</strong> น้ำช่วยละลายสารอาหารและป้องกันอาการท้องผูก</li>
                <li><strong>หล่อลื่นข้อต่อ:</strong> ช่วยให้ข้อต่อเคลื่อนไหวได้สะดวก</li>
                <li><strong>ขับของเสียออกจากร่างกาย:</strong> ผ่านทางปัสสาวะและเหงื่อ</li>
            </ul>
            <p>เราควรดื่มน้ำสะอาดอย่างน้อย 8-10 แก้วต่อวัน หรือมากกว่านั้นหากมีการออกกำลังกายหรืออยู่ในสภาพอากาศที่ร้อน</p>
        </AccordionItem>

      </div>
    </div>
  );
};

export default NutritionLiteracy;