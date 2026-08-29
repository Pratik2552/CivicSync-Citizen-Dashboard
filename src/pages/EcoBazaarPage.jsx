import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ShoppingBag, MapPin, Leaf, ShieldCheck, MessageCircle,
  Heart, Award, Building2, BadgePercent, CreditCard, CheckCircle2, ArrowRight
} from 'lucide-react';
import './EcoBazaarPage.css';

// Carbon Points rule: 1 point = ₹1 discount value, capped at 25% of order value.
const POINT_VALUE_RUPEES = 1;
const MAX_DISCOUNT_PERCENT = 25;
const CITIZEN_CARBON_POINTS = 850; // Replace with backend/account balance when available.

function calculateCarbonDiscount(orderTotal, availablePoints) {
  const maxByPercent = Math.floor(orderTotal * (MAX_DISCOUNT_PERCENT / 100));
  const maxByPoints = Math.floor(availablePoints * POINT_VALUE_RUPEES);
  const discountAmount = Math.max(0, Math.min(maxByPercent, maxByPoints, orderTotal));
  const pointsUsed = Math.ceil(discountAmount / POINT_VALUE_RUPEES);
  return {
    discountAmount,
    pointsUsed,
    payable: Math.max(0, orderTotal - discountAmount),
  };
}

// ─── Artisan & Product Data ──────────────────────────────────────────────────
// All products are made from waste/recycled materials by local artisans
const ARTISANS = [
  {
    id: 'A1',
    name: 'Savitri Devi',
    location: 'Nashik East',
    avatar: '👩',
    color: '#16a34a',
    bio: 'Former municipal sweeper who turned recycling into a thriving craft business. Specialises in fabric upcycling.',
    since: '2019',
    products_sold: 847,
    rating: 4.9,
    phone: '+91 98230 11234',
  },
  {
    id: 'A2',
    name: 'Rajan Kumbhar',
    location: 'Satpur, Nashik',
    avatar: '👨',
    color: '#ea580c',
    bio: 'Potter who reinvented himself after discovering newspaper clay. Makes stunning home décor from old newspapers.',
    since: '2020',
    products_sold: 623,
    rating: 4.8,
    phone: '+91 97657 88901',
  },
  {
    id: 'A3',
    name: 'Meera Patil',
    location: 'Panchavati, Nashik',
    avatar: '👩',
    color: '#0891b2',
    bio: 'Single mother who mastered bottle art after attending a CivicSync upcycling workshop.',
    since: '2021',
    products_sold: 411,
    rating: 4.7,
    phone: '+91 96654 32100',
  },
  {
    id: 'A4',
    name: 'Dilip Tawde',
    location: 'Cidco, Nashik',
    avatar: '👨',
    color: '#7c3aed',
    bio: 'Retired factory worker creating masterpiece furniture from industrial wooden pallets and scrap metal.',
    since: '2018',
    products_sold: 1204,
    rating: 5.0,
    phone: '+91 98765 43210',
  },
  {
    id: 'A5',
    name: 'Asha Bhosale',
    location: 'Deolali, Nashik',
    avatar: '👩',
    color: '#b45309',
    bio: 'Homemaker who turned plastic bag weaving into a full-time business supporting 8 women in her locality.',
    since: '2020',
    products_sold: 932,
    rating: 4.8,
    phone: '+91 99222 77654',
  },
  {
    id: 'A6',
    name: 'Suresh Gaikwad',
    location: 'Igatpuri, Nashik',
    avatar: '👨',
    color: '#0f172a',
    bio: 'Electronics technician making lamps and decor from old electronic components, circuit boards, and wires.',
    since: '2022',
    products_sold: 289,
    rating: 4.6,
    phone: '+91 94568 12345',
  },
];

