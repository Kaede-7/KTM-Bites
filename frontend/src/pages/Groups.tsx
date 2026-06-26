import { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingAnimation from '../components/LoadingAnimation';
import { useToast } from '../components/Toast';
import { getMenuItems, type MenuItemData } from '../api/menu';
import { getProfile } from '../api/auth';
import {
  addGroupItem,
  checkoutGroup,
  confirmGroupPayment,
  createGroup,
  getGroup,
  initiateGroupPayment,
  joinGroup,
  listGroups,
  removeGroupItem,
  updateGroupItem,
  type GroupOrderData,
} from '../api/groups';
import '../css/groups.css';
import '../css/kharcha.css';

const Groups = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<GroupOrderData[]>([]);
  const [group, setGroup] = useState<GroupOrderData | null>(null);
  const [menu, setMenu] = useState<MenuItemData[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentFor, setPaymentFor] = useState('');
  const [paymentIsTreat, setPaymentIsTreat] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [missingLinkMembers, setMissingLinkMembers] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', address: '', city: 'Kathmandu',
    landmark: '', notes: '', split_mode: 'single',
    single_payment_mode: 'treat',
  });

  const refresh = async () => {
    if (!code) {
      setGroups(await listGroups());
      return;
    }
    try {
      setGroup(await getGroup(code));
    } catch (err: unknown) {
      const apiError = err as AxiosError<{ error?: string }>;
      if (apiError.response?.status === 403) setGroup(await joinGroup(code));
      else throw err;
    }
  };

  useEffect(() => {
    // Initial route hydration intentionally loads remote state into this page.
    Promise.all([
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh(),
      getMenuItems().then(setMenu),
      getProfile().then((profile) => {
        setCurrentUserId(profile.id);
        setForm((old) => ({
          ...old,
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || 'Kathmandu',
        }));
      }).catch(() => undefined),
    ]).catch((err: unknown) => {
      const apiError = err as AxiosError<{ error?: string }>;
      showToast(apiError.response?.data?.error || 'Could not load group ordering.', 'error');
    })
      .finally(() => setLoading(false));
    // refresh is route-scoped; re-run only when the invite code changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await createGroup(name.trim());
      navigate(`/groups/${created.invite_code}`);
    } finally {
      setBusy(false);
    }
  };

  const addItem = async (item: MenuItemData) => {
    if (!group) return;
    try {
      setGroup(await addGroupItem(group.invite_code, item.id));
      showToast(`${item.name} added to your group order.`);
    } catch (err: unknown) {
      const data = (err as AxiosError<{ code?: string; message?: string; error?: string }>).response?.data;
      if (data?.code === 'calorie_limit_exceeded' && window.confirm(`${data.message} Add it anyway?`)) {
        setGroup(await addGroupItem(group.invite_code, item.id, true));
      } else {
        showToast(data?.error || 'Could not add item.', 'error');
      }
    }
  };

  const changeQty = async (id: number, quantity: number) => {
    if (!group) return;
    if (quantity < 1) {
      setGroup(await removeGroupItem(group.invite_code, id));
      return;
    }
    try {
      setGroup(await updateGroupItem(group.invite_code, id, quantity));
    } catch (err: unknown) {
      const data = (err as AxiosError<{ code?: string; message?: string; error?: string }>).response?.data;
      if (data?.code === 'calorie_limit_exceeded' && window.confirm(`${data.message} Continue?`)) {
        setGroup(await updateGroupItem(group.invite_code, id, quantity, true));
      } else showToast(data?.error || 'Could not update item.', 'error');
    }
  };

  const startCheckout = async () => {
    if (!group) return;
    setBusy(true);
    try {
      const updated = await checkoutGroup(group.invite_code, form);
      setGroup(updated);
      if (updated.single_payment_mode === 'settle_later' && updated.kharcha_missing_members.length) {
        setMissingLinkMembers(updated.kharcha_missing_members);
      }
      showToast('Cart locked. Kharcha payments are ready.');
    } catch (err: unknown) {
      const data = (err as AxiosError<{ error?: string }>).response?.data;
      showToast(data?.error || 'Could not start checkout.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (targetUserId: number) => {
    if (!group) return;
    setBusy(true);
    try {
      const result = await initiateGroupPayment(group.invite_code, targetUserId);
      setPaymentId(result.payment_id);
      setPaymentAmount(result.amount);
      setPaymentFor(result.for_user || '');
      setPaymentIsTreat(Boolean(result.is_treat));
      setMaskedEmail(result.masked_email || 'your Kharcha email');
    } catch (err: unknown) {
      const data = (err as AxiosError<{ error?: string; link_required?: boolean }>).response?.data;
      showToast(data?.link_required ? 'Link Kharcha from your profile first.' : data?.error || 'Payment could not start.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!group) return;
    setBusy(true);
    try {
      const updated = await confirmGroupPayment(group.invite_code, paymentId, otp);
      setGroup(updated);
      setPaymentId('');
      setOtp('');
      if (updated.status === 'completed' && updated.single_payment_mode === 'settle_later') {
        if (updated.kharcha_sync_status === 'created') {
          showToast('Order placed and the matching Kharcha Group was created.');
        } else {
          showToast('Order placed, but the Kharcha Group could not be created.', 'error');
        }
      } else {
        showToast(updated.status === 'completed' ? 'Everyone has paid. Order placed!' : 'Payment completed.');
      }
    } catch (err: unknown) {
      const data = (err as AxiosError<{ error?: string }>).response?.data;
      showToast(data?.error || 'OTP verification failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <><Navbar /><LoadingAnimation message="Gathering the group..." /></>;

  if (!code) {
    return <div className="groups-page"><Navbar /><main className="groups-shell">
      <section className="groups-hero">
        <div><span className="groups-kicker">Eat together</span><h1>Group ordering, without the group-chat chaos.</h1>
          <p>Create a room, share the link, and let everyone build one cart.</p></div>
        <div className="groups-create"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friday lunch crew" />
          <button onClick={create} disabled={busy || !name.trim()}>Create group</button></div>
      </section>
      <section className="groups-list"><h2>Your groups</h2>
        {groups.length === 0 ? <p className="groups-empty">No group orders yet. Start the first one above.</p> :
          groups.map((g) => <Link key={g.id} to={`/groups/${g.invite_code}`} className="group-card">
            <div><strong>{g.name}</strong><span>{g.members.length} people · {g.items.length} choices</span></div>
            <span className={`group-status ${g.status}`}>{g.status}</span>
          </Link>)}
      </section>
    </main><Footer /></div>;
  }

  if (!group) return null;
  const inviteUrl = `${window.location.origin}/groups/${group.invite_code}`;
  const percent = Math.min(group.calorie_percentage, 100);
  const currentMember = group.members.find((member) => member.user === currentUserId);

  return <div className="groups-page"><Navbar />
    <main className="groups-shell">
      <header className="group-room-head">
        <div><Link to="/groups" className="groups-back">← All groups</Link><span className="groups-kicker">Hosted by {group.host_name}</span>
          <h1>{group.name}</h1><p>{group.members.length} people are building this order.</p></div>
        <button className="share-group" onClick={() => navigator.clipboard.writeText(inviteUrl).then(() => showToast('Invite link copied.'))}>
          <span className="material-symbols-rounded">link</span> Copy invite link
        </button>
      </header>

      <section className="group-health">
        <div className="group-avatars">{group.members.map((m) => <span key={m.id} title={m.name}>{m.name[0].toUpperCase()}</span>)}</div>
        <div className="group-calories"><div><strong>{group.total_calories.toLocaleString()} / {group.calorie_target.toLocaleString()} kcal</strong>
          <span>Shared target grows as friends join</span></div><div className="group-calorie-track"><i style={{ width: `${percent}%` }} /></div></div>
      </section>

      {group.status === 'open' ? <>
        <div className="group-layout">
          <section><div className="group-section-title"><div><span className="groups-kicker">Your picks</span><h2>Build the shared cart</h2></div></div>
            <div className="group-menu-grid">{menu.map((item) => <article key={item.id} className="group-menu-card">
              <img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.calories} kcal · Rs. {item.price}</span></div>
              <button onClick={() => addItem(item)} aria-label={`Add ${item.name}`}><span className="material-symbols-rounded">add</span></button>
            </article>)}</div>
          </section>
          <aside className="group-cart"><h2>Everyone’s cart</h2>
            {group.items.length === 0 ? <p className="groups-empty">Nothing here yet. Be the brave first orderer.</p> :
              group.items.map((item) => <div className="group-cart-item" key={item.id}>
                <img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{item.owner_name} · Rs. {item.subtotal}</span></div>
                {item.added_by === currentUserId && <div className="group-qty">
                  <button onClick={() => changeQty(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span>
                  <button onClick={() => changeQty(item.id, item.quantity + 1)}>+</button></div>}
              </div>)}
            <div className="group-total"><span>Total with delivery</span><strong>Rs. {group.total}</strong></div>
          </aside>
        </div>
        {group.is_host && <section className="group-checkout-panel"><div><span className="groups-kicker">Host controls</span><h2>Ready to collect payment?</h2>
          <p>Locking stops cart edits and creates each person’s Kharcha share.</p></div>
          <div className="group-checkout-form">
            <div className="split-options">
              {[['single', 'One person', 'Host pays the full total'], ['equal', 'Split evenly', 'Same share for everyone'], ['items', 'Pay for picks', 'Items + an equal delivery share']].map(([key, title, desc]) =>
                <label className={form.split_mode === key ? 'selected' : ''} key={key}><input type="radio" name="split" checked={form.split_mode === key}
                  onChange={() => setForm({ ...form, split_mode: key })} /><strong>{title}</strong><span>{desc}</span></label>)}
            </div>
            {form.split_mode === 'single' && <div className="single-payment-options">
              <label className={form.single_payment_mode === 'treat' ? 'selected' : ''}>
                <input type="radio" name="single-payment-mode" checked={form.single_payment_mode === 'treat'}
                  onChange={() => setForm({ ...form, single_payment_mode: 'treat' })} />
                <span className="material-symbols-rounded">volunteer_activism</span>
                <div><strong>Treat everyone</strong><small>One person pays the full order. Nothing is owed later.</small></div>
              </label>
              <label className={form.single_payment_mode === 'settle_later' ? 'selected' : ''}>
                <input type="radio" name="single-payment-mode" checked={form.single_payment_mode === 'settle_later'}
                  onChange={() => setForm({ ...form, single_payment_mode: 'settle_later' })} />
                <span className="material-symbols-rounded">account_balance_wallet</span>
                <div><strong>Pay now, settle in Kharcha</strong><small>Pay the restaurant now, then create an equal Kharcha bill for the group.</small></div>
              </label>
            </div>}
            <div className="delivery-fields">
              {(['full_name', 'phone', 'address', 'city', 'landmark'] as const).map((field) =>
                <input key={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={field.replace('_', ' ')} />)}
            </div>
            <button className="group-primary" onClick={startCheckout} disabled={busy}>Lock cart & request payments</button>
          </div>
        </section>}
      </> : <section className="group-payment-board">
        <div className="group-payment-summary"><span className="groups-kicker">Kharcha payment</span><h2>
          {group.status === 'completed' ? 'Paid and sent to the kitchen' : 'Waiting for the group'}
        </h2><p>{group.split_mode === 'single'
          ? group.single_payment_mode === 'settle_later'
            ? 'One payment places the order, then Kharcha settles the equal shares.'
            : 'One person is treating the group.'
          : group.split_mode === 'equal' ? 'The total is split evenly.' : 'Everyone pays for their own picks.'}</p>
          {group.kharcha_sync_status === 'created' && <div className="kharcha-sync-note success">
            <span className="material-symbols-rounded">check_circle</span> Matching Kharcha Group created.
          </div>}
          {group.kharcha_sync_status === 'failed' && <div className="kharcha-sync-note failed">
            <span className="material-symbols-rounded">error</span> The order is placed, but Kharcha Group creation failed.
          </div>}
          <div className="group-grand-total"><span>Order total</span><strong>Rs. {group.total}</strong></div>
          {group.order && group.status === 'completed' && <Link className="group-primary link" to={`/order-tracking/${group.order}`}>Track order</Link>}
        </div>
        <div className="payment-shares">{group.payment_shares.map((share) => <div className="payment-share" key={share.id}>
          <span className={`share-check ${share.status}`}>{share.status === 'paid' ? '✓' : share.name[0].toUpperCase()}</span>
          <div><strong>{share.name}{share.is_current_user ? ' (you)' : ''}</strong><span>{
            share.status === 'paid'
              ? share.paid_by && share.paid_by !== share.user
                ? `Treated by ${share.paid_by_name}`
                : 'Paid with Kharcha'
              : share.status === 'initiated' && share.payment_payer_name
                ? `${share.payment_payer_name} is paying`
                : 'Payment pending'
          }</span></div>
          <b>Rs. {share.amount}</b>
          {(share.status === 'pending' || (share.status === 'initiated' && share.payment_payer === currentUserId)) &&
            currentMember?.kharcha_linked && <button onClick={() => pay(share.user)} disabled={busy}>
            {share.status === 'initiated'
              ? 'Send a new OTP'
              : share.is_current_user ? 'Pay my share' : `Treat ${share.name}`}
          </button>}
        </div>)}</div>
      </section>}
    </main><Footer />

    {paymentId && <div className="kharcha-modal-overlay"><div className="kharcha-modal">
      <div className="kharcha-modal-header"><div className="kharcha-modal-icon"><span className="material-symbols-rounded">group</span></div>
        <h3>{paymentIsTreat ? `Treat ${paymentFor}` : 'Pay your group share'}</h3>
        <p>OTP sent to <strong>{maskedEmail}</strong></p></div>
      <div className="kharcha-modal-amount"><span>Payment for {paymentFor || 'group order'}</span><strong>Rs. {paymentAmount}</strong></div>
      <div className="kharcha-otp-field"><input className="kharcha-otp-input" value={otp} maxLength={6} inputMode="numeric"
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit OTP" /></div>
      <div className="kharcha-modal-actions"><button className="kharcha-modal-cancel" onClick={() => setPaymentId('')}>Cancel</button>
        <button className="kharcha-modal-confirm" onClick={confirm} disabled={otp.length !== 6 || busy}>Confirm payment</button></div>
    </div></div>}

    {missingLinkMembers.length > 0 && <div className="group-notice-overlay"><div className="group-notice-modal">
      <div className="group-notice-icon"><span className="material-symbols-rounded">person_alert</span></div>
      <h3>Some friends cannot be added to Kharcha yet</h3>
      <p>The order can continue, but these members will be left out of the automatic Kharcha Group because their accounts are not linked:</p>
      <div className="missing-member-list">{missingLinkMembers.map((member) => <span key={member}>{member}</span>)}</div>
      <p className="group-notice-hint">They can link Kharcha from their KTM-Bites profile for future group orders.</p>
      <button className="group-primary" onClick={() => setMissingLinkMembers([])}>Got it, continue</button>
    </div></div>}
  </div>;
};

export default Groups;
