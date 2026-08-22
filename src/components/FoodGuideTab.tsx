import React, { useState } from 'react';
import { 
  Apple, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Droplet, 
  Sparkles,
  Info
} from 'lucide-react';
import { UserProfile } from '../types';
import { getTranslations } from '../utils/i18n';

interface FoodGuideTabProps {
  user: UserProfile;
}

interface FoodItem {
  id: string;
  name: string;
  category: string;
  safety: 'safe' | 'caution' | 'avoid';
  rationale: string;
  safePreparationTip?: string;
}

const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Pasteurized Dairy & Hard Cheeses (Cheddar, Parmesan, Paneer)',
    category: 'Dairy',
    safety: 'safe',
    rationale: 'Excellent source of calcium, protein, and vitamin B12 for fetal skeletal development.',
    safePreparationTip: 'Ensure milk/paneer is pasteurized and freshly cooked.',
  },
  {
    id: 'f2',
    name: 'Cooked Lentils, Chickpeas & Beans',
    category: 'Legumes & Plant Proteins',
    safety: 'safe',
    rationale: 'Rich in dietary folate, iron, magnesium, and dietary fiber that prevents constipation.',
    safePreparationTip: 'Soak well and cook thoroughly with cumin or ginger to ease digestion.',
  },
  {
    id: 'f3',
    name: 'Ripe Yellow Papaya',
    category: 'Fruits',
    safety: 'safe',
    rationale: 'Fully ripe yellow papaya is rich in vitamin C, potassium, and carotenoids and is completely safe.',
    safePreparationTip: 'Avoid UNRIPE (green) papaya as it contains latex that can trigger uterine spasms.',
  },
  {
    id: 'f4',
    name: 'Unpasteurized / Raw Milk & Soft Mold-ripened Cheeses (Brie, Camembert, Roquefort)',
    category: 'Dairy',
    safety: 'avoid',
    rationale: 'High risk of Listeria monocytogenes bacteria, which can cross the placenta and cause fetal complications.',
  },
  {
    id: 'f5',
    name: 'Caffeine & Coffee / Tea',
    category: 'Beverages',
    safety: 'caution',
    rationale: 'Safe in moderation. Limit caffeine intake to less than 200 mg/day (approx. 1-2 small cups of filtered coffee).',
    safePreparationTip: 'Prefer decaffeinated tea, rooibos, or fresh mint infusions.',
  },
  {
    id: 'f6',
    name: 'High-Mercury Fish (Shark, Swordfish, King Mackerel, Bigeye Tuna)',
    category: 'Seafood',
    safety: 'avoid',
    rationale: 'Heavy metals accumulate in the fetal nervous system and can impair brain development.',
    safePreparationTip: 'Opt for low-mercury options like thoroughly cooked salmon, tilapia, or shrimp (up to 2 servings weekly).',
  },
  {
    id: 'f7',
    name: 'Chia Seeds, Flaxseeds & Walnuts',
    category: 'Nuts & Seeds',
    safety: 'safe',
    rationale: 'Plant-based Omega-3 ALA supports baby’s cognitive and retinal development.',
  },
  {
    id: 'f8',
    name: 'Raw or Undercooked Eggs / Homemade Mayonnaise',
    category: 'Proteins',
    safety: 'avoid',
    rationale: 'Risk of Salmonella poisoning which can cause severe dehydration and maternal fever.',
    safePreparationTip: 'Only eat eggs with both yolk and white cooked solid firm.',
  },
];

export const FoodGuideTab: React.FC<FoodGuideTabProps> = ({ user }) => {
  const t = getTranslations(user.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSafety, setFilterSafety] = useState<'all' | 'safe' | 'caution' | 'avoid'>('all');
  const [waterGlasses, setWaterGlasses] = useState(6);

  const filteredFoods = FOOD_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.rationale.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSafety = filterSafety === 'all' || item.safety === filterSafety;
    return matchesSearch && matchesSafety;
  });

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAD7D2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9F4F52] tracking-wider uppercase">
            <Apple className="w-4 h-4" />
            <span>Maternal Nutrition & Safety</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2E2020] font-bold mt-1">
            {t.foodGuide}
          </h1>
          <p className="text-sm text-[#735E61] mt-1">
            Evidence-based guide on safe foods, caution items, and daily hydration goals.
          </p>
        </div>

        {/* Quick Hydration Tracker */}
        <div className="p-4 rounded-2xl bg-[#F0F7FA] border border-[#D0E5F0] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E0F0FA] text-[#1E74A6] flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1E74A6]">Hydration: {waterGlasses} / 10 glasses</div>
            <div className="flex gap-1 mt-1">
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setWaterGlasses(i + 1)}
                  className={`w-3.5 h-4 rounded-xs transition-colors cursor-pointer ${
                    i < waterGlasses ? 'bg-[#2990C8]' : 'bg-[#D0E3F0]'
                  }`}
                  title={`${i + 1} glasses`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#EAD7D2] shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8A7174] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search foods, dairy, fruits, caffeine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#DDC6C0] focus:outline-none focus:ring-2 focus:ring-[#9F4F52]/30 bg-[#FFFDFC]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'safe', label: 'Safe & Nourishing' },
            { id: 'caution', label: 'Limit / Caution' },
            { id: 'avoid', label: 'Avoid' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterSafety(btn.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterSafety === btn.id
                  ? 'bg-[#9F4F52] text-white'
                  : 'bg-[#FAF5F2] text-[#635052] hover:bg-[#F2E5DF]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFoods.map((item) => {
          const isSafe = item.safety === 'safe';
          const isCaution = item.safety === 'caution';
          const isAvoid = item.safety === 'avoid';

          return (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border bg-white space-y-3 shadow-2xs transition-all ${
                isSafe
                  ? 'border-[#D5EADB] hover:border-[#3E8E5A]'
                  : isCaution
                  ? 'border-[#F8E3C3] hover:border-[#D68A1B]'
                  : 'border-[#FAD0D4] hover:border-[#D63847]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A7174]">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#2E2020]">
                    {item.name}
                  </h3>
                </div>

                <div className="flex-shrink-0">
                  {isSafe && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDF7F1] text-[#2D7344]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Safe</span>
                    </span>
                  )}
                  {isCaution && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#FEF8EC] text-[#A66D1B]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Caution</span>
                    </span>
                  )}
                  {isAvoid && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#FCECEC] text-[#B83E48]">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Avoid</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#523F42] leading-relaxed">
                {item.rationale}
              </p>

              {item.safePreparationTip && (
                <div className="p-3 rounded-2xl bg-[#FAF6F3] border border-[#EADBCE] text-[11px] text-[#6B5558] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#9F4F52] flex-shrink-0 mt-0.5" />
                  <span><strong>Tip:</strong> {item.safePreparationTip}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