const CATEGORIES = [
  { id: 'ALL',        label: 'All Products',  emoji: '🌿' },
  { id: 'BAGS',       label: 'Bags & Totes',  emoji: '👜' },
  { id: 'DECOR',      label: 'Home Décor',    emoji: '🏮' },
  { id: 'GARDEN',     label: 'Garden',        emoji: '🌱' },
  { id: 'FURNITURE',  label: 'Furniture',     emoji: '🪑' },
  { id: 'FASHION',    label: 'Fashion',       emoji: '👗' },
  { id: 'KIDS',       label: 'Kids & Toys',   emoji: '🧸' },
  { id: 'GIFTS',      label: 'Gifts',         emoji: '🎁' },
];

const PRODUCTS = [
  {
    id: 'P1', artisanId: 'A1', category: 'BAGS',
    name: 'Patchwork Tote Bag',
    desc: 'Handstitched from 100% recycled cotton fabric scraps. Each bag is unique — no two are the same. Roomy, durable, and colourful.',
    emoji: '👜',
    tags: ['Fabric Scraps', 'Handstitched', 'Zero Waste'],
    price: 349,
    pts_equiv: 349,
    carbon_kg_saved: 1.2,
    stock: 12,
    ecoBadge: 'UPCYCLED FABRIC',
  },
  {
    id: 'P2', artisanId: 'A2', category: 'DECOR',
    name: 'Newspaper Clay Pot',
    desc: 'Beautiful decorative pot sculpted from old newspaper pulp, kiln-hardened and painted. Perfect for succulents or as a pen holder.',
    emoji: '🪴',
    tags: ['Old Newspaper', 'Hand-Painted', 'Biodegradable'],
    price: 199,
    pts_equiv: 199,
    carbon_kg_saved: 0.4,
    stock: 22,
    ecoBadge: 'WASTE PAPER',
  },
  {
    id: 'P3', artisanId: 'A3', category: 'DECOR',
    name: 'Bottle Cap Wind Chime',
    desc: 'Melodic wind chime crafted from collected bottle caps, old glass bangles, and repurposed copper wire. Adds magic to any balcony.',
    emoji: '🎐',
    tags: ['Bottle Caps', 'Glass Bangles', 'Copper Wire'],
    price: 279,
    pts_equiv: 279,
    carbon_kg_saved: 0.6,
    stock: 8,
    ecoBadge: 'FOUND OBJECTS',
  },
  {
    id: 'P4', artisanId: 'A5', category: 'BAGS',
    name: 'Woven Plastic Bag Basket',
    desc: 'Sturdy shopping basket woven entirely from reclaimed plastic carry bags. Waterproof, lightweight and incredibly strong.',
    emoji: '🧺',
    tags: ['Plastic Bags', 'Woven by Hand', 'Waterproof'],
    price: 399,
    pts_equiv: 399,
    carbon_kg_saved: 1.8,
    stock: 15,
    ecoBadge: 'PLASTIC RESCUE',
  },
  {
    id: 'P5', artisanId: 'A3', category: 'DECOR',
    name: 'Glass Bottle Lamp',
    desc: 'Rustic table lamp made from a reclaimed glass bottle, fitted with an LED filament bulb. Warm amber glow for cosy evenings.',
    emoji: '🪔',
    tags: ['Glass Bottle', 'LED', 'Rustic Decor'],
    price: 649,
    pts_equiv: 649,
    carbon_kg_saved: 0.9,
    stock: 6,
    ecoBadge: 'BOTTLE UPCYCLE',
  },
  {
    id: 'P6', artisanId: 'A4', category: 'FURNITURE',
    name: 'Pallet Wood Side Table',
    desc: 'Compact side table crafted from reclaimed wooden pallets and scrap iron legs. Sanded, oiled, and ready to use. Holds 20 kg.',
    emoji: '🪑',
    tags: ['Wood Pallets', 'Scrap Metal', 'Industrial'],
    price: 1499,
    pts_equiv: 1499,
    carbon_kg_saved: 4.5,
    stock: 3,
    ecoBadge: 'PALLET WOOD',
  },
  {
    id: 'P7', artisanId: 'A1', category: 'FASHION',
    name: 'Denim Scraps Jacket Patch',
    desc: 'Artisan-embroidered patch set made from old jeans offcuts. Iron-on adhesive backing. Give your old jacket a fresh identity.',
    emoji: '🧵',
    tags: ['Old Denim', 'Embroidered', 'DIY Fashion'],
    price: 149,
    pts_equiv: 149,
    carbon_kg_saved: 0.3,
    stock: 30,
    ecoBadge: 'DENIM OFFCUTS',
  },
  {
    id: 'P8', artisanId: 'A2', category: 'GARDEN',
    name: 'Recycled Tire Planter',
    desc: 'A cheerfully painted old tyre repurposed into a large planter. Perfect for herbs, tomatoes, or flowering plants on terraces.',
    emoji: '🌻',
    tags: ['Old Tyre', 'Outdoor', 'Eco-Garden'],
    price: 449,
    pts_equiv: 449,
    carbon_kg_saved: 2.2,
    stock: 7,
    ecoBadge: 'TYRE RESCUE',
  },
  {
    id: 'P9', artisanId: 'A6', category: 'DECOR',
    name: 'Circuit Board Wall Art',
    desc: 'Abstract wall art made from old computer motherboards, RAM chips, and PCB fragments set in a resin frame. A geek\'s dream decor.',
    emoji: '🎨',
    tags: ['E-Waste', 'Resin Art', 'Tech Decor'],
    price: 899,
    pts_equiv: 899,
    carbon_kg_saved: 1.4,
    stock: 4,
    ecoBadge: 'E-WASTE ART',
  },
  {
    id: 'P10', artisanId: 'A5', category: 'BAGS',
    name: 'Saree Border Clutch',
    desc: 'Elegant clutch bag made from the discarded border strips of old silk sarees. Hand-sewn lining, magnetic clasp, and a zipper pocket.',
    emoji: '👛',
    tags: ['Old Saree', 'Silk Border', 'Handmade'],
    price: 299,
    pts_equiv: 299,
    carbon_kg_saved: 0.5,
    stock: 18,
    ecoBadge: 'SILK OFFCUTS',
  },
  {
    id: 'P11', artisanId: 'A4', category: 'FURNITURE',
    name: 'Old Door Coat Hanger',
    desc: 'A charming wall coat rack built from a repainted antique wooden door panel fitted with vintage knobs and hooks.',
    emoji: '🚪',
    tags: ['Old Door', 'Vintage Knobs', 'Wall Mount'],
    price: 799,
    pts_equiv: 799,
    carbon_kg_saved: 1.8,
    stock: 5,
    ecoBadge: 'SALVAGED WOOD',
  },
  {
    id: 'P12', artisanId: 'A1', category: 'KIDS',
    name: 'Cloth Scrap Soft Toy',
    desc: 'Cuddly stuffed animals sewn from leftover fabric scraps and cotton wadding. Tested and safe for children above 3 years.',
    emoji: '🧸',
    tags: ['Fabric Scraps', 'Child-Safe', 'Handmade Toy'],
    price: 189,
    pts_equiv: 189,
    carbon_kg_saved: 0.2,
    stock: 25,
    ecoBadge: 'FABRIC UPCYCLE',
  },
];

