import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const TAX_RATE   = 0.15;
const DELIVERY_FEE = 350;
const GIFT_FEE    = 150;

const STEPS = ['Review Cart', 'Delivery & Contact', 'Payment & Extras', 'Confirm Order'];

function StepBar({ step }) {
  return (
    <div style={sb.wrap}>
      {STEPS.map((label, i) => {
        const done    = i < step;
        const active  = i === step;
        return (
          <div key={i} style={sb.stepWrap}>
            <div style={{ ...sb.dot, background: done ? '#059669' : active ? '#7C3AED' : 'var(--border)', color: done || active ? '#fff' : 'var(--text-muted)' }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{ ...sb.label, color: active ? '#7C3AED' : done ? '#059669' : 'var(--text-muted)', fontWeight: active ? 800 : 500 }}>{label}</div>
            {i < STEPS.length - 1 && <div style={{ ...sb.line, background: done ? '#059669' : 'var(--border)' }} />}
          </div>
        );
      })}
    </div>
  );
}

const sb = {
  wrap: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: 36, overflowX: 'auto', padding: '0 16px' },
  stepWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minWidth: 80 },
  dot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, marginBottom: 6, zIndex: 1 },
  label: { fontSize: 11, textAlign: 'center', lineHeight: 1.3, maxWidth: 70 },
  line: { position: 'absolute', top: 16, left: '60%', width: 'calc(100% - 20px)', height: 2 },
};

