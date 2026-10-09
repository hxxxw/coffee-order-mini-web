/* ===========================================================
 *本地模拟数据（Demo 专用）
 * 商品图片使用内联 SVG 占位，避免任何外部网络依赖。
 * =========================================================== */

/** 生成商品图占位（内联 SVG data URI） */
function productArt(seed, kind) {
  // 美式复古色板：焦糖、砖红、橄榄、奶油、暖棕、陶土（全暖调，与主题统一）
  const palettes = [
    ['#f6e3c4', '#c98a3e', '#8a5a22'],
    ['#f2e0d2', '#b8552f', '#7c2f1a'],
    ['#ece8d4', '#7a8a4c', '#4d5a2e'],
    ['#f3e0ce', '#c06a3c', '#83431f'],
    ['#f0e4d0', '#8a6a4a', '#5a4230'],
    ['#f0d8c4', '#a25c3c', '#6b3820'],
  ];
  const p = palettes[seed % palettes.length];
  const cup = kind === 'food'
    ? `<path d="M56 118h108l-11 44a10 10 0 0 1-9.7 7.6H76.7A10 10 0 0 1 67 162z" fill="${p[1]}"/>
       <path d="M62 118h96l-3.5 14h-89z" fill="#ffffff" opacity=".45"/>
       <circle cx="110" cy="140" r="9" fill="${p[2]}" opacity=".5"/>`
    : kind === 'ice'
      ? `<path d="M78 84h64l-7 88a8 8 0 0 1-8 7.4H93a8 8 0 0 1-8-7.4z" fill="${p[0]}" opacity=".9"/>
         <path d="M81 104h58l-5.6 68a8 8 0 0 1-8 7.4H94.6a8 8 0 0 1-8-7.4z" fill="${p[1]}"/>
         <path d="M88 116h44l-4 56H92z" fill="#fff" opacity=".22"/>
         <rect x="92" y="70" width="36" height="9" rx="4" fill="${p[2]}" opacity=".75"/>`
      : `<path d="M70 78h80v58a26 26 0 0 1-26 26H96a26 26 0 0 1-26-26z" fill="#fdfbf7"/>
         <path d="M70 92h80v44a26 26 0 0 1-26 26H96a26 26 0 0 1-26-26z" fill="${p[1]}"/>
         <path d="M152 96h10a16 16 0 0 1 0 32h-8" stroke="#fdfbf7" stroke-width="7" fill="none"/>
         <path d="M76 98h68v10H76z" fill="${p[2]}" opacity=".28"/>
         <ellipse cx="110" cy="94" rx="35" ry="6" fill="${p[2]}" opacity=".35"/>
         <circle cx="100" cy="128" r="7" fill="#fff" opacity=".26"/>
         <circle cx="122" cy="140" r="5" fill="#fff" opacity=".2"/>`;

  const steam = kind === 'ice' ? '' :
    `<path d="M96 62c0-9 9-11 9-20M118 58c0-9 9-11 9-20M108 70c0-7 7-9 7-16"
       stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".55"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200">
    <defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="#ffffff"/>
    </linearGradient></defs>
    <rect width="220" height="200" fill="url(#g${seed})"/>
    <circle cx="176" cy="34" r="40" fill="#fff" opacity=".26"/>
    <circle cx="30" cy="168" r="30" fill="${p[1]}" opacity=".12"/>
    ${steam}${cup}
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ---------- 规格可选项 ---------- */
const SPEC = {
  sizes: [
    { id: 'm', name: '中杯', desc: '355ml', extra: 0 },
    { id: 'l', name: '大杯', desc: '473ml', extra: 3 },
    { id: 'xl', name: '超大杯', desc: '591ml', extra: 5 },
  ],
  temps: [
    { id: 'hot', name: '热' },
    { id: 'warm', name: '温' },
    { id: 'less-ice', name: '少冰' },
    { id: 'ice', name: '正常冰' },
    { id: 'no-ice', name: '去冰' },
  ],
  extras: [
    { id: 'oat', name: '燕麦奶', extra: 5 },
    { id: 'shot', name: '加一份浓缩', extra: 6 },
    { id: 'cream', name: '香草奶油', extra: 6 },
    { id: 'cheese', name: '芝士奶盖', extra: 8 },
    { id: 'sugar', name: '少糖', extra: 0 },
    { id: 'ice-less', name: '冰块减半', extra: 0 },
  ],
};

/* ---------- 首页轮播 ---------- */
/* ---------- 首页轮播（照片背景，本地资源 assets/img） ---------- */
const BANNERS = [
  { id: 'b1', img: 'assets/img/banner-1.png', tag: 'THE DAILY COFFEE CLUB',
    title: '好咖啡，慢一点。', sub: '一杯焦糖香，一点旧时光。',
    cta: '招牌燕麦拿铁 · ¥28', cat: 'latte' },
  { id: 'b2', img: 'assets/img/banner-2.png', tag: 'MORNING SPECIAL',
    title: '清晨，从一杯开始。', sub: '现磨浓缩 · 坚果醇香 · 回甘悠长',
    cta: '招牌美式 · ¥22', cat: 'coffee' },
  { id: 'b3', img: 'assets/img/banner-3.png', tag: 'AFTERNOON TIME',
    title: '午后两点，甜点正好。', sub: '咖啡配甜点 · 工作日 14:00 后享用',
    cta: '看看烘焙甜点', cat: 'bakery' },
];

/* ---------- 商品数据 ---------- */
const PRODUCTS = [
  { id: 'p01', cat: 'coffee', name: '野火招牌美式', en: 'Signature Americano',
    desc: '双份 Espresso 萃取，酸甜平衡，回甘清亮', price: 22, orig: 26, kind: 'hot',
    rate: 4.8, sales: 3280, tags: ['人气 Top 1', '0 糖'], badge: '招牌' },
  { id: 'p02', cat: 'coffee', name: '手冲耶加雪菲', en: 'Yirgacheffe Pour Over',
    desc: '浅中焙，柑橘与花香尾韵，适合慢饮', price: 38, kind: 'hot',
    rate: 4.9, sales: 860, tags: ['单品豆', '手冲'] },
  { id: 'p03', cat: 'coffee', name: '西西里柑橘美式', en: 'Sicilian Citrus',
    desc: '鲜榨西西里柠檬，清爽解腻', price: 28, orig: 32, kind: 'ice',
    rate: 4.7, sales: 1920, tags: ['清爽', '维 C'] },
  { id: 'p04', cat: 'latte', name: '招牌燕麦拿铁', en: 'Signature Oat Latte',
    desc: '燕麦奶基底，桂花糖浆点缀，奶香柔和', price: 28, orig: 33, kind: 'hot',
    rate: 4.9, sales: 5640, tags: ['人气 Top 1', '0 奶精'], badge: '人气招牌' },
  { id: 'p05', cat: 'latte', name: '厚乳可可拿铁', en: 'Cacao Thick Latte',
    desc: '双层厚乳 + 可可碎，浓醇不腻', price: 30, kind: 'ice',
    rate: 4.8, sales: 2410, tags: ['浓郁'] },
  { id: 'p06', cat: 'latte', name: '焦糖玛奇朵', en: 'Caramel Macchiato',
    desc: '香草奶盖 + 焦糖淋酱，肉桂点缀', price: 32, orig: 36, kind: 'hot',
    rate: 4.6, sales: 1180, tags: ['经典'] },
  { id: 'p07', cat: 'tea', name: '茉莉云雾茶', en: 'Jasmine Tea',
    desc: '三窨茉莉花茶，清冽回甘', price: 19, kind: 'ice',
    rate: 4.5, sales: 760, tags: ['无咖啡因'] },
  { id: 'p08', cat: 'tea', name: '芝士茉莉鲜果茶', en: 'Cheese Jasmine',
    desc: '茉莉绿茶 + 芝士奶盖 + 柠檬片', price: 26, kind: 'ice',
    rate: 4.7, sales: 1430, tags: ['清爽'] },
  { id: 'p09', cat: 'tea', name: '蜜桃乌龙冷萃', en: 'Peach Oolong Cold Brew',
    desc: '12 小时冷萃，蜜桃果香', price: 29, kind: 'ice',
    rate: 4.6, sales: 980, tags: ['冷萃'] },
  { id: 'p10', cat: 'bakery', name: '海盐可颂', en: 'Sea Salt Croissant',
    desc: '法国进口黄油，26 层酥皮现烤', price: 16, kind: 'food',
    rate: 4.9, sales: 4210, tags: ['现烤', '酥脆'] },
  { id: 'p11', cat: 'bakery', name: '巴斯克芝士蛋糕', en: 'Basque Cheesecake',
    desc: '焦香表皮，内里流心柔滑', price: 28, kind: 'food',
    rate: 4.8, sales: 1690, tags: ['甜品'] },
  { id: 'p12', cat: 'bakery', name: '肉桂卷', en: 'Cinnamon Roll',
    desc: '肉桂糖霜，酸奶油顶', price: 18, kind: 'food',
    rate: 4.7, sales: 890, tags: ['现烤'] },
  { id: 'p13', cat: 'meal', name: '鸡胸牛油果沙拉', en: 'Chicken Avocado Bowl',
    desc: '高蛋白低脂，酱汁分装', price: 36, kind: 'food',
    rate: 4.6, sales: 620, tags: ['轻食', '高蛋白'] },
  { id: 'p14', cat: 'meal', name: '火腿芝士可颂堡', en: 'Ham Cheese Burger',
    desc: '现烤可颂胚，芝士融化', price: 32, kind: 'food',
    rate: 4.5, sales: 540, tags: ['饱腹'] },
];

/* ---------- 分类 ---------- */
const CATEGORIES = [
  { id: 'coffee', name: '咖啡' },
  { id: 'latte', name: '拿铁' },
  { id: 'tea', name: '茶饮' },
  { id: 'bakery', name: '烘焙' },
  { id: 'meal', name: '轻食' },
];

/* ---------- 点单页左侧分类（首个为跨分类虚拟分组「人气推荐」） ---------- */
const MENU_CATS = [
  { id: 'hot', name: '人气推荐', en: 'THE DINER CLASSICS', tag: '店员精选' },
  { id: 'coffee', name: '经典咖啡', en: 'CLASSIC COFFEE' },
  { id: 'latte', name: '特调拿铁', en: 'SIGNATURE LATTE' },
  { id: 'tea', name: '鲜萃茶饮', en: 'FRESH TEA' },
  { id: 'bakery', name: '甜点烘焙', en: 'FRESH BAKERY' },
  { id: 'meal', name: '轻食小食', en: 'LIGHT BITES' },
];

/* ---------- 优惠券 ---------- */
const COUPONS = [
  { id: 'c1', name: '新客立减券', amt: 6,  min: 30,  desc: '满 30 元可用' },
  { id: 'c2', name: '会员专享券', amt: 12, min: 60,  desc: '满 60 元可用' },
  { id: 'c3', name: '午后甜品券', amt: 3,  min: 25,  desc: '满 25 元可用 · 甜品专属' },
  { id: 'c4', name: '储值回馈券', amt: 5,  min: 0,   desc: '无门槛 · 储值支付专属' },
];

/* ---------- 用户信息 ---------- */
const USER = {
  name: '林知夏',
  level: '金卡会员',
  phone: '138****6688',
  points: 1286,
  coupons: 4,
  balance: 32.5,
  avatarSeed: 7,
};