const SORT_OPTIONS = [
  { val: 'popular',   label: 'Most Popular' },
  { val: 'price_asc', label: 'Price: Low to High' },
  { val: 'price_desc',label: 'Price: High to Low' },
  { val: 'eco',       label: 'Carbon Saved (High)' },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
function getArtisan(id) { return ARTISANS.find(a => a.id === id); }

// ─── Component ───────────────────────────────────────────────────────────────
export default function EcoBazaarPage() {
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('ALL');
  const [sort,      setSort]      = useState('popular');
  const [selected,  setSelected]  = useState(null);  // product for buy modal
  const [qty,       setQty]       = useState(1);
  const [ordered,   setOrdered]   = useState(false);
  const [orderRef,  setOrderRef]  = useState('');
  const [wishlist,  setWishlist]  = useState([]);
  const [useCarbonPoints, setUseCarbonPoints] = useState(true);

  // ── Filtered + sorted products
  const visible = useMemo(() => {
    let list = PRODUCTS;

    if (category !== 'ALL') {
      list = list.filter(p => p.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        getArtisan(p.artisanId)?.name.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (sort === 'price_asc')  return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'eco')        return b.carbon_kg_saved - a.carbon_kg_saved;
      return b.pts_equiv - a.pts_equiv; // popular = highest value
    });

    return list;
  }, [search, category, sort]);

  // ── Modal helpers
  const openBuy = (product) => {
    setSelected(product);
    setQty(1);
    setOrdered(false);
    setOrderRef('');
    setUseCarbonPoints(true);
  };

  const closeBuy = () => {
    setSelected(null);
    setOrdered(false);
  };

  const handleOrder = () => {
    const ref = `ECO-${Date.now().toString().slice(-6)}-${selected.id}`;
    setOrderRef(ref);
    setOrdered(true);
  };

  const toggleWishlist = (id) => {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  };

  // ── WhatsApp message builder
  const buildWaMsg = (product, artisan) => {
    const msg = `Hi ${artisan.name}! I found your product on CivicSync Eco Bazaar.\n\n*Product:* ${product.name}\n*Qty:* ${qty}\n*Total:* ₹${(product.price * qty).toLocaleString()}\n\nCould you confirm availability and delivery details? Thank you! 🌿`;
    return `https://wa.me/${artisan.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  const totalCarbonSaved = PRODUCTS.reduce((s, p) => s + p.carbon_kg_saved, 0);
  const orderTotal = selected ? selected.price * qty : 0;
  const carbonDiscount = selected && useCarbonPoints
    ? calculateCarbonDiscount(orderTotal, CITIZEN_CARBON_POINTS)
    : { discountAmount: 0, pointsUsed: 0, payable: orderTotal };

  return (
    <>
      <section className="eb-flow-strip">
        <div className="eb-flow-strip__inner">
          <div className="eb-flow-strip__heading">
            <div>
              <span className="eb-flow-strip__eyebrow">How Eco Bazaar Works</span>
              <h2>NGO-listed electronics get a second life, while citizens get a fair Carbon Points benefit.</h2>
            </div>
            <div className="eb-flow-strip__rule">Maximum {MAX_DISCOUNT_PERCENT}% discount per order</div>
          </div>

          <div className="eb-flow">
            {[
              { icon: Building2, title: 'NGO Lists Item', text: 'Verified NGO lists tested or refurbished electronics.' },
              { icon: ShieldCheck, title: 'CivicSync Publishes', text: 'Condition, price and stock are shown transparently.' },
              { icon: ShoppingBag, title: 'Citizen Selects', text: 'Citizen chooses an item and quantity.' },
              { icon: BadgePercent, title: 'Points Discount', text: 'Carbon Points reduce only part of the price.' },
              { icon: CreditCard, title: 'Pay Balance', text: 'Citizen pays the remaining amount.' },
              { icon: CheckCircle2, title: 'Points Deducted', text: 'Used points are deducted after purchase confirmation.' },
            ].map((step, index, arr) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.title}>
                  <div className="eb-flow__step">
                    <div className="eb-flow__icon"><Icon size={20} /></div>
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </div>
                  {index < arr.length - 1 && <ArrowRight className="eb-flow__arrow" size={18} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="eb-hero">
        <div className="eb-hero__inner">
          <div>
            <div className="eb-hero__badge">
              <Leaf size={12} /> CivicSync Green Initiative
            </div>
            <h1 className="eb-hero__title">
              Eco Bazaar —<br />
              <span>Refurbished Electronics</span><br />
              NGO Marketplace
            </h1>
            <p className="eb-hero__subtitle">
              Discover beautiful handcrafted products made entirely from recycled &amp; upcycled waste by Nashik's local eco-artisans and women self-help groups.
              Every purchase supports a family and saves the planet.
            </p>
            <div className="eb-hero__stats">
              <div className="eb-hero__stat">
                <span className="eb-hero__stat-num">{ARTISANS.length}</span>
                <span className="eb-hero__stat-lbl">NGO Partners</span>
              </div>
              <div className="eb-hero__stat">
                <span className="eb-hero__stat-num">{PRODUCTS.length}</span>
                <span className="eb-hero__stat-lbl">Products</span>
              </div>
              <div className="eb-hero__stat">
                <span className="eb-hero__stat-num">{totalCarbonSaved.toFixed(0)} kg</span>
                <span className="eb-hero__stat-lbl">CO₂ Offset / Sale Cycle</span>
              </div>
              <div className="eb-hero__stat">
                <span className="eb-hero__stat-num">100%</span>
                <span className="eb-hero__stat-lbl">Waste-Sourced</span>
              </div>
            </div>
          </div>

          <div className="eb-hero__img-wrap">
            <img
              src="/eco_hero.png"
              alt="Eco artisan products"
              className="eb-hero__img"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="eb-hero__img-badge">
              ♻️ 100% Upcycled Materials
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="eb-main">

        {/* Artisan Spotlight */}
        <div className="eb-spotlight">
          <div className="eb-spotlight__inner">
            <div>
              <div className="eb-spotlight__label">⭐ Artisan of the Month</div>
              <h2 className="eb-spotlight__title">
                {ARTISANS[3].avatar} {ARTISANS[3].name}
                <span style={{ fontSize: '0.8rem', marginLeft: 10, background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  ★ {ARTISANS[3].rating}
                </span>
              </h2>
              <p className="eb-spotlight__bio">{ARTISANS[3].bio} — {ARTISANS[3].location}</p>
              <div className="eb-spotlight__stats">
                <div className="eb-spotlight__stat">
                  <span className="eb-spotlight__stat-n">{ARTISANS[3].products_sold.toLocaleString()}</span>
                  <span className="eb-spotlight__stat-l">Items Sold</span>
                </div>
                <div className="eb-spotlight__stat">
                  <span className="eb-spotlight__stat-n">Since {ARTISANS[3].since}</span>
                  <span className="eb-spotlight__stat-l">Member Since</span>
                </div>
                <div className="eb-spotlight__stat">
                  <span className="eb-spotlight__stat-n">5.0 ★</span>
                  <span className="eb-spotlight__stat-l">Perfect Rating</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PRODUCTS.filter(p => p.artisanId === ARTISANS[3].id).map(p => (
                <div
                  key={p.id}
                  onClick={() => openBuy(p)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    textAlign: 'center',
                    minWidth: 100,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  <div style={{ fontSize: '2rem' }}>{p.emoji}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: 4 }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 800 }}>₹{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="eb-controls">
          <div className="eb-search">
            <Search size={16} className="eb-search__icon" />
            <input
              type="text"
              className="eb-search__input"
              placeholder="Search products, artisans, materials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="eb-cats" style={{ marginBottom: '1rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`eb-cat-btn ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Bar */}
        <div className="eb-sort-bar">
          <span className="eb-result-count">
            Showing <strong>{visible.length}</strong> products
            {category !== 'ALL' && ` in ${CATEGORIES.find(c => c.id === category)?.label}`}
            {search && ` matching "${search}"`}
          </span>
          <select
            className="eb-sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.val} value={o.val}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#475569' }}>No products found</p>
            <p>Try a different search or category filter.</p>
          </div>
        ) : (
          <div className="eb-grid">
            {visible.map(product => {
              const artisan = getArtisan(product.artisanId);
              const isWished = wishlist.includes(product.id);
              return (
                <div key={product.id} className="eb-card">
                  {/* Image area */}
                  <div className="eb-card__img-wrap" onClick={() => openBuy(product)}>
                    <div className="eb-card__emoji-bg">{product.emoji}</div>
                    <div className="eb-card__eco-badge">{product.ecoBadge}</div>
                    <div className="eb-card__pts-badge">
                      <Leaf size={10} /> {product.carbon_kg_saved} kg CO₂ saved
                    </div>
                    {/* Wishlist heart */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        color: isWished ? '#f43f5e' : '#fff',
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s',
                      }}
                    >
                      <Heart size={14} fill={isWished ? '#f43f5e' : 'none'} />
                    </button>
                  </div>

                  <div className="eb-card__body">
                    {/* Artisan info */}
                    <div className="eb-card__artisan">
                      <div
                        className="eb-card__avatar"
                        style={{ background: artisan.color, fontSize: '1rem' }}
                      >
                        {artisan.avatar}
                      </div>
                      <div className="eb-card__artisan-info">
                        <p className="eb-card__artisan-name">{artisan.name}</p>
                        <p className="eb-card__artisan-loc">
                          <MapPin size={9} /> {artisan.location}
                        </p>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                        ★ {artisan.rating}
                      </div>
                    </div>

                    {/* Product details */}
                    <h3 className="eb-card__name">{product.name}</h3>
                    <p className="eb-card__desc">{product.desc}</p>

                    <div className="eb-card__tags">
                      {product.tags.map((t, i) => (
                        <span key={i} className={`eb-tag ${i === product.tags.length - 1 ? 'eb-tag--orange' : ''}`}>{t}</span>
                      ))}
                    </div>

                    <div className="eb-card__footer">
                      <div className="eb-card__price">
                        <span className="eb-card__price-main">₹{product.price}</span>
                        <span className="eb-card__price-pts">Max 25% discount with Carbon Points</span>
                      </div>
                      <button
                        className="eb-card__buy-btn"
                        onClick={() => openBuy(product)}
                      >
                        <ShoppingBag size={14} /> Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mission Banner */}
        <div style={{
          marginTop: '3rem',
          background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
          border: '1.5px solid #86efac',
          borderRadius: 16,
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800, color: '#14532d' }}>
              🌱 Why Eco Bazaar?
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', lineHeight: 1.6 }}>
              Every product here is made entirely from waste materials by Nashik's verified eco-artisans.
              Your purchase directly supports livelihoods and reduces landfill waste.
            </p>
          </div>
          {[
            { icon: '♻️', title: '100% Waste Materials', desc: 'No virgin materials used in any product' },
            { icon: '👩‍🎨', title: 'Verified Artisans',  desc: 'All sellers are background-checked and trained' },
            { icon: '🌿', title: 'Use Carbon Points',   desc: 'Use Carbon Points for a controlled partial discount' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d', marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#166534' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Artisans Directory */}
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={22} color="#16a34a" /> Meet Our Artisans
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {ARTISANS.map(artisan => {
              const artisanProducts = PRODUCTS.filter(p => p.artisanId === artisan.id);
              return (
                <div
                  key={artisan.id}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '16px',
                    display: 'flex',
                    gap: 12,
                    transition: 'box-shadow 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: artisan.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    {artisan.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{artisan.name}</div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, margin: '2px 0 4px' }}>
                      <MapPin size={10} /> {artisan.location}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4, marginBottom: 6 }}>
                      {artisan.bio.slice(0, 80)}...
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#475569' }}>
                      <span>⭐ {artisan.rating}</span>
                      <span>·</span>
                      <span>{artisan.products_sold} sold</span>
                      <span>·</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{artisanProducts.length} products</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Buy Modal ─────────────────────────────────────────────────────────── */}
      {selected && (
        <div className="eb-modal-overlay" onClick={e => e.target === e.currentTarget && closeBuy()}>
          <div className="eb-modal">
            {ordered ? (
              /* Order Confirmation */
              <div className="eb-order-success">
                <div className="eb-order-success__icon">✅</div>
                <h3 className="eb-order-success__title">Order Request Sent!</h3>
                <p className="eb-order-success__msg">
                  Your order request for <strong>{qty}× {selected.name}</strong> has been sent to{' '}
                  <strong>{getArtisan(selected.artisanId)?.name}</strong>. They will contact you within 24 hours to confirm delivery. Carbon Points are deducted only after the purchase is confirmed.
                </p>
                <div className="eb-order-success__ref">Order Ref: {orderRef}</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="eb-modal__order-btn" onClick={closeBuy} style={{ flex: 'none', padding: '10px 24px' }}>
                    Continue Shopping
                  </button>
                  <Link to="/my-carbon-card" className="eb-modal__wa-btn" style={{ flex: 'none', padding: '10px 24px', textDecoration: 'none' }}>
                    🌿 Use Carbon Points
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="eb-modal__header">
                  <div>
                    <p className="eb-modal__header-product">{selected.name}</p>
                    <p className="eb-modal__header-artisan">by {getArtisan(selected.artisanId)?.name} · {selected.ecoBadge}</p>
                  </div>
                  <button className="eb-modal__close" onClick={closeBuy}>✕</button>
                </div>

                {/* Modal Body */}
                <div className="eb-modal__body">
                  <div className="eb-modal__emoji">{selected.emoji}</div>

                  <p className="eb-modal__desc">{selected.desc}</p>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {selected.tags.map((t, i) => (
                      <span key={i} className="eb-tag">{t}</span>
                    ))}
                    <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                      🌿 {selected.carbon_kg_saved} kg CO₂ saved
                    </span>
                  </div>

                  {/* Price + Qty */}
                  <div className="eb-modal__price-box">
                    <div className="eb-modal__price-left">
                      <span className="eb-modal__price-label">Unit Price</span>
                      <div className="eb-modal__price-val">₹{selected.price}</div>
                      <div className="eb-modal__price-pts">Max 25% discount with Carbon Points</div>
                    </div>
                    <div className="eb-modal__qty">
                      <span className="eb-modal__qty-label">Qty</span>
                      <div className="eb-modal__qty-control">
                        <button className="eb-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                        <span className="eb-qty-num">{qty}</span>
                        <button className="eb-qty-btn" onClick={() => setQty(q => Math.min(selected.stock, q + 1))}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Total ({qty} item{qty > 1 ? 's' : ''}):
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{(selected.price * qty).toLocaleString()}
                    </span>
                  </div>

                  {/* Carbon discount hint */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: '1rem', fontSize: '0.78rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Leaf size={13} />
                    <span>Have Carbon Points? Use them for a capped partial discount on this purchase.</span>
                  </div>

                  {/* Artisan Card */}
                  {(() => {
                    const artisan = getArtisan(selected.artisanId);
                    return (
                      <div className="eb-modal__artisan-card">
                        <div
                          className="eb-modal__artisan-avatar"
                          style={{ background: artisan.color, fontSize: '1.4rem' }}
                        >
                          {artisan.avatar}
                        </div>
                        <div>
                          <p className="eb-modal__artisan-name">{artisan.name} · ★ {artisan.rating}</p>
                          <p className="eb-modal__artisan-loc"><MapPin size={11} /> {artisan.location}</p>
                          <p className="eb-modal__artisan-bio">{artisan.bio.slice(0, 90)}...</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stock indicator */}
                  <div style={{ fontSize: '0.78rem', color: selected.stock <= 5 ? '#dc2626' : '#64748b', marginBottom: '1rem' }}>
                    {selected.stock <= 5 ? `⚠️ Only ${selected.stock} left in stock!` : `✅ ${selected.stock} units available`}
                  </div>

                  {/* Action Buttons */}
                  <div className="eb-modal__actions">
                    <button
                      className="eb-modal__wa-btn"
                      onClick={() => window.open(buildWaMsg(selected, getArtisan(selected.artisanId)), '_blank')}
                    >
                      <MessageCircle size={16} /> WhatsApp Artisan
                    </button>
                    <button
                      className="eb-modal__order-btn"
                      onClick={handleOrder}
                    >
                      <ShoppingBag size={16} /> Place Order
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
