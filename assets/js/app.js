/* ===========================================================
 * 主控制器：页面渲染、路由、弹层、购物车联动
 * =========================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const device = $('#device');
  const I = Icons.svg;
  // 从 Store 解构出商品图helper，避免跨模块裸调用（否则首屏渲染直接 ReferenceError）
  const { getImage } = Store;

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add('is-open'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-open');
      setTimeout(() => (toastEl.hidden = true), 300);
    }, 1800);
  }

  /* =========================================================
   * 1. 首页
   * ======================================================= */
  let bannerIdx = 0, bannerTimer;

  function renderHome() {
    // 轮播：照片背景 + 文案叠加（图在 assets/img，本地资源无网络依赖）
    $('#banner').innerHTML = `
      <div class="banner__track" id="banner-track">
        ${BANNERS.map(b => `
          <div class="banner__slide" data-cat="${b.cat}">
            <img class="banner__img" src="${b.img}" alt="${b.title}">
            <div class="banner__shade"></div>
            <span class="banner__label">${b.tag}</span>
            <h3 class="banner__title">${b.title}</h3>
            <p class="banner__sub">${b.sub}</p>
            <span class="banner__cta">${b.cta}${I('arrow', 12, { weight: 2.2 })}</span>
          </div>`).join('')}
      </div>
      <div class="banner__dots">
        ${BANNERS.map((_, i) => `<span class="banner__dot${i === 0 ? ' is-active' : ''}"></span>`).join('')}
      </div>`;

    // 招牌：销量前 4（沿用现有 productArt 商品图，未做任何替换）
    const hot = [...PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 4);
    $('#home-goods').innerHTML = hot.map(card).join('');

    startBanner();
  }

  const card = p => `
    <div class="goods-card" data-open="${p.id}">
      <div class="goods-card__media">
        <img src="${getImage(p.id)}" alt="${p.name}" />
        ${p.badge ? `<span class="goods-card__badge">${p.badge}</span>` : ''}
        <span class="goods-card__count" data-count="${p.id}" hidden>0</span>
      </div>
      <div class="goods-card__body">
        <h3 class="goods-card__name">${p.name}</h3>
        <div class="goods-card__rate">
          <span style="color:#c98a3e;display:flex">${I('star', 11, { fill: 'fill' })}</span>
          ${p.rate} · 月售${p.sales >= 1000 ? (p.sales / 1000).toFixed(1) + 'k' : p.sales}
        </div>
        <div class="goods-card__price">
          <div><span class="goods-card__amount"><small>¥</small>${p.price}</span>${
            p.orig ? `<span class="goods-card__orig">¥${p.orig}</span>` : ''}</div>
          <span class="goods-card__plus">${I('plus', 13, { weight: 2.2 })}</span>
        </div>
      </div>
    </div>`;

  function startBanner() {
    const track = $('#banner-track');
    if (!track) return;
    clearInterval(bannerTimer);
    bannerTimer = setInterval(() => {
      bannerIdx = (bannerIdx + 1) % BANNERS.length;
      track.style.transform = `translateX(-${bannerIdx * 100}%)`;
      $$('#banner .banner__dot').forEach((d, i) => d.classList.toggle('is-active', i === bannerIdx));
    }, 3600);
  }

  /* =========================================================
   * 2. 点单页：左右分栏 + 联动
   * ======================================================= */
  let activeCat = 'hot';

  function renderMenu() {
    // 左侧分类（顶部「人气推荐」为跨分类虚拟分组）+ 栏底装饰
    $('#cat-rail').innerHTML = MENU_CATS.map(c => `
      <button class="cat-item${c.id === activeCat ? ' is-active' : ''}" data-cat="${c.id}">
        ${c.name}
      </button>`).join('') + `
      <div class="cat-rail__deco" aria-hidden="true">
        <span class="cat-rail__spark">✦</span>
        <span class="cat-rail__motto">GOOD FOOD<br>GOOD MOOD</span>
      </div>`;

    // 右侧商品：人气推荐（销量前 6，跨分类）+ 各分类分组
    const hotItems = [...PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 6);
    $('#menu-groups').innerHTML = MENU_CATS.map(c => {
      const items = c.id === 'hot' ? hotItems : PRODUCTS.filter(p => p.cat === c.id);
      if (!items.length) return '';
      return `<section class="cat-group" data-group="${c.id}">
        <div class="cat-group__head">
          <div class="cat-group__titles">
            <h3 class="cat-group__title">${c.name}</h3>
            <span class="cat-group__en">${c.en}</span>
          </div>
          ${c.tag
            ? `<span class="cat-group__tag">${c.tag}</span>`
            : `<span class="cat-group__count">${items.length} 款</span>`}
        </div>
        ${items.map(row).join('')}
      </section>`;
    }).join('');
  }

  const row = p => {
    const isFood = p.kind === 'food';
    return `
    <div class="goods-row" data-open="${p.id}">
      <span class="goods-row__media"><img src="${getImage(p.id)}" alt="${p.name}" /></span>
      <span class="goods-row__body">
        <span class="goods-row__name">${p.name}</span>
        <span class="goods-row__en">${p.en}</span>
        <span class="goods-row__desc">${p.desc}</span>
        <span class="goods-row__foot">
          <span class="goods-row__price-box">
            <span class="goods-row__amount"><small>¥</small>${p.price}</span>
            <span class="goods-row__picked" data-picked="${p.id}" hidden>已选 0 份</span>
          </span>
          ${isFood
            ? `<button class="goods-row__add" data-quick="${p.id}" aria-label="加入购物车">${I('plus', 14, { weight: 2.2 })}</button>`
            : `<button class="goods-row__spec-btn" data-spec="${p.id}">选规格</button>`}
        </span>
      </span>
    </div>`;
  };

  /** 点击左侧分类 → 右侧滚动到对应分组并高亮 */
  function scrollToCat(catId) {
    const scroller = $('#menu-scroll');
    const target = $(`[data-group="${catId}"]`);
    if (!target || !scroller) return;
    scroller.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
    setActiveCat(catId);
  }

  function setActiveCat(catId) {
    activeCat = catId;
    $$('.cat-item').forEach(b => b.classList.toggle('is-active', b.dataset.cat === catId));
  }

  /** 右侧滚动 → 反向高亮左侧分类 */
  function bindScrollSpy() {
    const scroller = $('#menu-scroll');
    scroller.addEventListener('scroll', () => {
      const top = scroller.scrollTop + 40;
      let cur = MENU_CATS[0].id;
      for (const c of MENU_CATS) {
        const el = $(`[data-group="${c.id}"]`);
        if (el && el.offsetTop <= top) cur = c.id;
      }
      if (cur !== activeCat) setActiveCat(cur);
    }, { passive: true });
  }

  /* =========================================================
   * 3. 规格选择弹层
   * ======================================================= */
  const mask = $('#mask');
  const specSheet = $('#spec-sheet');
  const cartSheet = $('#cart-sheet');
  const couponSheet = $('#coupon-sheet');
  let specCtx = null;   // { id, size, temp, extras:[], qty }

  function unitPriceOf(p, sel) {
    let u = p.price;
    u += (SPEC.sizes.find(s => s.id === sel.size) || {}).extra || 0;
    sel.extras.forEach(n => {
      const e = SPEC.extras.find(x => x.name === n);
      u += e ? e.extra : 0;
    });
    return u;
  }

  function openSpec(productId) {
    const p = PRODUCTS.find(x => x.id === productId);
    if (!p) return;

    // 按商品类型给出默认温度：热饮默认热饮，冰饮默认正常冰
    const isIce = p.kind === 'ice' || p.kind === 'food';
    specCtx = {
      id: p.id,
      size: 'm',
      temp: p.kind === 'hot' ? 'hot' : 'ice',
      extras: [],
      qty: 1,
      isIce,
    };

    $('#spec-img').innerHTML = `<img src="${getImage(p.id)}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`;
    $('#spec-name').textContent = p.name;
    $('#spec-desc').textContent = p.desc;
    $('#spec-price').textContent = `¥${p.price}`;

    // 杯型
    $('#spec-sizes').innerHTML = SPEC.sizes.map(s => `
      <button class="spec-opt${s.id === 'm' ? ' is-active' : ''}" data-size="${s.id}">
        ${s.name}<small>${s.extra ? '+' + s.extra : ''}</small>
      </button>`).join('');

    // 温度：热饮不显示冰，食物不显示温度
    const tempGroup = $('[data-group="temp"]');
    if (p.kind === 'food') {
      tempGroup.hidden = true;
    } else {
      tempGroup.hidden = false;
      const temps = isIce ? SPEC.temps.filter(t => t.id !== 'hot' && t.id !== 'warm')
                          : SPEC.temps.filter(t => t.id === 'hot' || t.id === 'warm');
      $('#spec-temps').innerHTML = temps.map(t =>
        `<button class="spec-opt${t.id === specCtx.temp ? ' is-active' : ''}" data-temp="${t.id}">${t.name}</button>`
      ).join('');
    }

    // 加料
    $('#spec-extras').innerHTML = SPEC.extras.map(e => `
      <button class="spec-opt" data-extra="${e.name}">
        ${e.name}${e.extra ? `<small>+${e.extra}</small>` : ''}
      </button>`).join('');

    updateSpecUI();
    openSheet(specSheet);
  }

  function updateSpecUI() {
    $('#spec-qty').textContent = specCtx.qty;
    const p = PRODUCTS.find(x => x.id === specCtx.id);
    $('#spec-total').textContent = Store.yuan(unitPriceOf(p, specCtx) * specCtx.qty);
    // 减号禁用态
    $('.spec-group--qty [data-step="-1"]').disabled = specCtx.qty <= 1;
  }

  /* =========================================================
   * 4. 购物车
   * ======================================================= */
  function renderCartBadge() {
    const n = Store.cartCount();
    const tabBadge = $('#tab-cart-badge');
    tabBadge.textContent = n > 99 ? '99+' : n;
    tabBadge.hidden = n === 0;
    if (n > 0) pop(tabBadge);

    const bar = $('#cart-bar');
    bar.hidden = n === 0;
    if (n > 0) {
      $('#cart-bar-badge').textContent = n > 99 ? '99+' : n;
      $('#cart-bar-total').textContent = Store.yuan(Store.cartTotal());
      pop($('#cart-bar-badge'));
    }

    // 商品卡角标
    $$('[data-count]').forEach(el => {
      const c = Store.countOf(el.dataset.count);
      el.textContent = c;
      el.hidden = c === 0;
      if (c > 0) pop(el);
    });
    // 点单页「已选 N 份」
    $$('[data-picked]').forEach(el => {
      const c = Store.countOf(el.dataset.picked);
      el.textContent = `已选 ${c} 份`;
      el.hidden = c === 0;
    });

    // 购物车条副标题：共 N 件 · 结算可减 ¥X
    const sub = Store.cartTotal();
    const best = COUPONS.filter(c => c.min <= sub).sort((a, b) => b.amt - a.amt)[0];
    $('#cart-bar-tip').textContent = best
      ? `共 ${n} 件 · 结算可减 ${Store.yuan(best.amt)}`
      : `共 ${n} 件 · 到店自取`;

    if (!cartSheet.hidden) renderCartSheet();
  }

  function pop(el) {
    el.classList.remove('is-pop');
    void el.offsetWidth;
    el.classList.add('is-pop');
  }

  function renderCartSheet() {
    const box = $('#cart-items');
    const empty = $('#cart-empty');
    if (Store.cartCount() === 0) {
      box.innerHTML = '';
      empty.hidden = false;
      $('#cart-total').textContent = '¥0';
      $('#btn-cart-checkout').disabled = true;
      $('#btn-cart-checkout').style.opacity = '.5';
      return;
    }
    empty.hidden = true;
    $('#btn-cart-checkout').style.opacity = '1';
    box.innerHTML = Store.state.cart.map(i => `
      <div class="cart-item">
        <div class="cart-item__media"><img src="${i.img}" alt="${i.name}" style="width:100%;height:100%;object-fit:cover"></div>
        <div class="cart-item__body">
          <p class="cart-item__name">${i.name}</p>
          <p class="cart-item__spec">${Store.specText(i)}</p>
          <div class="cart-item__foot">
            <span class="cart-item__amount"><small>¥</small>${i.unitPrice}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="stepper stepper--mini">
                <button class="stepper__btn" data-cart-step="-1" data-key="${i.key}">${I('minus', 12, { weight: 2 })}</button>
                <span class="stepper__num">${i.qty}</span>
                <button class="stepper__btn" data-cart-step="1" data-key="${i.key}">${I('plus', 12, { weight: 2 })}</button>
              </div>
              <button class="cart-item__del" data-cart-del="${i.key}">${I('trash', 12)}</button>
            </div>
          </div>
        </div>
      </div>`).join('');
    $('#cart-total').textContent = Store.yuan(Store.cartTotal());
  }

  /* =========================================================
   * 5. 结算页
   * ======================================================= */
  let couponSel = null;    // 当前选中的优惠券 id（null = 不使用）
  let noCoupon = false;    // 用户是否明确选择「不使用优惠券」
  let payMethod = 'balance'; // 支付方式：balance 储值 / wechat 微信

  function renderCheckout() {
    const cart = Store.state.cart;
    if (!cart.length) { Store.back(); return; }

    // 进入结算页时重置选择状态（避免上次订单的选择残留）
    couponSel = null;
    noCoupon = false;
    payMethod = 'balance';

    // 商品行：只展示数量，不做增减；右侧金额 = 单价 × 数量（小计）
    $('#checkout-items').innerHTML = cart.map(i => `
      <div class="co-item">
        <div class="co-item__media"><img src="${i.img}" alt="${i.name}" style="width:100%;height:100%;object-fit:cover"></div>
        <div class="co-item__body">
          <p class="co-item__name">${i.name}</p>
          <p class="co-item__spec">${Store.specText(i)}</p>
          <div class="co-item__foot">
            <span class="co-item__qty">×${i.qty}</span>
            <span class="co-item__amount"><small>¥</small>${Store.itemTotal(i)}</span>
          </div>
        </div>
      </div>`).join('');

    // 优惠券：重置为可用的第一张（或此前选择仍有效则保留）
    refreshCoupon();
    renderPayMethods();

    // 金额
    updateFees();
  }

  /** 根据当前小计计算优惠券可用性，并刷新优惠券显示 */
  function refreshCoupon() {
    const sub = Store.cartTotal();
    const avail = COUPONS.filter(c => {
      if (c.min > sub) return false;
      // 储值回馈券仅储值支付可用
      if (c.id === 'c4' && payMethod !== 'balance') return false;
      return true;
    });
    // 当前选中的券若已不可用则清空
    if (couponSel && !avail.some(c => c.id === couponSel)) couponSel = null;
    // 默认帮用户选中可用面额最大的一张（用户明确「不使用」则跳过）
    if (!noCoupon && !couponSel && avail.length) {
      couponSel = avail.reduce((a, b) => (b.amt > a.amt ? b : a)).id;
    }
    const cur = COUPONS.find(c => c.id === couponSel);
    const el = $('#coupon-value');
    if (cur) {
      el.textContent = `-¥${cur.amt} · ${cur.name}`;
      el.classList.add('has-coupon');
    } else if (avail.length) {
      el.textContent = '不使用优惠券';
      el.classList.remove('has-coupon');
    } else {
      el.textContent = '暂无可用';
      el.classList.remove('has-coupon');
    }
    $('#coupon-sheet-count').textContent = `${avail.length} 张可用`;
  }

  /** 渲染支付方式选中态与余额提示 */
  function renderPayMethods() {
    const total = payableNow();
    $$('#pay-methods .pay-method').forEach(m => {
      const on = m.dataset.pay === payMethod;
      m.classList.toggle('is-active', on);
    });
    const bal = USER.balance;
    // 余额不足时储值支付提示变红
    const balHint = $('#pay-balance-hint');
    if (payMethod === 'balance' && bal < total) {
      balHint.textContent = '余额不足';
      balHint.style.color = 'var(--danger)';
    } else {
      balHint.textContent = `余额 ¥${bal}`;
      balHint.style.color = '';
    }
  }

  /** 当前实付金额（小计 - 优惠券 + 打包费） */
  function payableNow() {
    const sub = Store.cartTotal();
    const disc = couponSel ? (COUPONS.find(c => c.id === couponSel)?.amt || 0) : 0;
    return Math.max(0, sub - disc + Store.PACK_FEE);
  }

  /** 刷新优惠券抵扣、实付金额与支付方式提示 */
  function updateFees() {
    const sub = Store.cartTotal();
    const disc = couponSel ? (COUPONS.find(c => c.id === couponSel)?.amt || 0) : 0;
    $('#fee-subtotal').textContent = Store.yuan(sub);

    // 优惠券抵扣行：不使用优惠券时隐藏，选中时显示 -¥X
    const discRow = $('#fee-discount').closest('.order-block__row');
    if (disc > 0) {
      discRow.hidden = false;
      $('#fee-discount').textContent = '-' + Store.yuan(disc);
    } else {
      discRow.hidden = true;
    }
    $('#fee-pack').textContent = Store.yuan(Store.PACK_FEE);

    $('#checkout-total').textContent = Store.yuan(payableNow());
    $('#checkout-hint').textContent = disc > 0 ? `已优惠 ${Store.yuan(disc)}` : '到店自取';
    renderPayMethods();
  }

  /** 渲染优惠券下拉列表 */
  function renderCouponList() {
    const sub = Store.cartTotal();
    const list = $('#coupon-list');
    const rows = COUPONS.map(c => {
      const usable = c.min <= sub && (c.id !== 'c4' || payMethod === 'balance');
      const active = couponSel === c.id;
      const reason = !usable
        ? (c.min > sub ? `差 ¥${c.min - sub}` : '储值支付可用')
        : (active ? '已选' : '可领');
      return `
        <button class="coupon-opt${active ? ' is-active' : ''}${!usable ? ' is-disabled' : ''}"
          data-coupon="${c.id}" type="button">
          <span class="coupon-opt__amt"><small>¥</small>${c.amt}</span>
          <span class="coupon-opt__body">
            <span class="coupon-opt__name">${c.name}</span>
            <span class="coupon-opt__desc">${c.desc}</span>
          </span>
          <span class="coupon-opt__state">${reason}</span>
          <span class="coupon-opt__check"></span>
        </button>`;
    }).join('');
    list.innerHTML = rows || '<div class="coupon-empty"><p>暂无可用优惠券</p></div>';
  }

  /* =========================================================
   * 6. 订单页
   * ======================================================= */
  function renderOrder() {
    const o = Store.state.currentOrder;
    if (!o) { Store.go('mine'); return; }

    $('#order-status-card').innerHTML = `
      <div class="status-card">
        <p class="status-card__label">订单状态</p>
        <h2 class="status-card__state">${o.status === 'paid' ? '支付成功' : '已完成'}</h2>
        <div class="status-card__pickup">
          <div>
            <p class="status-card__pickup-label">取餐号</p>
            <p class="status-card__no">${o.pickupNo}</p>
          </div>
          <div style="text-align:right">
            <p class="status-card__pickup-label">取餐门店</p>
            <p style="font-size:12.5px;font-weight:600;margin-top:5px">${o.shop}</p>
            <p style="font-size:10.5px;opacity:.7;margin-top:3px">${o.status === 'paid' ? '预计 8 分钟内完成' : '订单已完成'}</p>
          </div>
        </div>
        <p class="status-card__tip">${o.status === 'paid'
          ? `制作完成后小程序会推送通知，请留意取餐号 <b>${o.pickupNo}</b>`
          : '感谢惠顾，期待再次光临'}</p>
        <div class="status-card__actions">
          <button class="status-card__btn status-card__btn--solid" data-again>再来一单</button>
          <button class="status-card__btn" data-order-help>联系门店</button>
          <button class="status-card__btn" data-history>历史订单</button>
        </div>
      </div>`;

    $('#order-detail').innerHTML = `
      <div class="order-info">
        <div class="order-info__card">
          <div class="order-info__title">商品明细</div>
          ${o.items.map(i => `
            <div class="order-info__item">
              <div class="order-info__media">${i.img ? `<img src="${i.img}" alt="${i.name}" style="width:100%;height:100%;object-fit:cover">` : ''}</div>
              <div class="order-info__body">
                <p class="order-info__name">${i.name}<span class="order-info__qty">×${i.qty}</span></p>
                <p class="order-info__spec">${i.spec}</p>
              </div>
              <span class="order-info__amount"><small>¥</small>${i.amount}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="order-kv">
        <div class="order-kv__row"><span class="order-kv__k">订单编号</span><span class="order-kv__v">${o.id}</span></div>
        <div class="order-kv__row"><span class="order-kv__k">下单时间</span><span class="order-kv__v">${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}-${String(o.createdAt.getDate()).padStart(2, '0')} ${Store.fmtTime(o.createdAt)}</span></div>
        <div class="order-kv__row"><span class="order-kv__k">取餐方式</span><span class="order-kv__v">${o.type}</span></div>
        ${o.note ? `<div class="order-kv__row"><span class="order-kv__k">订单备注</span><span class="order-kv__v">${o.note}</span></div>` : ''}
        <div class="order-kv__row"><span class="order-kv__k">商品小计</span><span class="order-kv__v">${Store.yuan(o.subtotal)}</span></div>
        <div class="order-kv__row"><span class="order-kv__k">优惠减免</span><span class="order-kv__v text-green">-${Store.yuan(o.discount)}</span></div>
        <div class="order-kv__row"><span class="order-kv__k">打包费</span><span class="order-kv__v">${Store.yuan(o.packFee)}</span></div>
        <div class="order-kv__row"><span class="order-kv__k">支付方式</span><span class="order-kv__v order-kv__v--paid">${o.payMethod} · 已支付</span></div>
        <div class="order-kv__row"><span class="order-kv__k">实付金额</span><span class="order-kv__v order-kv__v--strong">${Store.yuan(o.total)}</span></div>
      </div>
      <div class="timeline-wrap">
        <div class="timeline-wrap__title">订单进度</div>
        <div class="timeline">
          ${(o.timeline && o.timeline.length ? o.timeline : [
            { title: '订单已提交', time: Store.fmtTime(o.createdAt), done: true },
            { title: '已完成，感谢惠顾', time: Store.fmtTime(new Date(o.createdAt.getTime() + 480000)), done: true },
          ]).map(t => `
            <div class="tl-item${t.done ? ' is-done' : ''}">
              <p class="tl-item__title">${t.title}</p>
              <p class="tl-item__time">${t.time || '—'}</p>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* =========================================================
   * 7. 我的
   * ======================================================= */
  function renderMine() {
    // 生成一个渐变头像，避免外部图片依赖
    const seeds = [['#b8552f', '#3a2417'], ['#c98a3e', '#6b4a1a'], ['#7a8a4c', '#4d5a2e']];
    const [c1, c2] = seeds[USER.avatarSeed % seeds.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs><linearGradient id="av" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#av)"/>
      <circle cx="50" cy="38" r="17" fill="#fff" opacity=".92"/>
      <path d="M18 88c0-18 14.5-28 32-28s32 10 32 28z" fill="#fff" opacity=".92"/>
    </svg>`;

    $('#mine-hero').innerHTML = `
      <div class="mine-hero__user">
        <div class="avatar"><img class="avatar__img" alt="头像" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}"></div>
        <div style="min-width:0">
          <h2 class="mine-hero__name">${USER.name}<span class="mine-hero__level">${USER.level}</span></h2>
          <p class="mine-hero__phone">${USER.phone}</p>
        </div>
      </div>
      </div>`;

    $('#mine-stats').innerHTML = `
      <button class="stat-item" data-stat="coupon">
        <span class="stat-item__num">${USER.coupons}<em>张</em></span>
        <span class="stat-item__label">优惠券</span>
      </button>
      <button class="stat-item" data-stat="balance">
        <span class="stat-item__num">${USER.balance}</span>
        <span class="stat-item__label">账户余额</span>
      </button>`;

    const orderRow = (icon, color, label, value, action) => `
      <button class="ml-row" data-demo="1"${action ? ` data-go="${action}"` : ''}>
        <span class="ml-row__icon" style="background:${color}">${I(icon, 17)}</span>
        <span class="ml-row__label">${label}</span>
        <span class="ml-row__value">${value || ''}</span>
        <span class="ml-row__arrow">${I('arrow', 15)}</span>
      </button>`;

    $('#mine-orders').innerHTML = `
      <div class="menu-list__head">常用功能</div>
      ${orderRow('bag', '#f3e0ce', '我的订单', Store.state.orders.length ? `${Store.state.orders.length} 笔` : '', 'orders')}
      ${orderRow('ticket', '#f3e0ce', '优惠券', `${USER.coupons} 张可用`)}
      ${orderRow('wallet', '#f2e0d2', '账户余额', `¥${USER.balance}`)}
      ${orderRow('service', '#f2e0d2', '联系我们')}`;
  }

  /* =========================================================
   * 7. 历史订单页
   * ======================================================= */
  function renderHistory() {
    Store.seedHistory();
    const orders = Store.state.orders;
    const list = $('#history-list');
    if (!orders.length) {
      list.innerHTML = '<div class="coupon-empty"><p>暂无历史订单</p></div>';
      return;
    }
    list.innerHTML = orders.map((h, idx) => `
      <div class="hist-card${idx === 0 ? ' hist-card--latest' : ''}" data-view-order="${h.id}">
        <div class="hist-card__head">
          <span class="hist-card__shop">${h.shop}</span>
          <span class="hist-card__state${h.status === 'done' ? ' is-done' : ''}">${h.status === 'done' ? '已完成' : '支付成功'}</span>
        </div>
        <div class="hist-card__thumbs">
          ${h.items.slice(0, 4).map(i => i.img
            ? `<span class="hist-card__thumb"><img src="${i.img}" alt="${i.name}"></span>`
            : '').join('')}
          ${h.items.length > 4 ? `<span class="hist-card__more">+${h.items.length - 4}</span>` : ''}
        </div>
        <p class="hist-card__names">${h.items.map(i => `${i.name} ×${i.qty}`).join('、')}</p>
        <div class="hist-card__foot">
          <span class="hist-card__time">${h.createdAt.getMonth() + 1}月${h.createdAt.getDate()}日 ${Store.fmtTime(h.createdAt)}</span>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="hist-card__amount"><small>¥</small>${h.total}</span>
            <button class="hist-card__again" data-reorder="${h.id}">再来一单</button>
          </div>
        </div>
      </div>`).join('');
  }

  /* =========================================================
   * 8. 路由渲染
   * ======================================================= */
  const pages = $$('.page');
  const isPush = name => name === 'checkout' || name === 'order' || name === 'history';

  function renderPage(name) {
    if (name === 'menu') renderMenu();
    if (name === 'checkout') renderCheckout();
    if (name === 'order') renderOrder();
    if (name === 'history') renderHistory();
    if (name === 'mine') renderMine();
    if (name === 'home') renderHome();
    renderCartBadge();
  }

  function route(name) {
    pages.forEach(p => {
      const on_ = p.dataset.page === name;
      p.classList.toggle('is-active', on_);
      p.classList.toggle('is-leaving', !on_);
    });
    // push 页隐藏 Tab 栏并让状态栏反白；首页已无深色顶栏，保持深色文字
    device.classList.toggle('is-pushed', isPush(name));
    device.classList.toggle('is-dark', isPush(name));
    $$('.tab-item').forEach(t => t.classList.toggle('is-active', t.dataset.tab === name));
    renderPage(name);
    // 切页后回到顶部
    const sc = $(`#page-${name} .scroll`);
    if (sc && !isPush(name)) sc.scrollTop = 0;
  }

  function navigate(name) { Store.go(name); }

  /* =========================================================
   * 9. 弹层控制
   * ======================================================= */
  function openSheet(sheet) {
    mask.hidden = false;
    requestAnimationFrame(() => mask.classList.add('is-open'));
    sheet.hidden = false;
    sheet.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => sheet.classList.add('is-open'));
  }
  function closeSheet() {
    [specSheet, cartSheet, couponSheet].forEach(s => {
      if (s.hidden) return;
      s.classList.remove('is-open');
      s.setAttribute('aria-hidden', 'true');
      setTimeout(() => (s.hidden = true), 360);
    });
    mask.classList.remove('is-open');
    setTimeout(() => (mask.hidden = true), 300);
  }

  /* =========================================================
   * 10. 事件绑定
   * ======================================================= */
  function bind() {
    // Tab 切换
    $('#tab-bar').addEventListener('click', e => {
      const btn = e.target.closest('.tab-item');
      if (btn) navigate(btn.dataset.tab);
    });

    // 返回
    document.addEventListener('click', e => {
      if (e.target.closest('[data-back]')) Store.back();
    });

    /* ---- 首页 ---- */
    $('#home-scroll').addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) { openSpec(open.dataset.open); return; }
      // 门店卡「到店自取」/「全部菜单」→ 点单页
      if (e.target.closest('[data-goto-menu]')) { navigate('menu'); return; }
      // 活动规则说明
      if (e.target.closest('[data-promo-rule]')) {
        toast('14:00 后第二杯半价 · 结算满 30 减 6、满 60 减 12');
        return;
      }
      const slide = e.target.closest('.banner__slide');
      if (slide) {
        navigate('menu');
        setTimeout(() => scrollToCat(slide.dataset.cat), 80);
      }
    });

    /* ---- 点单页 ---- */
    $('#cat-rail').addEventListener('click', e => {
      const b = e.target.closest('.cat-item');
      if (b) scrollToCat(b.dataset.cat);
    });
    $('#menu-scroll').addEventListener('click', e => {
      // 甜点/轻食无规格区分，圆形 + 直接加购
      const quick = e.target.closest('[data-quick]');
      if (quick) {
        const p = PRODUCTS.find(x => x.id === quick.dataset.quick);
        Store.addToCart(p.id, { size: 'm', temp: '', extras: [], qty: 1 });
        toast(`已加购 ${p.name}`);
        return;
      }
      // 饮品点「选规格」或整行 → 打开规格弹层
      const specBtn = e.target.closest('[data-spec]');
      if (specBtn) { openSpec(specBtn.dataset.spec); return; }
      const open = e.target.closest('[data-open]');
      if (open) openSpec(open.dataset.open);
    });

    /* ---- 购物车悬浮条 ---- */
    $('#cart-bar').addEventListener('click', e => {
      if (e.target.closest('#btn-checkout')) {
        closeSheet();
        Store.push('checkout');
        return;
      }
      renderCartSheet();
      openSheet(cartSheet);
    });

    /* ---- 购物车弹层 ---- */
    $('#cart-items').addEventListener('click', e => {
      const step = e.target.closest('[data-cart-step]');
      if (step) {
        const item = Store.state.cart.find(i => i.key === step.dataset.key);
        Store.setQty(step.dataset.key, item.qty + Number(step.dataset.cartStep));
        return;
      }
      const del = e.target.closest('[data-cart-del]');
      if (del) { Store.removeItem(del.dataset.cartDel); toast('已移出购物车'); }
    });
    $('#btn-clear-cart').addEventListener('click', () => {
      Store.clearCart();
      closeSheet();
      toast('购物车已清空');
    });
    $('#btn-cart-checkout').addEventListener('click', () => {
      if (!Store.cartCount()) return;
      closeSheet();
      Store.push('checkout');
    });
    $('#btn-cart-go').addEventListener('click', () => {
      closeSheet();
      navigate('menu');
    });

    /* ---- 规格弹层 ---- */
    $('#spec-sizes').addEventListener('click', e => {
      const b = e.target.closest('[data-size]');
      if (!b) return;
      specCtx.size = b.dataset.size;
      $$('#spec-sizes .spec-opt').forEach(x => x.classList.toggle('is-active', x === b));
      updateSpecUI();
    });
    $('#spec-temps').addEventListener('click', e => {
      const b = e.target.closest('[data-temp]');
      if (!b) return;
      specCtx.temp = b.dataset.temp;
      $$('#spec-temps .spec-opt').forEach(x => x.classList.toggle('is-active', x === b));
      updateSpecUI();
    });
    $('#spec-extras').addEventListener('click', e => {
      const b = e.target.closest('[data-extra]');
      if (!b) return;
      const name = b.dataset.extra;
      const i = specCtx.extras.indexOf(name);
      if (i > -1) specCtx.extras.splice(i, 1); else specCtx.extras.push(name);
      b.classList.toggle('is-active');
      updateSpecUI();
    });
    $('.spec-group--qty').addEventListener('click', e => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      const next = specCtx.qty + Number(b.dataset.step);
      if (next < 1) return;
      specCtx.qty = Math.min(next, 99);
      updateSpecUI();
    });
    $('#btn-add-cart').addEventListener('click', () => {
      Store.addToCart(specCtx.id, specCtx);
      const p = PRODUCTS.find(x => x.id === specCtx.id);
      closeSheet();
      toast(`已加入购物车 · ${p.name}`);
    });

    /* ---- 关闭弹层 ---- */
    mask.addEventListener('click', closeSheet);
    document.addEventListener('click', e => {
      if (e.target.closest('[data-close-sheet]')) closeSheet();
    });

    /* ---- 结算页 ---- */
    $('#checkout-note').addEventListener('input', e => {
      Store.state.checkout.note = e.target.value;
    });

    // 打开优惠券下拉
    $('#btn-coupon').addEventListener('click', () => {
      renderCouponList();
      openSheet(couponSheet);
    });

    // 支付方式切换
    $('#pay-methods').addEventListener('click', e => {
      const m = e.target.closest('[data-pay]');
      if (!m) return;
      payMethod = m.dataset.pay;
      // 储值回馈券仅储值可用，切换后重新校验
      refreshCoupon();
      updateFees();
    });

    // 优惠券弹层：点选项选中
    $('#coupon-list').addEventListener('click', e => {
      const opt = e.target.closest('.coupon-opt');
      if (!opt || opt.classList.contains('is-disabled')) return;
      couponSel = opt.dataset.coupon;
      noCoupon = false;
      renderCouponList();
    });
    // 不使用优惠券
    $('#btn-coupon-none').addEventListener('click', () => {
      couponSel = null;
      noCoupon = true;
      refreshCoupon();
      closeSheet();
      updateFees();
    });
    // 确定
    $('#btn-coupon-confirm').addEventListener('click', () => {
      refreshCoupon();
      closeSheet();
      updateFees();
    });
    $('#btn-submit-order').addEventListener('click', () => {
      if (!Store.cartCount()) return;
      // 余额支付且余额不足时，提示切换支付方式
      if (payMethod === 'balance' && USER.balance < payableNow()) {
        toast('储值余额不足，请切换微信支付');
        return;
      }
      const disc = couponSel ? (COUPONS.find(c => c.id === couponSel)?.amt || 0) : 0;
      // 模拟支付流程
      const pm = $('#pay-mask');
      pm.hidden = false;
      $('#pay-mask-text').textContent = payMethod === 'balance' ? '储值支付中…' : '微信支付中…';
      requestAnimationFrame(() => pm.classList.add('is-open'));
      setTimeout(() => {
        pm.classList.remove('is-open');
        setTimeout(() => (pm.hidden = true), 260);
        const order = Store.createOrder({ discount: disc, payMethod });
        toast('支付成功');
        $('#page-checkout').classList.remove('is-active');
        Store.state.pageStack = ['menu'];
        Store.state.page = 'order';
        renderOrder();
        route('order');
      }, 1200);
    });

    /* ---- 订单页 ---- */
    $('#page-order').addEventListener('click', e => {
      if (e.target.closest('[data-again]')) {
        Store.state.pageStack = ['mine'];
        Store.state.page = 'menu';
        route('menu');
        toast('已为你带入历史订单');
        return;
      }
      if (e.target.closest('[data-order-help]')) { toast('野火咖啡 · 营业时间 08:00–20:00'); return; }
      if (e.target.closest('[data-history]')) {
        Store.push('history');
        renderHistory();
        return;
      }
      const re = e.target.closest('[data-reorder]');
      if (re) {
        Store.state.pageStack = ['order'];
        Store.state.page = 'menu';
        route('menu');
        toast('已为你带入历史订单');
      }
    });

    /* ---- 历史订单页 ---- */
    $('#history-list').addEventListener('click', e => {
      // 再来一单
      const re = e.target.closest('[data-reorder]');
      if (re) {
        Store.state.pageStack = ['history'];
        Store.state.page = 'menu';
        route('menu');
        toast('已为你带入历史订单');
        return;
      }
      // 点击卡片查看订单详情
      const view = e.target.closest('[data-view-order]');
      if (view) {
        const o = Store.state.orders.find(x => x.id === view.dataset.viewOrder);
        if (o) {
          Store.state.currentOrder = o;
          Store.state.pageStack = ['history'];
          Store.state.page = 'order';
          renderOrder();
          route('order');
        }
      }
    });

    /* ---- 我的 ---- */
    $('#mine-scroll').addEventListener('click', e => {
      const goOrders = e.target.closest('[data-go="orders"]');
      if (goOrders) {
        Store.push('history');
        renderHistory();
        return;
      }
      const st = e.target.closest('[data-stat]');
      if (st) { toast(`${st.querySelector('.stat-item__label').textContent}：${st.querySelector('.stat-item__num').textContent}`); return; }
      if (e.target.closest('[data-demo]')) toast('Demo 版本，该功能未接入');
    });
    $('#mine-scroll').addEventListener('scroll', e => {
      $('#mine-hero').classList.toggle('is-compact', e.target.scrollTop > 30);
    }, { passive: true });
  }

  /* =========================================================
   * 11. 启动
   * ======================================================= */
  function init() {
    Icons.hydrate();
    renderHome();
    renderMenu();
    renderMine();
    bindScrollSpy();
    bind();

    Store.on(reason => {
      renderCartBadge();
      if (reason.startsWith('route')) route(Store.state.page);
      if (reason === 'cart:add' || reason === 'cart:qty' || reason === 'cart:remove' || reason === 'cart:clear') {
        if (Store.state.page === 'checkout') renderCheckout();
      }
    });

    route('home');
  }

  document.addEventListener('DOMContentLoaded', init);
})();