// Step 1 — Cart Review
function Step1CartReview({ items, removeItem, updateQty, updateVariant, subtotal, goNext, goBack }) {
  const navigate = useNavigate();

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🛍</div>
      <div style={c.sectionTitle}>Your cart is empty</div>
      <button style={c.primaryBtn} onClick={() => navigate('/salons')}>Browse Salons</button>
    </div>
  );

  return (
    <div>
      <div style={c.sectionTitle}>Review Your Items</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {items.map(item => (
          <div key={item._key} style={c.cartItem}>
            {item.first_image_url ? (
              <img src={item.first_image_url} alt={item.name} style={c.itemImg} />
            ) : (
              <div style={c.itemImgPlaceholder}>🛍</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={c.itemName}>{item.name}</div>
              {item.brand && <div style={c.itemMeta}>{item.brand}</div>}
              <div style={c.itemMeta}>{item.salonName}</div>
              <div style={{ marginTop: 6 }}>
                <label style={c.smallLabel}>Variant / Shade</label>
                <input
                  style={c.variantInput}
                  value={item.variantNote || ''}
                  placeholder={item.shade_variant ? `e.g. ${item.shade_variant}` : 'Optional'}
                  onChange={e => updateVariant(item._key, e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={c.itemPrice}>LKR {(Number(item.selling_price) * item.quantity).toLocaleString()}</div>
              <div style={c.qtyRow}>
                <button style={c.qtyBtn} onClick={() => updateQty(item._key, item.quantity - 1)}>−</button>
                <span style={c.qty}>{item.quantity}</span>
                <button style={{ ...c.qtyBtn, opacity: item.quantity >= item.current_stock ? 0.4 : 1 }}
                  onClick={() => item.quantity < item.current_stock && updateQty(item._key, item.quantity + 1)}>+</button>
              </div>
              <button style={c.removeBtn} onClick={() => removeItem(item._key)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div style={c.subtotalRow}>
        <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
        <span style={{ fontWeight: 800 }}>LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={c.btnRow}>
        <button style={c.outlineBtn} onClick={() => navigate(-1)}>← Back</button>
        <button style={c.primaryBtn} onClick={goNext}>Continue →</button>
      </div>
    </div>
  );
}

// Step 2 — Delivery & Contact
function Step2Delivery({ form, setForm, goNext, goBack }) {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setCheck = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const valid = form.client_name && form.client_email && form.client_phone
    && (form.delivery_type === 'pickup' || (form.delivery_address && form.delivery_city));

  return (
    <div>
      <div style={c.sectionTitle}>Contact & Delivery</div>

      <div style={c.twoCol}>
        <Field label="Full Name *" value={form.client_name} onChange={set('client_name')} placeholder="Your full name" />
        <Field label="Email *" value={form.client_email} onChange={set('client_email')} placeholder="email@example.com" type="email" />
      </div>
      <Field label="Phone Number *" value={form.client_phone} onChange={set('client_phone')} placeholder="+94 7X XXX XXXX" />

      <div style={c.radioGroup}>
        <div style={c.radioLabel}>Delivery Method</div>
        {[['pickup', '🏪 Pickup from Salon'], ['delivery', '🚚 Home Delivery (+LKR 350)']].map(([val, lab]) => (
          <label key={val} style={c.radioRow}>
            <input type="radio" name="delivery_type" value={val} checked={form.delivery_type === val} onChange={set('delivery_type')} />
            <span style={c.radioText}>{lab}</span>
          </label>
        ))}
      </div>

      {form.delivery_type === 'delivery' && (
        <div>
          <Field label="Street Address *" value={form.delivery_address} onChange={set('delivery_address')} placeholder="No. 12, Main Street…" />
          <div style={c.twoCol}>
            <Field label="City *" value={form.delivery_city} onChange={set('delivery_city')} placeholder="Colombo" />
            <Field label="Postal Code" value={form.delivery_postal} onChange={set('delivery_postal')} placeholder="10001" />
          </div>
        </div>
      )}

      <div style={c.btnRow}>
        <button style={c.outlineBtn} onClick={goBack}>← Back</button>
        <button style={{ ...c.primaryBtn, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid} onClick={goNext}>Continue →</button>
      </div>
    </div>
  );
}

// Step 3 — Payment & Extras
function Step3Payment({ form, setForm, salonId, subtotal, goNext, goBack }) {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setCheck = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg]     = useState('');
  const [promoValid, setPromoValid] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoMsg('');
    try {
      const r = await api.post(`/salons/${salonId}/promo/validate/`, {
        code: promoInput.trim(),
        subtotal: subtotal.toFixed(2),
      });
      if (r.data.valid) {
        setForm(p => ({ ...p, promo_code: promoInput.trim(), discount_amount: r.data.discount_amount, promo_label: r.data.label }));
        setPromoMsg(`✓ ${r.data.label} applied!`);
        setPromoValid(true);
      } else {
        setPromoMsg(r.data.message || 'Invalid code');
        setPromoValid(false);
        setForm(p => ({ ...p, promo_code: '', discount_amount: '0', promo_label: '' }));
      }
    } catch {
      setPromoMsg('Could not validate code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoInput('');
    setPromoMsg('');
    setPromoValid(false);
    setForm(p => ({ ...p, promo_code: '', discount_amount: '0', promo_label: '' }));
  };

  return (
    <div>
      <div style={c.sectionTitle}>Payment & Extras</div>

      <div style={c.radioGroup}>
        <div style={c.radioLabel}>Payment Method</div>
        {[['cash', '💵 Cash on Delivery'], ['card', '💳 Pay by Card'], ['online', '🔗 Online Transfer']].map(([val, lab]) => (
          <label key={val} style={c.radioRow}>
            <input type="radio" name="payment_method" value={val} checked={form.payment_method === val} onChange={set('payment_method')} />
            <span style={c.radioText}>{lab}</span>
          </label>
        ))}
      </div>

      {/* Promo code */}
      <div style={{ marginBottom: 20 }}>
        <label style={c.fieldLabel}>Promo Code</label>
        {promoValid ? (
          <div style={c.promoApplied}>
            <span>🎉 {promoMsg}</span>
            <button style={c.promoRemove} onClick={removePromo}>Remove</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...c.input, flex: 1 }} value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="Enter promo code" />
            <button style={c.applyBtn} onClick={applyPromo} disabled={promoLoading}>
              {promoLoading ? '…' : 'Apply'}
            </button>
          </div>
        )}
        {promoMsg && !promoValid && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>{promoMsg}</div>}
      </div>

      {/* Gift wrap */}
      <div style={c.checkRow}>
        <input type="checkbox" id="giftwrap" checked={form.gift_wrap} onChange={setCheck('gift_wrap')} />
        <label htmlFor="giftwrap" style={c.checkLabel}>🎁 Gift Wrapping (+LKR {GIFT_FEE})</label>
      </div>
      {form.gift_wrap && (
        <div style={{ marginTop: 10, marginBottom: 16 }}>
          <label style={c.fieldLabel}>Gift Message (optional)</label>
          <textarea style={{ ...c.input, height: 80, resize: 'vertical' }}
            value={form.gift_message} onChange={set('gift_message')}
            placeholder="Write a message for the recipient…" />
        </div>
      )}

      {/* Order notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={c.fieldLabel}>Order Notes (optional)</label>
        <textarea style={{ ...c.input, height: 70, resize: 'vertical' }}
          value={form.notes} onChange={set('notes')} placeholder="Any special instructions…" />
      </div>

      <div style={c.btnRow}>
        <button style={c.outlineBtn} onClick={goBack}>← Back</button>
        <button style={c.primaryBtn} onClick={goNext}>Review Order →</button>
      </div>
    </div>
  );
}

// Step 4 — Order Summary + Confirm
function Step4Confirm({ form, items, salonId, clearCart, setStep }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const deliveryFee = form.delivery_type === 'delivery' ? DELIVERY_FEE : 0;
  const giftFee     = form.gift_wrap ? GIFT_FEE : 0;
  const subtotal    = items.reduce((s, i) => s + Number(i.selling_price) * i.quantity, 0);
  const tax         = subtotal * TAX_RATE;
  const discount    = Number(form.discount_amount || 0);
  const total       = subtotal + tax + deliveryFee + giftFee - discount;

  const placeOrder = async () => {
    setPlacing(true); setError('');
    const payload = {
      client_name: form.client_name,
      client_email: form.client_email,
      client_phone: form.client_phone,
      delivery_type: form.delivery_type,
      delivery_address: form.delivery_address || '',
      delivery_city: form.delivery_city || '',
      delivery_postal: form.delivery_postal || '',
      payment_method: form.payment_method,
      gift_wrap: form.gift_wrap,
      gift_message: form.gift_message || '',
      promo_code: form.promo_code || '',
      notes: form.notes || '',
      items: items.map(i => ({
        product: i.productId,
        product_name: i.name,
        product_sku: i.sku || '',
        quantity: i.quantity,
        unit_price: i.selling_price,
        variant_note: i.variantNote || '',
      })),
    };
    try {
      const r = await api.post(`/salons/${salonId}/orders/`, payload);
      setOrderId(r.data.id);
      clearCart();
      setSuccess(true);
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (success) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Order Placed!</div>
      <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 8 }}>Order #{orderId} has been confirmed.</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>We'll contact you at <strong>{form.client_email}</strong> with updates.</div>
      <button style={c.primaryBtn} onClick={() => navigate('/salons')}>Continue Shopping</button>
    </div>
  );

  const Line = ({ label, val, color, bold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: color || 'var(--text)', fontWeight: bold ? 700 : 400 }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 13 }}>{val}</span>
    </div>
  );

  return (
    <div>
      <div style={c.sectionTitle}>Order Summary</div>

      {/* Items */}
      <div style={c.summaryCard}>
        <div style={c.summaryLabel}>Items ({items.reduce((s, i) => s + i.quantity, 0)})</div>
        {items.map(item => (
          <div key={item._key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.name} × {item.quantity}{item.variantNote ? ` (${item.variantNote})` : ''}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>LKR {(Number(item.selling_price) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Delivery */}
      <div style={c.summaryCard}>
        <div style={c.summaryLabel}>Delivery</div>
        <Line label="Method" val={form.delivery_type === 'pickup' ? 'Pickup from Salon' : 'Home Delivery'} />
        {form.delivery_type === 'delivery' && (
          <Line label="Address" val={`${form.delivery_address}, ${form.delivery_city}`} />
        )}
        <Line label="Contact" val={`${form.client_name} · ${form.client_phone}`} />
        <Line label="Email" val={form.client_email} />
      </div>

      {/* Pricing breakdown */}
      <div style={c.summaryCard}>
        <div style={c.summaryLabel}>Price Breakdown</div>
        <Line label="Subtotal" val={`LKR ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        <Line label={`Tax (${(TAX_RATE * 100).toFixed(0)}% VAT)`} val={`LKR ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        {deliveryFee > 0 && <Line label="Delivery Fee" val={`LKR ${deliveryFee.toLocaleString()}`} />}
        {giftFee > 0 && <Line label="Gift Wrapping" val={`LKR ${giftFee.toLocaleString()}`} />}
        {discount > 0 && <Line label={`Promo (${form.promo_label})`} val={`− LKR ${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#059669" />}
        <div style={{ borderTop: '1.5px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
          <Line label="Total" val={`LKR ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} bold />
        </div>
      </div>

      {/* Payment */}
      <div style={c.summaryCard}>
        <div style={c.summaryLabel}>Payment</div>
        <Line label="Method" val={{ cash: 'Cash on Delivery', card: 'Pay by Card', online: 'Online Transfer' }[form.payment_method]} />
        {form.gift_wrap && <Line label="Gift Message" val={form.gift_message || '(none)'} />}
      </div>

      {error && <div style={c.errorBox}>{error}</div>}

      <div style={c.btnRow}>
        <button style={c.outlineBtn} onClick={() => setStep(2)}>← Back</button>
        <button style={{ ...c.primaryBtn, opacity: placing ? 0.7 : 1 }} onClick={placeOrder} disabled={placing}>
          {placing ? 'Placing Order…' : '✓ Place Order'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={c.fieldLabel}>{label}</label>
      <input style={c.input} type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

export default function Checkout() {
  const { items, removeItem, updateQty, updateVariant, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const salonId = items[0]?.salonId || null;

  const [form, setForm] = useState({
    client_name: user?.full_name || '',
    client_email: user?.email || '',
    client_phone: '',
    delivery_type: 'pickup',
    delivery_address: '',
    delivery_city: '',
    delivery_postal: '',
    payment_method: 'cash',
    gift_wrap: false,
    gift_message: '',
    promo_code: '',
    discount_amount: '0',
    promo_label: '',
    notes: '',
  });

  const goNext = () => setStep(s => Math.min(s + 1, 3));
  const goBack = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div style={c.page}>
      <div style={c.inner}>
        <div style={c.pageHeader}>
          <h1 style={c.pageTitle}>Checkout</h1>
          {items.length > 0 && salonId && (
            <div style={c.salonNote}>
              Ordering from <strong>{items[0].salonName}</strong>
            </div>
          )}
        </div>

        <StepBar step={step} />

        <div style={c.card}>
          {step === 0 && (
            <Step1CartReview
              items={items}
              removeItem={removeItem}
              updateQty={updateQty}
              updateVariant={updateVariant}
              subtotal={subtotal}
              goNext={goNext}
              goBack={goBack}
            />
          )}
          {step === 1 && (
            <Step2Delivery form={form} setForm={setForm} goNext={goNext} goBack={goBack} />
          )}
          {step === 2 && (
            <Step3Payment
              form={form}
              setForm={setForm}
              salonId={salonId}
              subtotal={subtotal}
              goNext={goNext}
              goBack={goBack}
            />
          )}
          {step === 3 && (
            <Step4Confirm
              form={form}
              items={items}
              salonId={salonId}
              clearCart={clearCart}
              setStep={setStep}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const c = {
  page: { background: 'var(--bg)', minHeight: '100vh', paddingBottom: 64 },
  inner: { maxWidth: 680, margin: '0 auto', padding: '32px 20px' },
  pageHeader: { marginBottom: 28 },
  pageTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 34, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' },
  salonNote: { fontSize: 13, color: 'var(--text-muted)' },

  card: { background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '28px 32px' },
  sectionTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 20 },

  cartItem: { display: 'flex', gap: 16, padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', alignItems: 'flex-start' },
  itemImg: { width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 },
  itemImgPlaceholder: { width: 72, height: 72, borderRadius: 10, background: 'rgba(124,58,237,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  itemName: { fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 },
  itemMeta: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 },
  itemPrice: { fontWeight: 800, fontSize: 15, color: '#7C3AED' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--surface)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--text)' },
  qty: { fontSize: 14, fontWeight: 700, minWidth: 22, textAlign: 'center', color: 'var(--text)' },
  removeBtn: { background: 'none', border: 'none', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 },
  subtotalRow: { display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1.5px solid var(--border)', fontSize: 14, color: 'var(--text)', marginBottom: 20 },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldLabel: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  smallLabel: { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', background: 'var(--surface)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  variantInput: { width: '100%', padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)', background: 'var(--surface)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },

  radioGroup: { marginBottom: 20 },
  radioLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 },
  radioRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' },
  radioText: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },

  checkRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' },
  checkLabel: { fontSize: 14, color: 'var(--text)', fontWeight: 500, cursor: 'pointer' },

  promoApplied: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(5,150,105,.1)', border: '1.5px solid #059669', borderRadius: 10, fontSize: 13, color: '#059669', fontWeight: 700 },
  promoRemove: { background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  applyBtn: { padding: '10px 18px', background: 'linear-gradient(135deg, #7C3AED, #9B59E8)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" },

  summaryCard: { background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', marginBottom: 14 },
  summaryLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },

  errorBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 16 },

  btnRow: { display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  primaryBtn: { padding: '13px 28px', background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  outlineBtn: { padding: '13px 22px', border: '1.5px solid var(--border)', borderRadius: 12, background: 'none', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};
