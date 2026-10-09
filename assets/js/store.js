/* ===========================================================
 * 全局状态：购物车 / 订单 / 路由栈
 * 所有页面共享同一份数据，任意改动都会广播刷新。
 * =========================================================== */
const Store = (() => {

  /** 购物车项唯一 key：商品 + 规格组合 */
  const cartKey = (p, sel) =>
    [p.id, sel.size, sel.temp, [...sel.extras].sort().join('+')].join('|');

  const state = {
    cart: [],          // [{ key, id, name, img, size, temp, extras:[], qty, unitPrice }]
    orders: [],        // 历史订单（倒序，最新在前）
    currentOrder: null,// 当前订单详情
    page: 'home',
    pageStack: [],     // push 页返回栈
    checkout: { note: '' },
  };

  const listeners = new Set();
  const on = fn => listeners.add(fn);
  const emit = (reason) => listeners.forEach(fn => fn(reason));

  /* ---------- 金额计算 ---------- */
  const yuan = n => '¥' + n.toFixed(2).replace(/\.00$/, '');
  const yuanFull = n => '¥' + n.toFixed(2);

  function itemTotal(item) { return item.unitPrice * item.qty; }
  function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }
  function cartTotal() { return state.cart.reduce((s, i) => s + itemTotal(i), 0); }

  /** 温度 id → 中文名（购物车里存的是 id，展示时需要还原成文案） */
  const tempName = id => {
    const t = SPEC.temps.find(x => x.id === id);
    return t ? t.name : id;
  };

  /** 规格文案，例如：大杯 / 少冰 / 燕麦奶、加一份浓缩 */
  function specText(sel) {
    const parts = [];
    if (sel.size) parts.push(sel.size);
    // 温度传入的是 id，必须转成中文名，否则购物车会显示 ice / less-ice
    if (sel.temp) parts.push(tempName(sel.temp));
    if (sel.extras && sel.extras.length) parts.push(sel.extras.join('、'));
    return parts.join(' / ');
  }

  /* ---------- 商品查找 ---------- */
  const getProduct = id => PRODUCTS.find(p => p.id === id);

  /** 实拍商品图覆盖表：命中走本地图片，未命中回退到内联 SVG 占位 */
  const PRODUCT_IMG = {
    p01: 'assets/img/prod-p01.png',  // 野火招牌美式（冰美式实拍）
    p04: 'assets/img/prod-p04.png',  // 招牌燕麦拿铁（已裁掉原图角标）
    p06: 'assets/img/prod-p06.png',  // 焦糖玛奇朵
    p11: 'assets/img/prod-p11.png',  // 巴斯克芝士蛋糕
  };

  const getImage = id => {
    if (PRODUCT_IMG[id]) return PRODUCT_IMG[id];
    const p = getProduct(id);
    if (!p) return '';
    const seed = PRODUCTS.indexOf(p);
    return productArt(seed + 1, p.kind);
  };

  /* ---------- 购物车操作 ---------- */
  function addToCart(productId, sel) {
    const p = getProduct(productId);
    if (!p) return null;
    // 加料费用计入单价
    let unit = p.price;
    unit += (SPEC.sizes.find(s => s.id === sel.size) || {}).extra || 0;
    (sel.extras || []).forEach(name => {
      const e = SPEC.extras.find(x => x.name === name);
      unit += e ? e.extra : 0;
    });

    const key = cartKey(p, sel);
    const exist = state.cart.find(i => i.key === key);
    if (exist) {
      exist.qty += sel.qty;
    } else {
      state.cart.push({
        key,
        id: p.id,
        name: p.name,
        img: getImage(p.id),
        size: (SPEC.sizes.find(s => s.id === sel.size) || {}).name || '',
        temp: sel.temp,
        extras: [...sel.extras],
        qty: sel.qty,
        unitPrice: unit,
      });
    }
    emit('cart:add');
    return cartKey;
  }

  function setQty(key, qty) {
    const item = state.cart.find(i => i.key === key);
    if (!item) return;
    item.qty = qty;
    if (item.qty <= 0) removeItem(key);
    else emit('cart:qty');
  }

  function removeItem(key) {
    state.cart = state.cart.filter(i => i.key !== key);
    emit('cart:remove');
  }

  function clearCart() {
    state.cart = [];
    emit('cart:clear');
  }

  /** 各商品在购物车中的总件数（用于卡片角标） */
  function countOf(productId) {
    return state.cart.filter(i => i.id === productId).reduce((s, i) => s + i.qty, 0);
  }

  /* ---------- 优惠券 ---------- */
  const PACK_FEE = 2;      // 每单打包费

  /* ---------- 订单 ---------- */
  function createOrder({ discount = 0, payMethod = 'wechat' } = {}) {
    const sub = cartTotal();
    const total = Math.max(0, sub - discount + PACK_FEE);
    const now = new Date();
    const pickupNo = 'A' + String(Math.floor(100 + Math.random() * 900));
    const order = {
      id: 'YY' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') +
           String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') +
           String(now.getMinutes()).padStart(2, '0') + Math.floor(Math.random() * 90 + 10),
      pickupNo,
      shop: '野火咖啡',
      type: '到店自取',
      items: state.cart.map(i => ({
        name: i.name, img: i.img,
        spec: specText(i), qty: i.qty, amount: itemTotal(i),
      })),
      subtotal: sub, discount, packFee: PACK_FEE, total,
      status: 'paid',            // Demo：直接模拟支付成功
      payMethod: payMethod === 'balance' ? '储值支付' : '微信支付',
      note: state.checkout.note,
      createdAt: now,
      timeline: [
        { title: '订单已提交', time: fmtTime(now), done: true },
        { title: '支付成功（模拟）', time: fmtTime(new Date(now.getTime() + 8000)), done: true },
        { title: '门店已接单，开始制作', time: fmtTime(new Date(now.getTime() + 26000)), done: true },
        { title: '饮品制作完成，请凭取餐号取餐', time: '', done: false },
      ],
    };
    state.orders.unshift(order);
    state.currentOrder = order;
    state.cart = [];
    state.checkout = { note: '' };
    emit('order:create');
    return order;
  }

  function fmtTime(d) {
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /** 生成历史订单（首次进入订单页/历史订单页时填充示例数据） */
  function seedHistory() {
    if (state.orders.length > 1) return;

    // 用真实商品构造单条历史订单（含图、规格、金额、状态、支付方式）
    const p = id => getProduct(id);
    const mk = (cfg) => {
      const t = new Date(Date.now() - cfg.minsAgo * 60000);
      const items = cfg.items.map(({ id, size, temp, extras, qty }) => {
        const prod = p(id);
        let unit = prod.price;
        unit += (SPEC.sizes.find(s => s.id === size) || {}).extra || 0;
        (extras || []).forEach(name => {
          const e = SPEC.extras.find(x => x.name === name);
          unit += e ? e.extra : 0;
        });
        const amount = unit * qty;
        return {
          name: prod.name,
          img: getImage(id),
          spec: specText({ size: size ? (SPEC.sizes.find(s => s.id === size) || {}).name : '', temp, extras }),
          qty, amount,
        };
      });
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const discount = cfg.discount || 0;
      const total = Math.max(0, subtotal - discount + (cfg.packFee || 0));
      return {
        id: 'YY' + t.getFullYear() + String(t.getMonth() + 1).padStart(2, '0') +
            String(t.getDate()).padStart(2, '0') + String(t.getHours()).padStart(2, '0') +
            String(t.getMinutes()).padStart(2, '0') + String(Math.floor(Math.random() * 90 + 10)),
        pickupNo: (cfg.prefix || 'B') + String(Math.floor(100 + Math.random() * 900)),
        shop: '野火咖啡',
        type: '到店自取',
        items,
        subtotal, discount, packFee: cfg.packFee || 0, total,
        status: cfg.status || 'done',
        payMethod: cfg.payMethod || '微信支付',
        note: cfg.note || '',
        createdAt: t,
        timeline: [],
      };
    };

    // 多组真实历史订单（时间由近到远）
    state.orders.push(
      mk({ minsAgo: 150, status: 'paid', payMethod: '微信支付', discount: 6, packFee: 2,
        items: [
          { id: 'p04', size: 'l', temp: 'hot', extras: ['燕麦奶'], qty: 1 },
          { id: 'p10', size: '', temp: '', extras: [], qty: 2 },
        ] }),
      mk({ minsAgo: 60 * 26, status: 'done', payMethod: '储值支付', discount: 0, packFee: 2,
        items: [
          { id: 'p01', size: 'm', temp: 'ice', extras: [], qty: 1 },
        ] }),
      mk({ minsAgo: 60 * 50, status: 'done', payMethod: '微信支付', discount: 12, packFee: 2,
        items: [
          { id: 'p04', size: 'xl', temp: 'hot', extras: ['香草奶油'], qty: 1 },
          { id: 'p11', size: '', temp: '', extras: [], qty: 1 },
        ] }),
      mk({ minsAgo: 60 * 74, status: 'done', payMethod: '储值支付', discount: 0, packFee: 0, note: '少冰，谢谢',
        items: [
          { id: 'p03', size: 'm', temp: 'ice', extras: [], qty: 1 },
          { id: 'p13', size: '', temp: '', extras: [], qty: 1 },
        ] }),
      mk({ minsAgo: 60 * 100, status: 'done', payMethod: '微信支付', discount: 6, packFee: 2,
        items: [
          { id: 'p02', size: 'm', temp: 'hot', extras: [], qty: 1 },
          { id: 'p12', size: '', temp: '', extras: [], qty: 2 },
        ] }),
      mk({ minsAgo: 60 * 170, status: 'done', payMethod: '储值支付', discount: 0, packFee: 2,
        items: [
          { id: 'p05', size: 'l', temp: 'ice', extras: ['芝士奶盖'], qty: 1 },
        ] }),
      mk({ minsAgo: 60 * 200, status: 'done', payMethod: '微信支付', discount: 12, packFee: 2,
        items: [
          { id: 'p06', size: 'm', temp: 'hot', extras: [], qty: 1 },
          { id: 'p14', size: '', temp: '', extras: [], qty: 1 },
          { id: 'p07', size: 'm', temp: 'ice', extras: [], qty: 1 },
        ] }),
    );
  }

  /* ---------- 路由 ---------- */
  function go(page, { push = false } = {}) {
    if (state.page === page && !push) return;
    state.page = page;
    emit(push ? 'route:push' : 'route:tab');
  }
  function back() {
    const prev = state.pageStack.pop();
    state.page = prev || 'menu';
    emit('route:back');
  }
  function push(page) {
    state.pageStack.push(state.page);
    go(page, { push: true });
  }

  return {
    state, on, emit,
    yuan, yuanFull, specText, tempName, getProduct, getImage, itemTotal,
    cartKey, addToCart, setQty, removeItem, clearCart, countOf,
    cartCount, cartTotal, PACK_FEE,
    createOrder, seedHistory, fmtTime,
    go, back, push,
  };
})();