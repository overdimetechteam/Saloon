import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import { useOwner } from '../../context/OwnerContext';

const CATS = ['Hair Care', 'Skin Care', 'Nail Care', 'Other'];
const CAT_COLORS = { 'Hair Care': '#8B5CF6', 'Skin Care': '#10B981', 'Nail Care': '#0D9488', 'Other': '#6B7280' };

const STATUS_META = {
  active:        { label: 'Active',        color: '#059669', bg: 'rgba(5,150,105,.12)'  },
  low_stock:     { label: 'Low Stock',      color: '#D97706', bg: 'rgba(217,119,6,.12)'  },
  out_of_stock:  { label: 'Out of Stock',   color: '#DC2626', bg: 'rgba(220,38,38,.12)'  },
  expiring_soon: { label: 'Expiring Soon',  color: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
};

const EMPTY_FORM = {
  name: '', brand: '', sku: '', category: 'Hair Care', subcategory: '', shade_variant: '',
  size: '', unit_of_measure: '', cost_price: '', selling_price: '', reorder_level: 0,
  supplier: '', manufacturing_date: '', expiry_date: '', pao: '', barcode: '',
  country_of_origin: '', certifications: '', skin_type: '', notes: '',
};

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{ ...s.summCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function MField({ label, required, type = 'text', placeholder = '', value, onChange, children }) {
  return (
    <div style={s.mField}>
      <label style={s.mLabel}>{label}{required && ' *'}</label>
      {children || (
        <input style={s.mInput} type={type} placeholder={placeholder} value={value || ''} onChange={onChange} required={required} />
      )}
    </div>
  );
}

function InlinePhotoUpload({ productId, salonId }) {
  const [images, setImages]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  useEffect(() => {
    api.get(`/salons/${salonId}/products/${productId}/images/`)
      .then(r => setImages(r.data))
      .catch(() => {});
  }, [productId]);

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadErr('');
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await api.post(`/salons/${salonId}/products/${productId}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages(prev => [...prev, r.data]);
    } catch {
      setUploadErr('Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imgId) => {
    await api.delete(`/salons/${salonId}/products/${productId}/images/${imgId}/`).catch(() => {});
    setImages(prev => prev.filter(i => i.id !== imgId));
  };

  return (
    <div>
      <div style={s.mSection}>Product Photos</div>
      {uploadErr && <div style={{ ...s.alert, marginBottom: 12 }}>{uploadErr}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10, marginBottom: 8 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1/1' }}>
            <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(220,38,38,.85)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDelete(img.id)}
            >✕</button>
          </div>
        ))}
        <label style={{ borderRadius: 10, border: '2px dashed var(--border)', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'default' : 'pointer', gap: 4, color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
          {uploading ? '⏳' : <><span style={{ fontSize: 18 }}>📷</span><span>Add Photo</span></>}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>First photo shown as thumbnail on cosmetics page.</div>
    </div>
  );
}

function ProductModal({ product, onClose, onSaved, salonId }) {
  const editing = !!product;
  const [form, setForm]       = useState(editing ? { ...product } : { ...EMPTY_FORM });
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [savedId, setSavedId] = useState(editing ? product.id : null);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.manufacturing_date) delete payload.manufacturing_date;
      if (!payload.expiry_date) delete payload.expiry_date;
      if (editing) {
        await api.put(`/salons/${salonId}/products/${product.id}/`, payload);
        onSaved();
      } else {
        const r = await api.post(`/salons/${salonId}/products/`, payload);
        setSavedId(r.data.id);
      }
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.mHeader}>
          <div>
            <div style={s.mEyebrow}>Inventory</div>
            <div style={s.mTitle}>
              {savedId && !editing ? '✓ Product Added — Add Photos' : editing ? 'Edit Product' : 'Add New Product'}
            </div>
          </div>
          <button style={s.mClose} onClick={onClose}>✕</button>
        </div>

        {error && <div style={s.alert}>{error}</div>}

        {savedId && !editing ? (
          <div style={s.mForm}>
            <div style={{ padding: '0 0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
              Product saved successfully. Upload photos now or skip — you can always add them later via the 📷 button in the table.
            </div>
            <InlinePhotoUpload productId={savedId} salonId={salonId} />
            <div style={s.mFooter}>
              <button type="button" style={s.mSave} onClick={onSaved}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={save} style={s.mForm}>
            <div style={s.mSection}>Core Details</div>
            <div style={s.mGrid3}>
              <MField label="Product Name" required placeholder="e.g. Rose Hip Oil" value={form.name} onChange={f('name')} />
              <MField label="Brand" placeholder="e.g. The Ordinary" value={form.brand} onChange={f('brand')} />
              <MField label="SKU" placeholder="e.g. TH-RHO-001" value={form.sku} onChange={f('sku')} />
            </div>
            <div style={s.mGrid3}>
              <MField label="Category" required>
                <select style={s.mInput} value={form.category} onChange={f('category')}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </MField>
              <MField label="Subcategory" placeholder="e.g. Serums" value={form.subcategory} onChange={f('subcategory')} />
              <MField label="Shade / Variant" placeholder="e.g. Light Beige" value={form.shade_variant} onChange={f('shade_variant')} />
            </div>
            <div style={s.mGrid3}>
              <MField label="Size" placeholder="e.g. 30ml" value={form.size} onChange={f('size')} />
              <MField label="Unit of Measure" required placeholder="ml, pcs, kg…" value={form.unit_of_measure} onChange={f('unit_of_measure')} />
              <MField label="Skin Type" placeholder="e.g. Oily, Dry, All" value={form.skin_type} onChange={f('skin_type')} />
            </div>

            <div style={s.mSection}>Pricing & Stock</div>
            <div style={s.mGrid3}>
              <MField label="Cost Price (LKR)" type="number" required value={form.cost_price} onChange={f('cost_price')} />
              <MField label="Selling Price (LKR)" type="number" required value={form.selling_price} onChange={f('selling_price')} />
              <MField label="Reorder Level" type="number" value={form.reorder_level} onChange={f('reorder_level')} />
            </div>

            <div style={s.mSection}>Supplier & Dates</div>
            <div style={s.mGrid3}>
              <MField label="Supplier" placeholder="e.g. Beauty Depot" value={form.supplier} onChange={f('supplier')} />
              <MField label="Manufacturing Date" type="date" value={form.manufacturing_date} onChange={f('manufacturing_date')} />
              <MField label="Expiry Date" type="date" value={form.expiry_date} onChange={f('expiry_date')} />
            </div>
            <div style={s.mGrid3}>
              <MField label="PAO (Period After Opening)" placeholder="e.g. 12M" value={form.pao} onChange={f('pao')} />
              <MField label="Barcode" placeholder="e.g. 4902430123456" value={form.barcode} onChange={f('barcode')} />
              <MField label="Country of Origin" placeholder="e.g. South Korea" value={form.country_of_origin} onChange={f('country_of_origin')} />
            </div>

            <div style={s.mSection}>Additional Info</div>
            <div style={s.mGrid2}>
              <MField label="Certifications" placeholder="e.g. Cruelty-free, COSMOS Organic" value={form.certifications} onChange={f('certifications')} />
              <MField label="Notes" placeholder="Any additional notes…" value={form.notes} onChange={f('notes')} />
            </div>

            {editing && <InlinePhotoUpload productId={product.id} salonId={salonId} />}

            <div style={s.mFooter}>
              <button type="button" style={s.mCancel} onClick={onClose}>Cancel</button>
              <button type="submit" style={s.mSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? '✓ Update Product' : '→ Save & Add Photos'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

function ProductImagesModal({ product, onClose, salonId }) {
  const [images, setImages]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    api.get(`/salons/${salonId}/products/${product.id}/images/`)
      .then(r => setImages(r.data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [product.id]);

  const handleUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post(`/salons/${salonId}/products/${product.id}/images/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      load();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imgId) => {
    await api.delete(`/salons/${salonId}/products/${product.id}/images/${imgId}/`).catch(() => {});
    setImages(prev => prev.filter(i => i.id !== imgId));
  };

  return createPortal(
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modal, maxWidth: 600 }}>
        <div style={s.mHeader}>
          <div>
            <div style={s.mEyebrow}>Product</div>
            <div style={s.mTitle}>Photos — {product.name}</div>
          </div>
          <button style={s.mClose} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 32px 32px' }}>
          {error && <div style={s.alert}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
            {images.map(img => (
              <div key={img.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1/1' }}>
                <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(220,38,38,.85)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleDelete(img.id)}
                >✕</button>
              </div>
            ))}
            <label style={{ borderRadius: 12, border: '2px dashed var(--border)', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
              {uploading ? 'Uploading…' : <>📷<span>Add Photo</span></>}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Images are shown to customers on the cosmetics page. First image appears as the product thumbnail.</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function OwnerInventory() {
  const { salon } = useOwner();
  const [products, setProducts]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stFilter, setStFilter]   = useState('');
  const [modal, setModal]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imagesProduct, setImagesProduct] = useState(null);

  const load = () => {
    if (!salon) return;
    api.get(`/salons/${salon.id}/products/`).then(r => setProducts(r.data)).catch(() => {});
    api.get(`/salons/${salon.id}/products/summary/`).then(r => setSummary(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [salon]);

  const handleSaved = () => { setModal(null); load(); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/salons/${salon.id}/products/${deleteTarget}/`).catch(() => {});
    setDeleteTarget(null);
    load();
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q)
      || (p.brand || '').toLowerCase().includes(q)
      || (p.sku || '').toLowerCase().includes(q);
    const matchCat = !catFilter || p.category === catFilter;
    const matchSt  = !stFilter || p.status === stFilter;
    return matchSearch && matchCat && matchSt;
  });

  return (
    <div>
      <div style={s.pageHeader} className="fade-up">
        <div>
          <div style={s.eyebrow}>Cosmetics</div>
          <h2 style={s.title}>Inventory</h2>
        </div>
        <div style={s.headerBtns}>
          <Link to="/owner/inventory/grn" style={s.outlineBtn}>+ Receive Stock</Link>
          <Link to="/owner/inventory/sales" style={s.outlineBtn}>Record Sale</Link>
          <button style={s.primaryBtn} onClick={() => setModal({ type: 'add' })}>+ New Product</button>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={s.summRow} className="fade-up">
          <SummaryCard label="Total SKUs"     value={summary.total_skus}  color="#7C3AED" icon="▦" />
          <SummaryCard label="Active"         value={summary.active}      color="#059669" icon="●" />
          <SummaryCard label="Low Stock"      value={summary.low_stock}   color="#D97706" icon="⚠" />
          <SummaryCard label="Out of Stock"   value={summary.out_of_stock}  color="#DC2626" icon="✕" />
          <SummaryCard label="Expiring Soon"  value={summary.expiring_soon} color="#8B5CF6" icon="⏳" />
          <div style={{ ...s.summCard, borderTop: '3px solid #0D9488', gridColumn: 'span 1' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>💰</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0D9488', lineHeight: 1 }}>
              LKR {Number(summary.total_value).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inventory Value</div>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={s.filterRow} className="fade-up">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            style={{ ...s.filterInput, paddingLeft: 36 }}
            placeholder="Search by name, brand, SKU…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select style={s.filterSelect} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={s.filterSelect} value={stFilter} onChange={e => setStFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
        </select>
      </div>

      {/* Product table */}
      <div style={s.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Product', 'Brand', 'Category', 'SKU', 'Qty', 'Price', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const catColor = CAT_COLORS[p.category] || '#7C3AED';
                const meta = STATUS_META[p.status] || STATUS_META.active;
                return (
                  <tr key={p.id} style={{ background: p.status === 'out_of_stock' ? 'rgba(220,38,38,.03)' : p.status === 'low_stock' ? 'rgba(217,119,6,.03)' : '' }}>
                    <td style={s.td}>
                      <div style={s.productName}>{p.name}</div>
                      {p.subcategory && <div style={s.productSub}>{p.subcategory}</div>}
                      {p.shade_variant && <div style={s.productSub}>🎨 {p.shade_variant}</div>}
                    </td>
                    <td style={s.td}><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.brand || '—'}</span></td>
                    <td style={s.td}>
                      <span style={{ ...s.catTag, color: catColor, background: catColor + '18', border: `1px solid ${catColor}30` }}>{p.category}</span>
                    </td>
                    <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.sku || '—'}</span></td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: meta.color }}>{p.current_stock}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> {p.unit_of_measure}</span>
                    </td>
                    <td style={s.td}><span style={{ fontWeight: 700, color: '#7C3AED' }}>LKR {Number(p.selling_price).toLocaleString()}</span></td>
                    <td style={s.td}><span style={{ fontSize: 12, color: p.status === 'expiring_soon' ? '#7C3AED' : 'var(--text-muted)' }}>{p.expiry_date || '—'}</span></td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, color: meta.color, background: meta.bg }}>
                        ● {meta.label}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      <button style={{ ...s.iconBtn, color: '#7C3AED' }} title="Photos" onClick={() => setImagesProduct(p)}>📷</button>
                      <button style={s.iconBtn} title="Edit" onClick={() => setModal({ type: 'edit', product: p })}>✎</button>
                      <button style={{ ...s.iconBtn, color: '#DC2626' }} title="Delete" onClick={() => setDeleteTarget(p.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={s.empty}>
            {products.length === 0
              ? 'No products yet. Click "+ New Product" to get started.'
              : 'No products match your search or filters.'}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <ProductModal
          product={modal.type === 'edit' ? modal.product : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          salonId={salon?.id}
        />
      )}

      {/* Product images modal */}
      {imagesProduct && (
        <ProductImagesModal
          product={imagesProduct}
          onClose={() => setImagesProduct(null)}
          salonId={salon?.id}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && createPortal(
        <div style={s.overlay} onClick={() => setDeleteTarget(null)}>
          <div style={{ ...s.modal, maxWidth: 400, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠</div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', textAlign: 'center', marginBottom: 8 }}>Delete Product?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>This product will be removed from your inventory. This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={s.mCancel} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button style={{ ...s.mSave, background: '#DC2626' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' },
  headerBtns: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  outlineBtn: { padding: '10px 18px', border: '1.5px solid var(--border)', borderRadius: 11, textDecoration: 'none', color: 'var(--text)', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" },
  primaryBtn: { padding: '10px 22px', background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 6px 18px rgba(124,58,237,.35)', fontFamily: "'DM Sans', sans-serif" },

  summRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 22 },
  summCard: { background: 'var(--surface)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,.05)' },

  filterRow: { display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' },
  filterInput: { width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  filterSelect: { padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none', minWidth: 150 },

  tableCard: { background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(124,58,237,.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface2)', borderBottom: '2px solid var(--border)' },
  td: { padding: '12px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  productName: { fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  productSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  catTag: { display: 'inline-flex', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, marginRight: 2, transition: 'color .15s' },
  empty: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.35)' },
  mHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 0', marginBottom: 20 },
  mEyebrow: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 },
  mTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 },
  mClose: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 8 },
  alert: { margin: '0 32px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13 },
  mForm: { padding: '0 32px 32px' },
  mSection: { fontSize: 10, fontWeight: 700, color: 'var(--brand-label)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, marginTop: 20, paddingBottom: 8, borderBottom: '1px solid var(--border)' },
  mGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 },
  mGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
  mField: { display: 'flex', flexDirection: 'column', gap: 5 },
  mLabel: { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  mInput: { padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', background: 'var(--input-bg)', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' },
  mFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 },
  mCancel: { padding: '10px 22px', border: '1.5px solid var(--border)', borderRadius: 11, background: 'none', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
  mSave: { padding: '10px 28px', background: 'linear-gradient(135deg, #7C3AED 0%, #9B59E8 50%, #0D9488 100%)', color: '#fff', border: 'none', borderRadius: 11, cursor: 'pointer', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(124,58,237,.35)', fontFamily: "'DM Sans', sans-serif" },
};
